import { ImageResponse } from "next/og";

export const alt = "Insight — Turn your documents into knowledge.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0c1e 0%, #131638 55%, #1d1650 100%)",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -160,
            left: 240,
            width: 560,
            height: 560,
            borderRadius: 9999,
            background:
              "radial-gradient(circle, rgba(99,102,241,0.35) 0%, rgba(99,102,241,0) 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -180,
            right: 200,
            width: 480,
            height: 480,
            borderRadius: 9999,
            background:
              "radial-gradient(circle, rgba(139,92,246,0.28) 0%, rgba(139,92,246,0) 70%)",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 22,
              background: "linear-gradient(135deg, #818cf8 0%, #6366f1 50%, #8b5cf6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="52" height="52" viewBox="0 0 24 24">
              <path
                fill="#ffffff"
                d="M12 2c.7 4.5 1.9 7.1 3.7 8.6C17.5 12.1 20.1 13 23 13.5v.1c-2.9.5-5.5 1.4-7.3 2.9C13.9 18 12.7 20.6 12 25h-.1c-.7-4.4-1.9-7-3.6-8.5-1.8-1.5-4.4-2.4-7.3-2.9v-.1c2.9-.5 5.5-1.4 7.3-2.9C10 9.1 11.2 6.5 11.9 2Z"
                transform="scale(0.92) translate(1, -0.5)"
              />
            </svg>
          </div>
          <div style={{ fontSize: 72, fontWeight: 700, color: "#f4f5ff" }}>
            Insight
          </div>
        </div>

        <div
          style={{
            marginTop: 36,
            fontSize: 40,
            color: "#aeb2d8",
            display: "flex",
          }}
        >
          Your documents. Your knowledge. One intelligent workspace.
        </div>

        <div
          style={{
            marginTop: 48,
            display: "flex",
            gap: 16,
          }}
        >
          {["Upload", "Index", "Ask"].map((step) => (
            <div
              key={step}
              style={{
                display: "flex",
                padding: "12px 32px",
                borderRadius: 9999,
                border: "1px solid rgba(129,140,248,0.4)",
                background: "rgba(99,102,241,0.12)",
                color: "#c3c6f0",
                fontSize: 26,
              }}
            >
              {step}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
