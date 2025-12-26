# 智能旅游目的地随机选择器

一个基于AI的智能旅游目的地随机选择工具，结合高德地图和豆包API，为用户生成个性化的旅游攻略。

## 功能特点

- 🎯 **全国地级市覆盖**：使用高德地图API获取所有地级市数据
- 🤖 **AI智能规划**：使用豆包API生成个性化旅游攻略
- 💰 **智能预算估算**：基于真实数据的预算计算
- 🗺️ **实时地图集成**：Leaflet地图显示路线和景点
- 📊 **数据可视化**：行程图表和预算分布图
- 📱 **响应式设计**：适配各种设备屏幕
- 🔄 **完全随机选择**：确保每次选择都是真正的随机

## 技术栈

### 前端
- HTML5 + CSS3 + JavaScript (ES6+)
- Leaflet.js (地图)
- ECharts (数据可视化)
- Font Awesome (图标)
- Animate.css (动画效果)

### 后端
- Node.js + Vercel Serverless Functions
- 高德地图API (地理位置数据)
- 豆包API (AI内容生成)

## 快速开始

### 1. 前端部署 (GitHub Pages)

1. Fork本仓库
2. 将`frontend`目录内容上传到您的GitHub仓库
3. 在仓库设置中启用GitHub Pages
4. 选择main分支作为来源

### 2. 后端部署 (Vercel)

1. 安装Vercel CLI：
```bash
npm install -g vercel