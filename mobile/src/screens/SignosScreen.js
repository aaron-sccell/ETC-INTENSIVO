import React, { useCallback, useLayoutEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import GraficaLinea, { prepararSeries } from '../components/GraficaLinea';
import { Cargando, EstadoError, EstadoVacio, Tarjeta } from '../components/UI';
import { mensajeDeError } from '../api/client';
import { signosApi } from '../api/services';
import { useTema } from '../context/ThemeContext';
import { radios, sombraTarjeta } from '../theme/theme';
import { fechaLarga } from '../utils/format';

export default function SignosScreen({ navigation, route }) {
  const { tema } = useTema();
  const { pacienteId, nombre } = route.params;

  const [signos, setSignos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Signos vitales' });
  }, [navigation]);

  const cargar = useCallback(
    async (esRefresco = false) => {
      esRefresco ? setRefrescando(true) : setCargando(true);
      setError('');
      try {
        setSignos(await signosApi.porPaciente(pacienteId));
      } catch (e) {
        setError(mensajeDeError(e, 'No se pudieron cargar los signos vitales'));
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

  const eliminar = (signo) => {
    Alert.alert('Eliminar registro', '¿Eliminar este registro de signos vitales?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await signosApi.eliminar(signo.id);
            cargar();
          } catch (e) {
            Alert.alert('Error', mensajeDeError(e, 'No se pudo eliminar el registro'));
          }
        },
      },
    ]);
  };

  if (cargando) return <Cargando />;
  if (error) return <EstadoError mensaje={error} onReintentar={() => cargar()} />;

  const { series, etiquetas } = prepararSeries(signos, tema);
  const recientes = [...signos].reverse();

  return (
    <View style={{ flex: 1, backgroundColor: tema.fondo }}>
      <ScrollView
        contentContainerStyle={{ padding: 18, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={() => cargar(true)}
            tintColor={tema.primario}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {nombre ? (
          <Text style={{ color: tema.textoSuave, fontSize: 13, marginBottom: 14 }}>{nombre}</Text>
        ) : null}

        {/* Gráfica */}
        <Tarjeta style={{ marginBottom: 18 }}>
          <Text style={{ color: tema.texto, fontSize: 15, fontWeight: '700' }}>Historial</Text>
          <Text style={{ color: tema.textoSuave, fontSize: 11.5, marginBottom: 8 }}>
            Últimos registros
          </Text>
          <GraficaLinea series={series} etiquetas={etiquetas} />
        </Tarjeta>

        {/* Lista de registros */}
        {recientes.length === 0 ? (
          <EstadoVacio
            icono="pulse-outline"
            titulo="Sin registros"
            texto="Agrega el primer registro de peso y presión con el botón +."
          />
        ) : (
          recientes.map((s) => (
            <Tarjeta key={s.id} style={{ marginBottom: 10 }}>
              <View style={styles.header}>
                <Text style={{ color: tema.texto, fontSize: 13.5, fontWeight: '700', flex: 1 }}>
                  {fechaLarga(s.fecha)}
                </Text>
                <Pressable onPress={() => eliminar(s)} hitSlop={10}>
                  <Ionicons name="trash-outline" size={17} color={tema.textoTenue} />
                </Pressable>
              </View>

              <View style={styles.medidas}>
                <Medida
                  icono="barbell-outline"
                  etiqueta="Peso"
                  valor={s.peso != null ? `${Number(s.peso)}` : '—'}
                  unidad="kg"
                />
                <Medida
                  icono="heart-outline"
                  etiqueta="Presión"
                  valor={s.presion || '—'}
                  unidad="mmHg"
                />
                <Medida
                  icono="thermometer-outline"
                  etiqueta="Temp."
                  valor={s.temperatura != null ? `${Number(s.temperatura)}` : '—'}
                  unidad="°C"
                />
                <Medida
                  icono="pulse-outline"
                  etiqueta="FC"
                  valor={s.frecuencia_cardiaca != null ? `${s.frecuencia_cardiaca}` : '—'}
                  unidad="lpm"
                />
              </View>

              {s.notas ? (
                <Text style={{ color: tema.textoSuave, fontSize: 12.5, marginTop: 10 }}>
                  {s.notas}
                </Text>
              ) : null}
            </Tarjeta>
          ))
        )}
      </ScrollView>

      <Pressable
        onPress={() => navigation.navigate('SignoForm', { pacienteId })}
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

function Medida({ icono, etiqueta, valor, unidad }) {
  const { tema } = useTema();
  return (
    <View style={[styles.medida, { backgroundColor: tema.superficieAlt }]}>
      <Ionicons name={icono} size={15} color={tema.primario} />
      <Text style={{ color: tema.textoTenue, fontSize: 10.5, marginTop: 3 }}>{etiqueta}</Text>
      <Text style={{ color: tema.texto, fontSize: 14, fontWeight: '800', marginTop: 1 }}>
        {valor}
      </Text>
      <Text style={{ color: tema.textoTenue, fontSize: 9.5 }}>{unidad}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  medidas: { flexDirection: 'row', gap: 8 },
  medida: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radios.md,
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
