#!/usr/bin/env node

/**
 * Backfill script to populate serverKey for existing tool_providers that don't have one.
 *
 * This script:
 * 1. Finds all tool_providers with empty serverKey values
 * 2. Derives a serverKey from the URL using deriveServerKey()
 * 3. Updates the database with the derived serverKey
 * 4. Reports on what was updated
 *
 * Usage:
 *   npx ts-node scripts/backfill-server-keys.ts
 */

import { deriveServerKey } from "@tambo-ai-cloud/core";
import { getDb, schema } from "@tambo-ai-cloud/db";
import { eq } from "drizzle-orm";

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const db = getDb(dbUrl);
  console.log("📦 Backfilling serverKey for existing MCP servers...\n");

  // Get all tool_providers with empty serverKey
  const serversNeedingKeys = await db
    .select()
    .from(schema.toolProviders)
    .where(eq(schema.toolProviders.serverKey, ""));

  if (serversNeedingKeys.length === 0) {
    console.log("✅ No servers need serverKey backfill - all set!");
    return;
  }

  console.log(
    `Found ${serversNeedingKeys.length} server(s) that need serverKey...\n`,
  );

  let updated = 0;
  let failed = 0;

  for (const server of serversNeedingKeys) {
    try {
      if (!server.url) {
        console.log(`⚠️  Skipping server ${server.id}: no URL configured`);
        failed++;
        continue;
      }

      const derivedKey = deriveServerKey(server.url);

      // Ensure the key is at least 2 characters
      if (derivedKey.length < 2) {
        console.log(
          `⚠️  Skipping server ${server.id}: derived key "${derivedKey}" is too short (min 2 chars)`,
        );
        failed++;
        continue;
      }

      // Update the server with the derived key
      await db
        .update(schema.toolProviders)
        .set({ serverKey: derivedKey })
        .where(eq(schema.toolProviders.id, server.id));

      console.log(
        `✅ Server ${server.id}: URL "${server.url}" → serverKey "${derivedKey}"`,
      );
      updated++;
    } catch (error) {
      console.log(
        `❌ Server ${server.id}: Failed to update - ${error instanceof Error ? error.message : String(error)}`,
      );
      failed++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Failed:  ${failed}`);
  console.log(`   Total:   ${serversNeedingKeys.length}`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
