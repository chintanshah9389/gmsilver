import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { logout } from '@/store/slices/authSlice';

export default function ProfileScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            {user?.name || 'User'}
          </Text>
          <Text style={styles.sub}>{user?.email}</Text>
          <Button
            mode="outlined"
            style={styles.btn}
            onPress={() => navigation.navigate('Orders')}
          >
            My Orders
          </Button>
          <Button
            mode="outlined"
            style={styles.btn}
            onPress={() => navigation.navigate('Invoices')}
          >
            My Invoices
          </Button>
          <Button
            mode="outlined"
            style={styles.btn}
            onPress={() => navigation.navigate('Notifications')}
          >
            Notifications
          </Button>
          <Button
            mode="outlined"
            style={styles.btn}
            onPress={() => navigation.navigate('Settings')}
          >
            Settings
          </Button>
          <Button
            mode="contained"
            style={styles.btn}
            onPress={() => dispatch(logout())}
          >
            Logout
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F', padding: 12 },
  card: { backgroundColor: '#151520' },
  title: { color: '#F2F2F2' },
  sub: { color: '#AFAFBA', marginTop: 4 },
  btn: { marginTop: 10 },
});
