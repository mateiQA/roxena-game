window.Roxena = window.Roxena || {};

Roxena.Collision = {
    /**
     * AABB overlap test between two rectangles.
     */
    overlaps(a, b) {
        return Roxena.Math.rectOverlap(a, b);
    },

    /**
     * Resolve entity vs tilemap using proper per-axis resolution.
     * 1. Move X, resolve X collisions
     * 2. Move Y, resolve Y collisions
     */
    resolveEntityVsTileMap(entity, tileMap) {
        // --- X axis ---
        entity.x += entity.vx;

        const tilesX = tileMap.getSolidTilesNear(entity, 1);
        for (let i = 0; i < tilesX.length; i++) {
            const tile = tilesX[i];
            if (Roxena.Math.rectOverlap(entity, tile)) {
                if (entity.vx > 0) {
                    entity.x = tile.x - entity.width;
                } else if (entity.vx < 0) {
                    entity.x = tile.x + tile.width;
                }
                entity.vx = 0;
            }
        }

        // --- Y axis ---
        entity.y += entity.vy;

        const tilesY = tileMap.getSolidTilesNear(entity, 1);
        for (let i = 0; i < tilesY.length; i++) {
            const tile = tilesY[i];
            if (Roxena.Math.rectOverlap(entity, tile)) {
                if (entity.vy > 0) {
                    entity.y = tile.y - entity.height;
                    entity.vy = 0;
                    entity.grounded = true;
                } else if (entity.vy < 0) {
                    entity.y = tile.y + tile.height;
                    entity.vy = 0;
                }
            }
        }
    },

    /**
     * Check overlap between two entities (for combat/pickup).
     */
    entityVsEntity(a, b) {
        return Roxena.Math.rectOverlap(a.getBounds(), b.getBounds());
    }
};
