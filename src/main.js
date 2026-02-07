window.Roxena = window.Roxena || {};

(function () {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }

    const game = new Roxena.Game(canvas);
    game.start();

    // Expose for debugging
    window.game = game;
})();
