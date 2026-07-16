import axios, { type AxiosError } from 'axios';

interface ApiErrorPayload {
  message?: unknown;
  error?: unknown;
  detail?: unknown;
}

export class ApiClientError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly details?: unknown;
  readonly cause?: unknown;

  constructor(
    message: string,
    options: {
      status?: number;
      code?: string;
      details?: unknown;
      cause?: unknown;
    } = {}
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
    this.cause = options.cause;
  }
}

function normalizeBaseUrl(value: string | undefined): string {
  return value?.trim().replace(/\/+$/, '') ?? '';
}

function extractMessage(error: AxiosError<ApiErrorPayload>): string {
  const payload = error.response?.data;

  for (const candidate of [payload?.message, payload?.error, payload?.detail]) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate;
    }
  }

  if (!error.response) {
    return 'Unable to reach the Austrian Business Cycle Monitor API.';
  }

  return error.message || `API request failed with status ${error.response.status}.`;
}

const api = axios.create({
  baseURL: normalizeBaseUrl(import.meta.env.VITE_API_URL),
  timeout: 10_000,
  headers: {
    Accept: 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError<ApiErrorPayload>(error)) {
      return Promise.reject(
        new ApiClientError(extractMessage(error), {
          status: error.response?.status,
          code: error.code,
          details: error.response?.data,
          cause: error,
        })
      );
    }

    if (error instanceof Error) {
      return Promise.reject(error);
    }

    return Promise.reject(new ApiClientError('Unexpected API client error.', { cause: error }));
  }
);

export default api;
