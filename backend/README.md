# Backend — API REST Clínica (FastAPI + MySQL)

API REST para la gestión de una clínica: autenticación con JWT, pacientes, citas,
notas médicas y signos vitales. Documentación automática (OpenAPI 3.1) en `/docs`.

---

## 1. Requisitos

| Herramienta | Versión |
|-------------|---------|
| Python      | 3.11 o superior (probado en **3.14**) |
| MySQL       | 8.0 o superior (también sirve MariaDB 10.6+) |
| pip         | incluido con Python |

`requirements.txt` usa versiones mínimas (`>=`) en lugar de versiones fijas, para
que pip instale las ruedas (*wheels*) correspondientes a tu versión de Python.

Verifica tu versión:

```bash
python --version
mysql --version
```

---

## 2. Instalación paso a paso

### 2.1 Entrar a la carpeta y crear el entorno virtual

**Windows (PowerShell):**

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
```

Si PowerShell bloquea el script de activación, ejecuta una vez:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

**macOS / Linux:**

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
```

### 2.2 Instalar dependencias

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 2.3 Configurar las variables de entorno

Copia la plantilla y edítala con los datos de tu MySQL:

**Windows:**
```powershell
copy .env.example .env
```

**macOS / Linux:**
```bash
cp .env.example .env
```

Abre `.env` y ajusta al menos:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password_de_mysql
DB_NAME=clinica_db
JWT_SECRET=una-clave-larga-y-secreta
CORS_ORIGINS=*
```

> `JWT_SECRET` puede ser cualquier cadena larga. Para generar una:
> `python -c "import secrets; print(secrets.token_urlsafe(48))"`

---

## 3. Crear la base de datos y los datos de prueba

Tienes **dos formas**; elige una.

### Opción A — Automática (recomendada)

Este comando crea la base de datos, todas las tablas y carga los datos de ejemplo:

```bash
python -m app.seed
```

Salida esperada:

```
Datos de prueba cargados correctamente.
----------------------------------------------------
  Usuario:    doctor@clinica.com
  Contrasena: 123456
----------------------------------------------------
```

Para borrar todo y volver a empezar de cero:

```bash
python -m app.seed --reset
```

### Opción B — Manual con scripts SQL

```bash
mysql -u root -p < sql/schema.sql
mysql -u root -p < sql/seed.sql
```

En Windows, si `mysql` no está en el PATH, usa la ruta completa, por ejemplo:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p < sql/schema.sql
```

---

## 4. Levantar el servidor

### Opción rápida (muestra tu IP de red local)

```bash
python run.py
```

### Opción con uvicorn directamente

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

> **`--host 0.0.0.0` es obligatorio** para que tu celular con Expo Go pueda
> alcanzar la API. Con `127.0.0.1` solo funcionaría desde la misma computadora.

Ahora abre:

- **Swagger UI (documentación interactiva):** http://127.0.0.1:8000/docs
- **ReDoc:** http://127.0.0.1:8000/redoc
- **Health check:** http://127.0.0.1:8000/health

### Averiguar tu IP local (la que usarás en la app móvil)

`python run.py` la imprime al arrancar. También puedes usar:

- Windows: `ipconfig` → *Dirección IPv4* (ej. `192.168.1.72`)
- macOS/Linux: `ifconfig | grep inet` o `hostname -I`

Prueba desde el navegador del celular: `http://TU_IP:8000/health`

---

## 5. Probar la API desde Swagger

1. Entra a http://127.0.0.1:8000/docs
2. Abre `POST /auth/login` → **Try it out** y envía:

```json
{ "email": "doctor@clinica.com", "password": "123456" }
```

3. Copia el valor de `access_token` de la respuesta.
4. Presiona el botón **Authorize** (candado, arriba a la derecha), pega el token
   y confirma. A partir de ahí todos los endpoints protegidos funcionarán.

También puedes probarlo con curl:

```bash
curl -X POST http://127.0.0.1:8000/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"doctor@clinica.com\",\"password\":\"123456\"}"

curl http://127.0.0.1:8000/pacientes -H "Authorization: Bearer <TU_TOKEN>"
```

---

## 6. Endpoints disponibles

Todos los endpoints protegidos exigen el header `Authorization: Bearer <token>`.
Las respuestas son siempre JSON. Códigos usados: `200`, `201`, `400`, `401`, `403`, `404`, `500`.

### Autenticación (público)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/auth/login` | Recibe `{email, password}` → `{access_token, refresh_token, token_type, expires_in, user}` |
| POST | `/auth/register` | Da de alta un doctor y devuelve el token |
| POST | `/auth/refresh` | Renueva el `access_token` a partir del `refresh_token` |
| POST | `/auth/logout` | Cierra sesión (el cliente descarta el token) |

