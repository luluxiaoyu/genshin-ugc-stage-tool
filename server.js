const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 静态文件托管
app.use(express.static(path.join(__dirname, 'public')));

// --- 图片代理接口 ---
app.get('/proxy-image/:base64Url', async (req, res) => {
    let base64Str = req.params.base64Url;

    // 去除可能存在的后缀
    if (base64Str.endsWith('.png')) {
        base64Str = base64Str.slice(0, -4);
    }

    if (!base64Str) return res.status(400).send('No URL provided');

    try {
        const decodedStr = decodeURIComponent(base64Str);
        const imageUrl = Buffer.from(decodedStr, 'base64').toString('utf-8');

        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000 
        });

        // 强缓存设置
        res.set('Cache-Control', 'public, max-age=31104000, immutable');
        res.set('Content-Type', response.headers['content-type']);
        
        res.send(response.data);
    } catch (error) {
        res.status(404).send('Image error');
    }
});

// --- 2数据查询接口 ---
app.get('/guid', async (req, res) => {
    const { id } = req.query; 

    // API 禁用缓存
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    if (!id) return res.status(400).json({ error: '缺少 ID' });

    try {
        // 官方接口地址
        const endpoint = 'https://bbs-api.miyoushe.com/community/ugc_community/web/api/level/full/info';
        
        // 构造 POST 请求体
        const payload = {
            region: 'cn_gf01', // 官服
            level_id: id,
            agg_req_list: [
                { api_name: 'level_detail' },
                { api_name: 'developer_info' },
                { api_name: 'config' }
            ]
        };

        const response = await axios.post(endpoint, payload, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.miyoushe.com/',
                'Content-Type': 'application/json'
            },
            timeout: 15000 
        });

        const jsonDoc = response.data;
        
        // 检查业务状态码 (0 为成功)
        if (jsonDoc.retcode !== 0) {
            return res.status(404).json({ error: `API Error: ${jsonDoc.message}` });
        }

        const respMap = jsonDoc.data?.resp_map;

        // 校验数据结构
        if (!respMap?.level_detail?.data?.level_detail_response?.level_info ||
            !respMap?.developer_info?.data?.developer_news_response) {
            return res.status(404).json({ error: '数据结构异常' });
        }

        // 提取核心数据对象
        const levelInfo = respMap.level_detail.data.level_detail_response.level_info;
        const developerInfo = respMap.developer_info.data.developer_news_response;

        // 处理封面逻辑：cover_img > images[0] > video_cover
        let coverUrl = levelInfo.cover_img?.url;
        if (!coverUrl && levelInfo.images && levelInfo.images.length > 0) {
            coverUrl = levelInfo.images[0].url;
        }
        if (!coverUrl && levelInfo.video_info?.video_cover) {
            coverUrl = levelInfo.video_info.video_cover;
        }

        // 处理人数区间
        const minPlayers = parseInt(levelInfo.limit_play_num_min) || 999;
        const maxPlayers = parseInt(levelInfo.limit_play_num_max) || 999;

        // 格式化返回数据
        const formattedData = {
            authorName: developerInfo.developer.game_nickname || '未知作者',
            authorAvatar: developerInfo.developer.game_avatar || '',
            levelName: levelInfo.level_name || '未知关卡',
            levelId: id,
            type: levelInfo.play_type || '未知',
            category: levelInfo.play_cate === "LEVEL_CATE_LONG_TERM" ? "长线游玩" : "轻量趣味",
            playersStr: levelInfo.show_limit_play_num_str || 'N/A',
            hotScore: levelInfo.hot_score || '0',
            goodRate: levelInfo.good_rate || '-',
            sortMin: minPlayers,
            sortMax: maxPlayers,
            coverUrl: coverUrl || ''
        };

        res.json({ success: true, data: formattedData });

    } catch (error) {
        console.error(`Fetch ID ${id} Error: ${error.message}`);
        res.status(500).json({ error: '服务器内部错误或请求超时' });
    }
});

// --- 404 处理路由 ---
app.get('*', (req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
