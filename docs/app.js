// 主应用程序
class TravelRouletteApp {
    constructor() {
        this.selectedMonth = null;
        this.selectedCity = null;
        this.cities = [];
        this.roulette = null;
        this.currentGuide = null;
        this.map = null;
        
        this.init();
    }
    
    async init() {
        // 显示加载动画
        this.showLoading(true);
        
        try {
            // 初始化月份选择
            this.initMonthSelection();
            
            // 加载城市数据
            await this.loadCities();
            
            // 初始化轮盘
            this.initRoulette();
            
            // 初始化事件监听
            this.initEventListeners();
            
            // 初始化步骤控制
            this.initStepControl();
            
            // 隐藏加载动画，显示主界面
            setTimeout(() => {
                this.showLoading(false);
                document.querySelector('.container').style.display = 'block';
            }, 1000);
            
        } catch (error) {
            console.error('初始化失败:', error);
            this.showError('初始化失败，请刷新页面重试');
        }
    }
    
    initMonthSelection() {
        const monthGrid = document.getElementById('monthGrid');
        const months = [
            { number: 1, name: '一月', season: '❄️ 冬季' },
            { number: 2, name: '二月', season: '🌸 冬春之交' },
            { number: 3, name: '三月', season: '🌿 早春' },
            { number: 4, name: '四月', season: '🌷 春季' },
            { number: 5, name: '五月', season: '🌼 春末夏初' },
            { number: 6, name: '六月', season: '☀️ 初夏' },
            { number: 7, name: '七月', season: '🌞 夏季' },
            { number: 8, name: '八月', season: '🔥 盛夏' },
            { number: 9, name: '九月', season: '🍂 初秋' },
            { number: 10, name: '十月', season: '🍁 秋季' },
            { number: 11, name: '十一月', season: '🌾 深秋' },
            { number: 12, name: '十二月', season: '⛄ 初冬' }
        ];
        
        monthGrid.innerHTML = months.map(month => `
            <div class="month-item" data-month="${month.number}">
                <div class="month-number">${month.number}</div>
                <div class="month-name">${month.name}</div>
                <div class="month-season">${month.season}</div>
            </div>
        `).join('');
        
        // 月份点击事件
        document.querySelectorAll('.month-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.month-item').forEach(m => m.classList.remove('selected'));
                item.classList.add('selected');
                this.selectedMonth = parseInt(item.dataset.month);
                document.getElementById('nextStep1').disabled = false;
                this.updateSelectedMonthDisplay();
            });
        });
        
        // 初始随机选择一个月
        const randomMonth = Math.floor(Math.random() * 12) + 1;
        document.querySelector(`.month-item[data-month="${randomMonth}"]`).classList.add('selected');
        this.selectedMonth = randomMonth;
        document.getElementById('nextStep1').disabled = false;
        this.updateSelectedMonthDisplay();
    }
    
    async loadCities() {
        try {
            const response = await fetch(`${CONFIG.API_SERVER}/amap-cities`);
            const data = await response.json();
            
            if (data.success && data.cities.length > 0) {
                this.cities = data.cities;
                console.log(`加载了 ${this.cities.length} 个城市`);
            } else {
                throw new Error('获取城市数据失败');
            }
        } catch (error) {
            console.error('加载城市数据失败，使用备用数据:', error);
            // 使用备用数据
            this.cities = await this.getBackupCities();
        }
    }
    
    async getBackupCities() {
        // 简化的城市列表作为备用
        return [
            "北京市", "天津市", "石家庄市", "唐山市", "秦皇岛市", "邯郸市", "邢台市", 
            "保定市", "张家口市", "承德市", "沧州市", "廊坊市", "衡水市", "太原市",
            "大同市", "阳泉市", "长治市", "晋城市", "朔州市", "晋中市", "运城市",
            "忻州市", "临汾市", "吕梁市", "呼和浩特市", "包头市", "乌海市", "赤峰市",
            "通辽市", "鄂尔多斯市", "呼伦贝尔市", "巴彦淖尔市", "乌兰察布市"
        ];
    }
    
    initRoulette() {
        if (this.cities.length === 0) {
            console.warn('没有城市数据，无法初始化轮盘');
            return;
        }
        
        this.roulette = new Roulette('rouletteCanvas', this.cities);
        this.updateSelectedMonthDisplay();
    }
    
    updateSelectedMonthDisplay() {
        const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月',
                          '七月', '八月', '九月', '十月', '十一月', '十二月'];
        if (this.selectedMonth) {
            document.getElementById('selectedMonthDisplay').textContent = 
                `选定月份：${monthNames[this.selectedMonth - 1]}`;
        }
    }
    
    initEventListeners() {
        // 随机月份按钮
        document.getElementById('randomMonthBtn').addEventListener('click', () => {
            const randomMonth = Math.floor(Math.random() * 12) + 1;
            document.querySelectorAll('.month-item').forEach(m => m.classList.remove('selected'));
            document.querySelector(`.month-item[data-month="${randomMonth}"]`).classList.add('selected');
            this.selectedMonth = randomMonth;
            this.updateSelectedMonthDisplay();
        });
        
        // 旋转按钮
        document.getElementById('spinBtn').addEventListener('click', () => {
            if (!this.selectedMonth) {
                alert('请先选择月份！');
                return;
            }
            if (this.roulette) {
                this.roulette.spin(this.selectedMonth);
            }
        });
        
        // 完全随机按钮
        document.getElementById('fullRandomBtn').addEventListener('click', () => {
            // 随机选择月份
            const randomMonth = Math.floor(Math.random() * 12) + 1;
            document.querySelectorAll('.month-item').forEach(m => m.classList.remove('selected'));
            document.querySelector(`.month-item[data-month="${randomMonth}"]`).classList.add('selected');
            this.selectedMonth = randomMonth;
            this.updateSelectedMonthDisplay();
            
            // 随机旋转轮盘
            setTimeout(() => {
                if (this.roulette) {
                    this.roulette.spin(this.selectedMonth);
                }
            }, 500);
        });
        
        // 标签页切换
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                this.switchTab(tabId);
            });
        });
        
        // 行程天数选择
        document.getElementById('durationSelect').addEventListener('change', (e) => {
            if (this.currentGuide) {
                this.currentGuide.duration = parseInt(e.target.value);
                this.displayItinerary(this.currentGuide);
            }
        });
        
        // 地图控制按钮
        document.getElementById('showRoute')?.addEventListener('click', () => {
            this.showRouteOnMap();
        });
        
        document.getElementById('showAttractions')?.addEventListener('click', () => {
            this.showAttractionsOnMap();
        });
        
        // 操作按钮
        document.getElementById('regenerateBtn')?.addEventListener('click', () => {
            this.regenerateGuide();
        });
        
        document.getElementById('startOver')?.addEventListener('click', () => {
            this.startOver();
        });
        
        document.getElementById('downloadPDF')?.addEventListener('click', () => {
            this.downloadPDF();
        });
        
        document.getElementById('shareBtn')?.addEventListener('click', () => {
            this.shareGuide();
        });
    }
    
    initStepControl() {
        const steps = document.querySelectorAll('.step');
        const stepSections = document.querySelectorAll('.step-section');
        
        // 下一步按钮
        document.getElementById('nextStep1').addEventListener('click', () => {
            this.goToStep(2);
        });
        
        document.getElementById('nextStep2').addEventListener('click', () => {
            if (this.selectedCity) {
                this.generateGuide();
            }
        });
        
        // 上一步按钮
        document.getElementById('prevStep2').addEventListener('click', () => {
            this.goToStep(1);
        });
    }
    
    goToStep(stepNumber) {
        // 更新步骤指示器
        document.querySelectorAll('.step').forEach(step => {
            step.classList.remove('active');
            if (parseInt(step.dataset.step) <= stepNumber) {
                step.classList.add('active');
            }
        });
        
        // 显示对应步骤区域
        document.querySelectorAll('.step-section').forEach(section => {
            section.classList.remove('active');
        });
        
        document.getElementById(`step${stepNumber}`).classList.add('active');
        
        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    async generateGuide() {
        if (!this.selectedCity || !this.selectedMonth) {
            alert('请先选择城市和月份！');
            return;
        }
        
        this.showLoading(true, '正在生成智能攻略...');
        
        try {
            const duration = parseInt(document.getElementById('durationSelect').value);
            
            const response = await fetch(`${CONFIG.API_SERVER}/doubao-guide`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    city: this.selectedCity,
                    month: this.selectedMonth,
                    duration: duration,
                    amapKey: 'ee53f0f545f7f835427ea8dc91c9c4e6',
                    doubaoKey: 'afc7f997-9738-4003-b7a7-67b0e4f8400f'
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.currentGuide = data.data;
                this.displayGuide(this.currentGuide);
                this.goToStep(3);
            } else {
                throw new Error(data.error || '生成攻略失败');
            }
        } catch (error) {
            console.error('生成攻略失败:', error);
            this.showError('生成攻略失败，请重试');
        } finally {
            this.showLoading(false);
        }
    }
    
    displayGuide(guide) {
        // 更新结果摘要
        document.getElementById('resultCity').textContent = guide.city;
        document.getElementById('resultMonth').textContent = guide.month_name;
        document.getElementById('resultDuration').textContent = `${guide.duration}天${guide.duration - 1}晚`;
        
        // 显示概览
        this.displayOverview(guide);
        
        // 显示行程
        this.displayItinerary(guide);
        
        // 显示预算
        this.displayBudget(guide);
        
        // 显示地图
        this.displayMap(guide);
        
        // 显示贴士
        this.displayTips(guide);
        
        // 显示清单
        this.displayChecklist(guide);
        
        // 初始化地图标签页
        this.switchTab('overview');
    }
    
    displayOverview(guide) {
        // 城市介绍
        document.getElementById('cityOverview').innerHTML = `
            <h3><i class="fas fa-info-circle"></i> 城市介绍</h3>
            <p>${guide.overview || '暂无介绍'}</p>
        `;
        
        // AI推荐
        const aiRecommendations = document.getElementById('aiRecommendations');
        if (guide.ai_recommendations && guide.ai_recommendations.length > 0) {
            aiRecommendations.innerHTML = guide.ai_recommendations.map(rec => `
                <div class="ai-recommendation">
                    <strong>${rec.title}</strong>
                    <p>${rec.description}</p>
                </div>
            `).join('');
        } else {
            aiRecommendations.innerHTML = '<p>AI正在为您生成个性化推荐...</p>';
        }
        
        // 天气信息
        const weatherInfo = document.getElementById('weatherInfo');
        if (guide.weather_info) {
            weatherInfo.innerHTML = `
                <div class="weather-item">
                    <i class="fas fa-temperature-high"></i>
                    <span>平均气温：${guide.weather_info.temperature}</span>
                </div>
                <div class="weather-item">
                    <i class="fas fa-cloud-rain"></i>
                    <span>降水情况：${guide.weather_info.precipitation}</span>
                </div>
                <div class="weather-item">
                    <i class="fas fa-wind"></i>
                    <span>风力风向：${guide.weather_info.wind}</span>
                </div>
            `;
        }
        
        // 快速统计数据
        const quickStats = document.getElementById('quickStats');
        if (guide.quick_stats) {
            quickStats.innerHTML = `
                <div class="stat-item">
                    <span>景点数量</span>
                    <strong>${guide.quick_stats.attractions_count || 0}</strong>
                </div>
                <div class="stat-item">
                    <span>美食推荐</span>
                    <strong>${guide.quick_stats.food_count || 0}</strong>
                </div>
                <div class="stat-item">
                    <span>最佳拍照点</span>
                    <strong>${guide.quick_stats.photo_spots || 0}</strong>
                </div>
            `;
        }
    }
    
    displayItinerary(guide) {
        const itineraryDays = document.getElementById('itineraryDays');
        
        if (guide.itinerary && guide.itinerary.length > 0) {
            itineraryDays.innerHTML = guide.itinerary.map((day, index) => `
                <div class="itinerary-day">
                    <div class="day-header">
                        <div class="day-number">${day.title || `第${index + 1}天`}</div>
                        <div class="day-distance">${day.distance || '--'}公里 · ${day.duration || '8-10小时'}</div>
                    </div>
                    <div class="activities">
                        ${(day.activities || []).map(activity => `
                            <div class="activity">
                                <span class="time-badge">${activity.time}</span>
                                <div class="activity-content">
                                    <strong>${activity.activity}</strong>
                                    <p>${activity.description}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('');
        } else {
            itineraryDays.innerHTML = '<p>正在生成行程安排...</p>';
        }
    }
    
    displayBudget(guide) {
        // 总预算
        const totalBudget = document.getElementById('totalBudget');
        if (guide.budget && guide.budget.total) {
            totalBudget.textContent = `¥${guide.budget.total}`;
        } else {
            totalBudget.textContent = '¥--';
        }
        
        // 预算图表
        if (guide.budget && guide.budget.breakdown) {
            const chart = echarts.init(document.getElementById('budgetChart'));
            const option = {
                tooltip: {
                    trigger: 'item',
                    formatter: '{a} <br/>{b}: ¥{c} ({d}%)'
                },
                legend: {
                    orient: 'vertical',
                    left: 'left'
                },
                series: [
                    {
                        name: '预算分布',
                        type: 'pie',
                        radius: '70%',
                        data: [
                            { value: guide.budget.breakdown.transportation || 0, name: '交通' },
                            { value: guide.budget.breakdown.accommodation || 0, name: '住宿' },
                            { value: guide.budget.breakdown.food || 0, name: '餐饮' },
                            { value: guide.budget.breakdown.activities || 0, name: '活动' },
                            { value: guide.budget.breakdown.shopping || 0, name: '购物' }
                        ],
                        emphasis: {
                            itemStyle: {
                                shadowBlur: 10,
                                shadowOffsetX: 0,
                                shadowColor: 'rgba(0, 0, 0, 0.5)'
                            }
                        }
                    }
                ]
            };
            chart.setOption(option);
        }
        
        // 详细费用
        const transportationCosts = document.getElementById('transportationCosts');
        const accommodationCosts = document.getElementById('accommodationCosts');
        const foodCosts = document.getElementById('foodCosts');
        
        if (guide.budget && guide.budget.details) {
            transportationCosts.innerHTML = guide.budget.details.transportation || '正在计算...';
            accommodationCosts.innerHTML = guide.budget.details.accommodation || '正在计算...';
            foodCosts.innerHTML = guide.budget.details.food || '正在计算...';
        }
    }
    
    displayMap(guide) {
        // 初始化地图
        if (!this.map) {
            this.map = L.map('mapView').setView([39.9042, 116.4074], 5);
            
            // 添加地图图层
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(this.map);
        }
        
        // 清除现有标记
        this.map.eachLayer(layer => {
            if (layer instanceof L.Marker || layer instanceof L.Polyline) {
                this.map.removeLayer(layer);
            }
        });
        
        // 添加城市标记
        if (guide.coordinates) {
            const [lat, lng] = guide.coordinates.split(',').map(Number);
            this.map.setView([lat, lng], 10);
            
            L.marker([lat, lng])
                .addTo(this.map)
                .bindPopup(`<b>${guide.city}</b><br>${guide.overview || ''}`)
                .openPopup();
        }
        
        // 添加景点标记
        if (guide.attractions && guide.attractions.length > 0) {
            guide.attractions.forEach((attraction, index) => {
                if (index < 5 && attraction.coordinates) { // 只显示前5个景点
                    const [lat, lng] = attraction.coordinates.split(',').map(Number);
                    L.marker([lat, lng])
                        .addTo(this.map)
                        .bindPopup(`<b>${attraction.name}</b><br>${attraction.description || ''}`);
                }
            });
        }
    }
    
    displayTips(guide) {
        // 天气贴士
        const weatherTips = document.getElementById('weatherTips');
        if (guide.weather_tips) {
            weatherTips.innerHTML = guide.weather_tips.map(tip => `<p>• ${tip}</p>`).join('');
        }
        
        // 交通贴士
        const transportationTips = document.getElementById('transportationTips');
        if (guide.transportation_tips) {
            transportationTips.innerHTML = guide.transportation_tips.map(tip => `<p>• ${tip}</p>`).join('');
        }
        
        // 美食贴士
        const foodTips = document.getElementById('foodTips');
        if (guide.food_tips) {
            foodTips.innerHTML = guide.food_tips.map(tip => `<p>• ${tip}</p>`).join('');
        }
        
        // 摄影贴士
        const photoTips = document.getElementById('photoTips');
        if (guide.photo_tips) {
            photoTips.innerHTML = guide.photo_tips.map(tip => `<p>• ${tip}</p>`).join('');
        }
    }
    
    displayChecklist(guide) {
        // 行李清单
        const luggageList = document.getElementById('luggageList');
        if (guide.luggage_list && guide.luggage_list.length > 0) {
            luggageList.innerHTML = guide.luggage_list.map(item => `<li>${item}</li>`).join('');
        }
        
        // 必游景点
        const attractionsList = document.getElementById('attractionsList');
        if (guide.attractions && guide.attractions.length > 0) {
            attractionsList.innerHTML = guide.attractions.slice(0, 5).map(att => `<li>${att.name}</li>`).join('');
        }
        
        // 住宿建议
        const accommodationList = document.getElementById('accommodationList');
        if (guide.accommodation_suggestions && guide.accommodation_suggestions.length > 0) {
            accommodationList.innerHTML = guide.accommodation_suggestions.map(sugg => `<li>${sugg}</li>`).join('');
        }
    }
    
    switchTab(tabId) {
        // 更新标签按钮状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabId) {
                btn.classList.add('active');
            }
        });
        
        // 显示对应标签内容
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        
        const targetTab = document.getElementById(tabId);
        if (targetTab) {
            targetTab.classList.add('active');
        }
        
        // 如果是地图标签，重新渲染地图
        if (tabId === 'map' && this.currentGuide) {
            setTimeout(() => {
                this.displayMap(this.currentGuide);
            }, 100);
        }
    }
    
    showRouteOnMap() {
        // 在地图上显示路线
        if (this.map && this.currentGuide && this.currentGuide.route_coordinates) {
            const coordinates = this.currentGuide.route_coordinates;
            const polyline = L.polyline(coordinates, { color: 'blue' }).addTo(this.map);
            this.map.fitBounds(polyline.getBounds());
        }
    }
    
    showAttractionsOnMap() {
        // 在地图上显示所有景点
        if (this.map && this.currentGuide && this.currentGuide.attractions) {
            this.currentGuide.attractions.forEach(attraction => {
                if (attraction.coordinates) {
                    const [lat, lng] = attraction.coordinates.split(',').map(Number);
                    L.marker([lat, lng])
                        .addTo(this.map)
                        .bindPopup(`<b>${attraction.name}</b><br>${attraction.description || ''}`);
                }
            });
        }
    }
    
    async regenerateGuide() {
        if (this.selectedCity && this.selectedMonth) {
            await this.generateGuide();
        }
    }
    
    startOver() {
        // 重置选择
        this.selectedMonth = null;
        this.selectedCity = null;
        this.currentGuide = null;
        
        // 重置UI
        document.querySelectorAll('.month-item').forEach(m => m.classList.remove('selected'));
        document.getElementById('nextStep1').disabled = true;
        document.getElementById('nextStep2').disabled = true;
        
        // 回到第一步
        this.goToStep(1);
    }
    
    async downloadPDF() {
        this.showLoading(true, '正在生成PDF...');
        
        try {
            // 使用jsPDF库生成PDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // 添加标题
            doc.setFontSize(20);
            doc.text('智能旅行攻略', 105, 20, { align: 'center' });
            
            // 添加基本信息
            doc.setFontSize(12);
            doc.text(`目的地：${this.currentGuide.city}`, 20, 40);
            doc.text(`出行月份：${this.currentGuide.month_name}`, 20, 50);
            doc.text(`行程天数：${this.currentGuide.duration}天${this.currentGuide.duration - 1}晚`, 20, 60);
            doc.text(`总预算：¥${this.currentGuide.budget?.total || '--'}`, 20, 70);
            
            // 添加概述
            doc.setFontSize(14);
            doc.text('行程概述', 20, 90);
            doc.setFontSize(10);
            doc.text(this.currentGuide.overview || '', 20, 100, { maxWidth: 170 });
            
            // 保存PDF
            doc.save(`${this.currentGuide.city}_旅行攻略.pdf`);
            
        } catch (error) {
            console.error('生成PDF失败:', error);
            alert('生成PDF失败，请重试');
        } finally {
            this.showLoading(false);
        }
    }
    
    shareGuide() {
        if (navigator.share) {
            navigator.share({
                title: `${this.currentGuide.city}旅行攻略`,
                text: `我发现了一个很棒的旅行目的地：${this.currentGuide.city}！点击查看详细攻略。`,
                url: window.location.href
            });
        } else {
            // 复制链接到剪贴板
            navigator.clipboard.writeText(window.location.href);
            alert('链接已复制到剪贴板！');
        }
    }
    
    showLoading(show, message = '加载中...') {
        const loading = document.getElementById('loading');
        if (show) {
            loading.style.display = 'flex';
            loading.querySelector('p').textContent = message;
        } else {
            loading.style.display = 'none';
        }
    }
    
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <div style="position: fixed; top: 20px; right: 20px; background: #f8d7da; color: #721c24; 
                        padding: 15px; border-radius: 5px; z-index: 10000;">
                <strong>错误：</strong> ${message}
                <button onclick="this.parentElement.remove()" style="margin-left: 10px; cursor: pointer;">×</button>
            </div>
        `;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 5000);
    }
}

// 轮盘类
class Roulette {
    constructor(canvasId, cities) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.cities = cities;
        this.selectedMonth = null;
        this.spinning = false;
        this.rotation = 0;
        this.speed = 0;
        this.selectedCity = null;
        
        this.app = window.travelApp; // 引用主应用
        
        this.initCanvas();
        this.draw();
    }
    
    initCanvas() {
        const container = this.canvas.parentElement;
        const size = Math.min(container.clientWidth, container.clientHeight);
        this.canvas.width = size;
        this.canvas.height = size;
        this.radius = size / 2;
        this.centerX = this.radius;
        this.centerY = this.radius;
    }
    
    draw() {
        const ctx = this.ctx;
        const sliceAngle = (2 * Math.PI) / Math.min(this.cities.length, 100); // 最多显示100个城市
        
        // 清除画布
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制背景
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, this.radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#f8f9fa';
        ctx.fill();
        
        // 绘制轮盘
        for (let i = 0; i < Math.min(this.cities.length, 100); i++) {
            const angle = this.rotation + i * sliceAngle;
            
            // 绘制扇形
            ctx.beginPath();
            ctx.moveTo(this.centerX, this.centerY);
            ctx.arc(this.centerX, this.centerY, this.radius * 0.9, angle, angle + sliceAngle);
            ctx.closePath();
            
            // 交替颜色
            const hue = (i * 360) / Math.min(this.cities.length, 100);
            ctx.fillStyle = i % 2 === 0 ? `hsl(${hue}, 70%, 65%)` : `hsl(${hue}, 70%, 55%)`;
            ctx.fill();
            
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // 绘制文字
            if (this.cities[i].length <= 4) { // 只显示短名称
                ctx.save();
                ctx.translate(this.centerX, this.centerY);
                ctx.rotate(angle + sliceAngle / 2);
                ctx.textAlign = 'right';
                ctx.fillStyle = 'white';
                ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
                ctx.fillText(this.cities[i], this.radius * 0.85, 5);
                ctx.restore();
            }
        }
        
        // 绘制中心圆
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, this.radius * 0.2, 0, 2 * Math.PI);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // 绘制中心文字
        ctx.fillStyle = '#333';
        ctx.font = 'bold 16px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('随机选择', this.centerX, this.centerY);
    }
    
    spin(month) {
        if (this.spinning) return;
        
        this.selectedMonth = month;
        this.spinning = true;
        this.speed = 5 + Math.random() * 3;
        
        // 启用下一步按钮
        document.getElementById('nextStep2').disabled = false;
        
        const spinDuration = 3000 + Math.random() * 2000;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / spinDuration;
            
            if (progress < 1) {
                const easeOut = 1 - Math.pow(1 - progress, 3);
                const currentSpeed = this.speed * (1 - easeOut);
                this.rotation += currentSpeed * (Math.PI / 180);
                this.draw();
                requestAnimationFrame(animate);
            } else {
                this.stop();
            }
        };
        
        animate();
    }
    
    stop() {
        this.spinning = false;
        
        // 计算最终选择
        const sliceAngle = (2 * Math.PI) / Math.min(this.cities.length, 100);
        const normalizedRotation = this.rotation % (2 * Math.PI);
        const selectedIndex = Math.floor((2 * Math.PI - normalizedRotation) / sliceAngle) % Math.min(this.cities.length, 100);
        
        this.selectedCity = this.cities[selectedIndex];
        
        // 更新显示
        document.getElementById('selectedCityDisplay').textContent = this.selectedCity;
        
        // 更新主应用的选择
        if (this.app) {
            this.app.selectedCity = this.selectedCity;
        }
        
        // 显示成功消息
        this.showSelectionMessage();
    }
    
    showSelectionMessage() {
        const message = document.createElement('div');
        message.className = 'success-message';
        message.innerHTML = `
            <div style="position: fixed; top: 20px; right: 20px; background: #d4edda; color: #155724; 
                        padding: 15px; border-radius: 5px; z-index: 10000; animation: fadeIn 0.5s;">
                <strong>选择成功！</strong> 您将前往：${this.selectedCity}
                <button onclick="this.parentElement.remove()" style="margin-left: 10px; cursor: pointer;">×</button>
            </div>
        `;
        document.body.appendChild(message);
        
        setTimeout(() => {
            if (message.parentElement) {
                message.remove();
            }
        }, 3000);
    }
}

// 初始化应用
window.addEventListener('DOMContentLoaded', () => {
    window.travelApp = new TravelRouletteApp();
});