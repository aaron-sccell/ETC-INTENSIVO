"""Arranca el servidor de desarrollo escuchando en toda la red local.

Equivale a:  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
Escuchar en 0.0.0.0 permite que el celular con Expo Go alcance la API.
"""

import socket

import uvicorn


def ip_local() -> str:
    """Detecta la IP de la maquina en la red local (la que debe usar el celular)."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        return s.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        s.close()


if __name__ == "__main__":
    ip = ip_local()
    print("=" * 60)
    print("  API Clinica")
    print(f"  Documentacion local : http://127.0.0.1:8000/docs")
    print(f"  Desde el celular    : http://{ip}:8000")
    print(f"  Pon esta URL en mobile/.env -> EXPO_PUBLIC_API_URL=http://{ip}:8000")
    print("=" * 60)
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
