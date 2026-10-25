"""Servidor local del portafolio (modo edición).

Sirve el sitio igual que GitHub Pages y activa el panel /admin/ para editar
posts, perfil y logros desde el navegador. Todo se guarda como archivos en
contenido/ e images/, y después de cada cambio se regenera el sitio (generar.py).

En GitHub Pages el sitio funciona en modo lectura; para editar, ejecuta esto en tu
computadora y luego sube los cambios con git.

Uso:  py servidor.py [--puerto 8780] [--sin-navegador]
Solo usa la biblioteca estándar de Python (3.8+).
"""

import argparse
import base64
import binascii
import json
import re
import shutil
import socket
import sys
import threading
import webbrowser
from datetime import datetime
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

from generar import (CARPETA_POSTS, CONTENIDO, RAIZ, archivos_post, escribir_md, generar,
                     leer_post, listar_posts, separar_etiquetas, slugificar)

CARPETA_IMAGENES = RAIZ / "images"
PAPELERA = RAIZ / ".papelera"
EXTENSIONES_IMAGEN = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif"}
TAMANO_MAXIMO = 15 * 1024 * 1024
TIPOS_LOGRO = {"certificacion", "curso", "conferencia", "reconocimiento", "otro"}
ESTADOS_PROYECTO = {"activo", "desarrollo", "terminado", "archivado"}

PLANTILLA_POST = """Escribe aquí una introducción breve: de qué trata el post.
<!--more-->

## Contexto

## Pasos

```bash
# comando de ejemplo
```

## Conclusión
"""


def texto(valor, largo=300):
    return " ".join(str(valor or "").split())[:largo]


def validar_slug(slug):
    limpio = slugificar(slug)
    if not limpio:
        raise ValueError("El slug (dirección del post) está vacío o no es válido.")
    return limpio


def ruta_post(slug):
    ruta_es, _ = archivos_post(validar_slug(slug))
    if not ruta_es.is_file():
        raise FileNotFoundError("El post no existe.")
    return ruta_es


def mover_a_papelera(ruta):
    """En lugar de borrar, mueve a .papelera/ para poder recuperarlo."""
    PAPELERA.mkdir(exist_ok=True)
    marca = datetime.now().strftime("%Y%m%d-%H%M%S")
    shutil.move(str(ruta), str(PAPELERA / f"{marca} {ruta.name}"))


# ---------------- Posts ----------------

def leer_post_completo(slug):
    ruta_post(slug)
    return leer_post(validar_slug(slug), con_cuerpo=True)


def crear_post(titulo):
    titulo = texto(titulo, 200)
    slug = slugificar(titulo)
    if not slug:
        raise ValueError("Escribe un título para el post.")
    base, n = slug, 2
    while archivos_post(slug)[0].exists():
        slug, n = f"{base}-{n}", n + 1
    escribir_md(archivos_post(slug)[0], {
        "titulo": titulo,
        "fecha": datetime.now().strftime("%Y-%m-%d"),
        "descripcion": "",
        "etiquetas": "",
        "borrador": "si",
    }, PLANTILLA_POST)
    return {"slug": slug}


def guardar_post(datos):
    slug = validar_slug(datos.get("slug"))
    ruta_es, ruta_en = archivos_post(slug)
    if not ruta_es.is_file():
        raise FileNotFoundError("El post no existe.")
    nuevo = validar_slug(datos.get("nuevoSlug") or slug)
    fecha = texto(datos.get("fecha"), 10)
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", fecha):
        raise ValueError("La fecha debe tener el formato AAAA-MM-DD.")
    es = datos.get("es") or {}
    en = datos.get("en")
    if not texto(es.get("titulo")):
        raise ValueError("El post necesita un título en español.")

    if nuevo != slug:
        destino_es, destino_en = archivos_post(nuevo)
        if destino_es.exists():
            raise FileExistsError("Ya existe un post con ese slug.")
        ruta_es = ruta_es.rename(destino_es)
        if ruta_en.exists():
            ruta_en.rename(destino_en)
        ruta_en = destino_en

    escribir_md(ruta_es, {
        "titulo": texto(es.get("titulo"), 200),
        "fecha": fecha,
        "descripcion": texto(es.get("descripcion")),
        "etiquetas": ", ".join(separar_etiquetas(es.get("etiquetas"))),
        "borrador": "si" if datos.get("borrador") else "no",
    }, es.get("cuerpo"))

    if en and (texto(en.get("titulo")) or (en.get("cuerpo") or "").strip()):
        escribir_md(ruta_en, {
            "titulo": texto(en.get("titulo"), 200),
            "descripcion": texto(en.get("descripcion")),
            "etiquetas": ", ".join(separar_etiquetas(en.get("etiquetas"))),
        }, en.get("cuerpo"))
    elif ruta_en.exists():
        mover_a_papelera(ruta_en)  # Se vació la versión en inglés.
    return {"slug": nuevo}


