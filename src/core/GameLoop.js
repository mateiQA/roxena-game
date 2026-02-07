window.Roxena = window.Roxena || {};

Roxena.GameLoop = class GameLoop {
    constructor(updateFn, renderFn) {
        this.updateFn = updateFn;
        this.renderFn = renderFn;
        this.running = false;
        this.dt = 1 / 60;           // Fixed timestep: 60 updates per second
        this.accumulator = 0;
        this.lastTime = 0;
        this.maxAccumulator = 0.1;   // Prevent spiral of death (max 6 updates per frame)
        this.frameId = null;
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.lastTime = performance.now() / 1000;
        this.accumulator = 0;
        this.frameId = requestAnimationFrame((ts) => this.tick(ts));
    }

    stop() {
        this.running = false;
        if (this.frameId) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
        }
    }

    tick(timestamp) {
        if (!this.running) return;

        const currentTime = timestamp / 1000;
        let frameTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // Clamp to prevent spiral of death
        if (frameTime > this.maxAccumulator) {
            frameTime = this.maxAccumulator;
        }

        this.accumulator += frameTime;

        // Fixed timestep updates
        while (this.accumulator >= this.dt) {
            this.updateFn(this.dt);
            this.accumulator -= this.dt;
        }

        // Render once per frame
        this.renderFn();

        this.frameId = requestAnimationFrame((ts) => this.tick(ts));
    }
};
