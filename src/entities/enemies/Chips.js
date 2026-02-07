window.Roxena = window.Roxena || {};

Roxena.Chips = class Chips extends Roxena.Enemy {
    constructor(x, y) {
        super(x, y, 'chips');
        this.fireTimer = this.config.fireRate;
    }

    updateAI(player, tileMap) {
        this.patrol(tileMap);

        // Ranged attack: throw chip projectiles at player
        const dist = this.distanceTo(player);
        if (dist < this.config.detectionRange && this.fireTimer <= 0) {
            this.fireTimer = this.config.fireRate;
            // Return projectile to be added by game
            this._pendingProjectile = this._createProjectile(player);
        }
    }

    _createProjectile(player) {
        const dx = player.centerX() - this.centerX();
        const dy = player.centerY() - this.centerY();
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = this.config.projectileSpeed;
        const vx = (dx / dist) * speed;
        const vy = (dy / dist) * speed;

        return new Roxena.Projectile(
            this.centerX() - 4,
            this.centerY() - 4,
            vx, vy,
            {
                width: 8,
                height: 8,
                damage: this.config.projectileDamage,
                color: '#ffa500',
                life: 120,
                gravity: 0.05
            }
        );
    }

    draw(ctx) {
        if (this.state === Roxena.EnemyStates.DEAD) return;
        if (this.flashTimer > 0 && Math.floor(this.flashTimer / 2) % 2 === 0) return;

        ctx.save();

        // Triangular chip bag shape
        ctx.fillStyle = this.config.color;
        ctx.beginPath();
        ctx.moveTo(this.centerX(), this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.closePath();
        ctx.fill();

        // Darker border
        ctx.strokeStyle = this.config.colorDark;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Angry eyes
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.centerX() - 7, this.centerY() - 2, 5, 5);
        ctx.fillRect(this.centerX() + 2, this.centerY() - 2, 5, 5);
        ctx.fillStyle = '#333';
        ctx.fillRect(this.centerX() - 6, this.centerY(), 3, 3);
        ctx.fillRect(this.centerX() + 3, this.centerY(), 3, 3);

        // HP bar
        if (this.hp < this.maxHp) {
            const barW = this.width;
            const barH = 4;
            const barY = this.y - 8;
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x, barY, barW, barH);
            ctx.fillStyle = '#ff3333';
            ctx.fillRect(this.x, barY, barW * (this.hp / this.maxHp), barH);
        }

        ctx.restore();
    }
};
