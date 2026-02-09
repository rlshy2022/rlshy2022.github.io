(function() {
  // 你的和风天气 API KEY
  const API_KEY = '2e16968946a849efbc0533612cbb473a'; 
  const CITY_HUAN = '101220601'; // 安庆 (欢欢)
  const CITY_YI = '101190401';   // 苏州 (怡怡)

  async function fetchWeather(cityId) {
    // 接口路径：/v7/weather/now
    // 域名：免费版需使用 devapi.qweather.com
    const url = `https://md7fc2pfhe.re.qweatherapi.com/v7/weather/now?location=${cityId}&key=${API_KEY}`;
    //https://devapi.qweather.com/v7/weather/now?location=101190401&key=2e16968946a849efbc0533612cbb473a
    try {
      const response = await fetch(url);
      const data = await response.json();
      return data; // 返回 code 200 为成功
    } catch (err) {
      console.error("天气数据请求失败:", err);
      return null;
    }
  }

  async function updateLoveWeather() {
    const huanDom = document.querySelector('#weather-huan .info');
    const yiDom = document.querySelector('#weather-yi .info');
    const tipsDom = document.getElementById('weather-tips');

    // 严谨判断：确保 DOM 元素存在
    if (!huanDom || !yiDom || !tipsDom) return;

    const dataH = await fetchWeather(CITY_HUAN);
    const dataY = await fetchWeather(CITY_YI);

    if (dataH && dataH.code === "200" && dataY && dataY.code === "200") {
      // 提取 temp(温度) 和 text(状况)
      const h = dataH.now;
      const y = dataY.now;

      huanDom.innerText = `${h.text} ${h.temp}°C`;
      yiDom.innerText = `${y.text} ${y.temp}°C`;

      // 情感联动逻辑
      const tempDiff = parseInt(h.temp) - parseInt(y.temp);
      
      // 场景1：两地都在下雨
      if (h.text.includes('雨') && y.text.includes('雨')) {
        tipsDom.innerText = "虽然隔着屏幕，但我们在听同一场雨 ❤️";
      } 
      // 场景2：温差较大
      else if (tempDiff <= -5) {
        tipsDom.innerText = "安庆变冷了，欢欢要记得加衣服哦 🧣";
      } 
      else if (tempDiff >= 5) {
        tipsDom.innerText = "安庆比苏州暖和，欢欢分点热气给怡怡 ☀️";
      } 
      // 场景3：天气一致
      else if (h.text === y.text) {
        tipsDom.innerText = `很有默契，今天两地都是 ${h.text} ✨`;
      } 
      // 默认
      else {
        tipsDom.innerText = "无论晴雨，想念一直都在 🌸";
      }
    } else {
      tipsDom.innerText = "天气感知暂时失灵了...";
    }
  }

  // 1. 立即执行一次
  updateLoveWeather();

  // 2. 适配 Butterfly 的 PJAX (切换页面时不失效)
  document.addEventListener('pjax:complete', updateLoveWeather);

  // 3. 容错逻辑：针对加载缓慢的情况，500ms 后再次尝试
  setTimeout(updateLoveWeather, 500);
})();