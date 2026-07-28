import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, TextInput, Button, Snackbar } from 'react-native-paper';
import { useResetPasswordMutation } from '@/store/services/authApi';
import { getErrorMessage } from '@/lib/error-message';

export default function ResetPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const onSubmit = async () => {
    try {
      await resetPassword({
        email,
        token,
        newPassword,
        confirmPassword,
      }).unwrap();
      navigation.navigate('Login');
    } catch (e) {
      setSnackbarMessage(getErrorMessage(e, 'Password reset failed.'));
      setSnackbarVisible(true);
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            Reset Password
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
            secureTextEntry
            label="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            style={styles.input}
          />
          <TextInput
            mode="outlined"
            secureTextEntry
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            style={styles.input}
          />
          <Button mode="contained" onPress={onSubmit} loading={isLoading}>
            Reset Password
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
