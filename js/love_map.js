(function() {
  var mapChart = null;
  var resizeBound = false;

  function loadScript(src) {
    return new Promise(function(resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = function() { resolve(); };
      s.onerror = function(e) { reject(e); };
      document.body.appendChild(s);
    });
  }

  function ensureEcharts() {
    if (window.echarts) return Promise.resolve();
    return loadScript('https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js');
  }

  function updateActiveCity(cityName) {
    document.querySelectorAll('[data-map-city]').forEach(function(button) {
      button.classList.toggle('is-active', button.getAttribute('data-map-city') === cityName);
    });
  }

  function ensureStoriesContainer() {
    var container = document.getElementById('love-map-stories');
    if (container) return container;

    var mapDom = document.getElementById('love-map-container');
    if (!mapDom || !mapDom.parentNode) return null;
    container = document.createElement('div');
    container.id = 'love-map-stories';
    mapDom.parentNode.insertBefore(container, mapDom.nextSibling);
    return container;
  }

  function renderCityRail(loveData, storiesMap) {
    var mapDom = document.getElementById('love-map-container');
    if (!mapDom || !mapDom.parentNode) return;

    var rail = document.getElementById('love-map-city-rail');
    if (!rail) {
      rail = document.createElement('div');
      rail.id = 'love-map-city-rail';
      rail.className = 'love-map-city-rail';
      mapDom.parentNode.insertBefore(rail, mapDom);
    }

    rail.innerHTML =
      '<div class="love-map-city-title">城市入口</div>' +
      '<div class="love-map-city-list">' +
      loveData
        .map(function(item) {
          var hasStories = storiesMap[item.name] && storiesMap[item.name].length;
          return (
            '<button type="button" class="love-map-city-btn' +
            (hasStories ? '' : ' is-empty') +
            '" data-map-city="' +
            item.name +
            '"' +
            (hasStories ? '' : ' disabled') +
            '>' +
            '<span>' +
            item.name +
            '</span>' +
            '<small>' +
            (hasStories ? storiesMap[item.name].length + ' 条' : '待补充') +
            '</small>' +
            '</button>'
          );
        })
        .join('') +
      '</div>';

    rail.querySelectorAll('[data-map-city]').forEach(function(button) {
      button.addEventListener('click', function() {
        var cityName = button.getAttribute('data-map-city');
        if (cityName) renderCityStories(cityName, storiesMap);
      });
    });
  }

  function renderCityStories(cityName, storiesMap) {
    if (!storiesMap) return;
    var list = storiesMap[cityName];
    updateActiveCity(cityName);

    var container = ensureStoriesContainer();
    if (!container) return;

    if (!list || !list.length) {
      container.classList.add('love-map-stories-placeholder');
      container.innerHTML =
        '<div class="map-stories-inner">' +
        '<p>' +
        cityName +
        ' 的故事卡片还在整理中。</p>' +
        '</div>';
      return;
    }

    container.classList.remove('love-map-stories-placeholder');

    var total = list.length;
    var html =
      '<div class="map-stories-header">' +
      '<div class="map-stories-title"><i class="fas fa-map-marker-heart"></i> ' +
      cityName +
      ' 的回忆小卡片</div>' +
      '<div class="map-stories-meta">和这座城市有关的记忆：' +
      total +
      ' 条</div>' +
      '</div>' +
      '<div class="map-stories-list">';

    list.forEach(function (item) {
      html +=
        '<div class="map-story-card">' +
        '<div class="map-story-cover-wrap">' +
        '<img src="' +
        (item.cover || '') +
        '" alt="' +
        (item.title || cityName + '的回忆') +
        '" class="map-story-cover"/>' +
        '</div>' +
        '<div class="map-story-body">' +
        '<div class="map-story-city">' +
        cityName +
        '</div>' +
        '<div class="map-story-title-text">' +
        (item.title || '') +
        '</div>' +
        '<div class="map-story-summary">' +
        (item.summary || '') +
        '</div>' +
        '<a class="map-story-link" href="' +
        (item.url || '#') +
        '" target="_blank" rel="noopener">去看看这段回忆</a>' +
        '</div>' +
        '</div>';
    });

    html += '</div>';
    container.innerHTML = html;
  }

  function initLoveMap() {
    var dom = document.getElementById('love-map-container');
    
    if (!dom) return;
    ensureEcharts().then(function() {
      if (!window.echarts) return;

      if (mapChart) mapChart.dispose();
      mapChart = echarts.init(dom);

      // ================= 🗺️ 数据配置区域 =================
      var MAP_CFG = (window.LOVE_CONFIG && window.LOVE_CONFIG.map) || {};

      // 1. 📍 坐标配置 (方便后面调用，不用每次都查经纬度)
      var geoCoordMap =
        MAP_CFG.geoCoordMap || {
          苏州: [120.58, 31.3],
          景德镇: [117.18, 29.3],
          扬州: [119.41, 32.39],
          黄山: [118.33, 29.72],
          安庆: [117.05, 30.53],
          广元: [105.84, 32.43],
          福州: [119.3, 26.08],
          宁国: [118.98, 30.63],
        };

      // 2. ❤️ 足迹点数据 (地图上跳动的爱心)
      var loveData =
        (MAP_CFG.loveData &&
          MAP_CFG.loveData.map(function (item) {
            return {
              name: item.name,
              value: geoCoordMap[item.name],
              date: item.date,
            };
          })) ||
        [
          { name: "苏州", value: geoCoordMap["苏州"], date: "怡怡出生地 & 2026.01" },
          { name: "景德镇", value: geoCoordMap["景德镇"], date: "第一次见面 & 2025.12" },
          { name: "扬州", value: geoCoordMap["扬州"], date: "怡怡大学" },
          { name: "黄山", value: geoCoordMap["黄山"], date: "清明与七月再访 & 2026.04/07" },
          { name: "安庆", value: geoCoordMap["安庆"], date: "欢欢出生地" },
          { name: "广元", value: geoCoordMap["广元"], date: "怡怡家" },
          { name: "福州", value: geoCoordMap["福州"], date: "母校重逢 & 2026.06" },
          { name: "宁国", value: geoCoordMap["宁国"], date: "七月出走 & 2026.07" },
        ];

      // 3. ✈️ 航线数据
      var loveLines =
        (MAP_CFG.loveLinesFromSuzhou &&
          MAP_CFG.loveLinesFromSuzhou.map(function (pair) {
            return { coords: [geoCoordMap[pair[0]], geoCoordMap[pair[1]] ] };
          })) ||
        [
          { coords: [geoCoordMap["苏州"], geoCoordMap["景德镇"]] }, // 苏州 -> 景德镇
          { coords: [geoCoordMap["苏州"], geoCoordMap["扬州"]] }, // 苏州 -> 扬州
          { coords: [geoCoordMap["扬州"], geoCoordMap["黄山"]] }, // 扬州 -> 黄山
          { coords: [geoCoordMap["黄山"], geoCoordMap["福州"]] }, // 黄山 -> 福州
          { coords: [geoCoordMap["安庆"], geoCoordMap["苏州"]] }, // 安庆 -> 苏州
          { coords: [geoCoordMap["广元"], geoCoordMap["苏州"]] }, // 广元 -> 苏州
          { coords: [geoCoordMap["福州"], geoCoordMap["苏州"]] }, // 福州 -> 苏州
          { coords: [geoCoordMap["苏州"], geoCoordMap["宁国"]] }, // 苏州 -> 宁国
          { coords: [geoCoordMap["宁国"], geoCoordMap["黄山"]] }, // 宁国 -> 黄山
          { coords: [geoCoordMap["黄山"], geoCoordMap["苏州"]] }, // 黄山 -> 苏州
        ];

      // 4. 🚩 去过的省份 (用来给省份上色)
      var visitedProvinces =
        MAP_CFG.visitedProvinces ||
        [
          { name: "江苏", value: 1 }, // 苏州/扬州
          { name: "浙江", value: 1 }, // 路过?
          { name: "上海", value: 1 }, // 路过?
          { name: "江西", value: 1 }, // 景德镇
          { name: "安徽", value: 1 }, // 安庆
          { name: "四川", value: 1 }, // 广元
          { name: "福建", value: 1 }, // 福州
        ];

      // 5. 🧡 城市关联的文章/记忆
      var cityStoriesMap = MAP_CFG.stories || {};
      var isCompactMap = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
      renderCityRail(loveData, cityStoriesMap);

      // ================= 配置区域结束 =================

      mapChart.showLoading({
        text: '正在绘制我们的足迹...',
        color: '#FF9EAC',
        textColor: '#FF9EAC',
        maskColor: 'rgba(255, 255, 255, 0.8)',
      });

    // 优先读取同源 GeoJSON（避免 CORS / 403 / 运营商劫持返回 HTML）
    // 该文件由 scripts/map/cache_china_geojson.js 在生成前写入 source/geo/，最终发布到 /geo/100000_full.json
    var geoJsonUrl = '/geo/100000_full.json';
    fetch(geoJsonUrl, { cache: 'no-cache' })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('GeoJSON 请求失败: ' + response.status + ' ' + response.statusText);
        }
        var ct = response.headers.get('content-type') || '';
        if (ct && !ct.includes('application/json') && !ct.includes('application/geo+json')) {
          // 常见：403/劫持返回 HTML，直接提示
          throw new Error('GeoJSON 响应不是 JSON（content-type=' + ct + '）');
        }
        return response.json();
      })
      .then(geoJson => {
        mapChart.hideLoading();
        var loadingWrap = dom.querySelector('.love-map-loading');
        if (loadingWrap) loadingWrap.remove();
        echarts.registerMap('china', geoJson);

        var option = {
          backgroundColor: 'transparent',

          title: {
            show: !isCompactMap,
            text: '欢欢 & 怡怡 的旅行足迹',
            subtext: '每一条连线，都是我们走过的一段路',
            left: 'center',
            top: 10,
            textStyle: {
              color: '#FF7E93',
              fontSize: 18,
              fontFamily: 'ZCOOL KuaiLe'
            },
            subtextStyle: {
              color: '#999',
              fontSize: 12
            }
          },

          tooltip: {
            trigger: 'item',
            formatter: function(params) {
              if(params.seriesType === 'effectScatter') {
                return params.data.name + '<br/>' + params.data.date + ' 留下足迹 ❤️';
              }
              return params.name;
            },
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderColor: '#FF9EAC',
            borderWidth: 1,
            padding: [10, 15],
            textStyle: { color: '#FF7E93', fontFamily: 'ZCOOL KuaiLe' }
          },
          
          geo: {
            map: 'china',
            roam: true,
            zoom: isCompactMap ? 1.05 : 1.2,
            label: {
              show: false
            },
            itemStyle: {
              normal: {
                areaColor: '#FFF5F7',      // 晨雾粉底色
                borderColor: '#FF9EAC',    // 柔粉色边框
                borderWidth: 1.5,
                shadowColor: 'rgba(255, 158, 172, 0.2)',
                shadowBlur: 10,
                shadowOffsetY: 5
              },
              emphasis: {
                areaColor: '#FFD1D8',
                borderColor: '#FF7E93',
                borderWidth: 2
              }
            }
          },
          
          series: [
            // 1. 省份染色
            {
              name: '足迹省份',
              type: 'map',
              geoIndex: 0,
              data: visitedProvinces,
              itemStyle: {
                normal: { 
                  areaColor: '#FFD1D8',   // 去过的省份显示蜜桃粉
                  borderColor: '#FF9EAC'
                }
              }
            },
            
            // 2. 坐标点 (爱心)
            {
              name: 'Love Point',
              type: 'effectScatter',
              coordinateSystem: 'geo',
              data: loveData,
              symbol: 'path://M512 925.714c-16.517 0-32.613-6.096-45.257-17.152l-10.428-9.136C186.486 663.268 28.571 506.012 28.571 346.076c0-149.61 118.892-271.325 264.914-271.325 81.371 0 157.086 38.303 207.257 104.996 50.171-66.693 125.886-104.996 207.257-104.996 146.022 0 264.914 121.715 264.914 271.325 0 159.936-157.915 317.192-427.744 553.35l-10.428 9.136c-12.645 11.056-28.74 17.152-45.257 17.152z',
              symbolSize: isCompactMap ? 10 : 12,
              rippleEffect: { brushType: 'stroke', color: '#FF4757', scale: isCompactMap ? 2.2 : 3 },
              itemStyle: { color: '#FF4757', shadowBlur: 10, shadowColor: '#333' },
              label: { 
                show: !isCompactMap,
                position: 'right', 
                formatter: '{b}', 
                color: '#555', 
                fontWeight: 'bold', 
                fontSize: 12,
                backgroundColor: 'rgba(255,255,255,0.7)',
                padding: [2, 4],
                borderRadius: 4
              },
              zlevel: 2
            },

            // 2.1 高亮当前「我们所在」的城市（默认苏州）
            {
              name: 'Now',
              type: 'effectScatter',
              coordinateSystem: 'geo',
              data: [{
                name: '苏州',
                value: geoCoordMap['苏州'],
                date: '现在，我们在这里相遇'
              }],
              symbol: 'circle',
              symbolSize: 18,
              rippleEffect: {
                brushType: 'stroke',
                color: 'rgba(255, 126, 163, 0.9)',
                scale: 4
              },
              itemStyle: {
                color: '#FF7E93',
                shadowBlur: 18,
                shadowColor: 'rgba(255, 126, 163, 0.8)'
              },
              zlevel: 3
            },
            
            // 3. 飞行航线 (蒂芙尼蓝)
            {
              type: 'lines',
              zlevel: 3,
              effect: {
                show: !isCompactMap,
                period: 5,
                trailLength: 0.5, 
                color: '#4AB7BD', // 蒂芙尼蓝拖尾
                symbol: 'arrow',
                symbolSize: 5
              },
              // 修改 love_map.js 中的 lineStyle
              lineStyle: {
                normal: {
                  color: 'rgba(74, 183, 189, 0.2)',
                  width: 1.2,
                  opacity: 0.5,
                  // 让每条线稍微弯曲程度不一样，避免重叠
                  curveness: 0.2 + Math.random() * 0.3 
                }
              },
              data: loveLines
            }
          ]
        };

        mapChart.setOption(option);

        // 点击地图上的城市或爱心时，展示对应的故事卡片
        mapChart.off('click');
        mapChart.on('click', function (params) {
          var name = params.name;
          if (!name || !cityStoriesMap[name]) return;
          renderCityStories(name, cityStoriesMap);
        });

        // 默认展示苏州的故事（如果有配置）
        if (cityStoriesMap['苏州']) {
          renderCityStories('苏州', cityStoriesMap);
        }
      })
      .catch(error => {
        console.error('地图加载失败:', error);
        if (mapChart) mapChart.hideLoading();
        var loadingEl = dom && dom.querySelector && dom.querySelector('.love-map-loading');
        if (loadingEl) {
          loadingEl.innerHTML =
            '<p style="color:#FF7E93;margin:0;line-height:1.6;">' +
            '<i class="fas fa-exclamation-circle"></i> 地图数据加载失败。' +
            '<br/>请确认已生成 <code>/geo/100000_full.json</code>（见 scripts/map/cache_china_geojson.js）。' +
            '</p>';
        }
      });

      if (!resizeBound) {
        window.addEventListener('resize', function() {
          if (mapChart) mapChart.resize();
        });
        resizeBound = true;
      }
    }).catch(function(err) {
      console.error('echarts 加载失败:', err);
    });
  }

  // 直接访问 /love-map/ 时，love_map.js 由 boot.js 异步加载，此时 DOMContentLoaded 已触发，
  // 所以必须：脚本加载后若容器已存在则立即执行一次
  if (document.getElementById('love-map-container')) {
    initLoveMap();
  }
  document.addEventListener('DOMContentLoaded', initLoveMap);
  document.addEventListener('pjax:complete', initLoveMap);

})();
