import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CircleDashBoardScreen = () => {
  return (
    <SafeAreaView style={styles.container} edges={['top','bottom']}>
      <Text style={styles.text}>Circle Dashboard</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default CircleDashBoardScreen;
