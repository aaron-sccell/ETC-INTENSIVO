import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Avatar from '../components/Avatar';
import { Boton, Tarjeta } from '../components/UI';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/ThemeContext';
import { radios } from '../theme/theme';
import {
  cancelarTodosLosRecordatorios,
  notificacionDePrueba,
  recordatoriosProgramados,
} from '../utils/notifications';

export default function AjustesScreen({ navigation }) {
  const { tema, modoOscuro, alternarModoOscuro } = useTema();
  const { usuario, cerrarSesion } = useAuth();
  const insets = useSafeAreaInsets();
  const [notificaciones, setNotificaciones] = useState(true);

  const onCerrarSesion = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: cerrarSesion },
    ]);
  };

  const onProbarNotificacion = async () => {
    const resultado = await notificacionDePrueba();
    if (!resultado.ok) {
      Alert.alert('Notificaciones', resultado.motivo);
    }
  };

  const onVerRecordatorios = async () => {
    const lista = await recordatoriosProgramados();
    if (lista.length === 0) {
      Alert.alert('Recordatorios', 'No tienes recordatorios programados.');
      return;
    }
    Alert.alert(
      'Recordatorios programados',
      lista
        .slice(0, 8)
        .map((n) => `• ${n.content.title}: ${n.content.body}`)
        .join('\n\n'),
      [
        { text: 'Cerrar', style: 'cancel' },
        {
          text: 'Cancelar todos',
          style: 'destructive',
          onPress: async () => {
            await cancelarTodosLosRecordatorios();
            Alert.alert('Listo', 'Se cancelaron todos los recordatorios.');
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: tema.fondo }}
      contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.titulo, { color: tema.texto }]}>Ajustes</Text>

      {/* Tarjeta del doctor */}
      <Tarjeta style={styles.perfil}>
        <Avatar uri={usuario?.avatar_url} nombre={usuario?.nombre} size={56} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: tema.texto, fontSize: 16, fontWeight: '700' }} numberOfLines={1}>
            {usuario?.nombre || 'Doctor'}
          </Text>
          <Text style={{ color: tema.textoSuave, fontSize: 12.5, marginTop: 2 }} numberOfLines={1}>
            {usuario?.email}
          </Text>
          {usuario?.especialidad ? (
            <Text style={{ color: tema.primario, fontSize: 11.5, marginTop: 2 }}>
              {usuario.especialidad}
            </Text>
          ) : null}
        </View>
      </Tarjeta>

      {/* Opciones */}
      <Tarjeta style={{ paddingVertical: 4, marginTop: 16 }}>
        <Opcion
          icono="person-outline"
          titulo="Información personal"
          onPress={() => navigation.navigate('Perfil')}
        />

        <Opcion
          icono="moon-outline"
          titulo="Modo oscuro"
          control={
            <Switch
              value={modoOscuro}
              onValueChange={alternarModoOscuro}
              trackColor={{ false: tema.borde, true: tema.primario }}
              thumbColor="#FFFFFF"
            />
          }
        />

        <Opcion
          icono="notifications-outline"
          titulo="Notificaciones"
          control={
            <Switch
              value={notificaciones}
              onValueChange={(v) => {
                setNotificaciones(v);
                if (v) onProbarNotificacion();
              }}
              trackColor={{ false: tema.borde, true: tema.primario }}
              thumbColor="#FFFFFF"
            />
          }
        />

        <Opcion
          icono="alarm-outline"
          titulo="Recordatorios programados"
          onPress={onVerRecordatorios}
        />

        <Opcion
          icono="shield-checkmark-outline"
          titulo="Seguridad"
          subtitulo="Sesión protegida con JWT"
          onPress={() =>
            Alert.alert(
              'Seguridad',
              'Tu sesión usa un token JWT firmado por el servidor, guardado de forma cifrada en el dispositivo (expo-secure-store). Las contraseñas se almacenan con hash bcrypt en la base de datos.',
            )
          }
        />

        <Opcion
          icono="information-circle-outline"
          titulo="Acerca de la app"
          subtitulo="Versión 1.0.0"
          ultima
          onPress={() =>
            Alert.alert(
              'Acerca de la app',
              `Gestión de Clínica\nVersión 1.0.0\n\nReact Native + Expo (SDK 54)\nAPI: FastAPI + MySQL\n\nServidor:\n${API_URL}`,
            )
          }
        />
      </Tarjeta>

      <Boton
        titulo="Cerrar sesión"
        variante="peligro"
        icono="log-out-outline"
        onPress={onCerrarSesion}
        style={{ marginTop: 20 }}
      />

      <Text style={{ color: tema.textoTenue, fontSize: 10.5, textAlign: 'center', marginTop: 16 }}>
        API: {API_URL}
      </Text>
    </ScrollView>
  );
}

function Opcion({ icono, titulo, subtitulo, control, onPress, ultima = false }) {
  const { tema } = useTema();

  const contenido = (
    <View
      style={[
        styles.opcion,
        !ultima && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: tema.borde },
      ]}
    >
      <View style={[styles.opcionIcono, { backgroundColor: tema.primarioSuave }]}>
        <Ionicons name={icono} size={17} color={tema.primario} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ color: tema.texto, fontSize: 14, fontWeight: '600' }}>{titulo}</Text>
        {subtitulo ? (
          <Text style={{ color: tema.textoTenue, fontSize: 11.5, marginTop: 1 }}>{subtitulo}</Text>
        ) : null}
      </View>

      {control || <Ionicons name="chevron-forward" size={18} color={tema.textoTenue} />}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => (pressed ? { opacity: 0.6 } : null)}>
        {contenido}
      </Pressable>
    );
  }
  return contenido;
}

const styles = StyleSheet.create({
  titulo: { fontSize: 24, fontWeight: '800', marginBottom: 16 },
  perfil: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  opcion: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  opcionIcono: {
    width: 34,
    height: 34,
    borderRadius: radios.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