def borrar_post(slug):
    ruta_es = ruta_post(slug)
    _, ruta_en = archivos_post(validar_slug(slug))
    mover_a_papelera(ruta_es)
    if ruta_en.exists():
        mover_a_papelera(ruta_en)
    return {"ok": True}


# ---------------- Perfil y logros ----------------

def guardar_json(nombre, datos):
    (CONTENIDO / nombre).write_text(json.dumps(datos, ensure_ascii=False, indent=2) + "\n",
                                    encoding="utf-8", newline="\n")


def bilingue(valor, largo=300):
    valor = valor if isinstance(valor, dict) else {}
    return {"es": texto(valor.get("es"), largo), "en": texto(valor.get("en"), largo)}


def guardar_perfil(datos):
    bio = datos.get("bio") if isinstance(datos.get("bio"), dict) else {}
    perfil = {
        "nombre": texto(datos.get("nombre"), 100),
        "usuario": texto(datos.get("usuario"), 60),
        "foto": texto(datos.get("foto"), 300),
        "sitio": texto(datos.get("sitio"), 200).rstrip("/"),
        "rol": bilingue(datos.get("rol"), 150),
        "bio": {i: str(bio.get(i) or "").strip()[:5000] for i in ("es", "en")},
        "habilidades": separar_etiquetas(datos.get("habilidades"))[:40],
        "redes": [{"tipo": texto(r.get("tipo"), 30), "url": texto(r.get("url"), 300)}
                  for r in datos.get("redes") or [] if isinstance(r, dict) and texto(r.get("url"))],
    }
    if not perfil["nombre"]:
        raise ValueError("El perfil necesita un nombre.")
    guardar_json("perfil.json", perfil)
    return perfil


def guardar_logros(datos):
    logros, ids = [], set()
    for item in datos.get("logros") or []:
        if not isinstance(item, dict):
            continue
        titulo = bilingue(item.get("titulo"), 200)
        if not titulo["es"]:
            raise ValueError("Cada logro necesita un título en español.")
        fecha = texto(item.get("fecha"), 10)
        if not re.fullmatch(r"\d{4}(-\d{2}(-\d{2})?)?", fecha):
            raise ValueError(f'Fecha no válida en "{titulo["es"]}": usa AAAA, AAAA-MM o AAAA-MM-DD.')
        base = slugificar(item.get("id") or titulo["es"]) or "logro"
        identificador, n = base, 2
        while identificador in ids:
            identificador, n = f"{base}-{n}", n + 1
        ids.add(identificador)
        tipo = item.get("tipo") if item.get("tipo") in TIPOS_LOGRO else "otro"
        logros.append({
            "id": identificador,
            "tipo": tipo,
            "titulo": titulo,
            "emisor": texto(item.get("emisor"), 150),
            "fecha": fecha,
            "url": texto(item.get("url"), 400),
            "descripcion": bilingue(item.get("descripcion"), 1000),
        })
    logros.sort(key=lambda l: l["fecha"], reverse=True)
    guardar_json("logros.json", {"logros": logros})
    return {"logros": logros}


