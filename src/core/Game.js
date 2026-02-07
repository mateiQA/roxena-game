window.Roxena = window.Roxena || {};

Roxena.STATES = {
    LOADING: 'loading',
    MENU: 'menu',
    TITLE_SCREEN: 'title_screen',
    LEVEL_INTRO: 'level_intro',
    BOSS_INTRO: 'boss_intro',
    PLAYING: 'playing',
    PAUSED: 'paused',
    LEVEL_COMPLETE: 'level_complete',
    GAME_OVER: 'game_over',
    VICTORY: 'victory',
    HIGH_SCORE_ENTRY: 'high_score_entry',
    HIGH_SCORE_DISPLAY: 'high_score_display'
};

Roxena.HIGHSCORE_API = 'https://jsonblob.com/api/jsonBlob/019c388b-9ef3-72dc-9786-cb907c2e1527';

// Level descriptions for intro screens
Roxena.LevelDescriptions = [
    'The Kitchen - Where it all begins',
    'Fast Food Alley - The grease gauntlet',
    'Candy Factory - Sweet but deadly',
    "Costi's Gym - Final showdown"
];

// Enemy class registry
Roxena.EnemyClasses = {
    candy: () => Roxena.Candy,
    chips: () => Roxena.Chips,
    soda: () => Roxena.Soda,
    cake: () => Roxena.Cake
};

