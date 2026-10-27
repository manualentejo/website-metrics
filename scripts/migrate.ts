import postgres from "postgres";
import { readFileSync } from "fs";
import { join } from "path";

async function main() {
  const connectionString =
    process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL ?? process.env.DATABASE_URL!;
  const sql = postgres(connectionString, { ssl: "require", max: 1 });

  const migrationFiles = [
    "0000_init.sql",
    "0001_snapshots.sql",
    "0002_folders_sharing.sql",
    "0003_snapshot_analysis.sql",
  ];
  for (const file of migrationFiles) {
    const migration = readFileSync(join(__dirname, `../drizzle/${file}`), "utf-8");
    const statements = migration
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const statement of statements) {
      await sql.unsafe(statement);
    }
    console.log(`Migration applied: ${file}`);
  }

  const seedSites: { name: string; url: string; sortOrder: number }[] = [
    { name: "Belfoz", url: "https://belfoz.com/", sortOrder: 1 },
    { name: "Equitify Asset", url: "https://equitifyasset.com/", sortOrder: 2 },
    { name: "Ancora Investimentos", url: "https://www.ancora-inv.com/", sortOrder: 3 },
    { name: "MINO", url: "https://mino.works/", sortOrder: 4 },
  ];

  for (const site of seedSites) {
    const existing = await sql`SELECT id FROM sites WHERE url = ${site.url}`;
    if (existing.length === 0) {
      await sql`
        INSERT INTO sites (name, url, status, sort_order)
        VALUES (${site.name}, ${site.url}, 'em_andamento', ${site.sortOrder})
      `;
      console.log(`Seeded site: ${site.name}`);
    }
  }

  await sql.end();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
