// Simple redirect component
import { router } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

const LiveCarpoolMapScreen = () => {
  useEffect(() => {
    router.replace('/route-carpool');
  }, []);

  return <View />;
};

export default LiveCarpoolMapScreen;