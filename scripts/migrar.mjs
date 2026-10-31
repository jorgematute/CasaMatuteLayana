import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { conectarBaseDatos } from "./conexion-bd.mjs";

const directorioMigraciones = fileURLToPath(new URL("../supabase/migrations/", import.meta.url));
const migracionesHistoricas = [
  "20261003000000_supabase_core.sql",
  "20261003000100_admin_users.sql",
];

async function registrarMigracionesHistoricas(cliente, archivos) {
  const historicasPendientes = migracionesHistoricas.filter((archivo) =>
    archivos.includes(archivo),
  );
  if (historicasPendientes.length === 0) {
    return;
  }

  const resultado = await cliente.query(`
    SELECT
      to_regclass('public.users') IS NOT NULL
        AND to_regclass('public.app_records') IS NOT NULL
        AND to_regprocedure('public.handle_auth_user_sync()') IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'is_admin'
        )
        AND to_regclass('public.users_admin_lookup_idx') IS NOT NULL AS aplicadas
  `);

  if (!resultado.rows[0].aplicadas) {
    throw new Error(
      "No se puede confirmar que las migraciones históricas de autenticación estén aplicadas; no se ejecutarán ni se registrarán automáticamente.",
    );
  }

  for (const archivo of historicasPendientes) {
    await cliente.query(
      "INSERT INTO _migrations (archivo) VALUES ($1) ON CONFLICT (archivo) DO NOTHING",
      [archivo],
    );
    console.log(`omitida (histórica ya aplicada): ${archivo}`);
  }
}

async function aplicarMigraciones() {
  const cliente = await conectarBaseDatos();
  try {
    await cliente.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id serial primary key,
        archivo text unique not null,
        aplicada_en timestamptz default now()
      )
    `);

    const archivos = (await readdir(directorioMigraciones))
      .filter((archivo) => archivo.endsWith(".sql"))
      .sort((a, b) => a.localeCompare(b));

    await registrarMigracionesHistoricas(cliente, archivos);

    for (const archivo of archivos) {
      const registrado = await cliente.query(
        "SELECT 1 FROM _migrations WHERE archivo = $1",
        [archivo],
      );
      if (registrado.rowCount > 0) {
        if (!migracionesHistoricas.includes(archivo)) {
          console.log(`omitida: ${archivo}`);
        }
        continue;
      }

      const sql = await readFile(path.join(directorioMigraciones, archivo), "utf8");
      await cliente.query("BEGIN");
      try {
        await cliente.query(sql);
        await cliente.query("INSERT INTO _migrations (archivo) VALUES ($1)", [archivo]);
        await cliente.query("COMMIT");
        console.log(`aplicada: ${archivo}`);
      } catch (error) {
        await cliente.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    await cliente.end();
  }
}

aplicarMigraciones().catch((error) => {
  console.error(`Falló la migración: ${error.code ?? error.message}`);
  process.exitCode = 1;
});
