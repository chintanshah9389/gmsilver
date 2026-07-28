import React from 'react';
import { StyleSheet } from 'react-native';
import { Text, Card } from 'react-native-paper';
import ScreenContainer from './ScreenContainer';

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
  card: { backgroundColor: '#151520' },
  title: { color: '#F2F2F2', marginBottom: 8 },
  subtitle: { color: '#AFAFBA' },
});