def guardar_proyectos(datos):
    """Guarda los proyectos en el orden recibido (el orden se elige en el panel)."""
    proyectos, ids = [], set()
    for item in datos.get("proyectos") or []:
        if not isinstance(item, dict):
            continue
        titulo = bilingue(item.get("titulo"), 200)
        if not titulo["es"]:
            raise ValueError("Cada proyecto necesita un nombre en español.")
        fecha = texto(item.get("fecha"), 10)
        if fecha and not re.fullmatch(r"\d{4}(-\d{2}(-\d{2})?)?", fecha):
            raise ValueError(f'Fecha no válida en "{titulo["es"]}": usa AAAA, AAAA-MM o AAAA-MM-DD.')
        base = slugificar(item.get("id") or titulo["es"]) or "proyecto"
        identificador, n = base, 2
        while identificador in ids:
            identificador, n = f"{base}-{n}", n + 1
        ids.add(identificador)
        proyectos.append({
            "id": identificador,
            "titulo": titulo,
            "descripcion": bilingue(item.get("descripcion"), 1000),
            "tecnologias": separar_etiquetas(item.get("tecnologias"))[:20],
            "url": texto(item.get("url"), 400),
            "repo": texto(item.get("repo"), 400),
            "imagen": texto(item.get("imagen"), 300),
            "fecha": fecha,
            "estado": item.get("estado") if item.get("estado") in ESTADOS_PROYECTO else "activo",
        })
    guardar_json("proyectos.json", {"proyectos": proyectos})
    return {"proyectos": proyectos}


# ---------------- Imágenes ----------------

def guardar_imagen(datos):
    carpeta = slugificar(datos.get("carpeta")) or "general"
    nombre = Path(texto(datos.get("nombre"), 120)).name
    extension = Path(nombre).suffix.lower()
    if extension not in EXTENSIONES_IMAGEN:
        raise ValueError("Formato de imagen no permitido (usa png, jpg, gif, webp o avif).")
    base = slugificar(Path(nombre).stem) or "imagen"
    contenido = str(datos.get("datos") or "")
    try:
        binario = base64.b64decode(contenido.split(",", 1)[-1], validate=True)
    except (binascii.Error, ValueError):
        raise ValueError("La imagen no se pudo leer.") from None
    if not binario or len(binario) > TAMANO_MAXIMO:
        raise ValueError("La imagen está vacía o pesa más de 15 MB.")
    destino_carpeta = CARPETA_IMAGENES / carpeta
    destino_carpeta.mkdir(parents=True, exist_ok=True)
    destino, n = destino_carpeta / f"{base}{extension}", 2
    while destino.exists():
        destino, n = destino_carpeta / f"{base}-{n}{extension}", n + 1
    destino.write_bytes(binario)
    return {"ruta": "/" + destino.relative_to(RAIZ).as_posix()}


# ---------------- HTTP ----------------

class Servidor(ThreadingHTTPServer):
    # En Windows, SO_REUSEADDR deja que dos servidores escuchen en el mismo puerto y el
    # navegador acaba hablando con el equivocado. Ahí se pide el puerto en exclusiva.
    allow_reuse_address = sys.platform != "win32"

    def server_bind(self):
        if sys.platform == "win32":
            self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
        super().server_bind()


