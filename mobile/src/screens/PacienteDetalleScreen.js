import React, { useCallback, useLayoutEffect, useState } from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import Avatar from '../components/Avatar';
import {
  Boton,
  Cargando,
  EstadoError,
  EstadoVacio,
  Etiqueta,
  FilaInfo,
  Tabs,
  Tarjeta,
  colorEstado,
} from '../components/UI';
import { mensajeDeError } from '../api/client';
import { pacientesApi } from '../api/services';
import { useTema } from '../context/ThemeContext';
import { radios } from '../theme/theme';
import {
  diaYMes,
  esProxima,
  etiquetaEstado,
  etiquetaSexo,
  fechaCorta,
  fechaLarga,
  hora12,
  nombrePaciente,
} from '../utils/format';

const TABS = [
  { valor: 'resumen', etiqueta: 'Resumen' },
  { valor: 'citas', etiqueta: 'Citas' },
  { valor: 'notas', etiqueta: 'Notas' },
  { valor: 'fotos', etiqueta: 'Fotos' },
];

export default function PacienteDetalleScreen({ navigation, route }) {
  const { tema } = useTema();
  const { pacienteId } = route.params;

  const [expediente, setExpediente] = useState(null);
  const [tab, setTab] = useState(route.params?.tab || 'resumen');
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(
    async (esRefresco = false) => {
      esRefresco ? setRefrescando(true) : setCargando(true);
      setError('');
      try {
        setExpediente(await pacientesApi.expediente(pacienteId));
      } catch (e) {
        setError(mensajeDeError(e, 'No se pudo cargar el expediente'));
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

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Detalle del paciente',
      headerRight: () => (
        <Pressable
          onPress={() => navigation.navigate('PacienteForm', { pacienteId })}
          hitSlop={10}
          style={{ paddingHorizontal: 4 }}
        >
          <Ionicons name="create-outline" size={22} color={tema.primario} />
        </Pressable>
      ),
    });
  }, [navigation, pacienteId, tema.primario]);

  if (cargando) return <Cargando texto="Cargando expediente..." />;
  if (error) return <EstadoError mensaje={error} onReintentar={() => cargar()} />;
  if (!expediente) return null;

  const { paciente, citas, notas, fotos, signos } = expediente;
  const ultimoSigno = signos.length ? signos[signos.length - 1] : null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: tema.fondo }}
      contentContainerStyle={{ padding: 18, paddingBottom: 40 }}
      refreshControl={
        <RefreshControl
          refreshing={refrescando}
          onRefresh={() => cargar(true)}
          tintColor={tema.primario}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Encabezado */}
      <View style={styles.encabezado}>
        <Avatar uri={paciente.foto_url} nombre={nombrePaciente(paciente)} size={64} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.nombre, { color: tema.texto }]}>{nombrePaciente(paciente)}</Text>
          <Text style={{ color: tema.textoSuave, fontSize: 13, marginTop: 3 }}>
            {paciente.edad != null ? `${paciente.edad} años` : 'Edad no registrada'} ·{' '}
            {etiquetaSexo(paciente.sexo)}
          </Text>
          <Text style={{ color: tema.textoTenue, fontSize: 12, marginTop: 1 }}>
            ID: {paciente.codigo}
          </Text>
        </View>
      </View>

      {/* Acciones rápidas */}
      <View style={styles.acciones}>
        {[
          { icono: 'calendar-outline', texto: 'Cita', onPress: () => navigation.navigate('CitaForm', { pacienteId }) },
          { icono: 'document-text-outline', texto: 'Nota', onPress: () => navigation.navigate('Notas', { pacienteId, nombre: nombrePaciente(paciente) }) },
          { icono: 'pulse-outline', texto: 'Signos', onPress: () => navigation.navigate('Signos', { pacienteId, nombre: nombrePaciente(paciente) }) },
          { icono: 'list-outline', texto: 'Citas', onPress: () => navigation.navigate('CitasPaciente', { pacienteId, nombre: nombrePaciente(paciente) }) },
        ].map((a) => (
          <Pressable
            key={a.texto}
            onPress={a.onPress}
            style={({ pressed }) => [
              styles.accion,
              { backgroundColor: tema.superficie, borderColor: tema.borde, opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <Ionicons name={a.icono} size={19} color={tema.primario} />
            <Text style={{ color: tema.textoSuave, fontSize: 11.5, fontWeight: '600' }}>
              {a.texto}
            </Text>
          </Pressable>
        ))}
      </View>

      <Tabs opciones={TABS} activo={tab} onCambiar={setTab} style={{ marginBottom: 16 }} />

      {/* ------------------------------- RESUMEN ------------------------------- */}
      {tab === 'resumen' ? (
        <>
          <Text style={[styles.seccion, { color: tema.texto }]}>Información general</Text>
          <Tarjeta style={{ paddingVertical: 2, marginBottom: 16 }}>
            <FilaInfo icono="call-outline" etiqueta="Teléfono" valor={paciente.telefono} />
            <FilaInfo icono="mail-outline" etiqueta="Correo" valor={paciente.email} />
            <FilaInfo icono="location-outline" etiqueta="Dirección" valor={paciente.direccion} />
            <FilaInfo
              icono="calendar-outline"
              etiqueta="Fecha de nacimiento"
              valor={paciente.fecha_nacimiento ? fechaCorta(paciente.fecha_nacimiento) : null}
              ultima
            />
          </Tarjeta>

          <Text style={[styles.seccion, { color: tema.texto }]}>Información médica</Text>
          <Tarjeta style={{ paddingVertical: 2, marginBottom: 16 }}>
            <FilaInfo icono="water-outline" etiqueta="Tipo de sangre" valor={paciente.tipo_sangre} />
            <FilaInfo icono="alert-circle-outline" etiqueta="Alergias" valor={paciente.alergias} />
            <FilaInfo
              icono="pulse-outline"
              etiqueta="Último peso"
              valor={ultimoSigno?.peso != null ? `${ultimoSigno.peso} kg` : null}
            />
            <FilaInfo
              icono="heart-outline"
              etiqueta="Última presión"
              valor={ultimoSigno?.presion ? `${ultimoSigno.presion} mmHg` : null}
              ultima
            />
          </Tarjeta>

          <View style={styles.contadores}>
            <Tarjeta style={styles.contador}>
              <Text style={[styles.contadorNumero, { color: tema.primario }]}>{citas.length}</Text>
              <Text style={{ color: tema.textoSuave, fontSize: 11.5 }}>Citas</Text>
            </Tarjeta>
            <Tarjeta style={styles.contador}>
              <Text style={[styles.contadorNumero, { color: tema.exito }]}>{notas.length}</Text>
              <Text style={{ color: tema.textoSuave, fontSize: 11.5 }}>Notas</Text>
            </Tarjeta>
            <Tarjeta style={styles.contador}>
              <Text style={[styles.contadorNumero, { color: tema.aviso }]}>{signos.length}</Text>
              <Text style={{ color: tema.textoSuave, fontSize: 11.5 }}>Registros</Text>
            </Tarjeta>
          </View>
        </>
      ) : null}

      {/* -------------------------------- CITAS -------------------------------- */}
      {tab === 'citas' ? (
        <>
          <Boton
            titulo="Nueva cita"
            icono="add"
            variante="secundario"
            onPress={() => navigation.navigate('CitaForm', { pacienteId })}
            style={{ marginBottom: 14 }}
          />

          {citas.length === 0 ? (
            <EstadoVacio icono="calendar-outline" titulo="Sin citas" texto="Este paciente no tiene citas registradas." />
          ) : (
            citas.map((cita) => {
              const { dia, mes } = diaYMes(cita.fecha);
              return (
                <Tarjeta
                  key={cita.id}
                  style={styles.cita}
                  onPress={() => navigation.navigate('CitaForm', { cita })}
                >
                  <View
                    style={[
                      styles.citaFecha,
                      {
                        backgroundColor: esProxima(cita.fecha)
                          ? tema.primario
                          : tema.superficieAlt,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: esProxima(cita.fecha) ? '#FFF' : tema.textoSuave,
                        fontSize: 10,
                        fontWeight: '700',
                      }}
                    >
                      {mes}
                    </Text>
                    <Text
                      style={{
                        color: esProxima(cita.fecha) ? '#FFF' : tema.texto,
                        fontSize: 18,
                        fontWeight: '800',
                      }}
                    >
                      {dia}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{ color: tema.texto, fontSize: 14, fontWeight: '700' }}>
                      {cita.motivo}
                    </Text>
                    <Text style={{ color: tema.textoSuave, fontSize: 12, marginTop: 2 }}>
                      {fechaLarga(cita.fecha)} · {hora12(cita.hora)}
                    </Text>
                    <Text style={{ color: tema.textoTenue, fontSize: 11.5, marginTop: 1 }}>
                      {cita.consultorio || 'Sin consultorio'}
                    </Text>
                  </View>

                  <Etiqueta texto={etiquetaEstado(cita.estado)} color={colorEstado(cita.estado)} />
                </Tarjeta>
              );
            })
          )}
        </>
      ) : null}

      {/* -------------------------------- NOTAS -------------------------------- */}
      {tab === 'notas' ? (
        <>
          <Boton
            titulo="Ver todas las notas"
            icono="document-text-outline"
            variante="secundario"
            onPress={() =>
              navigation.navigate('Notas', { pacienteId, nombre: nombrePaciente(paciente) })
            }
            style={{ marginBottom: 14 }}
          />

          {notas.length === 0 ? (
            <EstadoVacio icono="document-text-outline" titulo="Sin notas" texto="Aún no hay notas médicas." />
          ) : (
            notas.slice(0, 5).map((nota) => (
              <Tarjeta key={nota.id} style={{ marginBottom: 10 }}>
                <View style={styles.notaHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: tema.texto, fontSize: 13.5, fontWeight: '700' }}>
                      {fechaLarga(nota.fecha)}
                    </Text>
                    <Text style={{ color: tema.primario, fontSize: 11.5, marginTop: 1 }}>
                      {nota.doctor?.nombre || 'Doctor'}
                    </Text>
                  </View>
                  <Ionicons name="document-text-outline" size={18} color={tema.textoTenue} />
                </View>
                {nota.titulo ? (
                  <Text style={{ color: tema.texto, fontSize: 13, fontWeight: '600', marginTop: 8 }}>
                    {nota.titulo}
                  </Text>
                ) : null}
                <Text style={{ color: tema.textoSuave, fontSize: 13, lineHeight: 19, marginTop: 4 }}>
                  {nota.contenido}
                </Text>
              </Tarjeta>
            ))
          )}
        </>
      ) : null}

      {/* -------------------------------- FOTOS -------------------------------- */}
      {tab === 'fotos' ? (
        <>
          <Boton
            titulo="Agregar foto"
            icono="add"
            variante="secundario"
            onPress={() =>
              navigation.navigate('Fotos', { pacienteId, nombre: nombrePaciente(paciente) })
            }
            style={{ marginBottom: 14 }}
          />

          {fotos.length === 0 ? (
            <EstadoVacio icono="images-outline" titulo="Sin fotos" texto="Adjunta estudios o imágenes al expediente." />
          ) : (
            <View style={styles.galeria}>
              {fotos.map((foto) => (
                <View key={foto.id} style={styles.fotoItem}>
                  <Image
                    source={{ uri: foto.url }}
                    style={[styles.foto, { backgroundColor: tema.superficieAlt }]}
                  />
                  <Text style={{ color: tema.textoSuave, fontSize: 11, marginTop: 5 }} numberOfLines={2}>
                    {foto.descripcion || 'Sin descripción'}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  nombre: { fontSize: 19, fontWeight: '800' },

  acciones: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  accion: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
    paddingVertical: 12,
    borderRadius: radios.md,
    borderWidth: StyleSheet.hairlineWidth,
  },

  seccion: { fontSize: 15, fontWeight: '700', marginBottom: 8 },

  contadores: { flexDirection: 'row', gap: 10 },
  contador: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  contadorNumero: { fontSize: 19, fontWeight: '800' },

  cita: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  citaFecha: {
    width: 52,
    height: 56,
    borderRadius: radios.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  notaHeader: { flexDirection: 'row', alignItems: 'flex-start' },

  galeria: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  fotoItem: { width: '47%' },
  foto: { width: '100%', aspectRatio: 1, borderRadius: radios.md },
});
