window.Roxena = window.Roxena || {};

Roxena.Projectile = class Projectile extends Roxena.Entity {
    constructor(x, y, vx, vy, config) {
        super(x, y, config.width || 8, config.height || 8);
        this.vx = vx;
        this.vy = vy;
        this.damage = config.damage || 10;
        this.color = config.color || '#ff4444';
        this.life = config.life || 180;  // 3 seconds max
        this.fromPlayer = config.fromPlayer || false;
        this.gravity = config.gravity || 0;
        this.stun = config.stun || 0;
    }

    update(dt) {
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        if (this.life <= 0) this.dead = true;
    }

    checkTileCollision(tileMap) {
        const tile = tileMap.getTileAtPixel(this.centerX(), this.centerY());
        if (tile && tile.solid) {
            this.dead = true;
        }
    }

    draw(ctx) {
        if (this.dead) return;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.centerX(), this.centerY(), this.width / 2, 0, Math.PI * 2);
        ctx.fill();
    }
};
