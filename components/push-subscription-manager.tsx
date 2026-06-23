'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useUiStore } from '@/lib/ui-store';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export function PushSubscriptionManager() {
  const { activeRole, authHydrated, isAuthenticated, sessionUser } = useUiStore();
  const subscriptionKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!authHydrated || !isAuthenticated || activeRole !== 'creator' || !sessionUser?.id) return;
    if (!supabase || !vapidPublicKey) return;
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return;

    const userId = sessionUser.id;
    const publicKey = vapidPublicKey;
    const supabaseClient = supabase;
    const subscriptionKey = `${userId}:${publicKey}`;
    if (subscriptionKeyRef.current === subscriptionKey) return;
    subscriptionKeyRef.current = subscriptionKey;

    let cancelled = false;

    async function subscribeCreatorToPush() {
      const permission = Notification.permission === 'default'
        ? await Notification.requestPermission()
        : Notification.permission;

      if (cancelled || permission !== 'granted') return;

      const registration = await navigator.serviceWorker.register('/sw.js');
      const readyRegistration = await navigator.serviceWorker.ready;
      const existingSubscription = await readyRegistration.pushManager.getSubscription();
      const subscription = existingSubscription ?? await readyRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json = subscription.toJSON();

      if (cancelled || !json.endpoint) return;

      const { error } = await supabaseClient
        .from('push_subscriptions')
        .upsert(
          {
            creator_id: userId,
            endpoint: json.endpoint,
            p256dh: json.keys?.p256dh,
            auth: json.keys?.auth,
          },
          { onConflict: 'endpoint' },
        );

      if (error) {
        console.error('Failed to save push subscription', error);
      }

      if (registration.active?.scriptURL !== readyRegistration.active?.scriptURL) {
        await readyRegistration.update();
      }
    }

    subscribeCreatorToPush().catch((error) => {
      console.error('Failed to subscribe creator to push notifications', error);
      subscriptionKeyRef.current = null;
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
