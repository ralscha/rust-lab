FROM rust:1.99.1-slim-bookworm@sha256:86234e857a413004348b471d11a4ebe1aa92d2eae2b6b143cac68fd1ac3c48be

RUN rustup component add rustfmt \
    && mkdir /work \
    && chown 10001:10001 /work

COPY --chmod=0555 run.sh /usr/local/bin/rust-lab-runner
ENV HOME=/tmp TMPDIR=/tmp CARGO_NET_OFFLINE=true
USER 10001:10001
WORKDIR /work

# This deadline survives a backend crash or a lost Docker client connection.
ENTRYPOINT ["timeout", "--signal=KILL", "30s", "/usr/local/bin/rust-lab-runner"]
