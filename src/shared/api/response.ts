import type { ApiResponse } from "./types";

export function unwrapData<T>(request: Promise<ApiResponse<T>>): Promise<T> {
  return request.then((response) => response.data);
}

export function pathSegment(value: string): string {
  return encodeURIComponent(value);
}
