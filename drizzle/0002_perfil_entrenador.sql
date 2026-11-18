ALTER TABLE "users" ADD COLUMN "trainer_key" text;--> statement-breakpoint
ALTER TABLE "participants" DROP COLUMN "avatar_kind";--> statement-breakpoint
ALTER TABLE "participants" DROP COLUMN "trainer_key";--> statement-breakpoint
DROP TYPE "public"."avatar_kind";