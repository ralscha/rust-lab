#!/bin/sh
set -eu

# Distinguish Docker startup failures from a user's program exiting with 125-127.
printf 'rust-lab:runner-started\n' >&2

operation="${1:-}"
optimization="${2:-debug}"

case "$operation" in
    version) exec rustc --version --verbose ;;
    run|test|format) ;;
    *) echo "Unsupported runner operation." >&2; exit 64 ;;
esac

umask 077
cat > /work/main.rs

if [ "$operation" = format ]; then
    exec rustfmt --edition 2024 --emit stdout < /work/main.rs
fi

case "$optimization" in
    debug) set -- -C opt-level=0 -C debuginfo=0 ;;
    release) set -- -C opt-level=3 ;;
    *) echo "Unsupported optimization." >&2; exit 64 ;;
esac
if [ "$operation" = test ]; then
    set -- "$@" --test
fi

rustc --crate-name playground --edition 2024 --color never "$@" /work/main.rs -o /work/program
exec /work/program < /dev/null
