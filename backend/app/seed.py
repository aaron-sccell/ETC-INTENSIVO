"""Crea la base de datos, las tablas y carga datos de prueba.

Uso:
    python -m app.seed          # crea todo (no duplica si ya hay datos)
    python -m app.seed --reset  # borra las tablas y las vuelve a crear
"""

import sys
from datetime import date, time, timedelta

from sqlalchemy import select

from .database import Base, SessionLocal, create_tables, engine, ensure_database_exists
from .models import Cita, FotoPaciente, NotaMedica, Paciente, SignoVital, Usuario
from .security import hash_password

AVATAR = "https://randomuser.me/api/portraits"

DOCTORES = [
    {
        "nombre": "Dr. Carlos Lopez",
        "email": "doctor@clinica.com",
        "password": "123456",
        "especialidad": "Medicina General",
        "telefono": "552 100 2030",
        "avatar_url": f"{AVATAR}/men/32.jpg",
    },
    {
        "nombre": "Dra. Laura Mendez",
        "email": "laura@clinica.com",
        "password": "123456",
        "especialidad": "Pediatria",
        "telefono": "552 100 2031",
        "avatar_url": f"{AVATAR}/women/44.jpg",
    },
]

PACIENTES = [
    {
        "codigo": "001",
        "nombre": "Juan",
        "apellidos": "Perez",
        "fecha_nacimiento": date(1999, 4, 15),
        "sexo": "masculino",
        "telefono": "552 123 4567",
        "email": "juanperez@gmail.com",
        "direccion": "Av. Reforma 123, CDMX",
        "tipo_sangre": "O+",
        "alergias": "Ninguna conocida",
        "foto_url": f"{AVATAR}/men/11.jpg",
    },
    {
        "codigo": "002",
        "nombre": "Maria",
        "apellidos": "Lopez",
        "fecha_nacimiento": date(1992, 8, 3),
        "sexo": "femenino",
        "telefono": "552 234 5678",
        "email": "marialopez@gmail.com",
        "direccion": "Calle Juarez 45, CDMX",
        "tipo_sangre": "A+",
        "alergias": "Penicilina",
        "foto_url": f"{AVATAR}/women/21.jpg",
    },
    {
        "codigo": "003",
        "nombre": "Carlos",
        "apellidos": "Hernandez",
        "fecha_nacimiento": date(1979, 12, 20),
        "sexo": "masculino",
        "telefono": "552 345 6789",
        "email": "carlosh@gmail.com",
        "direccion": "Blvd. Bernardo Quintana 200, Queretaro",
        "tipo_sangre": "B+",
        "alergias": "Polen",
        "foto_url": f"{AVATAR}/men/45.jpg",
    },
    {
        "codigo": "004",
        "nombre": "Ana",
        "apellidos": "Martinez",
        "fecha_nacimiento": date(1996, 6, 9),
        "sexo": "femenino",
        "telefono": "552 456 7890",
        "email": "anam@gmail.com",
        "direccion": "Av. Universidad 800, Queretaro",
        "tipo_sangre": "O-",
        "alergias": "Ninguna conocida",
        "foto_url": f"{AVATAR}/women/33.jpg",
    },
    {
        "codigo": "005",
        "nombre": "Luis",
        "apellidos": "Ramirez",
        "fecha_nacimiento": date(1987, 2, 27),
        "sexo": "masculino",
        "telefono": "552 567 8901",
        "email": "luisr@gmail.com",
        "direccion": "Calle Hidalgo 15, El Marques",
        "tipo_sangre": "AB+",
        "alergias": "Mariscos",
        "foto_url": f"{AVATAR}/men/76.jpg",
    },
    {
        "codigo": "006",
        "nombre": "Sofia",
        "apellidos": "Gomez",
        "fecha_nacimiento": date(1998, 10, 1),
        "sexo": "femenino",
        "telefono": "552 678 9012",
        "email": "sofiag@gmail.com",
        "direccion": "Privada Los Olivos 8, Corregidora",
        "tipo_sangre": "A-",
        "alergias": "Ibuprofeno",
        "foto_url": f"{AVATAR}/women/68.jpg",
    },
]


def reset_database() -> None:
    print("Borrando tablas existentes...")
    Base.metadata.drop_all(bind=engine)


