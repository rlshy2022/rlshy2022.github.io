(function() {
  var mapChart = null;

  // 1. 初始化地图的函数
  function initLoveMap() {
    var dom = document.getElementById('love-map-container');
    
    if (!dom) return;
    if (mapChart) mapChart.dispose();

    mapChart = echarts.init(dom);

    // ================= 配置区域开始 =================
    
    // 1. 足迹点数据 (Love Points)
    var loveData = [
      { name: '苏州', value: [120.58, 31.30], date: '2026.01' },
      { name: '景德镇', value: [117.18, 29.30], date: '2025.12' },
      { name: '扬州', value: [119.41, 32.39], date: '怡怡大学' },
      { name: '安庆', value: [117.05, 30.53], date: '欢欢出生地' },
      { name: '广元', value: [105.84, 32.43], date: '怡怡出生地' },
      { name: '福州', value: [119.30, 26.08], date: '欢欢大学' }
    ];

    // 2. 航线数据 (Flight Lines) - 格式：[起点, 终点]
    var loveLines = [
      { coords: [[120.58, 31.30], [117.18, 29.30]] }, // 苏州 -> 景德镇
      { coords: [[120.58, 31.30], [119.41, 32.39]] }, // 苏州 -> 扬州
      // 可以在这里继续添加航线，例如：
      // { coords: [[117.05, 30.53], [120.58, 31.30]] }, // 安庆 -> 苏州
    ];

    // 3. 去过的省份 (Visited Provinces)
    // 这里的 value 没实际用处，主要是为了标记名字让地图高亮
    var visitedProvinces = [
      { name: '江苏', value: 1 },
      { name: '浙江', value: 1 },
      { name: '上海', value: 1 },
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
          // 提示框配置
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
          
          // 地理坐标系组件 (地图的基础层)
          geo: {
            map: 'china',
            roam: true, // 允许缩放和平移
            zoom: 1.2,
            label: { show: false }, // 不显示省份文字，保持画面干净
            itemStyle: {
              normal: {
                areaColor: '#FFF5F7',      // [优化] 地图底色：极淡的晨雾粉，比白色更有质感
                borderColor: '#FF9EAC',    // [优化] 边框颜色：柔和的粉色
                borderWidth: 1.5,          // 边框略微加粗
                shadowColor: 'rgba(255, 158, 172, 0.2)',
                shadowBlur: 10,
                shadowOffsetY: 5
              },
              emphasis: {
                areaColor: '#FFD1D8',      // 鼠标悬停时的颜色
                borderColor: '#FF7E93',
                borderWidth: 2
              }
            }
          },
          
          series: [
            // 系列1: 去过的省份高亮显示
            {
              name: '足迹省份',
              type: 'map',
              geoIndex: 0, // 绑定到上面的 geo 配置
              data: visitedProvinces,
              // 这一段是为了让去过的省份显示不同的颜色
              itemStyle: {
                normal: { 
                  areaColor: '#FFD1D8',   // [优化] 去过的省份：蜜桃粉，一眼识别
                  borderColor: '#FF9EAC'
                }
              }
            },
            
            // 系列2: 爱心坐标点 (保持原设计)
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
                backgroundColor: 'rgba(255,255,255,0.7)', // 文字加个淡淡的背景，防止看不清
                padding: [2, 4],
                borderRadius: 4
              },
              zlevel: 2
            },
            
            // 系列3: 飞行的航线 (对比色优化)
            {
              type: 'lines',
              zlevel: 3,
              effect: {
                show: true,
                period: 5,        // [优化] 飞行速度，越小越快
                trailLength: 0.5, // [优化] 拖尾长度，0-1
                color: '#4AB7BD', // [重点优化] 航线拖尾颜色：蒂芙尼蓝 (Teal)，与粉色形成绝美对比
                symbol: 'arrow',  // 箭头图标
                symbolSize: 5
              },
              lineStyle: {
                normal: {
                  color: 'rgba(74, 183, 189, 0.2)', // [优化] 航线轨迹底色：淡淡的青色
                  width: 1,
                  opacity: 0.5,
                  curveness: 0.3 // 曲线弯曲度
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
        dom.innerHTML = '<div style="text-align:center; padding-top:100px;">地图数据加载失败，请刷新重试 😭</div>';
      });

    window.addEventListener('resize', () => {
      if(mapChart) mapChart.resize();
    });
  }

  document.addEventListener('DOMContentLoaded', initLoveMap);
  document.addEventListener('pjax:complete', initLoveMap);

})();