-- ============================================================================
--  Datos de prueba para clinica_db
--  Ejecutar DESPUES de schema.sql:
--      mysql -u root -p < sql/seed.sql
--
--  Alternativa recomendada (calcula fechas relativas a hoy):
--      python -m app.seed
--
--  Credenciales de acceso:
--      doctor@clinica.com / 123456
--      laura@clinica.com  / 123456
--  (los password_hash de abajo son hashes bcrypt de "123456")
-- ============================================================================

USE clinica_db;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE fotos_paciente;
TRUNCATE TABLE signos_vitales;
TRUNCATE TABLE notas_medicas;
TRUNCATE TABLE citas;
TRUNCATE TABLE pacientes;
TRUNCATE TABLE usuarios;
SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
-- Usuarios (doctores)
-- ----------------------------------------------------------------------------
INSERT INTO usuarios (id, nombre, email, password_hash, rol, especialidad, telefono, avatar_url) VALUES
(1, 'Dr. Carlos Lopez', 'doctor@clinica.com', '$2b$12$G3M3VQJX53LyKYXeofnl.ebCLrm0b4d494A2Ek9KHao1cKQQTxpse', 'doctor', 'Medicina General', '552 100 2030', 'https://randomuser.me/api/portraits/men/32.jpg'),
(2, 'Dra. Laura Mendez', 'laura@clinica.com',  '$2b$12$eMjVMpdfLUJO.ncdXShK0e4gGOyzRZpVqg0NaY55Q0rlkWgmG2lx6', 'doctor', 'Pediatria',        '552 100 2031', 'https://randomuser.me/api/portraits/women/44.jpg');

-- ----------------------------------------------------------------------------
-- Pacientes
-- ----------------------------------------------------------------------------
INSERT INTO pacientes (id, codigo, nombre, apellidos, fecha_nacimiento, sexo, telefono, email, direccion, tipo_sangre, alergias, foto_url, doctor_id) VALUES
(1, '001', 'Juan',   'Perez',     '1999-04-15', 'masculino', '552 123 4567', 'juanperez@gmail.com', 'Av. Reforma 123, CDMX',                  'O+',  'Ninguna conocida', 'https://randomuser.me/api/portraits/men/11.jpg',   1),
(2, '002', 'Maria',  'Lopez',     '1992-08-03', 'femenino',  '552 234 5678', 'marialopez@gmail.com','Calle Juarez 45, CDMX',                  'A+',  'Penicilina',       'https://randomuser.me/api/portraits/women/21.jpg', 1),
(3, '003', 'Carlos', 'Hernandez', '1979-12-20', 'masculino', '552 345 6789', 'carlosh@gmail.com',   'Blvd. Bernardo Quintana 200, Queretaro', 'B+',  'Polen',            'https://randomuser.me/api/portraits/men/45.jpg',   1),
(4, '004', 'Ana',    'Martinez',  '1996-06-09', 'femenino',  '552 456 7890', 'anam@gmail.com',      'Av. Universidad 800, Queretaro',         'O-',  'Ninguna conocida', 'https://randomuser.me/api/portraits/women/33.jpg', 1),
(5, '005', 'Luis',   'Ramirez',   '1987-02-27', 'masculino', '552 567 8901', 'luisr@gmail.com',     'Calle Hidalgo 15, El Marques',           'AB+', 'Mariscos',         'https://randomuser.me/api/portraits/men/76.jpg',   1),
(6, '006', 'Sofia',  'Gomez',     '1998-10-01', 'femenino',  '552 678 9012', 'sofiag@gmail.com',    'Privada Los Olivos 8, Corregidora',      'A-',  'Ibuprofeno',       'https://randomuser.me/api/portraits/women/68.jpg', 1);

