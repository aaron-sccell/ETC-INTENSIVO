import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Avatar from '../components/Avatar';
import { Boton, Cargando, EstadoError, EstadoVacio, Tarjeta } from '../components/UI';
import { mensajeDeError } from '../api/client';
import { pacientesApi } from '../api/services';
import { useTema } from '../context/ThemeContext';
import { radios, sombraTarjeta } from '../theme/theme';
import { etiquetaSexo, nombrePaciente } from '../utils/format';

const FILTROS = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'masculino', etiqueta: 'Masculino' },
  { valor: 'femenino', etiqueta: 'Femenino' },
];

export default function PacientesScreen({ navigation }) {
  const { tema } = useTema();
  const insets = useSafeAreaInsets();

  const [pacientes, setPacientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [verFiltros, setVerFiltros] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(
    async (texto = '', esRefresco = false) => {
      esRefresco ? setRefrescando(true) : setCargando(true);
      setError('');
      try {
        setPacientes(await pacientesApi.listar(texto));
      } catch (e) {
        setError(mensajeDeError(e, 'No se pudo cargar la lista de pacientes'));
      } finally {
        setCargando(false);
        setRefrescando(false);
      }
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      cargar(busqueda);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cargar]),
  );

  // Búsqueda con retardo para no golpear la API en cada tecla.
  useEffect(() => {
    const t = setTimeout(() => cargar(busqueda), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda]);

  const visibles =
    filtro === 'todos' ? pacientes : pacientes.filter((p) => p.sexo === filtro);

  const renderPaciente = ({ item }) => (
    <Tarjeta
      style={styles.fila}
      onPress={() => navigation.navigate('PacienteDetalle', { pacienteId: item.id })}
    >
      <Avatar uri={item.foto_url} nombre={nombrePaciente(item)} size={48} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.nombre, { color: tema.texto }]} numberOfLines={1}>
          {nombrePaciente(item)}
        </Text>
        <Text style={{ color: tema.textoSuave, fontSize: 12.5, marginTop: 2 }}>
          {item.edad != null ? `${item.edad} años` : 'Edad no registrada'} ·{' '}
          {etiquetaSexo(item.sexo)}
        </Text>
        <Text style={{ color: tema.textoTenue, fontSize: 11.5, marginTop: 1 }}>
          ID: {item.codigo}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={19} color={tema.textoTenue} />
    </Tarjeta>
  );

  return (
    <View style={{ flex: 1, backgroundColor: tema.fondo, paddingTop: insets.top + 8 }}>
      {/* Buscador */}
      <View style={styles.barraBusqueda}>
        <View
          style={[
            styles.buscador,
            { backgroundColor: tema.superficie, borderColor: tema.borde },
          ]}
        >
          <Ionicons name="search" size={18} color={tema.textoTenue} />
          <TextInput
            placeholder="Buscar paciente..."
            placeholderTextColor={tema.placeholder}
            value={busqueda}
            onChangeText={setBusqueda}
            style={{ flex: 1, color: tema.texto, fontSize: 14.5, paddingVertical: 10 }}
            returnKeyType="search"
          />
          {busqueda ? (
            <Pressable onPress={() => setBusqueda('')} hitSlop={10}>
              <Ionicons name="close-circle" size={18} color={tema.textoTenue} />
            </Pressable>
          ) : null}
        </View>

        <Pressable
          onPress={() => setVerFiltros((v) => !v)}
          style={[
            styles.botonFiltro,
            {
              backgroundColor: verFiltros || filtro !== 'todos' ? tema.primario : tema.superficie,
              borderColor: tema.borde,
            },
          ]}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={verFiltros || filtro !== 'todos' ? '#FFF' : tema.textoSuave}
          />
        </Pressable>
      </View>

      {verFiltros ? (
        <View style={styles.filtros}>
          {FILTROS.map((f) => {
            const activo = filtro === f.valor;
            return (
              <Pressable
                key={f.valor}
                onPress={() => setFiltro(f.valor)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: activo ? tema.primario : tema.superficie,
                    borderColor: activo ? tema.primario : tema.borde,
                  },
                ]}
              >
                <Text
                  style={{
                    color: activo ? '#FFF' : tema.textoSuave,
                    fontSize: 12.5,
                    fontWeight: '600',
                  }}
                >
                  {f.etiqueta}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {cargando ? (
        <Cargando texto="Cargando pacientes..." />
      ) : error ? (
        <EstadoError mensaje={error} onReintentar={() => cargar(busqueda)} />
      ) : (
        <FlatList
          data={visibles}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderPaciente}
          contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 120, gap: 10 }}
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={() => cargar(busqueda, true)}
              tintColor={tema.primario}
            />
          }
          ListEmptyComponent={
            <EstadoVacio
              icono="people-outline"
              titulo={busqueda ? 'Sin resultados' : 'Aún no hay pacientes'}
              texto={
                busqueda
                  ? `No encontramos pacientes que coincidan con "${busqueda}".`
                  : 'Registra a tu primer paciente con el botón +.'
              }
              accion={
                !busqueda ? (
                  <Boton
                    titulo="Nuevo paciente"
                    icono="add"
                    variante="secundario"
                    onPress={() => navigation.navigate('PacienteForm', {})}
                    style={{ marginTop: 14, paddingHorizontal: 22 }}
                  />
                ) : null
              }
            />
          }
        />
      )}

      {/* Botón flotante para agregar paciente */}
      <Pressable
        onPress={() => navigation.navigate('PacienteForm', {})}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: tema.primario, bottom: 96, opacity: pressed ? 0.85 : 1 },
          sombraTarjeta(tema),
        ]}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  barraBusqueda: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  buscador: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: radios.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  botonFiltro: {
    width: 46,
    height: 46,
    borderRadius: radios.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtros: { flexDirection: 'row', gap: 8, paddingHorizontal: 18, paddingBottom: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radios.full,
    borderWidth: StyleSheet.hairlineWidth,
  },

  fila: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nombre: { fontSize: 15, fontWeight: '700' },

  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
