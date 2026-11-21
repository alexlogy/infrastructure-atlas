import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ADD COLUMN "sections_atlas" boolean DEFAULT true;
  ALTER TABLE "site_settings" ADD COLUMN "atlas_center_latitude" numeric;
  ALTER TABLE "site_settings" ADD COLUMN "atlas_center_longitude" numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" DROP COLUMN "sections_atlas";
  ALTER TABLE "site_settings" DROP COLUMN "atlas_center_latitude";
  ALTER TABLE "site_settings" DROP COLUMN "atlas_center_longitude";`)
}
