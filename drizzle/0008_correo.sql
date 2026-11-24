CREATE TABLE "email_log" (
	"id" text PRIMARY KEY NOT NULL,
	"to_email" text NOT NULL,
	"subject" text NOT NULL,
	"kind" text,
	"provider" text,
	"ok" boolean NOT NULL,
	"detail" text,
	"ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "login_tokens" ADD COLUMN "reusable" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "email_log_fecha_idx" ON "email_log" USING btree ("created_at");