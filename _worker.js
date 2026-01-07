export default {
    async fetch(request, env, ctx) {
      const url = new URL(request.url);
      
      // 跨域头
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      };
  
      // 预检请求直接返回
      if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
      }
  
      // 1. 图片代理
      if (url.pathname.startsWith('/proxy-image/')) {
        let str = url.pathname.replace('/proxy-image/', '');
        if (str.endsWith('.png')) str = str.slice(0, -4);
  
        if (!str) return new Response('No URL', { status: 400, headers: corsHeaders });
  
        try {
          // 必须先URL解码，再Base64解码
          const targetUrl = atob(decodeURIComponent(str));
          
          const res = await fetch(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
          });
  
          if (!res.ok) throw new Error(res.status);
  
          // 转发图片并强缓存
          return new Response(res.body, {
            headers: {
              ...corsHeaders,
              'Content-Type': res.headers.get('content-type') || 'image/png',
              'Cache-Control': 'public, max-age=31104000, immutable'
            }
          });
  
        } catch (e) {
          return new Response('Img Error', { status: 404, headers: corsHeaders });
        }
      }
  
      // 2. 数据查询
      if (url.pathname === '/guid') {
        const id = url.searchParams.get('id');
        
        // API不缓存
        const apiHeaders = {
          ...corsHeaders,
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json; charset=utf-8'
        };
  
        if (!id) return new Response(JSON.stringify({ error: 'No ID' }), { status: 400, headers: apiHeaders });
  
        try {
          const target = `https://octavia.kj415j45.space/api/stage?region=cn_gf01&id=${id}`;
          const res = await fetch(target, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
          });
  
          if (!res.ok) throw new Error(res.status);
  
          const json = await res.json();
          
          if (!json?.author || !json?.level) {
            return new Response(JSON.stringify({ error: 'Invalid Data' }), { status: 404, headers: apiHeaders });
          }
  
          // 提取数据
          const meta = json.level.meta || {};
          const players = meta.players || {};
          
          // 处理封面
          let cover = '';
          if (meta.cover?.images?.length) cover = meta.cover.images[0];
          else if (meta.cover?.videoCover) cover = meta.cover.videoCover;
  
          // 处理人数区间
          let min = 999, max = 999;
          if (players.min !== undefined) {
            min = parseInt(players.min);
            max = parseInt(players.max);
          } else if (players.str && players.str !== 'N/A') {
            const p = players.str.split('-');
            min = parseInt(p[0]) || 999;
            max = p[1] ? parseInt(p[1]) : min;
          }
  
          const data = {
            authorName: json.author.game?.name || '未知',
            authorAvatar: json.author.game?.avatar || '',
            levelName: meta.name || '未知',
            levelId: json.level.id || id,
            type: meta.type || '未知',
            category: meta.category || '未知',
            playersStr: players.str || 'N/A',
            hotScore: meta.hotScore || '0',
            goodRate: meta.goodRate || '-',
            sortMin: min,
            sortMax: max,
            coverUrl: cover
          };
  
          return new Response(JSON.stringify({ success: true, data }), { status: 200, headers: apiHeaders });
  
        } catch (e) {
          return new Response(JSON.stringify({ error: 'Server Error: ' + e.message }), { status: 500, headers: apiHeaders });
        }
      }
  
      // 3. 其他路径全部重定向到 404 页面
      return Response.redirect(`${url.origin}/404.html`, 302);
    }
  };