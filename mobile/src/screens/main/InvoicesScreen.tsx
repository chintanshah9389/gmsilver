import React, { useEffect, useState } from 'react';
import { FlatList, Linking, StyleSheet, View } from 'react-native';
import { Button, Card, Text, Snackbar } from 'react-native-paper';
import { useInvoicesQuery } from '@/store/services/ordersApi';
import { getErrorMessage } from '@/lib/error-message';
import PremiumBackground from '@/components/PremiumBackground';
import { C } from '@/theme/colors';
import { E } from '@/theme/effects';

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
    <View style={styles.root}>
      <PremiumBackground />
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, backgroundColor: 'transparent' },
  listContent: { padding: 12 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderColor: C.border,
    borderWidth: 1,
    marginBottom: 10,
    ...E.softShadow,
  },
  title: { color: C.text },
  sub: { color: C.textSub, marginTop: 4 },
  empty: { color: C.textSub, textAlign: 'center', marginTop: 24 },
});
