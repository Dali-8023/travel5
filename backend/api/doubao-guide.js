// 使用豆包API生成旅游攻略 - 异步处理版本
const fetch = require('node-fetch');

// 简单的内存缓存（生产环境应该用Redis等）
const aiCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30分钟

module.exports = async (req, res) => {
    // 设置CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    try {
        const { city, month, duration = 3, amapKey, doubaoKey, action } = req.body;
        
        // 处理不同的action
        if (action === 'check_cache') {
            const cacheKey = `${city}_${month}_${duration}`;
            const cached = aiCache.get(cacheKey);
            
            if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
                return res.status(200).json({
                    success: true,
                    data: cached.data,
                    from_cache: true
                });
            }
            
            return res.status(200).json({
                success: false,
                message: '缓存未命中'
            });
        }
        
        if (!city || !month) {
            return res.status(400).json({
                success: false,
                error: '缺少必要参数：city和month'
            });
        }
        
        console.log(`处理请求：${city}，${month}月，${duration}天`);
        
        // 生成缓存key
        const cacheKey = `${city}_${month}_${duration}`;
        
        // 1. 立即生成基础攻略（快速）
        const basicGuide = await generateBasicGuide(city, month, duration, amapKey);
        
        // 2. 立即返回基础数据
        const response = {
            success: true,
            data: {
                ...basicGuide,
                ai_status: doubaoKey ? 'processing' : 'disabled',
                cache_key: cacheKey,
                note: doubaoKey ? 'AI正在后台生成详细攻略，请稍后查询...' : '未启用AI生成'
            },
            generatedAt: new Date().toISOString()
        };
        
        res.status(200).json(response);
        
        // 3. 如果有AI密钥，在后台异步生成AI攻略
        if (doubaoKey) {
            // 立即启动AI生成，不等待
            generateAIGuideInBackground(city, month, duration, doubaoKey, cacheKey)
                .then(aiResult => {
                    console.log(`AI生成完成：${city}，缓存key：${cacheKey}`);
                    
                    // 存储到缓存
                    aiCache.set(cacheKey, {
                        data: aiResult,
                        timestamp: Date.now()
                    });
                    
                    // 这里可以存储到数据库或发送通知
                })
                .catch(error => {
                    console.error('后台AI生成失败:', error.message);
                });
        }
        
    } catch (error) {
        console.error('生成攻略失败:', error);
        res.status(200).json({
            success: true,
            data: generateFallbackGuide(req.body || {}),
            note: '生成过程中出现错误，返回备用攻略'
        });
    }
};

// 生成基础攻略（不依赖AI）
async function generateBasicGuide(city, month, duration, amapKey) {
    const monthName = getChineseMonthName(month);
    const season = getSeason(month);
    
    try {
        // 并行获取数据，设置超时
        const [cityInfo, attractions] = await Promise.allSettled([
            getCityInfoFast(city, amapKey),
            getAttractionsFast(city, amapKey)
        ]).then(results => [
            results[0].status === 'fulfilled' ? results[0].value : getDefaultCityInfo(city),
            results[1].status === 'fulfilled' ? results[1].value : []
        ]);
        
        return {
            city: city,
            month: month,
            month_name: monthName,
            season: season,
            duration: duration,
            coordinates: cityInfo.coordinates,
            overview: `${city}在${monthName}（${season}季）是个理想的旅行目的地，适合进行${duration}天的深度游玩。${city}拥有丰富的旅游资源，包括历史古迹、自然风光和地道美食。`,
            weather_info: {
                temperature: getTemperatureBySeason(season),
                precipitation: getPrecipitationBySeason(season),
                wind: getWindBySeason(season),
                dressing_tips: getDressingTips(season)
            },
            attractions: processAttractions(attractions, city),
            itinerary: generateItineraryByDays(city, duration, season),
            food_recommendations: getLocalFoodSuggestions(city),
            budget: generateRealisticBudget(duration, city),
            accommodation_suggestions: getAccommodationSuggestions(city),
            local_tips: getLocalTips(city, season),
            weather_tips: getWeatherTips(season),
            transportation_tips: getTransportationTips(city),
            quick_stats: {
                attractions_count: Math.min(attractions.length, 10),
                duration_days: duration,
                best_season: season
            },
            generated_at: new Date().toISOString()
        };
    } catch (error) {
        console.warn('生成基础攻略失败:', error);
        return getBasicFallbackGuide(city, month, duration, season, monthName);
    }
}

