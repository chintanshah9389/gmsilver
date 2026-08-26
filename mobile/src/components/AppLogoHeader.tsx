import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Icon } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '@/theme/colors';
import { F } from '@/theme/typography';
import ScalePressable from '@/components/ScalePressable';

export default function AppLogoHeader() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

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
        <Text style={s.brand}>GM SILVER</Text>
      </View>

      <View style={s.actions}>
        <ScalePressable
          style={s.sideBtn}
          scaleTo={0.92}
          onPress={() => navigation.navigate('Categories', { screen: 'Wishlist' })}
        >
          <Icon source="heart-outline" size={20} color={C.text} />
        </ScalePressable>
        <ScalePressable
          style={s.sideBtn}
          scaleTo={0.92}
          onPress={() => navigation.navigate('Categories', { screen: 'Cart' })}
        >
          <Icon source="shopping-outline" size={20} color={C.text} />
        </ScalePressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    paddingHorizontal: 8,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(251,249,246,0.92)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  sideBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  brand: {
    color: C.text,
    fontSize: 18,
    fontFamily: F.serif,
    fontWeight: '500',
    letterSpacing: 2.4,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
