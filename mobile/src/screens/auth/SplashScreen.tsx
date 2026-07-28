import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';

export default function SplashScreen({ navigation }: any) {
  useEffect(() => {
    const t = setTimeout(() => navigation.replace('Login'), 1200);
    return () => clearTimeout(t);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>GS</Text>
      </View>
      <Text variant="headlineMedium" style={styles.title}>
        GM Silver
      </Text>
      <Text style={styles.subtitle}>B2B Silver Catalog Platform</Text>
      <ActivityIndicator style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#C0C0C0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { color: '#0A0A0F', fontSize: 28, fontWeight: '800' },
  title: { color: '#F2F2F2', marginTop: 18 },
  subtitle: { color: '#AFAFBA', marginTop: 6 },
  loader: { marginTop: 24 },
});
