import {
  encryptApiKey,
  encryptProviderKey,
  hashKey,
  hideApiKey,
} from "@use-hydra-ai/core";
import { createHash, randomBytes } from "crypto";
import { and, eq } from "drizzle-orm";
import * as schema from "../schema";
import type { HydraTransaction } from "../types";

export async function createProject(
  db: HydraTransaction,
  { name, userId }: { name: string; userId: string },
) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const [project] = await db
    .insert(schema.projects)
    .values({
      name: name ?? "New Project",
    })
    .returning();

  await db.insert(schema.projectMembers).values({
    projectId: project.id,
    userId: userId,
    role: "admin",
  });

  return {
    id: project.id,
    name: project.name,
    userId,
  };
}

export async function getProjectsForUser(db: HydraTransaction, userId: string) {
  return db.query.projects.findMany({
    where: (projects, { inArray }) =>
      inArray(
        projects.id,
        db
          .select({ id: schema.projectMembers.projectId })
          .from(schema.projectMembers)
          .where(eq(schema.projectMembers.userId, userId)),
      ),
  });
}

export async function getProject(db: HydraTransaction, id: string) {
  return db.query.projects.findFirst({
    where: (projects, { eq, or, and, isNotNull }) =>
      or(
        eq(projects.id, id),
        and(isNotNull(projects.legacyId), eq(projects.legacyId, id)),
      ),
    with: {
      members: true,
    },
  });
}

export async function getProjectWithKeys(db: HydraTransaction, id: string) {
  return db.query.projects.findFirst({
    where: (projects, { eq, or, and, isNotNull }) =>
      or(
        eq(projects.id, id),
        and(isNotNull(projects.legacyId), eq(projects.legacyId, id)),
      ),
    with: {
      members: true,
      apiKeys: true,
      providerKeys: true,
    },
  });
}

export async function updateProject(
  db: HydraTransaction,
  id: string,
  { name }: { name: string },
) {
  const [updated] = await db
    .update(schema.projects)
    .set({ name })
    .where(eq(schema.projects.id, id))
    .returning();
  return updated;
}

export async function deleteProject(
  db: HydraTransaction,
  id: string,
): Promise<boolean> {
  const deleted = await db
    .delete(schema.projects)
    .where(eq(schema.projects.id, id))
    .returning();
  return deleted.length > 0;
}

export async function createApiKey(
  apiKeySecret: string,
  db: HydraTransaction,
  {
    projectId,
    userId,
    name,
  }: { projectId: string; userId: string; name: string },
): Promise<string> {
  const apiKey = randomBytes(16).toString("hex");
  const encryptedKey = encryptApiKey(projectId, apiKey, apiKeySecret);
  const hashedKey = hashKey(encryptedKey);

  await db.insert(schema.apiKeys).values({
    projectId,
    name,
    hashedKey,
    createdByUserId: userId,
    partiallyHiddenKey: hideApiKey(encryptedKey),
  });

  return encryptedKey;
}

export async function getApiKeys(db: HydraTransaction, projectId: string) {
  return db.query.apiKeys.findMany({
    where: eq(schema.apiKeys.projectId, projectId),
  });
}

export async function updateApiKeyLastUsed(
  db: HydraTransaction,
  {
    projectId,
    hashedKey,
    lastUsed,
  }: {
    projectId: string;
    hashedKey: string;
    lastUsed: Date;
  },
) {
  const [updated] = await db
    .update(schema.apiKeys)
    .set({ lastUsedAt: lastUsed })
    .where(
      and(
        eq(schema.apiKeys.hashedKey, hashedKey),
        eq(schema.apiKeys.projectId, projectId),
      ),
    )
    .returning();

  if (!updated) {
    throw new Error("API Key not found");
  }
  return updated;
}

export async function deleteApiKey(
  db: HydraTransaction,
  projectId: string,
  apiKeyId: string,
): Promise<boolean> {
  const deleted = await db
    .delete(schema.apiKeys)
    .where(eq(schema.apiKeys.id, apiKeyId))
    .returning();
  return deleted.length > 0;
}

export async function validateApiKey(
  db: HydraTransaction,
  projectId: string,
  apiKey: string,
): Promise<boolean> {
  const hashedKey = createHash("sha256").update(apiKey).digest("hex");

  const keys = await db
    .select()
    .from(schema.apiKeys)
    .where(
      and(
        eq(schema.apiKeys.hashedKey, hashedKey),
        eq(schema.apiKeys.projectId, projectId),
      ),
    );

  return keys.length > 0;
}

export async function addProviderKey(
  db: HydraTransaction,
  providerKeySecret: string,
  {
    projectId,
    providerName,
    providerKey,
    userId,
  }: {
    projectId: string;
    providerName: string;
    providerKey: string;
    userId: string;
  },
) {
  const providerKeyEncrypted = encryptProviderKey(
    providerName,
    providerKey,
    providerKeySecret,
  );

  await db.insert(schema.apiKeys).values({
    projectId,
    name: providerName,
    hashedKey: providerKeyEncrypted,
    partiallyHiddenKey: hideApiKey(providerKey),
    createdByUserId: userId,
  });

  return getProjectWithKeys(db, projectId);
}

export async function getProviderKeys(db: HydraTransaction, projectId: string) {
  return db.query.providerKeys.findMany({
    where: eq(schema.providerKeys.projectId, projectId),
  });
}

export async function deleteProviderKey(
  db: HydraTransaction,
  projectId: string,
  providerKeyId: string,
) {
  await db
    .delete(schema.providerKeys)
    .where(
      and(
        eq(schema.providerKeys.id, providerKeyId),
        eq(schema.providerKeys.projectId, projectId),
      ),
    );

  return getProjectWithKeys(db, projectId);
}
