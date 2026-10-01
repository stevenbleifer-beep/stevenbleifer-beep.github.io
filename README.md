# stevenbleifer.com

Retro "coming soon" page, hosted on GitHub Pages. Static HTML/CSS, no build step.

- `index.html` + `retro.css` + `images/retro/` are the whole site; `404.html` catches old links.
- `CNAME` pins the custom domain. Don't delete it.
- `database.rules.json` / `firebase.json` / `.firebaserc` hold the `stevenbleifer-site` Firebase
  rules that bleifer.ai still uses. Keep them.
- The previous full site (resume, projects, Study Room, changelog workflow, ...) is archived on
  branch `archive/full-site-2026-10-01` and tag `full-site-2026-10-01`. To restore it:
  `git checkout main && git reset --hard full-site-2026-10-01 && git push --force-with-lease`
  (or `git revert` the coming-soon commits).
