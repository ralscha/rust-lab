FROM rust:1.99.1-slim-bookworm@sha256:24707e70a4f1e23d9a7b25202ec43126d28a52294b96aad5c670df1fd1f1d400

RUN rustup component add rustfmt \
    && mkdir /work \
    && chown 10001:10001 /work

COPY --chmod=0555 run.sh /usr/local/bin/rust-lab-runner
ENV HOME=/tmp TMPDIR=/tmp CARGO_NET_OFFLINE=true
USER 10001:10001
WORKDIR /work

# This deadline survives a backend crash or a lost Docker client connection.
ENTRYPOINT ["timeout", "--signal=KILL", "30s", "/usr/local/bin/rust-lab-runner"]
