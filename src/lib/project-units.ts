/** Unidades guardadas como líneas legibles en el campo de tipologías existente.
 * No crea inventario paralelo: el precio y las referencias públicas vienen de Supabase.
 */
export type ProjectUnit = {
  unit: string;
  building: string;
  area: number;
  priceMinorUnits: number;
  bedrooms: number;
  bathrooms: number;
  parking: number;
};
export const projectPrice = (minor: number) =>
  new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "USD",
    currencyDisplay: "code",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(minor / 100);
export function unitDescription(u: ProjectUnit) {
  return `${u.unit} · Edificio ${u.building} · ${u.area} m² · USD ${(u.priceMinorUnits / 100).toFixed(2)} · ${u.bedrooms} habitaciones · ${u.bathrooms} baños · ${u.parking} parqueos`;
}
export function projectUnits(
  lines: readonly string[] | undefined,
): ProjectUnit[] {
  if (!Array.isArray(lines) || !lines.length) return [];
  const result: ProjectUnit[] = [];
  for (const line of lines) {
    if (typeof line !== "string") return [];
    const m = line.match(
      /^([A-Z]\d{1,3}) · Edificio ([A-Z](?:-[A-Z])?) · (\d+(?:\.\d{1,2})?) m² · USD (\d+\.\d{2}) · (\d+) habitaciones · (\d+(?:\.5)?) baños · (\d+) parqueos$/,
    );
    if (!m) return [];
    const cents = Number(m[4].replace(".", ""));
    if (
      !Number.isSafeInteger(cents) ||
      cents <= 0 ||
      Number(m[3]) <= 0 ||
      Number(m[5]) > 20 ||
      Number(m[6]) > 20 ||
      Number(m[7]) > 20 ||
      result.some((u) => u.unit === m[1])
    )
      return [];
    result.push({
      unit: m[1],
      building: m[2],
      area: Number(m[3]),
      priceMinorUnits: cents,
      bedrooms: Number(m[5]),
      bathrooms: Number(m[6]),
      parking: Number(m[7]),
    });
  }
  return result;
}
