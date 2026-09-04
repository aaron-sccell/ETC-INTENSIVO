import React, { useCallback, useLayoutEffect, useState } from 'react';
import { Alert, Image, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { Boton, Campo, Cargando, EstadoVacio, Tarjeta } from '../components/UI';
import { mensajeDeError } from '../api/client';
import { pacientesApi } from '../api/services';
import { useTema } from '../context/ThemeContext';
import { radios } from '../theme/theme';
import { fechaCorta } from '../utils/format';

/**
 * Fotos del expediente.
 *
 * El proyecto no incluye servidor de archivos, así que se guarda la URL de la
 * imagen. Se puede escribir una URL pública o elegir una foto del dispositivo
 * (en ese caso se guarda la ruta local, visible en ese mismo dispositivo).
 */
export default function FotosScreen({ navigation, route }) {
  const { tema } = useTema();
  const { pacienteId, nombre } = route.params;

  const [fotos, setFotos] = useState([]);
  const [url, setUrl] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Fotos del expediente' });
  }, [navigation]);

  const cargar = useCallback(
    async (esRefresco = false) => {
      esRefresco ? setRefrescando(true) : setCargando(true);
      setError('');
      try {
        setFotos(await pacientesApi.fotos(pacienteId));
      } catch (e) {
        setError(mensajeDeError(e, 'No se pudieron cargar las fotos'));
      } finally {
        setCargando(false);
        setRefrescando(false);
      }
    },
    [pacienteId],
  );

  React.useEffect(() => {
    cargar();
  }, [cargar]);

  const elegirDeGaleria = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a tus fotos para adjuntar imágenes.');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });

    if (!resultado.canceled && resultado.assets?.length) {
      setUrl(resultado.assets[0].uri);
    }
  };

  const guardar = async () => {
    if (!url.trim()) {
      setError('Escribe una URL o elige una imagen de la galería');
      return;
    }

    setGuardando(true);
    try {
      await pacientesApi.agregarFoto(pacienteId, {
        url: url.trim(),
        descripcion: descripcion.trim() || null,
      });
      setUrl('');
      setDescripcion('');
      setError('');
      cargar();
    } catch (e) {
      setError(mensajeDeError(e, 'No se pudo guardar la foto'));
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return <Cargando />;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: tema.fondo }}
      contentContainerStyle={{ padding: 18, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refrescando}
          onRefresh={() => cargar(true)}
          tintColor={tema.primario}
        />
      }
    >
      {nombre ? (
        <Text style={{ color: tema.textoSuave, fontSize: 13, marginBottom: 14 }}>{nombre}</Text>
      ) : null}

      <Tarjeta style={{ marginBottom: 20 }}>
        <Text style={{ color: tema.texto, fontSize: 15, fontWeight: '700', marginBottom: 12 }}>
          Agregar imagen
        </Text>

        <Campo
          etiqueta="URL de la imagen"
          icono="link-outline"
          placeholder="https://..."
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
        />
        <Campo
          etiqueta="Descripción"
          placeholder="Radiografía de tórax"
          value={descripcion}
          onChangeText={setDescripcion}
        />

        <Boton
          titulo="Elegir de la galería"
          icono="images-outline"
          variante="secundario"
          onPress={elegirDeGaleria}
          style={{ marginBottom: 10 }}
        />
        <Boton titulo="Guardar foto" onPress={guardar} cargando={guardando} />

        {error ? (
          <Text style={{ color: tema.peligro, fontSize: 12.5, marginTop: 10 }}>{error}</Text>
        ) : null}
      </Tarjeta>

      {fotos.length === 0 ? (
        <EstadoVacio
          icono="images-outline"
          titulo="Sin fotos"
          texto="Aquí aparecerán los estudios e imágenes del paciente."
        />
      ) : (
        <View style={styles.galeria}>
          {fotos.map((foto) => (
            <View key={foto.id} style={styles.item}>
              <Image
                source={{ uri: foto.url }}
                style={[styles.foto, { backgroundColor: tema.superficieAlt }]}
              />
              <Text style={{ color: tema.texto, fontSize: 12, fontWeight: '600', marginTop: 6 }} numberOfLines={2}>
                {foto.descripcion || 'Sin descripción'}
              </Text>
              <Text style={{ color: tema.textoTenue, fontSize: 10.5 }}>
                {foto.created_at ? fechaCorta(foto.created_at.slice(0, 10)) : ''}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  galeria: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  item: { width: '47%' },
  foto: { width: '100%', aspectRatio: 1, borderRadius: radios.md },
});
