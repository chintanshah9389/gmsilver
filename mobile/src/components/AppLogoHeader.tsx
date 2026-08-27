import React, { useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Icon } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '@/theme/colors';
import { F } from '@/theme/typography';
import ScalePressable from '@/components/ScalePressable';
import { useCartQuery } from '@/store/services/cartApi';
import { useWishlistQuery } from '@/store/services/wishlistApi';
import { useAppSelector } from '@/hooks/redux';

function Badge({ count }: { count: number }) {
  if (count < 1) return null;
  return (
    <View style={[s.badge, count > 99 && s.badgeWide]}>
      <Text style={s.badgeText}>{String(count)}</Text>
    </View>
  );
}

export default function AppLogoHeader() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAppSelector((st) => st.auth.isAuthenticated);
  const { data: cartData } = useCartQuery(undefined, { skip: !isAuthenticated });
  const { data: wishData } = useWishlistQuery(undefined, { skip: !isAuthenticated });

  const cartCount = useMemo(() => {
    const cart = cartData?.data;
    const items: any[] = cart?.items || [];
    // Distinct cart lines (products), not total piece quantity.
    if (items.length) return items.length;
    if (typeof cart?.itemCount === 'number') return cart.itemCount;
    return 0;
  }, [cartData]);

  const wishCount = useMemo(() => {
    const items: any[] = wishData?.data || [];
    return items.length;
  }, [wishData]);

  return (
    <View style={[s.wrap, { paddingTop: Math.max(insets.top, 8) }]}>
      <ScalePressable
        style={s.sideBtn}
        scaleTo={0.92}
        onPress={() => navigation.navigate('Order', { screen: 'Profile' })}
      >
        <Icon source="account-outline" size={22} color={C.text} />
      </ScalePressable>

      <View style={s.brandWrap} pointerEvents="none">
        <Image
          source={require('@/assets/gm-silver-mark.png')}
          style={s.logo}
          resizeMode="contain"
          accessibilityLabel="GM Silver"
        />
      </View>

      <View style={s.actions}>
        <ScalePressable
          style={s.sideBtn}
          scaleTo={0.92}
          onPress={() => navigation.navigate('Categories', { screen: 'Wishlist' })}
        >
          <Icon source="heart-outline" size={20} color={C.text} />
          <Badge count={wishCount} />
        </ScalePressable>
        <ScalePressable
          style={s.sideBtn}
          scaleTo={0.92}
          onPress={() => navigation.navigate('Categories', { screen: 'Cart' })}
        >
          <Icon source="shopping-outline" size={20} color={C.text} />
          <Badge count={cartCount} />
        </ScalePressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    paddingHorizontal: 8,
    paddingBottom: 10,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(251,249,246,0.96)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  sideBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 2,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: C.ruby,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeWide: {
    minWidth: 22,
    paddingHorizontal: 5,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    fontFamily: F.sans,
    lineHeight: 11,
  },
  brandWrap: {
    position: 'absolute',
    left: 52,
    right: 96,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  logo: {
    width: 168,
    height: 40,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
});
