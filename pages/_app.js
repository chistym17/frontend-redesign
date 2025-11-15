// pages/_app.js
import "../styles/globals.css";
import { AuthProvider } from "../lib/authContext";
import { AssistantProvider } from "../lib/assistantContext";
import { SidebarProvider } from "../lib/sidebarContext";
import * as React from "react";

// Wrap global fetch in the browser to auto-attach Authorization
function FetchAuthWrapper() {
  // Only run in browser
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const originalFetch = window.fetch;
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://176.9.16.194:5403/api";
    const apiOrigin = new URL(API_BASE).origin;

    window.fetch = async (input, init = {}) => {
      const url = typeof input === "string" ? input : input.url;
      const headers = new Headers(init.headers || {});
      // If call is going to our API, add Bearer if missing
      if (
        (url.startsWith(API_BASE)) ||
        (url.startsWith(apiOrigin) && url.includes("/api/"))
      ) {
        if (!headers.has("Authorization")) {
          try {
            const t = localStorage.getItem("access_token");
            if (t) headers.set("Authorization", `Bearer ${t}`);
          } catch {}
        }
      }
      return originalFetch(url, { ...init, headers });
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}

export default function App({ Component, pageProps }) {
  return (
    <SidebarProvider>
      <AuthProvider>
        <AssistantProvider>
          <FetchAuthWrapper />
          <Component {...pageProps} />
        </AssistantProvider>
      </AuthProvider>
    </SidebarProvider>
  );
}