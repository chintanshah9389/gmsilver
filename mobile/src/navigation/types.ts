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

export type ProductStackParamList = {
  ProductList: { categoryId?: string; categoryName?: string } | undefined;
  ProductDetail: { productId: string };
  Wishlist: undefined;
  Cart: undefined;
  Checkout: undefined;
};

export type CategoriesStackParamList = {
  Categories: undefined;
  ProductList: { categoryId?: string; categoryName?: string };
  ProductDetail: { productId: string };
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

export type MainTabParamList = {
  Home: undefined;
  Products: NavigatorScreenParams<ProductStackParamList>;
  Categories: NavigatorScreenParams<CategoriesStackParamList>;
  Order: NavigatorScreenParams<OrdersStackParamList>;
};

export type AppStackParamList = {
  Tabs: undefined;
};
