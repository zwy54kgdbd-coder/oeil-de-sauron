import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sqjzunerpujqidvgepiw.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function findAuthUserByEmail(email) {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();

  if (error) {
    throw error;
  }

  return data.users.find(
    (user) => user.email?.toLowerCase() === email.toLowerCase()
  );
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const usernameClean = req.body?.username?.trim().toLowerCase();

  if (!usernameClean) {
    return res.status(400).json({ error: "Identifiant utilisateur manquant." });
  }

  if (usernameClean === "tolier") {
    return res.status(400).json({ error: "Impossible de supprimer le Tôlier." });
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("users")
    .select("username, auth_email")
    .eq("username", usernameClean)
    .maybeSingle();

  if (profileError) {
    return res.status(400).json({ error: profileError.message });
  }

  const authEmail = profile?.auth_email || `${usernameClean}@oeildesauron.com`;
  const authUser = await findAuthUserByEmail(authEmail);

  if (authUser) {
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
      authUser.id
    );

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }
  }

  const { error: tableError } = await supabaseAdmin
    .from("users")
    .delete()
    .eq("username", usernameClean);

  if (tableError) {
    return res.status(400).json({ error: tableError.message });
  }

  return res.status(200).json({ success: true });
}
