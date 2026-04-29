import { Suspense } from "react";
import UnlockForm from "./UnlockForm";

export const metadata = {
  title: "Unlock · Sovereign AI Learning Designer",
};

export default function UnlockPage() {
  return (
    <main
      role="main"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        background: "var(--cream, #FFFBEF)",
        fontFamily: "'Public Sans', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 480,
          width: "100%",
          padding: "2.5rem",
          background: "#FFF6DA",
          border: "2px solid #006B3C",
          borderRadius: 12,
        }}
      >
        <div
          aria-hidden
          style={{
            height: 4,
            marginBottom: 24,
            background:
              "linear-gradient(90deg, #006B3C 0 33%, #FED100 33% 66%, #1A1A1A 66% 100%)",
            borderRadius: 2,
          }}
        />
        <p
          style={{
            fontSize: 11,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: "#C99A00",
            margin: 0,
            fontWeight: 700,
          }}
        >
          Sovereign AI · Caribbean Educator Tool
        </p>
        <h1
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontWeight: 500,
            fontSize: 32,
            color: "#004F2D",
            marginTop: 12,
            marginBottom: 8,
            letterSpacing: "-0.01em",
          }}
        >
          Enter your access code
        </h1>
        <p style={{ color: "#3A3A3A", fontSize: 15, lineHeight: 1.5, margin: "0 0 24px" }}>
          This designer is protected for now. Ask Dr. Jowallah, or whoever shared the link with you, for the code.
        </p>

        <Suspense fallback={null}>
          <UnlockForm />
        </Suspense>

        <p
          style={{
            marginTop: 24,
            paddingTop: 16,
            fontSize: 12,
            color: "#3A3A3A",
            borderTop: "1px solid #D9CFA9",
            fontStyle: "italic",
          }}
        >
          Created by Dr. Rohan Jowallah, Ed.D. — CARE · CRAFT · ACRE · Sovereign AI.
        </p>
      </div>
    </main>
  );
}
