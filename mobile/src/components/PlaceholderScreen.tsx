import React from 'react';
import { StyleSheet } from 'react-native';
import { Text, Card } from 'react-native-paper';
import ScreenContainer from './ScreenContainer';
import { C } from '@/theme/colors';
import { E } from '@/theme/effects';

export default function PlaceholderScreen({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <ScreenContainer>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineMedium" style={styles.title}>
            {title}
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {subtitle ||
              `${title} module connected and ready for feature implementation.`}
          </Text>
        </Card.Content>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderColor: C.border,
    borderWidth: 1,
    ...E.softShadow,
  },
  title: { color: C.text, marginBottom: 8 },
  subtitle: { color: C.textSub },
});
