window.Roxena = window.Roxena || {};

Roxena.Input = class Input {
    constructor() {
        this.keys = {};
        this.justPressed = {};
        this.justReleased = {};
        this._touchActive = {}; // track which touch buttons are currently held

        // Keyboard (skip when name-input is focused so typing works)
        this._nameInput = document.getElementById('name-input');
        window.addEventListener('keydown', (e) => {
            if (this._nameInput && document.activeElement === this._nameInput) {
                // Only track Enter so Game.js can detect submit
                if (e.code === 'Enter') {
                    if (!this.keys[e.code]) this.justPressed[e.code] = true;
                    this.keys[e.code] = true;
                    e.preventDefault();
                }
                return;
            }
            if (!this.keys[e.code]) {
                this.justPressed[e.code] = true;
            }
            this.keys[e.code] = true;
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyX', 'KeyZ', 'KeyP', 'Enter'].includes(e.code)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.justReleased[e.code] = true;
        });

        // Touch controls
        this._initTouch();
    }

    _initTouch() {
        // Action buttons: touchstart = press, touchend = release
        const buttons = document.querySelectorAll('.touch-btn');
        buttons.forEach(btn => {
            const keyCode = btn.dataset.key;
            if (!keyCode) return;

            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                btn.classList.add('active');
                if (!this.keys[keyCode]) {
                    this.justPressed[keyCode] = true;
                }
                this.keys[keyCode] = true;
                this._touchActive[keyCode] = true;
            }, { passive: false });

            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                btn.classList.remove('active');
                this.keys[keyCode] = false;
                this.justReleased[keyCode] = true;
                this._touchActive[keyCode] = false;
            }, { passive: false });

            btn.addEventListener('touchcancel', (e) => {
                btn.classList.remove('active');
                this.keys[keyCode] = false;
                this.justReleased[keyCode] = true;
                this._touchActive[keyCode] = false;
            }, { passive: false });
        });

        // Handle touch leaving button while held (finger slides off)
        buttons.forEach(btn => {
            const keyCode = btn.dataset.key;
            if (!keyCode) return;

            btn.addEventListener('touchmove', (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                const rect = btn.getBoundingClientRect();
                const inside = touch.clientX >= rect.left && touch.clientX <= rect.right &&
                               touch.clientY >= rect.top && touch.clientY <= rect.bottom;
                if (!inside && this._touchActive[keyCode]) {
                    btn.classList.remove('active');
                    this.keys[keyCode] = false;
                    this.justReleased[keyCode] = true;
                    this._touchActive[keyCode] = false;
                }
            }, { passive: false });
        });

        // Tap zone for menu screens (tap = Space press + release)
        const tapZone = document.getElementById('tap-zone');
        if (tapZone) {
            tapZone.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (!this.keys['Space']) {
                    this.justPressed['Space'] = true;
                }
                this.keys['Space'] = true;
            }, { passive: false });

            tapZone.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.keys['Space'] = false;
                this.justReleased['Space'] = true;
            }, { passive: false });
        }

        // Prevent default on canvas to stop scrolling/zooming
        const canvas = document.getElementById('game-canvas');
        if (canvas) {
            canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
            canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
        }
    }

    isDown(code) {
        return !!this.keys[code];
    }

    wasPressed(code) {
        return !!this.justPressed[code];
    }

    wasReleased(code) {
        return !!this.justReleased[code];
    }

    update() {
        this.justPressed = {};
        this.justReleased = {};
    }
};
