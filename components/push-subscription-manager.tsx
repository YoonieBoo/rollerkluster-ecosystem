'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useUiStore } from '@/lib/ui-store';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export function PushSubscriptionManager() {
  const { activeRole, authHydrated, isAuthenticated, sessionUser } = useUiStore();
  const subscribedUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (!authHydrated || !isAuthenticated || activeRole !== 'creator' || !sessionUser?.id) return;
    if (!supabase || !vapidPublicKey) return;
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return;

    const currentUserId = sessionUser.id;
    const publicKey = vapidPublicKey;
    const supabaseClient = supabase;
    if (subscribedUserRef.current === currentUserId) return;
    subscribedUserRef.current = currentUserId;

    let cancelled = false;

    async function subscribeToPush() {
      const reg = await navigator.serviceWorker.register('/sw.js');
      const permission = await Notification.requestPermission();
      if (cancelled || permission !== 'granted') return;

      const existingSub = await reg.pushManager.getSubscription();
      const sub = existingSub ?? await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json = sub.toJSON();
      if (cancelled || !json.endpoint) return;

      const { error } = await supabaseClient
        .from('push_subscriptions')
        .upsert({
          creator_id: currentUserId,
          endpoint: json.endpoint,
          p256dh: json.keys?.p256dh,
          auth: json.keys?.auth,
        }, { onConflict: 'endpoint' });

      if (error) {
        console.error('Failed to save push subscription', error);
      }
    }

    subscribeToPush().catch((error) => {
      console.error('Failed to subscribe to push notifications', error);
      subscribedUserRef.current = null;
    });

    return () => {
      cancelled = true;
    };
  }, [activeRole, authHydrated, isAuthenticated, sessionUser?.id]);

  return null;
}

function urlBase64ToUint8Array(value: string) {
  const padding = '='.repeat((4 - value.length % 4) % 4);
  const base64 = `${value}${padding}`.replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}
