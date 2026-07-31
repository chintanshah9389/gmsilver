import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import PremiumBackground from '@/components/PremiumBackground';
import { C } from '@/theme/colors';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function ScreenContainer({ children, style }: Props) {
  return (
    <View style={styles.root}>
      <PremiumBackground />
      <ScrollView contentContainerStyle={[styles.container, style]}>{children}</ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  container: {
    padding: 16,
    backgroundColor: 'transparent',
    minHeight: '100%',
  },
});
