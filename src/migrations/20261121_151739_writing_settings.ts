import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "writing_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"enabled" boolean DEFAULT true,
  	"recent_count" numeric DEFAULT 6 NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "writing_settings_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  ALTER TABLE "writing_settings_texts" ADD CONSTRAINT "writing_settings_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."writing_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "writing_settings_texts_order_parent" ON "writing_settings_texts" USING btree ("order","parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "writing_settings" CASCADE;
  DROP TABLE "writing_settings_texts" CASCADE;`)
}
