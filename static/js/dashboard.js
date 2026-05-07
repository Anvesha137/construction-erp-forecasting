let forecastChart = null;
let allData = null;
let activeSkuIdx = 0;

const COLORS = {
    primary: '#0ea5e9',
    secondary: '#6366f1',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    border: '#23304c',
    text: '#94a3b8',
    panelBg: '#151e32'
};

async function init() {
    setupSidebar();
    
    // Only fetch data and render charts if we are on the main dashboard page
    if (document.getElementById('forecastChart')) {
        await fetchData();
    }
    hideLoading();
}

function setupSidebar() {
    const navLinks = document.querySelectorAll('.nav-links li');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const moduleName = e.target.innerText.trim();
            
            const routes = {
                'Dashboard': '/',
                'Procurement': '/procurement',
                'Inventory': '/inventory',
                'Projects (BIM)': '/projects',
                'Transport TLMS': '/transport',
                'HRMS Integration': '/hrms'
            };

            if (routes[moduleName]) {
                window.location.href = routes[moduleName];
            } else {
                // Fallback for anything else
                navLinks.forEach(l => l.classList.remove('active'));
                e.target.classList.add('active');
                
                showToast(`🔒 ${moduleName} is under development.`);
                
                setTimeout(() => {
                    e.target.classList.remove('active');
                }, 2500);
            }
        });
    });
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.innerText = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

async function fetchData() {
    try {
        const response = await fetch('/api/data');
        allData = await response.json();
        renderDashboard();
    } catch (error) {
        console.error('Failed to fetch data:', error);
    }
}

async function refreshPipeline() {
    showLoading();
    try {
        await fetch('/api/refresh');
        await fetchData();
    } finally {
        hideLoading();
    }
}

function showLoading() {
    document.getElementById('loader').style.display = 'flex';
    document.getElementById('loader').style.opacity = '1';
}

function hideLoading() {
    const loader = document.getElementById('loader');
    loader.style.opacity = '0';
    setTimeout(() => loader.style.display = 'none', 500);
}

function renderDashboard() {
    const d = allData;
    
    // KPIs
    document.getElementById('kpi-skus').innerText = d.total_skus;
    document.getElementById('kpi-records').innerText = d.total_records.toLocaleString();
    document.getElementById('kpi-mae').innerText = d.dt.mae;
    document.getElementById('kpi-r2').innerText = (d.dt.r2 * 100).toFixed(1) + '%';
    
    // Last Run
    document.getElementById('last-run').innerText = 'Sync: ' + d.run_time;

    // SKU Selection
    renderSkuSelector();
    
    // Charts
    renderForecastChart(activeSkuIdx);
    renderImportanceChart();
    
    // Table
    renderTable();
}

function renderSkuSelector() {
    const container = document.getElementById('sku-selector');
    container.innerHTML = '';
    
    allData.forecasts.forEach((f, i) => {
        const btn = document.createElement('button');
        btn.className = `sku-chip ${i === activeSkuIdx ? 'active' : ''}`;
        btn.innerHTML = f.sku_id.replace('NW-', ''); // Simplify ID for button
        btn.onclick = () => {
            activeSkuIdx = i;
            renderSkuSelector();
            renderForecastChart(i);
        };
        container.appendChild(btn);
    });
}

