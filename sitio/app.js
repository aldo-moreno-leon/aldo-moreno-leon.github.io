'use strict';

/*
 * Portafolio: una sola app para todas las rutas (/, /blog/, /post/<slug>/, /logros/, /archivo/ y /en/...).
 * Lee contenido/perfil.json, contenido/logros.json, contenido/indice.json y contenido/posts/*.md.
 * - En GitHub Pages funciona en modo lectura.
 * - Con  py servidor.py  se activa el panel de edición en /admin/.
 */

const $ = (selector, raiz = document) => raiz.querySelector(selector);
const $$ = (selector, raiz = document) => [...raiz.querySelectorAll(selector)];
const enc = encodeURIComponent;
const escapar = (texto) => String(texto ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const slugificar = (texto) => String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/* ---------------- Textos (es / en) ---------------- */

const TEXTOS = {
  es: {
    inicio: 'inicio', blog: 'blog', proyectos: 'proyectos', logros: 'logros', archivo: 'archivo', panel: 'panel',
    ultimosPosts: 'Últimos posts', logrosRecientes: 'Logros recientes', verTodos: 'ver todos',
    posts: 'posts', idiomas: 'idiomas', habilidades: 'habilidades',
    buscarPosts: 'grep en el blog…   [ / ]', todas: 'todas', sinResultados: 'No se encontró nada.',
    minLectura: 'min de lectura', anterior: 'anterior', siguiente: 'siguiente',
    soloEspanol: '', noEncontrado: 'No existe el archivo o el directorio', volverInicio: 'cd ~',
    entradas: 'entradas', entrada: 'entrada', borrador: 'borrador', editar: 'editar',
    copiar: 'Copiar', copiado: '¡Copiado!', noCopiado: 'No se pudo copiar',
    sinPosts: 'Todavía no hay posts.', sinLogros: 'Todavía no hay logros.', sinProyectos: 'Todavía no hay proyectos.',
    archivoDescripcion: 'Historial de publicaciones ordenado por fecha.',
    logrosDescripcion: 'Certificaciones, conferencias y reconocimientos.',
    blogDescripcion: 'Write-ups, herramientas y notas sobre seguridad y QA.',
    proyectosDescripcion: 'Herramientas, sitios y otros proyectos en los que he trabajado.',
    sitioProyecto: 'sitio', codigoProyecto: 'código', cargando: 'cargando…',
  },
  en: {
    inicio: 'home', blog: 'blog', proyectos: 'projects', logros: 'achievements', archivo: 'archive', panel: 'panel',
    ultimosPosts: 'Latest posts', logrosRecientes: 'Recent achievements', verTodos: 'view all',
    posts: 'posts', idiomas: 'languages', habilidades: 'skills',
    buscarPosts: 'grep the blog…   [ / ]', todas: 'all', sinResultados: 'Nothing found.',
    minLectura: 'min read', anterior: 'previous', siguiente: 'next',
    soloEspanol: 'This post is only available in Spanish.', noEncontrado: 'No such file or directory',
    volverInicio: 'cd ~', entradas: 'entries', entrada: 'entry', borrador: 'draft', editar: 'edit',
    copiar: 'Copy', copiado: 'Copied!', noCopiado: 'Could not copy',
    sinPosts: 'No posts yet.', sinLogros: 'No achievements yet.', sinProyectos: 'No projects yet.',
    archivoDescripcion: 'Timeline of posts by date.',
    logrosDescripcion: 'Certifications, talks and acknowledgements.',
    blogDescripcion: 'Write-ups, tools and notes about security and QA.',
    proyectosDescripcion: 'Tools, websites and other projects I have worked on.',
    sitioProyecto: 'live', codigoProyecto: 'code', cargando: 'loading…',
  },
};
const t = (clave) => TEXTOS[estado.lang][clave] ?? clave;

const TIPOS_LOGRO = {
  certificacion: { icono: 'fa-solid fa-certificate', corto: 'cert', color: 'verde', es: 'Certificaciones', en: 'Certifications' },
  curso: { icono: 'fa-solid fa-graduation-cap', corto: 'curso', color: 'morado', es: 'Cursos', en: 'Courses' },
  conferencia: { icono: 'fa-solid fa-microphone-lines', corto: 'talk', color: 'amarillo', es: 'Conferencias', en: 'Talks' },
  reconocimiento: { icono: 'fa-solid fa-trophy', corto: 'hof', color: 'magenta', es: 'Salón de la fama', en: 'Hall of Fame' },
  otro: { icono: 'fa-solid fa-star', corto: 'misc', color: 'naranja', es: 'Otros', en: 'Other' },
};
const tipoLogro = (tipo) => TIPOS_LOGRO[tipo] || TIPOS_LOGRO.otro;

const REDES = {
  linkedin: { icono: 'fa-brands fa-linkedin-in', nombre: 'LinkedIn' },
  x: { icono: 'fa-brands fa-x-twitter', nombre: 'X' },
  github: { icono: 'fa-brands fa-github', nombre: 'GitHub' },
  gitlab: { icono: 'fa-brands fa-gitlab', nombre: 'GitLab' },
  bugcrowd: { icono: 'fa-solid fa-bug', nombre: 'Bugcrowd' },
  hackerone: { icono: 'fa-solid fa-h', nombre: 'HackerOne' },
  youtube: { icono: 'fa-brands fa-youtube', nombre: 'YouTube' },
  telegram: { icono: 'fa-brands fa-telegram', nombre: 'Telegram' },
  mastodon: { icono: 'fa-brands fa-mastodon', nombre: 'Mastodon' },
  email: { icono: 'fa-solid fa-envelope', nombre: 'Email' },
  web: { icono: 'fa-solid fa-globe', nombre: 'Web' },
};
const red = (tipo) => REDES[tipo] || REDES.web;

const ESTADOS_PROYECTO = {
  activo: { color: 'verde', es: 'activo', en: 'active' },
  desarrollo: { color: 'amarillo', es: 'en desarrollo', en: 'in progress' },
  terminado: { color: 'cian', es: 'terminado', en: 'completed' },
  archivado: { color: 'sutil', es: 'archivado', en: 'archived' },
};
const estadoProyecto = (clave) => ESTADOS_PROYECTO[clave] || ESTADOS_PROYECTO.activo;

/* ---------------- Datos ---------------- */

const estado = {
  lang: 'es',
  perfil: {},
  logros: [],
  proyectos: [], // [{ id, titulo: {es, en}, descripcion: {es, en}, tecnologias, url, repo, imagen, fecha, estado }]
  posts: [], // [{ slug, fecha, borrador?, es: {titulo, descripcion, etiquetas}, en: {...} | null }]
  editable: false,
  cuerpos: new Map(), // "slug.idioma" -> Markdown sin encabezado
  sinGuardar: false,
};

async function pedirJSON(url, opciones = {}) {
  const respuesta = await fetch(url, { cache: 'no-store', ...opciones });
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(datos.error || `Error ${respuesta.status}`);
  return datos;
}

function api(metodo, ruta, cuerpo) {
  return pedirJSON('/api/' + ruta, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', 'X-Portafolio': '1' },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
}

async function cargarDatos() {
  const [perfil, logros, proyectos, posts, editable] = await Promise.all([
    pedirJSON('/contenido/perfil.json').catch(() => ({})),
    pedirJSON('/contenido/logros.json').then((d) => d.logros || []).catch(() => []),
    pedirJSON('/contenido/proyectos.json').then((d) => d.proyectos || []).catch(() => []),
    pedirJSON('/contenido/indice.json').then((d) => d.posts || []).catch(() => []),
    pedirJSON('/api/estado').then((d) => d.editable === true).catch(() => false),
  ]);
  Object.assign(estado, { perfil, logros, proyectos, posts, editable });
  if (editable) estado.posts = (await api('GET', 'posts')).posts; // En local también se ven los borradores.
}

const quitarEncabezado = (texto) => texto.replace(/^---\r?\n[\s\S]*?\r?\n---[ \t]*(\r?\n|$)/, '').replace(/^\s+/, '');

async function leerCuerpo(slug, idioma) {
  const clave = `${slug}.${idioma}`;
  if (!estado.cuerpos.has(clave)) {
    const respuesta = await fetch(`/contenido/posts/${enc(slug)}${idioma === 'en' ? '.en' : ''}.md`,
      { cache: estado.editable ? 'no-store' : 'default' });
    if (!respuesta.ok) throw new Error(t('noEncontrado'));
    estado.cuerpos.set(clave, quitarEncabezado(await respuesta.text()));
  }
  return estado.cuerpos.get(clave);
}

const tituloSeccion = (clave) => `${t(clave).replace(/^./, (c) => c.toUpperCase())} · ${estado.perfil.nombre || ''}`;
const version = (post) => (estado.lang === 'en' && post.en) || post.es;
const enIdioma = (bilingue) => (bilingue && (bilingue[estado.lang] || bilingue.es)) || '';
const postsVisibles = () => estado.posts.filter((p) => estado.editable || !p.borrador);
const buscarPost = (slug) => estado.posts.find((p) => p.slug === slug);

function formatearFecha(fecha, corta = false) {
  const [a, m, d] = String(fecha || '').split('-').map(Number);
  if (!a) return '';
  if (!m) return corta ? '' : String(a);
  const idioma = estado.lang === 'en' ? 'en-US' : 'es-MX';
  const opciones = d ? { day: '2-digit', month: 'short' } : { month: 'short' };
  if (!corta) opciones.year = 'numeric';
  return new Intl.DateTimeFormat(idioma, opciones).format(new Date(a, m - 1, d || 1)).replace('.', '');
}

/* ---------------- Rutas ---------------- */

const RUTAS = {
  inicio: { es: '/', en: '/en/' },
  blog: { es: '/blog/', en: '/en/blog/' },
  proyectos: { es: '/proyectos/', en: '/en/projects/' },
  logros: { es: '/logros/', en: '/en/achievements/' },
  archivo: { es: '/archivo/', en: '/en/archive/' },
};
const ALIAS = {
  blog: 'blog', post: 'post', proyectos: 'proyectos', projects: 'proyectos', logros: 'logros', achievements: 'logros', awards: 'logros',
  archivo: 'archivo', archive: 'archivo', posts: 'archivo', admin: 'admin',
};

function rutaDe(vista, idioma = estado.lang, slug = '') {
  if (vista === 'post') return `${idioma === 'en' ? '/en' : ''}/post/${enc(slug)}/`;
  if (vista === 'admin') return slug ? `/admin/${slug}/` : '/admin/';
  return (RUTAS[vista] || RUTAS.inicio)[idioma];
}

function leerRuta() {
  let partes = location.pathname.split('/').filter(Boolean).map(decodeURIComponent);
  if (partes.at(-1) === 'index.html' || partes.at(-1) === '404.html') partes.pop();
  let lang = 'es';
  if (partes[0] === 'en') { lang = 'en'; partes = partes.slice(1); }
  const [primera, segunda, tercera] = partes;
  if (!primera) return { lang, vista: 'inicio' };
  const vista = ALIAS[primera];
  if (!vista || (partes.length > 1 && !['post', 'admin'].includes(vista))) return { lang, vista: '404' };
  if (vista === 'post') return segunda ? { lang, vista, slug: segunda } : { lang, vista: 'blog' };
  if (vista === 'admin') return { lang: 'es', vista, seccion: segunda || 'posts', slug: tercera };
  return { lang, vista };
}

let urlMostrada = location.pathname + location.search;

function ir(url, reemplazar = false) {
  if (estado.sinGuardar && !confirm('Tienes cambios sin guardar. ¿Salir sin guardar?')) return;
  estado.sinGuardar = false;
  history[reemplazar ? 'replaceState' : 'pushState'](null, '', url);
  mostrar();
}

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]');
  if (!a || a.target || a.hasAttribute('download') || e.defaultPrevented || e.button || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin || /\.[a-z0-9]+$/i.test(url.pathname)) return;
  if (url.pathname === location.pathname && url.search === location.search && url.hash) return; // Ancla en la misma página.
  e.preventDefault();
  ir(url.pathname + url.search + url.hash);
});

