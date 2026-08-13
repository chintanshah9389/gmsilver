import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from 'react-native-paper';
import { MainTabParamList } from './types';
import HomeScreen from '@/screens/main/HomeScreen';
import { CategoriesTabStack, OrdersTabStack, ProductsTabStack } from './TabStacks';
import { C } from '@/theme/colors';
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
      <Icon source={icon} size={18} color={focused ? C.text : C.textMuted} />
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
  iconBoxActive: { backgroundColor: 'rgba(255,255,255,0.82)' },
  label: { fontSize: 10, color: C.textMuted, marginTop: 2, fontWeight: '500' },
  labelActive: { color: C.text, fontWeight: '700' },
});

const ICONS: Record<string, { idle: string; active: string }> = {
  Home: { idle: 'home-outline', active: 'home' },
  Products: { idle: 'cube-outline', active: 'cube' },
  Categories: { idle: 'view-grid-outline', active: 'view-grid' },
  Order: { idle: 'receipt-text-outline', active: 'receipt-text' },
};

const LABELS: Record<string, string> = {
  Home: 'Home',
  Products: 'Product',
  Categories: 'Category',
  Order: 'Order',
};

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        header: () => <AppLogoHeader />,
        tabBarShowLabel: false,
        tabBarStyle: {
          display: route.name === 'Home' ? 'none' : 'flex',
          backgroundColor: 'rgba(248,247,244,0.96)',
          borderTopColor: C.borderHi,
          borderTopWidth: 1,
          height: 68,
          paddingBottom: 8,
          elevation: 0,
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
