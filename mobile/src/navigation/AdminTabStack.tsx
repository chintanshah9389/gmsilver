import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminStackParamList } from './types';
import { C } from '@/theme/colors';
import AdminHubScreen from '@/screens/admin/AdminHubScreen';
import AdminDashboardScreen from '@/screens/admin/AdminDashboardScreen';
import AdminAnalyticsScreen from '@/screens/admin/AdminAnalyticsScreen';
import AdminCategoriesScreen from '@/screens/admin/AdminCategoriesScreen';
import AdminProductsScreen from '@/screens/admin/AdminProductsScreen';
import AdminProductFormScreen from '@/screens/admin/AdminProductFormScreen';
import AdminBannersScreen from '@/screens/admin/AdminBannersScreen';
import AdminHomeWidgetsScreen from '@/screens/admin/AdminHomeWidgetsScreen';
import AdminUsersScreen from '@/screens/admin/AdminUsersScreen';
import AdminOrdersScreen from '@/screens/admin/AdminOrdersScreen';
import AdminOrderDetailScreen from '@/screens/admin/AdminOrderDetailScreen';
import AdminInvoicesScreen from '@/screens/admin/AdminInvoicesScreen';
import AdminNotificationsScreen from '@/screens/admin/AdminNotificationsScreen';
import AdminAuditLogsScreen from '@/screens/admin/AdminAuditLogsScreen';
import AdminExcelScreen from '@/screens/admin/AdminExcelScreen';

const AdminStack = createNativeStackNavigator<AdminStackParamList>();

export function AdminTabStack() {
  return (
    <AdminStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
      <AdminStack.Screen name="AdminHub" component={AdminHubScreen} />
      <AdminStack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <AdminStack.Screen name="AdminAnalytics" component={AdminAnalyticsScreen} />
      <AdminStack.Screen name="AdminCategories" component={AdminCategoriesScreen} />
      <AdminStack.Screen name="AdminProducts" component={AdminProductsScreen} />
      <AdminStack.Screen name="AdminProductForm" component={AdminProductFormScreen} />
      <AdminStack.Screen name="AdminBanners" component={AdminBannersScreen} />
      <AdminStack.Screen name="AdminHomeWidgets" component={AdminHomeWidgetsScreen} />
      <AdminStack.Screen name="AdminUsers" component={AdminUsersScreen} />
      <AdminStack.Screen name="AdminOrders" component={AdminOrdersScreen} />
      <AdminStack.Screen name="AdminOrderDetail" component={AdminOrderDetailScreen} />
      <AdminStack.Screen name="AdminInvoices" component={AdminInvoicesScreen} />
      <AdminStack.Screen name="AdminNotifications" component={AdminNotificationsScreen} />
      <AdminStack.Screen name="AdminAuditLogs" component={AdminAuditLogsScreen} />
      <AdminStack.Screen name="AdminExcel" component={AdminExcelScreen} />
    </AdminStack.Navigator>
  );
}
