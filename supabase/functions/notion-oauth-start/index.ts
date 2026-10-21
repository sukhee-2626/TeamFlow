import { authorizeAppUserOAuth } from "../_shared/appUserConnector.ts";
import { getConnectionKeyForUser } from "../_shared/appUserConnections.ts";
import { corsHeaders, jsonHeaders } from "../_shared/cors.ts";
import { getAuthedUser } from "../_shared/authUser.ts";

const GATEWAY_BASE_URL = "https://connector-gateway.lovable.dev";
const CONNECTOR_ID = "notion";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { user } = await getAuthedUser(req);
    if (!user) {
      return new Response(JSON.stringify({ error: "Sign in required" }), { status: 401, headers: jsonHeaders() });
    }

    const clientAPIKey = Deno.env.get("NOTION_APP_USER_CONNECTOR_CLIENT_API_KEY");
    if (!clientAPIKey) {
      return new Response(JSON.stringify({ error: "Notion connector is not configured" }), {
        status: 500,
        headers: jsonHeaders(),
      });
    }

    // The browser passes its live origin; the provider redirects back to the app.
    const { origin } = await req.json().catch(() => ({}));
    if (typeof origin !== "string" || !/^https?:\/\//i.test(origin)) {
      return new Response(JSON.stringify({ error: "Invalid origin" }), { status: 400, headers: jsonHeaders() });
    }
    const returnUrl = new URL("/oauth/notion/return", origin).toString();

    // Reconnect: pass the stored lovack_* so the gateway can confirm ownership.
    const connectionAPIKey = await getConnectionKeyForUser(user.id, CONNECTOR_ID);

    const { authorizationUrl } = await authorizeAppUserOAuth({
      gatewayBaseUrl: GATEWAY_BASE_URL,
      connectorId: CONNECTOR_ID,
      appUserId: user.id,
      clientAPIKey,
      returnUrl,
      connectionAPIKey: connectionAPIKey ?? undefined,
      // Notion has no OAuth scopes — each user picks which pages to share on
      // Notion's consent screen, so no credentialsConfiguration is sent.
    });
    return Response.json({ authorizationUrl }, { headers: jsonHeaders() });
  } catch (err) {
    console.error("notion-oauth-start failed:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Failed to start the Notion connection" }),
      { status: 500, headers: jsonHeaders() },
    );
  }
});
