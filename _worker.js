export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // --- 通用配置 ---
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // 预检请求直接返回
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // --- 图片代理 ---
    if (url.pathname.startsWith('/proxy-image/')) {
      let str = url.pathname.replace('/proxy-image/', '');
      if (str.endsWith('.png')) str = str.slice(0, -4);

      if (!str) return new Response('No URL', { status: 400, headers: corsHeaders });

      try {
        const targetUrl = atob(decodeURIComponent(str));
        const res = await fetch(targetUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        if (!res.ok) throw new Error(res.status);

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

    // --- 数据查询 ---
    if (url.pathname === '/guid') {
      const id = url.searchParams.get('id');

      const apiHeaders = {
        ...corsHeaders,
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json; charset=utf-8'
      };

      if (!id) {
        return new Response(JSON.stringify({ error: 'No ID' }), { status: 400, headers: apiHeaders });
      }

      try {
        const endpoint = 'https://bbs-api.miyoushe.com/community/ugc_community/web/api/level/full/info';
        const payload = {
          region: 'cn_gf01', // 官服
          level_id: id,
          agg_req_list: [
            { api_name: 'level_detail' },
            { api_name: 'developer_info' },
            { api_name: 'config' }
          ]
        };

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Content-Type': 'application/json',
            'Referer': 'https://www.miyoushe.com/' 
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error(`Miyoushe API Error: ${res.status}`);

        const jsonDoc = await res.json();

        // 检查返回的错误码
        if (jsonDoc.retcode !== 0) {
          return new Response(JSON.stringify({ error: `API Error: ${jsonDoc.message}` }), { status: 404, headers: apiHeaders });
        }

        const respMap = jsonDoc.data?.resp_map;
        
        // 安全检查
        if (!respMap?.level_detail?.data?.level_detail_response?.level_info ||
            !respMap?.developer_info?.data?.developer_news_response) {
          return new Response(JSON.stringify({ error: 'Invalid Data Structure' }), { status: 404, headers: apiHeaders });
        }

        const levelInfo = respMap.level_detail.data.level_detail_response.level_info;
        const developerInfo = respMap.developer_info.data.developer_news_response;

        // 处理分类
        const categoryStr = levelInfo.play_cate === "LEVEL_CATE_LONG_TERM" ? "长线游玩" : "轻量趣味";

        // 处理封面
        let coverUrl = levelInfo.cover_img?.url;
        if (!coverUrl && levelInfo.images && levelInfo.images.length > 0) {
          coverUrl = levelInfo.images[0].url;
        }
        if (!coverUrl && levelInfo.video_info?.video_cover) {
          coverUrl = levelInfo.video_info.video_cover;
        }

        // 处理人数区间
        const min = parseInt(levelInfo.limit_play_num_min) || 999;
        const max = parseInt(levelInfo.limit_play_num_max) || 999;

        // 构建最终返回数据 (保持原有格式)
        const data = {
          authorName: developerInfo.developer.game_nickname || '未知',
          authorAvatar: developerInfo.developer.game_avatar || '',
          levelName: levelInfo.level_name || '未知',
          levelId: id, 
          type: levelInfo.play_type || '未知',
          category: categoryStr,
          playersStr: levelInfo.show_limit_play_num_str || 'N/A',
          hotScore: levelInfo.hot_score || '0',
          goodRate: levelInfo.good_rate || '-',
          sortMin: min,
          sortMax: max,
          coverUrl: coverUrl || ''
        };

        return new Response(JSON.stringify({ success: true, data }), { status: 200, headers: apiHeaders });

      } catch (e) {
        return new Response(JSON.stringify({ error: 'Server Error: ' + e.message }), { status: 500, headers: apiHeaders });
      }
    }

    // --- 其他路径重定向 ---
    return Response.redirect(`${url.origin}/404.html`, 302);
  }
};
