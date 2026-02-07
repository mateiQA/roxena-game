window.Roxena = window.Roxena || {};

Roxena.EnemyStates = {
    PATROL: 'patrol',
    CHASE: 'chase',
    ATTACK: 'attack',
    HURT: 'hurt',
    DEAD: 'dead'
};

Roxena.Enemy = class Enemy extends Roxena.Entity {
    constructor(x, y, type) {
        const config = Roxena.EnemyConfigs[type];
        super(x, y, config.width, config.height);

        this.type = type;
        this.config = config;

        // Stats
        this.hp = config.hp;
        this.maxHp = config.hp;
        this.damage = config.damage;
        this.speed = config.speed;
        this.scoreValue = config.score;

        // Movement
        this.facing = -1;  // Start moving left
        this.patrolDir = -1;

        // State
        this.state = Roxena.EnemyStates.PATROL;
        this.hurtTimer = 0;
        this.flashTimer = 0;
        this.activated = false; // Only active when camera is near

        // Ranged enemies
        this.fireTimer = 0;
    }

    activate() {
        this.activated = true;
    }

    takeDamage(amount, sourceX) {
        if (this.state === Roxena.EnemyStates.DEAD) return;

        this.hp -= amount;
        this.hurtTimer = 12;
        this.flashTimer = 12;
        this.state = Roxena.EnemyStates.HURT;

        // Knockback away from source
        const dir = this.centerX() > sourceX ? 1 : -1;
        this.vx = dir * 4;
        this.vy = -3;

        if (this.hp <= 0) {
            this.hp = 0;
            this.die();
        }
    }

    die() {
        this.state = Roxena.EnemyStates.DEAD;
        this.dead = true;
    }

    update(dt, player, tileMap) {
        if (!this.activated || this.state === Roxena.EnemyStates.DEAD) return;

        // Hurt state cooldown
        if (this.hurtTimer > 0) {
            this.hurtTimer--;
            if (this.hurtTimer <= 0) {
                this.state = Roxena.EnemyStates.PATROL;
            }
        }
        if (this.flashTimer > 0) this.flashTimer--;

        // AI behavior (override in subclasses)
        if (this.state !== Roxena.EnemyStates.HURT) {
            this.updateAI(player, tileMap);
        }

        // Physics
        this.vy += Roxena.Physics.GRAVITY;
        this.vy = Roxena.Math.clamp(this.vy, -Roxena.Physics.TERMINAL_VELOCITY, Roxena.Physics.TERMINAL_VELOCITY);

        // Tile collision (applies movement per-axis internally)
        this.grounded = false;
        Roxena.Collision.resolveEntityVsTileMap(this, tileMap);

        // Apply friction when grounded and not in hurt knockback
        if (this.grounded && this.state !== Roxena.EnemyStates.HURT) {
            // Friction handled by AI setting vx directly
        } else if (this.grounded && this.state === Roxena.EnemyStates.HURT) {
            this.vx *= 0.8;
        }

        // Fire timer for ranged enemies
        if (this.fireTimer > 0) this.fireTimer--;
    }

    updateAI(player, tileMap) {
        // Default: patrol
        this.patrol(tileMap);
    }

    patrol(tileMap) {
        // Move in current direction
        this.vx = this.patrolDir * this.speed;
        this.facing = this.patrolDir;

        // Check for edge: is there ground ahead and below?
        const aheadX = this.patrolDir > 0 ? this.x + this.width + 2 : this.x - 2;
        const belowY = this.y + this.height + 4;
        const tileAhead = tileMap.getTileAtPixel(aheadX, this.centerY());
        const tileBelow = tileMap.getTileAtPixel(aheadX, belowY);

        // Reverse if wall ahead or no ground ahead
        if ((tileAhead && tileAhead.solid) || (this.grounded && (!tileBelow || !tileBelow.solid))) {
            this.patrolDir *= -1;
            this.vx = this.patrolDir * this.speed;
            this.facing = this.patrolDir;
        }
    }

    distanceTo(player) {
        const dx = this.centerX() - player.centerX();
        const dy = this.centerY() - player.centerY();
        return Math.sqrt(dx * dx + dy * dy);
    }

    draw(ctx) {
        if (this.state === Roxena.EnemyStates.DEAD) return;

        // Flash when hurt
        if (this.flashTimer > 0 && Math.floor(this.flashTimer / 2) % 2 === 0) return;

        const cfg = this.config;
        ctx.save();

        // Body
        ctx.fillStyle = cfg.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Darker inner
        ctx.fillStyle = cfg.colorDark;
        ctx.fillRect(this.x + 2, this.y + 2, this.width - 4, this.height - 4);

        // Angry eyes
        ctx.fillStyle = '#fff';
        const eyeSize = 6;
        const eyeY = this.y + 6;
        ctx.fillRect(this.x + 4, eyeY, eyeSize, eyeSize);
        ctx.fillRect(this.x + this.width - 4 - eyeSize, eyeY, eyeSize, eyeSize);
        // Angry brows
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x + 4, eyeY - 2, eyeSize, 2);
        ctx.fillRect(this.x + this.width - 4 - eyeSize, eyeY - 2, eyeSize, 2);
        // Pupils
        const pupilOff = this.facing > 0 ? 3 : 0;
        ctx.fillRect(this.x + 4 + pupilOff, eyeY + 2, 3, 3);
        ctx.fillRect(this.x + this.width - 4 - eyeSize + pupilOff, eyeY + 2, 3, 3);

        // Label
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(cfg.label, this.centerX(), this.y + this.height - 4);

        // HP bar (if damaged)
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
