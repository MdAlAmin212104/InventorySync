/* eslint-disable @typescript-eslint/no-explicit-any */
import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { authenticate } from "../../../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    throw new Response("Invalid callback parameters", { status: 400 });
  }

  // Verify state
  const storedState = (session as any).google_state;
  if (!storedState || storedState !== state) {
    throw new Response("Invalid state parameter", { status: 400 });
  }

  // Clear state
  delete (session as any).google_state;

  // Exchange code for tokens
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string;
  const APP_URL = process.env.SHOPIFY_APP_URL;

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: `${APP_URL}/auth/google/callback`,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Response("Failed to exchange code for tokens", { status: 500 });
  }

  const tokens = await tokenResponse.json();

  // Store tokens in session or database
  (session as any).google_access_token = tokens.access_token;
  (session as any).google_refresh_token = tokens.refresh_token;

  // Redirect back to the app
  return redirect("/app");
};
