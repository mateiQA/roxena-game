window.Roxena = window.Roxena || {};

Roxena.Entity = class Entity {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.vx = 0;
        this.vy = 0;
        this.dead = false;
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    centerX() {
        return this.x + this.width / 2;
    }

    centerY() {
        return this.y + this.height / 2;
    }

    update(dt) {
        // Override in subclasses
    }

    draw(ctx) {
        // Default: colored rectangle
        ctx.fillStyle = '#888';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
};
