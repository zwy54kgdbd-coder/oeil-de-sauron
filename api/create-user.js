import {
  findAuthUserByEmail,
  getAuthEmail,
  requireTolier,
  supabaseAdmin,
} from "./auth-utils.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const requester = await requireTolier(req, res);

  if (!requester) return;

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
  const authEmail = getAuthEmail(usernameClean);

  const { data: existingProfile } = await supabaseAdmin
    .from("users")
    .select("username")
    .eq("username", usernameClean)
    .maybeSingle();

  if (existingProfile) {
    return res.status(400).json({ error: "Cet identifiant existe déjà." });
  }

  const existingAuthUser = await findAuthUserByEmail(authEmail);

  if (existingAuthUser) {
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      existingAuthUser.id
    );

    if (deleteError) {
      return res.status(400).json({ error: deleteError.message });
    }
  }

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
