import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  CategoriesStackParamList,
  OrdersStackParamList,
} from './types';
import ProductListScreen from '@/screens/main/ProductListScreen';
import ProductDetailScreen from '@/screens/main/ProductDetailScreen';
import CheckoutScreen from '@/screens/main/CheckoutScreen';
import CategoriesScreen from '@/screens/main/CategoriesScreen';
import OrdersScreen from '@/screens/main/OrdersScreen';
import OrderDetailScreen from '@/screens/main/OrderDetailScreen';
import InvoicesScreen from '@/screens/main/InvoicesScreen';
import NotificationsScreen from '@/screens/main/NotificationsScreen';
import SettingsScreen from '@/screens/main/SettingsScreen';
import WishlistScreen from '@/screens/main/WishlistScreen';
import CartScreen from '@/screens/main/CartScreen';
import ProfileScreen from '@/screens/main/ProfileScreen';
import { C } from '@/theme/colors';

const CategoriesStack = createNativeStackNavigator<CategoriesStackParamList>();
const OrdersStack = createNativeStackNavigator<OrdersStackParamList>();

export function CategoriesTabStack() {
  return (
    <CategoriesStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
      <CategoriesStack.Screen name="Categories" component={CategoriesScreen} />
      <CategoriesStack.Screen name="ProductList" component={ProductListScreen} />
      <CategoriesStack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <CategoriesStack.Screen name="Wishlist" component={WishlistScreen} />
      <CategoriesStack.Screen name="Cart" component={CartScreen} />
      <CategoriesStack.Screen name="Checkout" component={CheckoutScreen} />
    </CategoriesStack.Navigator>
  );
}

export function OrdersTabStack() {
  return (
    <OrdersStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
      <OrdersStack.Screen name="Orders" component={OrdersScreen} />
      <OrdersStack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <OrdersStack.Screen name="Invoices" component={InvoicesScreen} />
      <OrdersStack.Screen name="Notifications" component={NotificationsScreen} />
      <OrdersStack.Screen name="Settings" component={SettingsScreen} />
      <OrdersStack.Screen name="Profile" component={ProfileScreen} />
    </OrdersStack.Navigator>
  );
}
