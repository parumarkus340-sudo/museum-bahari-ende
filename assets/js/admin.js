// ============================================================
// MUSEUM BAHARI ENDE - Dashboard Admin (VERSI LENGKAP v6)
// ============================================================

// 1. KONFIGURASI GOOGLE SHEET (untuk login)
const SHEET_ID = '14Yjote6VXC0LB65Sd_ZcgXdUE0kVexQFNhO_lbGhYVs';
const SHEET_ADMIN = 'Admin';

// 2. KONFIGURASI FIREBASE (untuk data statistik)
const firebaseConfig = {
  apiKey: "AIzaSyC7hlKKSsqxO9pBMKU_vvRPo6uDbfMYX8g",
  authDomain: "website-museum.firebaseapp.com",
  projectId: "website-museum",
  storageBucket: "website-museum.firebasestorage.app",
  messagingSenderId: "1083931496533",
  appId: "1:1083931496533:web:5116fc4eb57c010f5684dc",
  measurementId: "G-C69FK266K4"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ============================================================
// FUNGSI UTILITAS
// ============================================================
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function readSheet(sheetName) {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
    try {
        const response = await fetch(url);
        const text = await response.text();
        const jsonString = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
        return JSON.parse(jsonString);
    } catch (e) {
        console.error(`Gagal membaca sheet ${sheetName}:`, e);
        return null;
    }
}

// ============================================================
// HALAMAN LOGIN
// ============================================================
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    if (localStorage.getItem('admin_logged_in') === 'true') {
        window.location.href = 'dashboard.html';
    }

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const errorMsg = document.getElementById('errorMsg');
        
        errorMsg.style.display = 'none';
        const passwordHash = await sha256(password);
        
        const data = await readSheet(SHEET_ADMIN);
        if (!data || !data.table || !data.table.rows) {
            errorMsg.innerHTML = '<i class="fa fa-exclamation-circle"></i> Gagal terhubung ke server.';
            errorMsg.style.display = 'block';
            return;
        }
        
        let valid = false;
        data.table.rows.forEach(row => {
            const cells = row.c;
            if (cells && cells[0] && cells[1]) {
                const storedUser = cells[0].v?.toString().trim().toLowerCase();
                const storedHash = cells[1].v?.toString().trim();
                if (storedUser === username.toLowerCase() && storedHash === passwordHash) {
                    valid = true;
                }
            }
        });
        
        if (valid) {
            localStorage.setItem('admin_logged_in', 'true');
            localStorage.setItem('admin_username', username);
            window.location.href = 'dashboard.html';
        } else {
            errorMsg.innerHTML = '<i class="fa fa-exclamation-circle"></i> Username atau password salah.';
            errorMsg.style.display = 'block';
        }
    });
}

// ============================================================
// HALAMAN DASHBOARD
// ============================================================
if (document.getElementById('statToday')) {
    if (localStorage.getItem('admin_logged_in') !== 'true') {
        window.location.href = 'admin.html';
    } else {
        document.getElementById('adminName').textContent = localStorage.getItem('admin_username') || 'Admin';
        loadDashboardData();
    }
}

async function loadDashboardData() {
    console.log("📊 Memuat data dari Firebase Firestore...");
    try {
        const snapshot = await db.collection("log_akses").orderBy("waktu", "desc").get();
        
        const logs = [];
        snapshot.forEach(doc => {
            logs.push({ id: doc.id, ...doc.data() });
        });

        console.log(`✅ Berhasil memuat ${logs.length} data log.`);
        processAndRenderAll(logs);
        
        document.getElementById('lastUpdate').textContent = new Date().toLocaleString('id-ID');
    } catch (error) {
        console.error("❌ Gagal memuat data:", error);
    }
}

