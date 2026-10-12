import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
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
          fontSize: 138,
          fontWeight: 700,
          letterSpacing: "-0.08em",
          border: "22px solid #dfe6c7",
          borderRadius: 112,
          fontFamily: "serif",
        }}
      >
        L&L
      </div>
    ),
    size
  );
}
