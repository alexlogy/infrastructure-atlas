import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_impact_projects_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__impact_projects_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_atlas_locations_precision" AS ENUM('exact', 'city', 'region', 'country');
  CREATE TYPE "public"."enum_atlas_locations_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__atlas_locations_v_version_precision" AS ENUM('exact', 'city', 'region', 'country');
  CREATE TYPE "public"."enum__atlas_locations_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "impact_projects_outcomes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"result" varchar,
  	"metric" varchar,
  	"verification" varchar
  );
  
  CREATE TABLE "impact_projects_source_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "impact_projects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"summary" varchar,
  	"featured_image_id" integer,
  	"leadership_narrative" jsonb,
  	"engineering_narrative" jsonb,
  	"challenge" jsonb,
  	"architecture" jsonb,
  	"diagram_id" integer,
  	"decisions" jsonb,
  	"limitations" jsonb,
  	"featured" boolean DEFAULT false,
  	"sort_order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_impact_projects_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "impact_projects_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "impact_projects_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"timeline_milestones_id" integer,
  	"atlas_locations_id" integer
  );
  
  CREATE TABLE "_impact_projects_v_version_outcomes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"result" varchar,
  	"metric" varchar,
  	"verification" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_impact_projects_v_version_source_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_impact_projects_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_summary" varchar,
  	"version_featured_image_id" integer,
  	"version_leadership_narrative" jsonb,
  	"version_engineering_narrative" jsonb,
  	"version_challenge" jsonb,
  	"version_architecture" jsonb,
  	"version_diagram_id" integer,
  	"version_decisions" jsonb,
  	"version_limitations" jsonb,
  	"version_featured" boolean DEFAULT false,
  	"version_sort_order" numeric DEFAULT 0,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__impact_projects_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_impact_projects_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "_impact_projects_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"timeline_milestones_id" integer,
  	"atlas_locations_id" integer
  );
  
  CREATE TABLE "atlas_locations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"city" varchar,
  	"region" varchar,
  	"country" varchar,
  	"latitude" numeric,
  	"longitude" numeric,
  	"precision" "enum_atlas_locations_precision" DEFAULT 'city',
  	"category" varchar,
  	"sort_order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_atlas_locations_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_atlas_locations_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_label" varchar,
  	"version_city" varchar,
  	"version_region" varchar,
  	"version_country" varchar,
  	"version_latitude" numeric,
  	"version_longitude" numeric,
  	"version_precision" "enum__atlas_locations_v_version_precision" DEFAULT 'city',
  	"version_category" varchar,
  	"version_sort_order" numeric DEFAULT 0,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__atlas_locations_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "home_page_calls_to_action" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL
  );
  
  CREATE TABLE "home_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"headline" varchar,
  	"subheadline" varchar,
  	"hero_image_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "home_page_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"impact_projects_id" integer
  );
  
  ALTER TABLE "timeline_milestones" ADD COLUMN "location_id" integer;
  ALTER TABLE "_timeline_milestones_v" ADD COLUMN "version_location_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "impact_projects_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "atlas_locations_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "sections_impact" boolean DEFAULT true;
  ALTER TABLE "impact_projects_outcomes" ADD CONSTRAINT "impact_projects_outcomes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."impact_projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "impact_projects_source_links" ADD CONSTRAINT "impact_projects_source_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."impact_projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "impact_projects" ADD CONSTRAINT "impact_projects_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "impact_projects" ADD CONSTRAINT "impact_projects_diagram_id_media_id_fk" FOREIGN KEY ("diagram_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "impact_projects_texts" ADD CONSTRAINT "impact_projects_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."impact_projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "impact_projects_rels" ADD CONSTRAINT "impact_projects_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."impact_projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "impact_projects_rels" ADD CONSTRAINT "impact_projects_rels_timeline_milestones_fk" FOREIGN KEY ("timeline_milestones_id") REFERENCES "public"."timeline_milestones"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "impact_projects_rels" ADD CONSTRAINT "impact_projects_rels_atlas_locations_fk" FOREIGN KEY ("atlas_locations_id") REFERENCES "public"."atlas_locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_impact_projects_v_version_outcomes" ADD CONSTRAINT "_impact_projects_v_version_outcomes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_impact_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_impact_projects_v_version_source_links" ADD CONSTRAINT "_impact_projects_v_version_source_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_impact_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_impact_projects_v" ADD CONSTRAINT "_impact_projects_v_parent_id_impact_projects_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."impact_projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_impact_projects_v" ADD CONSTRAINT "_impact_projects_v_version_featured_image_id_media_id_fk" FOREIGN KEY ("version_featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_impact_projects_v" ADD CONSTRAINT "_impact_projects_v_version_diagram_id_media_id_fk" FOREIGN KEY ("version_diagram_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_impact_projects_v_texts" ADD CONSTRAINT "_impact_projects_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_impact_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_impact_projects_v_rels" ADD CONSTRAINT "_impact_projects_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_impact_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_impact_projects_v_rels" ADD CONSTRAINT "_impact_projects_v_rels_timeline_milestones_fk" FOREIGN KEY ("timeline_milestones_id") REFERENCES "public"."timeline_milestones"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_impact_projects_v_rels" ADD CONSTRAINT "_impact_projects_v_rels_atlas_locations_fk" FOREIGN KEY ("atlas_locations_id") REFERENCES "public"."atlas_locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_atlas_locations_v" ADD CONSTRAINT "_atlas_locations_v_parent_id_atlas_locations_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."atlas_locations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_page_calls_to_action" ADD CONSTRAINT "home_page_calls_to_action_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page" ADD CONSTRAINT "home_page_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_page_rels" ADD CONSTRAINT "home_page_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_rels" ADD CONSTRAINT "home_page_rels_impact_projects_fk" FOREIGN KEY ("impact_projects_id") REFERENCES "public"."impact_projects"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "impact_projects_outcomes_order_idx" ON "impact_projects_outcomes" USING btree ("_order");
  CREATE INDEX "impact_projects_outcomes_parent_id_idx" ON "impact_projects_outcomes" USING btree ("_parent_id");
  CREATE INDEX "impact_projects_source_links_order_idx" ON "impact_projects_source_links" USING btree ("_order");
  CREATE INDEX "impact_projects_source_links_parent_id_idx" ON "impact_projects_source_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "impact_projects_slug_idx" ON "impact_projects" USING btree ("slug");
  CREATE INDEX "impact_projects_featured_image_idx" ON "impact_projects" USING btree ("featured_image_id");
  CREATE INDEX "impact_projects_diagram_idx" ON "impact_projects" USING btree ("diagram_id");
  CREATE INDEX "impact_projects_updated_at_idx" ON "impact_projects" USING btree ("updated_at");
  CREATE INDEX "impact_projects_created_at_idx" ON "impact_projects" USING btree ("created_at");
  CREATE INDEX "impact_projects__status_idx" ON "impact_projects" USING btree ("_status");
  CREATE INDEX "impact_projects_texts_order_parent" ON "impact_projects_texts" USING btree ("order","parent_id");
  CREATE INDEX "impact_projects_rels_order_idx" ON "impact_projects_rels" USING btree ("order");
  CREATE INDEX "impact_projects_rels_parent_idx" ON "impact_projects_rels" USING btree ("parent_id");
  CREATE INDEX "impact_projects_rels_path_idx" ON "impact_projects_rels" USING btree ("path");
  CREATE INDEX "impact_projects_rels_timeline_milestones_id_idx" ON "impact_projects_rels" USING btree ("timeline_milestones_id");
  CREATE INDEX "impact_projects_rels_atlas_locations_id_idx" ON "impact_projects_rels" USING btree ("atlas_locations_id");
  CREATE INDEX "_impact_projects_v_version_outcomes_order_idx" ON "_impact_projects_v_version_outcomes" USING btree ("_order");
  CREATE INDEX "_impact_projects_v_version_outcomes_parent_id_idx" ON "_impact_projects_v_version_outcomes" USING btree ("_parent_id");
  CREATE INDEX "_impact_projects_v_version_source_links_order_idx" ON "_impact_projects_v_version_source_links" USING btree ("_order");
  CREATE INDEX "_impact_projects_v_version_source_links_parent_id_idx" ON "_impact_projects_v_version_source_links" USING btree ("_parent_id");
  CREATE INDEX "_impact_projects_v_parent_idx" ON "_impact_projects_v" USING btree ("parent_id");
  CREATE INDEX "_impact_projects_v_version_version_slug_idx" ON "_impact_projects_v" USING btree ("version_slug");
  CREATE INDEX "_impact_projects_v_version_version_featured_image_idx" ON "_impact_projects_v" USING btree ("version_featured_image_id");
  CREATE INDEX "_impact_projects_v_version_version_diagram_idx" ON "_impact_projects_v" USING btree ("version_diagram_id");
  CREATE INDEX "_impact_projects_v_version_version_updated_at_idx" ON "_impact_projects_v" USING btree ("version_updated_at");
  CREATE INDEX "_impact_projects_v_version_version_created_at_idx" ON "_impact_projects_v" USING btree ("version_created_at");
  CREATE INDEX "_impact_projects_v_version_version__status_idx" ON "_impact_projects_v" USING btree ("version__status");
  CREATE INDEX "_impact_projects_v_created_at_idx" ON "_impact_projects_v" USING btree ("created_at");
  CREATE INDEX "_impact_projects_v_updated_at_idx" ON "_impact_projects_v" USING btree ("updated_at");
  CREATE INDEX "_impact_projects_v_latest_idx" ON "_impact_projects_v" USING btree ("latest");
  CREATE INDEX "_impact_projects_v_texts_order_parent" ON "_impact_projects_v_texts" USING btree ("order","parent_id");
  CREATE INDEX "_impact_projects_v_rels_order_idx" ON "_impact_projects_v_rels" USING btree ("order");
  CREATE INDEX "_impact_projects_v_rels_parent_idx" ON "_impact_projects_v_rels" USING btree ("parent_id");
  CREATE INDEX "_impact_projects_v_rels_path_idx" ON "_impact_projects_v_rels" USING btree ("path");
  CREATE INDEX "_impact_projects_v_rels_timeline_milestones_id_idx" ON "_impact_projects_v_rels" USING btree ("timeline_milestones_id");
  CREATE INDEX "_impact_projects_v_rels_atlas_locations_id_idx" ON "_impact_projects_v_rels" USING btree ("atlas_locations_id");
  CREATE INDEX "atlas_locations_updated_at_idx" ON "atlas_locations" USING btree ("updated_at");
  CREATE INDEX "atlas_locations_created_at_idx" ON "atlas_locations" USING btree ("created_at");
  CREATE INDEX "atlas_locations__status_idx" ON "atlas_locations" USING btree ("_status");
  CREATE INDEX "_atlas_locations_v_parent_idx" ON "_atlas_locations_v" USING btree ("parent_id");
  CREATE INDEX "_atlas_locations_v_version_version_updated_at_idx" ON "_atlas_locations_v" USING btree ("version_updated_at");
  CREATE INDEX "_atlas_locations_v_version_version_created_at_idx" ON "_atlas_locations_v" USING btree ("version_created_at");
  CREATE INDEX "_atlas_locations_v_version_version__status_idx" ON "_atlas_locations_v" USING btree ("version__status");
  CREATE INDEX "_atlas_locations_v_created_at_idx" ON "_atlas_locations_v" USING btree ("created_at");
  CREATE INDEX "_atlas_locations_v_updated_at_idx" ON "_atlas_locations_v" USING btree ("updated_at");
  CREATE INDEX "_atlas_locations_v_latest_idx" ON "_atlas_locations_v" USING btree ("latest");
  CREATE INDEX "home_page_calls_to_action_order_idx" ON "home_page_calls_to_action" USING btree ("_order");
  CREATE INDEX "home_page_calls_to_action_parent_id_idx" ON "home_page_calls_to_action" USING btree ("_parent_id");
  CREATE INDEX "home_page_hero_image_idx" ON "home_page" USING btree ("hero_image_id");
  CREATE INDEX "home_page_rels_order_idx" ON "home_page_rels" USING btree ("order");
  CREATE INDEX "home_page_rels_parent_idx" ON "home_page_rels" USING btree ("parent_id");
  CREATE INDEX "home_page_rels_path_idx" ON "home_page_rels" USING btree ("path");
  CREATE INDEX "home_page_rels_impact_projects_id_idx" ON "home_page_rels" USING btree ("impact_projects_id");
  ALTER TABLE "timeline_milestones" ADD CONSTRAINT "timeline_milestones_location_id_atlas_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."atlas_locations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_timeline_milestones_v" ADD CONSTRAINT "_timeline_milestones_v_version_location_id_atlas_lo_8d400b94_fk" FOREIGN KEY ("version_location_id") REFERENCES "public"."atlas_locations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_impact_projects_fk" FOREIGN KEY ("impact_projects_id") REFERENCES "public"."impact_projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_atlas_locations_fk" FOREIGN KEY ("atlas_locations_id") REFERENCES "public"."atlas_locations"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "timeline_milestones_location_idx" ON "timeline_milestones" USING btree ("location_id");
  CREATE INDEX "_timeline_milestones_v_version_version_location_idx" ON "_timeline_milestones_v" USING btree ("version_location_id");
  CREATE INDEX "payload_locked_documents_rels_impact_projects_id_idx" ON "payload_locked_documents_rels" USING btree ("impact_projects_id");
  CREATE INDEX "payload_locked_documents_rels_atlas_locations_id_idx" ON "payload_locked_documents_rels" USING btree ("atlas_locations_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "impact_projects_outcomes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "impact_projects_source_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "impact_projects" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "impact_projects_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "impact_projects_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_impact_projects_v_version_outcomes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_impact_projects_v_version_source_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_impact_projects_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_impact_projects_v_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_impact_projects_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "atlas_locations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_atlas_locations_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page_calls_to_action" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "impact_projects_outcomes" CASCADE;
  DROP TABLE "impact_projects_source_links" CASCADE;
  DROP TABLE "impact_projects" CASCADE;
  DROP TABLE "impact_projects_texts" CASCADE;
  DROP TABLE "impact_projects_rels" CASCADE;
  DROP TABLE "_impact_projects_v_version_outcomes" CASCADE;
  DROP TABLE "_impact_projects_v_version_source_links" CASCADE;
  DROP TABLE "_impact_projects_v" CASCADE;
  DROP TABLE "_impact_projects_v_texts" CASCADE;
  DROP TABLE "_impact_projects_v_rels" CASCADE;
  DROP TABLE "atlas_locations" CASCADE;
  DROP TABLE "_atlas_locations_v" CASCADE;
  DROP TABLE "home_page_calls_to_action" CASCADE;
  DROP TABLE "home_page" CASCADE;
  DROP TABLE "home_page_rels" CASCADE;
  ALTER TABLE "timeline_milestones" DROP CONSTRAINT "timeline_milestones_location_id_atlas_locations_id_fk";
  
  ALTER TABLE "_timeline_milestones_v" DROP CONSTRAINT "_timeline_milestones_v_version_location_id_atlas_lo_8d400b94_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_impact_projects_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_atlas_locations_fk";
  
  DROP INDEX "timeline_milestones_location_idx";
  DROP INDEX "_timeline_milestones_v_version_version_location_idx";
  DROP INDEX "payload_locked_documents_rels_impact_projects_id_idx";
  DROP INDEX "payload_locked_documents_rels_atlas_locations_id_idx";
  ALTER TABLE "timeline_milestones" DROP COLUMN "location_id";
  ALTER TABLE "_timeline_milestones_v" DROP COLUMN "version_location_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "impact_projects_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "atlas_locations_id";
  ALTER TABLE "site_settings" DROP COLUMN "sections_impact";
  DROP TYPE "public"."enum_impact_projects_status";
  DROP TYPE "public"."enum__impact_projects_v_version_status";
  DROP TYPE "public"."enum_atlas_locations_precision";
  DROP TYPE "public"."enum_atlas_locations_status";
  DROP TYPE "public"."enum__atlas_locations_v_version_precision";
  DROP TYPE "public"."enum__atlas_locations_v_version_status";`)
}
