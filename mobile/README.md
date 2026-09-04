# Mobile — App Clínica (React Native + Expo SDK 54)

Aplicación móvil para la gestión de una clínica: login con JWT, pacientes, citas,
notas médicas, signos vitales, recordatorios con notificaciones locales y modo oscuro.

Funciona en **Expo Go** (Android e iOS), sin necesidad de compilar nada.

---

## 1. Requisitos

| Herramienta | Versión |
|-------------|---------|
| Node.js     | 20 LTS o superior |
| npm         | incluido con Node |
| Expo Go     | app instalada en tu celular ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) · [iOS](https://apps.apple.com/app/expo-go/id982107779)) |
| Backend     | la API de `/backend` corriendo (ver su README) |

> **Importante:** la computadora y el celular deben estar conectados a la
> **misma red Wi-Fi**.

---

## 2. Instalación

```bash
cd mobile
npm install
```

Esto instala Expo, React Navigation, axios y el resto de dependencias listadas en
`package.json`.

---

## 3. Configurar la URL de la API

La app resuelve la URL del backend en este orden (ver [src/config.js](src/config.js)):

1. **La variable `EXPO_PUBLIC_API_URL` de un archivo `.env`** (lo más explícito).
2. **Detección automática:** si no hay `.env`, toma la IP de la computadora donde
   corre Metro (la misma del QR) y le agrega el puerto `8000`.
3. `http://127.0.0.1:8000` como último recurso.

### Opción A — Dejar la detección automática (más simple)

No hagas nada. Solo asegúrate de levantar el backend con:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Opción B — Fijar la URL a mano

```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Edita `.env` con la IP de tu computadora:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.72:8000
```

| Dónde corres la app | Qué poner |
|---------------------|-----------|
| Celular físico con Expo Go | `http://TU_IP_LOCAL:8000` |
| Emulador de Android Studio | `http://10.0.2.2:8000` |
| Simulador de iOS / navegador | `http://127.0.0.1:8000` |

Para obtener tu IP local: `ipconfig` en Windows (busca *Dirección IPv4*), o
simplemente arranca el backend con `python run.py`, que la imprime.

> Después de editar `.env` **reinicia Metro limpiando la caché**:
> `npx expo start -c`

---

## 4. Correr la app

```bash
npx expo start
```

En la terminal aparecerá un **código QR**:

- **Android:** abre la app **Expo Go** → *Scan QR code* → apunta al QR.
- **iOS:** abre la **cámara** del iPhone → apunta al QR → toca la notificación
  que aparece arriba.

Otras teclas útiles mientras Metro está corriendo:

| Tecla | Acción |
|-------|--------|
| `a`   | Abrir en emulador de Android |
| `i`   | Abrir en simulador de iOS |
| `w`   | Abrir en el navegador |
| `r`   | Recargar la app |
| `j`   | Abrir el depurador |

### Si el QR no conecta

Tu red puede estar bloqueando la conexión directa (redes de escuela, hoteles,
etc.). Usa el modo túnel:

```bash
npx expo start --tunnel
```

En ese caso la detección automática de IP no sirve: crea el `.env` con la IP
local real de tu computadora.

---

## 5. Credenciales de prueba

Si ya ejecutaste el seed del backend (`python -m app.seed`):

```
Correo:     doctor@clinica.com
Contraseña: 123456
```

---

## 6. Pantallas y navegación

**Bottom Tab Navigator** (5 pestañas):

| Pestaña | Pantalla |
|---------|----------|
| Inicio | Saludo, resumen, accesos rápidos y próximas citas |
| Pacientes | Buscador, filtros y lista con botón flotante `+` |
| **`+` central** | Menú de acceso rápido (Nueva cita / Nuevo paciente) |
| Citas | Agenda agrupada por fecha, tabs *Próximas* / *Historial* |
| Perfil | Ajustes, modo oscuro, notificaciones y cerrar sesión |

**Native Stack Navigator** (pantallas de detalle):

- `PacienteDetalle` — tabs *Resumen · Citas · Notas · Fotos*
- `PacienteForm` — alta y edición de paciente
- `CitasPaciente` — citas de un paciente (*Próximas* / *Historial*)
- `CitaForm` — nueva cita / editar cita, con switch de recordatorio
- `Notas` y `NotaForm` — notas médicas
- `Signos` y `SignoForm` — signos vitales con gráfica de línea
- `Fotos` — imágenes del expediente
- `Perfil` — información personal del doctor

Fuera de sesión: `Login`, `Registro` y `Recuperar`.

---

## 7. Estructura del proyecto

```
mobile/
├── App.js                      # Providers (tema + auth) y navegador raíz
├── index.js                    # Punto de entrada de Expo
├── app.json                    # Configuración de Expo (permisos, plugins)
├── .env.example                # Plantilla de EXPO_PUBLIC_API_URL
└── src/
    ├── config.js               # Resolución de la URL de la API
    ├── api/
    │   ├── client.js           # axios + interceptores + almacenamiento del token
    │   └── services.js         # Una función por endpoint de la API
    ├── context/
    │   ├── AuthContext.js      # Sesión, login/logout, perfil
    │   └── ThemeContext.js     # Modo claro/oscuro persistido
    ├── theme/theme.js          # Paleta, radios, espacios y sombras
    ├── components/
    │   ├── UI.js               # Tarjeta, Boton, Campo, Etiqueta, Tabs, estados
    │   ├── Avatar.js           # Foto o iniciales
    │   ├── Selectores.js       # Selector de lista, calendario y hora
    │   └── GraficaLinea.js     # Gráfica SVG de signos vitales
    ├── navigation/RootNavigator.js
    ├── screens/                # 15 pantallas
    └── utils/
        ├── format.js           # Fechas, horas, iniciales, etiquetas
        └── notifications.js    # Notificaciones locales de recordatorio
```

---

## 8. Cómo está resuelto cada requerimiento

| Requerimiento | Dónde |
|---------------|-------|
| Autenticación JWT | [src/context/AuthContext.js](src/context/AuthContext.js) + [src/api/client.js](src/api/client.js) |
| Token guardado seguro | `expo-secure-store` (Keychain/Keystore), con respaldo en AsyncStorage |
| Renovación de token | Interceptor de respuesta 401 → `POST /auth/refresh` |
| Lista de pacientes con búsqueda | [src/screens/PacientesScreen.js](src/screens/PacientesScreen.js) (búsqueda con retardo de 350 ms) |
| Ficha con historial | [src/screens/PacienteDetalleScreen.js](src/screens/PacienteDetalleScreen.js) usando `/pacientes/{id}/expediente` |
| Gestión de citas | [src/screens/CitaFormScreen.js](src/screens/CitaFormScreen.js) |
| Notas y signos vitales | `NotasScreen`, `NotaFormScreen`, `SignosScreen`, `SignoFormScreen` |
| Gráfica de peso y presión | [src/components/GraficaLinea.js](src/components/GraficaLinea.js) con `react-native-svg` |
| Notificaciones locales | [src/utils/notifications.js](src/utils/notifications.js) con `expo-notifications` |
| Modo oscuro | [src/context/ThemeContext.js](src/context/ThemeContext.js), switch en Ajustes |
| Estados de carga y error | Componentes `Cargando`, `EstadoError` y `EstadoVacio` en cada pantalla |

---

## 9. Notificaciones locales en Expo Go

La app programa un recordatorio **60 minutos antes** de cada cita (configurable en
`MINUTOS_RECORDATORIO` de [src/config.js](src/config.js)).

- Las notificaciones **locales** sí funcionan dentro de Expo Go.
- Las notificaciones **push remotas** ya no funcionan en Expo Go; este proyecto
  no las usa.
- Para probarlo rápido en el video: *Perfil → Notificaciones* (apaga y enciende el
  switch) dispara una notificación de prueba a los 3 segundos.
- *Perfil → Recordatorios programados* lista los recordatorios pendientes.

---

## 10. Problemas comunes

| Síntoma | Solución |
|---------|----------|
| "No se pudo conectar con el servidor" | El backend no está corriendo, o se levantó sin `--host 0.0.0.0`, o la IP del `.env` está mal. |
| El QR carga pero la app queda en blanco | Reinicia con `npx expo start -c` para limpiar la caché de Metro. |
| Funciona en la computadora pero no en el celular | Firewall de Windows bloqueando el puerto 8000, o el celular está en otra red (revisa que no esté en datos móviles). |
| `Unable to resolve module ...` | Faltó `npm install`, o borra `node_modules` y vuelve a instalar. |
| Al iniciar sesión dice "Correo o contraseña incorrectos" | Ejecuta el seed del backend: `python -m app.seed`. |
| La app pide iniciar sesión cada vez | Es normal en el primer arranque; el token se guarda tras el primer login exitoso. |
| Cambié el `.env` y no toma efecto | `npx expo start -c` (las variables `EXPO_PUBLIC_*` se inyectan en tiempo de compilación). |

Para abrir el puerto 8000 en el Firewall de Windows (PowerShell como administrador):

```powershell
New-NetFirewallRule -DisplayName "API Clinica 8000" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
```
