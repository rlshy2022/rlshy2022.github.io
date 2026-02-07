(function() {
  var mapChart = null;

  function initLoveMap() {
    var dom = document.getElementById('love-map-container');
    
    if (!dom) return;
    if (mapChart) mapChart.dispose();

    mapChart = echarts.init(dom);

    // ================= 🗺️ 数据配置区域 =================
    
    // 1. 📍 坐标配置 (方便后面调用，不用每次都查经纬度)
    var geoCoordMap = {
      '苏州': [120.58, 31.30],
      '景德镇': [117.18, 29.30],
      '扬州': [119.41, 32.39],
      '安庆': [117.05, 30.53],
      '广元': [105.84, 32.43],
      '福州': [119.30, 26.08]
    };

    // 2. ❤️ 足迹点数据 (地图上跳动的爱心)
    var loveData = [
      { name: '苏州', value: geoCoordMap['苏州'], date: '2026.01' },
      { name: '景德镇', value: geoCoordMap['景德镇'], date: '2025.12' },
      { name: '扬州', value: geoCoordMap['扬州'], date: '怡怡大学' },
      { name: '安庆', value: geoCoordMap['安庆'], date: '欢欢出生地' },
      { name: '广元', value: geoCoordMap['广元'], date: '怡怡出生地' },
      { name: '福州', value: geoCoordMap['福州'], date: '欢欢大学' }
    ];

    // 3. ✈️ 航线数据 (把新城市都连到苏州)
    var loveLines = [
      // 原有的
      { coords: [geoCoordMap['苏州'], geoCoordMap['景德镇']] }, // 苏州 -> 景德镇
      { coords: [geoCoordMap['苏州'], geoCoordMap['扬州']] },   // 苏州 -> 扬州
      
      // ✨ 新增的航线 (逻辑：从家乡/大学 -> 现在的苏州)
      { coords: [geoCoordMap['安庆'], geoCoordMap['苏州']] },   // 安庆 -> 苏州
      { coords: [geoCoordMap['广元'], geoCoordMap['苏州']] },   // 广元 -> 苏州
      { coords: [geoCoordMap['福州'], geoCoordMap['苏州']] }    // 福州 -> 苏州
    ];

    // 4. 🚩 去过的省份 (用来给省份上色)
    var visitedProvinces = [
      { name: '江苏', value: 1 }, // 苏州/扬州
      { name: '浙江', value: 1 }, // 路过?
      { name: '上海', value: 1 }, // 路过?
      { name: '江西', value: 1 }, // 景德镇
      { name: '安徽', value: 1 }, // 安庆
      { name: '四川', value: 1 }, // 广元
      { name: '福建', value: 1 }  // 福州
    ];

    // ================= 配置区域结束 =================

    mapChart.showLoading({
      text: '正在绘制我们的足迹...',
      color: '#FF9EAC',
      textColor: '#FF9EAC',
      maskColor: 'rgba(255, 255, 255, 0.8)',
    });

    fetch('https://rsylh.oss-cn-hangzhou.aliyuncs.com/img/%E5%85%B6%E4%BB%96/100000_full.json')
      .then(response => response.json())
      .then(geoJson => {
        mapChart.hideLoading();
        echarts.registerMap('china', geoJson);

        var option = {
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
            zoom: 1.2,
            label: { show: false },
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
              symbolSize: 12,
              rippleEffect: { brushType: 'stroke', color: '#FF4757', scale: 3 },
              itemStyle: { color: '#FF4757', shadowBlur: 10, shadowColor: '#333' },
              label: { 
                show: true, 
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
            
            // 3. 飞行航线 (蒂芙尼蓝)
            {
              type: 'lines',
              zlevel: 3,
              effect: {
                show: true,
                period: 5,
                trailLength: 0.5, 
                color: '#4AB7BD', // 蒂芙尼蓝拖尾
                symbol: 'arrow',
                symbolSize: 5
              },
              lineStyle: {
                normal: {
                  color: 'rgba(74, 183, 189, 0.2)', // 浅青色轨迹
                  width: 1,
                  opacity: 0.5,
                  curveness: 0.3
                }
              },
              data: loveLines
            }
          ]
        };

        mapChart.setOption(option);
      })
      .catch(error => {
        console.error('地图加载失败:', error);
      });

    window.addEventListener('resize', () => {
      if(mapChart) mapChart.resize();
    });
  }

  document.addEventListener('DOMContentLoaded', initLoveMap);
  document.addEventListener('pjax:complete', initLoveMap);

})();