function renderForecastChart(idx) {
    const f = allData.forecasts[idx];
    const ctx = document.getElementById('forecastChart').getContext('2d');
    
    const histLabels = f.history.map(h => h.date);
    const histVals = f.history.map(h => h.actual);
    const forecastLabels = f.forecast.map(p => p.date);
    const forecastVals = f.forecast.map(p => p.predicted);

    const labels = [...histLabels, ...forecastLabels];
    const histData = [...histVals, ...Array(forecastLabels.length).fill(null)];
    const forecastData = [...Array(histLabels.length - 1).fill(null), histVals[histVals.length-1], ...forecastVals];

    if (forecastChart) forecastChart.destroy();
    
    forecastChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Historical PO Quantity',
                    data: histData,
                    borderColor: '#3b82f6', // Slightly muted blue
                    backgroundColor: 'rgba(59, 130, 246, 0.05)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 2,
                    borderWidth: 2
                },
                {
                    label: 'AI Forecasted Need',
                    data: forecastData,
                    borderColor: COLORS.primary, // Bright Nway blue
                    backgroundColor: 'rgba(14, 165, 233, 0.1)',
                    fill: true,
                    tension: 0.3,
                    borderDash: [5, 5],
                    pointRadius: 4,
                    pointBackgroundColor: COLORS.primary,
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: COLORS.text, font: { family: 'Inter', size: 12 } }
                },
                tooltip: {
                    backgroundColor: COLORS.panelBg,
                    titleColor: '#fff',
                    bodyColor: COLORS.text,
                    borderColor: COLORS.border,
                    borderWidth: 1,
                    padding: 12,
                    boxPadding: 6
                }
            },
            scales: {
                x: {
                    grid: { color: COLORS.border, drawBorder: false },
                    ticks: { color: COLORS.text, font: { size: 10, family: 'JetBrains Mono' } }
                },
                y: {
                    grid: { color: COLORS.border, drawBorder: false },
                    ticks: { color: COLORS.text, font: { size: 11, family: 'JetBrains Mono' } },
                    beginAtZero: true
                }
            }
        }
    });
}

function renderImportanceChart() {
    const importance = [
        { feat: 'Project Stage (BIM)', val: 91 },
        { feat: '30d Consumption Rate', val: 84 },
        { feat: 'Current Site Stock', val: 72 },
        { feat: 'Supplier Lead Time', val: 48 },
        { feat: 'Seasonality Index', val: 35 }
    ];
    
    const container = document.getElementById('importance-bars');
    container.innerHTML = importance.map(item => `
        <div style="margin-bottom: 1.25rem;">
            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 0.4rem; font-weight: 500;">
                <span style="color: var(--text-secondary)">${item.feat}</span>
                <span style="color: var(--primary); font-family: var(--font-mono);">${item.val}%</span>
            </div>
            <div style="height: 6px; background: var(--bg-main); border-radius: 3px; overflow: hidden; border: 1px solid var(--border);">
                <div style="height: 100%; width: ${item.val}%; background: linear-gradient(90deg, #0ea5e9, #38bdf8); border-radius: 2px;"></div>
            </div>
        </div>
    `).join('');
}

function renderTable() {
    const tbody = document.getElementById('forecast-tbody');
    tbody.innerHTML = allData.forecasts.map(f => {
        const needsAction = f.alert || (f.next_7d_avg > f.current_stock);
        const actionBadge = needsAction 
            ? `<span class="badge badge-danger">Create PO</span>`
            : `<span class="badge badge-success">Sufficient</span>`;
            
        return `
            <tr>
                <td>
                    <div style="font-weight: 600; color: #fff;">${f.sku_name}</div>
                    <div style="font-size: 0.7rem; color: var(--text-muted); font-family: var(--font-mono); margin-top: 0.2rem;">${f.sku_id}</div>
                </td>
                <td><span style="font-size: 0.8rem; color: var(--text-secondary);">${f.category}</span></td>
                <td><span style="font-size: 0.8rem; color: var(--text-secondary);">${f.supplier}</span></td>
                <td class="text-right" style="font-family: var(--font-mono);">${f.current_stock.toLocaleString()}</td>
                <td class="text-right" style="font-family: var(--font-mono); font-weight: 600; color: ${needsAction ? 'var(--danger)' : 'var(--primary)'};">${f.next_7d_avg.toLocaleString()}</td>
                <td class="text-center">${actionBadge}</td>
            </tr>
        `;
    }).join('');
}

document.addEventListener('DOMContentLoaded', init);
