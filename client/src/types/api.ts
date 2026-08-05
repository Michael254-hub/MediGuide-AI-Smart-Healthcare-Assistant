export interface ApiErrorItem {
  message: string;
  [key: string]: unknown;
}

/** Mirrors the { success, data, message?, code?, errors? } envelope returned by the Express API. */
export interface ApiEnvelope<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  code?: string;
  errors?: ApiErrorItem[];
}
