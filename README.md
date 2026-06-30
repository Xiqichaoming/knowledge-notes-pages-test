# Notes Site

This directory contains the public Astro site for the notes vault.

## Local workflow

1. Write and revise source notes inside `../知识仓库`.
2. Update `../notes-publish/manifest/publish.config.json` when you want to add a new public note.
3. Run `npm run publish:notes` to export selected notes and assets.
4. Run `npm run dev` for local preview or `npm run build` for a production build.

## Directory roles

- `../知识仓库`: private Obsidian source vault
- `../notes-publish`: generated public markdown and copied assets
- `src/content/notes`: content consumed by Astro
- `public/assets`: copied images used by published notes

## Current publish behavior

- Copies only the notes listed in `publish.config.json`
- Converts `![[image.png]]` into normal Markdown image references
- Converts `[[Wiki Links]]` into site links when the target note is also published
- Records unresolved links and assets in `../notes-publish/manifest/last-run.json`

## Deployment

Push this directory to a GitHub repository and enable GitHub Pages with GitHub Actions.
The workflow file lives at `.github/workflows/deploy.yml`.

