import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, TextInput, Button, Snackbar } from 'react-native-paper';
import { useResetMpinMutation } from '@/store/services/authApi';
import { getErrorMessage } from '@/lib/error-message';

export default function ResetMpinScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newMpin, setNewMpin] = useState('');
  const [confirmMpin, setConfirmMpin] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [resetMpin, { isLoading }] = useResetMpinMutation();

  const onSubmit = async () => {
    try {
      await resetMpin({ email, token, newMpin, confirmMpin }).unwrap();
      navigation.navigate('MpinLogin');
    } catch (e) {
      setSnackbarMessage(getErrorMessage(e, 'MPIN reset failed.'));
      setSnackbarVisible(true);
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            Reset MPIN
          </Text>
          <TextInput
            mode="outlined"
            label="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
          />
          <TextInput
            mode="outlined"
            label="Reset Token"
            value={token}
            onChangeText={setToken}
            style={styles.input}
          />
          <TextInput
            mode="outlined"
            label="New MPIN"
            secureTextEntry
            keyboardType="number-pad"
            maxLength={6}
            value={newMpin}
            onChangeText={setNewMpin}
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
          <Button mode="contained" onPress={onSubmit} loading={isLoading}>
            Reset MPIN
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
