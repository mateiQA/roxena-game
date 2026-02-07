window.Roxena = window.Roxena || {};

Roxena.Particle = class Particle extends Roxena.Entity {
    constructor(x, y, config) {
        const size = config.size || 4;
        super(x, y, size, size);
        this.vx = config.vx || (Math.random() - 0.5) * 6;
        this.vy = config.vy || -(Math.random() * 4 + 2);
        this.color = config.color || '#fff';
        this.life = config.life || 30;
        this.maxLife = this.life;
        this.gravity = config.gravity !== undefined ? config.gravity : 0.15;
        this.fadeOut = config.fadeOut !== undefined ? config.fadeOut : true;
    }

    update(dt) {
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        if (this.life <= 0) this.dead = true;
    }

    draw(ctx) {
        if (this.dead) return;
        ctx.globalAlpha = this.fadeOut ? (this.life / this.maxLife) : 1;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.globalAlpha = 1;
    }
};

/**
 * Spawn a burst of particles at a position.
 */
Roxena.spawnParticleBurst = function (x, y, color, count) {
    count = count || 8;
    const particles = [];
    for (let i = 0; i < count; i++) {
        particles.push(new Roxena.Particle(x, y, {
            color: color,
            vx: (Math.random() - 0.5) * 8,
            vy: -(Math.random() * 5 + 1),
            life: 20 + Math.floor(Math.random() * 20),
            size: 2 + Math.floor(Math.random() * 4)
        }));
    }
    return particles;
};
