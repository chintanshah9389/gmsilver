import { Alert, PermissionsAndroid, Platform } from 'react-native';
import { store } from '@/store';
import { api } from '@/store/services/api';
import { notificationsApi } from '@/store/services/notificationsApi';
import {
  navigateFromPushData,
  PushNavigationData,
} from '@/navigation/navigationRef';

/** Keep order/notification screens in sync when a push arrives while already open. */
function syncCachesFromPush(data: PushNavigationData | null) {
  const orderId =
    data?.orderId ||
    (typeof data?.link === 'string' && data.link.startsWith('order:')
      ? data.link.slice('order:'.length)
      : undefined);
  const orderRelated =
    Boolean(orderId) ||
    (typeof data?.type === 'string' && data.type.startsWith('ORDER_')) ||
    (typeof data?.link === 'string' && data.link.startsWith('order:'));

  const tags: Array<
    | 'Notification'
    | { type: 'Order'; id: string }
    | { type: 'AdminOrder'; id: string }
  > = ['Notification'];

  if (orderRelated) {
    tags.push({ type: 'Order', id: 'LIST' });
    tags.push({ type: 'AdminOrder', id: 'LIST' });
    if (orderId) {
      tags.push({ type: 'Order', id: orderId });
      tags.push({ type: 'AdminOrder', id: orderId });
    }
  }

  store.dispatch(api.util.invalidateTags(tags));
}

type RemoteMessage = {
  messageId?: string;
  notification?: { title?: string; body?: string };
  data?: Record<string, string | object>;
};

let messagingModule: typeof import('@react-native-firebase/messaging').default | null =
  null;

function getMessaging() {
  if (Platform.OS === 'web') {
    return null;
  }
  if (!messagingModule) {
    // Lazy require so web bundles do not load native Firebase.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    messagingModule = require('@react-native-firebase/messaging').default;
  }
  return messagingModule;
}

let initialized = false;
let unsubscribeOnMessage: (() => void) | undefined;
let unsubscribeTokenRefresh: (() => void) | undefined;
let unsubscribeOpened: (() => void) | undefined;

function getPushData(remoteMessage: RemoteMessage | null): PushNavigationData | null {
  if (!remoteMessage?.data) {
    return null;
  }

  const { orderId, productId, categoryId, type, link } = remoteMessage.data;
  return {
    orderId: typeof orderId === 'string' ? orderId : undefined,
    productId: typeof productId === 'string' ? productId : undefined,
    categoryId: typeof categoryId === 'string' ? categoryId : undefined,
    type: typeof type === 'string' ? type : undefined,
    link: typeof link === 'string' ? link : undefined,
  };
}

async function requestAndroidPostNotificationsPermission() {
  if (Platform.OS !== 'android' || Number(Platform.Version) < 33) {
    return true;
  }

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

export async function requestPushPermission(): Promise<boolean> {
  const messaging = getMessaging();
  if (!messaging) {
    return false;
  }

  const androidOk = await requestAndroidPostNotificationsPermission();
  if (!androidOk) {
    return false;
  }

  const authStatus = await messaging().requestPermission();
  return (
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL
  );
}

export async function getFcmToken(): Promise<string | null> {
  try {
    const messaging = getMessaging();
    if (!messaging) {
      return null;
    }

    const enabled = await requestPushPermission();
    if (!enabled) {
      return null;
    }

    if (
      Platform.OS === 'ios' &&
      !messaging().isDeviceRegisteredForRemoteMessages
    ) {
      await messaging().registerDeviceForRemoteMessages();
    }

    return await messaging().getToken();
  } catch (error) {
    console.warn('[push] Failed to get FCM token', error);
    return null;
  }
}

async function syncTokenToBackend(userId: string, fcmToken: string) {
  try {
    await store
      .dispatch(
        notificationsApi.endpoints.updateFcmToken.initiate({
          userId,
          fcmToken,
        }),
      )
      .unwrap();
  } catch (error) {
    console.warn('[push] Failed to sync FCM token', error);
  }
}

export async function registerDeviceForPush(
  userId: string,
): Promise<string | null> {
  const token = await getFcmToken();
  if (!token) {
    return null;
  }

  await syncTokenToBackend(userId, token);
  return token;
}

export function initPushListeners() {
  if (initialized) {
    return;
  }

  const messaging = getMessaging();
  if (!messaging) {
    return;
  }

  initialized = true;

  unsubscribeOnMessage = messaging().onMessage(async (remoteMessage) => {
    const title = remoteMessage?.notification?.title || 'Notification';
    const body = remoteMessage?.notification?.body || '';
    console.log('[push] Foreground message', title);

    const data = getPushData(remoteMessage);
    syncCachesFromPush(data);

    // System tray does not show while app is in foreground — surface it in-app.
    Alert.alert(title, body || undefined);
  });

  unsubscribeTokenRefresh = messaging().onTokenRefresh(async (token) => {
    const userId = store.getState().auth.user?.id;
    if (userId && token) {
      await syncTokenToBackend(userId, token);
    }
  });

  unsubscribeOpened = messaging().onNotificationOpenedApp((remoteMessage) => {
    const data = getPushData(remoteMessage);
    syncCachesFromPush(data);
    navigateFromPushData(data);
  });

  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        const data = getPushData(remoteMessage);
        syncCachesFromPush(data);
        navigateFromPushData(data);
      }
    })
    .catch((error) => {
      console.warn('[push] getInitialNotification failed', error);
    });
}

export function teardownPushListeners() {
  unsubscribeOnMessage?.();
  unsubscribeTokenRefresh?.();
  unsubscribeOpened?.();
  unsubscribeOnMessage = undefined;
  unsubscribeTokenRefresh = undefined;
  unsubscribeOpened = undefined;
  initialized = false;
}
