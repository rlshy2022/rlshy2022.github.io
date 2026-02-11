(function() {
  var colors = ["#FF9EAC", "#FFD1D8", "#89C3EB"]; // 主题色
  var characters = ["❤", "✨", "🌸"]; // 掉落的形状
  
  var elementGroup = [];
  
  class Element {
    constructor() {
      this.num = Math.floor(Math.random() * characters.length);
      this.initialStyles = {
        position: "fixed",
        top: "0",
        left: "0",
        pointerEvents: "none",
        zIndex: "99999",
        fontSize: "14px",
        color: colors[Math.floor(Math.random() * colors.length)],
        willChange: "transform"
      };
      this.init();
    }
    init() {
      this.element = document.createElement("span");
      this.element.innerHTML = characters[this.num];
      this.applyStyles(this.initialStyles);
      document.body.appendChild(this.element);
    }
    applyStyles(styles) {
      for (let style in styles) {
        this.element.style[style] = styles[style];
      }
    }
    update(x, y) {
      this.element.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${Math.random()})`;
      
      // 动画消失
      let opacity = 1;
      let top = y;
      const animate = () => {
        if (opacity <= 0) {
          this.element.remove();
        } else {
          opacity -= 0.03;
          top -= 1; // 往上飘
          this.element.style.opacity = opacity;
          this.element.style.transform = `translate3d(${x}px, ${top}px, 0)`;
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }
  }

  // 节流，不要生成太多
  let throttle = false;

  // 粗略判断是否为触屏 / 移动端设备，移动端不启用鼠标轨迹，减轻负担
  var isCoarsePointer = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || window.innerWidth < 768;
  if (!isCoarsePointer) {
    document.addEventListener("mousemove", function(e) {
      if (!throttle) {
        const elem = new Element();
        elem.update(e.clientX, e.clientY);
        throttle = true;
        setTimeout(() => (throttle = false), 50); // 50ms生成一个
      }
    });
  }
})();