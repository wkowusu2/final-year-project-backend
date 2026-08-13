CREATE TABLE "admins" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" varchar(255) NOT NULL,
  "password_hash" text NOT NULL,
  "deleted" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "admin_refresh_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "admin_id" uuid NOT NULL,
  "hashed_refresh_token" text NOT NULL,
  "revoked" boolean DEFAULT false NOT NULL,
  "revoked_at" timestamp with time zone,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "admin_refresh_tokens_hashed_refresh_token_unique" UNIQUE("hashed_refresh_token")
);
--> statement-breakpoint
ALTER TABLE "admin_refresh_tokens" ADD CONSTRAINT "admin_refresh_tokens_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE cascade;
--> statement-breakpoint
INSERT INTO "admins" ("email", "password_hash") VALUES ('admin@roadplus.com', '$2b$12$OHFGF9HmNJjxlmlDkBdxseChZPijSd0GPYwlfFSIFSXxZs9jmKPkK') ON CONFLICT ("email") DO NOTHING;
