import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Boton, Campo } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/ThemeContext';
import { API_URL } from '../config';
import { radios } from '../theme/theme';

export default function LoginScreen({ navigation }) {
  const { tema } = useTema();
  const insets = useSafeAreaInsets();
  const { iniciarSesion, procesando, credencialesRecordadas } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [recordarme, setRecordarme] = useState(true);
  const [error, setError] = useState('');

  // Rellena el correo si el usuario marcó "Recordarme" la última vez.
  useEffect(() => {
    credencialesRecordadas().then(({ recordarme: guardado, email: guardadoEmail }) => {
      setRecordarme(guardado);
      if (guardadoEmail) setEmail(guardadoEmail);
    });
  }, [credencialesRecordadas]);

  const validar = () => {
    if (!email.trim()) return 'Escribe tu correo electrónico';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return 'El correo no tiene un formato válido';
    if (!password) return 'Escribe tu contraseña';
    return '';
  };

  const onEntrar = async () => {
    const problema = validar();
    if (problema) {
      setError(problema);
      return;
    }
    setError('');

    const resultado = await iniciarSesion(email, password, recordarme);
    if (!resultado.ok) setError(resultado.mensaje);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: tema.fondo }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.contenido, { paddingTop: insets.top + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={[styles.logo, { backgroundColor: tema.primarioSuave }]}>
          <Ionicons name="heart" size={38} color={tema.primario} />
        </View>

        <Text style={[styles.titulo, { color: tema.texto }]}>Bienvenido</Text>
        <Text style={[styles.subtitulo, { color: tema.textoSuave }]}>
          Inicia sesión para continuar
        </Text>

        <View style={styles.formulario}>
          <Campo
            etiqueta="Correo electrónico"
            icono="mail-outline"
            placeholder="doctor@clinica.com"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setError('');
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            returnKeyType="next"
          />

          <Campo
            etiqueta="Contraseña"
            icono="lock-closed-outline"
            placeholder="••••••••"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              setError('');
            }}
            secureTextEntry={!verPassword}
            iconoDerecho={verPassword ? 'eye-off-outline' : 'eye-outline'}
            onPressIconoDerecho={() => setVerPassword((v) => !v)}
            returnKeyType="done"
            onSubmitEditing={onEntrar}
          />

          <View style={styles.filaOpciones}>
            <Pressable style={styles.recordarme} onPress={() => setRecordarme((v) => !v)}>
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: recordarme ? tema.primario : tema.borde,
                    backgroundColor: recordarme ? tema.primario : 'transparent',
                  },
                ]}
              >
                {recordarme ? <Ionicons name="checkmark" size={13} color="#FFF" /> : null}
              </View>
              <Text style={{ color: tema.textoSuave, fontSize: 13 }}>Recordarme</Text>
            </Pressable>

            <Pressable onPress={() => navigation.navigate('Recuperar')}>
              <Text style={{ color: tema.primario, fontSize: 13, fontWeight: '600' }}>
                ¿Olvidaste tu contraseña?
              </Text>
            </Pressable>
          </View>

          {error ? (
            <View style={[styles.error, { backgroundColor: tema.peligroSuave }]}>
              <Ionicons name="alert-circle-outline" size={17} color={tema.peligro} />
              <Text style={{ color: tema.peligro, fontSize: 12.5, flex: 1 }}>{error}</Text>
            </View>
          ) : null}

          <Boton
            titulo="Iniciar sesión"
            onPress={onEntrar}
            cargando={procesando}
            style={{ marginTop: 6 }}
          />

          <View style={styles.registro}>
            <Text style={{ color: tema.textoSuave, fontSize: 13 }}>¿No tienes cuenta? </Text>
            <Pressable onPress={() => navigation.navigate('Registro')}>
              <Text style={{ color: tema.primario, fontSize: 13, fontWeight: '700' }}>
                Regístrate
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Ilustración decorativa */}
        <View style={[styles.ilustracion, { backgroundColor: tema.primarioSuave }]}>
          <View style={[styles.ilustracionCirculo, { backgroundColor: tema.superficie }]}>
            <Ionicons name="medkit" size={44} color={tema.primario} />
          </View>
          <View style={styles.ilustracionIconos}>
            {['pulse', 'thermometer-outline', 'fitness-outline', 'medical-outline'].map((n) => (
              <View key={n} style={[styles.iconoFlotante, { backgroundColor: tema.superficie }]}>
                <Ionicons name={n} size={16} color={tema.primario} />
              </View>
            ))}
          </View>
        </View>

        <Text style={[styles.pie, { color: tema.textoTenue }]}>API: {API_URL}</Text>
        <Text style={[styles.pie, { color: tema.textoTenue }]}>
          Demo: doctor@clinica.com / 123456
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenido: { paddingHorizontal: 24, paddingBottom: 40 },
  logo: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  titulo: { fontSize: 26, fontWeight: '800', textAlign: 'center' },
  subtitulo: { fontSize: 13.5, textAlign: 'center', marginTop: 4, marginBottom: 24 },
  formulario: { width: '100%' },
  filaOpciones: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  recordarme: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 11,
    borderRadius: radios.md,
    marginBottom: 12,
  },
  registro: { flexDirection: 'row', justifyContent: 'center', marginTop: 18 },
  ilustracion: {
    marginTop: 28,
    borderRadius: radios.xl,
    paddingVertical: 26,
    alignItems: 'center',
    gap: 16,
  },
  ilustracionCirculo: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ilustracionIconos: { flexDirection: 'row', gap: 10 },
  iconoFlotante: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pie: { fontSize: 10.5, textAlign: 'center', marginTop: 10 },
});
