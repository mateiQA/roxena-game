window.Roxena = window.Roxena || {};

Roxena.TILE_SIZE = 32;

Roxena.TileTypes = {
    AIR: 0,
    GROUND: 1,
    GROUND_TOP: 2,
    PLATFORM: 3,
    BRICK: 4,
    STONE: 5,
    SPIKE: 10,
    BREAKABLE: 11
};

Roxena.Tile = class Tile {
    constructor(id, col, row) {
        this.id = id;
        this.col = col;
        this.row = row;
        this.x = col * Roxena.TILE_SIZE;
        this.y = row * Roxena.TILE_SIZE;
        this.width = Roxena.TILE_SIZE;
        this.height = Roxena.TILE_SIZE;
        this.solid = this._isSolid();
    }

    _isSolid() {
        const t = Roxena.TileTypes;
        return this.id === t.GROUND || this.id === t.GROUND_TOP ||
               this.id === t.PLATFORM || this.id === t.BRICK || this.id === t.STONE;
    }

    isDamage() {
        return this.id === Roxena.TileTypes.SPIKE;
    }

    draw(ctx, theme) {
        if (this.id === Roxena.TileTypes.AIR) return;

        const colors = Roxena.TileThemes[theme] || Roxena.TileThemes.kitchen;
        const t = Roxena.TileTypes;

        switch (this.id) {
            case t.GROUND:
                ctx.fillStyle = colors.ground;
                ctx.fillRect(this.x, this.y, this.width, this.height);
                break;
            case t.GROUND_TOP:
                ctx.fillStyle = colors.groundTop;
                ctx.fillRect(this.x, this.y, this.width, this.height);
                // Grass/surface line
                ctx.fillStyle = colors.surface;
                ctx.fillRect(this.x, this.y, this.width, 4);
                break;
            case t.PLATFORM:
                ctx.fillStyle = colors.platform;
                ctx.fillRect(this.x, this.y, this.width, this.height);
                ctx.fillStyle = colors.platformTop;
                ctx.fillRect(this.x, this.y, this.width, 4);
                break;
            case t.BRICK:
                ctx.fillStyle = colors.brick;
                ctx.fillRect(this.x, this.y, this.width, this.height);
                // Brick lines
                ctx.strokeStyle = colors.brickLine;
                ctx.lineWidth = 1;
                ctx.strokeRect(this.x + 0.5, this.y + 0.5, this.width - 1, this.height - 1);
                ctx.beginPath();
                ctx.moveTo(this.x + this.width / 2, this.y);
                ctx.lineTo(this.x + this.width / 2, this.y + this.height / 2);
                ctx.moveTo(this.x, this.y + this.height / 2);
                ctx.lineTo(this.x + this.width, this.y + this.height / 2);
                ctx.stroke();
                break;
            case t.STONE:
                ctx.fillStyle = colors.stone;
                ctx.fillRect(this.x, this.y, this.width, this.height);
                ctx.strokeStyle = colors.stoneLine;
                ctx.lineWidth = 1;
                ctx.strokeRect(this.x + 0.5, this.y + 0.5, this.width - 1, this.height - 1);
                break;
            case t.SPIKE:
                // Triangle spike
                ctx.fillStyle = '#cc3333';
                ctx.beginPath();
                ctx.moveTo(this.x + this.width / 2, this.y);
                ctx.lineTo(this.x + this.width, this.y + this.height);
                ctx.lineTo(this.x, this.y + this.height);
                ctx.closePath();
                ctx.fill();
                break;
            default:
                ctx.fillStyle = '#888';
                ctx.fillRect(this.x, this.y, this.width, this.height);
                break;
        }
    }
};

// Color themes for different levels
Roxena.TileThemes = {
    kitchen: {
        ground: '#6b4c3b',
        groundTop: '#7d5e4e',
        surface: '#8B7355',
        platform: '#9e8b78',
        platformTop: '#b5a08c',
        brick: '#a0522d',
        brickLine: '#8b4513',
        stone: '#808080',
        stoneLine: '#696969'
    },
    fastfood: {
        ground: '#8b0000',
        groundTop: '#a52a2a',
        surface: '#cd5c5c',
        platform: '#daa520',
        platformTop: '#ffd700',
        brick: '#b22222',
        brickLine: '#8b0000',
        stone: '#696969',
        stoneLine: '#555'
    },
    factory: {
        ground: '#4a4a4a',
        groundTop: '#5a5a5a',
        surface: '#ff69b4',
        platform: '#c0c0c0',
        platformTop: '#e0e0e0',
        brick: '#555',
        brickLine: '#444',
        stone: '#3a3a3a',
        stoneLine: '#2a2a2a'
    },
    gym: {
        ground: '#2c2c2c',
        groundTop: '#3c3c3c',
        surface: '#4169e1',
        platform: '#555',
        platformTop: '#777',
        brick: '#444',
        brickLine: '#333',
        stone: '#363636',
        stoneLine: '#2a2a2a'
    }
};
