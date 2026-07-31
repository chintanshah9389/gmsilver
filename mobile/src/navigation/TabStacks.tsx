import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  CategoriesStackParamList,
  OrdersStackParamList,
  ProductStackParamList,
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

const ProductStack = createNativeStackNavigator<ProductStackParamList>();
const CategoriesStack = createNativeStackNavigator<CategoriesStackParamList>();
const OrdersStack = createNativeStackNavigator<OrdersStackParamList>();

export function ProductsTabStack() {
  return (
    <ProductStack.Navigator screenOptions={{ headerShown: false }}>
      <ProductStack.Screen
        name="ProductList"
        component={ProductListScreen}
        initialParams={{ categoryName: 'All Products' }}
      />
      <ProductStack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <ProductStack.Screen name="Wishlist" component={WishlistScreen} />
      <ProductStack.Screen name="Cart" component={CartScreen} />
      <ProductStack.Screen name="Checkout" component={CheckoutScreen} />
    </ProductStack.Navigator>
  );
}

export function CategoriesTabStack() {
  return (
    <CategoriesStack.Navigator screenOptions={{ headerShown: false }}>
      <CategoriesStack.Screen name="Categories" component={CategoriesScreen} />
      <CategoriesStack.Screen name="ProductList" component={ProductListScreen} />
      <CategoriesStack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <CategoriesStack.Screen name="Checkout" component={CheckoutScreen} />
    </CategoriesStack.Navigator>
  );
}

export function OrdersTabStack() {
  return (
    <OrdersStack.Navigator screenOptions={{ headerShown: false }}>
      <OrdersStack.Screen name="Orders" component={OrdersScreen} />
      <OrdersStack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <OrdersStack.Screen name="Invoices" component={InvoicesScreen} />
      <OrdersStack.Screen name="Notifications" component={NotificationsScreen} />
      <OrdersStack.Screen name="Settings" component={SettingsScreen} />
      <OrdersStack.Screen name="Profile" component={ProfileScreen} />
    </OrdersStack.Navigator>
  );
}