Roxena.Game = class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;

        this.width = canvas.width;
        this.height = canvas.height;

        this.input = new Roxena.Input();
        this.loop = new Roxena.GameLoop(
            (dt) => this.update(dt),
            () => this.render()
        );

        // Start at title screen
        this.state = Roxena.STATES.TITLE_SCREEN;

        // Camera
        this.camera = new Roxena.Camera(this.width, this.height);

        // Level
        this.currentLevelIndex = 0;
        this.level = null;

        // Player
        this.player = new Roxena.Player(100, 300);
        this.player.powerUps = new Roxena.PowerUpManager();

        // Entity arrays
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.collectibles = [];

        // Boss
        this.boss = null;
        this.bossIntroShown = false;

        // Death animation
        this.deathGrave = null;

        // Screen transition timers
        this.screenTimer = 0;

        // Floating text popups
        this.floatingTexts = [];

        // Title screen animation
        this.titleAnimTimer = 0;

        // High scores
        this.highScores = [];
        this.lastEntryName = null;
        this.highScoreLoading = false;
        this._submitName = false;
        this.nameInput = document.getElementById('name-input');
        if (this.nameInput) {
            this.nameInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this._submitName = true;
                }
            });
        }
        this._loadHighScores();
    }

    loadLevel(index) {
        const data = Roxena.LevelData[index];
        if (!data) return;

        this.currentLevelIndex = index;
        this.level = new Roxena.Level(data);

        // Place player at spawn
        this.player.x = this.level.playerSpawn.x;
        this.player.y = this.level.playerSpawn.y;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.health = this.player.maxHealth;

        // Set camera bounds and target
        this.camera.setLevelBounds(this.level.widthPx, this.level.heightPx);
        this.camera.follow(this.player);

        // Snap camera to player
        this.camera.x = this.player.centerX() - this.width / 2;
        this.camera.y = this.player.centerY() - this.height / 2;
        this.camera.x = Roxena.Math.clamp(this.camera.x, 0, Math.max(0, this.level.widthPx - this.width));
        this.camera.y = Roxena.Math.clamp(this.camera.y, 0, Math.max(0, this.level.heightPx - this.height));

        // Clear arrays
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.collectibles = [];
        this.floatingTexts = [];
        this.boss = null;
        this.bossIntroShown = false;
        this.deathGrave = null;

        // Spawn enemies
        for (const spawn of this.level.enemySpawns) {
            const EnemyClass = Roxena.EnemyClasses[spawn.type] ? Roxena.EnemyClasses[spawn.type]() : null;
            if (EnemyClass) {
                const ex = spawn.x * Roxena.TILE_SIZE;
                const ey = spawn.y * Roxena.TILE_SIZE;
                this.enemies.push(new EnemyClass(ex, ey));
            }
        }

        // Spawn boss if level has one
        if (data.boss && data.boss.type === 'costi') {
            const bx = data.boss.x * Roxena.TILE_SIZE;
            const by = data.boss.y * Roxena.TILE_SIZE;
            this.boss = new Roxena.BossCosti(bx, by);
        }

        // Spawn collectibles (auto-fix: move up if inside solid tile)
        if (this.level.collectibleSpawns) {
            const tiles = data.tiles;
            for (const itemSpawn of this.level.collectibleSpawns) {
                let spawnY = itemSpawn.y;
                // Move up until the tile at this position is air (0)
                if (tiles) {
                    while (spawnY >= 0 && tiles[spawnY] && tiles[spawnY][itemSpawn.x] !== 0) {
                        spawnY--;
                    }
                }
                const collectible = Roxena.createCollectible(
                    itemSpawn.item,
                    itemSpawn.x * Roxena.TILE_SIZE,
                    spawnY * Roxena.TILE_SIZE
                );
                if (collectible) this.collectibles.push(collectible);
            }
        }

        // Show level intro
        this.state = Roxena.STATES.LEVEL_INTRO;
        this.screenTimer = 0;
    }

    start() {
        this.loop.start();
    }

    update(dt) {
        // Title screen
        if (this.state === Roxena.STATES.TITLE_SCREEN) {
            this.titleAnimTimer += 0.02;
            if (this.input.wasPressed('Space') || this.input.wasPressed('Enter')) {
                this.loadLevel(0);
            }
            this.input.update();
            return;
        }

        // Level intro
        if (this.state === Roxena.STATES.LEVEL_INTRO) {
            this.screenTimer++;
            if (this.screenTimer > 30 && (this.input.wasPressed('Space') || this.input.wasPressed('Enter'))) {
                this.state = Roxena.STATES.PLAYING;
            }
            this.input.update();
            return;
        }

        // Boss intro
        if (this.state === Roxena.STATES.BOSS_INTRO) {
            this.screenTimer++;
            if (this.screenTimer > 30 && (this.input.wasPressed('Space') || this.input.wasPressed('Enter'))) {
                if (this.boss) this.boss.activate();
                this.state = Roxena.STATES.PLAYING;
            }
            this.input.update();
            return;
        }

        // Overlay screens
        if (this.state === Roxena.STATES.LEVEL_COMPLETE || this.state === Roxena.STATES.GAME_OVER || this.state === Roxena.STATES.VICTORY) {
            this.screenTimer++;
            if (this.screenTimer > 60 && (this.input.wasPressed('Space') || this.input.wasPressed('Enter'))) {
                if (this.state === Roxena.STATES.LEVEL_COMPLETE) {
                    this._nextLevel();
                } else if (this.state === Roxena.STATES.VICTORY) {
                    // Go to name entry for high score
                    this.state = Roxena.STATES.HIGH_SCORE_ENTRY;
                    this.lastEntryName = null;
                    if (this.nameInput) {
                        this.nameInput.value = '';
                        this.nameInput.style.pointerEvents = 'auto';
                        setTimeout(() => this.nameInput.focus(), 100);
                    }
                } else {
                    // Game over — show high scores (view only)
                    this.state = Roxena.STATES.HIGH_SCORE_DISPLAY;
                    this.lastEntryName = null;
                    this.screenTimer = 0;
                    this._loadHighScores();
                }
            }
            this.input.update();
            return;
        }

        // High score name entry
        if (this.state === Roxena.STATES.HIGH_SCORE_ENTRY) {
            // Enter from keyboard, Space from tap-zone touch, or _submitName flag from input keydown
            if (this.input.wasPressed('Enter') || this.input.wasPressed('Space') || this._submitName) {
                this._submitName = false;
                const name = (this.nameInput ? this.nameInput.value : '').trim().substring(0, 10);
                if (name.length > 0) {
                    this.lastEntryName = name;
                    if (this.nameInput) {
                        this.nameInput.blur();
                        this.nameInput.style.pointerEvents = 'none';
                    }
                    this._saveHighScore(name, this.player.score);
                    this.state = Roxena.STATES.HIGH_SCORE_DISPLAY;
                    this.screenTimer = 0;
                }
            }
            this.input.update();
            return;
        }

        // High score display
        if (this.state === Roxena.STATES.HIGH_SCORE_DISPLAY) {
            this.screenTimer++;
            if (this.screenTimer > 60 && (this.input.wasPressed('Space') || this.input.wasPressed('Enter'))) {
                this._restart();
            }
            this.input.update();
            return;
        }

        if (this.state !== Roxena.STATES.PLAYING) {
            this.input.update();
            return;
        }

        const player = this.player;

        // Handle death grave animation
        if (this.deathGrave) {
            this.deathGrave.timer--;
            this._updateParticles(dt);
            this.camera.update();
            this.input.update();

            if (this.deathGrave.timer <= 0) {
                if (player.lives <= 0) {
                    this.state = Roxena.STATES.GAME_OVER;
                    this.screenTimer = 0;
                    this.deathGrave = null;
                } else {
                    const respawn = this._getLastCheckpoint();
                    player.x = respawn.x;
                    player.y = respawn.y;
                    player.vx = 0;
                    player.vy = 0;
                    player.health = player.maxHealth;
                    player.state = Roxena.PlayerStates.IDLE;
                    player.invincibilityTimer = 90;
                    this.deathGrave = null;
                }
            }
            return;
        }

        // Handle input BEFORE resetting grounded (so attack type checks use previous frame's ground state)
        player.handleInput(this.input);
        player.grounded = false;
        player.update(dt);

        // Tile collision
        if (this.level) {
            Roxena.Collision.resolveEntityVsTileMap(player, this.level.tileMap);
        }

        // Clamp to level bounds
        if (player.x < 0) { player.x = 0; player.vx = 0; }
        if (this.level && player.x + player.width > this.level.widthPx) {
            player.x = this.level.widthPx - player.width;
            player.vx = 0;
        }

        // Checkpoints
        if (this.level) {
            for (const cp of this.level.checkpoints) {
                if (!cp.activated && Math.abs(player.centerX() - cp.x - 16) < 24 &&
                    Math.abs(player.centerY() - cp.y) < 48) {
                    cp.activated = true;
                }
            }
        }

        // Exit portal
        if (this.level && this.level.exit) {
            const ex = this.level.exit;
            if (Math.abs(player.centerX() - ex.x - 16) < 24 && Math.abs(player.centerY() - ex.y) < 48) {
                this.state = Roxena.STATES.LEVEL_COMPLETE;
                this.screenTimer = 0;
            }
        }

        // Pit death
        if (this.level && player.y > this.level.heightPx + 64) {
            this._playerDeath();
        }

        // Damage death
        if (player.state === Roxena.PlayerStates.DEAD && !this.deathGrave) {
            this._playerDeath();
        }

        player.postCollisionUpdate();

        // Update entities
        this._updateEnemies(dt);
        this._updateBoss(dt);
        this._updateProjectiles(dt);
        this._checkPlayerAttack();
        this._checkPlayerAttackBoss();
        this._checkBossDeath();
        this._checkEnemyContact();
        this._checkBossContact();
        this._checkProjectileHits();
        this._updateParticles(dt);
        this._updateCollectibles(dt);
        this._checkCollectibleCollection();
        this._updateFloatingTexts(dt);

        // Update player power-ups
        if (this.player.powerUps) {
            this.player.powerUps.update(dt);
        }

        this.camera.update();
        this.input.update();
    }

    _playerDeath() {
        const player = this.player;
        const burst = Roxena.spawnParticleBurst(player.centerX(), player.centerY(), '#FFFFFF', 12);
        this.particles.push(...burst);

        this.deathGrave = {
            x: player.centerX(),
            y: player.y + player.height,
            timer: 90
        };

        player.die();
        player.vx = 0;
        player.vy = 0;
        player.y = -200;
    }

    _nextLevel() {
        const nextIndex = this.currentLevelIndex + 1;
        if (nextIndex >= Roxena.LevelData.length) {
            this.state = Roxena.STATES.VICTORY;
            this.screenTimer = 0;
        } else {
            this.loadLevel(nextIndex);
        }
    }

    _restart() {
        this.player.lives = 3;
        this.player.health = this.player.maxHealth;
        this.player.score = 0;
        this.player.state = Roxena.PlayerStates.IDLE;
        if (this.player.powerUps) this.player.powerUps.clear();
        this.loadLevel(0);
    }

    _updateEnemies(dt) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];

            if (!enemy.activated && this.camera.isVisible(enemy, 100)) {
                enemy.activate();
            }

            if (enemy.activated) {
                enemy.update(dt, this.player, this.level.tileMap);

                if (enemy._pendingProjectile) {
                    this.projectiles.push(enemy._pendingProjectile);
                    enemy._pendingProjectile = null;
                }

                if (enemy._pendingMinions) {
                    for (const spawn of enemy._pendingMinions) {
                        const EnemyClass = Roxena.EnemyClasses[spawn.type] ? Roxena.EnemyClasses[spawn.type]() : null;
                        if (EnemyClass) {
                            const minion = new EnemyClass(spawn.x, spawn.y);
                            minion.activate();
                            this.enemies.push(minion);
                        }
                    }
                    enemy._pendingMinions = null;
                }
            }

            if (enemy.dead) {
                const burst = Roxena.spawnParticleBurst(enemy.centerX(), enemy.centerY(), enemy.config.color, 10);
                this.particles.push(...burst);
                this.player.score += enemy.scoreValue;
                this.enemies.splice(i, 1);
            }
        }
    }

    _updateBoss(dt) {
        if (!this.boss || this.boss.dead) return;

        // Show boss intro when player gets close
        if (!this.boss.activated && !this.bossIntroShown) {
            const dist = Math.abs(this.player.centerX() - this.boss.centerX());
            if (dist < 300) {
                this.bossIntroShown = true;
                this.state = Roxena.STATES.BOSS_INTRO;
                this.screenTimer = 0;
                return;
            }
            return;
        }

        if (!this.boss.activated) return;

        this.boss.update(dt, this.player, this.level.tileMap);

        if (this.boss._pendingProjectile) {
            this.projectiles.push(this.boss._pendingProjectile);
            this.boss._pendingProjectile = null;
        }

        if (this.boss._pendingShockwave) {
            const sw = this.boss._pendingShockwave;
            const dx = this.player.centerX() - sw.x;
            const dy = this.player.centerY() - sw.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < sw.radius) {
                this.player.takeDamage(sw.damage, sw.x);
            }
            for (let i = -sw.radius; i < sw.radius; i += 20) {
                const burst = Roxena.spawnParticleBurst(sw.x + i, sw.y - 4, '#FFD700', 2);
                this.particles.push(...burst);
            }
            this.boss._pendingShockwave = null;
        }
    }

    _checkBossDeath() {
        if (!this.boss || !this.boss.dead) return;
        if (this.state === Roxena.STATES.VICTORY) return; // Already handled

        this.player.score += this.boss.scoreValue;
        for (let i = 0; i < 5; i++) {
            const ox = (Math.random() - 0.5) * 60;
            const oy = (Math.random() - 0.5) * 80;
            const burst = Roxena.spawnParticleBurst(this.boss.centerX() + ox, this.boss.centerY() + oy, '#FFD700', 8);
            this.particles.push(...burst);
        }
        this.state = Roxena.STATES.VICTORY;
        this.screenTimer = 0;
    }

    _checkPlayerAttackBoss() {
        if (!this.boss || this.boss.dead) return;
        const hitbox = this.player.getAttackHitbox();
        if (!hitbox) return;
        if (this.player.hitEnemies.has(this.boss)) return;

        if (Roxena.Math.rectOverlap(hitbox, this.boss.getBounds())) {
            const damageMod = this.player.powerUps ? this.player.powerUps.getModifier('damage') : 1;
            const damage = this.player.attackDamage * damageMod;
            this.boss.takeDamage(damage, this.player.centerX());
            this.player.hitEnemies.add(this.boss);
            const burst = Roxena.spawnParticleBurst(this.boss.centerX(), this.boss.centerY(), '#fff', 5);
            this.particles.push(...burst);
        }
    }

    _checkBossContact() {
        if (!this.boss || this.boss.dead) return;
        if (this.player.invincibilityTimer > 0 || this.player.state === Roxena.PlayerStates.DEAD) return;
        if (Roxena.Math.rectOverlap(this.player.getBounds(), this.boss.getBounds())) {
            this.player.takeDamage(this.boss.damage, this.boss.centerX());
        }
    }

    _updateProjectiles(dt) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.update(dt);
            if (this.level) proj.checkTileCollision(this.level.tileMap);
            if (proj.dead) this.projectiles.splice(i, 1);
        }
    }

    _checkPlayerAttack() {
        const hitbox = this.player.getAttackHitbox();
        if (!hitbox) return;

        for (const enemy of this.enemies) {
            if (enemy.dead || this.player.hitEnemies.has(enemy)) continue;
            if (Roxena.Math.rectOverlap(hitbox, enemy.getBounds())) {
                const damageMod = this.player.powerUps ? this.player.powerUps.getModifier('damage') : 1;
                const damage = this.player.attackDamage * damageMod;
                enemy.takeDamage(damage, this.player.centerX());
                this.player.hitEnemies.add(enemy);
                const burst = Roxena.spawnParticleBurst(enemy.centerX(), enemy.centerY(), '#fff', 5);
                this.particles.push(...burst);
            }
        }
    }

    _checkEnemyContact() {
        if (this.player.invincibilityTimer > 0 || this.player.state === Roxena.PlayerStates.DEAD) return;
        for (const enemy of this.enemies) {
            if (enemy.dead || enemy.state === Roxena.EnemyStates.DEAD) continue;
            if (Roxena.Math.rectOverlap(this.player.getBounds(), enemy.getBounds())) {
                this.player.takeDamage(enemy.damage, enemy.centerX());
                break;
            }
        }
    }

    _checkProjectileHits() {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            if (proj.dead || proj.fromPlayer) continue;
            if (Roxena.Math.rectOverlap(this.player.getBounds(), proj.getBounds())) {
                this.player.takeDamage(proj.damage, proj.centerX());
                // DoTerra oil stun effect
                if (proj.stun && proj.stun > 0) {
                    this.player.stunTimer = proj.stun;
                }
                proj.dead = true;
                this.projectiles.splice(i, 1);
            }
        }
    }

    _getLastCheckpoint() {
        if (!this.level) return this.level.playerSpawn;
        let last = null;
        for (const cp of this.level.checkpoints) {
            if (cp.activated) last = cp;
        }
        return last || this.level.playerSpawn;
    }

    _updateParticles(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(dt);
            if (this.particles[i].dead) this.particles.splice(i, 1);
        }
    }

    _updateCollectibles(dt) {
        for (const collectible of this.collectibles) {
            if (!collectible.collected) collectible.update(dt);
        }
    }

    _checkCollectibleCollection() {
        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const collectible = this.collectibles[i];
            if (collectible.collected) continue;

            if (collectible.tryCollect(this.player)) {
                this._applyCollectibleEffect(collectible);
                setTimeout(() => {
                    const idx = this.collectibles.indexOf(collectible);
                    if (idx !== -1) this.collectibles.splice(idx, 1);
                }, 100);
            }
        }
    }

    _applyCollectibleEffect(collectible) {
        switch (collectible.type) {
            case 'coin':
                this.player.score += collectible.score;
                break;
            case 'health':
                this.player.health = Math.min(this.player.maxHealth, this.player.health + collectible.value);
                this.player.score += collectible.score;
                break;
            case 'powerup':
                if (this.player.powerUps) {
                    this.player.powerUps.add(collectible.value, collectible.duration);
                }
                this.player.score += collectible.score;

                // Show floating text with supplement name
                const displayName = collectible.displayName ||
                    (this.player.powerUps && this.player.powerUps.getDisplayName(collectible.value)) || '';
                if (displayName) {
                    const color = (this.player.powerUps && this.player.powerUps.getColor(collectible.value)) || '#FFF';
                    this.floatingTexts.push({
                        text: displayName,
                        x: collectible.centerX(),
                        y: collectible.centerY(),
                        timer: 60,
                        maxTimer: 60,
                        color: color
                    });
                }
                break;
        }
    }

    _updateFloatingTexts(dt) {
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.timer--;
            ft.y -= 1; // Float upward
            if (ft.timer <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    render() {
        const ctx = this.ctx;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.width, this.height);

        // Title screen
        if (this.state === Roxena.STATES.TITLE_SCREEN) {
            this._drawTitleScreen(ctx);
            return;
        }

        if (this.level) {
            this.level.draw(ctx, this.camera);
            this.camera.applyTransform(ctx);

            // Draw entities
            for (const enemy of this.enemies) {
                if (this.camera.isVisible(enemy)) enemy.draw(ctx);
            }
            if (this.boss && !this.boss.dead) this.boss.draw(ctx);
            for (const proj of this.projectiles) proj.draw(ctx);
            for (const particle of this.particles) particle.draw(ctx);
            for (const collectible of this.collectibles) {
                if (!collectible.collected) collectible.draw(ctx);
            }

            // Floating texts (world space)
            for (const ft of this.floatingTexts) {
                const alpha = ft.timer / ft.maxTimer;
                ctx.globalAlpha = alpha;
                ctx.fillStyle = ft.color;
                ctx.font = 'bold 14px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(ft.text, ft.x, ft.y);
                ctx.globalAlpha = 1;
            }

            if (this.deathGrave) {
                this._drawGrave(ctx, this.deathGrave.x, this.deathGrave.y, this.deathGrave.timer);
            }

            if (!this.deathGrave) {
                this.player.draw(ctx);
            }

            this.camera.restoreTransform(ctx);
        }

        // HUD
        this._drawHUD(ctx);

        // Overlay screens
        if (this.state === Roxena.STATES.LEVEL_INTRO) {
            this._drawLevelIntro(ctx);
        } else if (this.state === Roxena.STATES.BOSS_INTRO) {
            this._drawBossIntro(ctx);
        } else if (this.state === Roxena.STATES.LEVEL_COMPLETE) {
            this._drawLevelComplete(ctx);
        } else if (this.state === Roxena.STATES.GAME_OVER) {
            this._drawGameOver(ctx);
        } else if (this.state === Roxena.STATES.VICTORY) {
            this._drawVictory(ctx);
        } else if (this.state === Roxena.STATES.HIGH_SCORE_ENTRY) {
            this._drawHighScoreEntry(ctx);
        } else if (this.state === Roxena.STATES.HIGH_SCORE_DISPLAY) {
            this._drawHighScoreDisplay(ctx);
        }
    }

    _drawTitleScreen(ctx) {
        // Dark gradient background
        const grad = ctx.createLinearGradient(0, 0, 0, this.height);
        grad.addColorStop(0, '#1a0a2e');
        grad.addColorStop(0.5, '#2d1b4e');
        grad.addColorStop(1, '#1a0a2e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.width, this.height);

        // Animated particles in background
        const t = this.titleAnimTimer;
        for (let i = 0; i < 20; i++) {
            const px = (Math.sin(t + i * 0.7) * 0.5 + 0.5) * this.width;
            const py = (Math.cos(t * 0.8 + i * 1.3) * 0.5 + 0.5) * this.height;
            const alpha = Math.sin(t * 2 + i) * 0.3 + 0.3;
            ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Title
        const titleBob = Math.sin(t * 2) * 4;
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 42px monospace';
        ctx.textAlign = 'center';
        ctx.fillText("RoXena's", this.width / 2, this.height / 2 - 60 + titleBob);
        ctx.fillStyle = '#FF4444';
        ctx.font = 'bold 36px monospace';
        ctx.fillText('Gym Journey', this.width / 2, this.height / 2 - 15 + titleBob);

        // Subtitle
        ctx.fillStyle = '#aaa';
        ctx.font = '14px monospace';
        ctx.fillText('A fitness quest against junk food', this.width / 2, this.height / 2 + 30);

        // Prompt
        const promptAlpha = Math.sin(Date.now() * 0.004) * 0.4 + 0.6;
        ctx.fillStyle = `rgba(255, 255, 255, ${promptAlpha})`;
        ctx.font = 'bold 16px monospace';
        ctx.fillText('ontouchstart' in window ? 'Tap to start' : 'Press SPACE to start', this.width / 2, this.height / 2 + 80);

        // Controls
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '11px monospace';
        ctx.fillText('Arrows/WASD: Move | Space: Jump | X/Z: Punch | C: Kick', this.width / 2, this.height - 30);
    }

    _drawLevelIntro(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, this.width, this.height);

        // Level number
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`LEVEL ${this.currentLevelIndex + 1}`, this.width / 2, this.height / 2 - 60);

        // Level name
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 32px monospace';
        ctx.fillText(this.level ? this.level.name : '', this.width / 2, this.height / 2 - 20);

        // Description
        const desc = Roxena.LevelDescriptions[this.currentLevelIndex] || '';
        ctx.fillStyle = '#aaa';
        ctx.font = '14px monospace';
        ctx.fillText(desc, this.width / 2, this.height / 2 + 20);

        // Prompt
        if (this.screenTimer > 30) {
            const promptAlpha = Math.sin(Date.now() * 0.004) * 0.4 + 0.6;
            ctx.fillStyle = `rgba(255, 255, 255, ${promptAlpha})`;
            ctx.font = '14px monospace';
            ctx.fillText('ontouchstart' in window ? 'Tap to begin' : 'Press SPACE to begin', this.width / 2, this.height / 2 + 70);
        }
    }

    _drawBossIntro(ctx) {
        ctx.fillStyle = 'rgba(40,0,0,0.9)';
        ctx.fillRect(0, 0, this.width, this.height);

        // BOSS FIGHT header
        ctx.fillStyle = '#FF0000';
        ctx.font = 'bold 40px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('BOSS FIGHT', this.width / 2, this.height / 2 - 70);

        // Boss name
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 28px monospace';
        ctx.fillText('COSTI', this.width / 2, this.height / 2 - 20);

        ctx.fillStyle = '#fff';
        ctx.font = '16px monospace';
        ctx.fillText('THE GYM OWNER', this.width / 2, this.height / 2 + 10);

        // Boss taunt
        ctx.fillStyle = '#FF8888';
        ctx.font = 'italic 14px monospace';
        ctx.fillText('"You dare challenge ME in MY gym?!"', this.width / 2, this.height / 2 + 50);

        // Prompt
        if (this.screenTimer > 30) {
            const promptAlpha = Math.sin(Date.now() * 0.004) * 0.4 + 0.6;
            ctx.fillStyle = `rgba(255, 255, 255, ${promptAlpha})`;
            ctx.font = 'bold 14px monospace';
            ctx.fillText('ontouchstart' in window ? 'Tap to fight!' : 'Press SPACE to fight!', this.width / 2, this.height / 2 + 100);
        }
    }

    _drawGrave(ctx, x, y, timer) {
        const alpha = Math.min(1, timer / 30);
        ctx.globalAlpha = alpha;

        ctx.fillStyle = '#888888';
        ctx.fillRect(x - 3, y - 40, 6, 40);
        ctx.fillRect(x - 12, y - 32, 24, 6);

        ctx.fillStyle = '#AAAAAA';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('RIP', x, y - 14);

        const glow = Math.sin(timer * 0.2) * 0.3 + 0.3;
        ctx.fillStyle = `rgba(255, 255, 255, ${glow})`;
        ctx.beginPath();
        ctx.arc(x, y - 24, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
    }

    _drawLevelComplete(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('LEVEL COMPLETE!', this.width / 2, this.height / 2 - 40);

        ctx.fillStyle = '#fff';
        ctx.font = '18px monospace';
        ctx.fillText(`Score: ${this.player.score}`, this.width / 2, this.height / 2 + 10);

        if (this.screenTimer > 60) {
            ctx.fillStyle = '#aaa';
            ctx.font = '14px monospace';
            ctx.fillText('ontouchstart' in window ? 'Tap to continue' : 'Press SPACE to continue', this.width / 2, this.height / 2 + 60);
        }
    }

    _drawGameOver(ctx) {
        ctx.fillStyle = 'rgba(80,0,0,0.8)';
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.fillStyle = '#FF4444';
        ctx.font = 'bold 40px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 40);

        ctx.fillStyle = '#fff';
        ctx.font = '18px monospace';
        ctx.fillText(`Final Score: ${this.player.score}`, this.width / 2, this.height / 2 + 10);

        if (this.screenTimer > 60) {
            ctx.fillStyle = '#aaa';
            ctx.font = '14px monospace';
            ctx.fillText('ontouchstart' in window ? 'Tap to try again' : 'Press SPACE to try again', this.width / 2, this.height / 2 + 60);
        }
    }

    _drawVictory(ctx) {
        ctx.fillStyle = 'rgba(0,50,0,0.8)';
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 32px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('VICTORY!', this.width / 2, this.height / 2 - 60);

        ctx.fillStyle = '#fff';
        ctx.font = '16px monospace';
        ctx.fillText('Roxena defeated Costi!', this.width / 2, this.height / 2 - 20);
        ctx.fillText("Now you can train with the pro's!", this.width / 2, this.height / 2 + 10);

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 20px monospace';
        ctx.fillText(`Final Score: ${this.player.score}`, this.width / 2, this.height / 2 + 50);

        if (this.screenTimer > 60) {
            ctx.fillStyle = '#aaa';
            ctx.font = '14px monospace';
            ctx.fillText('ontouchstart' in window ? 'Tap to continue' : 'Press SPACE to continue', this.width / 2, this.height / 2 + 90);
        }
    }

    _drawHighScoreEntry(ctx) {
        ctx.fillStyle = 'rgba(0,0,40,0.9)';
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 28px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('ENTER YOUR NAME', this.width / 2, this.height / 2 - 80);

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 20px monospace';
        ctx.fillText(`Score: ${this.player.score}`, this.width / 2, this.height / 2 - 50);

        // Draw the typed name
        const name = this.nameInput ? this.nameInput.value : '';
        const displayName = name || '_';

        // Text box background
        const boxW = 260;
        const boxH = 44;
        const boxX = this.width / 2 - boxW / 2;
        const boxY = this.height / 2 - boxH / 2 - 5;
        ctx.fillStyle = '#1a1a3e';
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        // Typed text
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px monospace';
        ctx.fillText(displayName, this.width / 2, this.height / 2 + 8);

        // Blinking cursor
        if (name.length < 10 && Math.floor(Date.now() / 500) % 2 === 0) {
            const textWidth = ctx.measureText(name).width;
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(this.width / 2 + textWidth / 2 + 2, boxY + 8, 2, boxH - 16);
        }

        ctx.fillStyle = '#aaa';
        ctx.font = '14px monospace';
        if ('ontouchstart' in window) {
            ctx.fillText('Type your name, then tap SUBMIT', this.width / 2, this.height / 2 + 50);
            // Draw submit button for mobile
            const btnW = 120;
            const btnH = 36;
            const btnX = this.width / 2 - btnW / 2;
            const btnY = this.height / 2 + 62;
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(btnX, btnY, btnW, btnH);
            ctx.fillStyle = '#000';
            ctx.font = 'bold 16px monospace';
            ctx.fillText('SUBMIT', this.width / 2, btnY + 24);
        } else {
            ctx.fillText('Press ENTER to submit', this.width / 2, this.height / 2 + 50);
        }

        ctx.fillStyle = '#666';
        ctx.font = '11px monospace';
        ctx.fillText(`${name.length}/10 characters`, this.width / 2, this.height / 2 + 80);
    }

    _drawHighScoreDisplay(ctx) {
        ctx.fillStyle = 'rgba(0,0,40,0.9)';
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 28px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('HIGH SCORES', this.width / 2, 80);

        if (this.highScoreLoading) {
            ctx.fillStyle = '#aaa';
            ctx.font = '16px monospace';
            ctx.fillText('Loading...', this.width / 2, this.height / 2);
        } else if (this.highScores.length === 0) {
            ctx.fillStyle = '#aaa';
            ctx.font = '16px monospace';
            ctx.fillText('No scores yet', this.width / 2, this.height / 2);
        } else {
            const startY = 130;
            const rowH = 40;
            for (let i = 0; i < this.highScores.length && i < 5; i++) {
                const entry = this.highScores[i];
                const y = startY + i * rowH;
                const isNew = this.lastEntryName && entry.name === this.lastEntryName && entry.score === this.player.score;

                // Highlight row
                if (isNew) {
                    ctx.fillStyle = 'rgba(255,215,0,0.15)';
                    ctx.fillRect(this.width / 2 - 200, y - 18, 400, 32);
                }

                // Rank
                ctx.fillStyle = isNew ? '#FFD700' : '#888';
                ctx.font = 'bold 18px monospace';
                ctx.textAlign = 'left';
                ctx.fillText(`#${i + 1}`, this.width / 2 - 180, y);

                // Name
                ctx.fillStyle = isNew ? '#FFD700' : '#fff';
                ctx.textAlign = 'left';
                ctx.fillText(entry.name, this.width / 2 - 100, y);

                // Score
                ctx.textAlign = 'right';
                ctx.fillText(entry.score.toLocaleString(), this.width / 2 + 180, y);
            }
        }

        if (this.screenTimer > 60) {
            ctx.fillStyle = '#aaa';
            ctx.font = '14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('ontouchstart' in window ? 'Tap to play again' : 'Press SPACE to play again', this.width / 2, this.height - 40);
        }
    }

    _loadHighScores() {
        this.highScoreLoading = true;
        fetch(Roxena.HIGHSCORE_API)
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) {
                    this.highScores = data.sort((a, b) => b.score - a.score).slice(0, 5);
                    try { localStorage.setItem('roxena_highscores', JSON.stringify(this.highScores)); } catch(e) {}
                }
                this.highScoreLoading = false;
            })
            .catch(() => {
                // Fall back to localStorage
                try {
                    const cached = JSON.parse(localStorage.getItem('roxena_highscores') || '[]');
                    if (Array.isArray(cached)) this.highScores = cached;
                } catch(e) {}
                this.highScoreLoading = false;
            });
    }

    _saveHighScore(name, score) {
        this.highScoreLoading = true;
        // Fetch latest, merge, save
        fetch(Roxena.HIGHSCORE_API)
            .then(r => r.json())
            .then(data => {
                if (!Array.isArray(data)) data = [];
                data.push({ name: name, score: score });
                data.sort((a, b) => b.score - a.score);
                data = data.slice(0, 5);
                this.highScores = data;
                try { localStorage.setItem('roxena_highscores', JSON.stringify(data)); } catch(e) {}
                return fetch(Roxena.HIGHSCORE_API, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            })
            .then(() => { this.highScoreLoading = false; })
            .catch(() => {
                // Save locally if network fails
                this.highScores.push({ name: name, score: score });
                this.highScores.sort((a, b) => b.score - a.score);
                this.highScores = this.highScores.slice(0, 5);
                try { localStorage.setItem('roxena_highscores', JSON.stringify(this.highScores)); } catch(e) {}
                this.highScoreLoading = false;
            });
    }

    _drawHUD(ctx) {
        const player = this.player;

        // Don't draw HUD on title/highscore screens
        if (this.state === Roxena.STATES.TITLE_SCREEN ||
            this.state === Roxena.STATES.HIGH_SCORE_ENTRY ||
            this.state === Roxena.STATES.HIGH_SCORE_DISPLAY) return;

        // Top bar background
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, this.width, 50);

        // Health bar
        ctx.fillStyle = '#333';
        ctx.fillRect(10, 8, 150, 16);
        const hpPct = player.health / player.maxHealth;
        ctx.fillStyle = hpPct > 0.6 ? '#2ecc71' : hpPct > 0.3 ? '#f1c40f' : '#e74c3c';
        ctx.fillRect(10, 8, 150 * hpPct, 16);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(10, 8, 150, 16);

        // HP text
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${player.health}/${player.maxHealth}`, 85, 20);

        // Lives
        ctx.textAlign = 'left';
        ctx.fillStyle = '#e74c3c';
        ctx.font = '14px monospace';
        for (let i = 0; i < player.lives; i++) {
            ctx.fillText('\u2665', 170 + i * 16, 21);
        }

        // Score
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`Score: ${player.score}`, this.width - 10, 20);

        // Level name
        if (this.level) {
            ctx.fillStyle = '#aaa';
            ctx.font = '12px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(`${this.currentLevelIndex + 1}/4 - ${this.level.name}`, this.width - 10, 40);
        }

        // Power-up icons
        if (this.player.powerUps) {
            this.player.powerUps.drawIcons(ctx, this.width / 2 - 60, 60);
        }

        // Controls hint (hide on touch devices where buttons are visible)
        if (!('ontouchstart' in window)) {
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = '11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('Arrows/WASD: Move | Space: Jump | X/Z: Punch | C: Kick', this.width / 2, this.height - 8);
        }
    }
};
