#!/usr/bin/env node

/**
 * Run this script to migrate mock data to Firebase
 * Usage: node scripts/migrate-data.js [--dry-run] [--clear] [--batch-size=10]
 */

const { DataMigrationService } = require("../utils/dataMigration");

async function main() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: args.includes("--dry-run"),
    clearExisting: args.includes("--clear"),
    batchSize: parseInt(
      args.find((arg) => arg.startsWith("--batch-size="))?.split("=")[1] ||
        "10",
      10
    ),
  };

  console.log("🚀 Starting data migration with options:", options);

  try {
    await DataMigrationService.migrateAllData(options);
    console.log("✅ Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
