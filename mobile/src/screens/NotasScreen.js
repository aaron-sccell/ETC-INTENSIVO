import React, { useCallback, useLayoutEffect, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { Cargando, EstadoError, EstadoVacio, Tarjeta } from '../components/UI';
import { mensajeDeError } from '../api/client';
import { notasApi } from '../api/services';
import { useTema } from '../context/ThemeContext';
import { sombraTarjeta } from '../theme/theme';
import { fechaLarga } from '../utils/format';

export default function NotasScreen({ navigation, route }) {
  const { tema } = useTema();
  const { pacienteId, nombre } = route.params;

  const [notas, setNotas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Notas médicas' });
  }, [navigation]);

  const cargar = useCallback(
    async (esRefresco = false) => {
      esRefresco ? setRefrescando(true) : setCargando(true);
      setError('');
      try {
        setNotas(await notasApi.porPaciente(pacienteId));
      } catch (e) {
        setError(mensajeDeError(e, 'No se pudieron cargar las notas'));
      } finally {
        setCargando(false);
        setRefrescando(false);
      }
    },
    [pacienteId],
  );

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  const eliminar = (nota) => {
    Alert.alert('Eliminar nota', '¿Seguro que quieres eliminar esta nota médica?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await notasApi.eliminar(nota.id);
            cargar();
          } catch (e) {
            Alert.alert('Error', mensajeDeError(e, 'No se pudo eliminar la nota'));
          }
        },
      },
    ]);
  };

  const renderNota = ({ item }) => (
    <Tarjeta
      style={{ marginBottom: 10 }}
      onPress={() => navigation.navigate('NotaForm', { pacienteId, nota: item })}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: tema.texto, fontSize: 13.5, fontWeight: '700' }}>
            {fechaLarga(item.fecha)}
          </Text>
          <Text style={{ color: tema.primario, fontSize: 11.5, marginTop: 2 }}>
            {item.doctor?.nombre || 'Doctor'}
          </Text>
        </View>
        <Pressable onPress={() => eliminar(item)} hitSlop={10}>
          <Ionicons name="trash-outline" size={18} color={tema.textoTenue} />
        </Pressable>
      </View>

      {item.titulo ? (
        <Text style={{ color: tema.texto, fontSize: 13.5, fontWeight: '600', marginTop: 10 }}>
          {item.titulo}
        </Text>
      ) : null}
      <Text style={{ color: tema.textoSuave, fontSize: 13, lineHeight: 19.5, marginTop: 4 }}>
        {item.contenido}
      </Text>
    </Tarjeta>
  );

  return (
    <View style={{ flex: 1, backgroundColor: tema.fondo }}>
      {nombre ? (
        <Text style={[styles.subtitulo, { color: tema.textoSuave }]}>{nombre}</Text>
      ) : null}

      {cargando ? (
        <Cargando />
      ) : error ? (
        <EstadoError mensaje={error} onReintentar={() => cargar()} />
      ) : (
        <FlatList
          data={notas}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderNota}
          contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={() => cargar(true)}
              tintColor={tema.primario}
            />
          }
          ListEmptyComponent={
            <EstadoVacio
              icono="document-text-outline"
              titulo="Sin notas médicas"
              texto="Registra la primera nota con el botón +."
            />
          }
        />
      )}

      <Pressable
        onPress={() => navigation.navigate('NotaForm', { pacienteId })}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: tema.primario, opacity: pressed ? 0.85 : 1 },
          sombraTarjeta(tema),
        ]}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  subtitulo: { fontSize: 13, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 10 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
