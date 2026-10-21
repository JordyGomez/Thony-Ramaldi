"use client";
export async function agendaGet<T>(
  query: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch("/api/admin/citas?" + query, {
    cache: "no-store",
    signal,
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "No se pudieron consultar los datos.");
  return data;
}
export async function agendaPost<T = Record<string, unknown>>(
  input: Record<string, unknown>,
): Promise<T> {
  const response = await fetch("/api/admin/citas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "No se pudo guardar el cambio.");
  return data;
}