def seed() -> None:
    hoy = date.today()
    db = SessionLocal()
    try:
        if db.scalar(select(Usuario).limit(1)):
            print("La base de datos ya tiene informacion. Usa --reset para recrearla.")
            return

        doctores = []
        for datos in DOCTORES:
            password = datos.pop("password")
            doctor = Usuario(**datos, password_hash=hash_password(password), rol="doctor")
            db.add(doctor)
            doctores.append(doctor)
        db.flush()

        principal = doctores[0]

        pacientes = []
        for datos in PACIENTES:
            paciente = Paciente(**datos, doctor_id=principal.id)
            db.add(paciente)
            pacientes.append(paciente)
        db.flush()

        # ---------------- Citas ----------------
        citas = [
            (pacientes[0], hoy, time(10, 0), "Control general", "Consultorio 1", "confirmada"),
            (pacientes[1], hoy, time(11, 30), "Dolor de cabeza", "Consultorio 1", "confirmada"),
            (pacientes[2], hoy, time(15, 0), "Seguimiento", "Consultorio 2", "pendiente"),
            (pacientes[0], hoy + timedelta(days=7), time(10, 0), "Revision de resultados", "Consultorio 1", "confirmada"),
            (pacientes[3], hoy + timedelta(days=2), time(9, 30), "Primera consulta", "Consultorio 3", "pendiente"),
            (pacientes[4], hoy + timedelta(days=4), time(13, 0), "Control de presion", "Consultorio 2", "confirmada"),
            (pacientes[5], hoy + timedelta(days=10), time(16, 0), "Chequeo anual", "Consultorio 1", "pendiente"),
            (pacientes[0], hoy - timedelta(days=30), time(10, 0), "Consulta inicial", "Consultorio 1", "completada"),
            (pacientes[1], hoy - timedelta(days=45), time(12, 0), "Dolor abdominal", "Consultorio 2", "completada"),
        ]
        for paciente, fecha, hora, motivo, consultorio, estado in citas:
            db.add(
                Cita(
                    paciente_id=paciente.id,
                    doctor_id=principal.id,
                    fecha=fecha,
                    hora=hora,
                    motivo=motivo,
                    consultorio=consultorio,
                    estado=estado,
                )
            )

        # ---------------- Notas medicas ----------------
        notas = [
            (pacientes[0], hoy - timedelta(days=5), "Control general", "Paciente en buen estado general. Peso: 75 kg, Presion: 120/80. Se recomienda mantener actividad fisica."),
            (pacientes[0], hoy - timedelta(days=40), "Seguimiento", "Refiere mejoria en sintomas. Peso: 74 kg, Presion: 118/78."),
            (pacientes[0], hoy - timedelta(days=90), "Primera consulta", "Dolor de cabeza leve. Se recomienda reposo e hidratacion."),
            (pacientes[1], hoy - timedelta(days=10), "Cefalea", "Cefalea tensional. Se indica analgesico y control de estres."),
            (pacientes[2], hoy - timedelta(days=15), "Hipertension", "Presion arterial elevada. Se ajusta medicamento y dieta baja en sodio."),
        ]
        for paciente, fecha, titulo, contenido in notas:
            db.add(
                NotaMedica(
                    paciente_id=paciente.id,
                    doctor_id=principal.id,
                    fecha=fecha,
                    titulo=titulo,
                    contenido=contenido,
                )
            )

        # ---------------- Signos vitales ----------------
        signos = [
            (pacientes[0], hoy - timedelta(days=90), 73.5, 1.75, 122, 82, 36.5, 74),
            (pacientes[0], hoy - timedelta(days=60), 74.2, 1.75, 120, 80, 36.6, 72),
            (pacientes[0], hoy - timedelta(days=40), 74.0, 1.75, 118, 78, 36.4, 70),
            (pacientes[0], hoy - timedelta(days=20), 74.8, 1.75, 121, 79, 36.7, 73),
            (pacientes[0], hoy - timedelta(days=5), 75.0, 1.75, 120, 80, 36.5, 71),
            (pacientes[1], hoy - timedelta(days=30), 62.0, 1.63, 115, 75, 36.6, 78),
            (pacientes[1], hoy - timedelta(days=10), 61.4, 1.63, 117, 76, 36.8, 76),
            (pacientes[2], hoy - timedelta(days=15), 88.3, 1.80, 142, 92, 36.9, 82),
        ]
        for paciente, fecha, peso, estatura, sis, dia, temp, fc in signos:
            db.add(
                SignoVital(
                    paciente_id=paciente.id,
                    fecha=fecha,
                    peso=peso,
                    estatura=estatura,
                    presion_sistolica=sis,
                    presion_diastolica=dia,
                    temperatura=temp,
                    frecuencia_cardiaca=fc,
                )
            )

        # ---------------- Fotos ----------------
        db.add(
            FotoPaciente(
                paciente_id=pacientes[0].id,
                url="https://images.unsplash.com/photo-1583912267550-d6c2ac3196c0?w=600",
                descripcion="Radiografia de torax",
            )
        )
        db.add(
            FotoPaciente(
                paciente_id=pacientes[0].id,
                url="https://images.unsplash.com/photo-1579154204601-01588f351e67?w=600",
                descripcion="Resultados de laboratorio",
            )
        )

        db.commit()

        print("Datos de prueba cargados correctamente.")
        print("-" * 52)
        print("  Usuario:    doctor@clinica.com")
        print("  Contrasena: 123456")
        print("-" * 52)
    finally:
        db.close()


def main() -> None:
    ensure_database_exists()
    if "--reset" in sys.argv:
        reset_database()
    create_tables()
    seed()


if __name__ == "__main__":
    main()