class Manejador(SimpleHTTPRequestHandler):
    hosts_permitidos = set()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(RAIZ), **kwargs)

    def log_message(self, formato, *args):
        pass  # Mantiene la consola limpia.

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        url = urlparse(self.path)
        if url.path.startswith("/api/"):
            return self.api("GET", url)
        ruta = (RAIZ / unquote(url.path).lstrip("/")).resolve()
        oculto = any(p.startswith(".") for p in Path(unquote(url.path)).parts)
        if oculto or not ruta.exists():
            return self.pagina_404(url.path.startswith("/admin/"))
        return super().do_GET()

    def pagina_404(self, es_admin):
        # Igual que GitHub Pages: las rutas sin archivo muestran 404.html (la app decide qué pintar).
        cuerpo = (RAIZ / "404.html").read_bytes()
        self.send_response(200 if es_admin else 404)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(cuerpo)))
        self.end_headers()
        self.wfile.write(cuerpo)

    def do_POST(self):
        self.api("POST", urlparse(self.path))

    def do_PUT(self):
        self.api("PUT", urlparse(self.path))

    def do_DELETE(self):
        self.api("DELETE", urlparse(self.path))

    def peticion_confiable(self, metodo):
        # Evita que otras páginas abiertas en el navegador modifiquen tu sitio.
        if self.headers.get("Host", "") not in self.hosts_permitidos:
            return False
        return metodo == "GET" or self.headers.get("X-Portafolio") == "1"

    def leer_json(self):
        largo = int(self.headers.get("Content-Length") or 0)
        if largo > TAMANO_MAXIMO * 2:
            raise ValueError("La petición es demasiado grande.")
        return json.loads(self.rfile.read(largo).decode("utf-8")) if largo else {}

    def responder(self, estado, datos):
        cuerpo = json.dumps(datos, ensure_ascii=False).encode("utf-8")
        self.send_response(estado)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(cuerpo)))
        self.end_headers()
        self.wfile.write(cuerpo)

    def api(self, metodo, url):
        if not self.peticion_confiable(metodo):
            return self.responder(403, {"error": "Petición no permitida."})
        q = {k: v[0] for k, v in parse_qs(url.query).items()}
        rutas = {
            ("GET", "/api/estado"): lambda d: {"editable": True},
            ("GET", "/api/posts"): lambda d: {"posts": listar_posts()},
            ("GET", "/api/post"): lambda d: leer_post_completo(q.get("slug")),
            ("POST", "/api/post"): lambda d: crear_post(d.get("titulo")),
            ("PUT", "/api/post"): guardar_post,
            ("DELETE", "/api/post"): lambda d: borrar_post(q.get("slug")),
            ("PUT", "/api/perfil"): guardar_perfil,
            ("PUT", "/api/logros"): guardar_logros,
            ("PUT", "/api/proyectos"): guardar_proyectos,
            ("POST", "/api/imagen"): guardar_imagen,
        }
        accion = rutas.get((metodo, url.path))
        if not accion:
            return self.responder(404, {"error": "Ruta no encontrada."})
        try:
            datos = self.leer_json() if metodo in ("POST", "PUT") else {}
            if not isinstance(datos, dict):
                raise ValueError("Datos no válidos.")
            resultado = accion(datos)
            if metodo != "GET":
                generar()
            self.responder(200, resultado)
        except FileNotFoundError as e:
            self.responder(404, {"error": str(e)})
        except FileExistsError as e:
            self.responder(409, {"error": str(e)})
        except ValueError as e:  # Incluye JSON inválido.
            self.responder(400, {"error": str(e)})
        except OSError as e:
            self.responder(500, {"error": f"Error de archivo: {e}"})


def main():
    parser = argparse.ArgumentParser(description="Servidor local del portafolio")
    parser.add_argument("--puerto", type=int, default=8780)
    parser.add_argument("--sin-navegador", action="store_true", help="no abrir el navegador")
    args = parser.parse_args()

    CARPETA_POSTS.mkdir(parents=True, exist_ok=True)
    generar()
    Manejador.hosts_permitidos = {f"{h}:{args.puerto}" for h in ("127.0.0.1", "localhost")}
    try:
        servidor = Servidor(("127.0.0.1", args.puerto), Manejador)
    except OSError:
        sys.exit(f"El puerto {args.puerto} está ocupado. ¿Ya está abierto el editor? "
                 f"Prueba con: py servidor.py --puerto 8781")

    direccion = f"http://localhost:{args.puerto}"
    print(f"Portafolio (modo edición) en {direccion}")
    print(f"Panel de edición:            {direccion}/admin/")
    print("Cierra esta ventana o presiona Ctrl+C para detenerlo.")
    if not args.sin_navegador:
        threading.Timer(0.5, webbrowser.open, [direccion + "/admin/"]).start()
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
