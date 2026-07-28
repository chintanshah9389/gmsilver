import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, TextInput, Card } from 'react-native-paper';
import { useLoginMutation } from '@/store/services/authApi';
import { useAppDispatch } from '@/hooks/redux';
import { setAuth } from '@/store/slices/authSlice';

export default function LoginScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [login, { isLoading }] = useLoginMutation();

  const onLogin = async () => {
    try {
      const res = await login({ email, password }).unwrap();
      dispatch(setAuth(res.data));
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            Sign In
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
            label="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />
          <Button mode="contained" onPress={onLogin} loading={isLoading}>
            Login
          </Button>
          <Button onPress={() => navigation.navigate('MpinLogin')}>
            Login with MPIN
          </Button>
          <Button onPress={() => navigation.navigate('Signup')}>
            Create Account
          </Button>
          <Button onPress={() => navigation.navigate('ForgotPassword')}>
            Forgot Password
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
