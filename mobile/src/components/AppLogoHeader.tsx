import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Icon } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSelector } from '@/hooks/redux';
import { C, R } from '@/theme/colors';
import { E } from '@/theme/effects';
import ScalePressable from '@/components/ScalePressable';

export default function AppLogoHeader() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const user = useAppSelector((s) => s.auth.user);
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <View style={[s.wrap, { paddingTop: Math.max(insets.top, 8) }]}>
      <View style={s.left}>
        <View style={s.logoBox}>
          <Text style={s.logoText}>GM</Text>
        </View>
        <View style={s.copy}>
          <Text style={s.greeting}>Hello, {firstName}</Text>
          <Text style={s.brand}>GM Silver</Text>
        </View>
      </View>

      <View style={s.actions}>
        <ScalePressable
          style={s.actionBtn}
          scaleTo={0.92}
          onPress={() => navigation.navigate('Products', { screen: 'Wishlist' })}
        >
          <Icon source="heart-outline" size={18} color={C.text} />
        </ScalePressable>
        <ScalePressable
          style={s.actionBtn}
          scaleTo={0.92}
          onPress={() => navigation.navigate('Products', { screen: 'Cart' })}
        >
          <Icon source="cart-outline" size={18} color={C.text} />
        </ScalePressable>
        <ScalePressable
          style={s.actionBtn}
          scaleTo={0.92}
          onPress={() => navigation.navigate('Order', { screen: 'Profile' })}
        >
          <Icon source="account-outline" size={18} color={C.text} />
        </ScalePressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.bg,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
  },
  logoBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: C.gold,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...E.softShadow,
  },
  logoText: {
    color: C.text,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  copy: { flexShrink: 1 },
  greeting: {
    color: C.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  brand: {
    color: C.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginTop: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: R.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    ...E.softShadow,
  },
});
