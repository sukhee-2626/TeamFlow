import { createClient } from "npm:@supabase/supabase-js@2";

// Verifies the caller's JWT and returns { supabase, user } so edge functions
// always derive identity from the auth provider, never from the request body.
export async function getAuthedUser(req: Request) {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization")! } } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}
