window.Roxena = window.Roxena || {};

Roxena.Math = {
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    lerp(a, b, t) {
        return a + (b - a) * t;
    },

    rectOverlap(a, b) {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    },

    randomRange(min, max) {
        return min + Math.random() * (max - min);
    },

    randomInt(min, max) {
        return Math.floor(Roxena.Math.randomRange(min, max + 1));
    },

    sign(x) {
        return x > 0 ? 1 : x < 0 ? -1 : 0;
    }
};
