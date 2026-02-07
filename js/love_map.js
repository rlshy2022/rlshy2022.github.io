(function() {
  var mapChart = null;

  // 1. 初始化地图的函数
  function initLoveMap() {
    var dom = document.getElementById('love-map-container');
    
    // 如果当前页面没有地图容器，直接退出（防止报错）
    if (!dom) return;

    // 销毁旧实例，防止内存泄漏
    if (mapChart) mapChart.dispose();

    mapChart = echarts.init(dom);

    // ================= 配置区域开始 =================
    // 填入你们去过的城市
// 修正后的数据
  var loveData = [
    { name: '苏州', value: [120.58, 31.30], date: '2026.01' },
    { name: '景德镇', value: [117.18, 29.30], date: '2025.12' },
    { name: '扬州', value: [119.41, 32.39], date: '怡怡大学' },
    
    // 新增城市 (记得修改日期)
    { name: '安庆', value: [117.05, 30.53], date: '欢欢出生地' },
    { name: '广元', value: [105.84, 32.43], date: '怡怡出生地' },
    { name: '福州', value: [119.30, 26.08], date: '欢欢大学' }
  ];
    var loveLines = [
    { coords: [[120.58, 31.30], [117.18, 29.30]] }, // 苏州 -> 景德镇
    { coords: [[120.58, 31.30], [119.41, 32.39]] }  // 苏州 -> 扬州
];
    // 填入去过的省份
    var visitedProvinces = [
      { name: '江苏', value: 1 },
      { name: '浙江', value: 1 },
      { name: '上海', value: 1 }
    ];
    // ================= 配置区域结束 =================

    // 显示加载动画
    mapChart.showLoading({
      text: '正在绘制我们的足迹...',
      color: '#FF9EAC',
      textColor: '#FF9EAC',
      maskColor: 'rgba(255, 255, 255, 0.8)',
    });

    // 获取中国地图数据
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
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderColor: '#FF9EAC',
            textStyle: { color: '#FF7E93' }
          },
          geo: {
            map: 'china',
            roam: true,
            zoom: 1.2,
            label: { show: false },
            itemStyle: {
              normal: {
                areaColor: '#fbfbfb',
                borderColor: '#4bd1e2',
                borderWidth: 2,
                shadowColor: 'rgba(255, 158, 172, 0.2)',
                shadowBlur: 5
              },
              emphasis: {
                areaColor: '#FFD1D8',
                borderWidth: 0
              }
            }
          },
          series: [
            {
              name: '足迹省份',
              type: 'map',
              geoIndex: 0,
              data: visitedProvinces,
              itemStyle: {
                normal: { areaColor: '#d1304a' }
              }
            },
            {
              name: 'Love Point',
              type: 'effectScatter',
              coordinateSystem: 'geo',
              data: loveData,
              symbol: 'path://M512 925.714c-16.517 0-32.613-6.096-45.257-17.152l-10.428-9.136C186.486 663.268 28.571 506.012 28.571 346.076c0-149.61 118.892-271.325 264.914-271.325 81.371 0 157.086 38.303 207.257 104.996 50.171-66.693 125.886-104.996 207.257-104.996 146.022 0 264.914 121.715 264.914 271.325 0 159.936-157.915 317.192-427.744 553.35l-10.428 9.136c-12.645 11.056-28.74 17.152-45.257 17.152z',
              symbolSize: 15,
              rippleEffect: { brushType: 'stroke', color: '#FF4757', scale: 4 },
              itemStyle: { color: '#FF4757', shadowBlur: 10, shadowColor: '#333' },
              label: { show: true, position: 'right', formatter: '{b}', color: '#555', fontWeight: 'bold' },
              zlevel: 1
            },
            {
              type: 'lines',
              zlevel: 2,
              effect: {
                  show: true,
                  period: 6,
                  trailLength: 0.7,
                  color: '#09599f', // 飞机的拖尾颜色
                  symbolSize: 3
              },
              lineStyle: {
                  normal: {
                      color: '#df1010', // 航线颜色
                      width: 0,
                      curveness: 0.2 // 曲线程度
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

    // 窗口大小改变时自动调整
    window.addEventListener('resize', () => {
      if(mapChart) mapChart.resize();
    });
  }

  // 2. 绑定事件：确保 PJAX 跳转和首次加载都能运行
  document.addEventListener('DOMContentLoaded', initLoveMap);
  document.addEventListener('pjax:complete', initLoveMap);

})();