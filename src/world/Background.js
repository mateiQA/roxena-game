window.Roxena = window.Roxena || {};

Roxena.Background = class Background {
    constructor(config) {
        // 3 parallax layers: far (0.2x), mid (0.5x), near (0.8x)
        this.layers = config.layers || [
            { color: '#87CEEB', speed: 0.2 },  // Sky (far)
            { color: '#6bb5d6', speed: 0.5 },  // Clouds (mid)
            { color: '#5aa0c0', speed: 0.8 }   // Foreground details (near)
        ];
        this.viewportWidth = config.viewportWidth || 800;
        this.viewportHeight = config.viewportHeight || 480;
    }

    draw(ctx, cameraX, cameraY) {
        const w = this.viewportWidth;
        const h = this.viewportHeight;

        // Far layer: sky gradient
        const layer0 = this.layers[0];
        ctx.fillStyle = layer0.color;
        ctx.fillRect(0, 0, w, h);

        // Mid layer: simple cloud shapes
        const layer1 = this.layers[1];
        ctx.fillStyle = layer1.color;
        const midOffset = -(cameraX * layer1.speed) % w;
        // Draw simple cloud shapes
        this._drawClouds(ctx, midOffset, w, h * 0.15);

        // Near layer: hills/terrain silhouette
        const layer2 = this.layers[2];
        ctx.fillStyle = layer2.color;
        const nearOffset = -(cameraX * layer2.speed) % w;
        this._drawHills(ctx, nearOffset, w, h);
    }

    _drawClouds(ctx, offset, w, baseY) {
        ctx.globalAlpha = 0.4;
        const cloudPositions = [80, 250, 450, 650, 880, 1050];
        for (let i = 0; i < cloudPositions.length; i++) {
            const cx = ((cloudPositions[i] + offset) % (w + 200)) - 100;
            const cy = baseY + (i % 3) * 30;
            const size = 30 + (i % 2) * 20;
            ctx.beginPath();
            ctx.arc(cx, cy, size, 0, Math.PI * 2);
            ctx.arc(cx + size * 0.8, cy - size * 0.3, size * 0.7, 0, Math.PI * 2);
            ctx.arc(cx + size * 1.4, cy, size * 0.6, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    _drawHills(ctx, offset, w, h) {
        ctx.globalAlpha = 0.15;
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 4) {
            const baseX = x + offset;
            const y = h - 60 - Math.sin(baseX * 0.008) * 40 - Math.sin(baseX * 0.015) * 20;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
    }
};

// Background presets per level theme
Roxena.BackgroundPresets = {
    kitchen: {
        layers: [
            { color: '#f5e6ca', speed: 0.2 },
            { color: '#e8d4b0', speed: 0.5 },
            { color: '#d4b896', speed: 0.8 }
        ]
    },
    fastfood: {
        layers: [
            { color: '#fff3cd', speed: 0.2 },
            { color: '#ffe59e', speed: 0.5 },
            { color: '#ffd666', speed: 0.8 }
        ]
    },
    factory: {
        layers: [
            { color: '#ffc0cb', speed: 0.2 },
            { color: '#ffb6c1', speed: 0.5 },
            { color: '#ff9cac', speed: 0.8 }
        ]
    },
    gym: {
        layers: [
            { color: '#2c3e50', speed: 0.2 },
            { color: '#34495e', speed: 0.5 },
            { color: '#3d566e', speed: 0.8 }
        ]
    }
};
