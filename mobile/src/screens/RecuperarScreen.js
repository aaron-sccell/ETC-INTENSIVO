import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Boton, Campo } from '../components/UI';
import { useTema } from '../context/ThemeContext';
import { radios } from '../theme/theme';

/**
 * Recuperación de contraseña.
 *
 * El envío de correos queda fuera del alcance del proyecto académico, así que
 * la pantalla explica el procedimiento y confirma la solicitud localmente.
 */
export default function RecuperarScreen({ navigation }) {
  const { tema } = useTema();
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);

  return (
    <ScrollView
      style={{ backgroundColor: tema.fondo }}
      contentContainerStyle={styles.contenido}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.icono, { backgroundColor: tema.primarioSuave }]}>
        <Ionicons name="key-outline" size={32} color={tema.primario} />
      </View>

      <Text style={[styles.titulo, { color: tema.texto }]}>Recuperar contraseña</Text>
      <Text style={[styles.texto, { color: tema.textoSuave }]}>
        Escribe el correo con el que te registraste y el administrador de la clínica te
        ayudará a restablecer tu acceso.
      </Text>

      {enviado ? (
        <View style={[styles.aviso, { backgroundColor: tema.exitoSuave }]}>
          <Ionicons name="checkmark-circle" size={20} color={tema.exito} />
          <Text style={{ color: tema.exito, flex: 1, fontSize: 13 }}>
            Solicitud registrada para {email}. Te contactarán en breve.
          </Text>
        </View>
      ) : (
        <Campo
          etiqueta="Correo electrónico"
          icono="mail-outline"
          placeholder="doctor@clinica.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      )}

      <Boton
        titulo={enviado ? 'Volver al inicio de sesión' : 'Enviar solicitud'}
        onPress={() => (enviado ? navigation.goBack() : setEnviado(!!email.trim()))}
        deshabilitado={!enviado && !email.trim()}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: 24, paddingTop: 32 },
  icono: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 18,
  },
  titulo: { fontSize: 21, fontWeight: '800', textAlign: 'center' },
  texto: { fontSize: 13.5, textAlign: 'center', lineHeight: 20, marginTop: 8, marginBottom: 24 },
  aviso: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    padding: 14,
    borderRadius: radios.md,
    marginBottom: 18,
  },
});
