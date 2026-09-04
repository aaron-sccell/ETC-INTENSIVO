# ETC Intensivo — Gestión de Clínica

Monorepo del proyecto de **ETC de Programación Móvil (UPQ)**: una app para gestionar
pacientes, citas y expedientes médicos.

| Carpeta | Qué contiene | Tecnología |
|---------|--------------|------------|
| [`/backend`](backend/) | API REST + base de datos | Python 3.11 · FastAPI · MySQL · SQLAlchemy · JWT |
| [`/mobile`](mobile/) | Aplicación móvil | React Native · Expo SDK 54 (Expo Go) · React Navigation · axios |

---

## Arranque rápido

### 1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate            # Windows  (macOS/Linux: source venv/bin/activate)
pip install -r requirements.txt
copy .env.example .env            # y edita DB_USER / DB_PASSWORD
python -m app.seed                # crea la BD, las tablas y los datos de prueba
python run.py                     # levanta la API en http://0.0.0.0:8000
```

Documentación interactiva: <http://127.0.0.1:8000/docs>

### 2. Mobile

```bash
cd mobile
npm install
npx expo start                    # escanea el QR con Expo Go
```

### 3. Entrar

```
Correo:     doctor@clinica.com
Contraseña: 123456
```

Instrucciones detalladas: [backend/README.md](backend/README.md) y
[mobile/README.md](mobile/README.md).

---

## Funcionalidades

- **Autenticación** con email + contraseña, JWT firmado (HS256) y refresh token.
  Contraseñas hasheadas con bcrypt; el token se guarda cifrado en el dispositivo.
- **Pacientes**: lista con búsqueda y filtros, alta, edición y eliminación.
- **Ficha del paciente** con tabs *Resumen · Citas · Notas · Fotos*.
- **Citas**: agenda general y por paciente, tabs *Próximas* / *Historial*,
  creación y edición con selector de paciente, fecha, hora, motivo y doctor.
- **Notas médicas** cronológicas por paciente.
- **Signos vitales** (peso, presión, temperatura, frecuencia cardiaca) con
  gráfica de línea del historial.
- **Notificaciones locales** que recuerdan cada cita 60 minutos antes.
- **Ajustes y perfil** del doctor, con switch funcional de modo oscuro.

---

## Arquitectura

```
     ┌───────────────────────────┐        HTTP/JSON          ┌──────────────────────┐
     │   App Expo (React Native) │  ───────────────────────▶  │   API FastAPI        │
     │                           │   Authorization: Bearer    │                      │
     │  screens/  ── navigation  │  ◀───────────────────────  │  routers/ ── deps    │
     │  context/  ── api/axios   │                            │  schemas/ ── models  │
     └───────────────────────────┘                            └──────────┬───────────┘
                                                                         │ SQLAlchemy
                                                                         ▼
                                                              ┌──────────────────────┐
                                                              │      MySQL 8         │
                                                              │  usuarios, pacientes │
                                                              │  citas, notas,       │
                                                              │  signos, fotos       │
                                                              └──────────────────────┘
```

---

## Modelo de datos

| Tabla | Descripción |
|-------|-------------|
| `usuarios` | Doctores que inician sesión (email único, hash bcrypt, rol) |
| `pacientes` | Expediente: código, nombre, nacimiento, sexo, contacto, tipo de sangre, alergias |
| `citas` | Fecha, hora, motivo, consultorio, estado, paciente y doctor |
| `notas_medicas` | Notas clínicas por paciente y fecha |
| `signos_vitales` | Peso, estatura, presión, temperatura y frecuencia cardiaca |
| `fotos_paciente` | Imágenes o estudios adjuntos al expediente |

Los scripts SQL están en [backend/sql/schema.sql](backend/sql/schema.sql) y
[backend/sql/seed.sql](backend/sql/seed.sql). El seed en Python
([backend/app/seed.py](backend/app/seed.py)) hace lo mismo y calcula las fechas
relativas al día de hoy.

---

## Endpoints principales

```
POST   /auth/login                    POST   /auth/refresh      POST /auth/logout
GET    /pacientes                     POST   /pacientes
GET    /pacientes/{id}                PUT    /pacientes/{id}    DELETE /pacientes/{id}
GET    /pacientes/{id}/expediente
GET    /citas                         POST   /citas
GET    /citas/{id}                    PUT    /citas/{id}        DELETE /citas/{id}
GET    /pacientes/{id}/notas          POST   /pacientes/{id}/notas
PUT    /notas/{id}                    DELETE /notas/{id}
GET    /pacientes/{id}/signos         POST   /pacientes/{id}/signos
GET    /usuarios/me                   PUT    /usuarios/me
```

Todos menos `/auth/*` y `/health` requieren `Authorization: Bearer <token>`.
El detalle completo está en `/docs` (Swagger UI) y en el
[README del backend](backend/README.md#6-endpoints-disponibles).
