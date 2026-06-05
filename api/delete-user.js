import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  "https://sqjzunerpujqidvgpeiw.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: "ID manquant" });
    }

    // supprimer dans la table users
    const { error: deleteTableError } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", id);

    if (deleteTableError) {
      return res.status(400).json({
        error: deleteTableError.message,
      });
    }

    // supprimer dans auth
    const { error: deleteAuthError } =
      await supabaseAdmin.auth.admin.deleteUser(id);

    if (deleteAuthError) {
      console.log(deleteAuthError);
    }

    return res.status(200).json({
      success: true,
    });
  } catch (err) {
    return res.status(500).json({
      error: err.message,
    });
  }
}