// 后台异步生成AI攻略
async function generateAIGuideInBackground(city, month, duration, doubaoKey, cacheKey) {
    console.log(`开始后台AI生成：${city} ${month}月 ${duration}天`);
    
    // 使用AbortController控制超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        console.log('AI生成超时，中止请求');
        controller.abort();
    }, 25000); // 25秒超时，比Vercel的10秒长，但因为是后台任务，可以更宽容
    
    try {
        const monthName = getChineseMonthName(month);
        const season = getSeason(month);
        
        // 优化提示词，减少输出
        const prompt = `作为专业旅游规划师，请为${city}的${monthName}（${season}季）${duration}天旅行生成一份实用攻略。

要求：
1. 重点推荐3-5个必去景点
2. 提供${duration}天的行程安排
3. 推荐当地特色美食和餐厅
4. 给出实用贴士和注意事项
5. 预算建议

请用简洁的JSON格式返回，结构如下：
{
  "ai_overview": "100字内概况",
  "must_visit": ["景点1", "景点2", "景点3"],
  "day_plans": [
    {"day": 1, "morning": "活动", "afternoon": "活动", "evening": "活动"}
  ],
  "food_highlights": [
    {"name": "美食", "description": "特色", "where": "推荐地点"}
  ],
  "pro_tips": ["贴士1", "贴士2", "贴士3"],
  "estimated_budget": "人均预算"
}`;

        console.log('调用豆包API...');
        const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${doubaoKey}`
            },
            body: JSON.stringify({
                model: 'doubao-1.5-pro-32k',
                messages: [
                    {
                        role: 'system',
                        content: '你是一个经验丰富的旅游规划师，请用简洁实用的语言提供旅游建议。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 1500,
                timeout: 20000
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`豆包API错误: HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('豆包API响应成功');
        
        let aiContent = {};
        if (data.choices?.[0]?.message?.content) {
            const content = data.choices[0].message.content;
            
            // 尝试解析JSON
            try {
                const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/{[\s\S]*}/);
                if (jsonMatch) {
                    aiContent = JSON.parse(jsonMatch[1] || jsonMatch[0]);
                } else {
                    // 如果无法解析JSON，使用原始文本
                    aiContent = { raw_content: content };
                }
            } catch (parseError) {
                console.warn('解析AI响应失败:', parseError);
                aiContent = { raw_content: content };
            }
        } else {
            throw new Error('豆包API返回格式错误');
        }
        
        // 返回AI生成的完整结果
        return {
            ai_generated: true,
            ai_content: aiContent,
            generated_at: new Date().toISOString(),
            model_used: '豆包AI'
        };
        
    } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
            console.warn('AI生成超时');
            return {
                ai_generated: false,
                error: 'AI生成超时，请稍后重试或使用基础攻略',
                fallback: generateBasicAIFallback(city, month, duration)
            };
        }
        
        console.error('AI生成失败:', error.message);
        return {
            ai_generated: false,
            error: error.message,
            fallback: generateBasicAIFallback(city, month, duration)
        };
    }
}

// 基础辅助函数
function getSeason(month) {
    if (month >= 3 && month <= 5) return '春季';
    if (month >= 6 && month <= 8) return '夏季';
    if (month >= 9 && month <= 11) return '秋季';
    return '冬季';
}

function getChineseMonthName(month) {
    const months = ['一月', '二月', '三月', '四月', '五月', '六月',
                   '七月', '八月', '九月', '十月', '十一月', '十二月'];
    return months[month - 1] || months[0];
}

