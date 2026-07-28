import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, TextInput, Button } from 'react-native-paper';
import { useForgotMpinMutation } from '@/store/services/authApi';

export default function ForgotMpinScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [forgotMpin, { isLoading }] = useForgotMpinMutation();

  const onSubmit = async () => {
    const res = await forgotMpin({ email }).unwrap();
    navigation.navigate('ResetMpin', { email, token: res.data?.resetToken });
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            Forgot MPIN
          </Text>
          <TextInput
            mode="outlined"
            label="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
          />
          <Button mode="contained" onPress={onSubmit} loading={isLoading}>
            Send Reset Token
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