window.addEventListener('popstate', () => {
  if (estado.sinGuardar && !confirm('Tienes cambios sin guardar. ¿Salir sin guardar?')) {
    history.pushState(null, '', urlMostrada);
    return;
  }
  estado.sinGuardar = false;
  mostrar();
});
window.addEventListener('beforeunload', (e) => { if (estado.sinGuardar) e.preventDefault(); });

/* ---------------- Menú lateral y pie ---------------- */

function rutaEquivalente(ruta, idioma) {
  if (ruta.vista === 'post') return rutaDe('post', idioma, ruta.slug);
  return rutaDe(RUTAS[ruta.vista] ? ruta.vista : 'inicio', idioma);
}

function iconosRedes(clase = 'redes') {
  const redes = estado.perfil.redes || [];
  if (!redes.length) return '';
  return `<div class="${clase}">${redes.map((r) => {
    const datos = red(r.tipo);
    const externo = r.url.startsWith('http');
    return `<a href="${escapar(r.url)}" title="${escapar(datos.nombre)}" aria-label="${escapar(datos.nombre)}"
              ${externo ? 'target="_blank" rel="noopener me"' : ''}><i class="${datos.icono}"></i></a>`;
  }).join('')}</div>`;
}

function pintarMenu(ruta) {
  const p = estado.perfil;
  const usuario = p.usuario || slugificar(p.nombre || 'portafolio').replace(/-/g, '_');
  const enlaces = [
    ['inicio', ''],
    ['blog', postsVisibles().length],
    ['proyectos', estado.proyectos.length],
    ['logros', estado.logros.length],
    ['archivo', ''],
  ];
  $('#menu').innerHTML = `
    <a href="${rutaDe('inicio')}" class="marca"><span class="prompt">~$</span> ${escapar(usuario)}<span class="cursor">_</span></a>
    <div class="perfil-mini">
      ${p.foto ? `<span class="avatar"><img src="${escapar(p.foto)}" alt="${escapar(p.nombre || '')}" width="56" height="56"></span>` : ''}
      <div>
        <strong>${escapar(p.nombre || '')}</strong>
        <span class="rol">${escapar(enIdioma(p.rol))}</span>
      </div>
    </div>
    <nav class="navegacion" aria-label="Secciones">
      ${enlaces.map(([vista, n]) => `
        <a href="${rutaDe(vista)}" class="${ruta.vista === vista || (vista === 'blog' && ruta.vista === 'post') ? 'activo' : ''}">
          <span>~/${t(vista)}</span>${n !== '' ? `<span class="contador">${n}</span>` : ''}
        </a>`).join('')}
      ${estado.editable ? `<a href="/admin/" class="enlace-panel ${ruta.vista === 'admin' ? 'activo' : ''}"><span>~/${t('panel')}</span><i class="fa-solid fa-pen-to-square"></i></a>` : ''}
    </nav>
    ${iconosRedes()}
    <div class="menu-pie">
      ${ruta.vista === 'admin' ? '' : `<div class="idiomas" role="group" aria-label="Idioma / Language">
        <a href="${rutaEquivalente(ruta, 'es')}" class="${estado.lang === 'es' ? 'activo' : ''}" hreflang="es" lang="es">ES</a>
        <a href="${rutaEquivalente(ruta, 'en')}" class="${estado.lang === 'en' ? 'activo' : ''}" hreflang="en" lang="en">EN</a>
      </div>`}
      ${estado.editable ? '<p class="modo edicion">modo edición (local) · sube tus cambios con git push</p>' : ''}
    </div>`;
}

function pintarPie() {
  const anio = new Date().getFullYear();
  $('#pie').innerHTML = `
    <span>© ${anio} ${escapar(estado.perfil.nombre || '')}</span>`;
}

$('#boton-menu').addEventListener('click', () => document.body.classList.toggle('menu-abierto'));

/* ---------------- Markdown ---------------- */

function convertirMarkdown(texto) {
  if (window.marked) return marked.parse(texto, { gfm: true, breaks: false });
  return `<pre>${escapar(texto)}</pre>`; // Sin internet: muestra el texto tal cual.
}

function pintarMarkdown(elemento, texto) {
  elemento.innerHTML = convertirMarkdown(texto);
  elemento.querySelectorAll('pre > code').forEach((codigo) => {
    const lenguaje = [...codigo.classList].find((c) => c.startsWith('language-'));
    codigo.parentElement.dataset.lenguaje = lenguaje ? lenguaje.slice(9) : 'txt';
    if (window.hljs) hljs.highlightElement(codigo);
    const boton = document.createElement('button');
    boton.className = 'copiar';
    boton.textContent = t('copiar');
    boton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(codigo.innerText.replace(/\n$/, ''));
        boton.textContent = t('copiado');
      } catch {
        boton.textContent = t('noCopiado');
      }
      setTimeout(() => { boton.textContent = t('copiar'); }, 1500);
    });
    codigo.parentElement.appendChild(boton);
  });
  elemento.querySelectorAll('h2, h3').forEach((h) => { if (!h.id) h.id = slugificar(h.textContent); });
  elemento.querySelectorAll('img').forEach((img) => { img.loading = 'lazy'; });
  elemento.querySelectorAll('a[href^="http"]').forEach((a) => { a.target = '_blank'; a.rel = 'noopener'; });
}

const visor = $('#visor');
document.addEventListener('click', (e) => {
  const img = e.target.closest('.contenido .markdown:not(.vista-previa) img');
  if (!img || img.closest('a')) return;
  $('img', visor).src = img.src;
  visor.showModal();
});
visor.addEventListener('click', () => visor.close());

/* ---------------- Componentes ---------------- */

const contenido = $('#contenido');

function migas(...partes) {
  return `<nav class="migas"><a href="${rutaDe('inicio')}">~</a>${partes.map((p) =>
    ` <span>/</span> ${p.href ? `<a href="${p.href}">${escapar(p.texto)}</a>` : `<span>${escapar(p.texto)}</span>`}`).join('')}</nav>`;
}

const insigniaBorrador = (post) => (post.borrador ? `<span class="insignia insignia-borrador">${t('borrador')}</span>` : '');

