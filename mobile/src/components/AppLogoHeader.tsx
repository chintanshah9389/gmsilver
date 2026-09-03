import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Icon } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '@/theme/colors';
import { F } from '@/theme/typography';
import ScalePressable from '@/components/ScalePressable';
import BrandLogo from '@/components/BrandLogo';
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
        style={s.brand}
        scaleTo={0.97}
        accessibilityRole="button"
        accessibilityLabel="Go to home"
        onPress={() => navigation.navigate('Home')}
      >
        <BrandLogo width={96} />
      </ScalePressable>

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
        <ScalePressable
          style={s.profileBtn}
          scaleTo={0.92}
          onPress={() => navigation.navigate('Order', { screen: 'Profile' })}
        >
          <Icon source="account" size={18} color="#fff" />
        </ScalePressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  brand: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingRight: 8,
  },
  sideBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  profileBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
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
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
