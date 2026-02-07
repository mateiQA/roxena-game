window.Roxena = window.Roxena || {};

Roxena.Candy = class Candy extends Roxena.Enemy {
    constructor(x, y) {
        super(x, y, 'candy');
        this.bounceTimer = 0;
    }

    updateAI(player, tileMap) {
        this.patrol(tileMap);

        // Bouncing animation: small hop every ~60 frames when grounded
        this.bounceTimer++;
        if (this.grounded && this.bounceTimer > 60) {
            this.vy = -3;
            this.bounceTimer = 0;
        }
    }

    draw(ctx) {
        if (this.state === Roxena.EnemyStates.DEAD) return;
        if (this.flashTimer > 0 && Math.floor(this.flashTimer / 2) % 2 === 0) return;

        ctx.save();

        // Round candy body
        ctx.fillStyle = this.config.color;
        ctx.beginPath();
        ctx.arc(this.centerX(), this.centerY(), this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // Wrapper ends
        ctx.fillStyle = this.config.colorDark;
        ctx.beginPath();
        ctx.moveTo(this.x - 4, this.centerY() - 4);
        ctx.lineTo(this.x + 4, this.centerY() - 8);
        ctx.lineTo(this.x + 4, this.centerY() + 8);
        ctx.lineTo(this.x - 4, this.centerY() + 4);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(this.x + this.width + 4, this.centerY() - 4);
        ctx.lineTo(this.x + this.width - 4, this.centerY() - 8);
        ctx.lineTo(this.x + this.width - 4, this.centerY() + 8);
        ctx.lineTo(this.x + this.width + 4, this.centerY() + 4);
        ctx.closePath();
        ctx.fill();

        // Angry eyes
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.centerX() - 7, this.centerY() - 5, 5, 5);
        ctx.fillRect(this.centerX() + 2, this.centerY() - 5, 5, 5);
        ctx.fillStyle = '#333';
        ctx.fillRect(this.centerX() - 6, this.centerY() - 3, 3, 3);
        ctx.fillRect(this.centerX() + 3, this.centerY() - 3, 3, 3);
        // Angry mouth
        ctx.fillStyle = '#333';
        ctx.fillRect(this.centerX() - 4, this.centerY() + 4, 8, 2);

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