function getTemperatureBySeason(season) {
    const temps = {
        '春季': '15-25°C',
        '夏季': '25-35°C',
        '秋季': '10-20°C',
        '冬季': '-5-10°C'
    };
    return temps[season] || '15-25°C';
}

function getPrecipitationBySeason(season) {
    const precip = {
        '春季': '较少',
        '夏季': '较多',
        '秋季': '适中',
        '冬季': '较少'
    };
    return precip[season] || '适中';
}

function getWindBySeason(season) {
    const winds = {
        '春季': '微风，偶尔有阵风',
        '夏季': '东南风，风力较小',
        '秋季': '北风，风力适中',
        '冬季': '西北风，风力较大'
    };
    return winds[season] || '微风';
}

function getDressingTips(season) {
    const tips = {
        '春季': '轻薄外套、长袖衬衫、舒适鞋',
        '夏季': '短袖、防晒衣、太阳镜、遮阳帽',
        '秋季': '外套、长裤、围巾、舒适鞋',
        '冬季': '羽绒服、毛衣、帽子、手套、保暖鞋'
    };
    return tips[season] || '舒适休闲装';
}

function getWeatherTips(season) {
    const tips = {
        '春季': [
            '春季温差大，建议洋葱式穿衣法',
            '注意花粉过敏，可备过敏药',
            '春雨偶至，记得带伞'
        ],
        '夏季': [
            '注意防晒防暑，多补充水分',
            '避免中午长时间户外活动',
            '准备防蚊虫用品'
        ],
        '秋季': [
            '秋季干燥，注意保湿',
            '早晚温差大，注意增减衣物',
            '秋季天高气爽，适合户外活动'
        ],
        '冬季': [
            '注意防寒保暖，特别是头部和手脚',
            '雪天注意防滑，穿防滑鞋',
            '室内外温差大，注意适应'
        ]
    };
    return tips[season] || ['注意天气变化，合理安排行程'];
}

function getLocalTips(city, season) {
    return [
        `在${city}旅行，建议下载当地交通APP`,
        `尝试与${city}当地人交流，了解更多地道玩法`,
        '注意保管好个人财物，特别是在人多的地方',
        `尊重${city}当地的风俗习惯`,
        '保持环保意识，不乱扔垃圾'
    ];
}

function getTransportationTips(city) {
    return [
        `${city}公共交通发达，建议使用地铁和公交`,
        '下载当地交通APP，方便查询线路和班次',
        '避开早晚高峰时段出行',
        '使用网约车时注意选择正规平台',
        `了解${city}的交通卡政策，可以节省费用`
    ];
}

function getAccommodationSuggestions(city) {
    return [
        `${city}市中心酒店 - 交通便利，购物餐饮方便`,
        `${city}特色民宿 - 体验当地生活，价格实惠`,
        `${city}景区附近住宿 - 游玩方便，节省交通时间`,
        `${city}商务酒店 - 设施齐全，服务规范`
    ];
}

function getLocalFoodSuggestions(city) {
    // 基于常见城市的特色美食
    const cityFoods = {
        '北京': ['北京烤鸭', '炸酱面', '豆汁焦圈', '卤煮火烧'],
        '上海': ['小笼包', '生煎包', '本帮菜', '蟹粉汤包'],
        '广州': ['早茶点心', '烧腊', '煲仔饭', '双皮奶'],
        '成都': ['火锅', '串串香', '担担面', '龙抄手'],
        '西安': ['肉夹馍', '凉皮', '羊肉泡馍', 'biangbiang面']
    };
    
    const foods = cityFoods[city] || [
        `${city}特色菜`,
        `${city}地道小吃`,
        `${city}传统美食`,
        `${city}时令食材`
    ];
    
    return foods.map(food => ({
        name: food,
        description: `${city}代表性美食，不可错过`,
        recommended_restaurants: '当地老字号或热门餐厅',
        price_range: '30-100元/人'
    }));
}

