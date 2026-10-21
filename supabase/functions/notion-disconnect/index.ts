import { disconnectAppUser } from "../_shared/appUserConnector.ts";
import { deleteConnectionForUser, getConnectionKeyForUser } from "../_shared/appUserConnections.ts";
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

    const connectionAPIKey = await getConnectionKeyForUser(user.id, CONNECTOR_ID);
    if (connectionAPIKey) {
      await disconnectAppUser({ gatewayBaseUrl: GATEWAY_BASE_URL, connectionAPIKey, connectorId: CONNECTOR_ID });
    }
    await deleteConnectionForUser(user.id, CONNECTOR_ID);
    return Response.json({ ok: true }, { headers: jsonHeaders() });
  } catch (err) {
    console.error("notion-disconnect failed:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Could not disconnect Notion" },
      { status: 500, headers: jsonHeaders() },
    );
  }
});
