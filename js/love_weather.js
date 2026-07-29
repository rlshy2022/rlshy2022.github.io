(function () {
  "use strict";

  if (window.__LOVE_WEATHER_INITIALIZED__) return;
  window.__LOVE_WEATHER_INITIALIZED__ = true;

  const WEATHER_CFG = (window.LOVE_CONFIG && window.LOVE_CONFIG.weather) || {};
  const DEFAULT_CITIES = {
    huan: {
      latitude: 26.08,
      longitude: 119.3,
      cityName: "福州",
      label: "福州 (欢欢)",
    },
    yi: {
      latitude: 32.39,
      longitude: 119.42,
      cityName: "扬州",
      label: "扬州 (怡怡)",
    },
  };

  const WEATHER_TEXT = {
    0: "晴朗",
    1: "大部晴朗",
    2: "多云",
    3: "阴天",
    45: "有雾",
    48: "冻雾",
    51: "毛毛雨",
    53: "小雨",
    55: "细雨",
    56: "冻毛毛雨",
    57: "强冻毛毛雨",
    61: "小雨",
    63: "中雨",
    65: "大雨",
    66: "冻雨",
    67: "强冻雨",
    71: "小雪",
    73: "中雪",
    75: "大雪",
    77: "雪粒",
    80: "阵雨",
    81: "强阵雨",
    82: "暴雨",
    85: "阵雪",
    86: "强阵雪",
    95: "雷暴",
    96: "雷暴伴冰雹",
    99: "强雷暴伴冰雹",
  };

  const RAINY_CODES = new Set([
    51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99,
  ]);

  let requestToken = 0;

  const getCityConfig = (key) => ({ ...DEFAULT_CITIES[key], ...(WEATHER_CFG[key] || {}) });
  const getWeatherText = (code) => WEATHER_TEXT[code] || "天气未知";
  const isRainyCode = (code) => RAINY_CODES.has(code);

  async function fetchWeather(city) {
    const params = new URLSearchParams({
      latitude: String(city.latitude),
      longitude: String(city.longitude),
      current: "temperature_2m,weather_code",
      timezone: "Asia/Shanghai",
    });

    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Weather request failed: ${response.status}`);
    }

    const data = await response.json();
    const current = data && data.current;

    if (
      !current ||
      typeof current.temperature_2m !== "number" ||
      typeof current.weather_code !== "number"
    ) {
      throw new Error("Weather payload missing current data");
    }

    return {
      temperature: Math.round(current.temperature_2m),
      code: current.weather_code,
      text: getWeatherText(current.weather_code),
    };
  }

  function getWeatherTip(huanWeather, yiWeather, huanCity, yiCity) {
    const tempDiff = huanWeather.temperature - yiWeather.temperature;

    if (isRainyCode(huanWeather.code) && isRainyCode(yiWeather.code)) {
      return "虽然隔着屏幕，但我们在听同一场雨 ❤️";
    }

    if (tempDiff <= -5) {
      return `${huanCity.cityName}变冷了，欢欢要记得加衣服哦 🧣`;
    }

    if (tempDiff >= 5) {
      return `${huanCity.cityName}比${yiCity.cityName}暖和，欢欢分点热气给怡怡 ☀️`;
    }

    if (huanWeather.code === yiWeather.code) {
      return `很有默契，今天两地都是 ${huanWeather.text} ✨`;
    }

    return "无论晴雨，想念一直都在 🌸";
  }

  async function updateLoveWeather() {
    const huanDom = document.querySelector("#weather-huan .info");
    const yiDom = document.querySelector("#weather-yi .info");
    const tipsDom = document.getElementById("weather-tips");

    if (!huanDom || !yiDom || !tipsDom) return;

    const currentToken = ++requestToken;
    const huanCity = getCityConfig("huan");
    const yiCity = getCityConfig("yi");

    try {
      const [huanWeather, yiWeather] = await Promise.all([
        fetchWeather(huanCity),
        fetchWeather(yiCity),
      ]);

      if (currentToken !== requestToken) return;

      huanDom.textContent = `${huanWeather.text} ${huanWeather.temperature}°C`;
      yiDom.textContent = `${yiWeather.text} ${yiWeather.temperature}°C`;
      tipsDom.textContent = getWeatherTip(huanWeather, yiWeather, huanCity, yiCity);
    } catch (error) {
      if (currentToken !== requestToken) return;
      console.error("天气数据请求失败:", error);
      tipsDom.textContent = "天气感知暂时失灵了...";
    }
  }

  updateLoveWeather();
  document.addEventListener("pjax:complete", updateLoveWeather);
  setTimeout(updateLoveWeather, 500);
})();
