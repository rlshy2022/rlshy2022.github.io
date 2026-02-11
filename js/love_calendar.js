/**
 * 欢欢 & 怡怡 专属纪念日历脚本 v2.0
 */
function initLoveCalendar() {
    const calendarContainer = document.getElementById('love-calendar-container');
    const anniversaryList = document.getElementById('anniversary-list');

    // 严谨判断：只在当前页面执行
    if (!calendarContainer || !anniversaryList) return;

    // --- 1. 配置你们的纪念日（优先使用 LOVE_CONFIG） ---
    const CONFIG = (window.LOVE_CONFIG && window.LOVE_CONFIG.anniversaries) || [
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

    let calHtml = `<div class="cal-title">${year} 年 ${month + 1} 月</div>`;
    calHtml += `<table class="cal-table">
                  <thead><tr>
                    <th>日</th><th>一</th><th>二</th><th>三</th><th>四</th><th>五</th><th>六</th>
                  </tr></thead>
                  <tbody><tr>`;

    // 填充第一行空格
    for (let i = 0; i < firstDay; i++) calHtml += `<td></td>`;

    for (let day = 1; day <= daysInMonth; day++) {
        if ((firstDay + day - 1) % 7 === 0 && day !== 1) calHtml += `</tr><tr>`;

        const eventsToday = CONFIG.filter(e => e.month === (month + 1) && e.day === day);
        const isEvent = eventsToday.length > 0;
        const isToday = (day === today);

        const title = eventsToday.length
          ? eventsToday.map(e => e.name).join(" / ")
          : "";

        let cls = "cal-day";
        if (isEvent) {
            cls += " cal-event-day";
        } else if (isToday) {
            cls += " cal-today-circle";
        }

        const dateKey = `${month + 1}-${day}`;
        calHtml += `<td><span class="${cls}" data-date="${dateKey}"${title ? ` title="${title}"` : ""}>${day}</span></td>`;
    }
    calHtml += `</tr></tbody></table>`;
    calendarContainer.innerHTML = calHtml;

    // --- 3. 渲染倒计时列表 ---
    let listHtml = '';
    const sorted = CONFIG.map(e => {
        const base = new Date(year, e.month - 1, e.day);
        const todayZero = new Date();
        todayZero.setHours(0, 0, 0, 0);
        let target = base;
        if (target < todayZero) target = new Date(year + 1, e.month - 1, e.day);
        const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
        return { ...e, diff };
    }).sort((a, b) => a.diff - b.diff);

    sorted.forEach(item => {
        const dateKey = `${item.month}-${item.day}`;
        listHtml += `
            <div class="anniversary-item" data-date="${dateKey}">
                <span class="anniversary-name">${item.name}</span>
                <span class="anniversary-count">还有 ${item.diff} 天</span>
            </div>`;
    });
    anniversaryList.innerHTML = listHtml;

    // --- 4. 交互联动：点击日历中的纪念日，高亮右侧对应条目并提示 ---
    const daySpans = calendarContainer.querySelectorAll('.cal-event-day');
    const items = anniversaryList.querySelectorAll('.anniversary-item');

    const showToast = (text) => {
        const toast = document.createElement('div');
        toast.className = 'love-toast';
        toast.innerHTML = `<i class="fas fa-heart"></i> ${text}`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2500);
    };

    daySpans.forEach(span => {
        span.addEventListener('click', () => {
            const date = span.getAttribute('data-date');
            items.forEach(it => {
                if (it.getAttribute('data-date') === date) {
                    it.classList.add('anniversary-item-active');
                    it.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                } else {
                    it.classList.remove('anniversary-item-active');
                }
            });

            const titleText = span.getAttribute('title');
            if (titleText) {
                showToast(titleText);
            } else {
                showToast('这一天，对我们来说很特别 💖');
            }
        });
    });
}

// 适配 Butterfly 的 Pjax 和普通加载
document.addEventListener('DOMContentLoaded', initLoveCalendar);
document.addEventListener('pjax:complete', initLoveCalendar);