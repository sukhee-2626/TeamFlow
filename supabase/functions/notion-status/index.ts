import { appUserReconnectRequired, callAsAppUser } from "../_shared/appUserConnector.ts";
import { getConnectionKeyForUser } from "../_shared/appUserConnections.ts";
import { corsHeaders, jsonHeaders } from "../_shared/cors.ts";
import { getAuthedUser } from "../_shared/authUser.ts";

const GATEWAY_BASE_URL = "https://connector-gateway.lovable.dev";
const CONNECTOR_ID = "notion";
const NOTION_VERSION = "2025-09-03";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { user } = await getAuthedUser(req);
    if (!user) {
      return new Response(JSON.stringify({ error: "Sign in required" }), { status: 401, headers: jsonHeaders() });
    }

    const connectionAPIKey = await getConnectionKeyForUser(user.id, CONNECTOR_ID);
    if (!connectionAPIKey) {
      return Response.json({ connected: false }, { headers: jsonHeaders() });
    }

    const res = await callAsAppUser({
      gatewayBaseUrl: GATEWAY_BASE_URL,
      connectionAPIKey,
      connectorId: CONNECTOR_ID,
      path: "/v1/users/me",
      init: { headers: { "Notion-Version": NOTION_VERSION } },
    });

    if (await appUserReconnectRequired(res)) {
      return Response.json({ connected: false, reconnectRequired: true }, { headers: jsonHeaders() });
    }
    if (!res.ok) {
      const body = await res.text();
      console.error(`Notion status failed [${res.status}]: ${body.slice(0, 300)}`);
      return Response.json(
        { connected: false, error: `Notion check failed (${res.status})` },
        { headers: jsonHeaders() },
      );
    }

    const me = await res.json();
    return Response.json(
      { connected: true, workspace: typeof me.name === "string" && me.name ? me.name : "Notion workspace" },
      { headers: jsonHeaders() },
    );
  } catch (err) {
    console.error("notion-status failed:", err);
    return Response.json(
      { connected: false, error: err instanceof Error ? err.message : "Notion status check failed" },
      { headers: jsonHeaders() },
    );
  }
});
