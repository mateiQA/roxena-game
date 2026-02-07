/**
 * Collectible - Base class for all collectible items (coins, health packs, supplements)
 */
(function() {
    'use strict';

    const PICKUP_PADDING = 6; // Extra pixels of forgiveness around bounding boxes

    class Collectible extends Roxena.Entity {
        constructor(x, y, type, value) {
            super(x, y, 24, 24);
            this.type = type;       // 'coin', 'health', 'powerup'
            this.value = value;     // Points, HP restored, or power-up type string
            this.collected = false;
            this.bobTime = Math.random() * Math.PI * 2;
            this.pulseTime = 0;
            this.sparkleTime = 0;
            this.displayName = '';  // Set by createCollectible for supplements
        }

        update(dt) {
            if (this.collected) return;
            this.bobTime += 0.1;
            this.pulseTime += 0.15;
            this.sparkleTime += 0.2;
        }

        tryCollect(player) {
            if (this.collected) return false;
            // Use bounding box overlap with padding — if player body touches item, pick it up
            const scale = (player.powerUps && player.powerUps.getScale) ? player.powerUps.getScale() : 1;
            const pad = PICKUP_PADDING * scale;
            const pb = player.getBounds();
            const overlap = pb.x - pad < this.x + this.width &&
                            pb.x + pb.width + pad > this.x &&
                            pb.y - pad < this.y + this.height &&
                            pb.y + pb.height + pad > this.y;
            if (overlap) {
                this.collected = true;
                this._onCollect(player);
                return true;
            }
            return false;
        }

        _onCollect(player) {
            if (window.Roxena && window.Roxena.spawnParticleBurst) {
                const color = this._getColor();
                window.Roxena.spawnParticleBurst(this.centerX(), this.centerY(), color, 8);
            }
        }

        _getColor() {
            switch (this.type) {
                case 'coin': return '#FFD700';
                case 'health': return '#FF4444';
                case 'powerup':
                    // Use supplement color if available
                    if (this.value && Roxena.PowerUpInfo && Roxena.PowerUpInfo[this.value]) {
                        return Roxena.PowerUpInfo[this.value].color;
                    }
                    return '#00FFFF';
                default: return '#FFFFFF';
            }
        }

        draw(ctx) {
            if (this.collected) return;

            const bobOffset = Math.sin(this.bobTime) * 4;
            const pulse = 1 + Math.sin(this.pulseTime) * 0.1;

            ctx.save();
            ctx.translate(this.centerX(), this.centerY() + bobOffset);
            ctx.scale(pulse, pulse);

            switch (this.type) {
                case 'coin':
                    this._drawCoin(ctx);
                    break;
                case 'health':
                    this._drawHealth(ctx);
                    break;
                case 'powerup':
                    this._drawSupplement(ctx);
                    break;
            }

            ctx.restore();
            this._drawSparkles(ctx, bobOffset);
        }

        _drawCoin(ctx) {
            ctx.fillStyle = '#DAA520';
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFFF00';
            ctx.beginPath();
            ctx.arc(-3, -3, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#DAA520';
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('$', 0, 0);
        }

        _drawHealth(ctx) {
            const size = 10;
            ctx.fillStyle = '#FF4444';
            ctx.fillRect(-size, -size, size * 2, size * 2);
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.strokeRect(-size, -size, size * 2, size * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(-7, -2, 14, 4);
            ctx.fillRect(-2, -7, 4, 14);
        }

        _drawSupplement(ctx) {
            // Draw based on supplement type
            switch (this.value) {
                case 'creatine':
                    this._drawCreatine(ctx);
                    break;
                case 'protein_shake':
                    this._drawProteinShake(ctx);
                    break;
                case 'pre_workout':
                    this._drawPreWorkout(ctx);
                    break;
                default:
                    this._drawGenericSupplement(ctx);
            }
        }

        _drawCreatine(ctx) {
            // Red pill/capsule
            ctx.fillStyle = '#FF4444';
            // Capsule body
            ctx.beginPath();
            ctx.ellipse(0, 0, 10, 6, 0, 0, Math.PI * 2);
            ctx.fill();
            // Capsule highlight
            ctx.fillStyle = '#FF8888';
            ctx.beginPath();
            ctx.ellipse(-3, -2, 5, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            // Dividing line
            ctx.strokeStyle = '#CC0000';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, -6);
            ctx.lineTo(0, 6);
            ctx.stroke();
            // Label
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 7px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('CR', 0, 0);
        }

        _drawProteinShake(ctx) {
            // Green shaker bottle
            ctx.fillStyle = '#44FF44';
            // Bottle body
            ctx.fillRect(-6, -4, 12, 14);
            // Bottle cap
            ctx.fillStyle = '#228B22';
            ctx.fillRect(-5, -8, 10, 5);
            // Cap top
            ctx.fillRect(-3, -10, 6, 3);
            // Highlight
            ctx.fillStyle = '#88FF88';
            ctx.fillRect(-4, -2, 3, 8);
            // Label
            ctx.fillStyle = '#006400';
            ctx.font = 'bold 6px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('PR', 0, 2);
        }

        _drawPreWorkout(ctx) {
            // Yellow energy drink can
            ctx.fillStyle = '#FFFF00';
            // Can body
            ctx.fillRect(-6, -8, 12, 16);
            // Can top rim
            ctx.fillStyle = '#DAA520';
            ctx.fillRect(-7, -9, 14, 3);
            // Can bottom rim
            ctx.fillRect(-7, 7, 14, 3);
            // Lightning bolt
            ctx.fillStyle = '#FF6600';
            ctx.beginPath();
            ctx.moveTo(2, -6);
            ctx.lineTo(-3, 0);
            ctx.lineTo(0, 0);
            ctx.lineTo(-2, 6);
            ctx.lineTo(3, 0);
            ctx.lineTo(0, 0);
            ctx.closePath();
            ctx.fill();
        }

        _drawGenericSupplement(ctx) {
            // Fallback diamond shape
            ctx.fillStyle = '#00FFFF';
            ctx.beginPath();
            ctx.moveTo(0, -10);
            ctx.lineTo(10, 0);
            ctx.lineTo(0, 10);
            ctx.lineTo(-10, 0);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#0088AA';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        _drawSparkles(ctx, bobOffset) {
            const sparklePositions = [
                { x: -8, y: -8 },
                { x: 8, y: -8 },
                { x: 0, y: 10 }
            ];
            ctx.fillStyle = '#FFFFFF';
            sparklePositions.forEach((pos, i) => {
                const phase = this.sparkleTime + i * Math.PI * 0.66;
                const alpha = (Math.sin(phase) + 1) * 0.5;
                if (alpha > 0.5) {
                    ctx.globalAlpha = alpha;
                    const sparkleX = this.centerX() + pos.x;
                    const sparkleY = this.centerY() + pos.y + bobOffset;
                    ctx.fillRect(sparkleX - 1, sparkleY - 3, 2, 6);
                    ctx.fillRect(sparkleX - 3, sparkleY - 1, 6, 2);
                    ctx.globalAlpha = 1;
                }
            });
        }
    }

    window.Roxena = window.Roxena || {};
    window.Roxena.Collectible = Collectible;
})();
