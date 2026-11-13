FROM rust:1.100.0-slim-bookworm@sha256:7c7d4eb4d05b7781187a327809466cfddf29753f6defdc3d19a0e291951b7a37

RUN rustup component add rustfmt \
    && mkdir /work \
    && chown 10001:10001 /work

COPY --chmod=0555 run.sh /usr/local/bin/rust-lab-runner
ENV HOME=/tmp TMPDIR=/tmp CARGO_NET_OFFLINE=true
USER 10001:10001
WORKDIR /work

# This deadline survives a backend crash or a lost Docker client connection.
ENTRYPOINT ["timeout", "--signal=KILL", "30s", "/usr/local/bin/rust-lab-runner"]
