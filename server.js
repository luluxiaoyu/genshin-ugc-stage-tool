const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/proxy-image/:base64Url', async (req, res) => {
    let base64Str = req.params.base64Url;

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

        res.set('Cache-Control', 'public, max-age=31104000, immutable');
        res.set('Content-Type', response.headers['content-type']);
        
        res.send(response.data);
    } catch (error) {
        res.status(404).send('Image error');
    }
});

app.get('/guid', async (req, res) => {
    const { id } = req.query; 

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    if (!id) return res.status(400).json({ error: '缺少 ID' });

    const targetUrl = `https://octavia.kj415j45.space/api/stage?region=cn_gf01&id=${id}`;

    try {
        const response = await axios.get(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 15000 
        });

        const rawData = response.data;
        
        if (!rawData || !rawData.author || !rawData.level) {
            return res.status(404).json({ error: '数据结构异常或ID无效' });
        }

        const meta = rawData.level.meta || {};
        const author = rawData.author.game || {};

        let coverUrl = '';
        const coverObj = meta.cover || {};
        if (coverObj.images && coverObj.images.length > 0) {
            coverUrl = coverObj.images[0];
        } else if (coverObj.videoCover) {
            coverUrl = coverObj.videoCover;
        }

        const playersData = meta.players || {};
        const playersStr = playersData.str || 'N/A';
        
        let minPlayers = 999;
        let maxPlayers = 999;
        
        if (playersData.min !== undefined) {
            minPlayers = parseInt(playersData.min);
            maxPlayers = parseInt(playersData.max);
        } else if (playersStr !== 'N/A') {
            const parts = playersStr.split('-');
            const p1 = parseInt(parts[0]);
            if (!isNaN(p1)) {
                minPlayers = p1;
                maxPlayers = parts.length > 1 ? parseInt(parts[1]) : p1;
            }
        }

        const formattedData = {
            authorName: author.name || '未知作者',
            authorAvatar: author.avatar || '',
            levelName: meta.name || '未知关卡',
            levelId: rawData.level.id || id,
            type: meta.type || '未知',
            category: meta.category || '未知',
            playersStr: playersStr,
            hotScore: meta.hotScore || '0',
            goodRate: meta.goodRate || '-',
            sortMin: minPlayers,
            sortMax: maxPlayers,
            coverUrl: coverUrl
        };

        res.json({ success: true, data: formattedData });

    } catch (error) {
        console.error(`Fetch ID ${id} Error: ${error.message}`);
        res.status(500).json({ error: '请求超时或源站错误' });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
