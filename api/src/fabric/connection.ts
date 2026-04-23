import * as grpc from '@grpc/grpc-js';
import { connect, Gateway, Identity, Signer, signers } from '@hyperledger/fabric-gateway';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { config } from '../config';

let gateway: Gateway | null = null;
let grpcClient: grpc.Client | null = null;

function getMspCertsPath(): { certPath: string; keyPath: string; tlsCertPath: string } {
  const { cryptoPath, mspId } = config.fabric;

  // Map MSP ID to org domain
  const orgDomains: Record<string, string> = {
    ITDeptMSP: 'itdept.bsc.gov',
    RegistrarMSP: 'registrar.bsc.gov',
    MCAMSP: 'mca.bsc.gov',
  };
  const orgDomain = orgDomains[mspId] ?? 'itdept.bsc.gov';

  const certPath = path.join(
    cryptoPath,
    'peerOrganizations', orgDomain,
    'users', `Admin@${orgDomain}`,
    'msp', 'signcerts', `Admin@${orgDomain}-cert.pem`
  );

  const keyDir = path.join(
    cryptoPath,
    'peerOrganizations', orgDomain,
    'users', `Admin@${orgDomain}`,
    'msp', 'keystore'
  );
  const keyFiles = fs.readdirSync(keyDir);
  const keyPath = path.join(keyDir, keyFiles[0]);

  const tlsCertPath = path.join(
    cryptoPath,
    'peerOrganizations', orgDomain,
    'peers', `peer0.${orgDomain}`,
    'tls', 'ca.crt'
  );

  return { certPath, keyPath, tlsCertPath };
}

export async function connectToFabric(): Promise<Gateway> {
  if (gateway) return gateway;

  const { certPath, keyPath, tlsCertPath } = getMspCertsPath();

  const tlsRootCert = fs.readFileSync(tlsCertPath);
  const credentials = grpc.credentials.createSsl(tlsRootCert);

  grpcClient = new grpc.Client(config.fabric.peerEndpoint, credentials, {
    'grpc.ssl_target_name_override': `peer0.${config.fabric.peerEndpoint.split(':')[0]}`,
  });

  const certificate = fs.readFileSync(certPath).toString();
  const privateKeyPem = fs.readFileSync(keyPath).toString();
  const privateKey = crypto.createPrivateKey(privateKeyPem);

  const identity: Identity = { mspId: config.fabric.mspId, credentials: Buffer.from(certificate) };
  const signer: Signer = signers.newPrivateKeySigner(privateKey);

  gateway = connect({ client: grpcClient, identity, signer });
  console.log('Connected to Hyperledger Fabric');
  return gateway;
}

export async function getContract(chaincodeName: string) {
  const gw = await connectToFabric();
  const network = gw.getNetwork(config.fabric.channel);
  return network.getContract(chaincodeName);
}

export function disconnectFabric(): void {
  gateway?.close();
  grpcClient?.close();
  gateway = null;
  grpcClient = null;
}
