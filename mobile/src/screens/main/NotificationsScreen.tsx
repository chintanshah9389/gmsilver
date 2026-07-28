import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import {
  useNotificationsQuery,
  useMarkAllReadMutation,
} from '@/store/services/notificationsApi';

export default function NotificationsScreen() {
  const { data } = useNotificationsQuery({ page: 1, limit: 100 });
  const [markAllRead] = useMarkAllReadMutation();
  const rows = data?.notifications || data?.data || [];

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        <Button mode="outlined" onPress={() => markAllRead()}>
          Mark all as read
        </Button>
      }
      data={rows}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.title}>
              {item.notification?.title || item.title}
            </Text>
            <Text style={styles.sub}>
              {item.notification?.body || item.body}
            </Text>
          </Card.Content>
        </Card>
      )}
      ListEmptyComponent={<Text style={styles.empty}>No notifications</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  listContent: { padding: 12 },
  card: { backgroundColor: '#151520', marginTop: 10 },
  title: { color: '#F2F2F2' },
  sub: { color: '#AFAFBA', marginTop: 4 },
  empty: { color: '#AFAFBA', textAlign: 'center', marginTop: 24 },
});
