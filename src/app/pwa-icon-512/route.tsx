import { ImageResponse } from "next/og";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #676435, #3f3d21)",
          color: "white",
          fontSize: 288,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        H
      </div>
    ),
    { width: 512, height: 512 },
  );
}
