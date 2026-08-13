import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Icon } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
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
    <View style={[s.wrap, { paddingTop: Math.max(insets.top, 10) }]}>
      <View style={s.left}>
        <LinearGradient
          colors={[C.metalGradStart, C.metalGradEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.logoBox}
        >
          <Text style={s.logoText}>GM</Text>
        </LinearGradient>
        <View style={s.copy}>
          <Text style={s.greeting}>Welcome back</Text>
          <Text style={s.brand}>{firstName}</Text>
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
    backgroundColor: 'transparent',
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
    borderRadius: 14,
    transform: [{ rotate: '8deg' }],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    ...E.softShadow,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    transform: [{ rotate: '-8deg' }],
  },
  copy: { flexShrink: 1 },
  greeting: {
    color: C.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  brand: {
    color: C.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
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
    borderRadius: R.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    ...E.softShadow,
  },
});
