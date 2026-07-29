(function () {
  window.LOVE_CONFIG = {
    dates: {
      // 在一起的日子
      loveStart: "2022-08-18T00:00:00",
      // 小窝上线时间
      siteStart: "2026-02-03T20:00:00",
    },
    nicknames: "欢欢 & 怡怡",

    // 页面级功能开关。关闭后 boot.js 不再加载对应资源，便于灰度和快速回滚。
    features: {
      homePortal: true,
      loveAlert: false,
      articleReactions: true,
      dailyQuote: false,
      commentsEnhance: true,
      clickPhrases: false,
      sakura: false,
      cursorTrail: false,
      specialDay: true,
      anniversaryBadge: false,
      pwa: true,
    },

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
    },

    // 足迹地图配置（给 love_map 使用）
    map: {
      geoCoordMap: {
        苏州: [120.58, 31.3],
        景德镇: [117.18, 29.3],
        扬州: [119.41, 32.39],
        黄山: [118.33, 29.72],
        安庆: [117.05, 30.53],
        广元: [105.84, 32.43],
        福州: [119.3, 26.08],
        宁国: [118.98, 30.63],
      },
      loveData: [
        { name: "苏州", date: "怡怡出生地 & 2026.01" },
        { name: "景德镇", date: "第一次见面 & 2025.12" },
        { name: "扬州", date: "怡怡大学" },
        { name: "黄山", date: "清明与七月再访 & 2026.04/07" },
        { name: "安庆", date: "欢欢出生地" },
        { name: "广元", date: "怡怡家" },
        { name: "福州", date: "母校重逢 & 2026.06" },
        { name: "宁国", date: "七月出走 & 2026.07" },
      ],
      loveLinesFromSuzhou: [
        ["苏州", "景德镇"],
        ["苏州", "扬州"],
        ["扬州", "黄山"],
        ["黄山", "福州"],
        ["安庆", "苏州"],
        ["广元", "苏州"],
        ["福州", "苏州"],
        ["苏州", "宁国"],
        ["宁国", "黄山"],
        ["黄山", "苏州"],
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
              "从屏幕两端到陶阳里的烟火，我们第一次在同一座城跨年。",
          },
        ],
        黄山: [
          {
            title: "清明的黄山游记",
            url: "/2026/04/07/%E6%B8%85%E6%98%8E%E7%9A%84%E9%BB%84%E5%B1%B1%E5%B0%8F%E8%AE%B0/",
            cover:
              "https://rsylh.oss-cn-hangzhou.aliyuncs.com/img/hs/qt/qt8.jpg?x-oss-process=image/format,webp",
            summary:
              "清明那次黄山，我们去了屯溪老街、黎阳老街和新安江边，也写下了红色心愿牌。",
          },
          {
            title: "七月宁国黄山游记",
            url: "/trips/ningguo-huangshan-2026/",
            cover:
              "https://rsylh.oss-cn-hangzhou.aliyuncs.com/img/nghs/nghs57.jpg?x-oss-process=image/format,webp",
            summary:
              "2026 年 7 月，我们先在宁国玩，再去把上次没有爬的黄山补上，最后回到屯溪、黎阳和新安江边，看见四月的红色心愿牌还在。",
          },
        ],
        宁国: [
          {
            title: "七月宁国黄山游记",
            url: "/trips/ningguo-huangshan-2026/",
            cover:
              "https://rsylh.oss-cn-hangzhou.aliyuncs.com/img/nghs/nghs14.jpg?x-oss-process=image/format,webp",
            summary:
              "2026 年 7 月 15 日，我们先在宁国把这趟旅行打开，玩到 7 月 17 日，再从宁国转去黄山。",
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
              "把旅行和日常里的视频片段集中放在放映室里。",
          },
        ],
        福州: [
          {
            title: "福州小记",
            url: "/trips/fuzhou-2026/",
            cover:
              "https://rsylh.oss-cn-hangzhou.aliyuncs.com/img/fuzhou/fuzhou32.jpg?x-oss-process=image/format,webp",
            summary:
              "2026 年 6 月 17 日，我们在福州见面，去了欢欢的母校福建师范大学，逛了福师大西门小吃街，又去长乐看海。",
          },
        ],
      },
    },

    // 相册章节信息（给 gallery 页面纪念册化增强使用）
    galleryChapters: {
      景德镇: {
        badge: "初见城市",
        date: "2025 · 冬天",
        desc: "第一次见面的温度，被我们一起悄悄封进了瓷都的风和跨年的烟火里。",
        quote: "原来见面的那一刻，真的会让所有想念瞬间有了实体。",
        accent: "#7eb6ff",
      },
      苏州: {
        badge: "旅行记录",
        date: "2026 · 初春",
        desc: "苏州这一组记录里，有七里山塘、小桥、晚风和一起散步的照片。",
        quote: "那天我们边走边吃，苏州就被记住了。",
        accent: "#ff8aa5",
      },
      扬州: {
        badge: "烟花三月",
        date: "2026 · 春天",
        desc: "扬州这一组记录里，有校园散步、超市采购和一起煮火锅。",
        quote: "到了扬州以后，见面这件事终于落到真实生活里。",
        accent: "#f4a261",
      },
      黄山: {
        badge: "清明出走",
        date: "2026 · 四月",
        desc: "清明黄山这一组记录里，有屯溪老街、黎阳老街、新安江边和红色心愿牌。",
        quote: "四月的黄山，记住的是老街、江边和那块心愿牌。",
        accent: "#87a96b",
      },
      福州: {
        badge: "母校与海",
        date: "2026 · 六月",
        desc: "福州这一组记录里，有福建师范大学、福师大西门小吃街和长乐海边。",
        quote: "福州从这一天开始，也有了我们一起走过的路。",
        accent: "#6fa9b7",
      },
      宁国黄山: {
        badge: "七月登山",
        date: "2026 · 七月",
        desc: "先在宁国玩，再爬上黄山，最后回到屯溪、黎阳和新安江边，把四月的心愿牌重新打开。",
        quote: "7 月先到宁国，再爬黄山，最后回去看四月的红色心愿牌。",
        accent: "#7da06f",
      },
      gifts: {
        badge: "礼物存档",
        date: "互相准备的心意",
        desc: "这里记录互相准备礼物、拆开礼物和收到惊喜的时刻。",
        quote: "你收到的是礼物，我收到的是你开心时亮起来的眼睛。",
        accent: "#ff6f91",
      },
      日常: {
        badge: "日常切片",
        date: "平凡也闪光",
        desc: "聊天、电影、情书和一些没有出远门的日子，都归到日常里。",
        quote: "后来最珍贵的回忆，常常都来自最普通的一天。",
        accent: "#64c2a6",
      },
      生日: {
        badge: "特别日子",
        date: "限定开心",
        desc: "蛋糕、烛光和笑脸一起出现的时候，连愿望都变得具体又明亮。",
        quote: "生日这一天，最重要的是你在。",
        accent: "#ffd166",
      },
    },

    // 照片墙分场景配置（给 photo-wall 页面体验增强使用）
    photoWallScenes: [
      {
        key: "jingdezhen",
        label: "景德镇",
        badge: "初见篇章",
        desc: "第一次把喜欢从屏幕两端，走进同一座城市的证据。",
        accent: "#7eb6ff",
        keywords: ["jdz_", "景德镇", "jingdezhen"],
      },
      {
        key: "suzhou",
        label: "苏州",
        badge: "旅行胶片",
        desc: "小桥、晚风和一起散步的照片，都在苏州这一组里。",
        accent: "#ff8aa5",
        keywords: ["sz_", "szhz", "sz_hz", "suzhou", "苏州"],
      },
      {
        key: "yangzhou",
        label: "扬州",
        badge: "春日远行",
        desc: "扬州这一组有重逢、校园散步、采购和一起煮火锅。",
        accent: "#f4a261",
        keywords: ["yz", "扬州", "yangzhou"],
      },
      {
        key: "ningguo_huangshan",
        label: "宁国黄山",
        badge: "七月登山",
        desc: "先宁国、再爬黄山、再回屯溪黎阳新安江，旧心愿牌也在七月被重新打开。",
        accent: "#7da06f",
        keywords: ["img/nghs/", "/nghs/", "nghs", "宁国", "宁国黄山", "爬黄山", "心愿牌"],
      },
      {
        key: "huangshan",
        label: "黄山",
        badge: "清明出走",
        desc: "老街、江边、暖阳、心愿牌和几个好笑的小插曲都在这里。",
        accent: "#87a96b",
        keywords: ["img/hs/", "/hs/", "huangshan", "黄山"],
      },
      {
        key: "fuzhou",
        label: "福州",
        badge: "母校与海",
        desc: "福师大的路、西门小吃街和长乐海边，是福州六月的主要记录。",
        accent: "#6fa9b7",
        keywords: ["img/fuzhou/", "/fuzhou/", "fuzhou", "福州", "长乐", "福师大"],
      },
      {
        key: "gifts",
        label: "礼物",
        badge: "心意存档",
        desc: "互相准备过的礼物和拆开惊喜的瞬间，单独放在这里。",
        accent: "#ff6f91",
        keywords: ["礼物", "gift", "hh_s_yy", "yy_s_hh"],
      },
      {
        key: "birthday",
        label: "生日",
        badge: "特别日子",
        desc: "蛋糕、烛光和笑脸一起出现的时候，连空气都在庆祝。",
        accent: "#ffd166",
        keywords: ["dg", "生日", "birthday"],
      },
      {
        key: "daily",
        label: "日常",
        badge: "日常片段",
        desc: "聊天、电影、情书和一些没有出远门的日子，都归到这里。",
        accent: "#64c2a6",
        keywords: ["bige", "jianshen", "kaifa", "/其他/", "daily"],
      },
    ],

    // 首页随机回忆卡 / 纪念册封面用
    memoryDeck: [
      {
        title: "第一次把心动落进同一座城",
        date: "2025 · 景德镇",
        mood: "初见",
        image:
          "https://rsylh.oss-cn-hangzhou.aliyuncs.com/img/%E5%90%88%E7%85%A7/%E5%90%88%E7%85%A7/jdz_hz_2.jpg?x-oss-process=image/format,webp",
        summary:
          "从屏幕两端到真正站在彼此身边，景德镇跨年是我们第一次见面的记录。",
        quote: "第一次见面，是 2025 年最后一天。",
        url: "/trips/jingdezhen-newyear/",
      },
      {
        title: "七里山塘的风，替我们记得那天",
        date: "2026 · 苏州",
        mood: "旅行",
        image:
          "https://rsylh.oss-cn-hangzhou.aliyuncs.com/img/suzhou2.jpg?x-oss-process=image/format,webp",
        summary:
          "我们在苏州走七里山塘，看小桥和夜色，也留下第一次共同旅行的照片。",
        quote: "那天我们边走边吃，苏州就被记住了。",
        url: "/trips/suzhou-notes/",
      },
      {
        title: "写给你的情人节",
        date: "2026 · 2月14日",
        mood: "情书",
        image:
          "https://rsylh.oss-cn-hangzhou.aliyuncs.com/img/wz_1.jpg",
        summary:
          "情人节那天，把想对怡怡说的话写成了一篇专属告白。",
        quote: "喜欢你这件事，节日里要说，平时也要说。",
        url: "/2026/02/14/%E6%83%85%E4%BA%BA%E8%8A%82%E7%89%B9%E5%88%8A/",
      },
      {
        title: "烟花三月下扬州",
        date: "2026 · 扬州",
        mood: "远行",
        image:
          "https://rsylh.oss-cn-hangzhou.aliyuncs.com/img/%E6%89%AC%E5%B7%9E/yz21.jpg?x-oss-process=image/format,webp",
        summary:
          "城市是新的，但陪你走路、拍照、停下来看风景的那种安心感，一直都很熟悉。",
        quote: "在扬州，我们把想念接回了现实。",
        url: "/2026/03/04/%E7%83%9F%E8%8A%B1%E4%B8%89%E6%9C%88%E4%B8%8B%E6%89%AC%E5%B7%9E/",
      },
      {
        title: "清明的黄山",
        date: "2026 · 黄山",
        mood: "清明",
        image:
          "https://rsylh.oss-cn-hangzhou.aliyuncs.com/img/hs/qt/qt18.jpg?x-oss-process=image/format,webp",
        summary:
          "屯溪老街、黎阳老街、江边台阶、几顿火锅和红色心愿牌，组成了清明黄山。",
        quote: "四月的黄山，记住的是老街、江边和那块心愿牌。",
        url: "/2026/04/07/%E6%B8%85%E6%98%8E%E7%9A%84%E9%BB%84%E5%B1%B1%E5%B0%8F%E8%AE%B0/",
      },
      {
        title: "福州六月，母校和海",
        date: "2026 · 福州",
        mood: "看海",
        image:
          "https://rsylh.oss-cn-hangzhou.aliyuncs.com/img/fuzhou/fuzhou32.jpg?x-oss-process=image/format,webp",
        summary:
          "从福建师范大学到西门小吃街，再到长乐海边，福州这次留下了 33 张照片。",
        quote: "福州从这一天开始，也有了我们一起走过的路。",
        url: "/trips/fuzhou-2026/",
      },
      {
        title: "七月宁国黄山",
        date: "2026 · 宁国黄山",
        mood: "登山",
        image:
          "https://rsylh.oss-cn-hangzhou.aliyuncs.com/img/nghs/nghs57.jpg?x-oss-process=image/format,webp",
        summary:
          "我们先在宁国玩，再去爬黄山，最后回到屯溪、黎阳和新安江边，看见四月的红色心愿牌还在。",
        quote: "7 月先到宁国，再爬黄山，最后回去看四月的红色心愿牌。",
        url: "/trips/ningguo-huangshan-2026/",
      },
      {
        title: "互相准备的礼物",
        date: "2026 · 冬天",
        mood: "礼物",
        image:
          "https://rsylh.oss-cn-hangzhou.aliyuncs.com/img/gift.jpg?x-oss-process=image/format,webp",
        summary:
          "每一次挑选、准备和拆开礼物的瞬间，都被单独放进这一页。",
        quote: "你收到的是礼物，我收到的是你开心时的眼睛。",
        url: "/2026/02/11/%E7%A4%BC%E7%89%A9%E7%89%B9%E5%88%8A/",
      },
      {
        title: "把日常剪成一格一格的电影",
        date: "我们的放映室",
        mood: "光影",
        image:
          "https://rsylh.oss-cn-hangzhou.aliyuncs.com/img/%E6%99%AF%E5%BE%B7%E9%95%87/jdz_17.jpg?x-oss-process=image/format,webp",
        summary:
          "把旅行、日常和一些视频片段放在一起，方便以后重新播放。",
        quote: "最想留住的镜头，往往是一起生活时顺手拍下来的。",
        url: "/memories/movie-room/",
      },
    ],
  };
})();
