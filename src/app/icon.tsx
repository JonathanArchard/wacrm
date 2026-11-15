import { ImageResponse } from "next/og";

// Green phone-and-chat mark matching the sidebar branding.
export const runtime = "edge";
export const size = { width: 32, height: 32 };
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
          background: "#25D366",
          borderRadius: 6,
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20.5 11.8a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.3-4.8A8.5 8.5 0 1 1 20.5 11.8Z" />
          <path d="M9 7.5 7.8 8.7c-.3.4-.1 1.7 1.5 3.6s3.5 3.1 4.8 3.3c.6.1 1.1-.1 1.4-.5l1-1.3-2.4-1.4-.8.8c-1.6-.7-2.7-1.8-3.4-3.3l.7-.8L9 7.5Z" fill="#ffffff" stroke="none" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
