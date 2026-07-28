import React, { useEffect, useState } from 'react';
import { FlatList, Linking, StyleSheet } from 'react-native';
import { Button, Card, Text, Snackbar } from 'react-native-paper';
import { useInvoicesQuery } from '@/store/services/ordersApi';
import { getErrorMessage } from '@/lib/error-message';

export default function InvoicesScreen() {
  const { data, error, isError } = useInvoicesQuery();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const invoices = data?.data || [];

  useEffect(() => {
    if (isError && error) {
      setSnackbarMessage(getErrorMessage(error, 'Failed to load invoices.'));
      setSnackbarVisible(true);
    }
  }, [error, isError]);

  return (
    <>
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

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={4000}
      >
        {snackbarMessage}
      </Snackbar>
    </>
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
