import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'GM Silver',
  slug: 'gmsilver-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'gmsilver',
  userInterfaceStyle: 'light',
  icon: './assets/icon.png',
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
      NSPhotoLibraryUsageDescription:
        'GM Silver needs photo access to upload product, category, and banner images.',
      NSCameraUsageDescription:
        'GM Silver needs camera access to capture product images.',
    },
  },
  android: {
    package: 'com.gmsilver.app',
    googleServicesFile: './google-services.json',
    permissions: [
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.READ_MEDIA_IMAGES',
      'android.permission.READ_EXTERNAL_STORAGE',
    ],
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FBF9F6',
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
    [
      'expo-image-picker',
      {
        photosPermission:
          'GM Silver needs photo access to upload product, category, and banner images.',
      },
    ],
    'expo-document-picker',
    [
      'expo-build-properties',
      {
        ios: {
          useFrameworks: 'static',
        },
      },
    ],
  ],
  extra: {
    eas: {
      projectId: 'gmsilver-mobile',
    },
  },
});
