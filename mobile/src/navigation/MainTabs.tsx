import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  CommonActions,
  getFocusedRouteNameFromRoute,
} from '@react-navigation/native';
import { Icon } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabParamList } from './types';
import HomeScreen from '@/screens/main/HomeScreen';
import { CategoriesTabStack, OrdersTabStack } from './TabStacks';
import { C } from '@/theme/colors';
import { F } from '@/theme/typography';
import AppLogoHeader from '@/components/AppLogoHeader';
import { getFloatingTabBarStyle } from '@/hooks/useHideTabBarOnFocus';
import { useAppSelector } from '@/hooks/redux';
import { isStaff } from '@/lib/roles';

const Tab = createBottomTabNavigator<MainTabParamList>();

function AdminTabLazy(props: any) {
  const { AdminTabStack } = require('./AdminTabStack');
  return <AdminTabStack {...props} />;
}

const HIDE_TAB_ROUTES = new Set([
  'Cart',
  'Checkout',
  'Wishlist',
  'OrderDetail',
  'Settings',
  'AdminProductForm',
  'AdminOrderDetail',
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
  Categories: { idle: 'view-grid-outline', active: 'view-grid' },
  Order: { idle: 'package-variant-closed', active: 'package-variant' },
  Admin: { idle: 'shield-outline', active: 'shield' },
};

const LABELS: Record<string, string> = {
  Home: 'Home',
  Categories: 'Browse',
  Order: 'Orders',
  Admin: 'Admin',
};

function tabBarForRoute(route: any, bottomInset: number) {
  const focused = getFocusedRouteNameFromRoute(route) ?? route.name;
  if (HIDE_TAB_ROUTES.has(focused)) {
    return { display: 'none' as const };
  }
  return getFloatingTabBarStyle(bottomInset);
}

/** Reset one tab's nested stack to a single root screen; keep other tabs intact. */
function resetTabToRoot(tabName: string, rootScreen: string) {
  return (state: any) => {
    const routes = state.routes.map((route: any) =>
      route.name === tabName
        ? {
            ...route,
            state: {
              routes: [{ name: rootScreen }],
              index: 0,
            },
          }
        : route,
    );
    const index = Math.max(
      0,
      routes.findIndex((route: any) => route.name === tabName),
    );
    return CommonActions.reset({
      ...state,
      routes,
      index,
    });
  };
}

export default function MainTabs() {
  const insets = useSafeAreaInsets();
  const role = useAppSelector((state) => state.auth.user?.role);
  const showAdmin = isStaff(role);

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
        name="Categories"
        component={CategoriesTabStack}
        options={({ route }) => ({
          // Remount when leaving Browse so returning starts at collections.
          unmountOnBlur: true,
          tabBarStyle: tabBarForRoute(route, insets.bottom),
        })}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Always open collections root — never restore last product/cart/wishlist.
            e.preventDefault();
            navigation.dispatch(resetTabToRoot('Categories', 'Categories'));
          },
        })}
      />
      <Tab.Screen
        name="Order"
        component={OrdersTabStack}
        options={({ route }) => ({
          tabBarStyle: tabBarForRoute(route, insets.bottom),
        })}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.dispatch(resetTabToRoot('Order', 'Orders'));
          },
        })}
      />
      {showAdmin ? (
        <Tab.Screen
          name="Admin"
          component={AdminTabLazy}
          options={({ route }) => ({
            tabBarStyle: tabBarForRoute(route, insets.bottom),
          })}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              e.preventDefault();
              navigation.dispatch(resetTabToRoot('Admin', 'AdminHub'));
            },
          })}
        />
      ) : null}
    </Tab.Navigator>
  );
}
