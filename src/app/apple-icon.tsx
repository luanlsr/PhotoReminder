import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

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
          background: "linear-gradient(135deg, #24301f 0%, #6f7f3f 100%)",
          color: "#f6f7ef",
          fontSize: 48,
          fontWeight: 700,
          letterSpacing: "-0.08em",
          border: "8px solid #dfe6c7",
          borderRadius: 40,
          fontFamily: "serif",
        }}
      >
        L&L
      </div>
    ),
    size
  );
}
