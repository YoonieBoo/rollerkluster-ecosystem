import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Engagement } from '@/lib/mock-data';

type StatusRequest = {
  engagementId?: string;
  status?: Engagement['status'];
};

const allowedStatuses: Engagement['status'][] = ['matched', 'in_discussion', 'accepted', 'active', 'completed', 'declined'];
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

  const body = await request.json() as StatusRequest;
  if (!body.engagementId || !body.status || !allowedStatuses.includes(body.status)) {
    return NextResponse.json({ error: 'Valid engagementId and status are required.' }, { status: 400 });
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);
  const { data: engagement, error: loadError } = await adminClient
    .from('engagements')
    .select('id, creator_id')
    .eq('id', body.engagementId)
    .maybeSingle();

  if (loadError) {
    return NextResponse.json({ error: loadError.message }, { status: 500 });
  }
  if (!engagement) {
    return NextResponse.json({ error: 'Engagement not found.' }, { status: 404 });
  }

  const metadataRole = typeof userData.user.user_metadata?.role === 'string' ? userData.user.user_metadata.role : '';
  const { data: platformUser } = await authClient
    .from('users')
    .select('role')
    .eq('id', userData.user.id)
    .maybeSingle();
  const storedRole = typeof platformUser?.role === 'string' ? platformUser.role : '';
  const role = metadataRole || storedRole;
  const canUpdate = engagement.creator_id === userData.user.id || role === 'brand' || role === 'admin';
  if (!canUpdate) {
    return NextResponse.json({ error: 'You cannot update this invitation.' }, { status: 403 });
  }

  const { error: updateError } = await adminClient
    .from('engagements')
    .update({ status: body.status })
    .eq('id', body.engagementId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
