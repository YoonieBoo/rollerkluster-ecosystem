'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase-client';
import { useUiStore } from '@/lib/ui-store';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();

type PushStatus = 'checking' | 'ready' | 'saving' | 'enabled' | 'blocked' | 'unsupported' | 'missing_config' | 'error';

export function PushSubscriptionManager() {
  const { activeRole, authHydrated, isAuthenticated, sessionUser } = useUiStore();
  const [status, setStatus] = useState<PushStatus>('checking');
  const [errorMessage, setErrorMessage] = useState('');
  const savedUserRef = useRef<string | null>(null);
  const isCreatorSession = authHydrated && isAuthenticated && activeRole === 'creator' && Boolean(sessionUser?.id);

  const saveExistingSubscription = useCallback(async () => {
    if (!isCreatorSession || !sessionUser?.id || !supabase || !vapidPublicKey) return;
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    if (savedUserRef.current === sessionUser.id) return;

    savedUserRef.current = sessionUser.id;
    try {
      await saveCreatorPushSubscription(sessionUser.id, vapidPublicKey);
      setStatus('enabled');
    } catch (error) {
      console.error('Failed to save push subscription', error);
      savedUserRef.current = null;
      setErrorMessage(error instanceof Error ? error.message : 'Could not save notification subscription.');
      setStatus('error');
    }
  }, [isCreatorSession, sessionUser?.id]);

  useEffect(() => {
    if (!isCreatorSession) {
      setStatus('checking');
      return;
    }
    if (!supabase || !vapidPublicKey) {
      setStatus('missing_config');
      return;
    }
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setStatus('unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      setStatus('blocked');
      return;
    }
    if (Notification.permission === 'granted') {
      setStatus('enabled');
      void saveExistingSubscription();
      return;
    }
    setStatus('ready');
  }, [isCreatorSession, saveExistingSubscription]);

  const enableNotifications = async () => {
    if (!isCreatorSession || !sessionUser?.id || !supabase || !vapidPublicKey) return;
    setErrorMessage('');
    setStatus('saving');

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'denied') {
        setStatus('blocked');
        return;
      }
      if (permission !== 'granted') {
        setStatus('ready');
        return;
      }

      await saveCreatorPushSubscription(sessionUser.id, vapidPublicKey);
      savedUserRef.current = sessionUser.id;
      setStatus('enabled');
    } catch (error) {
      console.error('Failed to enable push notifications', error);
      setErrorMessage(error instanceof Error ? error.message : 'Could not enable notifications.');
      setStatus('error');
    }
  };

  if (!isCreatorSession || status === 'checking' || status === 'enabled') return null;

  return (
    <div className="fixed bottom-4 right-4 z-[70] w-[min(360px,calc(100vw-2rem))] rounded-[12px] border border-border bg-white p-4 shadow-xl">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
          <Bell className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Campaign invite notifications</p>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            {status === 'blocked'
              ? 'Notifications are blocked for this site. Enable them in Chrome site settings, then reload.'
              : status === 'unsupported'
                ? 'This browser does not support web push notifications.'
                : status === 'missing_config'
                  ? 'The VAPID public key is missing in this deployment.'
                  : 'Allow notifications so you know when a brand invites you to a campaign.'}
          </p>
          {errorMessage && <p className="mt-2 text-xs font-semibold text-red-700">{errorMessage}</p>}
          {(status === 'ready' || status === 'error' || status === 'saving') && (
            <Button
              type="button"
              className="mt-3 h-9 bg-primary text-white"
              disabled={status === 'saving'}
              onClick={() => void enableNotifications()}
            >
              {status === 'saving' ? 'Enabling...' : 'Enable notifications'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

async function saveCreatorPushSubscription(currentUserId: string, publicKey: string) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const reg = await navigator.serviceWorker.register('/sw.js');
  const existingSub = await reg.pushManager.getSubscription();
  const sub = existingSub ?? await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToArrayBuffer(publicKey),
  });
  const json = sub.toJSON();
  if (!json.endpoint) throw new Error('Browser did not return a push endpoint.');

  const { error } = await supabase.from('push_subscriptions').upsert({
    creator_id: currentUserId,
    endpoint: json.endpoint,
    p256dh: json.keys?.p256dh,
    auth: json.keys?.auth,
  }, { onConflict: 'endpoint' });

  if (error) throw new Error(error.message);
}

function urlBase64ToArrayBuffer(value: string) {
  const normalizedValue = value.trim();
  const padding = '='.repeat((4 - normalizedValue.length % 4) % 4);
  const base64 = `${normalizedValue}${padding}`.replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  if (outputArray.length !== 65 || outputArray[0] !== 4) {
    throw new Error('The VAPID public key is invalid. Check NEXT_PUBLIC_VAPID_PUBLIC_KEY in Vercel and redeploy.');
  }

  return outputArray.buffer.slice(outputArray.byteOffset, outputArray.byteOffset + outputArray.byteLength);
}
