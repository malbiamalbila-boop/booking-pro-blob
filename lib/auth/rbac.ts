import { db } from "../db/client";
import { permissions, rolePermissions, roles, userRoles } from "../db/schema";
import { eq, inArray } from "drizzle-orm";

export async function getUserPermissions(userId: string) {
  const userRoleRows = await db
    .select({ roleId: userRoles.roleId })
    .from(userRoles)
    .where(eq(userRoles.userId, userId));
  if (!userRoleRows.length) return [] as string[];
  const roleIds = userRoleRows.map((row) => row.roleId);
  const rows = await db
    .select({ name: permissions.name })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(inArray(rolePermissions.roleId, roleIds));
  return rows.map((row) => row.name);
}

export async function requirePermission(userId: string, permission: string) {
  const perms = await getUserPermissions(userId);
  if (!perms.includes(permission)) {
    throw new Error("forbidden");
  }
}

export async function assignRole(userId: string, roleName: string) {
  const [role] = await db.select().from(roles).where(eq(roles.name, roleName)).limit(1);
  if (!role) throw new Error(`role ${roleName} not found`);
  await db.insert(userRoles).values({ userId, roleId: role.id }).onConflictDoNothing();
}
