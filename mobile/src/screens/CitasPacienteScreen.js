import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import {
  Cargando,
  EstadoError,
  EstadoVacio,
  Etiqueta,
  Tabs,
  Tarjeta,
  colorEstado,
} from '../components/UI';
import { mensajeDeError } from '../api/client';
import { citasApi } from '../api/services';
import { useTema } from '../context/ThemeContext';
import { radios, sombraTarjeta } from '../theme/theme';
import { diaYMes, esProxima, etiquetaEstado, fechaLarga, hora12 } from '../utils/format';

const TABS = [
  { valor: 'proximas', etiqueta: 'Próximas' },
  { valor: 'historial', etiqueta: 'Historial' },
];

export default function CitasPacienteScreen({ navigation, route }) {
  const { tema } = useTema();
  const { pacienteId, nombre } = route.params;

  const [citas, setCitas] = useState([]);
  const [tab, setTab] = useState('proximas');
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ title: `Citas de ${nombre || 'paciente'}` });
  }, [navigation, nombre]);

  const cargar = useCallback(
    async (esRefresco = false) => {
      esRefresco ? setRefrescando(true) : setCargando(true);
      setError('');
      try {
        setCitas(await citasApi.porPaciente(pacienteId));
      } catch (e) {
        setError(mensajeDeError(e, 'No se pudieron cargar las citas'));
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

  const visibles = useMemo(
    () =>
      citas
        .filter((c) => (tab === 'proximas' ? esProxima(c.fecha) : !esProxima(c.fecha)))
        .sort((a, b) =>
          tab === 'proximas' ? a.fecha.localeCompare(b.fecha) : b.fecha.localeCompare(a.fecha),
        ),
    [citas, tab],
  );

  const renderCita = ({ item }) => {
    const { dia, mes } = diaYMes(item.fecha);
    return (
      <Tarjeta style={styles.cita} onPress={() => navigation.navigate('CitaForm', { cita: item })}>
        <View
          style={[
            styles.fecha,
            { backgroundColor: tab === 'proximas' ? tema.primario : tema.superficieAlt },
          ]}
        >
          <Text
            style={{
              color: tab === 'proximas' ? '#FFF' : tema.textoSuave,
              fontSize: 10,
              fontWeight: '700',
            }}
          >
            {mes}
          </Text>
          <Text
            style={{
              color: tab === 'proximas' ? '#FFF' : tema.texto,
              fontSize: 18,
              fontWeight: '800',
            }}
          >
            {dia}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.filaSuperior}>
            <Text style={{ color: tema.texto, fontSize: 13.5, fontWeight: '700', flex: 1 }}>
              {fechaLarga(item.fecha)}
            </Text>
            <Text style={{ color: tema.textoSuave, fontSize: 12, fontWeight: '600' }}>
              {hora12(item.hora)}
            </Text>
          </View>
          <Text style={{ color: tema.textoSuave, fontSize: 13, marginTop: 4 }} numberOfLines={1}>
            {item.motivo}
          </Text>
          <View style={styles.filaInferior}>
            <Text style={{ color: tema.textoTenue, fontSize: 11.5 }}>
              {item.consultorio || 'Sin consultorio'}
            </Text>
            <Etiqueta texto={etiquetaEstado(item.estado)} color={colorEstado(item.estado)} />
          </View>
        </View>
      </Tarjeta>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: tema.fondo }}>
      <Tabs
        opciones={TABS}
        activo={tab}
        onCambiar={setTab}
        style={{ margin: 18, marginBottom: 12 }}
      />

      {cargando ? (
        <Cargando />
      ) : error ? (
        <EstadoError mensaje={error} onReintentar={() => cargar()} />
      ) : (
        <FlatList
          data={visibles}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderCita}
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
              icono="calendar-outline"
              titulo={tab === 'proximas' ? 'Sin citas próximas' : 'Sin historial'}
              texto={
                tab === 'proximas'
                  ? 'Agenda una nueva cita con el botón +.'
                  : 'Todavía no hay citas pasadas para este paciente.'
              }
            />
          }
        />
      )}

      <Pressable
        onPress={() => navigation.navigate('CitaForm', { pacienteId })}
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
  cita: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  fecha: {
    width: 52,
    height: 56,
    borderRadius: radios.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filaSuperior: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filaInferior: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
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
