(function() {
  // 1. 定义你想随机显示的浪漫短语
  const phrases = ["爱你 ❤️", "想你 ✨", "么么哒 🌸", "执子之手 🤝", "欢欢 ❤️ 怡怡", "始终如一", "咱俩天下第一好", "小窝最暖"];
  
  document.addEventListener('click', function(e) {
    // 2. 随机抽取一个短语
    const text = phrases[Math.floor(Math.random() * phrases.length)];
    
    // 3. 创建文字节点
    const span = document.createElement('span');
    span.innerText = text;
    
    // 4. 设置文字初始位置（就在鼠标点击处）
    const x = e.clientX;
    const y = e.clientY;
    
    span.style.cssText = `
      z-index: 999999;
      position: fixed;
      top: ${y}px;
      left: ${x}px;
      font-weight: bold;
      color: #FF7E93;
      font-family: 'ZCOOL KuaiLe', sans-serif;
      pointer-events: none;
      white-space: nowrap;
      transform: translate(-50%, -50%);
    `;
    
    document.body.appendChild(span);
    
    // 5. 使用原生动画让文字向上飘散并消失
    let opacity = 1;
    let top = y;
    
    const animate = () => {
      if (opacity <= 0) {
        span.remove();
      } else {
        opacity -= 0.02; // 逐渐透明
        top -= 1.2;      // 向上漂移
        span.style.opacity = opacity;
        span.style.top = `${top}px`;
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  });
})();                                                                                                                                                                                                                                                                                                                                        