-- ----------------------------------------------------------------------------
-- Citas (fechas relativas a la fecha actual del servidor)
-- ----------------------------------------------------------------------------
INSERT INTO citas (paciente_id, doctor_id, fecha, hora, motivo, consultorio, estado) VALUES
(1, 1, CURDATE(),                       '10:00:00', 'Control general',       'Consultorio 1', 'confirmada'),
(2, 1, CURDATE(),                       '11:30:00', 'Dolor de cabeza',       'Consultorio 1', 'confirmada'),
(3, 1, CURDATE(),                       '15:00:00', 'Seguimiento',           'Consultorio 2', 'pendiente'),
(1, 1, DATE_ADD(CURDATE(), INTERVAL  7 DAY), '10:00:00', 'Revision de resultados', 'Consultorio 1', 'confirmada'),
(4, 1, DATE_ADD(CURDATE(), INTERVAL  2 DAY), '09:30:00', 'Primera consulta',       'Consultorio 3', 'pendiente'),
(5, 1, DATE_ADD(CURDATE(), INTERVAL  4 DAY), '13:00:00', 'Control de presion',     'Consultorio 2', 'confirmada'),
(6, 1, DATE_ADD(CURDATE(), INTERVAL 10 DAY), '16:00:00', 'Chequeo anual',          'Consultorio 1', 'pendiente'),
(1, 1, DATE_SUB(CURDATE(), INTERVAL 30 DAY), '10:00:00', 'Consulta inicial',       'Consultorio 1', 'completada'),
(2, 1, DATE_SUB(CURDATE(), INTERVAL 45 DAY), '12:00:00', 'Dolor abdominal',        'Consultorio 2', 'completada');

-- ----------------------------------------------------------------------------
-- Notas medicas
-- ----------------------------------------------------------------------------
INSERT INTO notas_medicas (paciente_id, doctor_id, fecha, titulo, contenido) VALUES
(1, 1, DATE_SUB(CURDATE(), INTERVAL  5 DAY), 'Control general',  'Paciente en buen estado general. Peso: 75 kg, Presion: 120/80. Se recomienda mantener actividad fisica.'),
(1, 1, DATE_SUB(CURDATE(), INTERVAL 40 DAY), 'Seguimiento',      'Refiere mejoria en sintomas. Peso: 74 kg, Presion: 118/78.'),
(1, 1, DATE_SUB(CURDATE(), INTERVAL 90 DAY), 'Primera consulta', 'Dolor de cabeza leve. Se recomienda reposo e hidratacion.'),
(2, 1, DATE_SUB(CURDATE(), INTERVAL 10 DAY), 'Cefalea',          'Cefalea tensional. Se indica analgesico y control de estres.'),
(3, 1, DATE_SUB(CURDATE(), INTERVAL 15 DAY), 'Hipertension',     'Presion arterial elevada. Se ajusta medicamento y dieta baja en sodio.');

-- ----------------------------------------------------------------------------
-- Signos vitales
-- ----------------------------------------------------------------------------
INSERT INTO signos_vitales (paciente_id, fecha, peso, estatura, presion_sistolica, presion_diastolica, temperatura, frecuencia_cardiaca) VALUES
(1, DATE_SUB(CURDATE(), INTERVAL 90 DAY), 73.50, 1.75, 122, 82, 36.5, 74),
(1, DATE_SUB(CURDATE(), INTERVAL 60 DAY), 74.20, 1.75, 120, 80, 36.6, 72),
(1, DATE_SUB(CURDATE(), INTERVAL 40 DAY), 74.00, 1.75, 118, 78, 36.4, 70),
(1, DATE_SUB(CURDATE(), INTERVAL 20 DAY), 74.80, 1.75, 121, 79, 36.7, 73),
(1, DATE_SUB(CURDATE(), INTERVAL  5 DAY), 75.00, 1.75, 120, 80, 36.5, 71),
(2, DATE_SUB(CURDATE(), INTERVAL 30 DAY), 62.00, 1.63, 115, 75, 36.6, 78),
(2, DATE_SUB(CURDATE(), INTERVAL 10 DAY), 61.40, 1.63, 117, 76, 36.8, 76),
(3, DATE_SUB(CURDATE(), INTERVAL 15 DAY), 88.30, 1.80, 142, 92, 36.9, 82);

-- ----------------------------------------------------------------------------
-- Fotos del expediente
-- ----------------------------------------------------------------------------
INSERT INTO fotos_paciente (paciente_id, url, descripcion) VALUES
(1, 'https://images.unsplash.com/photo-1583912267550-d6c2ac3196c0?w=600', 'Radiografia de torax'),
(1, 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=600', 'Resultados de laboratorio');
