"""Genera los archivos que necesita el sitio para publicarse en GitHub Pages.

- contenido/indice.json ........ lista de posts publicados (la lee el sitio).
- index.html, blog/, post/<slug>/, en/... páginas por ruta con título y metadatos
  propios (buscadores y vistas previas en redes). Todas cargan la misma app: sitio/app.js.
- 404.html ...................... respaldo para cualquier otra ruta (incluido /admin/).
- sitemap.xml y redirecciones de las rutas viejas (/posts/, /awards/...).

El servidor local lo ejecuta solo al guardar. Si editas archivos a mano:  py generar.py
Solo usa la biblioteca estándar de Python (3.8+).
"""

import html
import json
import re
import unicodedata
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
CONTENIDO = RAIZ / "contenido"
CARPETA_POSTS = CONTENIDO / "posts"
PLANTILLA = RAIZ / "sitio" / "plantilla.html"
MARCA = "<!-- generado por generar.py: no editar a mano -->"

RUTAS = {
    "inicio": {"es": "/", "en": "/en/"},
    "blog": {"es": "/blog/", "en": "/en/blog/"},
    "proyectos": {"es": "/proyectos/", "en": "/en/projects/"},
    "logros": {"es": "/logros/", "en": "/en/achievements/"},
    "archivo": {"es": "/archivo/", "en": "/en/archive/"},
}
SECCIONES = {
    "blog": {
        "es": ("Blog", "Write-ups, herramientas y notas sobre seguridad y QA."),
        "en": ("Blog", "Write-ups, tools and notes about security and QA."),
    },
    "proyectos": {
        "es": ("Proyectos", "Herramientas, sitios y otros proyectos en los que he trabajado."),
        "en": ("Projects", "Tools, websites and other projects I have worked on."),
    },
    "logros": {
        "es": ("Logros", "Certificaciones, conferencias y reconocimientos."),
        "en": ("Achievements", "Certifications, talks and acknowledgements."),
    },
    "archivo": {
        "es": ("Archivo", "Historial de publicaciones ordenado por fecha."),
        "en": ("Archive", "Timeline of posts by date."),
    },
}
# Rutas del sitio anterior (Hugo) que siguen funcionando.
REDIRECCIONES = {
    "/posts/": "/archivo/",
    "/awards/": "/logros/",
    "/about/": "/",
    "/en/posts/": "/en/archive/",
    "/en/awards/": "/en/achievements/",
}


# ---------------- Posts (Markdown con encabezado "clave: valor") ----------------

def slugificar(texto):
    texto = unicodedata.normalize("NFKD", texto or "").encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", texto.lower()).strip("-")[:80]


def separar_etiquetas(texto):
    if isinstance(texto, list):
        return [e.strip() for e in texto if e.strip()]
    return [e.strip() for e in (texto or "").split(",") if e.strip()]


def leer_md(ruta):
    texto = ruta.read_text(encoding="utf-8")
    datos, cuerpo = {}, texto
    m = re.match(r"---\r?\n(.*?)\r?\n---[ \t]*(\r?\n|$)", texto, re.S)
    if m:
        cuerpo = texto[m.end():]
        for linea in m.group(1).splitlines():
            clave, separador, valor = linea.partition(":")
            if separador:
                datos[clave.strip().lower()] = valor.strip()
    return datos, cuerpo.lstrip("\r\n")


def escribir_md(ruta, datos, cuerpo):
    lineas = ["---"]
    for clave, valor in datos.items():
        lineas.append(f"{clave}: {' '.join(str(valor).split())}")  # una sola línea por clave
    lineas += ["---", "", (cuerpo or "").strip("\n"), ""]
    ruta.write_text("\n".join(lineas), encoding="utf-8", newline="\n")


def archivos_post(slug):
    return CARPETA_POSTS / f"{slug}.md", CARPETA_POSTS / f"{slug}.en.md"


def version(datos, cuerpo, con_cuerpo):
    v = {
        "titulo": datos.get("titulo", ""),
        "descripcion": datos.get("descripcion", ""),
        "etiquetas": separar_etiquetas(datos.get("etiquetas")),
    }
    if con_cuerpo:
        v["cuerpo"] = cuerpo
    return v


