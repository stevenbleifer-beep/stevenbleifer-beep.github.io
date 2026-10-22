# stevenbleifer.com

Personal site, hosted on GitHub Pages. Static HTML/CSS with a little JavaScript, no build step.

- `index.html` is the home page; its search box indexes the pages listed in the script at the
  bottom, so add new pages there.
- `claude-code.html` is the Projects page. Longer write-ups have their own pages (`vinyl.html`,
  `groovekeeper.html`, `displays.html`, `itunes-remote.html`, `local-ai.html`, ...).
- `study/` holds the study tools, including the CPA ISC Study Room in `study/isc/`.
- `style.css` is the one stylesheet for the main pages.
- `CNAME` pins the custom domain. Don't delete it.
- `database.rules.json` / `firebase.json` / `.firebaserc` hold the `stevenbleifer-site` Firebase
  rules that bleifer.ai still uses. Keep them.

## Automation

`.github/workflows/update-changelog.yml` runs on every push to `main` and daily at 08:17 UTC. It
rebuilds `changelog.html` from git history (`generate-changelog.py`) and refreshes
`goodreads-feed.json` and `letterboxd-feed.json`, which the Library page (`activity.html`) reads.
The feeds are fetched server side because browsers can't read those RSS feeds directly.

## Archived versions

- `archive/retro-coming-soon`: the retro 90s "coming soon" page that replaced the site from
  October 1 to October 22, 2026.
- `archive/full-site-2026-10-01` and tag `full-site-2026-10-01`: the full site as it was before
  the coming-soon page, which is what `main` was restored from.
