ALTER TABLE "login_tokens" ADD COLUMN "ip_hash" text;--> statement-breakpoint
CREATE INDEX "login_tokens_ip_idx" ON "login_tokens" USING btree ("ip_hash","created_at");