import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS home-screen icon; same mark as icon.svg, rendered to PNG at build time
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0d0d0d",
        }}
      >
        <div
          style={{
            width: 140,
            height: 140,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "5px solid rgba(255,255,255,0.7)",
            color: "#ffffff",
            fontSize: 64,
            fontWeight: 700,
            letterSpacing: 4,
          }}
        >
          DS
        </div>
      </div>
    ),
    size,
  );
}
