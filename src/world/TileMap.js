window.Roxena = window.Roxena || {};

Roxena.TileMap = class TileMap {
    constructor(tileData, theme) {
        this.theme = theme || 'kitchen';
        this.tileSize = Roxena.TILE_SIZE;
        this.rows = tileData.length;
        this.cols = tileData[0].length;
        this.widthPx = this.cols * this.tileSize;
        this.heightPx = this.rows * this.tileSize;

        // Build tile grid
        this.tiles = [];
        for (let row = 0; row < this.rows; row++) {
            this.tiles[row] = [];
            for (let col = 0; col < this.cols; col++) {
                this.tiles[row][col] = new Roxena.Tile(tileData[row][col], col, row);
            }
        }
    }

    getTileAt(col, row) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
            return null;
        }
        return this.tiles[row][col];
    }

    getTileAtPixel(x, y) {
        const col = Math.floor(x / this.tileSize);
        const row = Math.floor(y / this.tileSize);
        return this.getTileAt(col, row);
    }

    /**
     * Returns all solid tiles near an entity (tiles overlapping its bounding box + margin).
     */
    getSolidTilesNear(entity, margin) {
        margin = margin || 2;
        const ts = this.tileSize;
        const startCol = Math.max(0, Math.floor(entity.x / ts) - margin);
        const endCol = Math.min(this.cols - 1, Math.floor((entity.x + entity.width) / ts) + margin);
        const startRow = Math.max(0, Math.floor(entity.y / ts) - margin);
        const endRow = Math.min(this.rows - 1, Math.floor((entity.y + entity.height) / ts) + margin);

        const result = [];
        for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
                const tile = this.tiles[row][col];
                if (tile.solid) {
                    result.push(tile);
                }
            }
        }
        return result;
    }

    draw(ctx, camera) {
        const ts = this.tileSize;
        // Only draw tiles visible in the camera viewport
        const startCol = Math.max(0, Math.floor(camera.x / ts));
        const endCol = Math.min(this.cols - 1, Math.floor((camera.x + camera.viewportWidth) / ts));
        const startRow = Math.max(0, Math.floor(camera.y / ts));
        const endRow = Math.min(this.rows - 1, Math.floor((camera.y + camera.viewportHeight) / ts));

        for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
                this.tiles[row][col].draw(ctx, this.theme);
            }
        }
    }
};
