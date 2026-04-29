"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function UnlockForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirect = searchParams.get("redirect") || "/";

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, redirect }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Wrong code.");
      }
      // Cookie is set by the server. Hard redirect so middleware re-evaluates.
      window.location.href = redirect;
    } catch (e: any) {
      setError(e.message || "Could not unlock.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} aria-label="Unlock form">
      <label
        htmlFor="access-code"
        style={{
          display: "block",
          fontSize: 11,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          fontWeight: 700,
          color: "#004F2D",
          marginBottom: 8,
        }}
      >
        Access code
      </label>
      <input
        id="access-code"
        type="password"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        autoComplete="off"
        autoFocus
        required
        aria-required="true"
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? "access-error" : undefined}
        style={{
          width: "100%",
          padding: "12px 16px",
          fontSize: 16,
          border: "2px solid #D9CFA9",
          borderRadius: 6,
          background: "#fff",
          color: "#1A1A1A",
          marginBottom: 16,
          fontFamily: "inherit",
        }}
      />

      {error && (
        <div
          id="access-error"
          role="alert"
          style={{
            background: "#fbe2e2",
            border: "2px solid #B3261E",
            color: "#7A1612",
            padding: "10px 14px",
            borderRadius: 6,
            marginBottom: 16,
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || !code}
        style={{
          width: "100%",
          padding: "12px 20px",
          fontSize: 13,
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          fontWeight: 700,
          background: submitting || !code ? "#B8C5B4" : "#006B3C",
          color: "#FFFBEF",
          border: "2px solid #004F2D",
          borderRadius: 6,
          cursor: submitting || !code ? "not-allowed" : "pointer",
          fontFamily: "inherit",
        }}
      >
        {submitting ? "Unlocking…" : "Unlock"}
      </button>
    </form>
  );
}
