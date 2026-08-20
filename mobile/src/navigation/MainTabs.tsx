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
import { F } from '@/theme/typography';
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
    <Icon source={icon} size={22} color={focused ? C.ruby : C.textMuted} />
    <Text style={[tabStyles.label, focused && tabStyles.labelActive]}>{label}</Text>
  </View>
);

const tabStyles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingTop: 2, width: 72 },
  label: {
    fontSize: 9,
    color: C.textMuted,
    marginTop: 3,
    fontWeight: '600',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    fontFamily: F.sans,
  },
  labelActive: { color: C.ruby, fontWeight: '700' },
});

const ICONS: Record<string, { idle: string; active: string }> = {
  Home: { idle: 'home-outline', active: 'home' },
  Products: { idle: 'diamond-stone', active: 'diamond-stone' },
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
