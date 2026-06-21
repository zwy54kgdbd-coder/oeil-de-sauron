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
    originalUsername,
    username,
    password,
    role,
    grade,
    nom,
    prenom,
    matricule,
  } = req.body;

  if (!originalUsername || !username || !password || !role) {
    return res.status(400).json({
      error: "Identifiant, mot de passe et rôle obligatoires.",
    });
  }

  const originalUsernameClean = originalUsername.trim().toLowerCase();
  const usernameClean = username.trim().toLowerCase();

  if (originalUsernameClean === "tolier" || usernameClean === "tolier") {
    return res.status(400).json({
      error: "Le compte du Tôlier ne peut pas être modifié ici.",
    });
  }

  if (originalUsernameClean !== usernameClean) {
    const { data: existingProfile, error: existingError } = await supabaseAdmin
      .from("users")
      .select("username")
      .eq("username", usernameClean)
      .maybeSingle();

    if (existingError) {
      return res.status(400).json({ error: existingError.message });
    }

    if (existingProfile) {
      return res.status(400).json({ error: "Cet identifiant existe déjà." });
    }
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("users")
    .select("username, auth_email")
    .eq("username", originalUsernameClean)
    .maybeSingle();

  if (profileError) {
    return res.status(400).json({ error: profileError.message });
  }

  if (!profile) {
    return res.status(404).json({ error: "Utilisateur introuvable." });
  }

  const previousAuthEmail =
    profile.auth_email || getAuthEmail(originalUsernameClean);
  const authEmail = getAuthEmail(usernameClean);
  let authUser = await findAuthUserByEmail(previousAuthEmail);

  if (!authUser && previousAuthEmail !== authEmail) {
    authUser = await findAuthUserByEmail(authEmail);
  }

  if (authUser) {
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      authUser.id,
      {
        email: authEmail,
        password,
        email_confirm: true,
      }
    );

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }
  } else {
    const { error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: authEmail,
      password,
      email_confirm: true,
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }
  }

  const { error: tableError } = await supabaseAdmin
    .from("users")
    .update({
      username: usernameClean,
      password,
      role,
      grade,
      nom,
      prenom,
      matricule,
      auth_email: authEmail,
    })
    .eq("username", originalUsernameClean);

  if (tableError) {
    return res.status(400).json({ error: tableError.message });
  }

  return res.status(200).json({ success: true });
}
