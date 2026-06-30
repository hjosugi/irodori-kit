# AGENTS.md

## Scope

These instructions apply to `packages/extension-sdk` inside `irodori-kit`.

## Working Agreements

- Start by checking `git status --short` and preserve unrelated user changes.
- Keep project-authored code, templates, and examples under `MIT OR 0BSD`.
- Do not copy third-party implementations or assets into templates unless the
  license is explicit and compatible.
- Use `rg` or `rg --files` for searches.
- Keep SDK, manifest schema, templates, and local extension-dev tooling changes
  scoped to this package unless the Rust source contract in `irodori-extension`
  must change first.

## Repository Map

- `src/` contains the TypeScript SDK surface.
- `src/generated/irodori-extension-api.ts` is generated from the
  `irodori-extension` crate in this workspace.
- `extension.schema.json` is the manifest schema used by templates and
  extension manifests.
- `templates/` contains starter extensions.
- `bin/irodori-extension-dev.mjs` is the local development helper.
- `tools/validate-manifests.mjs` validates SDK templates and optional external
  manifests.
- `tools/typegen.mjs` regenerates the generated SDK API from the local
  `irodori-kit` workspace.

## Commands

- Install dependencies: `npm install`
- Build SDK: `npm run build`
- Typecheck SDK: `npm run typecheck`
- Validate manifests: `npm run validate`
- Regenerate generated API: `npm run typegen`
- Check generated API drift: `npm run typegen:check`
- Broad SDK check: `npm run check`

Set `IRODORI_KIT=/path/to/irodori-kit` only when running this package outside
the default kit checkout layout.
