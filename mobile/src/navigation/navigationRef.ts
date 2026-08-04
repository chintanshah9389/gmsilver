import {
  LinkingOptions,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { AppStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<AppStackParamList>();

export const linking: LinkingOptions<AppStackParamList> = {
  prefixes: ['gmsilver://'],
  config: {
    screens: {
      Tabs: {
        screens: {
          Order: {
            screens: {
              Notifications: 'notifications',
              OrderDetail: 'orders/:orderId',
            },
          },
        },
      },
    },
  },
};

export type PushNavigationData = {
  orderId?: string;
  type?: string;
};

export function navigateFromPushData(data?: PushNavigationData | null) {
  if (!navigationRef.isReady()) {
    return;
  }

  if (data?.orderId) {
    navigationRef.navigate('Tabs', {
      screen: 'Order',
      params: {
        screen: 'OrderDetail',
        params: { orderId: data.orderId },
      },
    });
    return;
  }

  navigationRef.navigate('Tabs', {
    screen: 'Order',
    params: {
      screen: 'Notifications',
    },
  });
}
