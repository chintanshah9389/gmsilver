import React from 'react';
import { FlatList, Linking, StyleSheet } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { useInvoicesQuery } from '@/store/services/ordersApi';

export default function InvoicesScreen() {
  const { data } = useInvoicesQuery();
  const invoices = data?.data || [];

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.listContent}
      data={invoices}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.title}>{item.invoiceNumber}</Text>
            <Text style={styles.sub}>{item.order?.orderNumber}</Text>
            <Button mode="text" onPress={() => Linking.openURL(item.pdfUrl)}>
              Open PDF
            </Button>
          </Card.Content>
        </Card>
      )}
      ListEmptyComponent={
        <Text style={styles.empty}>No invoices available</Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  listContent: { padding: 12 },
  card: { backgroundColor: '#151520', marginBottom: 10 },
  title: { color: '#F2F2F2' },
  sub: { color: '#AFAFBA', marginTop: 4 },
  empty: { color: '#AFAFBA', textAlign: 'center', marginTop: 24 },
});
