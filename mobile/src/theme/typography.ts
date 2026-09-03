import { Platform } from 'react-native';

/** Stitch Vibrant: Playfair Display headlines, Plus Jakarta Sans body. */
export const F = {
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }) as string,
  sans: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }) as string,
};
