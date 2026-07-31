import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import HomeScreen from '@/screens/main/HomeScreen';
import CategoriesScreen from '@/screens/main/CategoriesScreen';
import WishlistScreen from '@/screens/main/WishlistScreen';
import CartScreen from '@/screens/main/CartScreen';
import ProfileScreen from '@/screens/main/ProfileScreen';
import { C } from '@/theme/colors';

const Tab = createBottomTabNavigator<MainTabParamList>();

// SVG-free icon using Unicode symbols
const TabIcon = ({ symbol, focused, label }: { symbol: string; focused: boolean; label: string }) => (
  <View style={tabStyles.wrap}>
    <View style={[tabStyles.iconBox, focused && tabStyles.iconBoxActive]}>
      <Text style={[tabStyles.symbol, focused && tabStyles.symbolActive]}>{symbol}</Text>
    </View>
    <Text style={[tabStyles.label, focused && tabStyles.labelActive]}>{label}</Text>
  </View>
);

const tabStyles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingTop: 6, width: 60 },
  iconBox: {
    width: 38, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  iconBoxActive: { backgroundColor: 'rgba(192,192,192,0.14)' },
  symbol: { fontSize: 18, color: C.textMuted },
  symbolActive: { color: C.silver },
  label: { fontSize: 10, color: C.textMuted, marginTop: 2, fontWeight: '500' },
  labelActive: { color: C.silver, fontWeight: '700' },
});

const ICONS: Record<string, string> = {
  Home: '⌂', Categories: '◈', Wishlist: '♡', Cart: '◉', Profile: '◎',
};

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: 'rgba(27,22,33,0.95)',
          borderTopColor: C.borderHi,
          borderTopWidth: 1,
          height: 68,
          paddingBottom: 8,
          elevation: 0,
        },
        tabBarIcon: ({ focused }) => (
          <TabIcon
            symbol={ICONS[route.name] ?? '●'}
            focused={focused}
            label={route.name}
          />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Categories" component={CategoriesScreen} />
      <Tab.Screen name="Wishlist" component={WishlistScreen} />
      <Tab.Screen name="Cart" component={CartScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
