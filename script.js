const INITIAL_REGIONS = [
    { name: "消逝的旅途 (Vanishing Journey)", level: 1, exp: 0, daily: 0, weekly: 0 },
    { name: "啾啾愛爾蘭 (Chu Chu Island)", level: 1, exp: 0, daily: 0, weekly: 0 },
    { name: "拉契爾恩 (Lachelein)", level: 1, exp: 0, daily: 0, weekly: 0 }
];

const MAX_LEVEL = 20;

// Requirement Formula: (Level^2) + 11
function getExpReq(level) {
    if (level >= MAX_LEVEL) return 0;
    return (level * level) + 11;
}

// ARC Stats: Base 20 at Lv0, +10 per level. 
// Note: Usually symbols start at Lv1 (30 ARC). 
// Formula: if level <= 0 return 20; return 20 + level * 10;
function getArcStat(level) {
    if (level <= 0) return 20;
    return 20 + (level * 10);
}

document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.querySelector('#arcTable tbody');
    const addRowBtn = document.getElementById('addRowBtn');
    const weeklyResetDaySelect = document.getElementById('weeklyResetDay');

    if (weeklyResetDaySelect) {
        weeklyResetDaySelect.addEventListener('change', calculateAll);
    }

    // Initialize Chart
    const ctx = document.getElementById('arcTrendChart').getContext('2d');

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(167, 139, 250, 0.4)'); // Primary purple
    gradient.addColorStop(1, 'rgba(167, 139, 250, 0.05)');

    let trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '總 ARC (Total ARC)',
                data: [],
                borderColor: '#a78bfa', // Primary Purple
                backgroundColor: gradient,
                tension: 0.4, // Smoother curve
                fill: true,
                pointBackgroundColor: '#1e293b',
                pointBorderColor: '#a78bfa',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.08)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#94a3b8',
                        font: { family: "'Noto Sans TC', sans-serif" }
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.08)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#94a3b8',
                        font: { family: "'Noto Sans TC', sans-serif" }
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#e2e8f0',
                        font: { family: "'Noto Sans TC', sans-serif" }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(30, 41, 59, 0.9)',
                    titleColor: '#e2e8f0',
                    bodyColor: '#cbd5e1',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });

    // Helper to format date
    function formatDate(date) {
        return date.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' });
    }

    function createRow(data = {}) {
        const tr = document.createElement('tr');

        const safeVal = (val, def) => val !== undefined ? val : def;

        tr.innerHTML = `
            <td><input type="text" class="input-name" value="${safeVal(data.name, '新地區')}"></td>
            <td><input type="number" class="input-level" min="1" max="20" value="${safeVal(data.level, 1)}"></td>
            <td><input type="number" class="input-exp" min="0" value="${safeVal(data.exp, 0)}"></td>
            <td><input type="number" class="input-daily" min="0" value="${safeVal(data.daily, 8)}"></td>
            <td><input type="number" class="input-weekly" min="0" value="${safeVal(data.weekly, 0)}"></td>
            <td class="result-cell next-lv-cell">-</td>
            <td class="result-cell max-lv-cell">-</td>
        `;

        // Add event listeners to inputs
        tr.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calculateAll);
        });

        tableBody.appendChild(tr);
        return tr;
    }

    function calculateAll() {
        const rows = document.querySelectorAll('#arcTable tbody tr');
        let symbolsData = [];

        rows.forEach(tr => {
            // Get inputs
            const name = tr.querySelector('.input-name').value;
            let level = parseInt(tr.querySelector('.input-level').value) || 1;
            let currentExp = parseInt(tr.querySelector('.input-exp').value) || 0;
            const daily = parseFloat(tr.querySelector('.input-daily').value) || 0;
            const weekly = parseFloat(tr.querySelector('.input-weekly').value) || 0;

            if (level > MAX_LEVEL) level = MAX_LEVEL;
            if (level < 1) level = 1;

            // --- Calculation for Table ---
            const resetDaySelect = document.getElementById('weeklyResetDay');
            const resetDay = resetDaySelect ? parseInt(resetDaySelect.value) : 4;
            const nextLvCell = tr.querySelector('.next-lv-cell');
            const maxLvCell = tr.querySelector('.max-lv-cell');

            // 1. Next Level
            const reqNext = getExpReq(level);

            if (level >= MAX_LEVEL) {
                nextLvCell.innerText = "已滿等";
                maxLvCell.innerText = "已滿等";
            } else {
                const neededNext = Math.max(0, reqNext - currentExp);

                if (daily === 0 && weekly === 0) {
                    nextLvCell.innerText = "無法升級";
                    maxLvCell.innerText = "無法升級";
                } else {
                    let dDateSim = new Date();
                    let simExpNext = 0;
                    let simDaysNext = 0;
                    
                    while (simExpNext < neededNext && simDaysNext < 10000) {
                        simDaysNext++;
                        dDateSim.setDate(dDateSim.getDate() + 1);
                        simExpNext += daily;
                        if (dDateSim.getDay() === resetDay) { simExpNext += weekly; }
                    }
                    nextLvCell.innerHTML = `${simDaysNext} 天<span class="result-date">${formatDate(dDateSim)}</span>`;

                    // 2. Max Level (20)
                    let totalNeeded = neededNext;
                    for (let l = level + 1; l < MAX_LEVEL; l++) {
                        totalNeeded += getExpReq(l);
                    }
                    
                    let simExpMax = 0;
                    let simDaysMax = 0;
                    let dDateMax = new Date();
                    
                    while (simExpMax < totalNeeded && simDaysMax < 10000) {
                        simDaysMax++;
                        dDateMax.setDate(dDateMax.getDate() + 1);
                        simExpMax += daily;
                        if (dDateMax.getDay() === resetDay) { simExpMax += weekly; }
                    }
                    maxLvCell.innerHTML = `${simDaysMax} 天<span class="result-date">${formatDate(dDateMax)}</span>`;
                }
            }

            symbolsData.push({
                level: level,
                exp: currentExp,
                daily: daily,
                weekly: weekly
            });
        });

        updateChart(symbolsData);
    }

    function updateChart(symbols) {
        const resetDaySelect = document.getElementById('weeklyResetDay');
        const resetDay = resetDaySelect ? parseInt(resetDaySelect.value) : 4;
        
        // Simulate next 30 days
        const days = 30;
        const labels = [];
        const dataPoints = [];
        const now = new Date();

        const simExpGains = symbols.map(() => 0);

        for (let d = 0; d <= days; d++) {
            const chartDate = new Date(now);
            chartDate.setDate(now.getDate() + d);
            labels.push(formatDate(chartDate));

            let totalArc = 0;

            if (d > 0) {
                const isResetDay = (chartDate.getDay() === resetDay);
                for(let i=0; i<symbols.length; i++) {
                    simExpGains[i] += symbols[i].daily;
                    if (isResetDay) {
                        simExpGains[i] += symbols[i].weekly;
                    }
                }
            }

            // Calculate state for each symbol at day d
            symbols.forEach((sym, index) => {
                // Clone state to simulate
                let simLevel = sym.level;

                if (simLevel >= MAX_LEVEL) {
                    totalArc += getArcStat(simLevel);
                    return;
                }

                let simExp = sym.exp + simExpGains[index];

                // Simulate Level Ups
                while (simLevel < MAX_LEVEL) {
                    const req = getExpReq(simLevel);
                    if (simExp >= req) {
                        simExp -= req;
                        simLevel++;
                    } else {
                        break;
                    }
                }

                totalArc += getArcStat(simLevel);
            });

            dataPoints.push(totalArc);
        }

        trendChart.data.labels = labels;
        trendChart.data.datasets[0].data = dataPoints;
        trendChart.update();
    }

    // Init
    INITIAL_REGIONS.forEach(data => createRow(data));
    calculateAll();

    addRowBtn.addEventListener('click', () => {
        createRow();
        calculateAll();
    });
});