def leer_post(slug, con_cuerpo=False):
    ruta_es, ruta_en = archivos_post(slug)
    datos, cuerpo = leer_md(ruta_es)
    post = {
        "slug": slug,
        "fecha": datos.get("fecha", ""),
        "borrador": datos.get("borrador", "").lower() in ("si", "sí", "true", "yes", "1"),
        "es": version(datos, cuerpo, con_cuerpo),
        "en": None,
    }
    if ruta_en.exists():
        post["en"] = version(*leer_md(ruta_en), con_cuerpo)
    return post


def listar_posts(incluir_borradores=True):
    CARPETA_POSTS.mkdir(parents=True, exist_ok=True)
    slugs = [r.name[:-3] for r in CARPETA_POSTS.glob("*.md") if not r.name.endswith(".en.md")]
    posts = [leer_post(s) for s in slugs]
    if not incluir_borradores:
        posts = [p for p in posts if not p["borrador"]]
    return sorted(posts, key=lambda p: (p["fecha"], p["slug"]), reverse=True)


def leer_json(nombre, por_defecto):
    ruta = CONTENIDO / nombre
    try:
        return json.loads(ruta.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return por_defecto


# ---------------- Escritura ----------------

def escribir_si_cambia(ruta, texto):
    ruta.parent.mkdir(parents=True, exist_ok=True)
    actual = ruta.read_text(encoding="utf-8") if ruta.exists() else None
    if actual != texto:
        ruta.write_text(texto, encoding="utf-8", newline="\n")


def url_absoluta(sitio, ruta):
    return sitio + ruta if ruta.startswith("/") else ruta


def primera_imagen(cuerpo):
    m = re.search(r"!\[[^\]]*\]\((/[^)\s]+)", cuerpo or "")
    return m.group(1) if m else None


def pagina(plantilla, perfil, idioma, ruta, titulo, descripcion, *, imagen=None, tipo="website",
           alternos=None, indexar=True, cuerpo_previo=""):
    sitio = perfil.get("sitio", "").rstrip("/")
    e = lambda t: html.escape(t or "", quote=True)  # noqa: E731
    enlaces = "\n  ".join(
        f'<link rel="alternate" hreflang="{i}" href="{e(url_absoluta(sitio, r))}">'
        for i, r in (alternos or {}).items())
    reemplazos = {
        "{{MARCA}}": MARCA,
        "{{IDIOMA}}": idioma,
        "{{TITULO}}": e(titulo),
        "{{DESCRIPCION}}": e(descripcion),
        "{{CANONICA}}": e(url_absoluta(sitio, ruta)),
        "{{IMAGEN}}": e(url_absoluta(sitio, imagen or perfil.get("foto", ""))),
        "{{TIPO}}": tipo,
        "{{ROBOTS}}": "index, follow" if indexar else "noindex",
        "{{ALTERNOS}}": enlaces,
        "{{PREVIO}}": cuerpo_previo,
    }
    for clave, valor in reemplazos.items():
        plantilla = plantilla.replace(clave, valor)
    return plantilla


def previo(titulo, descripcion):
    """Contenido inicial visible antes de que cargue la app (y para buscadores)."""
    return (f'<article class="previo"><h1>{html.escape(titulo)}</h1>'
            f'<p>{html.escape(descripcion)}</p></article>')


def redireccion(destino):
    d = html.escape(destino, quote=True)
    return (f'<!doctype html>\n{MARCA}\n<meta charset="utf-8">\n<title>Redirigiendo…</title>\n'
            f'<link rel="canonical" href="{d}">\n<meta name="robots" content="noindex">\n'
            f'<meta http-equiv="refresh" content="0; url={d}">\n<a href="{d}">{d}</a>\n')


def post_ruta(slug, idioma):
    return ("/en" if idioma == "en" else "") + f"/post/{slug}/"


def limpiar_posts_viejos(vigentes):
    """Quita páginas generadas de posts que ya no existen (renombrados o eliminados)."""
    for carpeta in (RAIZ / "post", RAIZ / "en" / "post"):
        if not carpeta.is_dir():
            continue
        for sub in carpeta.iterdir():
            indice = sub / "index.html"
            if sub.is_dir() and (sub.relative_to(RAIZ).as_posix() not in vigentes) and indice.is_file():
                if MARCA in indice.read_text(encoding="utf-8", errors="ignore"):
                    indice.unlink()
                    if not any(sub.iterdir()):
                        sub.rmdir()


def generar():
    perfil = leer_json("perfil.json", {})
    posts = listar_posts(incluir_borradores=False)
    plantilla = PLANTILLA.read_text(encoding="utf-8")
    nombre = perfil.get("nombre", "Portafolio")
    sitio = perfil.get("sitio", "").rstrip("/")
    paginas = {}  # ruta del archivo -> contenido
    mapa = []  # (url, fecha) para sitemap.xml

    indice = {"posts": [{k: p[k] for k in ("slug", "fecha", "es", "en")} for p in posts]}
    escribir_si_cambia(CONTENIDO / "indice.json", json.dumps(indice, ensure_ascii=False, indent=2) + "\n")

    for idioma in ("es", "en"):
        rol = perfil.get("rol", {}).get(idioma, "")
        alternos = RUTAS["inicio"]
        paginas[RUTAS["inicio"][idioma] + "index.html"] = pagina(
            plantilla, perfil, idioma, RUTAS["inicio"][idioma], f"{nombre} · {rol}", rol,
            alternos=alternos, cuerpo_previo=previo(nombre, rol))
        mapa.append((RUTAS["inicio"][idioma], None))
        for seccion, textos in SECCIONES.items():
            titulo, descripcion = textos[idioma]
            ruta = RUTAS[seccion][idioma]
            paginas[ruta + "index.html"] = pagina(
                plantilla, perfil, idioma, ruta, f"{titulo} · {nombre}", descripcion,
                alternos=RUTAS[seccion], cuerpo_previo=previo(titulo, descripcion))
            mapa.append((ruta, None))

    for p in posts:
        alternos = {"es": post_ruta(p["slug"], "es")}
        if p["en"]:
            alternos["en"] = post_ruta(p["slug"], "en")
        cuerpo = leer_post(p["slug"], con_cuerpo=True)
        for idioma, ruta in alternos.items():
            v = p[idioma]
            imagen = primera_imagen(cuerpo[idioma]["cuerpo"])
            paginas[ruta + "index.html"] = pagina(
                plantilla, perfil, idioma, ruta, f"{v['titulo']} · {nombre}", v["descripcion"],
                imagen=imagen, tipo="article", alternos=alternos,
                cuerpo_previo=previo(v["titulo"], v["descripcion"]))
            mapa.append((ruta, p["fecha"]))

    paginas["/admin/index.html"] = pagina(plantilla, perfil, "es", "/admin/", f"Panel · {nombre}",
                                          "Editor del sitio", indexar=False)
    paginas["/404.html"] = pagina(plantilla, perfil, "es", "/404.html", f"404 · {nombre}",
                                  "Página no encontrada", indexar=False)

    for origen, destino in REDIRECCIONES.items():
        paginas[origen + "index.html"] = redireccion(destino)

    for ruta, texto in paginas.items():
        escribir_si_cambia(RAIZ / ruta.lstrip("/"), texto)
    limpiar_posts_viejos({Path(r).parent.as_posix().strip("/") for r in paginas})

    urls = "\n".join(
        f"  <url><loc>{html.escape(sitio + r)}</loc>" + (f"<lastmod>{f}</lastmod>" if f else "") + "</url>"
        for r, f in mapa)
    escribir_si_cambia(RAIZ / "sitemap.xml",
                       '<?xml version="1.0" encoding="utf-8"?>\n'
                       '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + "\n</urlset>\n")
    escribir_si_cambia(RAIZ / "robots.txt", f"User-agent: *\nDisallow: /admin/\nSitemap: {sitio}/sitemap.xml\n")
    return posts


if __name__ == "__main__":
    publicados = generar()
    print(f"Sitio generado: {len(publicados)} posts publicados.")
