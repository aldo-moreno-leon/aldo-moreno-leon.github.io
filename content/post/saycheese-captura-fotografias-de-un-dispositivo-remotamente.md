+++
author = "Aldo Moreno"
title = "SayCheese: captura fotografías de un dispositivo remotamente"
date = "2021-05-01"
description = "Una herramienta que es capaz de capturar fotografías utilizando la cámara de manera remota."
tags = [
    "Herramientas",
]
+++

### ¿Qué es SayCheese?

SayCheese es una herramienta que captura fotografías de un dispositivo de manera remota, ya sean dispositivos móviles u ordenadores, logrando el cometido por un link generado con ngrok y enviado a la víctima.

### ¿Como funciona?

La herramienta utiliza Ngrok mediante el método Port-Forwarding para generar el link malicioso el cual se envía a la víctima. Una vez la víctima abre el link en su navegador, se le solicitará permisos para utilizar la cámara para lo cual utiliza la función [MediaDevices.getUserMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) incorporada en el código javascript del archivo index.php.

Al aceptar los permisos, SayCheese comienza a obtener las fotografías y almacenarlas en la carpeta llamada images.

### Instalación

Para instalar SayCheese es muy simple, tan solo tienes que ejecutar en la terminal los siguientes comandos:

{{< highlight bash >}}

git clone https://github.com/Technicalheadquarter/saycheese
cd saycheese
chmod +x saycheese.sh
./saycheese.sh

{{< /highlight >}}

En el caso de que la herramienta solicite instalar httrack la cual es una dependencia para su funcionamiento, se ejecuta lo siguiente:

{{< highlight bash >}}

apt-get install httrack

{{< /highlight >}}

## Usando SayCheese

Ejecutamos la herramienta y nos muestra la presentación con dos opciones para crear el phishing que se mostrará a la víctima. En este caso elegimos la primera opción:

{{< figure src="/images/saycheese-captura-fotografias-de-un-dispositivo-remotamente/1.png" alt="image" >}}

Luego nos muestra que sitio web queremos utilizar como phishing, nosotros utilizaremos el que está por default de Snapchat, tan solo dar enter se selecciona:

{{< figure src="/images/saycheese-captura-fotografias-de-un-dispositivo-remotamente/2.png" alt="image" >}}

Ahora ngrok comienza a generar el link malicioso, si SayCheese no detecta ngrok, lo descarga automáticamente y se genera el link el cual debe ser abierto en el navegador de la víctima:

{{< figure src="/images/saycheese-captura-fotografias-de-un-dispositivo-remotamente/3.png" alt="image" >}}

En el navegador del dispositivo objetivo, ya sea un móvil u ordenador, se abre el link malicioso y se muestra la página de snapchat y la solicitud de permisos:

{{< figure src="/images/saycheese-captura-fotografias-de-un-dispositivo-remotamente/4.png" alt="image" >}}

Al momento de que la víctima abra el link malicioso, SayCheese te muestra que el link ha sido abierto y una vez que se acepta la solicitud de permiso, la cámara del dispositivo comienza a tomar fotografías y guardarlas en la carpeta images:

{{< figure src="/images/saycheese-captura-fotografias-de-un-dispositivo-remotamente/5.png" alt="image" >}}

Y aquí se muestran las fotografías capturadas en la carpeta images:

{{< figure src="/images/saycheese-captura-fotografias-de-un-dispositivo-remotamente/6.png" alt="image" >}}

### Conclusión

SayCheese es una interesante herramienta con la cual jugar. Claro está que es un poco difícil que el objetivo caiga en la trampa debido al permiso de uso de la cámara, pero con creatividad nada es imposible. ;)

<div style="margin-bottom: 50px;"></div>

> "La tarea del hacker no es destruir, sino utilizar sus conocimientos en favor de la libertad y la igualdad social."<br>
> — <cite>Johan Manuel Mendez</cite>