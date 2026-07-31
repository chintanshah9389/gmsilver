import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Text, TextInput, Snackbar } from 'react-native-paper';
import { useCreateOrderMutation } from '@/store/services/ordersApi';
import { getErrorMessage } from '@/lib/error-message';
import PremiumBackground from '@/components/PremiumBackground';
import { C } from '@/theme/colors';
import { E } from '@/theme/effects';

export default function CheckoutScreen({ navigation }: any) {
  const [notes, setNotes] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [createOrder, { isLoading }] = useCreateOrderMutation();

  const onPlaceOrder = async () => {
    try {
      await createOrder({ notes }).unwrap();
      navigation.navigate('Order', { screen: 'Orders' });
    } catch (e) {
      setSnackbarMessage(getErrorMessage(e, 'Failed to place order.'));
      setSnackbarVisible(true);
    }
  };

  return (
    <View style={styles.container}>
      <PremiumBackground />
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            Checkout
          </Text>
          <TextInput
            mode="outlined"
            label="Order Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            multiline
            style={styles.input}
          />
          <Button mode="contained" onPress={onPlaceOrder} loading={isLoading}>
            Place Order
          </Button>
        </Card.Content>
      </Card>

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
  container: { flex: 1, backgroundColor: C.bg, padding: 12 },
  card: { backgroundColor: 'rgba(255,255,255,0.8)', borderColor: C.border, borderWidth: 1, ...E.softShadow },
  title: { color: C.text, marginBottom: 12 },
  input: { marginBottom: 12 },
});
