/**
 * Checks a fetch Response. If the response is not OK, attempts to parse
 * the JSON error payload and throws an Error. Otherwise, resolves to the response JSON.
 */
export async function handleResponse<T = unknown>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}
