import 'server-only';
import type { UserDTO } from '@/shared/contracts/auth.contract';
import { getRequestDb } from '@/server/db/request';
import { UnauthorizedError } from '@/server/http/errors';
import { hashSessionToken, readSessionToken } from '@/server/auth/session';
import * as sessionsRepo from '@/server/repositories/sessions.repo';
import * as usersRepo from '@/server/repositories/users.repo';
import type { UserRow } from '@/server/repositories/users.repo';

export function toUserDTO(row: UserRow): UserDTO {
  const dto: UserDTO = {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
  };
  if (row.phone) dto.phone = row.phone;
  return dto;
}

export type AuthContext = {
  user: UserDTO;
  userRow: UserRow;
  sessionId: string;
};

/**
 * Reads the session cookie, verifies a non-expired DB session, returns the user.
 * Throws UNAUTHORIZED when missing/invalid.
 */
export async function requireAuth(request: Request): Promise<AuthContext> {
  const token = readSessionToken(request);
  if (!token) throw new UnauthorizedError('Unauthorized');

  const sessionId = await hashSessionToken(token);
  const db = await getRequestDb();
  const session = await sessionsRepo.findValidSession(db, sessionId);
  if (!session) throw new UnauthorizedError('Unauthorized');

  const userRow = await usersRepo.findUserById(db, session.userId);
  if (!userRow) throw new UnauthorizedError('Unauthorized');

  return {
    user: toUserDTO(userRow),
    userRow,
    sessionId,
  };
}
