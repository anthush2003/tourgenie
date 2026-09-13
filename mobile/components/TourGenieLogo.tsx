import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Compass } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';

export default function TourGenieLogo({ size = 40 }: { size?: number }) {
  const ringInset = Math.max(2, Math.round(size * 0.075));
  return (
    <View style={{ width: size, height: size }}>
      <LinearGradient
        colors={[Colors.sunset400, Colors.sunset600]}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
      <View
        style={[
          styles.inner,
          {
            top: ringInset, left: ringInset, right: ringInset, bottom: ringInset,
            borderRadius: (size - ringInset * 2) / 2,
          },
        ]}
      >
        <Compass size={size * 0.5} color={Colors.leaf700} strokeWidth={1.75} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inner: {
    position: 'absolute',
    backgroundColor: Colors.sand50,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
