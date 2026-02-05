"use server";

import { db } from "@/lib/db";
import { maps, mapContents } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getMaps() {
    try {
        const allMaps = await db.query.maps.findMany({
            orderBy: [desc(maps.updatedAt)],
        });
        return { success: true, data: allMaps };
    } catch (error) {
        console.error("Failed to fetch maps:", error);
        return { success: false, error: "Failed to fetch maps" };
    }
}

export async function createMap(title: string = "Untitled") {
    try {
        const [newMap] = await db.insert(maps).values({ title }).returning();

        // Create initial empty content for the map
        await db.insert(mapContents).values({
            mapId: newMap.id,
            content: { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } },
        });

        revalidatePath("/");
        return { success: true, data: newMap };
    } catch (error) {
        console.error("Failed to create map:", error);
        return { success: false, error: "Failed to create map" };
    }
}

export async function deleteMap(id: string) {
    try {
        await db.delete(maps).where(eq(maps.id, id));
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete map:", error);
        return { success: false, error: "Failed to delete map" };
    }
}

export async function getMap(id: string) {
    try {
        const map = await db.query.maps.findFirst({
            where: eq(maps.id, id),
            with: {
                content: true,
            },
        });

        if (!map) return { success: false, error: "Map not found" };

        return { success: true, data: map };
    } catch (error) {
        console.error("Failed to fetch map:", error);
        return { success: false, error: "Failed to fetch map" };
    }
}

export async function updateMapContent(mapId: string, content: any) {
    try {
        await db.update(mapContents)
            .set({ content, updatedAt: new Date() })
            .where(eq(mapContents.mapId, mapId));

        // Also update the map's metadata updated_at
        await db.update(maps)
            .set({ updatedAt: new Date() })
            .where(eq(maps.id, mapId));

        revalidatePath(`/map/${mapId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to update map content:", error);
        return { success: false, error: "Failed to update map content" };
    }
}
