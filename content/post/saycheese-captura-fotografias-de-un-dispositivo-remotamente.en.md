+++
author = "Aldo Moreno"
title = "SayCheese: Capture photos remotely from a device"
date = "2021-05-01"
description = "A tool that is capable of capturing photographs using the camera remotely."
tags = [
    "Tools",
]
+++

### What is SayCheese?
SayCheese is a tool that remotely captures photos from a device, whether mobile devices or computers, achieving this through a link generated with ngrok and sent to the victim.

### How it works?
The tool uses Ngrok via the Port-Forwarding method to generate the malicious link, which is then sent to the victim. Once the victim opens the link in their browser, they will be asked for permission to use the camera. This is done using the function [MediaDevices.getUserMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) embedded in the JavaScript code of the index.php file.

By accepting the permissions, SayCheese begins to obtain the photographs and store them in the folder called images.

### Tool installation
Installing SayCheese is very simple, you just need to run the following commands in the terminal:

{{< highlight bash >}}

git clone https://github.com/Technicalheadquarter/saycheese
cd saycheese
chmod +x saycheese.sh
./saycheese.sh

{{< /highlight >}}

If the tool requires you to install httrack, which is a dependency for its operation, run the following:

{{< highlight bash >}}

apt-get install httrack

{{< /highlight >}}

## Using SayCheese

We run the tool and it displays a presentation with two options for creating the phishing email that will be shown to the victim. In this case, we choose the first option:

{{< figure src="/images/saycheese-captura-fotografias-de-un-dispositivo-remotamente/1.png" alt="image" >}}

Then it shows us which website we want to use for phishing; we will use the default Snapchat website. Just press enter to select it.

{{< figure src="/images/saycheese-captura-fotografias-de-un-dispositivo-remotamente/2.png" alt="image" >}}

Now ngrok starts generating the malicious link. If SayCheese doesn't detect ngrok, it automatically downloads it and generates the link, which must be opened in the victim's browser.

{{< figure src="/images/saycheese-captura-fotografias-de-un-dispositivo-remotamente/3.png" alt="image" >}}

The malicious link opens in the browser of the target device, whether a mobile phone or computer, and displays the Snapchat page and the permission request:

{{< figure src="/images/saycheese-captura-fotografias-de-un-dispositivo-remotamente/4.png" alt="image" >}}

When the victim opens the malicious link, SayCheese shows that the link has been opened, and once the permission request is accepted, the device's camera starts taking pictures and saving them in the images folder.

{{< figure src="/images/saycheese-captura-fotografias-de-un-dispositivo-remotamente/5.png" alt="image" >}}

And here are the photographs captured in the images folder:

{{< figure src="/images/saycheese-captura-fotografias-de-un-dispositivo-remotamente/6.png" alt="image" >}}

### Conclusion

SayCheese is an interesting tool to play around with. Of course, it's a bit difficult to trick the target due to camera access restrictions, but with creativity, nothing is impossible.

<div style="margin-bottom: 50px;"></div>

> "The hacker's task is not to destroy, but to use their knowledge in favor of freedom and social equality."<br>
> — <cite>Johan Manuel Mendez</cite>