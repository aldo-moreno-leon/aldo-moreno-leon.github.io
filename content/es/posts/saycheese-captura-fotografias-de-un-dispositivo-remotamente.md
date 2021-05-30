---
title: "SayCheese: captura fotografías de un dispositivo remotamente"
date: 2021-05-01
description: Una herramienta que es capaz de capturar fotografías utilizando la cámara de manera remota.
draft: false
categories:
- Tools
- Hacking
tags:
- phishing
author: "C0wb0y" # author name
authorImageUrl: "https://raw.githubusercontent.com/aldo-moreno-leon/aldo-moreno-leon.github.io/main/public/images/post-images/desert-bunker/justice.jpg" # your image url. We use `authorImageUrl` first. If not set, we use `authorImage`.
authorDesc: "Me apasiona el hacking pero soy un eterno n00b. Soy una persona extremadamente curiosa. Leer libros, ver películas y series, son solo algunos de tantos hobbies que disfruto hacer." # author description
socialOptions: # override params.toml file socialOptions
  twitter: "https://twitter.com/_c0wb0y_"
  github: "https://github.com/aldo-moreno-leon"
---

## ¿Qué es SayCheese?

SayCheese es una herramienta que captura fotografías de un dispositivo de manera remota, ya sean dispositivos móviles u ordenadores, logrando el cometido por un link generado con ngrok y enviado a la víctima.

## ¿Como funciona?

La herramienta utiliza Ngrok mediante el método Port-Forwarding para generar el link malicioso el cual se envía a la víctima. Una vez la víctima abre el link en su navegador, se le solicitará permisos para utilizar la cámara para lo cual utiliza la función [MediaDevices.getUserMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) incorporada en el código javascript del archivo index.php.

Al aceptar los permisos, SayCheese comienza a obtener las fotografías y almacenarlas en la carpeta llamada images.

## Instalación

Para instalar SayCheese es muy simple, tan solo tienes que ejecutar en la terminal los siguientes comandos:

```bash
git clone https://github.com/Technicalheadquarter/saycheese
cd saycheese
chmod +x saycheese.sh
./saycheese.sh
```

En el caso de que la herramienta solicite instalar httrack la cual es una dependencia para su funcionamiento, se ejecuta lo siguiente:

```bash
apt-get install httrack
```

## Usando SayCheese

Ejecutamos la herramienta y nos muestra la presentación con dos opciones para crear el phishing que se mostrará a la víctima. En este caso elegimos la primera opción:

{{< img src="https://raw.githubusercontent.com/aldo-moreno-leon/aldo-moreno-leon.github.io/main/public/images/post-images/saycheese-captura-fotografias-de-un-dispositivo-remotamente/1.png" caption="1.- Portada de SayCheese y las opciones de phishing." position="center" >}}

Luego nos muestra que sitio web queremos utilizar como phishing, nosotros utilizaremos el que está por default de Snapchat, tan solo dar enter se selecciona:

{{< img src="https://raw.githubusercontent.com/aldo-moreno-leon/aldo-moreno-leon.github.io/main/public/images/post-images/saycheese-captura-fotografias-de-un-dispositivo-remotamente/2.png" caption="2.- Selección de website para phishing." position="center" >}}

Ahora ngrok comienza a generar el link malicioso, si SayCheese no detecta ngrok, lo descarga automáticamente y se genera el link el cual debe ser abierto en el navegador de la víctima:

{{< img src="https://raw.githubusercontent.com/aldo-moreno-leon/aldo-moreno-leon.github.io/main/public/images/post-images/saycheese-captura-fotografias-de-un-dispositivo-remotamente/3.png" caption="3.- Ngrok genera el link malicioso." position="center" >}}

En el navegador del dispositivo objetivo, ya sea un móvil u ordenador, se abre el link malicioso y se muestra la página de snapchat y la solicitud de permisos:

{{< img src="https://raw.githubusercontent.com/aldo-moreno-leon/aldo-moreno-leon.github.io/main/public/images/post-images/saycheese-captura-fotografias-de-un-dispositivo-remotamente/4.png" caption="4.- Página de snapchat y solicitud de permiso." position="center" >}}

Al momento de que la víctima abra el link malicioso, SayCheese te muestra que el link ha sido abierto y una vez que se acepta la solicitud de permiso, la cámara del dispositivo comienza a tomar fotografías y guardarlas en la carpeta images:

{{< img src="https://raw.githubusercontent.com/aldo-moreno-leon/aldo-moreno-leon.github.io/main/public/images/post-images/saycheese-captura-fotografias-de-un-dispositivo-remotamente/5.png" caption="5.- Víctima abre el link y acepta el permiso." position="center" >}}

Y aquí se muestran las fotografías capturadas en la carpeta images:

{{< img src="https://raw.githubusercontent.com/aldo-moreno-leon/aldo-moreno-leon.github.io/main/public/images/post-images/saycheese-captura-fotografias-de-un-dispositivo-remotamente/6.png" caption="6.- Fotografías almacenadas en images." position="center" >}}

## Conclusión

SayCheese es una interesante herramienta con la cual jugar. Claro está que es un poco difícil que el objetivo caiga en la trampa debido al permiso de uso de la cámara, pero con creatividad nada es imposible. ;)

{{< alert theme="info" dir="ltr" >}}
"La tarea del hacker no es destruir, sino utilizar sus conocimientos en favor de la libertad y la igualdad social". – Johan Manuel Mendez
{{< /alert >}}