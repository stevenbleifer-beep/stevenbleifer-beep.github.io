#!/usr/bin/env python3
"""Regenerate changelog.html from git history."""
import subprocess, html

result = subprocess.run(
    ['git', 'log', '--pretty=format:%ad|%s', '--date=format:%B %d, %Y'],
    capture_output=True, text=True
)

rows = ""
for line in result.stdout.strip().split('\n'):
    date, msg = line.split('|', 1)
    if '[skip ci]' in msg:
        continue
    rows += (
        f'                <tr>'
        f'<td class="date">{html.escape(date)}</td>'
        f'<td>{html.escape(msg)}</td>'
        f'</tr>\n'
    )

page = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Changelog — Steven Bleifer</title>
    <meta name="description" content="Site changelog, generated from git history.">
    <meta name="theme-color" content="#fbfbfd">
    <link rel="stylesheet" href="style.css">
</head>
<body>

<header class="topbar">
    <div class="topbar-inner">
        <a href="index.html" class="brand">Steven Bleifer</a>
        <button class="nav-toggle" aria-label="Menu" onclick="document.getElementById('site-nav').classList.toggle('open')">☰</button>
        <nav class="nav" id="site-nav">
            <a href="index.html">Home</a>
            <a href="resume.html">Resume</a>
            <a href="blog.html">Writing</a>
            <a href="activity.html">Library</a>
            <a href="bookmarks.html">Bookmarks</a>
            <a href="contact.html">Contact</a>
            <a href="study/">Study</a>
        </nav>
    </div>
</header>

<main>
    <div class="container">

        <section class="hero">
            <p class="eyebrow">Changelog</p>
            <h1>Site changelog.</h1>
            <p class="lead">Generated from git history. Automated daily updates are filtered out.</p>
        </section>

        <section class="section">
            <table class="simple-table">
                <thead>
                    <tr><th>Date</th><th>Change</th></tr>
                </thead>
                <tbody>
{rows}                </tbody>
            </table>
        </section>

        <footer class="footer">
            <p class="mb-0">© 2026 Steven Bleifer</p>
            <div class="footer-links">
                <a href="index.html">Home</a>
                <a href="contact.html">Contact</a>
            </div>
        </footer>

    </div>
</main>

</body>
</html>
'''

with open('changelog.html', 'w') as f:
    f.write(page)

print("changelog.html regenerated")
