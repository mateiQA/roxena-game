window.Roxena = window.Roxena || {};

Roxena.EnemyConfigs = {
    candy: {
        width: 28,
        height: 28,
        hp: 25,
        speed: 1.5,
        damage: 10,
        score: 100,
        color: '#ff69b4',
        colorDark: '#db3e8a',
        label: 'C',
        behavior: 'patrol'
    },
    chips: {
        width: 28,
        height: 32,
        hp: 40,
        speed: 2.0,
        damage: 15,
        score: 200,
        color: '#ffa500',
        colorDark: '#cc8400',
        label: 'Ch',
        behavior: 'ranged',
        projectileSpeed: 3,
        projectileDamage: 10,
        fireRate: 90,         // frames between shots
        detectionRange: 200
    },
    soda: {
        width: 24,
        height: 36,
        hp: 30,
        speed: 2.5,
        damage: 20,
        score: 250,
        color: '#dc143c',
        colorDark: '#b01030',
        label: 'S',
        behavior: 'charge',
        chargeSpeed: 5,
        detectionRange: 150,
        explosionRadius: 64,
        explosionDamage: 15
    },
    cake: {
        width: 48,
        height: 48,
        hp: 80,
        speed: 1.0,
        damage: 25,
        score: 400,
        color: '#deb887',
        colorDark: '#c49a6c',
        label: 'Ck',
        behavior: 'tank',
        spawnMinionsAtHpPercent: 0.5
    }
};
