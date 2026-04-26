import { db } from "../../db";
import { sector, ulb, rolePermission } from "../../db/schema";
import { sql } from "drizzle-orm";

export async function getReferenceSectors() {
  return db.select({
    sector_code: sector.sectorCode,
    sector_name: sector.sectorName,
    sector_icon: sector.sectorIcon,
  }).from(sector).orderBy(sector.sectorName);
}

export async function getReferenceUlbs() {
  return db.select({
    ulb_id:        ulb.ulbId,
    ulb_code:      ulb.ulbCode,
    ulb_name:      ulb.ulbName,
    district_name: ulb.districtName,
    ulb_type:      ulb.ulbType,
    division:      ulb.division,
  }).from(ulb).orderBy(ulb.districtName, ulb.ulbName);
}

export async function getRolePermissions() {
  const rows = await db.select().from(rolePermission);
  // Return as a keyed object matching the frontend ROLE_PERMISSIONS shape
  const result: Record<string, unknown> = {};
  for (const r of rows) {
    result[r.role] = {
      can_view_all: r.canViewAll,
      can_edit:     r.canEdit,
      can_add:      r.canAdd,
      description:  r.description,
    };
  }
  return result;
}
