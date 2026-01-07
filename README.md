# ✨ Genshin UGC Stage Tool (千星奇域关卡数据提取)

**Genshin UGC Stage Tool** 是一个用于批量提取、展示和导出《原神》“千星奇域”关卡数据的 Web 工具。支持通过关卡 ID 批量查询，生成包含封面、作者、热度、好评率及游玩人数的精美统计长图。

## 🚀 功能特性

- **批量查询**：支持一次性输入多个关卡 ID 进行批量提取。
- **多维数据**：展示关卡封面、作者信息、标签分类、热度评分、好评率及游玩人数。
- **智能排序**：支持“原始输入顺序”与“游玩人数倒序”一键切换。
- **高清导出**：基于 `html2canvas` 实现高清长图生成，支持自动排版和裁剪。
- **图片代理**：内置 Node.js 代理服务，解决跨域问题 (CORS) 并自动缓存图片资源（360天），提升二次加载速度。
- **本地缓存**：前端实现 LocalStorage 缓存（3小时），避免短时间内重复请求 API。
- **优雅交互**：采用毛玻璃（Glassmorphism）UI 设计，适配移动端与桌面端。

## 🛠️ 技术栈

- **前端**：HTML5, CSS3 (Glassmorphism), JavaScript (ES6+)
- **UI 框架**：Bootstrap 5.3
- **图标库**：FontAwesome 7.0
- **截图生成**：html2canvas
- **后端**：Node.js, Express
- **网络请求**：Axios

## 📦 安装与使用

### 1. 克隆项目

```bash
git clone https://github.com/luluxiaoyu/genshin-ugc-helpers.git
cd genshin-ugc-helpers
```

### 2. 安装依赖

确保本地已安装 [Node.js](https://nodejs.org/) 环境。

```bash
pnpm install
```

### 3. 启动服务

```bash
node server.js
```

### 4. 访问工具

打开浏览器访问：`http://localhost:3000`

## 📊 数据来源说明

本项目的所有关卡核心数据（包括但不限于 ID、作者、统计数据、封面链接）均来源于第三方接口。

- **数据源**: **Octavia - 千星奇域工具**
- **源站地址**: https://octavia.kj415j45.space/

> 本工具仅作为数据的聚合展示端，不存储原始关卡元数据，数据的准确性与时效性由源站决定。

## ⚠️ 免责声明 (Disclaimer)

1. **非官方应用**：本项目是基于爱好者开发的第三方工具，与 **上海米哈游网络科技股份有限公司 (Hoyoverse/MiHoYo)** 无任何官方关联。
2. **仅供学习**：本项目代码仅供编程学习与技术交流使用，**严禁用于任何商业用途**。
3. **版权归属**：游戏内的所有素材（包括但不限于图片、图标、文本、设计）版权均归 **上海米哈游网络科技股份有限公司** 所有。
4. **数据责任**：本工具使用公开或第三方提供的 API 接口获取数据，开发者不对数据的准确性、完整性或因使用本工具导致的任何账号风险承担责任。
5. **资源滥用**：请勿对源站 API 进行高频恶意请求。本工具已内置缓存机制以减轻服务器压力，使用者应当自觉遵守网络礼仪。

## 📄 许可证

本项目采用 [MIT License](https://www.google.com/search?q=LICENSE) 开源。

------

**Genshin UGC Stage Tool** GitHub: [luluxiaoyu/genshin-ugc-stage-tool]([luluxiaoyu/genshin-ugc-stage-tool](https://github.com/luluxiaoyu/genshin-ugc-stage-tool))