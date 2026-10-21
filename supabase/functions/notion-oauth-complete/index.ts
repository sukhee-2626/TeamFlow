import { exchangeAppUserOAuthCode } from "../_shared/appUserConnector.ts";
import { saveConnectionKeyForUser } from "../_shared/appUserConnections.ts";
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

    const { code } = await req.json().catch(() => ({}));
    if (typeof code !== "string" || !code) {
      return new Response(JSON.stringify({ error: "Missing OAuth code" }), { status: 400, headers: jsonHeaders() });
    }

    const { connectionAPIKey, connectorId } = await exchangeAppUserOAuthCode(GATEWAY_BASE_URL, code);
    if (connectorId !== CONNECTOR_ID) {
      return new Response(JSON.stringify({ error: "OAuth completion returned the wrong connector" }), {
        status: 400,
        headers: jsonHeaders(),
      });
    }
    await saveConnectionKeyForUser(user.id, connectorId, connectionAPIKey);
    return Response.json({ ok: true }, { headers: jsonHeaders() });
  } catch (err) {
    console.error("notion-oauth-complete failed:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Could not finish the Notion connection" }),
      { status: 500, headers: jsonHeaders() },
    );
  }
});
