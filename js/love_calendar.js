/**
 * 欢欢 & 怡怡 专属纪念日历脚本 v2.0
 */
function initLoveCalendar() {
    const calendarContainer = document.getElementById('love-calendar-container');
    const anniversaryList = document.getElementById('anniversary-list');

    // 严谨判断：只在当前页面执行
    if (!calendarContainer || !anniversaryList) return;

    // --- 1. 配置你们的纪念日 ---
    const CONFIG = [
        { name: "认识纪念日 ❤️", month: 8, day: 18 },
        { name: "欢欢生日 🎂", month: 8, day: 18 },
        { name: "怡怡生日 🎁", month: 1, day: 15 },
        { name: "在一起纪念日 👩‍❤️‍👨", month: 8, day: 18 },
        { name: "情人节 🌹", month: 2, day: 14 },
        { name: "周年纪念 💍", month: 8, day: 18 }
    ];

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-11
    const today = now.getDate();

    // --- 2. 渲染日历逻辑 ---
    let firstDay = new Date(year, month, 1).getDay();
    let daysInMonth = new Date(year, month + 1, 0).getDate();

    let calHtml = `<div class="cal-title" style="font-size: 1.8rem; color: #FF9EAC; font-weight: bold; text-align: center; margin-bottom: 30px; font-family: 'ZCOOL KuaiLe';">${year} 年 ${month + 1} 月</div>`;
    calHtml += `<table style="width: 100%; border-collapse: collapse; text-align: center; font-size: 1.1rem;">
                  <thead><tr style="color: #FF9EAC;">
                    <th>日</th><th>一</th><th>二</th><th>三</th><th>四</th><th>五</th><th>六</th>
                  </tr></thead>
                  <tbody><tr>`;

    // 填充第一行空格
    for (let i = 0; i < firstDay; i++) calHtml += `<td></td>`;

    for (let day = 1; day <= daysInMonth; day++) {
        if ((firstDay + day - 1) % 7 === 0 && day !== 1) calHtml += `</tr><tr>`;

        const isEvent = CONFIG.some(e => e.month === (month + 1) && e.day === day);
        const isToday = (day === today);

        let style = "display: inline-block; width: 40px; height: 40px; line-height: 40px; border-radius: 50%; margin: 5px 0;";
        if (isEvent) {
            style += "background: #FF9EAC; color: white; font-weight: bold; box-shadow: 0 4px 10px rgba(255, 158, 172, 0.4);";
        } else if (isToday) {
            style += "border: 2px solid #89C3EB; color: #89C3EB; font-weight: bold;";
        } else {
            style += "color: #666;";
        }

        calHtml += `<td><span style="${style}">${day}</span></td>`;
    }
    calHtml += `</tr></tbody></table>`;
    calendarContainer.innerHTML = calHtml;

    // --- 3. 渲染倒计时列表 ---
    let listHtml = '';
    const sorted = CONFIG.map(e => {
        let target = new Date(year, e.month - 1, e.day);
        if (target < new Date().setHours(0,0,0,0)) target.setFullYear(year + 1);
        e.diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
        return e;
    }).sort((a, b) => a.diff - b.diff);

    sorted.forEach(item => {
        listHtml += `
            <div style="padding: 15px 0; border-bottom: 1px dashed rgba(255,158,172,0.2); display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #555; font-weight: 500;">${item.name}</span>
                <span style="color: #FF7E93; font-weight: bold;">还有 ${item.diff} 天</span>
            </div>`;
    });
    anniversaryList.innerHTML = listHtml;
}

// 适配 Butterfly 的 Pjax 和普通加载
document.addEventListener('DOMContentLoaded', initLoveCalendar);
document.addEventListener('pjax:complete', initLoveCalendar);
// 如果没有 Pjax 也能自运行
initLoveCalendar();