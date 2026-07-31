import { MD3LightTheme, configureFonts } from 'react-native-paper';
import { C } from './colors';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#87A9D9',
    secondary: '#4EA8A1',
    tertiary: '#8C78B8',
    background: C.bg,
    surface: C.surface,
    surfaceVariant: C.surface2,
    outline: C.borderHi,
    onBackground: C.text,
    onSurface: C.text,
    onSurfaceVariant: C.textSub,
    error: C.error,
  },
  roundness: 14,
  fonts: configureFonts({
    config: {
      fontFamily: 'System',
    },
  }),
};
