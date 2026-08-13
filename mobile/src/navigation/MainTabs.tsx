import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Icon } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabParamList } from './types';
import HomeScreen from '@/screens/main/HomeScreen';
import { CategoriesTabStack, OrdersTabStack, ProductsTabStack } from './TabStacks';
import { C } from '@/theme/colors';
import AppLogoHeader from '@/components/AppLogoHeader';
import { getFloatingTabBarStyle } from '@/hooks/useHideTabBarOnFocus';

const Tab = createBottomTabNavigator<MainTabParamList>();

const HIDE_TAB_ROUTES = new Set([
  'Cart',
  'Checkout',
  'Wishlist',
  'OrderDetail',
  'Settings',
]);

const TabIcon = ({
  icon,
  focused,
  label,
}: {
  icon: string;
  focused: boolean;
  label: string;
}) => (
  <View style={tabStyles.wrap}>
    <View style={[tabStyles.iconBox, focused && tabStyles.iconBoxActive]}>
      <Icon source={icon} size={20} color={focused ? '#fff' : C.textMuted} />
    </View>
    <Text style={[tabStyles.label, focused && tabStyles.labelActive]}>{label}</Text>
  </View>
);

const tabStyles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingTop: 4, width: 72 },
  iconBox: {
    width: 42,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxActive: {
    backgroundColor: C.primary,
  },
  label: {
    fontSize: 10,
    color: C.textMuted,
    marginTop: 3,
    fontWeight: '500',
  },
  labelActive: { color: C.primary, fontWeight: '700' },
});

const ICONS: Record<string, { idle: string; active: string }> = {
  Home: { idle: 'home-outline', active: 'home' },
  Products: { idle: 'storefront-outline', active: 'storefront' },
  Categories: { idle: 'view-grid-outline', active: 'view-grid' },
  Order: { idle: 'package-variant-closed', active: 'package-variant' },
};

const LABELS: Record<string, string> = {
  Home: 'Home',
  Products: 'Shop',
  Categories: 'Browse',
  Order: 'Orders',
};

function tabBarForRoute(route: any, bottomInset: number) {
  const focused = getFocusedRouteNameFromRoute(route) ?? route.name;
  if (HIDE_TAB_ROUTES.has(focused)) {
    return { display: 'none' as const };
  }
  return getFloatingTabBarStyle(bottomInset);
}

export default function MainTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        header: () => <AppLogoHeader />,
        tabBarShowLabel: false,
        tabBarStyle: tabBarForRoute(route, insets.bottom),
        tabBarIcon: ({ focused }) => {
          const icons = ICONS[route.name] ?? { idle: 'circle-outline', active: 'circle' };
          return (
            <TabIcon
              icon={focused ? icons.active : icons.idle}
              focused={focused}
              label={LABELS[route.name] ?? route.name}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen
        name="Products"
        component={ProductsTabStack}
        options={({ route }) => ({
          tabBarStyle: tabBarForRoute(route, insets.bottom),
        })}
      />
      <Tab.Screen
        name="Categories"
        component={CategoriesTabStack}
        options={({ route }) => ({
          tabBarStyle: tabBarForRoute(route, insets.bottom),
        })}
      />
      <Tab.Screen
        name="Order"
        component={OrdersTabStack}
        options={({ route }) => ({
          tabBarStyle: tabBarForRoute(route, insets.bottom),
        })}
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate('Order', { screen: 'Orders' });
          },
        })}
      />
    </Tab.Navigator>
  );
}
