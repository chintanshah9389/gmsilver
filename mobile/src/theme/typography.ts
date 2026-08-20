import { Platform } from 'react-native';

/** Stitch Prestige: EB Garamond headlines, Hanken Grotesk body. */
export const F = {
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }) as string,
  sans: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }) as string,
};
