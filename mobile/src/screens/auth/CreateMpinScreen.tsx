import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, TextInput, Button } from 'react-native-paper';
import { useCreateMpinMutation } from '@/store/services/authApi';

export default function CreateMpinScreen() {
  const [mpin, setMpin] = useState('');
  const [confirmMpin, setConfirmMpin] = useState('');
  const [createMpin, { isLoading }] = useCreateMpinMutation();

  const onSave = async () => {
    await createMpin({ mpin, confirmMpin }).unwrap();
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            Create MPIN
          </Text>
          <TextInput
            mode="outlined"
            label="MPIN"
            secureTextEntry
            keyboardType="number-pad"
            maxLength={6}
            value={mpin}
            onChangeText={setMpin}
            style={styles.input}
          />
          <TextInput
            mode="outlined"
            label="Confirm MPIN"
            secureTextEntry
            keyboardType="number-pad"
            maxLength={6}
            value={confirmMpin}
            onChangeText={setConfirmMpin}
            style={styles.input}
          />
          <Button mode="contained" onPress={onSave} loading={isLoading}>
            Save MPIN
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    justifyContent: 'center',
    padding: 16,
  },
  card: { backgroundColor: '#151520' },
  title: { color: '#F2F2F2', marginBottom: 16 },
  input: { marginBottom: 12 },
});
