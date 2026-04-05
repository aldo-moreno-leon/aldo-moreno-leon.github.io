+++
author = "Aldo Moreno"
title = "Inyección de SQL en formulario de recuperación de contraseña (babywinkel-info.nl)"
date = "2026-04-05"
description = "Reporte de bug bounty."
tags = [
    "Bug Bounty"
]
+++

En mis andanzas haciendo bug bounty hunting en diferentes programas independientes, me encontré con una vulnerabilidad de inyección de SQL en un formulario de recuperación de contraseña. El sitio web es de Holanda, por lo tanto era un poco difícil saber que es lo que se estaba clickeando y mostrando pero una vez la inyección fue confirmada, la explotación fue fácil.
<!--more-->
---

Este programa de bug bounty es independiente de plataformas como H1 o Bugcrowd, lo encontré con Google dorks y rapidamente ejecuté Burp Suite para capturar todo el tráfico mientras navegaba por la web. 

Navegué al login en donde hice algunas pruebas con los campos pero no encontré algo válido. Después me cambié a la página de recuperación de contraseña, lo primero que pienso en un campo de correo en la recuperación de contraseña es que muy posiblemente se haga una solicitud de validación a la base de datos para confirmar si el correo ingresado existe. Por lo tanto, agregué una comilla simple al final del correo para ver si había algún comportamiento extraño.

{{< figure src="/images/inyeccion-de-sql-en-recuperacion-contrasena-babywinkel-info/1.png" alt="image" >}}

Para mi suerte, al enviar la solicitud con la comilla, la query rompió en el backend y la respuesta del servidor fue un error 500 Internal Server Error. Al agregar una segunda comilla, la respuesta volvía a la normalidad confirmando así una posible inyección de SQL.

{{< figure src="/images/inyeccion-de-sql-en-recuperacion-contrasena-babywinkel-info/2.png" alt="image" >}}

Me dí cuenta que no arroja un error de SQL sino que regresa un comportamiento extraño, por lo tanto se puede deducir que estaba ante una inyección a ciegas. Comencé a agregar payloads basados en tiempo y con el siguiente payload fue posible confirmar la inyección total de SQL:
{{< highlight sql >}}

'+AND+(SELECT+9950+FROM+(SELECT(SLEEP(10)))obCp)--+

{{< /highlight >}}

Al enviar la solicitud concatenada con el previo payload, la respuesta del servidor demoró 10 segundos en llegar confirmando asi la vulnerabilidad.

{{< figure src="/images/inyeccion-de-sql-en-recuperacion-contrasena-babywinkel-info/3.png" alt="image" >}}

Cuando armé el reporte y lo envié, me pidieron una manera de comprobar que podía extraer información de la base de datos, así que utilicé SQLMAP para mostrar el nombre de la base de datos asi como de sus tablas. La vulnerabilidad fue aprobada y remediada exitosamente.

**Bounty:** $50 USD

<div style="margin-bottom: 50px;"></div>

> "No hay ninguna razón para que un individuo tenga un ordenador en su casa."<br>
> — <cite>Ken Olson</cite>