# irodori-kit

Foundation crates for [Irodori Table](https://github.com/hjosugi/irodori-table) — the reusable Rust workspace the desktop app boots on. Split out of `irodori-table` so the app repo stays lean and app development is faster.

## Crates

| Crate | Purpose |
| --- | --- |
| `irodori-connection` | Connection profile types & transports (direct/socket/SSH/proxy) |
| `irodori-security` | Audit logging & event tracking |
| `irodori-core` | Error types, job runtime, audit events |
| `irodori-proxy` | Database proxy/tunnel wrapping |
| `irodori-secure-store` | Credential storage |
| `irodori-completion` | SQL completion engine |
| `irodori-generate` | SQL generation / planning / validation |
| `irodori-extension` | Extension SDK & connector experience model |
| `irodori-io` | Tabular import/export (CSV/TSV/JSON/JSONL/SQL/Parquet/Avro) |
| `irodori-server` | Headless HTTP data API |

## Packages

| Package | Purpose |
| --- | --- |
| `packages/extension-sdk` | TypeScript extension SDK package, manifest schema, extension-dev helper, and starter templates generated from `irodori-extension`. |

Consumed by `irodori-table` via git tag; for co-development use a local Cargo
`[patch]` / path dependency pointing at a sibling `../irodori-kit` checkout.

Dependency direction is one-way: `irodori-table` (app) → `irodori-kit` → the
domain libraries (`irodori-sql`, `irodori-knowledge`). Nothing here references the app.

License: MIT OR 0BSD.
