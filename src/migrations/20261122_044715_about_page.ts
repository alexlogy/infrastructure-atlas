import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "about_page_principles" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"body" varchar
  );
  
  CREATE TABLE "about_page_credentials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"issuer" varchar,
  	"issued_on" timestamp(3) with time zone,
  	"expires_on" timestamp(3) with time zone,
  	"url" varchar
  );
  
  CREATE TABLE "about_page_contact_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL
  );
  
  CREATE TABLE "about_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"statement" varchar,
  	"introduction" jsonb,
  	"portrait_id" integer,
  	"current_focus" varchar,
  	"contact_heading" varchar,
  	"contact_text" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "about_page_principles" ADD CONSTRAINT "about_page_principles_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_page_credentials" ADD CONSTRAINT "about_page_credentials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_page_contact_links" ADD CONSTRAINT "about_page_contact_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_page" ADD CONSTRAINT "about_page_portrait_id_media_id_fk" FOREIGN KEY ("portrait_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "about_page_principles_order_idx" ON "about_page_principles" USING btree ("_order");
  CREATE INDEX "about_page_principles_parent_id_idx" ON "about_page_principles" USING btree ("_parent_id");
  CREATE INDEX "about_page_credentials_order_idx" ON "about_page_credentials" USING btree ("_order");
  CREATE INDEX "about_page_credentials_parent_id_idx" ON "about_page_credentials" USING btree ("_parent_id");
  CREATE INDEX "about_page_contact_links_order_idx" ON "about_page_contact_links" USING btree ("_order");
  CREATE INDEX "about_page_contact_links_parent_id_idx" ON "about_page_contact_links" USING btree ("_parent_id");
  CREATE INDEX "about_page_portrait_idx" ON "about_page" USING btree ("portrait_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "about_page_principles" CASCADE;
  DROP TABLE "about_page_credentials" CASCADE;
  DROP TABLE "about_page_contact_links" CASCADE;
  DROP TABLE "about_page" CASCADE;`)
}
