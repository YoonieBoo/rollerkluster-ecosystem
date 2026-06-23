import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type PushSubscriptionRequest = {
  endpoint?: string;
  p256dh?: string;
  auth?: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: Request) {
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return NextResponse.json({ error: 'Supabase server configuration is missing.' }, { status: 500 });
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

  const body = await request.json() as PushSubscriptionRequest;
  if (!body.endpoint || !body.p256dh || !body.auth) {
    return NextResponse.json({ error: 'Push subscription endpoint and keys are required.' }, { status: 400 });
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);
  const { error } = await adminClient
    .from('push_subscriptions')
    .upsert(
      {
        creator_id: userData.user.id,
        endpoint: body.endpoint,
        p256dh: body.p256dh,
        auth: body.auth,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'endpoint' },
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
