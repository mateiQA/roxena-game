/**
 * Cake - Tank enemy. Big, slow, lots of HP. Spawns mini candy when below 50% HP.
 */
window.Roxena = window.Roxena || {};

Roxena.Cake = class Cake extends Roxena.Enemy {
    constructor(x, y) {
        super(x, y, 'cake');
        this.hasSpawnedMinions = false;
        this.animTimer = 0;
    }

    updateAI(player, tileMap) {
        this.patrol(tileMap);
        this.animTimer += 0.1;

        // Spawn minions at 50% HP
        if (!this.hasSpawnedMinions && this.hp <= this.maxHp * this.config.spawnMinionsAtHpPercent) {
            this.hasSpawnedMinions = true;
            // Queue minion spawns (Game.js will pick these up)
            this._pendingMinions = [
                { type: 'candy', x: this.x - 40, y: this.y },
                { type: 'candy', x: this.x + this.width + 10, y: this.y }
            ];
        }
    }

    draw(ctx) {
        if (this.state === Roxena.EnemyStates.DEAD) return;
        if (this.flashTimer > 0 && Math.floor(this.flashTimer / 2) % 2 === 0) return;

        ctx.save();

        const ox = this.x;
        const oy = this.y;
        const w = this.width;
        const h = this.height;

        // Bottom layer (chocolate)
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(ox, oy + h * 0.6, w, h * 0.4);

        // Middle layer (cream)
        ctx.fillStyle = '#FFF8DC';
        ctx.fillRect(ox + 2, oy + h * 0.35, w - 4, h * 0.28);

        // Top layer (sponge)
        ctx.fillStyle = this.config.color;
        ctx.fillRect(ox + 2, oy + h * 0.15, w - 4, h * 0.23);

        // Frosting on top (wavy)
        ctx.fillStyle = '#FFB6C1';
        ctx.beginPath();
        ctx.moveTo(ox, oy + h * 0.15);
        for (let i = 0; i <= w; i += 8) {
            const wave = Math.sin(this.animTimer + i * 0.3) * 3;
            ctx.lineTo(ox + i, oy + h * 0.1 + wave);
        }
        ctx.lineTo(ox + w, oy + h * 0.2);
        ctx.lineTo(ox, oy + h * 0.2);
        ctx.closePath();
        ctx.fill();

        // Cherry on top
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(ox + w / 2, oy + 6, 5, 0, Math.PI * 2);
        ctx.fill();
        // Cherry stem
        ctx.strokeStyle = '#006400';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ox + w / 2, oy + 2);
        ctx.lineTo(ox + w / 2 + 3, oy - 4);
        ctx.stroke();

        // Angry eyes
        ctx.fillStyle = '#fff';
        ctx.fillRect(ox + 10, oy + h * 0.35, 8, 8);
        ctx.fillRect(ox + w - 18, oy + h * 0.35, 8, 8);
        ctx.fillStyle = '#333';
        // Angry brows
        ctx.fillRect(ox + 10, oy + h * 0.35 - 3, 8, 3);
        ctx.fillRect(ox + w - 18, oy + h * 0.35 - 3, 8, 3);
        // Pupils
        const pupilOff = this.facing > 0 ? 4 : 0;
        ctx.fillRect(ox + 11 + pupilOff, oy + h * 0.35 + 3, 4, 4);
        ctx.fillRect(ox + w - 17 + pupilOff, oy + h * 0.35 + 3, 4, 4);

        // Angry mouth
        ctx.fillStyle = '#333';
        ctx.fillRect(ox + w / 2 - 8, oy + h * 0.55, 16, 4);

        // Candles (decorative)
        for (let i = 0; i < 3; i++) {
            const cx = ox + 10 + i * 14;
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(cx, oy - 4, 3, 12);
            // Flame
            ctx.fillStyle = '#FF4500';
            ctx.beginPath();
            ctx.arc(cx + 1.5, oy - 6, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // HP bar
        if (this.hp < this.maxHp) {
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x, oy - 14, this.width, 4);
            ctx.fillStyle = '#ff3333';
            ctx.fillRect(this.x, oy - 14, this.width * (this.hp / this.maxHp), 4);
        }

        ctx.restore();
    }
};
