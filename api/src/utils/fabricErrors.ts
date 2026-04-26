// Returns true when the Fabric peer is simply offline — allows services to
// fall back to the PostgreSQL mirror instead of returning a 500 to the client.
export function isFabricUnavailable(err: unknown): boolean {
  const msg = (err as Error)?.message ?? '';
  return (
    msg.includes('UNAVAILABLE') ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('No connection established')
  );
}
