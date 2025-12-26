const CONFIG = {
    // API服务器地址（部署到Vercel后更新）
    API_SERVER: 'https://travel-roulette-api.vercel.app/api',
    
    // 地图配置
    MAP_TILES: {
        normal: 'https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
        satellite: 'https://webst01.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}'
    },
    
    // 应用配置
    APP: {
        defaultDuration: 3,
        defaultBudget: 3000,
        currency: '¥'
    }
};

// 检查环境变量
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    CONFIG.API_SERVER = 'http://localhost:3000/api';
}