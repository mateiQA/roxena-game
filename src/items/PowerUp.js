/**
 * PowerUp - Manages active power-up effects (fitness supplements)
 */
(function() {
    'use strict';

    const PowerUpTypes = {
        CREATINE: 'creatine',
        PROTEIN_SHAKE: 'protein_shake',
        PRE_WORKOUT: 'pre_workout'
    };

    const PowerUpInfo = {
        creatine: {
            displayName: 'CREATINE',
            color: '#FF4444',
            icon: 'CR',
            scale: 1.2
        },
        protein_shake: {
            displayName: 'PROTEIN SHAKE',
            color: '#44FF44',
            icon: 'PR',
            scale: 1.15
        },
        pre_workout: {
            displayName: 'PRE-WORKOUT',
            color: '#FFFF00',
            icon: 'PW',
            scale: 1.3
        }
    };

    class PowerUp {
        constructor(type, duration) {
            this.type = type;
            this.duration = duration;
            this.timeRemaining = duration;
            this.active = true;
            this.flashTime = 0;
            this.info = PowerUpInfo[type] || { displayName: type, color: '#FFF', icon: '?', scale: 1 };
        }

        update(dt) {
            if (!this.active) return;
            this.timeRemaining -= dt;
            this.flashTime += 0.2;
            if (this.timeRemaining <= 0) {
                this.active = false;
            }
        }

        getModifier(stat) {
            if (!this.active) return 1;
            switch (this.type) {
                case PowerUpTypes.CREATINE:
                    return stat === 'damage' ? 2 : 1;
                case PowerUpTypes.PROTEIN_SHAKE:
                    if (stat === 'speed') return 1.5;
                    if (stat === 'jump') return 1.3;
                    return 1;
                case PowerUpTypes.PRE_WORKOUT:
                    if (stat === 'speed') return 1.5;
                    return 1;
                default:
                    return 1;
            }
        }

        hasFeature(feature) {
            if (!this.active) return false;
            if (this.type === PowerUpTypes.PRE_WORKOUT && feature === 'invincible') return true;
            return false;
        }

        getScale() {
            if (!this.active) return 1;
            return this.info.scale || 1;
        }

        drawIcon(ctx, x, y, size = 32) {
            if (!this.active) return;

            const alpha = this.timeRemaining < 3 ? (Math.sin(this.flashTime * 2) * 0.3 + 0.7) : 1;
            ctx.globalAlpha = alpha;

            // Background circle
            ctx.fillStyle = this.info.color;
            ctx.beginPath();
            ctx.arc(x, y, size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Icon text
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.info.icon, x, y);

            ctx.globalAlpha = 1;

            // Timer bar below
            const barWidth = size;
            const barHeight = 4;
            const barY = y + size / 2 + 4;
            const fillWidth = (this.timeRemaining / this.duration) * barWidth;

            ctx.fillStyle = '#333333';
            ctx.fillRect(x - barWidth / 2, barY, barWidth, barHeight);
            const barColor = this.timeRemaining < 3 ? '#FFAA00' : this.info.color;
            ctx.fillStyle = barColor;
            ctx.fillRect(x - barWidth / 2, barY, fillWidth, barHeight);
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1;
            ctx.strokeRect(x - barWidth / 2, barY, barWidth, barHeight);

            // Name below bar
            ctx.fillStyle = '#fff';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.info.displayName, x, barY + 14);
        }
    }

    class PowerUpManager {
        constructor() {
            this.activePowerUps = [];
        }

        add(type, duration) {
            this.activePowerUps = this.activePowerUps.filter(p => p.type !== type);
            const powerUp = new PowerUp(type, duration);
            this.activePowerUps.push(powerUp);
            return powerUp;
        }

        update(dt) {
            this.activePowerUps.forEach(p => p.update(dt));
            this.activePowerUps = this.activePowerUps.filter(p => p.active);
        }

        getModifier(stat) {
            let modifier = 1;
            this.activePowerUps.forEach(p => {
                modifier *= p.getModifier(stat);
            });
            return modifier;
        }

        hasFeature(feature) {
            return this.activePowerUps.some(p => p.hasFeature(feature));
        }

        getScale() {
            let scale = 1;
            this.activePowerUps.forEach(p => {
                scale *= p.getScale();
            });
            return Math.min(scale, 1.5);
        }

        getDisplayName(type) {
            const info = PowerUpInfo[type];
            return info ? info.displayName : '';
        }

        getColor(type) {
            const info = PowerUpInfo[type];
            return info ? info.color : '#FFF';
        }

        drawIcons(ctx, startX, startY) {
            this.activePowerUps.forEach((powerUp, i) => {
                powerUp.drawIcon(ctx, startX + i * 44, startY);
            });
        }

        clear() {
            this.activePowerUps = [];
        }
    }

    window.Roxena = window.Roxena || {};
    window.Roxena.PowerUp = PowerUp;
    window.Roxena.PowerUpManager = PowerUpManager;
    window.Roxena.PowerUpTypes = PowerUpTypes;
    window.Roxena.PowerUpInfo = PowerUpInfo;
})();
