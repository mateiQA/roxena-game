window.Roxena = window.Roxena || {};

Roxena.Camera = class Camera {
    constructor(viewportWidth, viewportHeight) {
        this.x = 0;
        this.y = 0;
        this.viewportWidth = viewportWidth;
        this.viewportHeight = viewportHeight;
        this.target = null;
        this.smoothing = 0.1; // Lerp factor
        this.levelWidth = viewportWidth;
        this.levelHeight = viewportHeight;
    }

    setLevelBounds(width, height) {
        this.levelWidth = width;
        this.levelHeight = height;
    }

    follow(target) {
        this.target = target;
    }

    update() {
        if (!this.target) return;

        // Target center of viewport on the player
        const targetX = this.target.centerX() - this.viewportWidth / 2;
        const targetY = this.target.centerY() - this.viewportHeight / 2;

        // Smooth follow
        this.x = Roxena.Math.lerp(this.x, targetX, this.smoothing);
        this.y = Roxena.Math.lerp(this.y, targetY, this.smoothing);

        // Clamp to level bounds
        this.x = Roxena.Math.clamp(this.x, 0, Math.max(0, this.levelWidth - this.viewportWidth));
        this.y = Roxena.Math.clamp(this.y, 0, Math.max(0, this.levelHeight - this.viewportHeight));
    }

    applyTransform(ctx) {
        ctx.save();
        ctx.translate(-Math.round(this.x), -Math.round(this.y));
    }

    restoreTransform(ctx) {
        ctx.restore();
    }

    /**
     * Check if an entity is visible (within viewport + margin).
     */
    isVisible(entity, margin) {
        margin = margin || 64;
        return (
            entity.x + entity.width > this.x - margin &&
            entity.x < this.x + this.viewportWidth + margin &&
            entity.y + entity.height > this.y - margin &&
            entity.y < this.y + this.viewportHeight + margin
        );
    }
};