### Pacientes 🔒

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/pacientes?q=juan` | Lista con búsqueda por nombre, apellidos, código, teléfono o correo |
| POST | `/pacientes` | Crea un paciente (el `codigo` se autogenera: `001`, `002`, …) |
| GET | `/pacientes/{id}` | Detalle |
| PUT | `/pacientes/{id}` | Actualiza (campos parciales) |
| DELETE | `/pacientes/{id}` | Elimina (en cascada sus citas, notas, signos y fotos) |
| GET | `/pacientes/{id}/expediente` | Paciente + citas + notas + signos + fotos en una sola llamada |
| GET / POST | `/pacientes/{id}/fotos` | Fotos del expediente |

### Citas 🔒

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/citas` | Filtros: `paciente_id`, `estado`, `desde`, `hasta`, `proximas=true` |
| POST | `/citas` | Crea una cita |
| GET | `/citas/{id}` | Detalle |
| PUT | `/citas/{id}` | Actualiza |
| DELETE | `/citas/{id}` | Elimina |

### Notas médicas 🔒

| Método | Ruta |
|--------|------|
| GET | `/pacientes/{id}/notas` |
| POST | `/pacientes/{id}/notas` |
| PUT | `/notas/{id}` |
| DELETE | `/notas/{id}` |

### Signos vitales 🔒

| Método | Ruta |
|--------|------|
| GET | `/pacientes/{id}/signos` |
| POST | `/pacientes/{id}/signos` |
| DELETE | `/signos/{id}` |

### Usuarios 🔒

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/usuarios/me` | Perfil del doctor autenticado |
| PUT | `/usuarios/me` | Actualiza nombre, correo, teléfono, especialidad o contraseña |
| GET | `/usuarios` | Lista de doctores (para el selector de "Nueva cita") |

---

## 7. Estructura del proyecto

```
backend/
├── app/
│   ├── main.py            # App FastAPI, CORS, manejadores de error, routers
│   ├── config.py          # Lectura del .env con pydantic-settings
│   ├── database.py        # Engine SQLAlchemy, sesión y creación de la BD
│   ├── models.py          # Modelos ORM (tablas)
│   ├── schemas.py         # Esquemas Pydantic (validación y respuestas)
│   ├── security.py        # Hash bcrypt + emisión/validación de JWT
│   ├── deps.py            # Dependencia que valida el Bearer token
│   ├── seed.py            # Creación de BD + datos de prueba
│   └── routers/
│       ├── auth.py        # /auth/*
│       ├── usuarios.py    # /usuarios/*
│       ├── pacientes.py   # /pacientes/*
│       ├── citas.py       # /citas/*
│       ├── notas.py       # /pacientes/{id}/notas y /notas/{id}
│       └── signos.py      # /pacientes/{id}/signos
├── sql/
│   ├── schema.sql         # CREATE DATABASE + CREATE TABLE
│   └── seed.sql           # INSERT de datos de prueba
├── requirements.txt
├── .env.example
├── run.py
└── README.md
```

---

## 8. Seguridad

- Las contraseñas se guardan **hasheadas con bcrypt**, nunca en texto plano.
- El login emite un **JWT firmado (HS256)** con la clave de `JWT_SECRET`.
  El token contiene el id del usuario (`sub`), el tipo y la expiración (`exp`).
- Cada endpoint protegido pasa por `get_current_user` ([app/deps.py](app/deps.py)),
  que valida la firma, la expiración y que el usuario siga activo.
- El `refresh_token` (30 días) permite renovar el `access_token` (24 h) sin
  volver a pedir la contraseña.

---

## 9. Problemas comunes

| Error | Solución |
|-------|----------|
| `Can't connect to MySQL server` | MySQL no está corriendo, o `DB_HOST`/`DB_PORT` están mal en `.env`. |
| `Access denied for user 'root'@'localhost'` | `DB_USER` / `DB_PASSWORD` incorrectos en `.env`. |
| `Unknown database 'clinica_db'` | Ejecuta `python -m app.seed` (crea la BD automáticamente). |
| El celular no carga la API | Levanta con `--host 0.0.0.0`, usa la IP local (no `localhost`) y permite el puerto 8000 en el Firewall de Windows. |
| `ModuleNotFoundError` | No activaste el entorno virtual o faltó `pip install -r requirements.txt`. |
| `401 Unauthorized` en Swagger | Falta presionar **Authorize** y pegar el `access_token`. |

Para abrir el puerto 8000 en el Firewall de Windows (PowerShell como administrador):

```powershell
New-NetFirewallRule -DisplayName "API Clinica 8000" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
```
