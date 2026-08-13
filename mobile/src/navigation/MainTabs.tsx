import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabParamList } from './types';
import HomeScreen from '@/screens/main/HomeScreen';
import { CategoriesTabStack, OrdersTabStack, ProductsTabStack } from './TabStacks';
import { C, R } from '@/theme/colors';
import { E } from '@/theme/effects';
import AppLogoHeader from '@/components/AppLogoHeader';

const Tab = createBottomTabNavigator<MainTabParamList>();

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
      <Icon source={icon} size={18} color={focused ? '#fff' : C.textMuted} />
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
    backgroundColor: C.text,
  },
  label: {
    fontSize: 10,
    color: C.textMuted,
    marginTop: 3,
    fontWeight: '500',
  },
  labelActive: { color: C.text, fontWeight: '700' },
});

const ICONS: Record<string, { idle: string; active: string }> = {
  Home: { idle: 'home-outline', active: 'home' },
  Products: { idle: 'diamond-stone', active: 'diamond-stone' },
  Categories: { idle: 'view-grid-outline', active: 'view-grid' },
  Order: { idle: 'receipt-text-outline', active: 'receipt-text' },
};

const LABELS: Record<string, string> = {
  Home: 'Home',
  Products: 'Shop',
  Categories: 'Browse',
  Order: 'Orders',
};

export default function MainTabs() {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        header: () => <AppLogoHeader />,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom,
          height: 68,
          borderRadius: R.xl,
          backgroundColor: C.surface,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: C.borderHi,
          paddingBottom: 0,
          paddingTop: 6,
          ...E.floatShadow,
          ...(Platform.OS === 'android' ? { elevation: 14 } : null),
        },
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
      <Tab.Screen name="Products" component={ProductsTabStack} />
      <Tab.Screen name="Categories" component={CategoriesTabStack} />
      <Tab.Screen
        name="Order"
        component={OrdersTabStack}
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate('Order', { screen: 'Orders' });
          },
        })}
      />
    </Tab.Navigator>
  );
}