function tarjetaPost(post) {
  const v = version(post);
  return `
    <a class="post-item" href="${rutaDe('post', estado.lang, post.slug)}">
      <time datetime="${escapar(post.fecha)}">${escapar(post.fecha)}</time>
      <div class="post-item-cuerpo">
        <strong>${escapar(v.titulo)}</strong>${insigniaBorrador(post)}
        ${v.descripcion ? `<p>${escapar(v.descripcion)}</p>` : ''}
        ${v.etiquetas.length ? `<span class="etiquetas">${v.etiquetas.map((e) => `<span>#${escapar(e)}</span>`).join('')}</span>` : ''}
      </div>
      <span class="post-item-flecha" aria-hidden="true">→</span>
    </a>`;
}

function tarjetaLogro(logro) {
  const tipo = tipoLogro(logro.tipo);
  const titulo = escapar(enIdioma(logro.titulo));
  const descripcion = enIdioma(logro.descripcion);
  return `
    <article class="logro" id="${escapar(logro.id)}" style="--acento: var(--${tipo.color})">
      <div class="logro-cabeza">
        <span class="insignia-tipo"><i class="${tipo.icono}"></i> ${tipo.corto}</span>
        <time>${escapar(formatearFecha(logro.fecha))}</time>
      </div>
      <h3>${logro.url ? `<a href="${escapar(logro.url)}" target="_blank" rel="noopener">${titulo} <i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : titulo}</h3>
      ${logro.emisor ? `<p class="emisor">@ ${escapar(logro.emisor)}</p>` : ''}
      ${descripcion ? `<p class="logro-descripcion">${escapar(descripcion)}</p>` : ''}
    </article>`;
}

/* ---------------- Vistas públicas ---------------- */

let editorActual = null; // Función de guardado de la vista de edición abierta (para Ctrl+S).

async function mostrar() {
  urlMostrada = location.pathname + location.search;
  const ruta = leerRuta();
  estado.lang = ruta.lang;
  document.documentElement.lang = ruta.lang;
  editorActual = null;
  document.body.classList.remove('menu-abierto');
  document.body.dataset.vista = ruta.vista;
  pintarMenu(ruta);
  pintarPie();
  $('#progreso').style.transform = 'scaleX(0)';
  window.scrollTo(0, 0);
  try {
    if (ruta.vista === 'inicio') vistaInicio();
    else if (ruta.vista === 'blog') vistaBlog();
    else if (ruta.vista === 'post') await vistaPost(ruta.slug);
    else if (ruta.vista === 'proyectos') vistaProyectos();
    else if (ruta.vista === 'logros') vistaLogros();
    else if (ruta.vista === 'archivo') vistaArchivo();
    else if (ruta.vista === 'admin') await vistaAdmin(ruta);
    else vistaNoEncontrado();
  } catch (error) {
    vistaNoEncontrado(error.message);
  }
  if (location.hash) {
    const destino = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (destino) { destino.scrollIntoView(); destino.classList.add('resaltado'); }
  }
}

function vistaInicio() {
  const p = estado.perfil;
  const posts = postsVisibles().filter((x) => !x.borrador);
  const habilidades = p.habilidades || [];
  document.title = `${p.nombre || ''} · ${enIdioma(p.rol)}`;
  let i = 0;
  const linea = (comando) => `<p class="linea" style="--i:${i++}"><span class="prompt">$</span> ${comando}</p>`;
  const bloque = (html) => `<div class="salida" style="--i:${i++}">${html}</div>`;

  contenido.innerHTML = `
    <section class="terminal hero">
      <div class="terminal-barra">${escapar(p.usuario || 'user')}@${escapar((p.sitio || 'localhost').replace(/^https?:\/\//, ''))}: ~</div>
      <div class="terminal-cuerpo">
        ${p.foto ? `<span class="avatar avatar-grande"><img src="${escapar(p.foto)}" alt="${escapar(p.nombre || '')}"></span>` : ''}
        ${linea('whoami')}
        ${bloque(`<h1 class="nombre">${escapar(p.nombre || '')}</h1>`)}
        ${linea('cat rol.txt')}
        ${bloque(`<p class="rol-grande">${escapar(enIdioma(p.rol))}</p>`)}
        ${enIdioma(p.bio) ? `${linea('cat bio.md')}${bloque('<div class="markdown bio" id="bio"></div>')}` : ''}
        ${habilidades.length ? `${linea(`ls ${t('habilidades')}/`)}${bloque(`<ul class="chips">${habilidades.map((h) => `<li>${escapar(h)}</li>`).join('')}</ul>`)}` : ''}
        ${linea('<span class="cursor">▌</span>')}
      </div>
      ${estado.editable ? `<a class="boton boton-chico boton-editar" href="/admin/perfil/"><i class="fa-solid fa-pen"></i> ${t('editar')}</a>` : ''}
    </section>

    <dl class="stats">
      <div><dt>${t('posts')}</dt><dd>${posts.length}</dd></div>
      <div><dt>${t('proyectos')}</dt><dd>${estado.proyectos.length}</dd></div>
      <div><dt>${t('logros')}</dt><dd>${estado.logros.length}</dd></div>
      <div><dt>${t('idiomas')}</dt><dd>es · en</dd></div>
    </dl>

    <section class="seccion">
      <header class="seccion-titulo">
        <h2>${t('ultimosPosts')}</h2>
        <a href="${rutaDe('blog')}">${t('verTodos')} →</a>
      </header>
      ${posts.length ? `<div class="lista-posts">${posts.slice(0, 3).map(tarjetaPost).join('')}</div>`
        : `<p class="sutil">${t('sinPosts')}</p>`}
    </section>

    <section class="seccion">
      <header class="seccion-titulo">
        <h2>${t('logrosRecientes')}</h2>
        <a href="${rutaDe('logros')}">${t('verTodos')} →</a>
      </header>
      ${estado.logros.length ? `<div class="logros">${estado.logros.slice(0, 3).map(tarjetaLogro).join('')}</div>`
        : `<p class="sutil">${t('sinLogros')}</p>`}
    </section>`;
  if ($('#bio')) pintarMarkdown($('#bio'), enIdioma(p.bio));
}

function vistaBlog() {
  const parametros = new URLSearchParams(location.search);
  const etiqueta = parametros.get('tag') || '';
  const posts = postsVisibles();
  const conteo = new Map();
  posts.forEach((p) => version(p).etiquetas.forEach((e) => conteo.set(e, (conteo.get(e) || 0) + 1)));
  const etiquetas = [...conteo].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  document.title = tituloSeccion('blog');

  contenido.innerHTML = `
    ${migas({ texto: t('blog') })}
    <header class="cabecera">
      <div>
        <h1>${t('blog')}</h1>
        <p class="sutil">${t('blogDescripcion')}</p>
      </div>
      ${estado.editable ? '<a class="boton boton-principal" href="/admin/">+ post</a>' : ''}
    </header>
    <div class="filtros">
      <input id="buscar-posts" class="buscador" type="search" placeholder="${escapar(t('buscarPosts'))}" autocomplete="off">
      <div class="chips chips-filtro">
        <a href="${rutaDe('blog')}" class="${etiqueta ? '' : 'activo'}">${t('todas')} <small>${posts.length}</small></a>
        ${etiquetas.map(([e, n]) => `<a href="${rutaDe('blog')}?tag=${enc(e)}" class="${e === etiqueta ? 'activo' : ''}">#${escapar(e)} <small>${n}</small></a>`).join('')}
      </div>
    </div>
    <div id="lista-posts" class="lista-posts"></div>`;

  const buscador = $('#buscar-posts');
  const filtrar = () => {
    const texto = buscador.value.trim().toLowerCase();
    const lista = posts.filter((p) => {
      const v = version(p);
      if (etiqueta && !v.etiquetas.includes(etiqueta)) return false;
      return !texto || `${v.titulo} ${v.descripcion} ${v.etiquetas.join(' ')}`.toLowerCase().includes(texto);
    });
    $('#lista-posts').innerHTML = lista.length ? lista.map(tarjetaPost).join('')
      : `<p class="sutil vacio-grande">${t('sinResultados')}</p>`;
  };
  buscador.addEventListener('input', filtrar);
  buscador.addEventListener('keydown', (e) => { if (e.key === 'Escape') { buscador.value = ''; filtrar(); } });
  filtrar();
}

async function vistaPost(slug) {
  const post = buscarPost(slug);
  if (!post || (post.borrador && !estado.editable)) throw new Error(t('noEncontrado'));
  const idioma = estado.lang === 'en' && post.en ? 'en' : 'es';
  const v = post[idioma];
  document.title = `${v.titulo} · ${estado.perfil.nombre || ''}`;
  contenido.innerHTML = `
    ${migas({ texto: t('blog'), href: rutaDe('blog') }, { texto: slug })}
    <header class="post-cabecera">
      <h1>${escapar(v.titulo)}</h1>
      <p class="meta">
        <span><i class="fa-regular fa-calendar"></i> <time datetime="${escapar(post.fecha)}">${escapar(formatearFecha(post.fecha))}</time></span>
        <span id="lectura"></span>
        ${v.etiquetas.map((e) => `<a href="${rutaDe('blog')}?tag=${enc(e)}">#${escapar(e)}</a>`).join('')}
        ${insigniaBorrador(post)}
      </p>
      ${estado.lang === 'en' && !post.en ? `<p class="aviso-idioma"><i class="fa-solid fa-language"></i> ${t('soloEspanol')}</p>` : ''}
      ${estado.editable ? `<a class="boton boton-chico" href="/admin/post/${enc(slug)}/"><i class="fa-solid fa-pen"></i> ${t('editar')}</a>` : ''}
    </header>
    <article class="markdown articulo" id="articulo"><p class="sutil">${t('cargando')}</p></article>
    <nav class="post-nav" id="post-nav"></nav>`;

  const cuerpo = await leerCuerpo(slug, idioma);
  pintarMarkdown($('#articulo'), cuerpo);
  const palabras = cuerpo.split(/\s+/).filter(Boolean).length;
  $('#lectura').innerHTML = `<i class="fa-regular fa-clock"></i> ${Math.max(1, Math.round(palabras / 200))} ${t('minLectura')}`;

  const lista = postsVisibles();
  const i = lista.findIndex((p) => p.slug === slug);
  const vecino = (p, clase, etiqueta) => (p ? `
    <a class="${clase}" href="${rutaDe('post', estado.lang, p.slug)}">
      <span class="sutil">${etiqueta}</span><strong>${escapar(version(p).titulo)}</strong>
    </a>` : '<span></span>');
  $('#post-nav').innerHTML = vecino(lista[i + 1], 'anterior', `← ${t('anterior')}`) + vecino(lista[i - 1], 'siguiente', `${t('siguiente')} →`);
}

function tarjetaProyecto(proyecto) {
  const est = estadoProyecto(proyecto.estado);
  const descripcion = enIdioma(proyecto.descripcion);
  const enlace = (url, icono, texto) => (url
    ? `<a href="${escapar(url)}" target="_blank" rel="noopener"><i class="${icono}"></i> ${texto}</a>` : '');
  return `
    <article class="proyecto" id="${escapar(proyecto.id)}" style="--acento: var(--${est.color})">
      ${proyecto.imagen ? `<img class="proyecto-imagen" src="${escapar(proyecto.imagen)}" alt="" loading="lazy">` : ''}
      <div class="proyecto-cuerpo">
        <div class="logro-cabeza">
          <span class="insignia-tipo">${est[estado.lang]}</span>
          <time>${escapar(formatearFecha(proyecto.fecha))}</time>
        </div>
        <h3>${escapar(enIdioma(proyecto.titulo))}</h3>
        ${descripcion ? `<p class="proyecto-descripcion">${escapar(descripcion)}</p>` : ''}
        ${proyecto.tecnologias?.length ? `<ul class="chips chips-chicos">${proyecto.tecnologias.map((x) => `<li>${escapar(x)}</li>`).join('')}</ul>` : ''}
        ${proyecto.url || proyecto.repo ? `<p class="proyecto-enlaces">
          ${enlace(proyecto.url, 'fa-solid fa-arrow-up-right-from-square', t('sitioProyecto'))}
          ${enlace(proyecto.repo, 'fa-brands fa-github', t('codigoProyecto'))}
        </p>` : ''}
      </div>
    </article>`;
}

function vistaProyectos() {
  document.title = tituloSeccion('proyectos');
  contenido.innerHTML = `
    ${migas({ texto: t('proyectos') })}
    <header class="cabecera">
      <div>
        <h1>${t('proyectos')}</h1>
        <p class="sutil">${t('proyectosDescripcion')}</p>
      </div>
      ${estado.editable ? `<a class="boton boton-chico" href="/admin/proyectos/"><i class="fa-solid fa-pen"></i> ${t('editar')}</a>` : ''}
    </header>
    ${estado.proyectos.length ? `<div class="proyectos">${estado.proyectos.map(tarjetaProyecto).join('')}</div>`
      : `<p class="sutil vacio-grande">${t('sinProyectos')}</p>`}`;
}

function vistaLogros() {
  document.title = tituloSeccion('logros');
  const grupos = Object.keys(TIPOS_LOGRO).map((tipo) => [tipo, estado.logros.filter((l) => tipoLogro(l.tipo) === TIPOS_LOGRO[tipo])])
    .filter(([, lista]) => lista.length);
  contenido.innerHTML = `
    ${migas({ texto: t('logros') })}
    <header class="cabecera">
      <div>
        <h1>${t('logros')}</h1>
        <p class="sutil">${t('logrosDescripcion')}</p>
      </div>
      ${estado.editable ? `<a class="boton boton-chico" href="/admin/logros/"><i class="fa-solid fa-pen"></i> ${t('editar')}</a>` : ''}
    </header>
    ${grupos.length ? grupos.map(([tipo, lista]) => `
      <section class="grupo-logros" style="--acento: var(--${TIPOS_LOGRO[tipo].color})">
        <h2><i class="${TIPOS_LOGRO[tipo].icono}"></i> ${TIPOS_LOGRO[tipo][estado.lang]} <span class="contador">${lista.length}</span></h2>
        <div class="logros">${lista.map(tarjetaLogro).join('')}</div>
      </section>`).join('') : `<p class="sutil vacio-grande">${t('sinLogros')}</p>`}`;
}

function vistaArchivo() {
  document.title = tituloSeccion('archivo');
  const posts = postsVisibles().filter((p) => p.fecha);
  const porAnio = new Map();
  posts.forEach((p) => {
    const anio = p.fecha.slice(0, 4);
    if (!porAnio.has(anio)) porAnio.set(anio, []);
    porAnio.get(anio).push(p);
  });
  const maximo = Math.max(1, ...[...porAnio.values()].map((l) => l.length));
  const cantidad = (n) => `${n} ${n === 1 ? t('entrada') : t('entradas')}`;

  contenido.innerHTML = `
    ${migas({ texto: t('archivo') })}
    <header class="cabecera">
      <div>
        <h1>${t('archivo')}</h1>
        <p class="sutil">${t('archivoDescripcion')}</p>
      </div>
    </header>
    <div class="terminal comando-historial"><span class="prompt">$</span> git log --date=short <span class="sutil"># ${cantidad(posts.length)}</span></div>
    ${!posts.length ? `<p class="sutil vacio-grande">${t('sinPosts')}</p>` : `
      <nav class="anios" aria-label="${t('archivo')}">
        ${[...porAnio].map(([anio, l]) => `
          <a href="#a${anio}"><span>${anio}</span><i style="--n:${l.length / maximo}"></i><b>${l.length}</b></a>`).join('')}
      </nav>
      <div class="historial">
        ${[...porAnio].map(([anio, l]) => `
          <section class="anio" id="a${anio}">
            <h2><span class="anio-numero">${anio}</span><span class="sutil">${cantidad(l.length)}</span></h2>
            <ol class="eventos">
              ${l.map((p) => {
                const v = version(p);
                return `
                <li class="evento">
                  <time datetime="${escapar(p.fecha)}">${escapar(formatearFecha(p.fecha, true))}</time>
                  <a class="evento-tarjeta" href="${rutaDe('post', estado.lang, p.slug)}">
                    <strong>${escapar(v.titulo)}${insigniaBorrador(p)}</strong>
                    ${v.descripcion ? `<span class="evento-descripcion">${escapar(v.descripcion)}</span>` : ''}
                    ${v.etiquetas.length ? `<span class="etiquetas">${v.etiquetas.map((e) => `<span>#${escapar(e)}</span>`).join('')}</span>` : ''}
                  </a>
                </li>`;
              }).join('')}
            </ol>
          </section>`).join('')}
      </div>`}`;
}

function vistaNoEncontrado(mensaje) {
  document.title = '404';
  const ruta = escapar(decodeURIComponent(location.pathname));
  contenido.innerHTML = `
    <div class="terminal error-404">
      <div class="terminal-barra">bash</div>
      <div class="terminal-cuerpo">
        <pre class="ascii" aria-hidden="true">  _  _    ___  _  _
 | || |  / _ \\| || |
 | || |_| | | | || |_
 |__   _| |_| |__   _|
    |_|  \\___/   |_|</pre>
        <p class="linea"><span class="prompt">$</span> cd ${ruta}</p>
        <p class="error">bash: cd: ${ruta}: ${escapar(mensaje && mensaje !== t('noEncontrado') ? mensaje : t('noEncontrado'))}</p>
        <p class="linea"><span class="prompt">$</span> <a href="${rutaDe('inicio')}">${t('volverInicio')}</a><span class="cursor">▌</span></p>
      </div>
    </div>`;
}

/* ---------------- Panel de edición (solo en local) ---------------- */

const PESTANAS = [
  ['posts', 'Posts', 'fa-solid fa-file-lines'],
  ['proyectos', 'Proyectos', 'fa-solid fa-folder-open'],
  ['perfil', 'Perfil', 'fa-solid fa-user'],
  ['logros', 'Logros', 'fa-solid fa-trophy'],
];

function cabeceraPanel(seccion) {
  return `
    ${migas({ texto: 'panel', href: '/admin/' }, { texto: seccion })}
    <header class="cabecera">
      <h1>panel</h1>
      <nav class="pestanas">${PESTANAS.map(([clave, texto, icono]) =>
        `<a href="${rutaDe('admin', 'es', clave === 'posts' ? '' : clave)}" class="${clave === seccion ? 'activa' : ''}"><i class="${icono}"></i> ${texto}</a>`).join('')}
      </nav>
    </header>`;
}

async function vistaAdmin(ruta) {
  document.title = `Panel · ${estado.perfil.nombre || ''}`;
  if (!estado.editable) {
    contenido.innerHTML = `
      ${migas({ texto: 'panel' })}
      <div class="terminal error-404">
        <div class="terminal-barra">panel</div>
        <div class="terminal-cuerpo">
          <p class="linea"><span class="prompt">$</span> ./editar</p>
          <p class="error">permiso denegado: el panel de edición solo funciona en tu computadora.</p>
          <p class="sutil">Abre la carpeta del sitio y ejecuta <code>iniciar.bat</code> (o <code>py servidor.py</code>).</p>
        </div>
      </div>`;
    return;
  }
  if (ruta.seccion === 'post' && ruta.slug) return vistaEditorPost(ruta.slug);
  if (ruta.seccion === 'perfil') return vistaAdminPerfil();
  if (ruta.seccion === 'logros') return vistaAdminLogros();
  if (ruta.seccion === 'proyectos') return vistaAdminProyectos();
  return vistaAdminPosts();
}

const cajaPublicar = `
  <div class="caja-publicar">
    <p><i class="fa-solid fa-cloud-arrow-up"></i> Los cambios se guardan en tu computadora. Para publicarlos en GitHub Pages:</p>
    <div class="markdown"><pre data-lenguaje="bash"><code>git add -A
git commit -m "Actualizo el sitio"
git push</code></pre></div>
  </div>`;

async function vistaAdminPosts() {
  estado.posts = (await api('GET', 'posts')).posts;
  pintarMenu(leerRuta());
  contenido.innerHTML = `
    ${cabeceraPanel('posts')}
    <div class="barra-panel">
      <p class="sutil">${estado.posts.length} posts · ${estado.posts.filter((p) => p.borrador).length} borradores</p>
      <button class="boton boton-principal" data-accion="nuevo-post">+ Nuevo post</button>
    </div>
    ${estado.posts.length ? `<div class="tabla-contenedor"><table class="tabla">
      <thead><tr><th>fecha</th><th>título</th><th>idiomas</th><th>estado</th><th></th></tr></thead>
      <tbody>${estado.posts.map((p) => `
        <tr>
          <td class="mono">${escapar(p.fecha)}</td>
          <td><a href="/admin/post/${enc(p.slug)}/"><strong>${escapar(p.es.titulo)}</strong></a><br><span class="sutil">/post/${escapar(p.slug)}/</span></td>
          <td class="mono"><span class="insignia">ES</span>${p.en ? '<span class="insignia">EN</span>' : '<span class="insignia insignia-apagada">EN</span>'}</td>
          <td>${p.borrador ? '<span class="insignia insignia-borrador">borrador</span>' : '<span class="insignia insignia-ok">publicado</span>'}</td>
          <td class="acciones-fila">
            <a class="boton boton-chico" href="${rutaDe('post', 'es', p.slug)}" title="Ver"><i class="fa-solid fa-eye"></i></a>
            <a class="boton boton-chico" href="/admin/post/${enc(p.slug)}/" title="Editar"><i class="fa-solid fa-pen"></i></a>
            <button class="boton boton-chico boton-peligro" data-accion="borrar-post" data-slug="${escapar(p.slug)}" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
          </td>
        </tr>`).join('')}</tbody></table></div>`
    : '<div class="vacio-grande"><p>Todavía no hay posts.</p></div>'}
    ${cajaPublicar}`;
}

const HERRAMIENTAS = [
  ['H2', '\n## ', '', 'Título'],
  ['H3', '\n### ', '', 'Subtítulo'],
  ['Negrita', '**', '**', 'texto'],
  ['Cursiva', '_', '_', 'texto'],
  ['`código`', '`', '`', 'código'],
  ['Bloque', '\n```bash\n', '\n```\n', 'comando'],
  ['Lista', '\n- ', '', 'elemento'],
  ['Pasos', '\n1. ', '', 'paso'],
  ['Enlace', '[', '](https://)', 'texto'],
  ['Cita', '\n> ', '', 'texto'],
  ['Nota', '\n> **Nota:** ', '', 'texto'],
  ['Tabla', '\n| Columna | Columna |\n| --- | --- |\n| ', ' | dato |\n', 'dato'],
  ['Leer más', '\n<!--more-->\n', '', ''],
];

const leerArchivo = (archivo) => new Promise((resolver, rechazar) => {
  const lector = new FileReader();
  lector.onload = () => resolver(lector.result);
  lector.onerror = () => rechazar(new Error('No se pudo leer el archivo.'));
  lector.readAsDataURL(archivo);
});

async function subirImagen(archivo, carpeta) {
  const extension = (archivo.type.split('/')[1] || 'png').replace('jpeg', 'jpg');
  const nombre = archivo.name && archivo.name !== 'image.png' ? archivo.name : `captura-${Date.now()}.${extension}`;
  return (await api('POST', 'imagen', { carpeta, nombre, datos: await leerArchivo(archivo) })).ruta;
}

async function vistaEditorPost(slug) {
  const post = await api('GET', `post?slug=${enc(slug)}`);
  const vacia = { titulo: '', descripcion: '', etiquetas: '', cuerpo: '' };
  const aFormulario = (v) => (v ? { ...v, etiquetas: v.etiquetas.join(', ') } : { ...vacia });
  const versiones = { es: aFormulario(post.es), en: aFormulario(post.en) };
  let idioma = 'es';
  document.title = `Editando ${post.es.titulo}`;

  contenido.innerHTML = `
    <div class="editor-cabecera">
      ${migas({ texto: 'panel', href: '/admin/' }, { texto: 'posts', href: '/admin/' }, { texto: slug })}
      <div class="acciones">
        <a class="boton" href="${rutaDe('post', 'es', slug)}" id="ver-post"><i class="fa-solid fa-eye"></i> Ver</a>
        <a class="boton" href="/admin/"><i class="fa-solid fa-xmark"></i> Cancelar</a>
        <button class="boton boton-principal" data-accion="guardar-post" title="Guarda y vuelve a la lista (Ctrl+S guarda sin salir)"><i class="fa-solid fa-floppy-disk"></i> Guardar</button>
      </div>
    </div>

    <div class="meta-post">
      <label class="campo">slug (dirección)
        <span class="campo-prefijo"><span>/post/</span><input id="slug" value="${escapar(post.slug)}" autocomplete="off" spellcheck="false"></span>
      </label>
      <label class="campo">fecha <input id="fecha" type="date" value="${escapar(post.fecha)}"></label>
      <label class="interruptor"><input id="borrador" type="checkbox" ${post.borrador ? 'checked' : ''}> <span>borrador</span>
        <small class="sutil">no se publica</small></label>
    </div>

    <div class="pestanas pestanas-idioma" role="tablist">
      <button data-idioma="es" class="activa">ES · español</button>
      <button data-idioma="en">EN · english</button>
      <span class="sutil" id="nota-idioma"></span>
    </div>

    <div class="campos-idioma">
      <label class="campo">título <input id="titulo" autocomplete="off"></label>
      <label class="campo">etiquetas <input id="etiquetas" placeholder="Bug Bounty, XSS" autocomplete="off"></label>
      <label class="campo completo">descripción <small class="sutil">(aparece en listas, buscadores y redes)</small>
        <input id="descripcion" autocomplete="off"></label>
    </div>

    <div class="herramientas">${HERRAMIENTAS.map(([texto], i) =>
      `<button class="boton boton-chico" data-herramienta="${i}">${escapar(texto)}</button>`).join('')}
      <button class="boton boton-chico boton-imagen" data-accion="elegir-imagen"><i class="fa-regular fa-image"></i> Imagen</button>
      <span class="sutil">Markdown · pega o arrastra imágenes · Ctrl+S guarda</span>
    </div>
    <input type="file" id="archivo-imagen" accept="image/png,image/jpeg,image/gif,image/webp,image/avif" multiple hidden>
    <div class="editor">
      <textarea id="texto" spellcheck="false"></textarea>
      <article class="markdown vista-previa" id="vista-previa"></article>
    </div>`;

  const area = $('#texto');
  const previa = $('#vista-previa');
  const campos = ['titulo', 'descripcion', 'etiquetas'];

  const leerCampos = () => {
    campos.forEach((c) => { versiones[idioma][c] = $(`#${c}`).value; });
    versiones[idioma].cuerpo = area.value;
  };
  const datosFormulario = () => {
    leerCampos();
    return {
      slug: post.slug, nuevoSlug: $('#slug').value.trim(), fecha: $('#fecha').value,
      borrador: $('#borrador').checked, es: versiones.es, en: versiones.en,
    };
  };
  const notaIdioma = () => {
    const v = versiones.en;
    const sinIngles = idioma === 'en' && !v.titulo.trim() && !v.cuerpo.trim();
    $('#nota-idioma').innerHTML = sinIngles
      ? 'Sin versión en inglés: se mostrará la versión en español. <button class="boton boton-chico" data-accion="copiar-espanol">Copiar desde español</button>'
      : '';
  };
  const cargarCampos = () => {
    campos.forEach((c) => { $(`#${c}`).value = versiones[idioma][c]; });
    area.value = versiones[idioma].cuerpo;
    $$('.pestanas-idioma [data-idioma]').forEach((b) => b.classList.toggle('activa', b.dataset.idioma === idioma));
    notaIdioma();
    pintarMarkdown(previa, area.value);
  };

  cargarCampos();
  let original = JSON.stringify(datosFormulario());
  let espera;
  const alCambiar = () => {
    estado.sinGuardar = JSON.stringify(datosFormulario()) !== original;
    clearTimeout(espera);
    espera = setTimeout(() => pintarMarkdown(previa, area.value), 150);
  };
  contenido.querySelectorAll('input, textarea').forEach((el) => el.addEventListener('input', alCambiar));
  $('#borrador').addEventListener('change', alCambiar);

  const insertar = (antes, seleccionado = '', despues = '') => {
    const { selectionStart: inicio, selectionEnd: fin } = area;
    area.setRangeText(antes + seleccionado + despues, inicio, fin, 'end');
    area.setSelectionRange(inicio + antes.length, inicio + antes.length + seleccionado.length);
    area.focus();
    alCambiar();
  };

  const subirVarias = (archivos) => intentar(async () => {
    const imagenes = [...archivos].filter((a) => a.type.startsWith('image/'));
    for (const archivo of imagenes) {
      aviso(`Subiendo ${archivo.name || 'imagen'}…`);
      const ruta = await subirImagen(archivo, post.slug);
      insertar(`\n![${idioma === 'en' ? 'image' : 'imagen'}](${ruta})\n`);
    }
    if (imagenes.length) aviso(imagenes.length === 1 ? 'Imagen agregada' : `${imagenes.length} imágenes agregadas`);
  });

  area.addEventListener('keydown', (e) => {
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      area.setRangeText('  ', area.selectionStart, area.selectionEnd, 'end');
      alCambiar();
    }
  });
  area.addEventListener('paste', (e) => {
    if (e.clipboardData.files.length) { e.preventDefault(); subirVarias(e.clipboardData.files); }
  });
  area.addEventListener('dragover', (e) => { e.preventDefault(); area.classList.add('soltando'); });
  area.addEventListener('dragleave', () => area.classList.remove('soltando'));
  area.addEventListener('drop', (e) => {
    area.classList.remove('soltando');
    if (e.dataTransfer.files.length) { e.preventDefault(); subirVarias(e.dataTransfer.files); }
  });
  $('#archivo-imagen').addEventListener('change', (e) => { subirVarias(e.target.files); e.target.value = ''; });

  $('.herramientas').addEventListener('click', (e) => {
    const boton = e.target.closest('[data-herramienta]');
    if (!boton) return;
    const [, antes, despues, ejemplo] = HERRAMIENTAS[boton.dataset.herramienta];
    insertar(antes, area.value.slice(area.selectionStart, area.selectionEnd) || ejemplo, despues);
  });

  $('.pestanas-idioma').addEventListener('click', (e) => {
    const boton = e.target.closest('[data-idioma]');
    const copiar = e.target.closest('[data-accion="copiar-espanol"]');
    if (copiar) {
      leerCampos();
      versiones.en = { ...versiones.es };
      cargarCampos();
      alCambiar();
    } else if (boton && boton.dataset.idioma !== idioma) {
      leerCampos();
      idioma = boton.dataset.idioma;
      cargarCampos();
    }
  });

  editorActual = (salir = false) => intentar(async () => {
    const datos = datosFormulario();
    const r = await api('PUT', 'post', datos);
    estado.cuerpos.forEach((_, clave) => { if (clave.startsWith(`${post.slug}.`)) estado.cuerpos.delete(clave); });
    if (r.slug !== post.slug) {
      post.slug = r.slug;
      history.replaceState(null, '', `/admin/post/${enc(r.slug)}/`);
      urlMostrada = location.pathname;
      $('#ver-post').href = rutaDe('post', 'es', r.slug);
    }
    $('#slug').value = r.slug;
    original = JSON.stringify(datosFormulario());
    estado.sinGuardar = false;
    estado.posts = (await api('GET', 'posts')).posts;
    aviso('Guardado');
    if (salir) ir('/admin/');
    else pintarMenu(leerRuta());
  });

  area.focus({ preventScroll: true });
  area.setSelectionRange(0, 0);
}

