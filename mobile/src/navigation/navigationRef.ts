import {
  LinkingOptions,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { Linking } from 'react-native';
import { AppStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<AppStackParamList>();

export const linking: LinkingOptions<AppStackParamList> = {
  prefixes: ['gmsilver://'],
  config: {
    screens: {
      Tabs: {
        screens: {
          Products: {
            screens: {
              ProductDetail: 'products/:productId',
            },
          },
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
  productId?: string;
  type?: string;
  link?: string;
};

function extractId(value?: string | object): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function parseLink(link: string): {
  productId?: string;
  orderId?: string;
  externalUrl?: string;
} {
  const trimmed = link.trim();
  if (!trimmed) return {};

  if (/^https?:\/\//i.test(trimmed)) {
    return { externalUrl: trimmed };
  }

  const withoutScheme = trimmed.replace(/^gmsilver:\/\//i, '');

  const productMatch = withoutScheme.match(
    /^(?:product[/:]|products\/)([A-Za-z0-9-]+)$/i,
  );
  if (productMatch) {
    return { productId: productMatch[1] };
  }

  const orderMatch = withoutScheme.match(
    /^(?:order[/:]|orders\/)([A-Za-z0-9-]+)$/i,
  );
  if (orderMatch) {
    return { orderId: orderMatch[1] };
  }

  return {};
}

export function navigateFromPushData(data?: PushNavigationData | null) {
  if (!navigationRef.isReady()) {
    return;
  }

  const parsed = data?.link ? parseLink(data.link) : {};
  const productId = extractId(data?.productId) || parsed.productId;
  const orderId = extractId(data?.orderId) || parsed.orderId;

  if (parsed.externalUrl) {
    void Linking.openURL(parsed.externalUrl);
    return;
  }

  if (productId) {
    navigationRef.navigate('Tabs', {
      screen: 'Products',
      params: {
        screen: 'ProductDetail',
        params: { productId },
      },
    });
    return;
  }

  if (orderId) {
    navigationRef.navigate('Tabs', {
      screen: 'Order',
      params: {
        screen: 'OrderDetail',
        params: { orderId },
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
