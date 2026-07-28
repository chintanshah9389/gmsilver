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

export type MainTabParamList = {
  Home: undefined;
  Categories: undefined;
  Wishlist: undefined;
  Cart: undefined;
  Profile: undefined;
};

export type AppStackParamList = {
  Tabs: undefined;
  ProductList: { categoryId?: string; categoryName?: string };
  ProductDetail: { productId: string };
  Checkout: undefined;
  Orders: undefined;
  OrderDetail: { orderId: string };
  Invoices: undefined;
  Notifications: undefined;
  Settings: undefined;
};
