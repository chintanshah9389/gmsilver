import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, TextInput, Button, Snackbar } from 'react-native-paper';
import { useCreateMpinMutation } from '@/store/services/authApi';
import { getErrorMessage } from '@/lib/error-message';

export default function CreateMpinScreen() {
  const [mpin, setMpin] = useState('');
  const [confirmMpin, setConfirmMpin] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [createMpin, { isLoading }] = useCreateMpinMutation();

  const onSave = async () => {
    try {
      await createMpin({ mpin, confirmMpin }).unwrap();
    } catch (e) {
      setSnackbarMessage(getErrorMessage(e, 'Failed to create MPIN.'));
      setSnackbarVisible(true);
    }
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
