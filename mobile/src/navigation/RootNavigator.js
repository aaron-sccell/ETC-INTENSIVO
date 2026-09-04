import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { Cargando } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/ThemeContext';
import { radios, sombraTarjeta } from '../theme/theme';

import LoginScreen from '../screens/LoginScreen';
import RegistroScreen from '../screens/RegistroScreen';
import RecuperarScreen from '../screens/RecuperarScreen';
import HomeScreen from '../screens/HomeScreen';
import PacientesScreen from '../screens/PacientesScreen';
import PacienteDetalleScreen from '../screens/PacienteDetalleScreen';
import PacienteFormScreen from '../screens/PacienteFormScreen';
import CitasScreen from '../screens/CitasScreen';
import CitasPacienteScreen from '../screens/CitasPacienteScreen';
import CitaFormScreen from '../screens/CitaFormScreen';
import NotasScreen from '../screens/NotasScreen';
import NotaFormScreen from '../screens/NotaFormScreen';
import SignosScreen from '../screens/SignosScreen';
import SignoFormScreen from '../screens/SignoFormScreen';
import FotosScreen from '../screens/FotosScreen';
import AjustesScreen from '../screens/AjustesScreen';
import PerfilScreen from '../screens/PerfilScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/* -------------------------------------------------------------------------- */
/*  Botón central "+" de la barra de pestañas                                  */
/* -------------------------------------------------------------------------- */
function BotonCentral({ onPress }) {
  const { tema } = useTema();
  return (
    <View style={styles.centralContenedor}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.central,
          { backgroundColor: tema.primario, opacity: pressed ? 0.85 : 1 },
          sombraTarjeta(tema),
        ]}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </Pressable>
    </View>
  );
}

/** Menú de acciones rápidas que abre el botón central. */
function MenuRapido({ visible, onCerrar, navegar }) {
  const { tema } = useTema();

  const acciones = [
    { icono: 'calendar-outline', titulo: 'Nueva cita', texto: 'Agenda una consulta', destino: 'CitaForm' },
    { icono: 'person-add-outline', titulo: 'Nuevo paciente', texto: 'Registra un expediente', destino: 'PacienteForm' },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
      <Pressable style={styles.fondoModal} onPress={onCerrar} />
      <View style={[styles.menu, { backgroundColor: tema.superficie }]}>
        <View style={[styles.asa, { backgroundColor: tema.borde }]} />
        <Text style={{ color: tema.texto, fontSize: 16, fontWeight: '700', marginBottom: 14 }}>
          Acceso rápido
        </Text>

        {acciones.map((a) => (
          <Pressable
            key={a.destino}
            style={({ pressed }) => [
              styles.accion,
              { backgroundColor: tema.superficieAlt, opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => {
              onCerrar();
              navegar(a.destino);
            }}
          >
            <View style={[styles.accionIcono, { backgroundColor: tema.primarioSuave }]}>
              <Ionicons name={a.icono} size={20} color={tema.primario} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: tema.texto, fontSize: 14.5, fontWeight: '700' }}>{a.titulo}</Text>
              <Text style={{ color: tema.textoSuave, fontSize: 12, marginTop: 1 }}>{a.texto}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={tema.textoTenue} />
          </Pressable>
        ))}
      </View>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/*  Bottom tabs                                                               */
/* -------------------------------------------------------------------------- */
function Tabs({ navigation }) {
  const { tema } = useTema();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const iconos = {
    InicioTab: ['home', 'home-outline'],
    PacientesTab: ['people', 'people-outline'],
    CitasTab: ['calendar', 'calendar-outline'],
    PerfilTab: ['person', 'person-outline'],
  };

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: tema.primario,
          tabBarInactiveTintColor: tema.textoTenue,
          tabBarStyle: {
            backgroundColor: tema.barra,
            borderTopColor: tema.borde,
            height: 64,
            paddingBottom: 8,
            paddingTop: 8,
            position: 'absolute',
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          tabBarIcon: ({ focused, color, size }) => {
            const par = iconos[route.name];
            if (!par) return null;
            return <Ionicons name={focused ? par[0] : par[1]} size={size - 2} color={color} />;
          },
        })}
      >
        <Tab.Screen name="InicioTab" component={HomeScreen} options={{ title: 'Inicio' }} />
        <Tab.Screen name="PacientesTab" component={PacientesScreen} options={{ title: 'Pacientes' }} />

        {/* Pestaña "fantasma": su botón abre el menú rápido en lugar de navegar. */}
        <Tab.Screen
          name="AccionTab"
          component={View}
          options={{
            title: '',
            tabBarButton: () => <BotonCentral onPress={() => setMenuAbierto(true)} />,
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setMenuAbierto(true);
            },
          }}
        />

        <Tab.Screen name="CitasTab" component={CitasScreen} options={{ title: 'Citas' }} />
        <Tab.Screen name="PerfilTab" component={AjustesScreen} options={{ title: 'Perfil' }} />
      </Tab.Navigator>

      <MenuRapido
        visible={menuAbierto}
        onCerrar={() => setMenuAbierto(false)}
        navegar={(destino) => navigation.navigate(destino, {})}
      />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Navegador raíz                                                            */
/* -------------------------------------------------------------------------- */
export default function RootNavigator() {
  const { tema, modoOscuro } = useTema();
  const { autenticado, cargandoSesion } = useAuth();

  const navTheme = {
    ...(modoOscuro ? DarkTheme : DefaultTheme),
    colors: {
      ...(modoOscuro ? DarkTheme : DefaultTheme).colors,
      primary: tema.primario,
      background: tema.fondo,
      card: tema.barra,
      text: tema.texto,
      border: tema.borde,
    },
  };

  const opcionesStack = {
    headerStyle: { backgroundColor: tema.barra },
    headerTintColor: tema.primario,
    headerTitleStyle: { color: tema.texto, fontSize: 16, fontWeight: '700' },
    headerShadowVisible: false,
    contentStyle: { backgroundColor: tema.fondo },
  };

  if (cargandoSesion) {
    return (
      <View style={{ flex: 1, backgroundColor: tema.fondo, justifyContent: 'center' }}>
        <Cargando texto="Iniciando..." />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={opcionesStack}>
        {!autenticado ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Registro" component={RegistroScreen} options={{ title: 'Crear cuenta' }} />
            <Stack.Screen name="Recuperar" component={RecuperarScreen} options={{ title: 'Recuperar acceso' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
            <Stack.Screen name="PacienteDetalle" component={PacienteDetalleScreen} />
            <Stack.Screen name="PacienteForm" component={PacienteFormScreen} />
            <Stack.Screen name="CitasPaciente" component={CitasPacienteScreen} />
            <Stack.Screen name="CitaForm" component={CitaFormScreen} />
            <Stack.Screen name="Notas" component={NotasScreen} />
            <Stack.Screen name="NotaForm" component={NotaFormScreen} />
            <Stack.Screen name="Signos" component={SignosScreen} />
            <Stack.Screen name="SignoForm" component={SignoFormScreen} />
            <Stack.Screen name="Fotos" component={FotosScreen} />
            <Stack.Screen name="Perfil" component={PerfilScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  centralContenedor: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  central: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18,
  },

  fondoModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  menu: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: radios.xl,
    borderTopRightRadius: radios.xl,
    padding: 20,
    paddingBottom: 34,
  },
  asa: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  accion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radios.lg,
    marginBottom: 10,
  },
  accionIcono: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
