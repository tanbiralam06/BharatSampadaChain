import path from 'path';

export const config = {
  port: parseInt(process.env.PORT ?? '4000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',

  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev_secret_change_in_production',
    expiresIn: '8h',
  },

  db: {
    connectionString: process.env.DATABASE_URL ?? 'postgresql://bsc:bsc_dev_password@localhost:5432/bsc_db',
    maxConnections: 10,
  },

  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
    ttl: 300,
  },

  fabric: {
    channel: process.env.FABRIC_CHANNEL ?? 'bsc-channel',
    mspId: process.env.FABRIC_MSP_ID ?? 'ITDeptMSP',
    peerEndpoint: process.env.FABRIC_PEER_ENDPOINT ?? 'localhost:7051',
    cryptoPath: process.env.FABRIC_CRYPTO_PATH ?? path.resolve(__dirname, '../../../blockchain/network/crypto-config'),
    chaincodes: {
      anomaly: 'anomaly',
      property: 'property',
      access: 'access',
      zkp: 'zkp',
    },
  },
} as const;
