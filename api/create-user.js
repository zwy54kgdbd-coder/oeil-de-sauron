import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sqjzunerpujqidvgepiw.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const {
    username,
    password,
    role,
    grade,
    nom,
    prenom,
    matricule,
  } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({
      error: "Identifiant, mot de passe et rôle obligatoires.",
    });
  }

  const usernameClean = username.trim().toLowerCase();
  const email =
    usernameClean === "tolier"
      ? "tayeb.berkouk.tbt@gmail.com"
      : `${usernameClean}@oeildesauron.com`;
const authEmail =
  usernameClean === "tolier"
    ? "tayeb.berkouk.tbt@gmail.com"
    : `${usernameClean}_${Date.now()}@oeildesauron.com`;
  const { error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: authEmail,
    password,
    email_confirm: true,
  });

  if (authError) {
    return res.status(400).json({ error: authError.message });
  }

  const { error: profilError } = await supabaseAdmin.from("users").insert([
    {
      username: usernameClean,
      password,
      role,
      grade,
      nom,
      prenom,
      matricule,
      auth_email: authEmail,
    },
  ]);

  if (profilError) {
    return res.status(400).json({ error: profilError.message });
  }

  return res.status(200).json({ success: true });
}