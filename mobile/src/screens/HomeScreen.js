import React, { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Avatar from '../components/Avatar';
import { Cargando, EstadoError, EstadoVacio, Etiqueta, Tarjeta, colorEstado } from '../components/UI';
import { mensajeDeError } from '../api/client';
import { citasApi, pacientesApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/ThemeContext';
import { radios, sombraTarjeta } from '../theme/theme';
import { etiquetaEstado, hora12, nombrePaciente } from '../utils/format';

const ACCESOS = [
  { id: 'pacientes', titulo: 'Pacientes', sub: 'Ver todos', icono: 'people', destino: 'PacientesTab' },
  { id: 'citas', titulo: 'Citas', sub: 'Ver agenda', icono: 'calendar', destino: 'CitasTab' },
  { id: 'notas', titulo: 'Notas', sub: 'Ver registros', icono: 'document-text', destino: 'PacientesTab' },
  { id: 'ajustes', titulo: 'Ajustes', sub: 'Configuración', icono: 'settings', destino: 'PerfilTab' },
];

export default function HomeScreen({ navigation }) {
  const { tema } = useTema();
  const { usuario } = useAuth();
  const insets = useSafeAreaInsets();

  const [citas, setCitas] = useState([]);
  const [totalPacientes, setTotalPacientes] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(async (esRefresco = false) => {
    esRefresco ? setRefrescando(true) : setCargando(true);
    setError('');
    try {
      const [proximas, pacientes] = await Promise.all([
        citasApi.proximas(20),
        pacientesApi.listar(),
      ]);
      setCitas(proximas);
      setTotalPacientes(pacientes.length);
    } catch (e) {
      setError(mensajeDeError(e, 'No se pudieron cargar los datos del inicio'));
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

  const primerNombre = (usuario?.nombre || '').split(' ').slice(0, 2).join(' ');
  const citasDeHoy = citas.filter((c) => c.fecha === new Date().toISOString().slice(0, 10));

  if (cargando) return <Cargando texto="Cargando tu agenda..." />;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: tema.fondo }}
      contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: 110 }}
      refreshControl={
        <RefreshControl
          refreshing={refrescando}
          onRefresh={() => cargar(true)}
          tintColor={tema.primario}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Saludo */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.saludo, { color: tema.texto }]}>
            Hola, {primerNombre || 'Doctor'} 👋
          </Text>
          <Text style={{ color: tema.textoSuave, fontSize: 13, marginTop: 2 }}>
            ¿Qué deseas hacer hoy?
          </Text>
        </View>
        <Pressable onPress={() => navigation.navigate('PerfilTab')}>
          <Avatar uri={usuario?.avatar_url} nombre={usuario?.nombre} size={44} />
        </Pressable>
      </View>

      {/* Resumen */}
      <View style={styles.resumen}>
        <Tarjeta style={styles.resumenTarjeta}>
          <Text style={[styles.resumenNumero, { color: tema.primario }]}>{totalPacientes}</Text>
          <Text style={{ color: tema.textoSuave, fontSize: 12 }}>Pacientes</Text>
        </Tarjeta>
        <Tarjeta style={styles.resumenTarjeta}>
          <Text style={[styles.resumenNumero, { color: tema.exito }]}>{citasDeHoy.length}</Text>
          <Text style={{ color: tema.textoSuave, fontSize: 12 }}>Citas hoy</Text>
        </Tarjeta>
        <Tarjeta style={styles.resumenTarjeta}>
          <Text style={[styles.resumenNumero, { color: tema.aviso }]}>{citas.length}</Text>
          <Text style={{ color: tema.textoSuave, fontSize: 12 }}>Próximas</Text>
        </Tarjeta>
      </View>

      {/* Accesos rápidos */}
      <View style={styles.accesos}>
        {ACCESOS.map((a) => (
          <Pressable
            key={a.id}
            onPress={() => navigation.navigate(a.destino)}
            style={({ pressed }) => [
              styles.acceso,
              {
                backgroundColor: tema.superficie,
                borderColor: tema.borde,
                opacity: pressed ? 0.75 : 1,
              },
              sombraTarjeta(tema),
            ]}
          >
            <View style={[styles.accesoIcono, { backgroundColor: tema.primarioSuave }]}>
              <Ionicons name={a.icono} size={20} color={tema.primario} />
            </View>
            <Text style={[styles.accesoTitulo, { color: tema.texto }]}>{a.titulo}</Text>
            <Text style={{ color: tema.textoTenue, fontSize: 11 }}>{a.sub}</Text>
          </Pressable>
        ))}
      </View>

      {/* Próximas citas */}
      <View style={styles.seccionHeader}>
        <Text style={[styles.seccionTitulo, { color: tema.texto }]}>Próximas citas</Text>
        <Pressable onPress={() => navigation.navigate('CitasTab')}>
          <Text style={{ color: tema.primario, fontSize: 13, fontWeight: '600' }}>Ver todas</Text>
        </Pressable>
      </View>

      {error ? (
        <EstadoError mensaje={error} onReintentar={() => cargar()} />
      ) : citas.length === 0 ? (
        <EstadoVacio
          icono="calendar-outline"
          titulo="Sin citas próximas"
          texto="Agenda una nueva cita desde el botón + de la barra inferior."
        />
      ) : (
        citas.slice(0, 3).map((cita) => (
          <Tarjeta
            key={cita.id}
            style={styles.cita}
            onPress={() => navigation.navigate('CitaForm', { cita })}
          >
            <Avatar
              uri={cita.paciente?.foto_url}
              nombre={nombrePaciente(cita.paciente)}
              size={46}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.citaNombre, { color: tema.texto }]} numberOfLines={1}>
                {nombrePaciente(cita.paciente)}
              </Text>
              <Text style={{ color: tema.textoSuave, fontSize: 12.5 }} numberOfLines={1}>
                {cita.motivo}
              </Text>
              <Text style={{ color: tema.textoTenue, fontSize: 11.5, marginTop: 1 }}>
                {cita.consultorio || 'Sin consultorio'}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <Text style={{ color: tema.texto, fontSize: 12.5, fontWeight: '700' }}>
                {hora12(cita.hora)}
              </Text>
              <Etiqueta texto={etiquetaEstado(cita.estado)} color={colorEstado(cita.estado)} />
            </View>
          </Tarjeta>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  saludo: { fontSize: 22, fontWeight: '800' },

  resumen: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  resumenTarjeta: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  resumenNumero: { fontSize: 22, fontWeight: '800' },

  accesos: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 22 },
  acceso: {
    flexGrow: 1,
    flexBasis: '22%',
    borderRadius: radios.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 4,
  },
  accesoIcono: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  accesoTitulo: { fontSize: 12.5, fontWeight: '700' },

  seccionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  seccionTitulo: { fontSize: 16, fontWeight: '700' },

  cita: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  citaNombre: { fontSize: 14.5, fontWeight: '700' },
});
