+++
author = "Aldo Moreno"
title = "SQL injection in password recovery form (babywinkel-info.nl)"
date = "2026-04-05"
description = "Bug Bounty report"
tags = [
    "Bug Bounty"
]
+++

During my bug bounty hunting journey across various self-hosted programs, I stumbled upon an SQL injection vulnerability in a password recovery form. The website is based in the Netherlands, so it was initially difficult to discern what was being clicked and displayed, but once the injection was confirmed, exploitation was straightforward.
<!--more-->
---

This bug bounty program is independent of platforms like H1 or Bugcrowd. I found it using Google dorks and quickly ran Burp Suite to capture all the traffic while browsing the web.

I navigated to the login page where I tested the fields but didn't find anything valid. Then I switched to the password recovery page. My first thought when I see an email field in password recovery is that it will most likely send a validation request to the database to confirm if the entered email exists. Therefore, I added a single quote to the end of the email to see if there was any unusual behavior.

{{< figure src="/images/inyeccion-de-sql-en-recuperacion-contrasena-babywinkel-info/1.png" alt="image" >}}

Luckily for me, when I sent the request with the quotation mark, the query broke on the backend and the server response was a 500 Internal Server Error. Adding a second quotation mark restored the response to normal, thus confirming a possible SQL injection.

{{< figure src="/images/inyeccion-de-sql-en-recuperacion-contrasena-babywinkel-info/2.png" alt="image" >}}

I realized that it wasn't throwing an SQL error but instead returning strange behavior, therefore it could be deduced that it was a blind injection. I started adding time-based payloads and with the following payload it was possible to confirm the full SQL injection:

{{< highlight sql >}}

'+AND+(SELECT+9950+FROM+(SELECT(SLEEP(10)))obCp)--+

{{< /highlight >}}

When sending the request concatenated with the previous payload, the server's response took 10 seconds, thus confirming the vulnerability.

{{< figure src="/images/inyeccion-de-sql-en-recuperacion-contrasena-babywinkel-info/3.png" alt="image" >}}

When I wrote and submitted the report, I was asked for a way to verify that I could extract information from the database, so I used SQLMAP to display the database name and its tables. The vulnerability was successfully verified and remediated.

**Bounty:** $50 USD

<div style="margin-bottom: 50px;"></div>

> "There is no reason for any individual to have a computer in their home."<br>
> — <cite>Ken Olson</cite>