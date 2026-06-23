import { requireTolier, supabaseAdmin } from "./auth-utils.js";

const tables = [
  "users",
  "identites",
  "vehicules",
  "faits_identites",
  "journal_modifications",
  "historique",
  "caisse_cafe",
  "caisse_cafe_soldes",
  "caisse_cafe_produits",
  "caisse_cafe_rappels",
  "interpellations",
  "p4_conges",
  "vie_groupe",
  "vie_groupe_dossiers",
  "vie_groupe_options",
  "numeros_utiles",
  "camps",
];

async function exportTable(table) {
  const rows = [];
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1;
    const { data, error } = await supabaseAdmin
      .from(table)
      .select("*")
      .range(from, to);

    if (error) {
      return { table, error: error.message, rows: [] };
    }

    rows.push(...(data || []));

    if (!data || data.length < pageSize) break;
  }

  return { table, count: rows.length, rows };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Méthode non autorisée." });
    return;
  }

  const profile = await requireTolier(req, res);

  if (!profile) return;

  const exportedTables = {};

  for (const table of tables) {
    exportedTables[table] = await exportTable(table);
  }

  res.status(200).json({
    created_at: new Date().toISOString(),
    created_by: profile.username,
    supabase_project: "oeil-de-sauron",
    tables: exportedTables,
  });
}
