import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Boton, Campo } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/ThemeContext';
import { radios } from '../theme/theme';

export default function RegistroScreen() {
  const { tema } = useTema();
  const { registrar, procesando } = useAuth();

  const [form, setForm] = useState({
    nombre: '',
    email: '',
    especialidad: '',
    telefono: '',
    password: '',
    confirmar: '',
  });
  const [verPassword, setVerPassword] = useState(false);
  const [error, setError] = useState('');

  const set = (campo) => (valor) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setError('');
  };

  const validar = () => {
    if (form.nombre.trim().length < 2) return 'Escribe tu nombre completo';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return 'El correo no tiene un formato válido';
    if (form.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
    if (form.password !== form.confirmar) return 'Las contraseñas no coinciden';
    return '';
  };

  const onRegistrar = async () => {
    const problema = validar();
    if (problema) {
      setError(problema);
      return;
    }

    const resultado = await registrar({
      nombre: form.nombre.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      especialidad: form.especialidad.trim() || null,
      telefono: form.telefono.trim() || null,
    });

    if (!resultado.ok) setError(resultado.mensaje);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: tema.fondo }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.contenido}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.titulo, { color: tema.texto }]}>Crear cuenta</Text>
        <Text style={[styles.subtitulo, { color: tema.textoSuave }]}>
          Registra tus datos para empezar a usar la app
        </Text>

        <Campo
          etiqueta="Nombre completo"
          icono="person-outline"
          placeholder="Dr. Carlos López"
          value={form.nombre}
          onChangeText={set('nombre')}
        />
        <Campo
          etiqueta="Correo electrónico"
          icono="mail-outline"
          placeholder="doctor@clinica.com"
          value={form.email}
          onChangeText={set('email')}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Campo
          etiqueta="Especialidad (opcional)"
          icono="medkit-outline"
          placeholder="Medicina General"
          value={form.especialidad}
          onChangeText={set('especialidad')}
        />
        <Campo
          etiqueta="Teléfono (opcional)"
          icono="call-outline"
          placeholder="552 100 2030"
          value={form.telefono}
          onChangeText={set('telefono')}
          keyboardType="phone-pad"
        />
        <Campo
          etiqueta="Contraseña"
          icono="lock-closed-outline"
          placeholder="Mínimo 6 caracteres"
          value={form.password}
          onChangeText={set('password')}
          secureTextEntry={!verPassword}
          iconoDerecho={verPassword ? 'eye-off-outline' : 'eye-outline'}
          onPressIconoDerecho={() => setVerPassword((v) => !v)}
        />
        <Campo
          etiqueta="Confirmar contraseña"
          icono="lock-closed-outline"
          placeholder="Repite la contraseña"
          value={form.confirmar}
          onChangeText={set('confirmar')}
          secureTextEntry={!verPassword}
        />

        {error ? (
          <View style={[styles.error, { backgroundColor: tema.peligroSuave }]}>
            <Ionicons name="alert-circle-outline" size={17} color={tema.peligro} />
            <Text style={{ color: tema.peligro, fontSize: 12.5, flex: 1 }}>{error}</Text>
          </View>
        ) : null}

        <Boton
          titulo="Crear cuenta"
          onPress={onRegistrar}
          cargando={procesando}
          style={{ marginTop: 8 }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: 24, paddingBottom: 48 },
  titulo: { fontSize: 24, fontWeight: '800' },
  subtitulo: { fontSize: 13.5, marginTop: 4, marginBottom: 22 },
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 11,
    borderRadius: radios.md,
    marginBottom: 8,
  },
});
