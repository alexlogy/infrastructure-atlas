import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_lab_projects_stage" AS ENUM('active', 'exploring', 'paused', 'archived');
  CREATE TYPE "public"."enum_lab_projects_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__lab_projects_v_version_stage" AS ENUM('active', 'exploring', 'paused', 'archived');
  CREATE TYPE "public"."enum__lab_projects_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "lab_projects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"category" varchar,
  	"stage" "enum_lab_projects_stage" DEFAULT 'active',
  	"summary" varchar,
  	"image_id" integer,
  	"link_label" varchar DEFAULT 'Read more',
  	"link_href" varchar,
  	"featured" boolean DEFAULT false,
  	"sort_order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_lab_projects_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "lab_projects_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "_lab_projects_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_category" varchar,
  	"version_stage" "enum__lab_projects_v_version_stage" DEFAULT 'active',
  	"version_summary" varchar,
  	"version_image_id" integer,
  	"version_link_label" varchar DEFAULT 'Read more',
  	"version_link_href" varchar,
  	"version_featured" boolean DEFAULT false,
  	"version_sort_order" numeric DEFAULT 0,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__lab_projects_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_lab_projects_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "lab_projects_id" integer;
  ALTER TABLE "lab_projects" ADD CONSTRAINT "lab_projects_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lab_projects_texts" ADD CONSTRAINT "lab_projects_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."lab_projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lab_projects_v" ADD CONSTRAINT "_lab_projects_v_parent_id_lab_projects_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."lab_projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lab_projects_v" ADD CONSTRAINT "_lab_projects_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lab_projects_v_texts" ADD CONSTRAINT "_lab_projects_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_lab_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "lab_projects_image_idx" ON "lab_projects" USING btree ("image_id");
  CREATE INDEX "lab_projects_updated_at_idx" ON "lab_projects" USING btree ("updated_at");
  CREATE INDEX "lab_projects_created_at_idx" ON "lab_projects" USING btree ("created_at");
  CREATE INDEX "lab_projects__status_idx" ON "lab_projects" USING btree ("_status");
  CREATE INDEX "lab_projects_texts_order_parent" ON "lab_projects_texts" USING btree ("order","parent_id");
  CREATE INDEX "_lab_projects_v_parent_idx" ON "_lab_projects_v" USING btree ("parent_id");
  CREATE INDEX "_lab_projects_v_version_version_image_idx" ON "_lab_projects_v" USING btree ("version_image_id");
  CREATE INDEX "_lab_projects_v_version_version_updated_at_idx" ON "_lab_projects_v" USING btree ("version_updated_at");
  CREATE INDEX "_lab_projects_v_version_version_created_at_idx" ON "_lab_projects_v" USING btree ("version_created_at");
  CREATE INDEX "_lab_projects_v_version_version__status_idx" ON "_lab_projects_v" USING btree ("version__status");
  CREATE INDEX "_lab_projects_v_created_at_idx" ON "_lab_projects_v" USING btree ("created_at");
  CREATE INDEX "_lab_projects_v_updated_at_idx" ON "_lab_projects_v" USING btree ("updated_at");
  CREATE INDEX "_lab_projects_v_latest_idx" ON "_lab_projects_v" USING btree ("latest");
  CREATE INDEX "_lab_projects_v_texts_order_parent" ON "_lab_projects_v_texts" USING btree ("order","parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_lab_projects_fk" FOREIGN KEY ("lab_projects_id") REFERENCES "public"."lab_projects"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_lab_projects_id_idx" ON "payload_locked_documents_rels" USING btree ("lab_projects_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "lab_projects" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "lab_projects_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_lab_projects_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_lab_projects_v_texts" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "lab_projects" CASCADE;
  DROP TABLE "lab_projects_texts" CASCADE;
  DROP TABLE "_lab_projects_v" CASCADE;
  DROP TABLE "_lab_projects_v_texts" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_lab_projects_fk";
  
  DROP INDEX "payload_locked_documents_rels_lab_projects_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "lab_projects_id";
  DROP TYPE "public"."enum_lab_projects_stage";
  DROP TYPE "public"."enum_lab_projects_status";
  DROP TYPE "public"."enum__lab_projects_v_version_stage";
  DROP TYPE "public"."enum__lab_projects_v_version_status";`)
}
