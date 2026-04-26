FROM node:20-slim

RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*

# circom v2 binary (Linux amd64)
RUN wget -q https://github.com/iden3/circom/releases/download/v2.1.9/circom-linux-amd64 \
    -O /usr/local/bin/circom && chmod +x /usr/local/bin/circom

# snarkjs CLI + circomlib (for include resolution during compilation)
WORKDIR /build
COPY package.json .
RUN npm install
RUN npm install -g snarkjs@0.7.3

COPY setup.sh /setup.sh
RUN chmod +x /setup.sh

ENTRYPOINT ["/bin/sh", "/setup.sh"]
