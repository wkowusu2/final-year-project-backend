ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_phone_users_phone_fk";
--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" DROP COLUMN "phone";