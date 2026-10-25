# >_ aldomoreno.net

Portafolio y blog personal con el mismo estilo terminal que **Mis apuntes**.
Sin frameworks ni compilación: HTML, CSS y JS que GitHub Pages sirve tal cual, más un pequeño servidor en Python para editar en local.

- **En GitHub Pages**: sitio público en modo lectura (español en `/`, inglés en `/en/`).
- **En tu computadora** (`iniciar.bat`): panel de edición en `http://localhost:8780/admin/` para posts, proyectos, perfil y logros.

## Secciones

| Ruta | Qué muestra |
| --- | --- |
| `/` · `/en/` | Perfil (whoami), últimos posts y logros recientes |
| `/blog/` | Posts con buscador y filtro por etiqueta (`?tag=XSS`) |
| `/proyectos/` · `/en/projects/` | Tus proyectos, en el orden que elijas en el panel |
| `/post/<slug>/` | Un post (con versión en inglés en `/en/post/<slug>/`) |
| `/logros/` · `/en/achievements/` | Certificaciones, cursos, conferencias y salón de la fama |
| `/archivo/` · `/en/archive/` | Historial de posts por fecha, agrupado por año |
| `/admin/` | Panel de edición (solo funciona en local) |

Las rutas del sitio anterior en Hugo siguen funcionando: `/post/<slug>/` y `/en/post/<slug>/`; `/posts/` y `/awards/` redirigen a las nuevas.

## Estructura

```text
contenido/
  perfil.json            ← nombre, foto, rol, bio, habilidades y redes
  logros.json            ← certificaciones, conferencias, salón de la fama…
  proyectos.json         ← proyectos (el orden del archivo es el orden en el sitio)
  posts/<slug>.md        ← post en español (con encabezado titulo/fecha/descripcion/etiquetas/borrador)
  posts/<slug>.en.md     ← versión en inglés (opcional)
  indice.json            ← se genera solo
images/<slug>/           ← imágenes de cada post (las que subes desde el editor caen aquí)
sitio/                   ← la app: plantilla.html, app.js, estilos.css
servidor.py              ← servidor local para editar (solo Python, sin instalar nada)
generar.py               ← genera index.html, post/, en/, 404.html y sitemap.xml
```

Los archivos `index.html`, `404.html`, `blog/`, `post/`, `proyectos/`, `logros/`, `archivo/`, `admin/`, `en/`, `sitemap.xml` y `robots.txt` **se generan solos**: no los edites a mano. Cada uno tiene su propio título y descripción para buscadores y vistas previas en redes.

## Editar en local

Requiere Python 3.8 o superior. Doble clic en `iniciar.bat`, o:

```bash
py servidor.py
```

Se abre `http://localhost:8780/admin/`:

- **Posts**: crea, edita y elimina. El editor tiene vista previa en vivo, pestañas ES/EN, barra de formato y subida de imágenes (botón, pegar con Ctrl+V o arrastrar). **Guardar** guarda y vuelve a la lista; **Cancelar** sale sin guardar; `Ctrl+S` guarda sin salir. Marca **borrador** para que un post no se publique.
- **Proyectos**: nombre, descripción, tecnologías, estado, enlaces al sitio y al código, e imagen opcional. Arrastra las filas para cambiar el orden.
- **Perfil**: foto, nombre, rol y bio en los dos idiomas, habilidades y redes (arrastra para reordenarlas).
- **Logros**: agrega y edita certificaciones, cursos, conferencias y reconocimientos. La fecha puede ser `2025`, `2025-06` o `2025-06-14`.

Lo que elimines va a `.papelera/` (no se sube a GitHub). En local también ves los borradores dentro del sitio, marcados como tales.

Después sube los cambios:

```bash
git add -A
git commit -m "Actualizo el sitio"
git push
```

Si editas archivos de `contenido/` a mano (sin el servidor), regenera antes de subir:

```bash
py generar.py
```

## Publicar en GitHub Pages

1. Copia el contenido de esta carpeta a la raíz del repositorio `aldo-moreno-leon.github.io` (ya incluye `CNAME` y `.nojekyll`).
2. En el repositorio: **Settings → Pages → Build and deployment → Source: Deploy from a branch → `main` / `(root)`**.
3. Cada `git push` a `main` publica el sitio en `https://aldomoreno.net/`.

> ⚠️ El repositorio es público: todo lo que está en `contenido/` (incluidos los borradores) se puede leer en GitHub.
