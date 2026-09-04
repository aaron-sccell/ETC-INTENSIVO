-- ============================================================================
--  Base de datos de la Clinica  --  MySQL 8.x
--  Ejecutar con:  mysql -u root -p < sql/schema.sql
--  (Alternativa manual al arranque automatico de FastAPI/SQLAlchemy)
-- ============================================================================

CREATE DATABASE IF NOT EXISTS clinica_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE clinica_db;

-- ----------------------------------------------------------------------------
-- Usuarios (doctores)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(120)  NOT NULL,
    email           VARCHAR(150)  NOT NULL UNIQUE,
    password_hash   VARCHAR(255)  NOT NULL,
    rol             VARCHAR(30)   NOT NULL DEFAULT 'doctor',
    especialidad    VARCHAR(120)  NULL,
    telefono        VARCHAR(30)   NULL,
    avatar_url      VARCHAR(500)  NULL,
    activo          TINYINT(1)    NOT NULL DEFAULT 1,
    created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                  ON UPDATE CURRENT_TIMESTAMP,
    INDEX ix_usuarios_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- Pacientes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pacientes (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    codigo            VARCHAR(20)   NOT NULL UNIQUE,
    nombre            VARCHAR(80)   NOT NULL,
    apellidos         VARCHAR(80)   NOT NULL,
    fecha_nacimiento  DATE          NULL,
    sexo              ENUM('masculino','femenino','otro') NOT NULL DEFAULT 'otro',
    telefono          VARCHAR(30)   NULL,
    email             VARCHAR(150)  NULL,
    direccion         VARCHAR(255)  NULL,
    tipo_sangre       VARCHAR(10)   NULL,
    alergias          TEXT          NULL,
    foto_url          VARCHAR(500)  NULL,
    activo            TINYINT(1)    NOT NULL DEFAULT 1,
    doctor_id         INT           NULL,
    created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP,
    INDEX ix_pacientes_codigo (codigo),
    INDEX ix_pacientes_nombre (nombre, apellidos),
    CONSTRAINT fk_pacientes_doctor FOREIGN KEY (doctor_id)
        REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- Citas
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS citas (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    paciente_id    INT           NOT NULL,
    doctor_id      INT           NULL,
    fecha          DATE          NOT NULL,
    hora           TIME          NOT NULL,
    motivo         VARCHAR(255)  NOT NULL,
    consultorio    VARCHAR(60)   NULL,
    estado         ENUM('pendiente','confirmada','cancelada','completada')
                   NOT NULL DEFAULT 'pendiente',
    observaciones  TEXT          NULL,
    created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                 ON UPDATE CURRENT_TIMESTAMP,
    INDEX ix_citas_paciente (paciente_id),
    INDEX ix_citas_fecha (fecha),
    CONSTRAINT fk_citas_paciente FOREIGN KEY (paciente_id)
        REFERENCES pacientes(id) ON DELETE CASCADE,
    CONSTRAINT fk_citas_doctor FOREIGN KEY (doctor_id)
        REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- Notas medicas
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notas_medicas (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    paciente_id  INT           NOT NULL,
    doctor_id    INT           NULL,
    fecha        DATE          NOT NULL,
    titulo       VARCHAR(150)  NULL,
    contenido    TEXT          NOT NULL,
    created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP,
    INDEX ix_notas_paciente (paciente_id),
    INDEX ix_notas_fecha (fecha),
    CONSTRAINT fk_notas_paciente FOREIGN KEY (paciente_id)
        REFERENCES pacientes(id) ON DELETE CASCADE,
    CONSTRAINT fk_notas_doctor FOREIGN KEY (doctor_id)
        REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- Signos vitales
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS signos_vitales (
    id                   INT AUTO_INCREMENT PRIMARY KEY,
    paciente_id          INT           NOT NULL,
    fecha                DATE          NOT NULL,
    peso                 DECIMAL(5,2)  NULL,
    estatura             DECIMAL(4,2)  NULL,
    presion_sistolica    INT           NULL,
    presion_diastolica   INT           NULL,
    temperatura          DECIMAL(4,1)  NULL,
    frecuencia_cardiaca  INT           NULL,
    notas                TEXT          NULL,
    created_at           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX ix_signos_paciente (paciente_id),
    INDEX ix_signos_fecha (fecha),
    CONSTRAINT fk_signos_paciente FOREIGN KEY (paciente_id)
        REFERENCES pacientes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- Fotos del expediente
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fotos_paciente (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    paciente_id  INT           NOT NULL,
    url          VARCHAR(500)  NOT NULL,
    descripcion  VARCHAR(255)  NULL,
    created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX ix_fotos_paciente (paciente_id),
    CONSTRAINT fk_fotos_paciente FOREIGN KEY (paciente_id)
        REFERENCES pacientes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
