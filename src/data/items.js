/**
 * items.js - Item configuration data for collectibles and fitness supplements
 */
(function() {
    'use strict';

    const ItemConfigs = {
        // Coins - award points
        coin: {
            type: 'coin',
            value: 10,
            score: 10
        },
        coinLarge: {
            type: 'coin',
            value: 50,
            score: 50
        },

        // Health pickups - restore HP
        healthSmall: {
            type: 'health',
            value: 25,
            score: 0
        },
        healthLarge: {
            type: 'health',
            value: 50,
            score: 0
        },

        // Fitness Supplements (power-ups)
        powerCreatine: {
            type: 'powerup',
            value: 'creatine',
            duration: 12,
            score: 25,
            displayName: 'CREATINE'
        },
        powerProtein: {
            type: 'powerup',
            value: 'protein_shake',
            duration: 10,
            score: 20,
            displayName: 'PROTEIN SHAKE'
        },
        powerPreWorkout: {
            type: 'powerup',
            value: 'pre_workout',
            duration: 8,
            score: 30,
            displayName: 'PRE-WORKOUT'
        }
    };

    function createCollectible(configName, x, y) {
        const config = ItemConfigs[configName];
        if (!config) {
            console.warn(`Unknown item config: ${configName}`);
            return null;
        }

        const collectible = new window.Roxena.Collectible(x, y, config.type, config.value);
        collectible.configName = configName;
        collectible.score = config.score || 0;
        collectible.duration = config.duration || 0;
        collectible.displayName = config.displayName || '';

        return collectible;
    }

    window.Roxena = window.Roxena || {};
    window.Roxena.ItemConfigs = ItemConfigs;
    window.Roxena.createCollectible = createCollectible;
})();
