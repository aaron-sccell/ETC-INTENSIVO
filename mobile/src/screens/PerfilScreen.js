import React, { useLayoutEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Avatar from '../components/Avatar';
import { Boton, Campo } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/ThemeContext';
import { radios } from '../theme/theme';

export default function PerfilScreen({ navigation }) {
  const { tema } = useTema();
  const { usuario, actualizarPerfil, procesando } = useAuth();

  const [form, setForm] = useState({
    nombre: usuario?.nombre || '',
    email: usuario?.email || '',
    especialidad: usuario?.especialidad || '',
    telefono: usuario?.telefono || '',
    avatar_url: usuario?.avatar_url || '',
    password: '',
  });
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Información personal' });
  }, [navigation]);

  const set = (campo) => (valor) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setError('');
    setMensaje('');
  };

  const guardar = async () => {
    if (form.nombre.trim().length < 2) {
      setError('Escribe tu nombre completo');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      setError('El correo no tiene un formato válido');
      return;
    }
    if (form.password && form.password.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    const payload = {
      nombre: form.nombre.trim(),
      email: form.email.trim().toLowerCase(),
      especialidad: form.especialidad.trim() || null,
      telefono: form.telefono.trim() || null,
      avatar_url: form.avatar_url.trim() || null,
    };
    if (form.password) payload.password = form.password;

    const resultado = await actualizarPerfil(payload);
    if (resultado.ok) {
      setMensaje('Perfil actualizado correctamente');
      setForm((f) => ({ ...f, password: '' }));
    } else {
      setError(resultado.mensaje);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: tema.fondo }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarZona}>
          <Avatar uri={form.avatar_url} nombre={form.nombre} size={84} />
          <Text style={{ color: tema.textoSuave, fontSize: 12, marginTop: 8 }}>
            {usuario?.rol === 'doctor' ? 'Doctor' : usuario?.rol}
          </Text>
        </View>

        <Campo etiqueta="Nombre completo" icono="person-outline" value={form.nombre} onChangeText={set('nombre')} />
        <Campo
          etiqueta="Correo electrónico"
          icono="mail-outline"
          value={form.email}
          onChangeText={set('email')}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Campo
          etiqueta="Especialidad"
          icono="medkit-outline"
          placeholder="Medicina General"
          value={form.especialidad}
          onChangeText={set('especialidad')}
        />
        <Campo
          etiqueta="Teléfono"
          icono="call-outline"
          placeholder="552 100 2030"
          value={form.telefono}
          onChangeText={set('telefono')}
          keyboardType="phone-pad"
        />
        <Campo
          etiqueta="URL de tu foto"
          icono="image-outline"
          placeholder="https://..."
          value={form.avatar_url}
          onChangeText={set('avatar_url')}
          autoCapitalize="none"
        />
        <Campo
          etiqueta="Nueva contraseña (opcional)"
          icono="lock-closed-outline"
          placeholder="Déjalo vacío para no cambiarla"
          value={form.password}
          onChangeText={set('password')}
          secureTextEntry
        />

        {error ? (
          <View style={[styles.aviso, { backgroundColor: tema.peligroSuave }]}>
            <Ionicons name="alert-circle-outline" size={17} color={tema.peligro} />
            <Text style={{ color: tema.peligro, fontSize: 12.5, flex: 1 }}>{error}</Text>
          </View>
        ) : null}

        {mensaje ? (
          <View style={[styles.aviso, { backgroundColor: tema.exitoSuave }]}>
            <Ionicons name="checkmark-circle-outline" size={17} color={tema.exito} />
            <Text style={{ color: tema.exito, fontSize: 12.5, flex: 1 }}>{mensaje}</Text>
          </View>
        ) : null}

        <Boton titulo="Guardar cambios" onPress={guardar} cargando={procesando} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: 18, paddingBottom: 48 },
  avatarZona: { alignItems: 'center', marginBottom: 22 },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 11,
    borderRadius: radios.md,
    marginBottom: 12,
  },
});
