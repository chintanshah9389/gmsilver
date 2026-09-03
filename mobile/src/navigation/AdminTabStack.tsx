import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminStackParamList } from './types';
import { C } from '@/theme/colors';
import AdminHubScreen from '@/screens/admin/AdminHubScreen';
import AdminUsersScreen from '@/screens/admin/AdminUsersScreen';
import AdminOrdersScreen from '@/screens/admin/AdminOrdersScreen';
import AdminOrderDetailScreen from '@/screens/admin/AdminOrderDetailScreen';
import AdminNotificationsScreen from '@/screens/admin/AdminNotificationsScreen';

const AdminStack = createNativeStackNavigator<AdminStackParamList>();

export function AdminTabStack() {
  return (
    <AdminStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
      <AdminStack.Screen name="AdminHub" component={AdminHubScreen} />
      <AdminStack.Screen name="AdminUsers" component={AdminUsersScreen} />
      <AdminStack.Screen name="AdminOrders" component={AdminOrdersScreen} />
      <AdminStack.Screen name="AdminOrderDetail" component={AdminOrderDetailScreen} />
      <AdminStack.Screen name="AdminNotifications" component={AdminNotificationsScreen} />
    </AdminStack.Navigator>
  );
}
