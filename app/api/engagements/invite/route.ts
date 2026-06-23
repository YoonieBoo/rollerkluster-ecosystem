import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

type InviteRequest = {
  campaignId?: string;
  creatorId?: string;
  matchScore?: number;
};

type PushSubscriptionRow = {
  endpoint: string;
  p256dh: string | null;
  auth: string | null;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT ?? 'mailto:notifications@rollerkluster.com';

export async function POST(request: Request) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 500 });
  }

  const authorization = request.headers.get('authorization');
  const accessToken = authorization?.replace(/^Bearer\s+/i, '');
  if (!accessToken) {
    return NextResponse.json({ error: 'Missing authentication token.' }, { status: 401 });
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
  const { data: userData, error: userError } = await authClient.auth.getUser(accessToken);
  if (userError || !userData.user) {
    return NextResponse.json({ error: 'Invalid authentication token.' }, { status: 401 });
  }

  const role = typeof userData.user.user_metadata?.role === 'string' ? userData.user.user_metadata.role : '';
  if (role !== 'brand' && role !== 'admin') {
    return NextResponse.json({ error: 'Only brand/admin users can send invitations.' }, { status: 403 });
  }

  const body = await request.json() as InviteRequest;
  const campaignId = body.campaignId?.trim();
  const creatorId = body.creatorId?.trim();
  const matchScore = Number.isFinite(body.matchScore) ? Math.round(body.matchScore ?? 82) : 82;
  if (!campaignId || !creatorId) {
    return NextResponse.json({ error: 'campaignId and creatorId are required.' }, { status: 400 });
  }

  const adminClient = supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : authClient;

  const { error: inviteError } = await adminClient
    .from('engagements')
    .upsert(
      {
        campaign_id: campaignId,
        creator_id: creatorId,
        match_score: matchScore,
        status: 'matched',
      },
      { onConflict: 'campaign_id,creator_id', ignoreDuplicates: true },
    );

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 500 });
  }

  if (!supabaseServiceRoleKey) {
    return NextResponse.json({
      ok: true,
      pushSent: false,
      reason: 'SUPABASE_SERVICE_ROLE_KEY is required to read push subscriptions.',
    });
  }

  if (!vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json({
      ok: true,
      pushSent: false,
      reason: 'VAPID keys are not configured.',
    });
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const { data: campaign } = await adminClient
    .from('campaigns')
    .select('name, client_name')
    .eq('id', campaignId)
    .maybeSingle();
  const campaignTitle = typeof campaign?.name === 'string' && campaign.name.trim() ? campaign.name : 'A campaign';
  const brandName = typeof campaign?.client_name === 'string' && campaign.client_name.trim() ? campaign.client_name : 'A brand';

  const { data: subscriptions, error: subscriptionsError } = await adminClient
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('creator_id', creatorId);

  if (subscriptionsError) {
    return NextResponse.json({ error: subscriptionsError.message }, { status: 500 });
  }

  const payload = JSON.stringify({
    title: 'New campaign invite',
    body: `${brandName} invited you to ${campaignTitle}.`,
    url: '/notifications',
  });
  const sendResults = await Promise.allSettled(
    ((subscriptions ?? []) as PushSubscriptionRow[])
      .filter(subscription => subscription.endpoint && subscription.p256dh && subscription.auth)
      .map(subscription => webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh as string,
            auth: subscription.auth as string,
          },
        },
        payload,
      )),
  );

  const pushSent = sendResults.some(result => result.status === 'fulfilled');
  return NextResponse.json({
    ok: true,
    pushSent,
    subscriptionCount: subscriptions?.length ?? 0,
  });
}