// ============================================================
// PROSES DATA & RENDER SEMUA
// ============================================================
function processAndRenderAll(logs) {
    const now = new Date();
    const todayStr = now.toDateString();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let todayCount = 0, weekCount = 0, monthCount = 0;
    
    const categoryCounts = { 'Dewasa': 0, 'Anak-anak': 0, 'Pelajar': 0, 'Reguler': 0, 'Member Khusus': 0, 'Lainnya': 0 };
    const last7Days = {};
    const hourlyCounts = Array(24).fill(0);
    const codeFrequency = {};
    const deviceCounts = {};
    
    // Inisialisasi 7 hari terakhir
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateKey = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        last7Days[dateKey] = 0;
    }

    // Proses setiap log
    logs.forEach(log => {
        let logDate;
        if (log.waktu && log.waktu.toDate) {
            logDate = log.waktu.toDate();
        } else {
            logDate = new Date(log.waktu);
        }
        if (isNaN(logDate.getTime())) return;

        // Statistik waktu
        if (logDate.toDateString() === todayStr) todayCount++;
        if (logDate >= weekAgo) weekCount++;
        if (logDate >= monthAgo) monthCount++;

        // Kategori
        const kat = log.kategori || 'Lainnya';
        if (categoryCounts[kat] !== undefined) categoryCounts[kat]++;
        else categoryCounts['Lainnya']++;

        // Per hari (7 hari)
        const dayKey = logDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        if (last7Days.hasOwnProperty(dayKey)) last7Days[dayKey]++;

        // Per jam (24 jam)
        hourlyCounts[logDate.getHours()]++;

        // Frekuensi kode
        const kode = log.kode || 'Unknown';
        codeFrequency[kode] = (codeFrequency[kode] || 0) + 1;

        // Device
        const device = log.device || 'Unknown';
        const deviceShort = getDeviceName(device);
        deviceCounts[deviceShort] = (deviceCounts[deviceShort] || 0) + 1;
    });

    // Hitung rata-rata per hari (30 hari terakhir)
    const avgPerDay = logs.length > 0 ? (logs.filter(l => {
        let d = l.waktu?.toDate ? l.waktu.toDate() : new Date(l.waktu);
        return d >= monthAgo;
    }).length / 30).toFixed(1) : 0;

    // Jam tersibuk
    const peakHour = hourlyCounts.indexOf(Math.max(...hourlyCounts));
    const peakHourStr = Math.max(...hourlyCounts) > 0 
        ? `${peakHour.toString().padStart(2, '0')}:00 - ${peakHour.toString().padStart(2, '0')}:59`
        : '-';

    // Update kartu statistik
    document.getElementById('statToday').textContent = todayCount;
    document.getElementById('statWeek').textContent = weekCount;
    document.getElementById('statMonth').textContent = monthCount;
    document.getElementById('statTotal').textContent = logs.length;
    document.getElementById('statAvg').textContent = avgPerDay;
    document.getElementById('statPeak').textContent = peakHourStr;
    document.getElementById('peakBadge').textContent = `${Math.max(...hourlyCounts)} akses`;

    // Render semua visualisasi
    renderTrendChart(last7Days);
    renderCategoryChart(categoryCounts);
    renderHourlyChart(hourlyCounts);
    renderTopCodes(codeFrequency);
    renderDeviceList(deviceCounts);
    renderLogTable(logs.slice(0, 20));
}

// ============================================================
// HELPER: Nama Device yang Ramah
// ============================================================
function getDeviceName(ua) {
    if (!ua) return 'Unknown';
    if (/iPhone/i.test(ua)) return '📱 iPhone';
    if (/iPad/i.test(ua)) return '📱 iPad';
    if (/Android.*Mobile/i.test(ua)) return '📱 Android';
    if (/Android/i.test(ua)) return '💻 Android Tablet';
    if (/Windows/i.test(ua)) return '💻 Windows';
    if (/Macintosh/i.test(ua)) return '💻 Mac';
    if (/Linux/i.test(ua)) return '💻 Linux';
    return '💻 Lainnya';
}

function getBadgeClass(kategori) {
    const map = {
        'Dewasa': 'badge-dewasa',
        'Anak-anak': 'badge-anak',
        'Pelajar': 'badge-pelajar',
        'Reguler': 'badge-reguler',
        'Member Khusus': 'badge-member'
    };
    return map[kategori] || 'badge-lainnya';
}

// ============================================================
// GRAFIK 1: TREN 7 HARI (Line Chart)
// ============================================================
let trendChartInstance = null;
function renderTrendChart(dataObj) {
    const ctx = document.getElementById('trendChart').getContext('2d');
    const labels = Object.keys(dataObj);
    const data = Object.values(dataObj);
    const total = data.reduce((a, b) => a + b, 0);
    
    document.getElementById('trendBadge').textContent = `${total} akses`;

    if (trendChartInstance) trendChartInstance.destroy();

    trendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Jumlah Akses',
                data: data,
                borderColor: '#b8860b',
                backgroundColor: (context) => {
                    const chart = context.chart;
                    const {ctx: c, chartArea} = chart;
                    if (!chartArea) return null;
                    const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                    gradient.addColorStop(0, 'rgba(184, 134, 11, 0.3)');
                    gradient.addColorStop(1, 'rgba(184, 134, 11, 0.01)');
                    return gradient;
                },
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#b8860b',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#0a192f',
                    padding: 12,
                    titleFont: { size: 14 },
                    bodyFont: { size: 13 }
                }
            },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } },
                x: { grid: { display: false } }
            }
        }
    });
}

