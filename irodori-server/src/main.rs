//! Standalone runner for the local data API.
//!
//! Configured via environment variables:
//! - `IRODORI_SERVER_ADDR`     bind address (default `127.0.0.1:8787`)
//! - `IRODORI_SERVER_SQLITE`   SQLite path to serve (`:memory:` or a file path)
//! - `IRODORI_SERVER_TOKEN`    bearer token granting read+write; unset = open read-only mode (localhost/dev)
//! - `IRODORI_SERVER_WRITABLE` `1`/`true` to allow writes against the source

use std::net::SocketAddr;
use std::sync::Arc;

use irodori_server::auth::{Authenticator, Scope, Token};
use irodori_server::{serve, ApiServer, Registry, SqliteDataSource};
use miette::{Context, IntoDiagnostic};
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() -> miette::Result<()> {
    let _guard = init_tracing();
    run().await
}

async fn run() -> miette::Result<()> {
    let addr: SocketAddr = std::env::var("IRODORI_SERVER_ADDR")
        .unwrap_or_else(|_| "127.0.0.1:8787".to_string())
        .parse()
        .into_diagnostic()
        .wrap_err("invalid IRODORI_SERVER_ADDR")?;
    let sqlite_path =
        std::env::var("IRODORI_SERVER_SQLITE").unwrap_or_else(|_| ":memory:".to_string());
    let writable = matches!(
        std::env::var("IRODORI_SERVER_WRITABLE").as_deref(),
        Ok("1") | Ok("true") | Ok("TRUE")
    );

    let source = SqliteDataSource::open(&sqlite_path, !writable)
        .into_diagnostic()
        .wrap_err_with(|| format!("failed to open SQLite source at {sqlite_path}"))?;
    let registry = Registry::new().with("default", Arc::new(source));

    let auth = match std::env::var("IRODORI_SERVER_TOKEN") {
        Ok(token) if !token.trim().is_empty() => Authenticator::new(vec![Token::new(
            "default",
            token,
            [Scope::Read, Scope::Write],
        )]),
        _ => Authenticator::default(), // open, read-only
    };

    let server = Arc::new(ApiServer::new(registry, auth));
    serve(addr, server)
        .await
        .into_diagnostic()
        .wrap_err("irodori-server failed")?;
    Ok(())
}

fn init_tracing() -> tracing_appender::non_blocking::WorkerGuard {
    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("irodori_server=info,irodori=info,warn"));
    let (writer, guard) = tracing_appender::non_blocking(std::io::stderr());
    tracing_subscriber::fmt()
        .with_env_filter(filter)
        .with_writer(writer)
        .with_target(true)
        .json()
        .init();
    guard
}
