// 获取所有地级市
const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // 设置CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    try {
    const amapKey = process.env.AMAP_KEY || '372be7f1091857c99af5e8faaeaa740c';
    
    // ========== 【新增调试行1：检查密钥】 ==========
    console.log('【调试】环境变量 AMAP_KEY 是否存在:', !!process.env.AMAP_KEY);
    console.log('【调试】最终使用的 amapKey (前5位):', amapKey ? amapKey.substring(0, 5) + '...' : '为空');
    
    // 调用高德地图行政区域查询API
    const url = `https://restapi.amap.com/v3/config/district?key=${amapKey}&keywords=中国&subdistrict=3&extensions=base`;
    
    // ========== 【新增调试行2：检查请求URL】 ==========
    console.log('【调试】准备请求的URL:', url.replace(amapKey, '***KEY***')); // 隐藏完整密钥
    
    const response = await fetch(url);
    const data = await response.json();
    
    // ========== 【新增调试行3：检查API原始响应】 ==========
    console.log('【调试】高德API返回状态(status):', data.status);
    console.log('【调试】高德API返回信息(info):', data.info);
    console.log('【调试】高德API返回数据计数(count):', data.count);
    
    if (data.status !== '1') {
        throw new Error(data.info || '高德地图API调用失败');
    }
    
    // 提取所有地级市
    const cities = extractCities(data.districts);
    
    res.status(200).json({
        success: true,
        count: cities.length,
        cities: cities,
        timestamp: new Date().toISOString()
    });
    
} catch (error) {
    console.error('获取城市数据失败:', error);
    // ========== 【修改此处：返回更详细的错误信息】 ==========
    res.status(500).json({
        success: false,
        error: error.message,
        // 将详细的调试信息也返回给前端，方便我们在浏览器直接查看
        debugInfo: {
            envKeyExists: !!process.env.AMAP_KEY,
            errorStack: process.env.NODE_ENV === 'development' ? error.stack : '已隐藏'
        },
        cities: getFallbackCities() // 返回备用数据
    });
}
};

function extractCities(districts) {
    const cities = [];
    
    function traverse(districtList) {
        if (!districtList) return;
        
        for (const district of districtList) {
            // 地级市级别为"city"
            if (district.level === 'city' && district.name) {
                cities.push(district.name.replace('市', '市'));
            }
            
            // 递归遍历下级区域
            if (district.districts && district.districts.length > 0) {
                traverse(district.districts);
            }
        }
    }
    
    traverse(districts);
    
    // 去重并排序
    return [...new Set(cities)].sort((a, b) => a.localeCompare(b, 'zh-CN'));
}

