CREATE TABLE "wishlist_images" (
	"id" text PRIMARY KEY NOT NULL,
	"item_id" text NOT NULL,
	"mime" text NOT NULL,
	"datos" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wishlist_images_item_id_unique" UNIQUE("item_id")
);
--> statement-breakpoint
ALTER TABLE "wishlist_images" ADD CONSTRAINT "wishlist_images_item_id_wishlist_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."wishlist_items"("id") ON DELETE cascade ON UPDATE no action;