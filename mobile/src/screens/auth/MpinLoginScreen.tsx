import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, TextInput, Card, Snackbar } from 'react-native-paper';
import { useLoginWithMpinMutation } from '@/store/services/authApi';
import { useAppDispatch } from '@/hooks/redux';
import { setAuth } from '@/store/slices/authSlice';
import { getErrorMessage } from '@/lib/error-message';

export default function MpinLoginScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('');
  const [mpin, setMpin] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [loginWithMpin, { isLoading }] = useLoginWithMpinMutation();

  const onSubmit = async () => {
    try {
      const res = await loginWithMpin({ email, mpin }).unwrap();
      dispatch(setAuth(res.data));
    } catch (e) {
      setSnackbarMessage(getErrorMessage(e, 'MPIN login failed. Please try again.'));
      setSnackbarVisible(true);
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            MPIN Login
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
            label="6-digit MPIN"
            keyboardType="number-pad"
            secureTextEntry
            value={mpin}
            onChangeText={setMpin}
            style={styles.input}
            maxLength={6}
          />
          <Button mode="contained" onPress={onSubmit} loading={isLoading}>
            Login
          </Button>
          <Button onPress={() => navigation.navigate('ForgotMpin')}>
            Forgot MPIN
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
