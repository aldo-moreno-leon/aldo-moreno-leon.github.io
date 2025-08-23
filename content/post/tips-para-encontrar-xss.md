+++
author = "Aldo Moreno"
title = "Tips para encontrar vulnerabilidades XSS"
date = "2023-06-11"
description = "Como encontrar vulnerabilidades de Cross-Site Scripting."
tags = [
    "XSS",
]
+++

Ya dos años desde que subí un post en el blog, vuelvo a reactivarlo para compartir algunos conocimientos que pueden ser útiles.
No entraré en detalles de lo que es un Cross-Site Scripting ni tampoco en payloads, aquí voy a mostrar mi manera de como expandir un poco mi área de búsqueda de XSS.
<!--more-->
---

### Conocer el sitio

Lo primero que realizo al comenzar mi caza de XSS es conocer el sitio al que se está testeando. Esto es saber donde hay entradas de datos como buscadores de productos, de posts, de FAQ, cualquier buscador que se encuentre. Al igual que si hay campos para agregar comentarios, reseñas, notas, títulos, entre otros datos de entrada. Es bueno observar siempre la dirección URL para ver que parámetros se muestran y si es posible inyectar payloads ahí.

Un punto importante es saber como un usuario interactúa con el sitio web, que modelo de negocio maneja, así se puede dar una idea de los puntos de inyección que puede haber. Quizá existan formularios que se envíen al soporte del sitio y ahí conviene inyectar payloads de Blind XSS. O quizá sea un comercio en el que cada producto tenga una sección de comentarios donde es evidente el punto de inyección para explotar Stored XSS.
Un tip que sirve para conocer mejor el sitio web es utilizar la extensión de navegadores Wappalyzer, el cual nos sirve para saber que lenguajes y tecnologías utiliza el sitio. Nos será útil con los métodos que mostraré más adelante.

Ese es el primer paso para comenzar mi búsqueda, siempre analizo bien el lugar que voy a testear.

### Google dorking
El buscador de google es una gran herramienta para encontrar puntos de inyección que están ocultos o se nos pasan por completo al navegar por el sitio.
Es muy fácil, te mostraré las que utilizo normalmente:

{{< highlight text >}}

site:*.yahoo.com ext:php
site:*.yahoo.com inurl:php -www
site:*.yahoo.com ext:asp
site:*.yahoo.com inurl:aspx
site:*.yahoo.com inurl:jsp
site:*.yahoo.com inurl:cat=
site:*.yahoo.com inurl:id=

{{< /highlight >}}

Se pueden hacer tantas variaciones como se quiera, es cuestión de agregarle un poco de imaginación y saber como está desarrollado el sitio.

{{< figure src="/images/tips-para-encontrar-xss/1.PNG" alt="image" >}}

## Wayback Machine
Otra herramienta sumamente útil para encontrar puntos de inyección ocultos o dificiles de encontrar es Waybackmachine.
Lo único que se debe hacer es usar una URL elaborada de manera que arroje los resultados deseados.

{{< highlight text >}}

http://web.archive.org/cdx/search/cdx?url=yahoo.com/*&output=text&fl=original&collapse=urlkey&from=

{{< /highlight >}}

De esta manera arroja tantos resultados como estén registrados en Waybackmachine. La tarea siguiente sería filtrar con el buscador del navegador.

{{< figure src="/images/tips-para-encontrar-xss/2.PNG" alt="image" >}}

## Parámetros ocultos
Esta sugerencia es un plus en este post y el cual me ha servido en múltiples ocasiones para encontrar parámetros ocultos.
Cuando navego por un sitio web y veo páginas con extensión de PHP, JSP, ASP, ASPX, etc. procedo a juguetear con los parámetros de la URI ya sea los que se manejan visualmente en la página o los que descubro utilizando una herramienta para detectar parámetros utilizados por esa misma página.

Arjun es una herramienta desarrollada por Somdev Sangwan que te permite saber si hay parámetros utilizables ya sean del tipo GET, POST, JSON y XML.
- Arjun: [https://github.com/s0md3v/Arjun](https://github.com/s0md3v/Arjun)

{{< highlight bash >}}

arjun -u https://api.example.com/endpoint -m GET

{{< /highlight >}}

### Conclusión
Esta es la manera en que me dirijo para buscar vulnerabilidades XSS, probablemente existan otros métodos que funcionen con más eficacia e incluso haya algunos más que se me han pasado pero el objetivo es mostrar lo que me ha sido útil y que puede funcionarles a ustedes también.

<div style="margin-bottom: 50px;"></div>

> “Si ayudas en la red, los demás también te ayudarán.”<br>
> — <cite>Johan Manuel Mendez</cite>