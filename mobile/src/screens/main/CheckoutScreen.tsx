import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Text, TextInput } from 'react-native-paper';
import { useCreateOrderMutation } from '@/store/services/ordersApi';

export default function CheckoutScreen({ navigation }: any) {
  const [notes, setNotes] = useState('');
  const [createOrder, { isLoading }] = useCreateOrderMutation();

  const onPlaceOrder = async () => {
    await createOrder({ notes }).unwrap();
    navigation.navigate('Orders');
  };

  return (
    <View style={styles.container}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F', padding: 12 },
  card: { backgroundColor: '#151520' },
  title: { color: '#F2F2F2', marginBottom: 12 },
  input: { marginBottom: 12 },
});
