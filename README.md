# irodori-kit

Shared foundation for Irodori Table.

## Contains

- Rust crates for connections, security, completion, generation, IO, proxying,
  secure storage, extensions, and the headless server.
- `packages/extension-sdk`, the TypeScript SDK and templates for extensions.

`irodori-table` consumes this repo by Git tag.

## Develop

```sh
cargo test --workspace
npm --prefix packages/extension-sdk run check
```

License: `MIT OR 0BSD`.
