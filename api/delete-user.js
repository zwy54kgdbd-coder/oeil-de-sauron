import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  "https://sqjzunerpujqidvgepiw.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Username manquant" });
  }

  const { error } = await supabaseAdmin
    .from("users")
    .delete()
    .eq("username", username);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(200).json({ success: true });
}