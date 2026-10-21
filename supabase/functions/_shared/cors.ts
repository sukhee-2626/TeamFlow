export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export function jsonHeaders() {
  return { ...corsHeaders, "Content-Type": "application/json" };
}
