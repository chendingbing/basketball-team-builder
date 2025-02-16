const config = {
    api: {
        baseUrl: 'http://localhost:5001',
        endpoints: {
            todayGames: '/api/today-games',
            teamPlayers: '/api/team/{teamId}/players',
            playerAbility: '/api/players/ability',
            topPlayers: '/api/players/top-ability'
        }
    }
};

export default config;
