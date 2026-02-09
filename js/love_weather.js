(function() {
  const API_KEY = '2e16968946a849efbc0533612cbb473a'; // <--- 记得填这里
  const CITY_HUAN = '101220601'; // 安庆
  const CITY_YI = '101190401';   // 苏州

  async function getW(id) {
    const r = await fetch(`https://devapi.qweather.com/v7/weather/now?location=${id}&key=${API_KEY}`);
    return await r.json();
  }

  async function initW() {
    const hDom = document.querySelector('#weather-huan .info');
    const yDom = document.querySelector('#weather-yi .info');
    const tDom = document.getElementById('weather-tips');
    if (!hDom || !yDom || !tDom) return;

    try {
      const hData = await getW(CITY_HUAN);
      const yData = await getW(CITY_YI);
      if (hData.code === '200' && yData.code === '200') {
        hDom.innerText = `${hData.now.text} ${hData.now.temp}°C`;
        yDom.innerText = `${yData.now.text} ${yData.now.temp}°C`;
        
        const diff = parseInt(hData.now.temp) - parseInt(yData.now.temp);
        if (hData.now.text.includes('雨') && yData.now.text.includes('雨')) {
          tDom.innerText = "虽然隔着屏幕，但我们在听同一场雨 ❤️";
        } else if (diff <= -5) {
          tDom.innerText = "安庆变冷了，欢欢要记得加衣服哦 🧣";
        } else if (diff >= 5) {
          tDom.innerText = "安庆比苏州暖和，欢欢分点热气给怡怡 ☀️";
        } else {
          tDom.innerText = "无论晴雨，想念一直都在 🌸";
        }
      }
    } catch (e) { tDom.innerText = "感知天气失败了..."; }
  }

  initW();
  document.addEventListener('pjax:complete', initW);
})();