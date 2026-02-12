(function () {
  window.LOVE_CONFIG = {
    dates: {
      // 在一起的日子
      loveStart: "2022-08-18T00:00:00",
      // 小窝上线时间
      siteStart: "2026-02-03T20:00:00",
    },
    nicknames: "欢欢 & 怡怡",

    // 纪念日列表（给 love_calendar 使用）
    anniversaries: [
      { name: "认识纪念日 ❤️", month: 8, day: 18 },
      { name: "欢欢生日 🎂", month: 3, day: 11 },
      { name: "怡怡生日 🎁", month: 7, day: 6 },
      { name: "情人节 🌹", month: 2, day: 14 },
      { name: "周年纪念 💍", month: 8, day: 18 },
    ],

    // 天气城市信息（给 love_weather 使用）
    weather: {
      huan: { id: "101220601", label: "安庆 (欢欢)" },
      yi: { id: "101190401", label: "苏州 (怡怡)" },
    },

    // 足迹地图配置（给 love_map 使用）
    map: {
      geoCoordMap: {
        苏州: [120.58, 31.3],
        景德镇: [117.18, 29.3],
        扬州: [119.41, 32.39],
        安庆: [117.05, 30.53],
        广元: [105.84, 32.43],
        福州: [119.3, 26.08],
      },
      loveData: [
        { name: "苏州", date: "怡怡出生地 & 2026.01" },
        { name: "景德镇", date: "第一次见面 & 2025.12" },
        { name: "扬州", date: "怡怡大学" },
        { name: "安庆", date: "欢欢出生地" },
        { name: "广元", date: "怡怡家" },
        { name: "福州", date: "欢欢大学" },
      ],
      loveLinesFromSuzhou: [
        ["苏州", "景德镇"],
        ["苏州", "扬州"],
        ["安庆", "苏州"],
        ["广元", "苏州"],
        ["福州", "苏州"],
      ],
      visitedProvinces: [
        { name: "江苏", value: 1 },
        { name: "浙江", value: 1 },
        { name: "上海", value: 1 },
        { name: "江西", value: 1 },
        { name: "安徽", value: 1 },
        { name: "四川", value: 1 },
        { name: "福建", value: 1 },
      ],

      // 与城市关联的文章/记忆卡片（给 love_map 的联动面板用）
      stories: {
        景德镇: [
          {
            title: "景德镇跨年",
            url: "/trips/jingdezhen-newyear/",
            cover:
              "https://rsylh.oss-cn-hangzhou.aliyuncs.com/img/%E5%90%88%E7%85%A7/%E5%90%88%E7%85%A7/jdz_hz_2.jpg?x-oss-process=image/format,webp",
            summary:
              "从屏幕两端到陶阳里的烟火，我们第一次把所有的心动落在同一座城。",
          },
        ],
        苏州: [
          {
            title: "苏州小记",
            url: "/trips/suzhou-notes/",
            cover:
              "https://rsylh.oss-cn-hangzhou.aliyuncs.com/img/suzhou2.jpg?x-oss-process=image/format,webp",
            summary:
              "七里山塘的风、河边的灯，还有藏在 OSS 里的一张张笑脸，都是苏州送给我们的礼物。",
          },
          {
            title: "爱的放映室：光影里的每一个瞬间",
            url: "/memories/movie-room/",
            cover:
              "https://rsylh.oss-cn-hangzhou.aliyuncs.com/img/%E6%99%AF%E5%BE%B7%E9%95%87/jdz_17.jpg?x-oss-process=image/format,webp",
            summary:
              "用一帧一帧的小片段，把日常里的每一个心动瞬间偷偷存档。",
          },
        ],
      },
    },
  };
})();


