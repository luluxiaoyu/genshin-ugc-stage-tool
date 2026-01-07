// 阿里云 ESA / Cloudflare Workers
export default {
    async fetch(request, env, ctx) {
      const url = new URL(request.url);
      const path = url.pathname;
  
      // 通用响应头 (CORS)
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      };
  
      // 处理预检请求 (OPTIONS)
      if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
      }
  
      // --- 图片代理 (/proxy-image/base64Str) ---
      if (path.startsWith('/proxy-image/')) {
        // 提取 base64 字符串
        let base64Str = path.replace('/proxy-image/', '');
        if (base64Str.endsWith('.png')) {
          base64Str = base64Str.slice(0, -4);
        }
  
        if (!base64Str) {
          return new Response('No URL provided', { status: 400, headers: corsHeaders });
        }
  
        try {
          // 解码 Base64
          const decodedUrl = decodeURIComponent(atob(base64Str));
          
          // 使用原生 fetch 请求图片
          const imageRes = await fetch(decodedUrl, {
            headers: { 
              'User-Agent': 'Mozilla/5.0' 
            },
          });
  
          if (!imageRes.ok) {
              throw new Error(`Upstream error: ${imageRes.status}`);
          }
  
          // 获取图片二进制数据
          const imageBuffer = await imageRes.arrayBuffer();
  
          // 返回响应
          return new Response(imageBuffer, {
            headers: {
              ...corsHeaders,
              'Content-Type': imageRes.headers.get('content-type') || 'image/png',
              'Cache-Control': 'public, max-age=31104000, immutable' // 强缓存
            }
          });
  
        } catch (error) {
          return new Response('Image error: ' + error.message, { status: 404, headers: corsHeaders });
        }
      }
  
      // --- 数据查询 (/guid) ---
      if (path === '/guid') {
        const id = url.searchParams.get('id');
  
        const noCacheHeaders = {
          ...corsHeaders,
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Content-Type': 'application/json; charset=utf-8'
        };
  
        if (!id) {
          return new Response(JSON.stringify({ error: '缺少 ID' }), { status: 400, headers: noCacheHeaders });
        }
  
        const targetUrl = `https://octavia.kj415j45.space/api/stage?region=cn_gf01&id=${id}`;
  
        try {
          // 使用原生 fetch
          const response = await fetch(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
          });
  
          if (!response.ok) {
              throw new Error(`Upstream API Error: ${response.status}`);
          }
  
          const rawData = await response.json();
          
          if (!rawData || !rawData.author || !rawData.level) {
            return new Response(JSON.stringify({ error: '数据结构异常或ID无效' }), { status: 404, headers: noCacheHeaders });
          }
  
          // 数据处理逻辑
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
  
          return new Response(JSON.stringify({ success: true, data: formattedData }), {
            status: 200,
            headers: noCacheHeaders
          });
  
        } catch (error) {
          return new Response(JSON.stringify({ error: '请求超时或源站错误: ' + error.message }), { 
              status: 500, 
              headers: noCacheHeaders 
          });
        }
      }
  
      
      return new Response('API is running. Please host your static files (html/images) on OSS or ESA Static Hosting.', {
        status: 200,
        headers: corsHeaders
      });
    }
  };