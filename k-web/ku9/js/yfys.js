function main(item) {
    try {
        const cityId = '5A';
        const defaultId = 'cctv1HD';
        const id = ku9.getQuery(item.url, 'id') || defaultId;
        
        // 缓存键名
        const cacheKey = `cqyx_playurl_cache_${id}`;
        
        // 尝试从缓存获取播放地址
        const cachedUrl = ku9.getCache(cacheKey);
        if (cachedUrl) {
            // 检查缓存地址是否有效（简化检查，实际应用中需根据情况调整）
            return { url: cachedUrl };
        }
        
        // 获取播放地址
        const playUrl = fetchPlayUrl(id, cityId);
        if (!playUrl) {
            throw new Error("无法获取播放地址");
        }
        
        // 缓存播放地址（2小时有效期）
        ku9.setCache(cacheKey, playUrl, 7200000);
        
        return { url: playUrl };
        
    } catch (e) {
        return { error: "处理请求失败: " + e.message };
    }
}

function fetchPlayUrl(playId, cityId) {
    const relativeId = playId;
    const type = '1';
    const appId = "kdds-chongqingdemo";
    const timestamps = Date.now();
    
    // 生成签名
    const signStr = `aIErXY1rYjSpjQs7pq2Gp5P8k2W7P^Y@appId${appId}cityId${cityId}playId${playId}relativeId${relativeId}timestamps${timestamps}type${type}`;
    const sign = ku9.md5(signStr);
    
    // 请求头
    const headers = {
        'appId': appId,
        'sign': sign,
        'timestamps': timestamps.toString(),
        'Content-Type': 'application/json;charset=utf-8'
    };
    
    // 构造请求URL
    const apiUrl = `http://118.24.227.71/others/common/playUrlNoAuth?cityId=${cityId}&playId=${playId}&relativeId=${relativeId}&type=${type}`;
    
    // 发送请求
    const response = ku9.request(apiUrl, "GET", headers);
    if (!response.body) {
        throw new Error("API请求失败");
    }
    
    // 解析JSON响应
    const urlData = JSON.parse(response.body);
    if (!urlData.data || !urlData.data.result || !urlData.data.result.protocol || urlData.data.result.protocol.length === 0) {
        throw new Error("无效的API响应");
    }
    
    // 获取最高画质链接
    const transcodes = urlData.data.result.protocol[0].transcode;
    let bestQualityUrl = '';
    
    for (const transcode of transcodes) {
        if (!transcode.quality || !transcode.url) continue;
        
        if (transcode.quality.includes('HD') || transcode.quality.includes('1080')) {
            bestQualityUrl = transcode.url;
            break;
        }
    }
    
    // 返回最佳画质或第一个可用链接
    return bestQualityUrl || (transcodes[0] && transcodes[0].url) || '';
}