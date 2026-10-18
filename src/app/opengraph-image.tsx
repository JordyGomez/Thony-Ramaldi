import { ImageResponse } from "next/og";

export const alt =
  "Thony Paulino · Ramaldi. Tu próximo espacio. Tu próxima historia.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#2B2B2B",
          color: "#FFFFFF",
          display: "flex",
          flexDirection: "column",
          padding: "72px",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", fontSize: 23, letterSpacing: 5 }}>
          THONY PAULINO / RAMALDI
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
          <span>Tu próximo espacio.</span>
          <span style={{ color: "#C9A96A" }}>Tu próxima historia.</span>
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
          <span>ASESORÍA INMOBILIARIA PERSONAL</span>
          <span>REPÚBLICA DOMINICANA</span>
        </div>
      </div>
    ),
    size,
  );
}
