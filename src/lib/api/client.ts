export async function apiFetch<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache",
    },
  });

  if (!response.ok) {
    throw new Error(`Request to ${path} failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}
