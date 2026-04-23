import bcrypt from 'bcrypt';
import { queryOne } from '../db/client';
import { signToken } from '../middleware/auth';
import type { AccessorRole } from '../models';

interface UserRow {
  subject_hash: string;
  name: string;
  password_hash: string;
  role: string;
}

export async function login(
  identifier: string,
  password: string,
  role: AccessorRole
): Promise<{ token: string; name: string; role: string }> {
  const user = await queryOne<UserRow>(
    'SELECT subject_hash, name, password_hash, role FROM bsc_users WHERE subject_hash = $1 AND role = $2',
    [identifier, role]
  );

  if (!user) throw new Error('INVALID_CREDENTIALS');

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) throw new Error('INVALID_CREDENTIALS');

  const token = signToken({ sub: user.subject_hash, role: user.role as AccessorRole, name: user.name });
  return { token, name: user.name, role: user.role };
}

export async function refreshToken(sub: string, role: AccessorRole, name: string): Promise<string> {
  return signToken({ sub, role, name });
}
