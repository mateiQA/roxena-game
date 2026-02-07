/**
 * BossCosti - Final boss: Costi the Gym Owner
 * Phase 1 (100-60% HP): Throws dumbbells, slow charge
 * Phase 2 (60-30% HP): Faster, ground slam shockwaves, protein shake projectiles
 * Phase 3 (30-0% HP): Enraged, all attacks faster, jumps around
 */
window.Roxena = window.Roxena || {};

Roxena.BossCosti = class BossCosti extends Roxena.Entity {
    constructor(x, y) {
        super(x, y, 64, 80);

        this.maxHp = 500;
        this.hp = this.maxHp;
        this.damage = 30;
        this.scoreValue = 5000;
        this.facing = -1;

        // States
        this.state = 'idle';
        this.activated = false;
        this.dead = false;

        // Phase tracking
        this.phase = 1;

        // Timers
        this.actionTimer = 0;
        this.actionCooldown = 90;
        this.hurtTimer = 0;
        this.flashTimer = 0;
        this.invincibleTimer = 0;
        this.animTimer = 0;

        // Charge
        this.charging = false;
        this.chargeTimer = 0;

        // Slam
        this.slamming = false;
        this.slamTimer = 0;
        this.slamJumped = false;

        // Jump attack (phase 3)
        this.jumping = false;
        this.jumpTimer = 0;

        // Projectiles queue
        this._pendingProjectile = null;
        this._pendingShockwave = null;

        // Dialogue
        this.dialogueTimer = 0;
        this.dialogue = '';

        // Dialogue pools
        this._chargeTaunts = ['CHARGE!', 'INCOMING!', "CAN'T DODGE THIS!", 'OUT OF MY WAY!', 'MOVE IT!', 'FULL SPEED!'];
        this._slamTaunts = ['GROUND SLAM!', 'FEEL THE EARTH SHAKE!', 'DOWN YOU GO!', 'EARTHQUAKE!', 'SMASH!'];
        this._throwTaunts = ['Catch this!', 'Heads up!', 'Special delivery!', 'Eat this dumbbell!', 'Think fast!', 'Gym equipment incoming!'];
        this._jumpTaunts = ["CAN'T ESCAPE!", 'NOWHERE TO HIDE!', 'UP AND OVER!', 'FLYING ELBOW!', 'AIR TIME!'];
        this._hurtTaunts = ['Is that all?!', 'Lucky shot!', 'That tickled!', "You'll pay for that!", 'Not bad, kid...', 'OOF!', 'Barely felt it!'];
        this._oilTaunts = ['DoTerra Lavender Blast!', 'DoTerra time!', 'Relax... breathe it in!', 'Aromatherapy attack!', 'This will calm you down!', 'Essential oils incoming!'];
    }

    _randomDialogue(pool) {
        return pool[Math.floor(Math.random() * pool.length)];
    }

    activate() {
        this.activated = true;
        this.dialogue = 'You dare challenge ME?!';
        this.dialogueTimer = 120;
    }

    get grounded() { return this._grounded; }
    set grounded(v) { this._grounded = v; }

    takeDamage(amount, sourceX) {
        if (this.dead || this.invincibleTimer > 0) return;

        this.hp -= amount;
        this.flashTimer = 12;
        this.invincibleTimer = 15;

        // Knockback (minimal for boss)
        const dir = this.centerX() > sourceX ? 1 : -1;
        this.vx = dir * 2;

        // Show hurt dialogue (30% chance to not interrupt other dialogue)
        if (this.dialogueTimer <= 0 || Math.random() < 0.3) {
            this.dialogue = this._randomDialogue(this._hurtTaunts);
            this.dialogueTimer = 40;
        }

        // Phase transitions
        const hpPct = this.hp / this.maxHp;
        if (hpPct <= 0.3 && this.phase < 3) {
            this.phase = 3;
            this.dialogue = "NOW I'M ANGRY!!! NO MORE GAMES!";
            this.dialogueTimer = 90;
            this.actionCooldown = 40;
            this.invincibleTimer = 60;
        } else if (hpPct <= 0.6 && this.phase < 2) {
            this.phase = 2;
            this.dialogue = 'Not bad... let me step it up!';
            this.dialogueTimer = 90;
            this.actionCooldown = 60;
            this.invincibleTimer = 60;
        }

        if (this.hp <= 0) {
            this.hp = 0;
            this.die();
        }
    }

    die() {
        this.dead = true;
        this.state = 'dead';
        this.dialogue = 'Impossible... you beat me... I need more protein...';
        this.dialogueTimer = 180;
    }

    update(dt, player, tileMap) {
        if (!this.activated || this.dead) return;

        this.animTimer += 0.15;

        // Timers
        if (this.flashTimer > 0) this.flashTimer--;
        if (this.invincibleTimer > 0) this.invincibleTimer--;
        if (this.dialogueTimer > 0) this.dialogueTimer--;
        if (this.hurtTimer > 0) this.hurtTimer--;

        // Face player
        if (!this.charging && !this.slamming) {
            this.facing = player.centerX() > this.centerX() ? 1 : -1;
        }

        // AI
        this._updateAI(player, tileMap);

        // Physics
        this.vy += Roxena.Physics.GRAVITY;
        this.vy = Roxena.Math.clamp(this.vy, -20, 20);

        this._grounded = false;
        Roxena.Collision.resolveEntityVsTileMap(this, tileMap);
    }

    _updateAI(player, tileMap) {
        if (this.charging) { this._doCharge(player); return; }
        if (this.slamming) { this._doSlam(player); return; }
        if (this.jumping) { this._doJumpAttack(player); return; }

        // Cooldown between actions
        this.actionTimer++;
        if (this.actionTimer < this.actionCooldown) {
            const dist = player.centerX() - this.centerX();
            if (Math.abs(dist) > 80) {
                this.vx = Math.sign(dist) * 1.5;
            } else {
                this.vx = 0;
            }
            return;
        }

        // Choose action
        this.actionTimer = 0;
        const roll = Math.random();

        if (this.phase === 1) {
            if (roll < 0.4) this._startCharge();
            else if (roll < 0.75) this._throwDumbbell(player);
            else this._throwDoTerraOil(player);
        } else if (this.phase === 2) {
            if (roll < 0.2) this._startCharge();
            else if (roll < 0.4) this._startSlam();
            else if (roll < 0.6) this._throwProteinShake(player);
            else if (roll < 0.8) this._throwDoTerraOil(player);
            else this._throwDumbbell(player);
        } else {
            if (roll < 0.2) this._startCharge();
            else if (roll < 0.35) this._startSlam();
            else if (roll < 0.5) this._startJumpAttack(player);
            else if (roll < 0.7) this._throwDoTerraOil(player);
            else this._throwDumbbell(player);
        }
    }

    // === CHARGE ===
    _startCharge() {
        this.charging = true;
        this.chargeTimer = 45;
        this.dialogue = this._randomDialogue(this._chargeTaunts);
        this.dialogueTimer = 30;
    }

    _doCharge(player) {
        const speed = this.phase >= 3 ? 7 : 5;
        this.vx = this.facing * speed;
        this.chargeTimer--;
        if (this.chargeTimer <= 0) {
            this.charging = false;
            this.vx = 0;
        }
    }

    // === SLAM ===
    _startSlam() {
        this.slamming = true;
        this.slamTimer = 60;
        this.slamJumped = false;
        this.dialogue = this._randomDialogue(this._slamTaunts);
        this.dialogueTimer = 30;
    }

    _doSlam(player) {
        if (!this.slamJumped) {
            this.vy = -14;
            this.vx = 0;
            this.slamJumped = true;
            this.slamTimer = 60;
            return;
        }

        if (this._grounded && this.slamJumped) {
            this._pendingShockwave = {
                x: this.centerX(),
                y: this.y + this.height,
                radius: 120 + (this.phase - 1) * 40,
                damage: 20
            };
            this.slamming = false;
            this.vx = 0;
        }

        this.slamTimer--;
        if (this.slamTimer <= 0) {
            this.slamming = false;
        }
    }

    // === JUMP ATTACK (Phase 3) ===
    _startJumpAttack(player) {
        this.jumping = true;
        this.jumpTimer = 80;
        this.vy = -16;
        const dx = player.centerX() - this.centerX();
        this.vx = Roxena.Math.clamp(dx * 0.05, -6, 6);
        this.dialogue = this._randomDialogue(this._jumpTaunts);
        this.dialogueTimer = 30;
    }

    _doJumpAttack(player) {
        this.jumpTimer--;
        if (this._grounded && this.jumpTimer < 60) {
            this.jumping = false;
            this.vx = 0;
        }
        if (this.jumpTimer <= 0) {
            this.jumping = false;
        }
    }

    // === PROJECTILES ===
    _throwDumbbell(player) {
        const dx = player.centerX() - this.centerX();
        const speed = 4 + this.phase;
        this._pendingProjectile = new Roxena.Projectile(
            this.centerX(), this.centerY() - 10,
            Math.sign(dx) * speed, -3,
            { width: 24, height: 12, damage: 20, color: '#808080', life: 120, gravity: 0.15 }
        );
        this.dialogue = this._randomDialogue(this._throwTaunts);
        this.dialogueTimer = 30;
    }

    _throwProteinShake(player) {
        const dx = player.centerX() - this.centerX();
        const dy = player.centerY() - this.centerY();
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const speed = 5;
        this._pendingProjectile = new Roxena.Projectile(
            this.centerX(), this.centerY(),
            (dx / dist) * speed, (dy / dist) * speed,
            { width: 12, height: 16, damage: 15, color: '#00FF88', life: 150, gravity: 0 }
        );
        this.dialogue = 'Have a protein shake!';
        this.dialogueTimer = 30;
    }

    // === DOTERRA OIL (stuns player) ===
    _throwDoTerraOil(player) {
        const dx = player.centerX() - this.centerX();
        const dy = player.centerY() - this.centerY();
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const speed = 4.5;
        this._pendingProjectile = new Roxena.Projectile(
            this.centerX(), this.centerY() - 10,
            (dx / dist) * speed, (dy / dist) * speed,
            { width: 14, height: 14, damage: 10, color: '#7B4FBF', life: 140, gravity: 0, stun: 12 }
        );
        this.dialogue = this._randomDialogue(this._oilTaunts);
        this.dialogueTimer = 40;
    }

    // === DRAW ===
    draw(ctx) {
        if (this.flashTimer > 0 && Math.floor(this.flashTimer / 2) % 2 === 0) return;

        ctx.save();

        const ox = this.x;
        const oy = this.y;
        const w = this.width;
        const h = this.height;

        const skinColor = this.phase === 3 ? '#CC6644' : this.phase === 2 ? '#D4956A' : '#DEB887';
        // Lakers jersey: gold/yellow
        const jerseyColor = this.phase === 3 ? '#CC9900' : '#FDB927';
        const jerseyTrim = '#552583'; // Lakers purple

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(ox + 8, oy + h - 4, w - 16, 8);

        // Legs (black joggers)
        const legBob = Math.abs(this.vx) > 0.5 ? Math.sin(this.animTimer * 2) * 4 : 0;
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(ox + 12, oy + h - 24 + legBob, 14, 24 - legBob);
        ctx.fillRect(ox + w - 26, oy + h - 24 - legBob, 14, 24 + legBob);
        // Red stripe on joggers
        ctx.fillStyle = '#8B1A1A';
        ctx.fillRect(ox + 12, oy + h - 24 + legBob, 2, 20 - legBob);
        ctx.fillRect(ox + w - 14, oy + h - 24 - legBob, 2, 20 + legBob);
        // Dark sneakers
        ctx.fillStyle = '#111';
        ctx.fillRect(ox + 8, oy + h - 6, 20, 6);
        ctx.fillRect(ox + w - 28, oy + h - 6, 20, 6);

        // Body - Lakers #23 Jersey (tank top)
        ctx.fillStyle = jerseyColor;
        ctx.fillRect(ox + 6, oy + 22, w - 12, h - 46);

        // Jersey neckline (V-shape)
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.moveTo(ox + 18, oy + 22);
        ctx.lineTo(ox + w - 18, oy + 22);
        ctx.lineTo(ox + w / 2, oy + 30);
        ctx.closePath();
        ctx.fill();

        // Jersey trim (purple borders)
        ctx.fillStyle = jerseyTrim;
        ctx.fillRect(ox + 6, oy + 22, w - 12, 2);
        ctx.fillRect(ox + 6, oy + h - 26, w - 12, 2);

        // "LAKERS" text on jersey
        ctx.fillStyle = jerseyTrim;
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('LAKERS', ox + w / 2, oy + 38);

        // #23
        ctx.font = 'bold 12px monospace';
        ctx.fillText('23', ox + w / 2, oy + 52);

        // Massive Arms (fully buffed, exposed - tank top)
        const armPump = this.charging ? Math.sin(this.animTimer * 4) * 3 : 0;

        // Full bare arms (skin)
        ctx.fillStyle = skinColor;
        // Left arm - upper
        ctx.fillRect(ox - 8, oy + 24 + armPump, 16, 32);
        // Right arm - upper
        ctx.fillRect(ox + w - 8, oy + 24 - armPump, 16, 32);

        // Massive bicep/shoulder bulge
        ctx.beginPath();
        ctx.arc(ox + 1, oy + 30 + armPump, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ox + w - 1, oy + 30 - armPump, 11, 0, Math.PI * 2);
        ctx.fill();

        // Forearm veins (buffed detail)
        ctx.strokeStyle = 'rgba(120,80,50,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ox - 3, oy + 38 + armPump);
        ctx.lineTo(ox - 1, oy + 50 + armPump);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ox + w + 3, oy + 38 - armPump);
        ctx.lineTo(ox + w + 1, oy + 50 - armPump);
        ctx.stroke();

        // Fists
        ctx.fillStyle = skinColor;
        ctx.fillRect(ox - 6, oy + 54 + armPump, 12, 8);
        ctx.fillRect(ox + w - 6, oy + 54 - armPump, 12, 8);

        // Head
        ctx.fillStyle = skinColor;
        ctx.fillRect(ox + 14, oy + 2, w - 28, 24);

        // Hair - dirty blonde, buzzed sides, styled/longer on top
        // Buzzed sides (short, darker)
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(ox + 13, oy + 2, 5, 10);
        ctx.fillRect(ox + w - 18, oy + 2, 5, 10);

        // Top hair (dirty blonde, volume, styled up and to side)
        ctx.fillStyle = '#C4A265';
        ctx.fillRect(ox + 16, oy - 4, w - 32, 10);
        // Hair volume on top (styled)
        ctx.beginPath();
        ctx.arc(ox + w / 2 + 2, oy - 2, 14, Math.PI, 0);
        ctx.fill();
        // Slight sweep to the right
        ctx.fillRect(ox + w / 2 + 4, oy - 6, 10, 5);

        // Short trimmed brown beard (neat, close-cropped)
        ctx.fillStyle = '#6B4E32';
        // Jawline beard (thin)
        ctx.fillRect(ox + 16, oy + 19, w - 32, 5);
        // Chin
        ctx.fillRect(ox + 22, oy + 23, w - 44, 3);
        // Short sideburns
        ctx.fillRect(ox + 14, oy + 12, 3, 10);
        ctx.fillRect(ox + w - 17, oy + 12, 3, 10);
        // Mustache (trimmed)
        ctx.fillRect(ox + 24, oy + 17, w - 48, 3);
        // Goatee/soul patch
        ctx.fillRect(ox + w / 2 - 3, oy + 23, 6, 3);

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.fillRect(ox + 20, oy + 8, 8, 6);
        ctx.fillRect(ox + w - 28, oy + 8, 8, 6);
        // Pupils (brown eyes)
        ctx.fillStyle = '#5C3317';
        const lookDir = this.facing === 1 ? 2 : 0;
        ctx.fillRect(ox + 22 + lookDir, oy + 9, 4, 4);
        ctx.fillRect(ox + w - 26 + lookDir, oy + 9, 4, 4);
        // Eyebrows (brown, natural)
        ctx.fillStyle = '#6B4E32';
        ctx.fillRect(ox + 19, oy + 6, 10, 2);
        ctx.fillRect(ox + w - 29, oy + 6, 10, 2);

        // Mouth
        if (this.phase === 3 || this.charging || this.slamming) {
            ctx.fillStyle = '#000';
            ctx.fillRect(ox + 24, oy + 19, w - 48, 4);
            ctx.fillStyle = '#fff';
            ctx.fillRect(ox + 26, oy + 19, 3, 2);
            ctx.fillRect(ox + w - 30, oy + 19, 3, 2);
        } else {
            // Relaxed expression
            ctx.fillStyle = '#AA6644';
            ctx.fillRect(ox + 26, oy + 20, w - 52, 2);
        }

        // Gold chain
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ox + w / 2, oy + 24, 10, 0, Math.PI);
        ctx.stroke();

        // Phase 3: red aura
        if (this.phase === 3) {
            ctx.strokeStyle = 'rgba(255,0,0,0.4)';
            ctx.lineWidth = 3;
            const auraSize = Math.sin(this.animTimer) * 4;
            ctx.strokeRect(ox - 6 - auraSize, oy - 6 - auraSize, w + 12 + auraSize * 2, h + 12 + auraSize * 2);
        }

        // HP bar
        const barW = 200;
        const barH = 8;
        const barX = this.centerX() - barW / 2;
        const barY = oy - 24;
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barW, barH);
        const hpPct = this.hp / this.maxHp;
        const hpColor = hpPct > 0.6 ? '#FF4444' : hpPct > 0.3 ? '#FF8800' : '#FF0000';
        ctx.fillStyle = hpColor;
        ctx.fillRect(barX, barY, barW * hpPct, barH);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barW, barH);

        // Boss name
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('COSTI - GYM OWNER', this.centerX(), barY - 4);

        // Phase indicator
        ctx.fillStyle = '#FFD700';
        ctx.font = '9px monospace';
        ctx.fillText(`Phase ${this.phase}`, this.centerX(), barY - 14);

        // Dialogue
        if (this.dialogueTimer > 0 && this.dialogue) {
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            const tw = ctx.measureText(this.dialogue).width + 16;
            ctx.fillRect(this.centerX() - tw / 2, oy - 54, tw, 20);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.dialogue, this.centerX(), oy - 40);
        }

        ctx.restore();
    }

    getBounds() {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
    }
};
