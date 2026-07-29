(function () {
  "use strict";

  const THEMES = {
    // 梦幻粉色：当前默认风格
    pink_dream: {
      id: "pink_dream",
      displayName: "粉色恋爱",
      phrases: [
        "爱你 ❤️",
        "想你 ✨",
        "么么哒 🌸",
        "执子之手 🤝",
        "欢欢 ❤️ 怡怡",
        "始终如一",
        "咱俩天下第一好",
        "小窝最暖"
      ],
      particles: ["💗", "✨", "💖", "💫", "⭐", "🌸", "💕", "💞"],
      baseDistance: 85,
      baseDuration: 730,
      pathStyle: "mixed", // 直上 + 弧线 + 少量绕圈
      gradients: {
        light: "linear-gradient(180deg, rgba(255,255,255,0.95), #FFD1DC)",
        dark: "linear-gradient(180deg, #D81B60, #880E4F)",
        textShadowLight: "0 0 6px rgba(0,0,0,0.35)",
        textShadowDark: "0 0 6px rgba(255,255,255,0.55)"
      },
      particleCount: 7,
      // 整体皮肤（全站配色与背景）
      skin: {
        primary: "#FF9EAC",
        secondary: "#89C3EB",
        bodyBg:
          "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 30%, #fdf2ff 100%)",
        metaThemeColor: "#FF9EAC"
      }
    },
    // 星光夜空：偏蓝紫 + 绕圈轨迹
    star_night: {
      id: "star_night",
      displayName: "星光夜空",
      phrases: [
        "陪你看星星 ✨",
        "今晚的月亮为你亮",
        "你是我的小星星 ⭐",
        "星河滚烫，你是人间理想",
        "夜空下的约定 🌙",
        "银河为你铺路",
        "抬头总能看到你"
      ],
      particles: ["✨", "⭐", "🌙", "💫", "🌌"],
      baseDistance: 110,
      baseDuration: 900,
      pathStyle: "orbit", // 更偏向绕圈旋转
      gradients: {
        light: "linear-gradient(180deg, #5C6BC0, #1E88E5)",
        dark: "linear-gradient(180deg, #BBDEFB, #E3F2FD)",
        textShadowLight: "0 0 6px rgba(0,0,0,0.45)",
        textShadowDark: "0 0 8px rgba(0,0,0,0.7)"
      },
      particleCount: 6,
      skin: {
        primary: "#5C6BC0",
        secondary: "#90CAF9",
        bodyBg:
          "linear-gradient(135deg, #050816 0%, #0b1120 40%, #020617 100%)",
        metaThemeColor: "#0b1120"
      }
    },
    // 元气早晨：清爽橙黄 + 波浪轨迹
    sunny_morning: {
      id: "sunny_morning",
      displayName: "元气早晨",
      phrases: [
        "早安呀 ☀️",
        "今天也要开心",
        "元气满满 💪",
        "多喝热水呀",
        "阳光正好 🌈",
        "出门记得戴口罩",
        "拥抱新的一天"
      ],
      particles: ["☀️", "✨", "🌈", "🍊", "🌻"],
      baseDistance: 75,
      baseDuration: 650,
      pathStyle: "wave", // 左右摆动更明显
      gradients: {
        light: "linear-gradient(180deg, #FFB74D, #FF9800)",
        dark: "linear-gradient(180deg, #FFF8E1, #FFE082)",
        textShadowLight: "0 0 5px rgba(255,255,255,0.5)",
        textShadowDark: "0 0 7px rgba(0,0,0,0.5)"
      },
      particleCount: 5,
      skin: {
        primary: "#FFB74D",
        secondary: "#FFCC80",
        bodyBg:
          "linear-gradient(135deg, #FFFDE7 0%, #FFF3E0 45%, #FFE0B2 100%)",
        metaThemeColor: "#FFB74D"
      }
    },
    // 森林绿意：绿色自然 + 弧线
    forest_green: {
      id: "forest_green",
      displayName: "森林绿意",
      phrases: [
        "一起散步 🌿",
        "风吹过树叶",
        "自然与你",
        "绿意盎然 🍃",
        "深呼吸",
        "小森林",
        "春日迟迟"
      ],
      particles: ["🌿", "🍃", "🌱", "✨", "🦋"],
      baseDistance: 90,
      baseDuration: 720,
      pathStyle: "mixed",
      gradients: {
        light: "linear-gradient(180deg, #E8F5E9, #A5D6A7)",
        dark: "linear-gradient(180deg, #1B5E20, #2E7D32)",
        textShadowLight: "0 0 6px rgba(0,0,0,0.4)",
        textShadowDark: "0 0 6px rgba(255,255,255,0.5)"
      },
      particleCount: 6,
      skin: {
        primary: "#66BB6A",
        secondary: "#81C784",
        bodyBg:
          "linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 50%, #A5D6A7 100%)",
        metaThemeColor: "#66BB6A"
      }
    },
    // 薄荷清茶：青绿清爽
    mint_tea: {
      id: "mint_tea",
      displayName: "薄荷清茶",
      phrases: [
        "清凉一夏 🍃",
        "薄荷味的风",
        "简单快乐",
        "静下心来",
        "一杯清茶 ☕",
        "慢一点也好",
        "今日宜放松"
      ],
      particles: ["🍃", "💧", "✨", "🌿", "🫧"],
      baseDistance: 80,
      baseDuration: 680,
      pathStyle: "wave",
      gradients: {
        light: "linear-gradient(180deg, #B2DFDB, #80CBC4)",
        dark: "linear-gradient(180deg, #00695C, #004D40)",
        textShadowLight: "0 0 5px rgba(0,0,0,0.35)",
        textShadowDark: "0 0 7px rgba(255,255,255,0.5)"
      },
      particleCount: 5,
      skin: {
        primary: "#4DB6AC",
        secondary: "#80CBC4",
        bodyBg:
          "linear-gradient(135deg, #E0F2F1 0%, #B2DFDB 45%, #80CBC4 100%)",
        metaThemeColor: "#4DB6AC"
      }
    },
    // 樱吹雪：淡粉白
    cherry_blossom: {
      id: "cherry_blossom",
      displayName: "樱吹雪",
      phrases: [
        "樱花落下的速度 🌸",
        "秒速五厘米",
        "春风拂面",
        "落樱缤纷",
        "温柔以待",
        "一期一会",
        "花见"
      ],
      particles: ["🌸", "✨", "🍃", "💮", "🦋"],
      baseDistance: 95,
      baseDuration: 800,
      pathStyle: "mixed",
      gradients: {
        light: "linear-gradient(180deg, #FCE4EC, #F8BBD9)",
        dark: "linear-gradient(180deg, #AD1457, #880E4F)",
        textShadowLight: "0 0 6px rgba(0,0,0,0.3)",
        textShadowDark: "0 0 6px rgba(255,255,255,0.5)"
      },
      particleCount: 6,
      skin: {
        primary: "#F48FB1",
        secondary: "#F8BBD9",
        bodyBg:
          "linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 40%, #FBCFE8 100%)",
        metaThemeColor: "#F48FB1"
      }
    },
    // 薰衣草：淡紫
    lavender: {
      id: "lavender",
      displayName: "薰衣草",
      phrases: [
        "普罗旺斯的夏天 💜",
        "薰衣草田",
        "香气与梦",
        "紫雾朦胧",
        "晚安好梦",
        "柔软时光",
        "悠悠夏日"
      ],
      particles: ["💜", "✨", "🪻", "💫", "🌙"],
      baseDistance: 88,
      baseDuration: 750,
      pathStyle: "orbit",
      gradients: {
        light: "linear-gradient(180deg, #E1BEE7, #CE93D8)",
        dark: "linear-gradient(180deg, #4A148C, #6A1B9A)",
        textShadowLight: "0 0 6px rgba(0,0,0,0.35)",
        textShadowDark: "0 0 7px rgba(255,255,255,0.55)"
      },
      particleCount: 6,
      skin: {
        primary: "#BA68C8",
        secondary: "#CE93D8",
        bodyBg:
          "linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 50%, #CE93D8 100%)",
        metaThemeColor: "#BA68C8"
      }
    },
    // 暖咖：棕褐温暖
    warm_latte: {
      id: "warm_latte",
      displayName: "暖咖",
      phrases: [
        "一杯拿铁 ☕",
        "冬日暖手",
        "慵懒午后",
        "甜度刚好",
        "慢慢来",
        "小确幸",
        "暖暖的"
      ],
      particles: ["☕", "✨", "🍂", "🌰", "🧋"],
      baseDistance: 82,
      baseDuration: 700,
      pathStyle: "mixed",
      gradients: {
        light: "linear-gradient(180deg, #EFEBE9, #D7CCC8)",
        dark: "linear-gradient(180deg, #4E342E, #3E2723)",
        textShadowLight: "0 0 5px rgba(255,255,255,0.5)",
        textShadowDark: "0 0 6px rgba(255,255,255,0.45)"
      },
      particleCount: 5,
      skin: {
        primary: "#8D6E63",
        secondary: "#A1887F",
        bodyBg:
          "linear-gradient(135deg, #EFEBE9 0%, #D7CCC8 40%, #BCAAA4 100%)",
        metaThemeColor: "#8D6E63"
      }
    },
    // 新春主题：喜庆亮红 + 金
    spring_festival: {
      id: "spring_festival",
      displayName: "新春快乐",
      phrases: [
        "新春快乐 🧧",
        "年年有余 🐟",
        "万事如意",
        "福到啦 ✨",
        "欢欢怡怡 岁岁年年",
        "马年大吉 🐉",
        "阖家幸福",
        "红包拿来 🧧",
        "岁岁常欢愉"
      ],
      particles: ["🧧", "✨", "🐉", "🏮", "福", "春", "🎊", "💮", "🌸"],
      baseDistance: 92,
      baseDuration: 780,
      pathStyle: "mixed",
      gradients: {
        light: "linear-gradient(180deg, #FFE4E4 0%, #FFCCCC 50%, #FFB6B6 100%)",
        dark: "linear-gradient(180deg, #E31837 0%, #B22222 100%)",
        textShadowLight: "0 0 8px rgba(255,215,0,0.6)",
        textShadowDark: "0 0 10px rgba(255,215,0,0.7)"
      },
      particleCount: 8,
      skin: {
        primary: "#E31837",
        secondary: "#FFD700",
        bodyBg:
          "linear-gradient(160deg, #FF6B6B 0%, #FF4757 25%, #E31837 50%, #DC143C 75%, #FFD700 95%, #FFF8DC 100%)",
        metaThemeColor: "#E31837"
      }
    },
    // 科幻霓虹：蓝紫赛博风
    sci_fi_neon: {
      id: "sci_fi_neon",
      displayName: "科幻霓虹",
      phrases: [
        "跃迁倒计时 ⏱️",
        "和你一起去星际 ✨",
        "捕捉一颗流星 ☄️",
        "数据联机中…",
        "你是我心里的主机 💾",
        "信号满格 ONLINE",
        "把宇宙装进口袋 🪐",
        "今晚是霓虹色的梦"
      ],
      particles: ["⭐", "✨", "🪐", "💾", "⚡", "💎", "🌌", "🔮"],
      baseDistance: 95,
      baseDuration: 820,
      pathStyle: "mixed",
      gradients: {
        light: "linear-gradient(180deg, #A5F3FC 0%, #C4B5FD 45%, #F9A8D4 100%)",
        dark: "linear-gradient(180deg, #020617 0%, #0F172A 45%, #1D2144 100%)",
        textShadowLight: "0 0 10px rgba(56,189,248,0.8)",
        textShadowDark: "0 0 12px rgba(244,114,182,0.85)"
      },
      particleCount: 7,
      skin: {
        primary: "#22D3EE",
        secondary: "#A855F7",
        bodyBg:
          "radial-gradient(circle at 10% 0%, #0F172A 0%, #020617 35%) , radial-gradient(circle at 80% 0%, #22D3EE 0%, rgba(34,211,238,0) 55%), radial-gradient(circle at 15% 80%, #A855F7 0%, rgba(168,85,247,0) 55%), radial-gradient(circle at 90% 85%, #F472B6 0%, rgba(244,114,182,0) 55%)",
        metaThemeColor: "#020617"
      }
    }
  };

  window.CLICK_PHRASE_THEMES = THEMES;
})();
