import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const supabaseUrl = "https://sqjzunerpujqidvgepiw.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const backupRoot =
  process.env.BACKUP_DIR ||
  "/Users/mret/Documents/Codex/2026-06-05/salut-ca-vas/outputs/sauvegardes-oeil-de-sauron";

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
  "interpellations",
  "p4_conges",
  "vie_groupe",
  "vie_groupe_dossiers",
  "vie_groupe_options",
  "caisse_cafe_rappels",
  "numeros_utiles",
];

const storageBuckets = ["photos-identites"];

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function exportTable(supabase, backupDir, table) {
  const rows = [];
  const pageSize = 1000;
  let from = 0;

  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .range(from, to);

    if (error) {
      return { table, ok: false, error: error.message, count: rows.length };
    }

    rows.push(...(data || []));

    if (!data || data.length < pageSize) break;
    from += pageSize;
  }

  await writeFile(
    path.join(backupDir, "tables", `${table}.json`),
    JSON.stringify(rows, null, 2)
  );

  return { table, ok: true, count: rows.length };
}

async function listStorageFiles(supabase, bucket, prefix = "") {
  const files = [];
  const { data, error } = await supabase.storage.from(bucket).list(prefix, {
    limit: 1000,
    sortBy: { column: "name", order: "asc" },
  });

  if (error) {
    throw new Error(`${bucket}: ${error.message}`);
  }

  for (const item of data || []) {
    const itemPath = prefix ? `${prefix}/${item.name}` : item.name;

    if (item.id === null) {
      files.push(...(await listStorageFiles(supabase, bucket, itemPath)));
    } else {
      files.push(itemPath);
    }
  }

  return files;
}

async function exportBucket(supabase, backupDir, bucket) {
  const bucketDir = path.join(backupDir, "storage", bucket);
  await mkdir(bucketDir, { recursive: true });

  const files = await listStorageFiles(supabase, bucket);
  const errors = [];

  for (const filePath of files) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(filePath);

    if (error) {
      errors.push({ filePath, error: error.message });
      continue;
    }

    const target = path.join(bucketDir, filePath);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, Buffer.from(await data.arrayBuffer()));
  }

  return {
    bucket,
    ok: errors.length === 0,
    count: files.length - errors.length,
    errors,
  };
}

async function main() {
  if (!serviceRoleKey) {
    console.error(
      "SUPABASE_SERVICE_ROLE_KEY manquante. Ajoute la clé serveur Supabase pour exporter toutes les données."
    );
    process.exit(1);
  }

  const backupDir = path.join(backupRoot, `backup-${stamp()}`);
  await mkdir(path.join(backupDir, "tables"), { recursive: true });
  await mkdir(path.join(backupDir, "storage"), { recursive: true });

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const manifest = {
    created_at: new Date().toISOString(),
    supabase_url: supabaseUrl,
    backup_dir: backupDir,
    tables: [],
    storage: [],
  };

  for (const table of tables) {
    manifest.tables.push(await exportTable(supabase, backupDir, table));
  }

  for (const bucket of storageBuckets) {
    try {
      manifest.storage.push(await exportBucket(supabase, backupDir, bucket));
    } catch (error) {
      manifest.storage.push({
        bucket,
        ok: false,
        error: error.message,
        count: 0,
      });
    }
  }

  await writeFile(
    path.join(backupDir, "manifest.json"),
    JSON.stringify(manifest, null, 2)
  );

  console.log(`Sauvegarde Supabase créée : ${backupDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