// ============================================================
// GRAFIK 2: KATEGORI (Doughnut Chart)
// ============================================================
let categoryChartInstance = null;
function renderCategoryChart(dataObj) {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    const activeCategories = Object.keys(dataObj).filter(k => dataObj[k] > 0);
    const activeData = activeCategories.map(k => dataObj[k]);

    if (categoryChartInstance) categoryChartInstance.destroy();

    categoryChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: activeCategories.length > 0 ? activeCategories : ['Belum ada data'],
            datasets: [{
                data: activeData.length > 0 ? activeData : [1],
                backgroundColor: ['#b8860b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#6b7280'],
                borderWidth: 3,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, padding: 12, font: { size: 11 } } }
            }
        }
    });
}

// ============================================================
// GRAFIK 3: JAM TERSIBUK (Bar Chart)
// ============================================================
let hourlyChartInstance = null;
function renderHourlyChart(hourlyCounts) {
    const ctx = document.getElementById('hourlyChart').getContext('2d');
    const labels = Array.from({length: 24}, (_, i) => `${i.toString().padStart(2, '0')}:00`);

    if (hourlyChartInstance) hourlyChartInstance.destroy();

    hourlyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Akses',
                data: hourlyCounts,
                backgroundColor: hourlyCounts.map(v => v > 0 ? '#b8860b' : '#e5e7eb'),
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } },
                x: { 
                    ticks: { 
                        maxRotation: 0,
                        callback: function(val, index) {
                            return index % 3 === 0 ? this.getLabelForValue(val) : '';
                        }
                    }
                }
            }
        }
    });
}

// ============================================================
// TOP 5 KODE TERPOPULER
// ============================================================
function renderTopCodes(codeFreq) {
    const container = document.getElementById('topCodesList');
    const sorted = Object.entries(codeFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    if (sorted.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 20px;">Belum ada data</p>';
        return;
    }

    const rankClasses = ['gold', 'silver', 'bronze', '', ''];
    
    let html = '';
    sorted.forEach(([code, count], idx) => {
        html += `
            <div class="top-code-item">
                <div class="rank ${rankClasses[idx]}">${idx + 1}</div>
                <div class="code">${code}</div>
                <div class="count">${count}x</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ============================================================
// LIST DEVICE
// ============================================================
function renderDeviceList(deviceCounts) {
    const container = document.getElementById('deviceList');
    const sorted = Object.entries(deviceCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    if (sorted.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 20px;">Belum ada data</p>';
        return;
    }

    const total = sorted.reduce((sum, [, count]) => sum + count, 0);
    
    let html = '';
    sorted.forEach(([device, count]) => {
        const percent = ((count / total) * 100).toFixed(0);
        html += `
            <div class="top-code-item">
                <div class="code">${device}</div>
                <div class="count">${count} (${percent}%)</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ============================================================
// TABEL LOG AKSES
// ============================================================
function renderLogTable(logs) {
    const container = document.getElementById('logTable');
    document.getElementById('logBadge').textContent = `${logs.length} data`;

    if (logs.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 20px;">Belum ada log akses</p>';
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th>Waktu</th>
                    <th>Kode</th>
                    <th>Kategori</th>
                    <th>Durasi</th>
                    <th>Device</th>
                </tr>
            </thead>
            <tbody>
    `;

    logs.forEach(log => {
        let logDate;
        if (log.waktu && log.waktu.toDate) {
            logDate = log.waktu.toDate();
        } else {
            logDate = new Date(log.waktu);
        }

        const waktu = !isNaN(logDate.getTime())
            ? logDate.toLocaleString('id-ID', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            })
            : '-';

        const kategori = log.kategori || 'Lainnya';
        const badgeClass = getBadgeClass(kategori);
        const durasi = log.durasi == -1 ? '∞ Permanen' : `${log.durasi || 60} mnt`;
        const device = getDeviceName(log.device || '');

        html += `
            <tr>
                <td>${waktu}</td>
                <td><strong>${log.kode || '-'}</strong></td>
                <td><span class="badge-kat ${badgeClass}">${kategori}</span></td>
                <td>${durasi}</td>
                <td>${device}</td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

// ============================================================
// AKSI ADMIN
// ============================================================
function refreshDashboard() {
    const btn = document.querySelector('.btn-refresh');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Memuat...';
    btn.disabled = true;
    
    loadDashboardData().finally(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
    });
}

function logout() {
    if (confirm('Yakin ingin keluar dari dashboard admin?')) {
        localStorage.removeItem('admin_logged_in');
        localStorage.removeItem('admin_username');
        window.location.href = 'admin.html';
    }
}
