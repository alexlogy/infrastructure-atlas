import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_impact_projects_icon" AS ENUM('cloud', 'server', 'network', 'shield', 'chart', 'people', 'code', 'layers');
  CREATE TYPE "public"."enum__impact_projects_v_version_icon" AS ENUM('cloud', 'server', 'network', 'shield', 'chart', 'people', 'code', 'layers');
  ALTER TABLE "impact_projects" ADD COLUMN "category" varchar;
  ALTER TABLE "impact_projects" ADD COLUMN "icon" "enum_impact_projects_icon";
  ALTER TABLE "_impact_projects_v" ADD COLUMN "version_category" varchar;
  ALTER TABLE "_impact_projects_v" ADD COLUMN "version_icon" "enum__impact_projects_v_version_icon";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "impact_projects" DROP COLUMN "category";
  ALTER TABLE "impact_projects" DROP COLUMN "icon";
  ALTER TABLE "_impact_projects_v" DROP COLUMN "version_category";
  ALTER TABLE "_impact_projects_v" DROP COLUMN "version_icon";
  DROP TYPE "public"."enum_impact_projects_icon";
  DROP TYPE "public"."enum__impact_projects_v_version_icon";`)
}
