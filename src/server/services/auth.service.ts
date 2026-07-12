import 'server-only';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  type UserDTO,
} from '@/shared/contracts/auth.contract';
import { hashPassword, verifyPassword } from '@/server/auth/password';
import { toUserDTO } from '@/server/auth/require-auth';
import {
  buildClearSessionCookie,
  buildSessionCookie,
  generateSessionToken,
  hashSessionToken,
  readSessionToken,
  sessionExpiryDate,
} from '@/server/auth/session';
import { getCloudflareEnv, getRequestDb } from '@/server/db/request';
import { ok } from '@/server/http/envelope';
import {
  ConflictError,
  UnauthorizedError,
  ValidationError,
} from '@/server/http/errors';
import * as sessionsRepo from '@/server/repositories/sessions.repo';
import * as usersRepo from '@/server/repositories/users.repo';

async function createSessionResponse(
  request: Request,
  userId: string,
  user: UserDTO,
  status = 200,
): Promise<Response> {
  const db = await getRequestDb();
  const rawToken = generateSessionToken();
  const sessionId = await hashSessionToken(rawToken);
  const expiresAt = sessionExpiryDate();
  await sessionsRepo.createSession(db, {
    id: sessionId,
    userId,
    expiresAt,
  });

  const response = ok(user, status);
  response.headers.append(
    'Set-Cookie',
    buildSessionCookie(request, rawToken, expiresAt),
  );
  return response;
}

export async function register(
  request: Request,
  body: unknown,
): Promise<Response> {
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError('Validation failed', parsed.error.flatten());
  }

  const { name, email, password } = parsed.data;
  const db = await getRequestDb();
  const existing = await usersRepo.findUserByEmail(db, email);
  if (existing) {
    throw new ConflictError('An account with this email already exists');
  }

  const env = await getCloudflareEnv();
  const passwordHash = await hashPassword(password, env.PASSWORD_PEPPER);
  const id = `user_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
  const row = await usersRepo.createUser(db, {
    id,
    email,
    name,
    passwordHash,
  });

  return createSessionResponse(request, row.id, toUserDTO(row), 201);
}

export async function login(
  request: Request,
  body: unknown,
): Promise<Response> {
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError('Validation failed', parsed.error.flatten());
  }

  const { email, password } = parsed.data;
  const db = await getRequestDb();
  const row = await usersRepo.findUserByEmail(db, email);
  const env = await getCloudflareEnv();

  const valid =
    row !== null &&
    (await verifyPassword(password, row.passwordHash, env.PASSWORD_PEPPER));

  if (!valid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  return createSessionResponse(request, row.id, toUserDTO(row));
}

export async function logout(request: Request): Promise<Response> {
  const token = readSessionToken(request);
  if (token) {
    const db = await getRequestDb();
    const sessionId = await hashSessionToken(token);
    await sessionsRepo.deleteSession(db, sessionId);
  }
  const response = ok({ ok: true as const });
  response.headers.append('Set-Cookie', buildClearSessionCookie(request));
  return response;
}

export async function me(request: Request): Promise<UserDTO> {
  const token = readSessionToken(request);
  if (!token) throw new UnauthorizedError('Unauthorized');

  const db = await getRequestDb();
  const sessionId = await hashSessionToken(token);
  const session = await sessionsRepo.findValidSession(db, sessionId);
  if (!session) throw new UnauthorizedError('Unauthorized');

  const row = await usersRepo.findUserById(db, session.userId);
  if (!row) throw new UnauthorizedError('Unauthorized');

  return toUserDTO(row);
}

export async function forgotPassword(body: unknown): Promise<{ ok: true }> {
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError('Validation failed', parsed.error.flatten());
  }
  // Always succeed — no user enumeration. Reset email is stubbed until a provider exists.
  const db = await getRequestDb();
  await usersRepo.findUserByEmail(db, parsed.data.email);
  return { ok: true };
}