function generateItineraryByDays(city, duration, season) {
    const dayThemes = [
        '历史文化探索',
        '自然风光游览', 
        '美食体验之旅',
        '当地生活体验',
        '休闲放松日'
    ];
    
    return Array.from({ length: duration }, (_, i) => {
        const theme = dayThemes[i % dayThemes.length];
        return {
            day: i + 1,
            title: `第${i + 1}天：${city}${theme}`,
            theme: theme,
            activities: [
                {
                    time: '09:00-12:00',
                    activity: '主要景点游览',
                    description: `参观${city}的标志性景点或参加${theme}相关活动`
                },
                {
                    time: '12:00-14:00',
                    activity: '午餐',
                    description: '品尝当地特色美食'
                },
                {
                    time: '14:00-17:00',
                    activity: '深度体验',
                    description: '探索当地文化或自然景观'
                },
                {
                    time: '18:00-20:00',
                    activity: '晚餐',
                    description: '享受当地美食，体验餐饮文化'
                },
                {
                    time: '20:00-21:00',
                    activity: '夜游或休息',
                    description: season === '夏季' ? '夜游或户外活动' : '室内活动或休息'
                }
            ],
            tips: [
                '穿着舒适的鞋子',
                '携带足够的水和零食',
                '提前查看天气预报'
            ]
        };
    });
}

function generateRealisticBudget(duration, city) {
    const baseCost = {
        '一线城市': 1000,
        '二线城市': 700,
        '其他': 500
    };
    
    // 简单判断城市级别
    let cityLevel = '其他';
    const tier1Cities = ['北京', '上海', '广州', '深圳'];
    const tier2Cities = ['成都', '杭州', '南京', '武汉', '西安'];
    
    if (tier1Cities.includes(city)) cityLevel = '一线城市';
    else if (tier2Cities.includes(city)) cityLevel = '二线城市';
    
    const dailyBudget = baseCost[cityLevel];
    const total = dailyBudget * duration;
    
    return {
        total: total,
        per_day: dailyBudget,
        breakdown: {
            accommodation: Math.floor(total * 0.35),
            transportation: Math.floor(total * 0.25),
            food: Math.floor(total * 0.25),
            activities: Math.floor(total * 0.10),
            shopping: Math.floor(total * 0.05)
        },
        tips: [
            `在${city}旅行，预算可以根据个人需求调整`,
            '提前预订住宿和交通可以节省费用',
            '尝试当地小吃比高档餐厅更经济实惠'
        ]
    };
}

function processAttractions(attractions, city) {
    if (!attractions || attractions.length === 0) {
        return [
            {
                name: `${city}标志性景点`,
                type: '地标',
                description: `${city}最著名的旅游景点，是游客必去之地`,
                recommended_time: '2-3小时',
                best_time: '全天',
                ticket_price: '50-100元'
            },
            {
                name: `${city}文化遗址`,
                type: '历史文化',
                description: `了解${city}历史文化的重要场所`,
                recommended_time: '3-4小时',
                best_time: '白天',
                ticket_price: '免费或30-80元'
            },
            {
                name: `${city}自然公园`,
                type: '自然风光',
                description: `欣赏${city}自然风光的好去处`,
                recommended_time: '2-3小时',
                best_time: '早晨或傍晚',
                ticket_price: '免费'
            }
        ];
    }
    
    return attractions.slice(0, 8).map(att => ({
        name: att.name,
        type: att.type || '景点',
        description: att.address ? `${att.name}位于${att.address}` : `${city}热门景点`,
        recommended_time: '2-3小时',
        best_time: '全天',
        ticket_price: '免费或30-100元'
    }));
}

