# Irodori Extension SDK

TypeScript SDK, manifest schema, and starter templates for Irodori Table
extensions.

## Develop

```sh
npm install
npm run check
npm run build
```

Run a template locally:

```sh
node bin/irodori-extension-dev.mjs templates/typescript-basic --once
```

Generated API types come from the Rust `irodori-extension` crate:

```sh
npm run typegen
```

License: `MIT OR 0BSD`.
