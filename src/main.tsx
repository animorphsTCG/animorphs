
import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { logAuthEvent } from "./utils/clerkAuth";

// Use the provided publishable key from Clerk
// Replace the test key with the production key
const CLERK_PUBLISHABLE_KEY = "pk_live_Z2xhZC10aXRtb3VzZS0zMi5jbGVyay5hY2NvdW50cy5kZXYk";

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

// Log initialization
console.log("Initializing Clerk with OAuth/OIDC capabilities");
logAuthEvent('initialization', { environment: import.meta.env.MODE });

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ClerkProvider 
      publishableKey={CLERK_PUBLISHABLE_KEY}
      appearance={{
        elements: {
          formButtonPrimary: "fantasy-button",
          card: "border-2 border-fantasy-primary bg-black/70"
        }
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
);
