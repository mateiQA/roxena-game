window.Roxena = window.Roxena || {};

Roxena.Physics = {
    GRAVITY: 0.5,
    TERMINAL_VELOCITY: 12,
    GROUND_FRICTION: 0.8,
    AIR_FRICTION: 0.95,
    JUMP_FORCE: -12,
    JUMP_CUT_VELOCITY: -6,     // Max upward velocity when jump is released early
    COYOTE_FRAMES: 6,          // Grace frames after leaving a platform
    JUMP_BUFFER_FRAMES: 8      // Pre-landing jump buffer
};
