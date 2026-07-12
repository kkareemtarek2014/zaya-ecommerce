import type { ApiResponse } from '@/shared/contracts/envelope';
import { AppError, type ApiErrorCode } from '@/shared/contracts/errors';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(path, {
    credentials: 'include',
    ...init,
    headers,
  });

  let body: ApiResponse<T>;
  try {
    body = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new AppError('INTERNAL', `Invalid response from ${path}`);
  }

  if (!body.ok) {
    throw new AppError(
      body.error.code as ApiErrorCode,
      body.error.message,
      body.error.details,
    );
  }
  return body.data;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  postForm: <T>(path: string, fd: FormData) =>
    request<T>(path, { method: 'POST', body: fd }),
};
