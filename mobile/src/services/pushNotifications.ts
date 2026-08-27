import { PermissionsAndroid, Platform } from 'react-native';
import { store } from '@/store';
import { api } from '@/store/services/api';
import { notificationsApi } from '@/store/services/notificationsApi';
import {
  navigateFromPushData,
  PushNavigationData,
} from '@/navigation/navigationRef';

const ANDROID_CHANNEL_ID = 'gmsilver_default';

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
let notifeeModule: typeof import('@notifee/react-native').default | null = null;
let AndroidImportance: typeof import('@notifee/react-native').AndroidImportance | null =
  null;
let EventType: typeof import('@notifee/react-native').EventType | null = null;

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

function getNotifee() {
  if (Platform.OS === 'web') {
    return null;
  }
  if (!notifeeModule) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const notifee = require('@notifee/react-native');
    notifeeModule = notifee.default;
    AndroidImportance = notifee.AndroidImportance;
    EventType = notifee.EventType;
  }
  return notifeeModule;
}

let initialized = false;
let unsubscribeOnMessage: (() => void) | undefined;
let unsubscribeTokenRefresh: (() => void) | undefined;
let unsubscribeOpened: (() => void) | undefined;
let unsubscribeNotifee: (() => void) | undefined;

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

function toStringData(
  data?: Record<string, string | object>,
): Record<string, string> {
  if (!data) {
    return {};
  }
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      out[key] = value;
    } else if (value != null) {
      out[key] = String(value);
    }
  }
  return out;
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

/** Show a normal system notification while the app is in the foreground. */
async function displayForegroundSystemNotification(
  remoteMessage: RemoteMessage,
) {
  const notifee = getNotifee();
  if (!notifee) {
    return;
  }

  const title = remoteMessage.notification?.title || 'Notification';
  const body = remoteMessage.notification?.body || '';
  const data = toStringData(remoteMessage.data);

  if (Platform.OS === 'android' && AndroidImportance) {
    await notifee.createChannel({
      id: ANDROID_CHANNEL_ID,
      name: 'GM Silver',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
    });
  }

  await notifee.displayNotification({
    title,
    body,
    data,
    android: {
      channelId: ANDROID_CHANNEL_ID,
      pressAction: { id: 'default' },
      importance: AndroidImportance?.HIGH,
      sound: 'default',
    },
    ios: {
      sound: 'default',
      foregroundPresentationOptions: {
        banner: true,
        list: true,
        sound: true,
        badge: true,
      },
    },
  });
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

  // iOS: also allow the OS to present FCM banners while app is open.
  if (Platform.OS === 'ios') {
    void messaging().setForegroundNotificationPresentationOptions({
      alert: true,
      badge: true,
      sound: true,
    });
  }

  unsubscribeOnMessage = messaging().onMessage(async (remoteMessage) => {
    const title = remoteMessage?.notification?.title || 'Notification';
    console.log('[push] Foreground message', title);

    const data = getPushData(remoteMessage);
    syncCachesFromPush(data);

    // Android does not show tray notifications in foreground — display one ourselves.
    // iOS uses setForegroundNotificationPresentationOptions above; Notifee is a
    // fallback if the payload has no notification block.
    if (Platform.OS === 'android') {
      try {
        await displayForegroundSystemNotification(remoteMessage);
      } catch (error) {
        console.warn('[push] Failed to display foreground notification', error);
      }
    } else if (
      Platform.OS === 'ios' &&
      !remoteMessage?.notification?.title &&
      !remoteMessage?.notification?.body
    ) {
      try {
        await displayForegroundSystemNotification(remoteMessage);
      } catch (error) {
        console.warn('[push] Failed to display foreground notification', error);
      }
    }
  });

  const notifee = getNotifee();
  if (notifee && EventType) {
    unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
      if (type !== EventType!.PRESS) {
        return;
      }
      const raw = detail.notification?.data || {};
      const data: PushNavigationData = {
        orderId: typeof raw.orderId === 'string' ? raw.orderId : undefined,
        productId: typeof raw.productId === 'string' ? raw.productId : undefined,
        categoryId:
          typeof raw.categoryId === 'string' ? raw.categoryId : undefined,
        type: typeof raw.type === 'string' ? raw.type : undefined,
        link: typeof raw.link === 'string' ? raw.link : undefined,
      };
      syncCachesFromPush(data);
      navigateFromPushData(data);
    });
  }

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
  unsubscribeNotifee?.();
  unsubscribeOnMessage = undefined;
  unsubscribeTokenRefresh = undefined;
  unsubscribeOpened = undefined;
  unsubscribeNotifee = undefined;
  initialized = false;
}
