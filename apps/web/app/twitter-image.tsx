import { siteConfig } from "@/lib/config";
import { ImageResponse } from "@vercel/og";

export const runtime = "edge";

export const alt = "tambo - An AI powered Interface in a few lines of code.";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F2F8F6",
          backgroundImage: "linear-gradient(to bottom right, #F2F8F6, #FFEBF5)",
          fontFamily: "Inter, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background SVG elements */}
        <img
          src={`${siteConfig.url}/assets/landing/drawings/OCTO-TRANSPARENT-1.svg`}
          alt=""
          style={{
            position: "absolute",
            top: "10%",
            left: "5%",
            width: "150px",
            opacity: 0.2,
            transform: "rotate(-15deg)",
          }}
        />
        <img
          src={`${siteConfig.url}/assets/landing/drawings/OCTO-TRANSPARENT-2.svg`}
          alt=""
          style={{
            position: "absolute",
            bottom: "10%",
            right: "5%",
            width: "150px",
            opacity: 0.2,
            transform: "rotate(10deg)",
          }}
        />
        <img
          src={`${siteConfig.url}/assets/landing/drawings/OCTO-TRANSPARENT-3.svg`}
          alt=""
          style={{
            position: "absolute",
            bottom: "15%",
            left: "10%",
            width: "120px",
            opacity: 0.2,
            transform: "rotate(5deg)",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px",
            textAlign: "center",
            maxWidth: "900px",
            zIndex: 10,
          }}
        >
          {/* Logo */}
          <img
            src={`${siteConfig.url}/logo/lockup/Tambo-Lockup.svg`}
            alt="Tambo Logo"
            style={{ height: "80px", marginBottom: "40px" }}
          />

          {/* Main heading */}
          <h1
            style={{
              fontSize: 48,
              fontWeight: "bold",
              margin: "0 0 20px",
              color: "#111",
              textAlign: "center",
              lineHeight: 1.2,
            }}
          >
            An AI powered Interface in a few lines of code.
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: 30,
              margin: "0 0 30px",
              color: "#444",
              textAlign: "center",
              lineHeight: 1.4,
            }}
          >
            Bring AI intelligence to your React stack.
          </p>

          {/* Decorative element */}
          <div
            style={{
              width: "100px",
              height: "4px",
              background: "linear-gradient(90deg, #5C94F7, #FF6B81)",
              borderRadius: "2px",
              margin: "20px 0",
            }}
          />
        </div>

        {/* Footer with watermark */}
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            right: "40px",
            fontSize: "16px",
            color: "#666",
          }}
        >
          tambo.ai
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Inter",
          data: await fetch(
            new URL(
              "https://fonts.gstatic.com/s/inter/v12/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.ttf",
            ),
          ).then(async (res) => await res.arrayBuffer()),
          weight: 400,
          style: "normal",
        },
        {
          name: "Inter",
          data: await fetch(
            new URL(
              "https://fonts.gstatic.com/s/inter/v12/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa0XL7.ttf",
            ),
          ).then(async (res) => await res.arrayBuffer()),
          weight: 700,
          style: "normal",
        },
      ],
    },
  );
}
