import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const uuid = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

export const eventStatus = pgEnum("event_status", ["draft", "drawn"]);
export const ruleType = pgEnum("rule_type", ["exclude", "whitelist", "pin"]);
export const imageSource = pgEnum("image_source", ["scraped", "manual", "none"]);
export const avatarKind = pgEnum("avatar_kind", ["pokemon", "entrenador"]);

/** Cuentas reales: cualquiera que haya entrado con un magic link. */
export const users = pgTable("users", {
  id: uuid(),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Magic links de un solo uso. Guardamos el hash, nunca el token. */
export const loginTokens = pgTable(
  "login_tokens",
  {
    id: uuid(),
    email: text("email").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    redirectTo: text("redirect_to"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("login_tokens_email_idx").on(t.email)],
);

export const events = pgTable(
  "events",
  {
    id: uuid(),
    name: text("name").notNull(),
    organizerId: text("organizer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    eventDate: timestamp("event_date", { withTimezone: true }),
    place: text("place"),
    budgetAmount: integer("budget_amount"),
    budgetCurrency: text("budget_currency").default("MXN").notNull(),
    message: text("message"),
    status: eventStatus("status").default("draft").notNull(),
    /** El organizador también juega (puede verlo todo con el botón de revelar). */
    organizerPlays: boolean("organizer_plays").default(true).notNull(),
    /** Evita que A y B se regalen mutuamente. */
    avoidMutual: boolean("avoid_mutual").default(false).notNull(),
    drawnAt: timestamp("drawn_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("events_organizer_idx").on(t.organizerId)],
);

export const participants = pgTable(
  "participants",
  {
    id: uuid(),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    name: text("name").notNull(),
    /** Se llena cuando la persona entra por primera vez. */
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    /** Avatar: un Pokémon de la Pokédex o un sprite de entrenador. */
    avatarKind: avatarKind("avatar_kind").default("pokemon").notNull(),
    /** Número de la Pokédex que le toca de entrada (y el que elija después). */
    pokemonId: integer("pokemon_id").notNull(),
    /** Clave del sprite de entrenador, cuando eligió uno. */
    trainerKey: text("trainer_key"),
    /** Nombre que se muestra bajo el avatar ("Snorlax", "Hilda"). */
    avatarNombre: text("avatar_nombre"),
    isOrganizer: boolean("is_organizer").default(false).notNull(),
    /** Si queda fuera del sorteo pero sigue viendo el evento. */
    isPlaying: boolean("is_playing").default(true).notNull(),
    invitedAt: timestamp("invited_at", { withTimezone: true }),
    joinedAt: timestamp("joined_at", { withTimezone: true }),
    wishlistUpdatedAt: timestamp("wishlist_updated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("participants_event_email_idx").on(t.eventId, t.email),
    index("participants_user_idx").on(t.userId),
  ],
);

/**
 * Reglas del sorteo.
 *   exclude   -> "from" no le puede regalar a "to"
 *   whitelist -> "from" SOLO le puede regalar a alguno de sus "to"
 *   pin       -> "from" le regala a "to", fijo
 */
export const rules = pgTable(
  "rules",
  {
    id: uuid(),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    type: ruleType("type").notNull(),
    fromParticipantId: text("from_participant_id")
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
    toParticipantId: text("to_participant_id")
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
    /** Solo para exclude: aplica en las dos direcciones. */
    bidirectional: boolean("bidirectional").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("rules_event_idx").on(t.eventId)],
);

export const assignments = pgTable(
  "assignments",
  {
    id: uuid(),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    giverId: text("giver_id")
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
    receiverId: text("receiver_id")
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
    notifiedAt: timestamp("notified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("assignments_giver_idx").on(t.eventId, t.giverId),
    uniqueIndex("assignments_receiver_idx").on(t.eventId, t.receiverId),
  ],
);

export const wishlistItems = pgTable(
  "wishlist_items",
  {
    id: uuid(),
    participantId: text("participant_id")
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
    url: text("url"),
    title: text("title").notNull(),
    note: text("note"),
    price: text("price"),
    siteName: text("site_name"),
    imageUrl: text("image_url"),
    imageSource: imageSource("image_source").default("none").notNull(),
    /** 1 = me encantaría, 2 = me gusta, 3 = tal vez */
    priority: integer("priority").default(2).notNull(),
    position: integer("position").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("wishlist_participant_idx").on(t.participantId)],
);

/** "Yo le compro esto": invisible para el dueno de la lista. */
export const reservations = pgTable(
  "reservations",
  {
    id: uuid(),
    itemId: text("item_id")
      .notNull()
      .references(() => wishlistItems.id, { onDelete: "cascade" }),
    byParticipantId: text("by_participant_id")
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("reservations_item_idx").on(t.itemId)],
);

/** Bitacora del botón "revelar asignaciones". */
export const revealLog = pgTable("reveal_log", {
  id: uuid(),
  eventId: text("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  events: many(events),
  participations: many(participants),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  organizer: one(users, { fields: [events.organizerId], references: [users.id] }),
  participants: many(participants),
  rules: many(rules),
  assignments: many(assignments),
}));

export const participantsRelations = relations(participants, ({ one, many }) => ({
  event: one(events, { fields: [participants.eventId], references: [events.id] }),
  user: one(users, { fields: [participants.userId], references: [users.id] }),
  wishlist: many(wishlistItems),
}));

export const wishlistItemsRelations = relations(wishlistItems, ({ one }) => ({
  participant: one(participants, {
    fields: [wishlistItems.participantId],
    references: [participants.id],
  }),
  reservation: one(reservations, {
    fields: [wishlistItems.id],
    references: [reservations.itemId],
  }),
}));

export type User = typeof users.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Participant = typeof participants.$inferSelect;
export type Rule = typeof rules.$inferSelect;
export type WishlistItem = typeof wishlistItems.$inferSelect;
