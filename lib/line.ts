import crypto from 'crypto';

// Raw fetch calls against LINE's Messaging API rather than the @line/bot-sdk
// package — the API surface we need (verify signature, reply, push) is small
// enough that a dependency isn't worth it, and it matches how other
// integrations in this app (Supabase REST, etc.) are already called.

export function hasLineMessagingConfig() {
  return Boolean(process.env.LINE_CHANNEL_ACCESS_TOKEN);
}

export function hasLineWebhookConfig() {
  return Boolean(process.env.LINE_CHANNEL_SECRET);
}

// LINE signs each webhook request body with the channel secret so we can
// trust it actually came from LINE, not just anyone posting to this URL.
export function verifyLineSignature(rawBody: string, signatureHeader: string | null): boolean {
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  if (!channelSecret || !signatureHeader) return false;

  const expected = crypto.createHmac('sha256', channelSecret).update(rawBody).digest('base64');

  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signatureHeader);
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

export async function replyLineMessage(replyToken: string, text: string) {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!accessToken) return;

  const res = await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ replyToken, messages: [{ type: 'text', text }] }),
  });

  if (!res.ok) {
    console.warn('LINE reply failed:', res.status, await res.text().catch(() => ''));
  }
}

export async function pushLineMessage(lineUserId: string, text: string) {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!accessToken) return { skipped: true as const };

  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ to: lineUserId, messages: [{ type: 'text', text }] }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.warn('LINE push failed:', res.status, detail);
    return { skipped: false as const, error: `LINE push failed: ${res.status} ${detail}` };
  }
  return { skipped: false as const };
}

export function generateLineLinkCode() {
  // Short, easy to type back into LINE chat by hand.
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}
