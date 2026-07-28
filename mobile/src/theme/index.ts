import { MD3DarkTheme, configureFonts } from 'react-native-paper';

export const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#C0C0C0',
    secondary: '#FFD700',
    background: '#0A0A0F',
    surface: '#14141D',
    onSurface: '#F2F2F2',
  },
  roundness: 12,
  fonts: configureFonts({
    config: {
      fontFamily: 'System',
    },
  }),
};
