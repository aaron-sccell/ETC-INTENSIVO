import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { useTema } from '../context/ThemeContext';
import { iniciales } from '../utils/format';

/** Avatar circular: muestra la foto y, si falla o no existe, las iniciales. */
export default function Avatar({ uri, nombre = '', size = 48, style }) {
  const { tema } = useTema();
  const [falloImagen, setFalloImagen] = useState(false);

  const dimension = { width: size, height: size, borderRadius: size / 2 };

  if (uri && !falloImagen) {
    return (
      <Image
        source={{ uri }}
        style={[dimension, { backgroundColor: tema.superficieAlt }, style]}
        onError={() => setFalloImagen(true)}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        dimension,
        { backgroundColor: tema.primarioSuave },
        style,
      ]}
    >
      <Text style={{ color: tema.primario, fontWeight: '700', fontSize: size * 0.36 }}>
        {iniciales(nombre) || '?'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
});
