/** Thrown when the server responds with 401 Unauthorized. */
export class UnauthorizedError extends Error {
  constructor() {
    super("No autorizado");
    this.name = "UnauthorizedError";
  }
}

/**
 * Checks a fetch Response. If the response is not OK, attempts to parse
 * the JSON error payload and throws an Error. Otherwise, resolves to the response JSON.
 * Throws UnauthorizedError specifically for 401 responses so callers can handle
 * session expiry globally.
 */
export async function handleResponse<T = unknown>(response: Response): Promise<T> {
  if (!response.ok) {
    if (response.status === 401) throw new UnauthorizedError();
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}
