/** Minimal typings for Expo public env vars (avoids pulling in full @types/node). */
declare const process: {
  env: {
    EXPO_PUBLIC_API_URL?: string;
    [key: string]: string | undefined;
  };
};
