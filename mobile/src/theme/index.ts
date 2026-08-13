import { MD3LightTheme, configureFonts } from 'react-native-paper';
import { C } from './colors';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: C.primary,
    secondary: C.accent,
    tertiary: C.goldDim,
    background: C.bg,
    surface: C.surface,
    surfaceVariant: C.surface2,
    outline: C.borderHi,
    onBackground: C.text,
    onSurface: C.text,
    onSurfaceVariant: C.textSub,
    error: C.error,
  },
  roundness: 16,
  fonts: configureFonts({
    config: {
      fontFamily: 'System',
    },
  }),
};

export { C, R, S } from './colors';
export { E } from './effects';
