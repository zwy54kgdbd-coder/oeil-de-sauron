import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sqjzunerpujqidvgepiw.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const TOLIER_EMAIL = "tayeb.berkouk.tbt@gmail.com";

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export function getAuthEmail(username) {
  const usernameClean = username.trim().toLowerCase();

  return usernameClean === "tolier"
    ? TOLIER_EMAIL
    : `${usernameClean}@oeildesauron.com`;
}

export async function findAuthUserByEmail(email) {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();

  if (error) {
    throw error;
  }

  return data.users.find(
    (user) => user.email?.toLowerCase() === email.toLowerCase()
  );
}

export async function requireTolier(req, res) {
  if (!serviceRoleKey) {
    res.status(500).json({ error: "Configuration serveur incomplète." });
    return null;
  }

  const rejectIfNotTolier = (profile) => {
    if (!profile || profile.role !== "LE TÔLIER") {
      res.status(403).json({ error: "Accès réservé au Tôlier." });
      return null;
    }

    return profile;
  };

  const authorization = req.headers.authorization || "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();

  if (token) {
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (!error && data?.user?.email) {
      const authEmail = data.user.email.toLowerCase();
      let { data: profile, error: profileError } = await supabaseAdmin
        .from("users")
        .select("username, role, auth_email")
        .eq("auth_email", authEmail)
        .maybeSingle();

      if (!profile && authEmail === TOLIER_EMAIL.toLowerCase()) {
        const fallback = await supabaseAdmin
          .from("users")
          .select("username, role, auth_email")
          .eq("username", "tolier")
          .maybeSingle();

        profile = fallback.data;
        profileError = fallback.error;
      }

      if (profileError) {
        res.status(400).json({ error: profileError.message });
        return null;
      }

      return rejectIfNotTolier(profile);
    }
  }

  const bodyUsername = (req.body?.username || "").trim().toLowerCase();
  const bodyPassword = req.body?.password || "";

  if (!bodyUsername || !bodyPassword) {
    res.status(401).json({ error: "Session invalide." });
    return null;
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("users")
    .select("username, role, auth_email")
    .eq("username", bodyUsername)
    .eq("password", bodyPassword)
    .maybeSingle();

  if (profileError) {
    res.status(400).json({ error: profileError.message });
    return null;
  }

  return rejectIfNotTolier(profile);
}
