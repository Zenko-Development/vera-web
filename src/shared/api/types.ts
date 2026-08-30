export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNKNOWN';

export interface ApiErrorShape {
  error?: string;
  message?: string;
  statusCode?: number;
  code?: ApiErrorCode | string;
  details?: unknown;
  errors?: Record<string, string[]>;
  [k: string]: unknown;
}

export class ApiError extends Error {
  status: number;
  data?: ApiErrorShape;
  code?: string;

  constructor(message: string, status: number, data?: ApiErrorShape) {
    super(message);

    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.code = data?.code;

    // важно для instanceof
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  // ---------- TYPE GUARDS ----------
  isUnauthorized() {
    return this.status === 401;
  }

  isForbidden() {
    return this.status === 403;
  }

  isNotFound() {
    return this.status === 404;
  }

  isValidationError() {
    return this.status === 422 || this.status === 400;
  }

  // ---------- DATA HELPERS ----------
  getMessage(): string {
    return (
      this.data?.message ||
      this.data?.error ||
      this.message ||
      'Unknown error'
    );
  }

  getFieldErrors(): Record<string, string[]> | null {
    if (!this.data?.errors) return null;
    return this.data.errors;
  }

  // ---------- STATIC HELPERS ----------
  static isApiError(err: unknown): err is ApiError {
    return err instanceof ApiError;
  }
}
