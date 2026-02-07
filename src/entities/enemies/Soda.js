/**
 * Soda - Charge enemy. Patrols until it detects the player, then charges at high speed.
 */
window.Roxena = window.Roxena || {};

Roxena.Soda = class Soda extends Roxena.Enemy {
    constructor(x, y) {
        super(x, y, 'soda');
        this.charging = false;
        this.chargeTimer = 0;
        this.windupTimer = 0;
        this.shakeOffset = 0;
    }

    updateAI(player, tileMap) {
        const dist = this.distanceTo(player);

        if (this.charging) {
            // Charge at player
            this.vx = this.facing * this.config.chargeSpeed;
            this.chargeTimer--;

            if (this.chargeTimer <= 0 || this._hitWall(tileMap)) {
                this.charging = false;
                this.windupTimer = 0;
                this.vx = 0;
            }
        } else if (this.windupTimer > 0) {
            // Wind-up animation before charging
            this.vx = 0;
            this.windupTimer--;
            this.shakeOffset = (Math.random() - 0.5) * 4;

            if (this.windupTimer <= 0) {
                this.charging = true;
                this.chargeTimer = 60;
                this.shakeOffset = 0;
            }
        } else if (dist < this.config.detectionRange) {
            // Detect player - start windup
            this.facing = player.centerX() > this.centerX() ? 1 : -1;
            this.windupTimer = 30;
        } else {
            // Patrol
            this.patrol(tileMap);
        }
    }

    _hitWall(tileMap) {
        const aheadX = this.facing > 0 ? this.x + this.width + 2 : this.x - 2;
        const tile = tileMap.getTileAtPixel(aheadX, this.centerY());
        return tile && tile.solid;
    }

    draw(ctx) {
        if (this.state === Roxena.EnemyStates.DEAD) return;
        if (this.flashTimer > 0 && Math.floor(this.flashTimer / 2) % 2 === 0) return;

        ctx.save();

        const ox = this.x + this.shakeOffset;
        const oy = this.y;

        // Soda can body
        ctx.fillStyle = this.config.color;
        // Rounded rectangle shape
        const r = 4;
        ctx.beginPath();
        ctx.moveTo(ox + r, oy);
        ctx.lineTo(ox + this.width - r, oy);
        ctx.quadraticCurveTo(ox + this.width, oy, ox + this.width, oy + r);
        ctx.lineTo(ox + this.width, oy + this.height - r);
        ctx.quadraticCurveTo(ox + this.width, oy + this.height, ox + this.width - r, oy + this.height);
        ctx.lineTo(ox + r, oy + this.height);
        ctx.quadraticCurveTo(ox, oy + this.height, ox, oy + this.height - r);
        ctx.lineTo(ox, oy + r);
        ctx.quadraticCurveTo(ox, oy, ox + r, oy);
        ctx.fill();

        // Can top (silver tab)
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(ox + 4, oy, this.width - 8, 6);
        ctx.fillStyle = '#888';
        ctx.fillRect(ox + 8, oy + 1, 8, 4);

        // Label band
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(ox + 2, oy + 14, this.width - 4, 10);
        ctx.fillStyle = this.config.colorDark;
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SODA', this.centerX(), oy + 22);

        // Angry eyes
        ctx.fillStyle = '#fff';
        ctx.fillRect(ox + 4, oy + 8, 5, 5);
        ctx.fillRect(ox + this.width - 9, oy + 8, 5, 5);
        ctx.fillStyle = '#333';
        const pupilOff = this.facing > 0 ? 2 : 0;
        ctx.fillRect(ox + 5 + pupilOff, oy + 10, 3, 3);
        ctx.fillRect(ox + this.width - 8 + pupilOff, oy + 10, 3, 3);

        // Fizz when charging
        if (this.charging) {
            ctx.fillStyle = '#FFFFFF';
            for (let i = 0; i < 5; i++) {
                const fx = ox + Math.random() * this.width;
                const fy = oy - Math.random() * 12;
                ctx.beginPath();
                ctx.arc(fx, fy, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Warning indicator when winding up
        if (this.windupTimer > 0) {
            ctx.fillStyle = '#FF0000';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('!', this.centerX(), oy - 10);
        }

        // HP bar
        if (this.hp < this.maxHp) {
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x, oy - 8, this.width, 4);
            ctx.fillStyle = '#ff3333';
            ctx.fillRect(this.x, oy - 8, this.width * (this.hp / this.maxHp), 4);
        }

        ctx.restore();
    }
};
