import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Icon } from 'react-native-paper';
import { C } from '@/theme/colors';

export default function AppLogoHeader() {
  const navigation = useNavigation<any>();

  return (
    <View style={s.wrap}>
      <View style={s.brandWrap}>
        <View style={s.logoBox}>
          <Text style={s.logoText}>GM</Text>
        </View>
        <View>
          <Text style={s.brand}>GM SILVER</Text>
          <Text style={s.tagline}>B2B Catalog</Text>
        </View>
      </View>

      <View style={s.actions}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={s.actionBtn}
          onPress={() => navigation.navigate('Products', { screen: 'Wishlist' })}
        >
          <Icon source="heart-outline" size={16} color={C.silverLt} />
          <Text style={s.actionLabel}>Wish</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          style={s.actionBtn}
          onPress={() => navigation.navigate('Products', { screen: 'Cart' })}
        >
          <Icon source="cart-outline" size={16} color={C.silverLt} />
          <Text style={s.actionLabel}>Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          style={s.actionBtn}
          onPress={() => navigation.navigate('Order', { screen: 'Profile' })}
        >
          <Icon source="account-outline" size={16} color={C.silverLt} />
          <Text style={s.actionLabel}>Me</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    height: 66,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.bg,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  brandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: C.silver,
    backgroundColor: 'rgba(192,192,192,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: C.silverLt,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  brand: {
    color: C.silverLt,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2.2,
  },
  tagline: {
    color: C.textMuted,
    fontSize: 10,
    marginTop: 2,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    minWidth: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface2,
    paddingHorizontal: 6,
  },
  actionLabel: {
    color: C.textMuted,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 1,
    letterSpacing: 0.2,
  },
});