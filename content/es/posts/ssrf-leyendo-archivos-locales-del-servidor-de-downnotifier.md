---
title: "SSRF: leyendo archivos locales del servidor de Downnotifier"
date: 2021-04-25
description: Write-up sobre una vulnerabilidad en el sitio web DownNotifier
draft: false
categories:
- Web Hacking
tags:
- bug-bounty
- SSRF
author: "C0wb0y" # author name
authorImageUrl: "https://i.postimg.cc/8CdHLVjW/mugen.jpg" # your image url. We use `authorImageUrl` first. If not set, we use `authorImage`.
authorDesc: "Me apasiona el hacking. Soy una persona extremadamente curiosa. Leer libros, ver películas y series son solo algunos de tantos hobbies que tengo." # author description
socialOptions: # override params.toml file socialOptions
  twitter: "https://twitter.com/_c0wb0y_"
  github: "https://github.com/im-a-c0wb0y"
---

Hace un tiempo escribí un [write-up](https://www.openbugbounty.org/blog/leonmugen/ssrf-reading-local-files-from-downnotifier-server/) acerca de como fui capaz de leer archivos locales provenientes del servidor de un servicio web llamado [Downnotifier](https://www.downnotifier.com/) y para poder realizar tal acción, se explotó una vulnerabilidad llamada Server Side Request Forgery.

El write-up originalmente fue escrito en inglés por medio de la plataforma Openbugbounty, pero ahora lo escribo mediante este blog y traducida al español.
<!--more-->
---

Hola chicos, este es mi primer write-up y me gustaría compartirlo con la comunidad de bug bounty, es sobre un SSRF que encontré hace algunos meses.

DownNotifier tiene un programa de recompensas en Openbugbounty, entonces decidí darle un vistazo a [https://www.downnotifier.com](https://www.downnotifier.com/). Cuando navegué por el sitio web, me di cuenta de un campo para entrada de texto de tipo URL y rapidamente la vulnerabilidad SSRF vino a mi mente.

### Obteniendo XSPA

La primer actividad por realizar es agregar http://127.0.0.1:22 en el campo de texto "Website URL".

Después seleccionar "When the site does not contain a specific text" y escribir algún texto aleatorio.

![https://i.postimg.cc/3RPP55jK/1.png](https://i.postimg.cc/3RPP55jK/1.png)

Envié esa solicitud y seguidamente dos correos electrónicos llegaron a mi bandeja de entrada unos minutos después. El primero para alertar que un sitio web está siendo monitoreado y el segundo correo para alertar que el sitio web está fuera de servicio pero dentro de un archivo de HTML.

![https://i.postimg.cc/cHKVb4n9/2.png](https://i.postimg.cc/cHKVb4n9/2.png)

¿Y cual era la respuesta?

![https://i.postimg.cc/q7DPwCz6/3.png](https://i.postimg.cc/q7DPwCz6/3.png)

### Obteniendo Lectura de Archivos Locales

A este punto ya estaba emocionado, pero eso no es suficiente para probar que se pueden obtener archivos con datos sensibles, entonces intenté el mismo proceso pero con algunos esquemas de URI como lo son file, ldap, gopher, ftp, ssh, pero ninguno dió resultado.

![https://i.postimg.cc/brk4qCL1/4.png](https://i.postimg.cc/brk4qCL1/4.png)

Estuve pensando como podría hacer un bypass a ese filtro y recordé un write-up mencionando un bypass usando una redirección con la cabezera Location en un archivo de PHP alojado en tu propio servidor.

![https://i.postimg.cc/DyKwLtVk/poc-code.png](https://i.postimg.cc/DyKwLtVk/poc-code.png)

Alojé el archivo de PHP con el código mostrado en la imagen anterior y se procedió a realizar el mismo proceso registrando un sitio web para monitorear.

![https://i.postimg.cc/Prb0c7Cj/5.png](https://i.postimg.cc/Prb0c7Cj/5.png)

Unos minutos después un correo electrónico llegó a la bandeja de entrada con un archivo HTML.

![https://i.postimg.cc/PrnBSHry/6.png](https://i.postimg.cc/PrnBSHry/6.png)

Y la respuesta fue...

![https://i.postimg.cc/mZHv3kRh/7.png](https://i.postimg.cc/mZHv3kRh/7.png)

Reporté la vulnerabilidad SSRF al soporte de DownNotifier y ellos arreglaron el fallo muy rápido.

Quiero agradecer al soporte de DownNotifier porque ellos fueron muy amables en nuestra comunicación y me permitieron publicar el presente write-up. También quiero agradecer al bug bounty hunter quien escribió el write-up en el cual utilizó la técnica de redirección con la cabezera Location.

- Write-up: [https://medium.com/@elberandre/1-000-ssrf-in-slack-7737935d3884](https://medium.com/@elberandre/1-000-ssrf-in-slack-7737935d3884)

{{< alert theme="info" dir="ltr" >}}
"No temo a los ordenadores; lo que temo es quedarme sin ellos". – Isaac Asimov
{{< /alert >}}