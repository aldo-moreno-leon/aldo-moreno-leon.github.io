+++
author = "Aldo Moreno"
title = "SSRF: Reading local files from the Downnotifier server"
date = "2021-04-24"
description = "Write-up about a vulnerability on the Downnotifier website"
tags = [
    "Bug Bounty",
]
+++

Some time ago I wrote a [write-up](https://www.openbugbounty.org/blog/leonmugen/ssrf-reading-local-files-from-downnotifier-server/) about how I was able to read local files from a web service called **Downnotifier** by exploiting a vulnerability called Server-Side Request Forgery.
The write-up was originally written in English on the Openbugbounty platform, but I am now publishing it here.
<!--more-->
---

Hey guys, this is my first write-up and I'd like to share it with the bug bounty community. It's about an SSRF I found a while ago.

DownNotifier has a bug bounty program on Openbugbounty, so I decided to check out [https://www.downnotifier.com](https://www.downnotifier.com/). While browsing the website, I noticed a URL-type text input field, and the SSRF vulnerability immediately came to mind.

### Getting XSPA

The first step is to add http://127.0.0.1:22 to the "Website URL" text field.

Then select "When the site does not contain a specific text" and type some random text.

{{< figure src="/images/ssrf-leyendo-archivos-locales-del-servidor-de-downnotifier/1.png" alt="image" >}}

I submitted that request, and two emails arrived in my inbox a few minutes later. The first was to notify me that a website was being monitored, and the second email, contained within an HTML file, informed me that the website was down.

{{< figure src="/images/ssrf-leyendo-archivos-locales-del-servidor-de-downnotifier/2.png" alt="image" >}}

And what was the response?

{{< figure src="/images/ssrf-leyendo-archivos-locales-del-servidor-de-downnotifier/3.png" alt="image" >}}

### Getting local file read

At this point I was already excited, but that's not enough to prove that you can get files with sensitive data, so I tried the same process but with some URI schemes such as file, ldap, gopher, ftp, ssh, but none of them worked.

{{< figure src="/images/ssrf-leyendo-archivos-locales-del-servidor-de-downnotifier/4.png" alt="image" >}}

I was thinking about how I could bypass that filter and I remembered a write-up mentioning a bypass using a redirect with the Location header in a PHP file hosted on your own server.

{{< highlight php >}}

<?php
  header('Location: file:///etc/passwd');
  die();
?>

{{< /highlight >}}

I hosted the PHP file with the code shown above and proceeded to perform the same process by registering a website for monitoring.

{{< figure src="/images/ssrf-leyendo-archivos-locales-del-servidor-de-downnotifier/5.png" alt="image" >}}

A few minutes later an email arrived in the inbox with an HTML file.

{{< figure src="/images/ssrf-leyendo-archivos-locales-del-servidor-de-downnotifier/6.png" alt="image" >}}

And the response was...

{{< figure src="/images/ssrf-leyendo-archivos-locales-del-servidor-de-downnotifier/7.png" alt="image" >}}

I reported the SSRF vulnerability to DownNotifier support and they fixed the bug very quickly.

I want to thank the DownNotifier support team because they were very helpful in our communication and allowed me to publish this write-up. I also want to thank the bug bounty hunter who wrote the write-up, in which he used the redirection technique with the Location header.

- Write-up: [https://medium.com/@elberandre/1-000-ssrf-in-slack-7737935d3884](https://medium.com/@elberandre/1-000-ssrf-in-slack-7737935d3884)

<div style="margin-bottom: 50px;"></div>

> "I do not fear computers. I fear the lack of them."<br>
> — <cite>Isaac Asimov</cite>