const asa = '<span class="asa" tabindex="0" role="button" title="Arrastra para reordenar (o usa ↑/↓)" aria-label="Mover"><i class="fa-solid fa-grip-vertical"></i></span>';

// Reordena los hijos [data-ordenable] de `lista` arrastrándolos desde su asa, o con ↑/↓ sobre ella.
function hacerOrdenable(lista, alTerminar) {
  let arrastrada = null;
  lista.addEventListener('pointerdown', (e) => {
    const fila = e.target.closest('[data-ordenable]');
    if (fila) fila.draggable = Boolean(e.target.closest('.asa'));
  });
  lista.addEventListener('dragstart', (e) => {
    arrastrada = e.target.closest('[data-ordenable]');
    if (!arrastrada) return;
    arrastrada.classList.add('arrastrando');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
  });
  lista.addEventListener('dragover', (e) => {
    if (!arrastrada) return;
    e.preventDefault();
    const destino = e.target.closest('[data-ordenable]');
    if (!destino || destino === arrastrada || destino.parentNode !== arrastrada.parentNode) return;
    const caja = destino.getBoundingClientRect();
    destino.parentNode.insertBefore(arrastrada, e.clientY > caja.top + caja.height / 2 ? destino.nextSibling : destino);
  });
  lista.addEventListener('dragend', () => {
    if (!arrastrada) return;
    arrastrada.classList.remove('arrastrando');
    arrastrada.draggable = false;
    arrastrada = null;
    alTerminar();
  });
  lista.addEventListener('keydown', (e) => {
    const asaActiva = e.target.closest('.asa');
    if (!asaActiva || !['ArrowUp', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault();
    const fila = asaActiva.closest('[data-ordenable]');
    const vecina = e.key === 'ArrowUp' ? fila.previousElementSibling : fila.nextElementSibling;
    if (!vecina) return;
    fila.parentNode.insertBefore(fila, e.key === 'ArrowUp' ? vecina : vecina.nextSibling);
    asaActiva.focus();
    alTerminar();
  });
}

function filaRed(r = { tipo: 'web', url: '' }) {
  return `
    <div class="fila-red" data-ordenable>
      ${asa}
      <select name="tipo-red">${Object.entries(REDES).map(([clave, datos]) =>
        `<option value="${clave}" ${clave === r.tipo ? 'selected' : ''}>${escapar(datos.nombre)}</option>`).join('')}</select>
      <input name="url-red" value="${escapar(r.url)}" placeholder="https://… o mailto:…" autocomplete="off">
      <button type="button" class="boton boton-chico boton-peligro" data-accion="quitar-red" title="Quitar"><i class="fa-solid fa-xmark"></i></button>
    </div>`;
}

function vistaAdminPerfil() {
  const p = estado.perfil;
  const bilingue = (nombre, etiqueta, valor, area = false) => ['es', 'en'].map((i) => `
    <label class="campo">${etiqueta} <span class="insignia">${i.toUpperCase()}</span>
      ${area ? `<textarea name="${nombre}-${i}" rows="7">${escapar((valor || {})[i])}</textarea>`
        : `<input name="${nombre}-${i}" value="${escapar((valor || {})[i])}" autocomplete="off">`}
    </label>`).join('');

  contenido.innerHTML = `
    ${cabeceraPanel('perfil')}
    <form id="form-perfil" class="formulario" novalidate>
      <fieldset>
        <legend>identidad</legend>
        <div class="foto-perfil">
          <span class="avatar avatar-grande"><img id="foto-previa" src="${escapar(p.foto || '')}" alt=""></span>
          <div>
            <input type="hidden" name="foto" value="${escapar(p.foto || '')}">
            <button type="button" class="boton" data-accion="elegir-foto"><i class="fa-solid fa-camera"></i> Cambiar foto</button>
            <p class="sutil">JPG, PNG o WEBP. Se guarda en /images/perfil/.</p>
            <input type="file" id="archivo-foto" accept="image/png,image/jpeg,image/webp,image/avif" hidden>
          </div>
        </div>
        <div class="rejilla">
          <label class="campo">nombre <input name="nombre" value="${escapar(p.nombre)}" required autocomplete="off"></label>
          <label class="campo">usuario <small class="sutil">(aparece como ~$ usuario)</small><input name="usuario" value="${escapar(p.usuario)}" autocomplete="off"></label>
          <label class="campo completo">dirección del sitio <small class="sutil">(para sitemap y vistas previas)</small><input name="sitio" value="${escapar(p.sitio)}" placeholder="https://aldomoreno.net" autocomplete="off"></label>
        </div>
      </fieldset>
      <fieldset>
        <legend>rol</legend>
        <div class="rejilla">${bilingue('rol', 'rol / puesto', p.rol)}</div>
      </fieldset>
      <fieldset>
        <legend>bio <small class="sutil">markdown</small></legend>
        <div class="rejilla">${bilingue('bio', 'sobre mí', p.bio, true)}</div>
      </fieldset>
      <fieldset>
        <legend>habilidades</legend>
        <label class="campo">separadas por comas <input name="habilidades" value="${escapar((p.habilidades || []).join(', '))}" autocomplete="off"></label>
      </fieldset>
      <fieldset>
        <legend>redes y contacto <small class="sutil">arrastra <i class="fa-solid fa-grip-vertical"></i> para cambiar el orden</small></legend>
        <div id="redes">${(p.redes || []).map(filaRed).join('')}</div>
        <button type="button" class="boton boton-chico" data-accion="agregar-red">+ Agregar red</button>
      </fieldset>
      <div class="acciones acciones-formulario">
        <button type="submit" class="boton boton-principal"><i class="fa-solid fa-floppy-disk"></i> Guardar perfil</button>
      </div>
    </form>`;

  const formulario = $('#form-perfil');
  const leer = () => {
    const d = Object.fromEntries(new FormData(formulario));
    return {
      nombre: d.nombre, usuario: d.usuario, foto: d.foto, sitio: d.sitio,
      rol: { es: d['rol-es'], en: d['rol-en'] },
      bio: { es: d['bio-es'], en: d['bio-en'] },
      habilidades: d.habilidades,
      redes: $$('.fila-red', formulario).map((fila) => ({
        tipo: $('[name="tipo-red"]', fila).value, url: $('[name="url-red"]', fila).value.trim(),
      })).filter((r) => r.url),
    };
  };
  let original = JSON.stringify(leer());
  const alCambiar = () => { estado.sinGuardar = JSON.stringify(leer()) !== original; };
  formulario.addEventListener('input', alCambiar);
  formulario.addEventListener('change', alCambiar);
  hacerOrdenable($('#redes'), alCambiar);

  formulario.addEventListener('click', (e) => {
    const accion = e.target.closest('[data-accion]')?.dataset.accion;
    if (accion === 'agregar-red') {
      $('#redes').insertAdjacentHTML('beforeend', filaRed());
      $('#redes .fila-red:last-child input').focus();
    } else if (accion === 'quitar-red') {
      e.target.closest('.fila-red').remove();
      alCambiar();
    } else if (accion === 'elegir-foto') {
      $('#archivo-foto').click();
    }
  });
  $('#archivo-foto').addEventListener('change', (e) => intentar(async () => {
    const archivo = e.target.files[0];
    e.target.value = '';
    if (!archivo) return;
    const ruta = await subirImagen(archivo, 'perfil');
    formulario.foto.value = ruta;
    $('#foto-previa').src = ruta;
    alCambiar();
    aviso('Foto subida: guarda el perfil para usarla');
  }));

  editorActual = () => intentar(async () => {
    estado.perfil = await api('PUT', 'perfil', leer());
    original = JSON.stringify(leer());
    estado.sinGuardar = false;
    pintarMenu(leerRuta());
    pintarPie();
    aviso('Perfil guardado');
  });
  formulario.addEventListener('submit', (e) => { e.preventDefault(); editorActual(); });
}

function camposLogro(l = {}) {
  return [
    { nombre: 'tipo', etiqueta: 'tipo', tipo: 'select', valor: l.tipo || 'certificacion',
      opciones: Object.entries(TIPOS_LOGRO).map(([clave, d]) => [clave, d.es]) },
    { nombre: 'fecha', etiqueta: 'fecha (AAAA, AAAA-MM o AAAA-MM-DD)', valor: l.fecha || String(new Date().getFullYear()),
      requerido: true, patron: '\\d{4}(-\\d{2}(-\\d{2})?)?' },
    { nombre: 'titulo-es', etiqueta: 'título · ES', valor: l.titulo?.es, requerido: true },
    { nombre: 'titulo-en', etiqueta: 'título · EN', valor: l.titulo?.en, ayuda: 'opcional' },
    { nombre: 'emisor', etiqueta: 'emisor / organización', valor: l.emisor },
    { nombre: 'url', etiqueta: 'enlace (credencial, sitio…)', tipo: 'url', valor: l.url, ayuda: 'https://…' },
    { nombre: 'descripcion-es', etiqueta: 'descripción · ES', tipo: 'area', valor: l.descripcion?.es, completo: true },
    { nombre: 'descripcion-en', etiqueta: 'descripción · EN', tipo: 'area', valor: l.descripcion?.en, completo: true },
  ];
}

const logroDesdeFormulario = (d, anterior = {}) => ({
  id: anterior.id || '',
  tipo: d.tipo,
  fecha: d.fecha.trim(),
  titulo: { es: d['titulo-es'], en: d['titulo-en'] },
  emisor: d.emisor,
  url: d.url,
  descripcion: { es: d['descripcion-es'], en: d['descripcion-en'] },
});

function vistaAdminLogros() {
  const lista = estado.logros;
  contenido.innerHTML = `
    ${cabeceraPanel('logros')}
    <div class="barra-panel">
      <p class="sutil">${lista.length} logros · se ordenan solos por fecha</p>
      <button class="boton boton-principal" data-accion="nuevo-logro">+ Nuevo logro</button>
    </div>
    ${lista.length ? `<div class="tabla-contenedor"><table class="tabla">
      <thead><tr><th>fecha</th><th>tipo</th><th>título</th><th>emisor</th><th></th></tr></thead>
      <tbody>${lista.map((l, i) => {
        const tipo = tipoLogro(l.tipo);
        return `
        <tr>
          <td class="mono">${escapar(l.fecha)}</td>
          <td><span class="insignia-tipo" style="--acento: var(--${tipo.color})"><i class="${tipo.icono}"></i> ${tipo.corto}</span></td>
          <td><strong>${escapar(l.titulo.es)}</strong>${l.url ? ` <a href="${escapar(l.url)}" target="_blank" rel="noopener" title="Abrir enlace"><i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : ''}</td>
          <td>${escapar(l.emisor)}</td>
          <td class="acciones-fila">
            <button class="boton boton-chico" data-accion="editar-logro" data-indice="${i}" title="Editar"><i class="fa-solid fa-pen"></i></button>
            <button class="boton boton-chico boton-peligro" data-accion="borrar-logro" data-indice="${i}" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
          </td>
        </tr>`;
      }).join('')}</tbody></table></div>`
    : '<div class="vacio-grande"><p>Todavía no hay logros.</p></div>'}`;
}

async function guardarLogros(lista, mensaje) {
  estado.logros = (await api('PUT', 'logros', { logros: lista })).logros;
  pintarMenu(leerRuta());
  vistaAdminLogros();
  aviso(mensaje);
}

function camposProyecto(p = {}) {
  return [
    { nombre: 'titulo-es', etiqueta: 'nombre · ES', valor: p.titulo?.es, requerido: true },
    { nombre: 'titulo-en', etiqueta: 'nombre · EN', valor: p.titulo?.en, ayuda: 'opcional' },
    { nombre: 'estado', etiqueta: 'estado', tipo: 'select', valor: p.estado || 'activo',
      opciones: Object.entries(ESTADOS_PROYECTO).map(([clave, d]) => [clave, d.es]) },
    { nombre: 'fecha', etiqueta: 'fecha (AAAA, AAAA-MM o AAAA-MM-DD)', valor: p.fecha ?? String(new Date().getFullYear()),
      patron: '\\d{4}(-\\d{2}(-\\d{2})?)?', ayuda: 'opcional' },
    { nombre: 'tecnologias', etiqueta: 'tecnologías (separadas por comas)', valor: (p.tecnologias || []).join(', '),
      ayuda: 'Python, JavaScript, Burp Suite', completo: true },
    { nombre: 'url', etiqueta: 'sitio / demo', tipo: 'url', valor: p.url, ayuda: 'https://…' },
    { nombre: 'repo', etiqueta: 'código (repositorio)', tipo: 'url', valor: p.repo, ayuda: 'https://github.com/…' },
    { nombre: 'imagen', etiqueta: 'imagen (opcional)', tipo: 'imagen', carpeta: 'proyectos', valor: p.imagen, ayuda: '/images/proyectos/…', completo: true },
    { nombre: 'descripcion-es', etiqueta: 'descripción · ES', tipo: 'area', valor: p.descripcion?.es, completo: true },
    { nombre: 'descripcion-en', etiqueta: 'descripción · EN', tipo: 'area', valor: p.descripcion?.en, completo: true },
  ];
}

const proyectoDesdeFormulario = (d, anterior = {}) => ({
  id: anterior.id || '',
  titulo: { es: d['titulo-es'], en: d['titulo-en'] },
  descripcion: { es: d['descripcion-es'], en: d['descripcion-en'] },
  tecnologias: d.tecnologias,
  url: d.url,
  repo: d.repo,
  imagen: d.imagen.trim(),
  fecha: d.fecha.trim(),
  estado: d.estado,
});

function vistaAdminProyectos() {
  const lista = estado.proyectos;
  contenido.innerHTML = `
    ${cabeceraPanel('proyectos')}
    <div class="barra-panel">
      <p class="sutil">${lista.length} proyectos · arrastra <i class="fa-solid fa-grip-vertical"></i> para cambiar el orden en que se muestran</p>
      <button class="boton boton-principal" data-accion="nuevo-proyecto">+ Nuevo proyecto</button>
    </div>
    ${lista.length ? `<div class="tabla-contenedor"><table class="tabla">
      <thead><tr><th></th><th>proyecto</th><th>tecnologías</th><th>estado</th><th></th></tr></thead>
      <tbody id="filas-proyectos">${lista.map((p, i) => {
        const est = estadoProyecto(p.estado);
        return `
        <tr data-ordenable data-indice="${i}">
          <td class="celda-asa">${asa}</td>
          <td>
            <div class="celda-proyecto">
              ${p.imagen ? `<img class="miniatura" src="${escapar(p.imagen)}" alt="">` : '<span class="miniatura"><i class="fa-solid fa-folder"></i></span>'}
              <div><strong>${escapar(p.titulo.es)}</strong><br><span class="sutil">${escapar(p.fecha || '—')}</span></div>
            </div>
          </td>
          <td><ul class="chips chips-chicos">${(p.tecnologias || []).map((x) => `<li>${escapar(x)}</li>`).join('')}</ul></td>
          <td><span class="insignia-tipo" style="--acento: var(--${est.color})">${est.es}</span></td>
          <td class="acciones-fila">
            <button class="boton boton-chico" data-accion="editar-proyecto" data-indice="${i}" title="Editar"><i class="fa-solid fa-pen"></i></button>
            <button class="boton boton-chico boton-peligro" data-accion="borrar-proyecto" data-indice="${i}" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
          </td>
        </tr>`;
      }).join('')}</tbody></table></div>`
    : '<div class="vacio-grande"><p>Todavía no hay proyectos.</p></div>'}`;

  const filas = $('#filas-proyectos');
  if (filas) {
    hacerOrdenable(filas, () => intentar(async () => {
      const orden = $$('tr', filas).map((tr) => Number(tr.dataset.indice));
      if (orden.every((n, i) => n === i)) return;
      await guardarProyectos(orden.map((i) => estado.proyectos[i]), 'Orden guardado');
    }));
  }
}

async function guardarProyectos(lista, mensaje) {
  estado.proyectos = (await api('PUT', 'proyectos', { proyectos: lista })).proyectos;
  pintarMenu(leerRuta());
  vistaAdminProyectos();
  aviso(mensaje);
}

/* ---------------- Diálogo, avisos y acciones ---------------- */

function campoHTML(c) {
  const comunes = `name="${c.nombre}" ${c.requerido ? 'required' : ''} placeholder="${escapar(c.ayuda || '')}"`;
  let control;
  if (c.tipo === 'select') {
    control = `<select name="${c.nombre}">${c.opciones.map(([valor, texto]) =>
      `<option value="${escapar(valor)}" ${valor === c.valor ? 'selected' : ''}>${escapar(texto)}</option>`).join('')}</select>`;
  } else if (c.tipo === 'area') {
    control = `<textarea ${comunes} rows="3">${escapar(c.valor || '')}</textarea>`;
  } else if (c.tipo === 'imagen') {
    control = `<span class="campo-imagen"><input type="text" ${comunes} value="${escapar(c.valor || '')}" autocomplete="off">
      <button type="button" class="boton boton-chico" data-subir-imagen="${escapar(c.carpeta)}"><i class="fa-regular fa-image"></i> Subir</button></span>`;
  } else {
    control = `<input type="${c.tipo === 'url' ? 'url' : 'text'}" ${comunes} value="${escapar(c.valor || '')}"
                 ${c.patron ? `pattern="${c.patron}"` : ''} autocomplete="off">`;
  }
  return `<label class="${c.completo ? 'completo' : ''}">${escapar(c.etiqueta)}${control}</label>`;
}

function pedirDatos({ titulo, campos, boton = 'Crear', ancho = false }) {
  const dialogo = $('#dialogo');
  dialogo.classList.toggle('dialogo-ancho', ancho);
  $('#dialogo-titulo').textContent = titulo;
  $('#dialogo-boton').textContent = boton;
  $('#dialogo-campos').innerHTML = campos.map(campoHTML).join('');
  dialogo.returnValue = '';
  dialogo.showModal();
  return new Promise((resolver) => {
    dialogo.addEventListener('close', () => {
      resolver(dialogo.returnValue === 'ok' ? Object.fromEntries(new FormData($('form', dialogo))) : null);
    }, { once: true });
  });
}

// "Cancelar" no es botón de envío: así Enter siempre confirma el diálogo.
$('#dialogo [data-cerrar]').addEventListener('click', () => $('#dialogo').close('cancelar'));

// Campos de tipo imagen: suben el archivo y escriben su ruta en el campo de texto.
$('#dialogo').addEventListener('click', (e) => {
  const boton = e.target.closest('[data-subir-imagen]');
  if (!boton) return;
  e.preventDefault();
  const selector = Object.assign(document.createElement('input'),
    { type: 'file', accept: 'image/png,image/jpeg,image/gif,image/webp,image/avif' });
  selector.addEventListener('change', () => intentar(async () => {
    if (!selector.files[0]) return;
    boton.disabled = true;
    try {
      boton.previousElementSibling.value = await subirImagen(selector.files[0], boton.dataset.subirImagen);
      aviso('Imagen subida');
    } finally {
      boton.disabled = false;
    }
  }));
  selector.click();
});

function aviso(texto, tipo = 'ok') {
  const caja = $('#aviso');
  caja.textContent = texto;
  caja.className = `aviso visible ${tipo}`;
  clearTimeout(aviso.espera);
  aviso.espera = setTimeout(() => { caja.className = 'aviso'; }, tipo === 'error' ? 4000 : 2000);
}

async function intentar(accion) {
  try { await accion(); } catch (error) { aviso(error.message, 'error'); }
}

contenido.addEventListener('click', (e) => {
  const boton = e.target.closest('[data-accion]');
  if (!boton || boton.closest('#form-perfil')) return;
  const indice = Number(boton.dataset.indice);
  const acciones = {
    'nuevo-post': () => intentar(async () => {
      const datos = await pedirDatos({
        titulo: 'Nuevo post',
        campos: [{ nombre: 'titulo', etiqueta: 'Título (en español)', ayuda: 'Ej. Tips para encontrar XSS', requerido: true }],
      });
      if (!datos) return;
      const { slug } = await api('POST', 'post', { titulo: datos.titulo });
      estado.posts = (await api('GET', 'posts')).posts;
      ir(`/admin/post/${enc(slug)}/`);
    }),
    'borrar-post': () => intentar(async () => {
      const post = buscarPost(boton.dataset.slug);
      if (!confirm(`¿Eliminar el post "${post?.es.titulo}"?\nSe moverá a .papelera/ por si lo necesitas.`)) return;
      await api('DELETE', `post?slug=${enc(boton.dataset.slug)}`);
      aviso('Post eliminado');
      await vistaAdminPosts();
    }),
    'guardar-post': () => editorActual?.(true),
    'elegir-imagen': () => $('#archivo-imagen').click(),
    'nuevo-logro': () => intentar(async () => {
      const datos = await pedirDatos({ titulo: 'Nuevo logro', campos: camposLogro(), ancho: true, boton: 'Agregar' });
      if (datos) await guardarLogros([...estado.logros, logroDesdeFormulario(datos)], 'Logro agregado');
    }),
    'editar-logro': () => intentar(async () => {
      const anterior = estado.logros[indice];
      const datos = await pedirDatos({ titulo: 'Editar logro', campos: camposLogro(anterior), ancho: true, boton: 'Guardar' });
      if (!datos) return;
      const lista = estado.logros.slice();
      lista[indice] = logroDesdeFormulario(datos, anterior);
      await guardarLogros(lista, 'Logro guardado');
    }),
    'borrar-logro': () => intentar(async () => {
      if (!confirm(`¿Eliminar "${estado.logros[indice].titulo.es}"?`)) return;
      await guardarLogros(estado.logros.filter((_, i) => i !== indice), 'Logro eliminado');
    }),
    'nuevo-proyecto': () => intentar(async () => {
      const datos = await pedirDatos({ titulo: 'Nuevo proyecto', campos: camposProyecto(), ancho: true, boton: 'Agregar' });
      if (datos) await guardarProyectos([proyectoDesdeFormulario(datos), ...estado.proyectos], 'Proyecto agregado');
    }),
    'editar-proyecto': () => intentar(async () => {
      const anterior = estado.proyectos[indice];
      const datos = await pedirDatos({ titulo: 'Editar proyecto', campos: camposProyecto(anterior), ancho: true, boton: 'Guardar' });
      if (!datos) return;
      const lista = estado.proyectos.slice();
      lista[indice] = proyectoDesdeFormulario(datos, anterior);
      await guardarProyectos(lista, 'Proyecto guardado');
    }),
    'borrar-proyecto': () => intentar(async () => {
      if (!confirm(`¿Eliminar el proyecto "${estado.proyectos[indice].titulo.es}"?`)) return;
      await guardarProyectos(estado.proyectos.filter((_, i) => i !== indice), 'Proyecto eliminado');
    }),
  };
  acciones[boton.dataset.accion]?.();
});

document.addEventListener('keydown', (e) => {
  const escribiendo = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
  if (e.key === '/' && !escribiendo && $('#buscar-posts')) { e.preventDefault(); $('#buscar-posts').focus(); }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && editorActual) {
    e.preventDefault();
    editorActual();
  }
});

window.addEventListener('scroll', () => {
  if (document.body.dataset.vista !== 'post') return;
  const total = document.documentElement.scrollHeight - innerHeight;
  $('#progreso').style.transform = `scaleX(${total > 0 ? Math.min(1, scrollY / total) : 0})`;
}, { passive: true });

/* ---------------- Inicio ---------------- */

(async function iniciar() {
  await cargarDatos();
  mostrar();
})();
