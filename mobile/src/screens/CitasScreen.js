import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Avatar from '../components/Avatar';
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
import {
  diaYMes,
  esProxima,
  etiquetaEstado,
  fechaLarga,
  hora12,
  nombrePaciente,
} from '../utils/format';

const TABS = [
  { valor: 'proximas', etiqueta: 'Próximas' },
  { valor: 'historial', etiqueta: 'Historial' },
];

export default function CitasScreen({ navigation }) {
  const { tema } = useTema();
  const insets = useSafeAreaInsets();

  const [citas, setCitas] = useState([]);
  const [tab, setTab] = useState('proximas');
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(async (esRefresco = false) => {
    esRefresco ? setRefrescando(true) : setCargando(true);
    setError('');
    try {
      setCitas(await citasApi.listar({ limit: 300 }));
    } catch (e) {
      setError(mensajeDeError(e, 'No se pudo cargar la agenda'));
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  // Agrupa las citas por fecha para el SectionList.
  const secciones = useMemo(() => {
    const filtradas = citas
      .filter((c) => (tab === 'proximas' ? esProxima(c.fecha) : !esProxima(c.fecha)))
      .sort((a, b) => {
        const cmp = a.fecha.localeCompare(b.fecha);
        return tab === 'proximas' ? cmp || a.hora.localeCompare(b.hora) : -cmp || 0;
      });

    const mapa = new Map();
    filtradas.forEach((cita) => {
      if (!mapa.has(cita.fecha)) mapa.set(cita.fecha, []);
      mapa.get(cita.fecha).push(cita);
    });

    return [...mapa.entries()].map(([fecha, data]) => ({ title: fecha, data }));
  }, [citas, tab]);

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
          <View style={styles.citaTitulo}>
            <Avatar
              uri={item.paciente?.foto_url}
              nombre={nombrePaciente(item.paciente)}
              size={22}
            />
            <Text style={{ color: tema.texto, fontSize: 14, fontWeight: '700', flex: 1 }} numberOfLines={1}>
              {nombrePaciente(item.paciente)}
            </Text>
          </View>
          <Text style={{ color: tema.textoSuave, fontSize: 12.5, marginTop: 4 }} numberOfLines={1}>
            {item.motivo}
          </Text>
          <Text style={{ color: tema.textoTenue, fontSize: 11.5, marginTop: 1 }}>
            {item.consultorio || 'Sin consultorio'}
          </Text>
        </View>

        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <Text style={{ color: tema.texto, fontSize: 12.5, fontWeight: '700' }}>
            {hora12(item.hora)}
          </Text>
          <Etiqueta texto={etiquetaEstado(item.estado)} color={colorEstado(item.estado)} />
        </View>
      </Tarjeta>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: tema.fondo, paddingTop: insets.top + 8 }}>
      <Text style={[styles.titulo, { color: tema.texto }]}>Citas</Text>

      <Tabs
        opciones={TABS}
        activo={tab}
        onCambiar={setTab}
        style={{ marginHorizontal: 18, marginBottom: 14 }}
      />

      {cargando ? (
        <Cargando texto="Cargando citas..." />
      ) : error ? (
        <EstadoError mensaje={error} onReintentar={() => cargar()} />
      ) : (
        <SectionList
          sections={secciones}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderCita}
          renderSectionHeader={({ section }) => (
            <Text style={[styles.seccion, { color: tema.textoSuave, backgroundColor: tema.fondo }]}>
              {fechaLarga(section.title)}
            </Text>
          )}
          contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 120 }}
          stickySectionHeadersEnabled={false}
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
                  ? 'Agenda una cita con el botón +.'
                  : 'Aquí aparecerán las citas ya pasadas.'
              }
            />
          }
        />
      )}

      <Pressable
        onPress={() => navigation.navigate('CitaForm', {})}
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
  titulo: { fontSize: 24, fontWeight: '800', paddingHorizontal: 18, marginBottom: 14 },
  seccion: { fontSize: 12, fontWeight: '700', paddingVertical: 8, textTransform: 'uppercase' },

  cita: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  citaTitulo: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  fecha: {
    width: 52,
    height: 56,
    borderRadius: radios.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 96,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
