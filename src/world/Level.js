window.Roxena = window.Roxena || {};

Roxena.Level = class Level {
    constructor(config) {
        this.name = config.name;
        this.theme = config.theme || 'kitchen';

        // Build tilemap
        this.tileMap = new Roxena.TileMap(config.tiles, this.theme);

        // Build background
        const bgPreset = Roxena.BackgroundPresets[this.theme] || Roxena.BackgroundPresets.kitchen;
        this.background = new Roxena.Background({
            layers: bgPreset.layers,
            viewportWidth: 800,
            viewportHeight: 480
        });

        // Player spawn
        this.playerSpawn = {
            x: (config.playerSpawn.x || 2) * Roxena.TILE_SIZE,
            y: (config.playerSpawn.y || 12) * Roxena.TILE_SIZE
        };

        // Level dimensions in pixels
        this.widthPx = this.tileMap.widthPx;
        this.heightPx = this.tileMap.heightPx;

        // Store raw config for spawning entities later
        this.enemySpawns = config.enemies || [];
        this.collectibleSpawns = config.collectibles || [];
        this.checkpoints = (config.checkpoints || []).map(cp => ({
            x: cp.x * Roxena.TILE_SIZE,
            y: cp.y * Roxena.TILE_SIZE,
            activated: false
        }));
        this.exit = config.exit ? {
            x: config.exit.x * Roxena.TILE_SIZE,
            y: config.exit.y * Roxena.TILE_SIZE
        } : null;
    }

    draw(ctx, camera) {
        // Background (drawn at screen coords, not world coords)
        this.background.draw(ctx, camera.x, camera.y);

        // Tilemap (drawn in world coords)
        camera.applyTransform(ctx);
        this.tileMap.draw(ctx, camera);

        // Draw checkpoints
        this._drawCheckpoints(ctx);

        // Draw exit
        this._drawExit(ctx);

        camera.restoreTransform(ctx);
    }

    _drawCheckpoints(ctx) {
        for (const cp of this.checkpoints) {
            ctx.fillStyle = cp.activated ? '#ffd700' : '#aaa';
            // Flag pole
            ctx.fillRect(cp.x + 12, cp.y - 32, 4, 40);
            // Flag
            ctx.fillStyle = cp.activated ? '#ff4444' : '#888';
            ctx.beginPath();
            ctx.moveTo(cp.x + 16, cp.y - 32);
            ctx.lineTo(cp.x + 32, cp.y - 24);
            ctx.lineTo(cp.x + 16, cp.y - 16);
            ctx.closePath();
            ctx.fill();
        }
    }

    _drawExit(ctx) {
        if (!this.exit) return;
        // Pulsing green portal
        const pulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
        ctx.globalAlpha = pulse;
        ctx.fillStyle = '#00ff88';
        ctx.fillRect(this.exit.x, this.exit.y - 48, 32, 80);
        ctx.fillStyle = '#00ffaa';
        ctx.fillRect(this.exit.x + 4, this.exit.y - 44, 24, 72);
        ctx.globalAlpha = 1;
        // Arrow
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('EXIT', this.exit.x + 16, this.exit.y - 52);
    }
};
