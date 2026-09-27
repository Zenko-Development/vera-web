export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNKNOWN';

/** UUID values are transported by the backend as strings. */
export type UUID = string;

/** RFC 3339 timestamp returned by the backend. */
export type Rfc3339DateTime = string;

/** Standard successful response envelope used by the Vera API. */
export type ApiResponse<T> = {
  data: T;
};

/** Successful operations for which the handler does not write a body. */
export type EmptyResponse = void;

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
    const message = (
      this.data?.message ||
      this.data?.error ||
      this.message ||
      'Неизвестная ошибка'
    );

    if (!/[A-Za-z]/.test(message)) return message;

    const knownMessages: Record<string, string> = {
      'invalid request': 'Некорректный запрос',
      'invalid id': 'Некорректный идентификатор',
      'unauthorized': 'Необходима авторизация',
      'forbidden': 'Недостаточно прав для этого действия',
      'not found': 'Запись не найдена',
      'user not found': 'Пользователь не найден',
      'hospital not found': 'Больница не найдена',
      'hospital already exists': 'Такая больница уже существует',
      "name can't be empty": 'Название не может быть пустым',
      'permission not found': 'Право доступа не найдено',
      'no rows in result set': 'Запись не найдена',
      'internal server error': 'Внутренняя ошибка сервера',
      'network error': 'Ошибка сети',
      'no authentication token': 'Токен авторизации отсутствует',
    };
    const translated = knownMessages[message.trim().toLocaleLowerCase('en-US')];
    if (translated) return translated;
    if (this.status === 400 || this.status === 422) return 'Проверьте введённые данные';
    if (this.status === 401) return 'Необходима авторизация';
    if (this.status === 403) return 'Недостаточно прав для этого действия';
    if (this.status === 404) return 'Запись не найдена';
    if (this.status >= 500) return 'Сервер не смог выполнить запрос';
    return 'Не удалось выполнить запрос';
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
