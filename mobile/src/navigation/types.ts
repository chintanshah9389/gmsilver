import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  Signup: undefined;
  MpinLogin: undefined;
  CreateMpin: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
  ForgotMpin: undefined;
  ResetMpin: undefined;
};

export type CategoriesStackParamList = {
  Categories: undefined;
  ProductList: { categoryId?: string; categoryName?: string };
  ProductDetail: { productId: string };
  Wishlist: undefined;
  Cart: undefined;
  Checkout: undefined;
};

export type OrdersStackParamList = {
  Orders: undefined;
  OrderDetail: { orderId: string };
  Invoices: undefined;
  Notifications: undefined;
  Settings: undefined;
  Profile: undefined;
};

export type AdminStackParamList = {
  AdminHub: undefined;
  AdminDashboard: undefined;
  AdminAnalytics: undefined;
  AdminCategories: undefined;
  AdminProducts: undefined;
  AdminProductForm: { productId?: string } | undefined;
  AdminBanners: undefined;
  AdminHomeWidgets: undefined;
  AdminUsers: undefined;
  AdminOrders: undefined;
  AdminOrderDetail: { orderId: string };
  AdminInvoices: undefined;
  AdminNotifications: undefined;
  AdminAuditLogs: undefined;
  AdminExcel: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Categories: NavigatorScreenParams<CategoriesStackParamList>;
  Order: NavigatorScreenParams<OrdersStackParamList>;
  Admin: NavigatorScreenParams<AdminStackParamList>;
};

export type AppStackParamList = {
  Tabs: NavigatorScreenParams<MainTabParamList> | undefined;
};
