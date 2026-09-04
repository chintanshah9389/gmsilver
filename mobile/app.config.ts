import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'GM Silver',
  slug: 'gmsilver-app',
  version: '1.0.1',
  orientation: 'portrait',
  scheme: 'gmsilver',
  userInterfaceStyle: 'light',
  icon: './assets/icon.png',
  splash: {
    image: './assets/splash-logo.png',
    resizeMode: 'contain',
    backgroundColor: '#FBF9F6',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.gmsilver.app',
    googleServicesFile: './GoogleService-Info.plist',
    icon: './assets/icon.png',
    entitlements: {
      'aps-environment': 'production',
    },
    infoPlist: {
      UIBackgroundModes: ['remote-notification'],
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: 'com.gmsilver.app',
    googleServicesFile: './google-services.json',
    versionCode: 8,
    permissions: ['android.permission.POST_NOTIFICATIONS'],
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FFF6F2',
    },
  },
  plugins: [
    '@react-native-firebase/app',
    [
      '@react-native-firebase/messaging',
      {
        ios_foreground_presentation_options: [
          'badge',
          'sound',
          'list',
          'banner',
        ],
      },
    ],
    'expo-av',
    [
      'expo-build-properties',
      {
        android: {
          compileSdkVersion: 36,
          targetSdkVersion: 36,
          buildToolsVersion: '35.0.0',
        },
        ios: {
          useFrameworks: 'static',
        },
      },
    ],
  ],
  extra: {
    appVersionCode: 8,
    appVersionName: '1.0.1',
    eas: {
      projectId: '08cb5af3-ae20-4fb5-ba16-f8cf898826cb',
    },
  },
});
