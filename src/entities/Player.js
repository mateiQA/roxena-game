window.Roxena = window.Roxena || {};

Roxena.PlayerStates = {
    IDLE: 'idle',
    RUNNING: 'running',
    JUMPING: 'jumping',
    FALLING: 'falling',
    ATTACKING: 'attacking',
    HURT: 'hurt',
    DEAD: 'dead'
};

Roxena.Player = class Player extends Roxena.Entity {
    constructor(x, y) {
        super(x, y, 32, 48);

        // Movement
        this.acceleration = 0.6;
        this.maxSpeed = 5;
        this.facing = 1;

        // Jump
        this.grounded = false;
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        this.jumpHeld = false;

        // State
        this.state = Roxena.PlayerStates.IDLE;

        // Health
        this.health = 100;
        this.maxHealth = 100;
        this.lives = 3;
        this.score = 0;

        // Combat
        this.attackCooldown = 0;
        this.attackTimer = 0;
        this.attackDuration = 10;
        this.attackDamage = 25;
        this.attackCooldownMax = 20;
        this.attackHitbox = null;
        this.hitEnemies = new Set();
        this.attackType = 'punch'; // 'punch', 'kick', 'jumpkick'

        // Attack damage per type
        this._attackDamages = { punch: 25, kick: 30, jumpkick: 35 };

        // Invincibility
        this.invincibilityTimer = 0;
        this.invincibilityDuration = 90;

        // Hurt
        this.hurtTimer = 0;

        // Stun (DoTerra oil)
        this.stunTimer = 0;

        // Power-up (set externally)
        this.activePowerUp = null;
    }

    handleInput(input) {
        const physics = Roxena.Physics;

        if (this.state === Roxena.PlayerStates.HURT || this.state === Roxena.PlayerStates.DEAD) return;

        // Stunned - no input allowed
        if (this.stunTimer > 0) return;

        // Horizontal movement
        const speedMod = this.powerUps ? this.powerUps.getModifier('speed') : 1;
        const speed = (this.state === Roxena.PlayerStates.ATTACKING ? this.maxSpeed * 0.6 : this.maxSpeed) * speedMod;
        if (input.isDown('ArrowLeft') || input.isDown('KeyA')) {
            this.vx = -speed;
            this.facing = -1;
        } else if (input.isDown('ArrowRight') || input.isDown('KeyD')) {
            this.vx = speed;
            this.facing = 1;
        } else {
            this.vx = 0;
        }

        // Jump buffer
        if (input.wasPressed('Space') || input.wasPressed('ArrowUp') || input.wasPressed('KeyW')) {
            this.jumpBufferTimer = physics.JUMP_BUFFER_FRAMES;
        }

        this.jumpHeld = input.isDown('Space') || input.isDown('ArrowUp') || input.isDown('KeyW');

        // Execute jump
        if (this.jumpBufferTimer > 0 && (this.grounded || this.coyoteTimer > 0)) {
            const jumpMod = this.powerUps ? this.powerUps.getModifier('jump') : 1;
            this.vy = physics.JUMP_FORCE * jumpMod;
            this.grounded = false;
            this.coyoteTimer = 0;
            this.jumpBufferTimer = 0;
        }

        // Variable jump height
        if (!this.jumpHeld && this.vy < physics.JUMP_CUT_VELOCITY) {
            this.vy = physics.JUMP_CUT_VELOCITY;
        }

        // Attack: X/Z for punch (or jumpkick if airborne), C for kick
        if (this.attackCooldown <= 0 && this.attackTimer <= 0) {
            if (input.wasPressed('KeyX') || input.wasPressed('KeyZ')) {
                if (!this.grounded) {
                    this.startAttack('jumpkick');
                } else {
                    this.startAttack('punch');
                }
            } else if (input.wasPressed('KeyC')) {
                if (!this.grounded) {
                    this.startAttack('jumpkick');
                } else {
                    this.startAttack('kick');
                }
            }
        }
    }

    startAttack(type) {
        this.attackType = type || 'punch';
        this.attackTimer = this.attackDuration;
        this.attackCooldown = this.attackCooldownMax;
        this.attackDamage = this._attackDamages[this.attackType] || 25;
        this.hitEnemies.clear();
        this.state = Roxena.PlayerStates.ATTACKING;
    }

    getAttackHitbox() {
        if (this.attackTimer <= 0) return null;

        const scale = this.powerUps ? this.powerUps.getScale() : 1;

        switch (this.attackType) {
            case 'kick': {
                // Wider, lower hitbox at leg level
                const hbW = Math.round(28 * scale);
                const hbH = Math.round(24 * scale);
                const hbX = this.facing === 1 ? this.x + this.width : this.x - hbW;
                const hbY = this.y + 24;
                return { x: hbX, y: hbY, width: hbW, height: hbH };
            }
            case 'jumpkick': {
                // Diagonal hitbox extending forward and downward
                const hbW = Math.round(30 * scale);
                const hbH = Math.round(28 * scale);
                const hbX = this.facing === 1 ? this.x + this.width - 4 : this.x - hbW + 4;
                const hbY = this.y + 12;
                return { x: hbX, y: hbY, width: hbW, height: hbH };
            }
            default: {
                // Punch - standard hitbox
                const hbW = Math.round(24 * scale);
                const hbH = Math.round(32 * scale);
                const hbX = this.facing === 1 ? this.x + this.width : this.x - hbW;
                const hbY = this.y + 8;
                return { x: hbX, y: hbY, width: hbW, height: hbH };
            }
        }
    }

    takeDamage(amount, sourceX) {
        const isInvincible = this.powerUps && this.powerUps.hasFeature('invincible');
        if (this.invincibilityTimer > 0 || this.state === Roxena.PlayerStates.DEAD || isInvincible) return;

        this.health -= amount;
        this.hurtTimer = 8;
        this.invincibilityTimer = this.invincibilityDuration;
        this.state = Roxena.PlayerStates.HURT;
        this.attackTimer = 0;

        const dir = this.centerX() > sourceX ? 1 : -1;
        this.vx = dir * 3;
        this.vy = -4;

        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
    }

    die() {
        this.state = Roxena.PlayerStates.DEAD;
        this.lives--;
    }

    update(dt) {
        const physics = Roxena.Physics;
        const clamp = Roxena.Math.clamp;

        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.attackTimer > 0) {
            this.attackTimer--;
            if (this.attackTimer <= 0) {
                this.hitEnemies.clear();
            }
        }
        if (this.invincibilityTimer > 0) this.invincibilityTimer--;
        if (this.hurtTimer > 0) {
            this.hurtTimer--;
            if (this.hurtTimer <= 0 && this.state === Roxena.PlayerStates.HURT) {
                this.state = Roxena.PlayerStates.IDLE;
            }
        }
        if (this.stunTimer > 0) {
            this.stunTimer--;
            this.vx = 0;
        }

        this.vy += physics.GRAVITY;
        this.vy = clamp(this.vy, -physics.TERMINAL_VELOCITY, physics.TERMINAL_VELOCITY);
        this.vx = clamp(this.vx, -this.maxSpeed, this.maxSpeed);

        if (this.jumpBufferTimer > 0) this.jumpBufferTimer--;
    }

    postCollisionUpdate() {
        const physics = Roxena.Physics;
        if (this.grounded) {
            this.coyoteTimer = physics.COYOTE_FRAMES;
        } else {
            if (this.coyoteTimer > 0) this.coyoteTimer--;
        }
        this._updateState();
    }

    _updateState() {
        if (this.state === Roxena.PlayerStates.DEAD) return;
        if (this.state === Roxena.PlayerStates.HURT) return;
        if (this.attackTimer > 0) {
            this.state = Roxena.PlayerStates.ATTACKING;
            return;
        }
        if (!this.grounded) {
            this.state = this.vy < 0 ? Roxena.PlayerStates.JUMPING : Roxena.PlayerStates.FALLING;
        } else if (Math.abs(this.vx) > 0.5) {
            this.state = Roxena.PlayerStates.RUNNING;
        } else {
            this.state = Roxena.PlayerStates.IDLE;
        }
    }

    draw(ctx) {
        if (this.invincibilityTimer > 0 && Math.floor(this.invincibilityTimer / 4) % 2 === 0) {
            return;
        }

        ctx.save();

        const scale = this.powerUps ? this.powerUps.getScale() : 1;
        const isAttacking = this.attackTimer > 0;
        const f = this.facing;
        const cx = this.x + this.width / 2;
        const isRunning = this.state === Roxena.PlayerStates.RUNNING;
        const isJumping = this.state === Roxena.PlayerStates.JUMPING || this.state === Roxena.PlayerStates.FALLING;

        // Colors matching the real Roxena
        const skinColor = '#D4A574';     // Olive/tan skin
        const skinShadow = '#C09060';
        const hairColor = '#8B6B4A';     // Curly brown hair
        const hairLight = '#A67C52';     // Hair highlights
        const tankColor = '#7A9E8E';     // Sage green tank top
        const tankDark = '#6A8E7E';
        const shortsColor = '#D5D0C8';   // Light shorts
        const nailColor = '#8B1A1A';     // Dark red nails

        // Apply size scaling from supplements (scale from feet)
        if (scale !== 1) {
            ctx.translate(cx, this.y + this.height);
            ctx.scale(scale, scale);
            ctx.translate(-cx, -(this.y + this.height));
        }

        const runCycle = isRunning ? Math.sin(Date.now() * 0.015) : 0;
        const breathe = Math.sin(Date.now() * 0.003) * 0.5;

        // --- CURLY HAIR (behind body - voluminous) ---
        ctx.fillStyle = hairColor;
        // Big curly mass behind head - left side
        for (let i = 0; i < 5; i++) {
            const curlBob = isRunning ? Math.sin(Date.now() * 0.01 + i * 0.8) * 2 : Math.sin(Date.now() * 0.003 + i * 0.5) * 0.5;
            ctx.beginPath();
            ctx.arc(cx - 10 + i * 2, this.y + 4 + i * 3 + curlBob, 5 + (i < 3 ? 1 : 0), 0, Math.PI * 2);
            ctx.fill();
        }
        // Right side curls
        for (let i = 0; i < 5; i++) {
            const curlBob = isRunning ? Math.sin(Date.now() * 0.01 + i * 0.8 + 2) * 2 : Math.sin(Date.now() * 0.003 + i * 0.5 + 2) * 0.5;
            ctx.beginPath();
            ctx.arc(cx + 10 - i * 2, this.y + 4 + i * 3 + curlBob, 5 + (i < 3 ? 1 : 0), 0, Math.PI * 2);
            ctx.fill();
        }
        // Hair highlights
        ctx.fillStyle = hairLight;
        ctx.beginPath();
        ctx.arc(cx - 8, this.y + 6, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 9, this.y + 5, 3, 0, Math.PI * 2);
        ctx.fill();

        // --- LEGS (light shorts + skin) ---
        const legY = this.y + 32;
        const legW = 6;
        const legH = 14;

        if (isAttacking && this.attackType === 'kick') {
            // Shorts
            ctx.fillStyle = shortsColor;
            ctx.fillRect(cx - 9, legY - 2, 18, 6);
            // Back leg (skin)
            ctx.fillStyle = skinColor;
            const backLegX = f === 1 ? cx - 7 : cx + 1;
            ctx.fillRect(backLegX, legY + 4, legW, legH - 4);
            // Front leg (extended, skin)
            const kickLegX = f === 1 ? cx + 6 : cx - 18;
            ctx.fillRect(kickLegX, legY + 2, 12, 5);
            // Sneaker on kick foot
            ctx.fillStyle = '#333';
            const kickFootX = f === 1 ? kickLegX + 10 : kickLegX - 2;
            ctx.fillRect(kickFootX, legY + 1, 8, 7);
            // Standing sneaker
            ctx.fillRect(backLegX - 1, legY + legH, 8, 3);
        } else if (isAttacking && this.attackType === 'jumpkick') {
            // Shorts
            ctx.fillStyle = shortsColor;
            ctx.fillRect(cx - 9, legY - 4, 18, 6);
            // Back leg (tucked, skin)
            ctx.fillStyle = skinColor;
            const backLegX = f === 1 ? cx - 8 : cx + 2;
            ctx.fillRect(backLegX, legY - 2, legW, legH - 4);
            // Front leg (extended, skin)
            const kickLegX = f === 1 ? cx + 4 : cx - 20;
            ctx.fillRect(kickLegX, legY - 2, 16, 5);
            // Sneaker
            ctx.fillStyle = '#333';
            const kickFootX = f === 1 ? kickLegX + 14 : kickLegX - 2;
            ctx.fillRect(kickFootX, legY - 3, 8, 7);
        } else {
            // Shorts
            ctx.fillStyle = shortsColor;
            ctx.fillRect(cx - 9, legY - 2, 18, 6);
            // Legs (skin)
            ctx.fillStyle = skinColor;
            if (isRunning) {
                ctx.fillRect(cx - 7 + runCycle * 4, legY + 4, legW, legH - 4);
                ctx.fillRect(cx + 1 - runCycle * 4, legY + 4, legW, legH - 4);
            } else if (isJumping) {
                ctx.fillRect(cx - 8, legY, legW, legH - 2);
                ctx.fillRect(cx + 2, legY, legW, legH - 2);
            } else {
                ctx.fillRect(cx - 7, legY + 4, legW, legH - 4);
                ctx.fillRect(cx + 1, legY + 4, legW, legH - 4);
            }
            // Sneakers (dark)
            ctx.fillStyle = '#333';
            if (isRunning) {
                ctx.fillRect(cx - 8 + runCycle * 4, legY + legH, 8, 3);
                ctx.fillRect(cx + 0 - runCycle * 4, legY + legH, 8, 3);
            } else {
                ctx.fillRect(cx - 8, legY + legH, 8, 3);
                ctx.fillRect(cx + 0, legY + legH, 8, 3);
            }
        }

        // --- BODY (sage green tank top) ---
        ctx.fillStyle = skinColor;
        ctx.fillRect(cx - 8, this.y + 16, 16, 17);
        // Tank top
        ctx.fillStyle = tankColor;
        ctx.fillRect(cx - 9, this.y + 16, 18, 14);
        // Tank top neckline (round neck)
        ctx.fillStyle = skinColor;
        ctx.fillRect(cx - 4, this.y + 16, 8, 3);
        // Tank top bottom hem
        ctx.fillStyle = tankDark;
        ctx.fillRect(cx - 9, this.y + 28, 18, 2);
        // Midriff (tiny bit of skin below tank)
        ctx.fillStyle = skinColor;
        ctx.fillRect(cx - 7, this.y + 30, 14, 2);

        // --- ARMS (toned, bare - tank top) ---
        ctx.fillStyle = skinColor;
        if (isAttacking && this.attackType === 'punch') {
            // Punch arm extends forward
            const punchX = f === 1 ? cx + 8 : cx - 22;
            ctx.fillRect(punchX, this.y + 18, 14, 6);
            // Fist with red nails
            ctx.fillStyle = nailColor;
            const fistX = f === 1 ? punchX + 12 : punchX - 4;
            ctx.fillRect(fistX, this.y + 17, 6, 8);
            ctx.fillStyle = skinColor;
            ctx.fillRect(fistX + 1, this.y + 18, 4, 6);
            ctx.fillStyle = nailColor;
            ctx.fillRect(f === 1 ? fistX + 4 : fistX, this.y + 18, 2, 2);
            // Back arm
            ctx.fillStyle = skinColor;
            const backArmX = f === 1 ? cx - 12 : cx + 6;
            ctx.fillRect(backArmX, this.y + 20, 5, 10);
            // Bracelet on back wrist
            ctx.fillStyle = '#C0C0C0';
            ctx.fillRect(backArmX, this.y + 27, 5, 2);
        } else if (isAttacking && (this.attackType === 'kick' || this.attackType === 'jumpkick')) {
            ctx.fillRect(cx - 14, this.y + 16, 5, 12);
            ctx.fillRect(cx + 9, this.y + 16, 5, 12);
            // Red nails on hands
            ctx.fillStyle = nailColor;
            ctx.fillRect(cx - 14, this.y + 27, 2, 2);
            ctx.fillRect(cx + 12, this.y + 27, 2, 2);
        } else if (isRunning) {
            const armBob = runCycle * 5;
            ctx.fillRect(cx - 13, this.y + 18 + armBob, 5, 12);
            ctx.fillRect(cx + 8, this.y + 18 - armBob, 5, 12);
            // Red nails
            ctx.fillStyle = nailColor;
            ctx.fillRect(cx - 13, this.y + 29 + armBob, 2, 2);
            ctx.fillRect(cx + 11, this.y + 29 - armBob, 2, 2);
            // Bracelet (left wrist)
            ctx.fillStyle = '#C0C0C0';
            ctx.fillRect(cx - 13, this.y + 27 + armBob, 5, 2);
        } else {
            ctx.fillRect(cx - 13, this.y + 18, 5, 12);
            ctx.fillRect(cx + 8, this.y + 18, 5, 12);
            // Red nails
            ctx.fillStyle = nailColor;
            ctx.fillRect(cx - 13, this.y + 29, 2, 2);
            ctx.fillRect(cx + 11, this.y + 29, 2, 2);
            // Bracelet (left wrist)
            ctx.fillStyle = '#C0C0C0';
            ctx.fillRect(cx - 13, this.y + 27, 5, 2);
        }

        // Forearm tattoo (small mark on inner arm)
        if (!isAttacking || this.attackType !== 'punch') {
            ctx.fillStyle = '#4A6A5A';
            const tattooArmX = f === 1 ? cx - 12 : cx + 9;
            ctx.fillRect(tattooArmX, this.y + 24, 3, 3);
            ctx.fillRect(tattooArmX + 1, this.y + 23, 1, 5);
        }

        // --- HEAD ---
        ctx.fillStyle = skinColor;
        ctx.fillRect(cx - 7, this.y + 2, 14, 14);

        // Curly hair on top of head (front curls)
        ctx.fillStyle = hairColor;
        // Main hair volume on top
        ctx.beginPath();
        ctx.arc(cx, this.y + 1, 10, Math.PI, 0);
        ctx.fill();
        // Side curls framing face
        ctx.beginPath();
        ctx.arc(cx - 8, this.y + 6, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 8, this.y + 6, 4, 0, Math.PI * 2);
        ctx.fill();
        // Extra curl on top
        ctx.fillStyle = hairLight;
        ctx.beginPath();
        ctx.arc(cx + 2, this.y - 1, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx - 3, this.y, 3, 0, Math.PI * 2);
        ctx.fill();

        // Eyes (brown)
        ctx.fillStyle = '#fff';
        const eyeBaseX = f === 1 ? cx + 1 : cx - 7;
        ctx.fillRect(eyeBaseX, this.y + 7, 5, 4);
        ctx.fillStyle = '#5C3317';
        ctx.fillRect(eyeBaseX + (f === 1 ? 2 : 0), this.y + 8, 3, 3);

        // Eyelashes
        ctx.fillStyle = '#333';
        ctx.fillRect(eyeBaseX, this.y + 7, 5, 1);

        // Eyebrows
        ctx.fillStyle = '#6B4E32';
        ctx.fillRect(eyeBaseX, this.y + 5, 4, 1);

        // Nose (subtle)
        ctx.fillStyle = skinShadow;
        const noseX = f === 1 ? cx + 2 : cx - 3;
        ctx.fillRect(noseX, this.y + 10, 1, 2);

        // Mouth (natural lip color)
        ctx.fillStyle = '#C07060';
        const mouthX = f === 1 ? cx + 1 : cx - 5;
        ctx.fillRect(mouthX, this.y + 13, 4, 1);

        // Stun effect (stars circling head)
        if (this.stunTimer > 0) {
            ctx.fillStyle = '#FFFF00';
            for (let i = 0; i < 3; i++) {
                const angle = Date.now() * 0.01 + i * Math.PI * 2 / 3;
                const sx = cx + Math.cos(angle) * 12;
                const sy = this.y - 4 + Math.sin(angle) * 4;
                ctx.fillRect(sx - 2, sy - 2, 4, 4);
            }
            // Green DoTerra vapor
            ctx.fillStyle = 'rgba(100, 200, 100, 0.5)';
            for (let i = 0; i < 4; i++) {
                const vx2 = cx + Math.sin(Date.now() * 0.008 + i) * 10;
                const vy2 = this.y - 2 - i * 3;
                ctx.beginPath();
                ctx.arc(vx2, vy2, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Power-up glow effect when scaled
        if (scale > 1) {
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
            ctx.lineWidth = 2;
            const glowSize = Math.sin(Date.now() * 0.005) * 2;
            ctx.strokeRect(
                this.x - 4 - glowSize,
                this.y - 4 - glowSize,
                this.width + 8 + glowSize * 2,
                this.height + 8 + glowSize * 2
            );
        }

        ctx.restore();
    }
};