function getFallbackCities() {
    // 返回简化版的中国地级市列表
    return [
        "北京市", "天津市", "上海市", "重庆市",
        "石家庄市", "唐山市", "秦皇岛市", "邯郸市", "邢台市", "保定市", 
        "张家口市", "承德市", "沧州市", "廊坊市", "衡水市",
        "太原市", "大同市", "阳泉市", "长治市", "晋城市", "朔州市", 
        "晋中市", "运城市", "忻州市", "临汾市", "吕梁市",
        "呼和浩特市", "包头市", "乌海市", "赤峰市", "通辽市",
        "鄂尔多斯市", "呼伦贝尔市", "巴彦淖尔市", "乌兰察布市",
        "沈阳市", "大连市", "鞍山市", "抚顺市", "本溪市", "丹东市",
        "锦州市", "营口市", "阜新市", "辽阳市", "盘锦市", "铁岭市",
        "朝阳市", "葫芦岛市",
        "长春市", "吉林市", "四平市", "辽源市", "通化市", "白山市",
        "松原市", "白城市",
        "哈尔滨市", "齐齐哈尔市", "鸡西市", "鹤岗市", "双鸭山市",
        "大庆市", "伊春市", "佳木斯市", "七台河市", "牡丹江市",
        "黑河市", "绥化市",
        "南京市", "无锡市", "徐州市", "常州市", "苏州市", "南通市",
        "连云港市", "淮安市", "盐城市", "扬州市", "镇江市", "泰州市", "宿迁市",
        "杭州市", "宁波市", "温州市", "嘉兴市", "湖州市", "绍兴市",
        "金华市", "衢州市", "舟山市", "台州市", "丽水市",
        "合肥市", "芜湖市", "蚌埠市", "淮南市", "马鞍山市", "淮北市",
        "铜陵市", "安庆市", "黄山市", "滁州市", "阜阳市", "宿州市",
        "六安市", "亳州市", "池州市", "宣城市",
        "福州市", "厦门市", "莆田市", "三明市", "泉州市", "漳州市",
        "南平市", "龙岩市", "宁德市",
        "南昌市", "景德镇市", "萍乡市", "九江市", "新余市", "鹰潭市",
        "赣州市", "吉安市", "宜春市", "抚州市", "上饶市",
        "济南市", "青岛市", "淄博市", "枣庄市", "东营市", "烟台市",
        "潍坊市", "济宁市", "泰安市", "威海市", "日照市", "临沂市",
        "德州市", "聊城市", "滨州市", "菏泽市",
        "郑州市", "开封市", "洛阳市", "平顶山市", "安阳市", "鹤壁市",
        "新乡市", "焦作市", "濮阳市", "许昌市", "漯河市", "三门峡市",
        "南阳市", "商丘市", "信阳市", "周口市", "驻马店市",
        "武汉市", "黄石市", "十堰市", "宜昌市", "襄阳市", "鄂州市",
        "荆门市", "孝感市", "荆州市", "黄冈市", "咸宁市", "随州市",
        "长沙市", "株洲市", "湘潭市", "衡阳市", "邵阳市", "岳阳市",
        "常德市", "张家界市", "益阳市", "郴州市", "永州市", "怀化市",
        "娄底市",
        "广州市", "韶关市", "深圳市", "珠海市", "汕头市", "佛山市",
        "江门市", "湛江市", "茂名市", "肇庆市", "惠州市", "梅州市",
        "汕尾市", "河源市", "阳江市", "清远市", "东莞市", "中山市",
        "潮州市", "揭阳市", "云浮市",
        "南宁市", "柳州市", "桂林市", "梧州市", "北海市", "防城港市",
        "钦州市", "贵港市", "玉林市", "百色市", "贺州市", "河池市",
        "来宾市", "崇左市",
        "海口市", "三亚市", "三沙市", "儋州市",
        "成都市", "自贡市", "攀枝花市", "泸州市", "德阳市", "绵阳市",
        "广元市", "遂宁市", "内江市", "乐山市", "南充市", "眉山市",
        "宜宾市", "广安市", "达州市", "雅安市", "巴中市", "资阳市",
        "贵阳市", "六盘水市", "遵义市", "安顺市", "毕节市", "铜仁市",
        "昆明市", "曲靖市", "玉溪市", "保山市", "昭通市", "丽江市",
        "普洱市", "临沧市",
        "拉萨市", "日喀则市", "昌都市", "林芝市", "山南市", "那曲市",
        "西安市", "铜川市", "宝鸡市", "咸阳市", "渭南市", "延安市",
        "汉中市", "榆林市", "安康市", "商洛市",
        "兰州市", "嘉峪关市", "金昌市", "白银市", "天水市", "武威市",
        "张掖市", "平凉市", "酒泉市", "庆阳市", "定西市", "陇南市",
        "西宁市",
        "银川市", "石嘴山市", "吴忠市", "固原市", "中卫市",
        "乌鲁木齐市", "克拉玛依市", "吐鲁番市", "哈密市", "昌吉市",
        "博乐市", "库尔勒市", "阿克苏市", "阿图什市", "喀什市",
        "和田市", "伊宁市", "塔城市", "阿勒泰市"
    ];
}
