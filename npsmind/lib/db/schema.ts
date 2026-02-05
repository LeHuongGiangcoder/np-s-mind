import { pgTable, text, timestamp, boolean, uuid, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const maps = pgTable("maps", {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull().default("Untitled"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    lastOpenedAt: timestamp("last_opened_at").defaultNow().notNull(),
    isStarred: boolean("is_starred").default(false).notNull(),
    isTrashed: boolean("is_trashed").default(false).notNull(),
    thumbnailUrl: text("thumbnail_url"),
});

export const mapContents = pgTable("map_contents", {
    id: uuid("id").defaultRandom().primaryKey(),
    mapId: uuid("map_id")
        .references(() => maps.id, { onDelete: "cascade" })
        .notNull()
        .unique(), // One-to-one relationship
    content: jsonb("content").default({ nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } }),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const mapsRelations = relations(maps, ({ one }) => ({
    content: one(mapContents, {
        fields: [maps.id],
        references: [mapContents.mapId],
    }),
}));

export const mapContentsRelations = relations(mapContents, ({ one }) => ({
    map: one(maps, {
        fields: [mapContents.mapId],
        references: [maps.id],
    }),
}));
