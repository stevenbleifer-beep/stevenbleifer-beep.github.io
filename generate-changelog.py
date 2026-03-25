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
    rows += (
        f'        <tr>'
        f'<td style="white-space: nowrap; padding: 4px 12px 4px 4px; color: #00ffff;">{html.escape(date)}</td>'
        f'<td style="padding: 4px;">{html.escape(msg)}</td>'
        f'</tr>\n'
    )

page = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>~* Changelog *~ Steven Bleifer's Homepage</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>

<div class="main-container">

    <div class="navbar">
        <img src="https://cyber.dabamos.de/88x31/netscape.gif" alt="">
        <a href="index.html">Home</a> <span class="sep">|</span>
        <a href="activity.html">What I'm Into</a> <span class="sep">|</span>
        <a href="resume.html">Resume</a> <span class="sep">|</span>
        <a href="links.html">Links</a> <span class="sep">|</span>
        <a href="blog.html">Blog</a> <span class="sep">|</span>
        <a href="contact.html">Contact</a> <span class="sep">|</span>
        <a href="bookmarks.html">Bookmarks</a> <span class="sep">|</span>
        <a href="awards.html">Awards</a>
        <img src="https://cyber.dabamos.de/88x31/netscape.gif" alt="">
    </div>

    <div class="content-panel" style="text-align: center;">
        <h1>
            <img src="gifs/new.gif" alt="NEW!" style="height: 30px; vertical-align: middle;">
            Site Changelog
            <img src="gifs/new.gif" alt="NEW!" style="height: 30px; vertical-align: middle;">
        </h1>
        <p>Every update to this site, logged for posterity!</p>
        <div class="divider">* ~ * ~ * ~ * ~ * ~ * ~ *</div>
    </div>

    <div class="content-panel">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.95em;">
        <tr style="border-bottom: 1px solid #444;">
            <th style="text-align: left; padding: 6px 12px 6px 4px; color: #ffff00;">Date</th>
            <th style="text-align: left; padding: 6px; color: #ffff00;">Change</th>
        </tr>
{rows}        </table>
    </div>

    <div class="footer">
        <img src="gifs/star.gif" alt="*" style="height: 14px; vertical-align: middle;">
        <p><a href="index.html">&lt;&lt; Back to Homepage</a></p>
        <p>&copy; 2026 Steven Bleifer</p>
        <img src="gifs/star.gif" alt="*" style="height: 14px; vertical-align: middle;">
    </div>

</div>

<!-- CURSOR SPARKLE TRAIL -->
<script>
(function() {{
    var sparkles = ['*', '+', '.', '*'];
    var colors = ['#ffff00', '#00ffff', '#ff00ff', '#00ff00', '#ff8800', '#ffffff'];
    document.addEventListener('mousemove', function(e) {{
        var s = document.createElement('div');
        s.className = 'cursor-sparkle';
        s.textContent = sparkles[Math.floor(Math.random() * sparkles.length)];
        s.style.left = (e.clientX + (Math.random() * 20 - 10)) + 'px';
        s.style.top = (e.clientY + (Math.random() * 20 - 10)) + 'px';
        s.style.color = colors[Math.floor(Math.random() * colors.length)];
        s.style.fontSize = (10 + Math.random() * 14) + 'px';
        document.body.appendChild(s);
        setTimeout(function() {{ s.remove(); }}, 600);
    }});
}})();
</script>

</body>
</html>'''

with open('changelog.html', 'w') as f:
    f.write(page)

print("changelog.html regenerated")