async function getCityInfoFast(cityName, amapKey) {
    if (!amapKey) return getDefaultCityInfo(cityName);
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const url = `https://restapi.amap.com/v3/geocode/geo?key=${amapKey}&address=${encodeURIComponent(cityName)}`;
        const response = await fetch(url, { signal: controller.signal });
        
        clearTimeout(timeoutId);
        const data = await response.json();
        
        if (data.status === '1' && data.geocodes?.[0]) {
            const geo = data.geocodes[0];
            return {
                name: geo.formatted_address || cityName,
                coordinates: geo.location,
                adcode: geo.adcode,
                level: geo.level
            };
        }
    } catch (error) {
        console.warn('获取城市信息失败:', error.message);
    }
    
    return getDefaultCityInfo(cityName);
}

function getDefaultCityInfo(cityName) {
    // 常见城市的默认坐标
    const defaultCoords = {
        '北京': '116.4074,39.9042',
        '上海': '121.4737,31.2304',
        '广州': '113.2644,23.1291',
        '深圳': '114.0579,22.5431',
        '成都': '104.0668,30.5728',
        '杭州': '120.1551,30.2741',
        '南京': '118.7969,32.0603',
        '武汉': '114.2986,30.5844',
        '西安': '108.9480,34.2632',
        '重庆': '106.5516,29.5630'
    };
    
    return {
        name: cityName,
        coordinates: defaultCoords[cityName] || '116.4074,39.9042',
        adcode: '000000',
        level: 'city'
    };
}

async function getAttractionsFast(city, amapKey) {
    if (!amapKey) return [];
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const types = '风景名胜|公园广场|博物馆|展览馆|寺庙道观';
        const url = `https://restapi.amap.com/v3/place/text?key=${amapKey}&keywords=${encodeURIComponent(city)}&types=${encodeURIComponent(types)}&city=${encodeURIComponent(city)}&offset=10&page=1`;
        
        const response = await fetch(url, { signal: controller.signal });
        
        clearTimeout(timeoutId);
        const data = await response.json();
        
        if (data.status === '1' && data.pois?.length > 0) {
            return data.pois.slice(0, 10).map(poi => ({
                name: poi.name,
                type: poi.type || '景点',
                coordinates: poi.location,
                address: poi.address
            }));
        }
    } catch (error) {
        console.warn('获取景点数据失败:', error.message);
    }
    
    return [];
}

function getBasicFallbackGuide(city, month, duration, season, monthName) {
    return {
        city: city,
        month: month,
        month_name: monthName,
        season: season,
        duration: duration,
        coordinates: getDefaultCityInfo(city).coordinates,
        overview: `${city}在${monthName}是个不错的旅行选择。这里四季分明，旅游资源丰富，适合进行${duration}天的深度游玩。`,
        weather_info: {
            temperature: getTemperatureBySeason(season),
            precipitation: getPrecipitationBySeason(season),
            wind: getWindBySeason(season),
            dressing_tips: getDressingTips(season)
        },
        attractions: processAttractions([], city),
        itinerary: generateItineraryByDays(city, duration, season),
        food_recommendations: getLocalFoodSuggestions(city),
        budget: generateRealisticBudget(duration, city),
        note: '这是基础版攻略，AI增强版正在生成中...',
        generated_at: new Date().toISOString()
    };
}

function generateBasicAIFallback(city, month, duration) {
    const monthName = getChineseMonthName(month);
    const season = getSeason(month);
    
    return {
        ai_overview: `基于本地数据库生成的${city}${monthName}旅行建议`,
        must_visit: [
            `${city}标志性建筑`,
            `${city}历史文化街区`,
            `${city}自然风景区`
        ],
        day_plans: Array.from({ length: duration }, (_, i) => ({
            day: i + 1,
            morning: `参观${city}主要景点`,
            afternoon: '体验当地文化',
            evening: '品尝特色美食'
        })),
        pro_tips: [
            '建议提前规划行程',
            '避开旅游高峰期',
            '尝试当地公共交通'
        ]
    };
}

function generateFallbackGuide(params) {
    const { city = '北京', month = 5, duration = 3 } = params;
    const monthName = getChineseMonthName(month);
    const season = getSeason(month);
    
    return getBasicFallbackGuide(city, month, duration, season, monthName);
}
