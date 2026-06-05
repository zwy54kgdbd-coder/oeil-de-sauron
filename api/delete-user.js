import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: "ID utilisateur manquant" });
  }

  try {
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    const { error: tableError } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", id);

    if (tableError) {
      return res.status(400).json({ error: tableError.message });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}