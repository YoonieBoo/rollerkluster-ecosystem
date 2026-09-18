import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyLineSignature, replyLineMessage, hasLineWebhookConfig } from '@/lib/line';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

type LineEvent = {
  type: string;
  replyToken?: string;
  source?: { userId?: string };
  message?: { type: string; text?: string };
};

export async function POST(request: Request) {
  const rawBody = await request.text();

  // LINE requires this endpoint to exist and respond 200 the moment it's
  // registered in the console, even before the channel secret is filled
  // in here — so accept the request but do nothing until it's configured,
  // rather than failing webhook verification in the LINE console.
  if (!hasLineWebhookConfig() || !supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json({ ok: true, configured: false });
  }

  const signature = request.headers.get('x-line-signature');
  if (!verifyLineSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let events: LineEvent[] = [];
  try {
    events = (JSON.parse(rawBody).events ?? []) as LineEvent[];
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  await Promise.allSettled(
    events.map(async (event) => {
      if (event.type !== 'message' || event.message?.type !== 'text') return;
      const lineUserId = event.source?.userId;
      const code = event.message.text?.trim().toUpperCase();
      if (!lineUserId || !code) return;

      const { data: match } = await supabase
        .from('creator_profiles')
        .select('id, user_id')
        .eq('line_link_code', code)
        .maybeSingle();

      if (!match) {
        // Not a link code — could be any other message to the Official
        // Account. Say nothing rather than guess what they meant.
        return;
      }

      const { error } = await supabase
        .from('creator_profiles')
        .update({ line_user_id: lineUserId, line_link_code: null })
        .eq('id', match.id);

      if (error) {
        console.error('LINE link save failed:', error.message);
        return;
      }

      if (event.replyToken) {
        await replyLineMessage(
          event.replyToken,
          "You're connected! You'll get campaign invites here from now on."
        );
      }
    })
  );

  return NextResponse.json({ ok: true });
}
