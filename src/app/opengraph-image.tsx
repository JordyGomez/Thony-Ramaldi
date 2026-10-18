import { ImageResponse } from "next/og";
import { getSiteSettings } from "@/data/get-site-settings";

export const alt =
  "Thony Paulino · Ramaldi. Tu próximo espacio. Tu próxima historia.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const settings = await getSiteSettings();
  if (settings.assets.social) {
    const response = await fetch(settings.assets.social);
    if (!response.ok) throw new Error("No se pudo leer la imagen social.");
    const src = `data:${response.headers.get("content-type") || "image/jpeg"};base64,${Buffer.from(await response.arrayBuffer()).toString("base64")}`;
    // ImageResponse usa elementos img nativos para rasterizar, sin Next Image.
    return new ImageResponse(
      (
        <img
          src={src}
          alt=""
          width={1200}
          height={630}
          style={{ objectFit: "cover" }}
        />
      ),
      size,
    );
  }
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: settings.theme.background,
          color: settings.theme.text,
          display: "flex",
          flexDirection: "column",
          padding: "72px",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", fontSize: 23, letterSpacing: 5 }}>
          {settings.texts.name.toLocaleUpperCase("es")} /{" "}
          {settings.texts.company.toLocaleUpperCase("es")}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 77,
            letterSpacing: -2,
            fontWeight: 300,
            lineHeight: 1.08,
          }}
        >
          <span>{settings.texts.heroTitle}</span>
          <span style={{ color: settings.theme.accent }}>
            {settings.texts.heroEmphasis}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: "1px solid #555555",
            paddingTop: 25,
            fontSize: 19,
          }}
        >
          <span>{settings.texts.role.toLocaleUpperCase("es")}</span>
          <span>{settings.texts.location.toLocaleUpperCase("es")}</span>
        </div>
      </div>
    ),
    size,
  );
}
