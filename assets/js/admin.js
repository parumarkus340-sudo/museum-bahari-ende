// ============================================================
// MUSEUM BAHARI ENDE - Admin Dashboard (FINAL VERSION)
// Login: Google Sheets | Data: Firebase Firestore
// ============================================================

// 1. KONFIGURASI GOOGLE SHEET (untuk login)
const SHEET_ID = '14Yjote6VXC0LB65Sd_ZcgXdUE0kVexQFNhO_lbGhYVs';
const SHEET_ADMIN = 'Admin';

// 2. KONFIGURASI FIREBASE (untuk data statistik)
// TEMPEL KONFIGURASI FIREBASE ANDA DI SINI (sama dengan soft_paywall.js)
const firebaseConfig = {
  apiKey: "AIzaSyC7hlKKSsqxO9pBMKU_vvRPo6uDbfMYX8g",
  authDomain: "website-museum.firebaseapp.com",
  projectId: "website-museum",
  storageBucket: "website-museum.firebasestorage.app",
  messagingSenderId: "1083931496533",
  appId: "1:1083931496533:web:5116fc4eb57c010f5684dc",
  measurementId: "G-C69FK266K4"
};

// Inisialisasi Firebase
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
// HALAMAN LOGIN (admin.html)
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
// HALAMAN DASHBOARD (dashboard.html)
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
            logs.push(doc.data());
        });

        console.log(`✅ Berhasil memuat ${logs.length} data log.`);
        processAndRenderCharts(logs);
    } catch (error) {
        console.error("❌ Gagal memuat data dari Firebase:", error);
        document.getElementById('statToday').textContent = "Error";
    }
}

function processAndRenderCharts(logs) {
    const now = new Date();
    const todayStr = now.toDateString();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let todayCount = 0, weekCount = 0, monthCount = 0;
    const categoryCounts = { 'Dewasa': 0, 'Anak-anak': 0, 'Pelajar': 0, 'Reguler': 0, 'Member Khusus': 0, 'Lainnya': 0 };
    const last7Days = {};
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateKey = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        last7Days[dateKey] = 0;
    }

    logs.forEach(log => {
        let logDate;
        if (log.waktu && log.waktu.toDate) {
            logDate = log.waktu.toDate();
        } else {
            logDate = new Date(log.waktu);
        }

        if (logDate.toDateString() === todayStr) todayCount++;
        if (logDate >= weekAgo) weekCount++;
        if (logDate >= monthAgo) monthCount++;

        const kat = log.kategori || 'Lainnya';
        if (categoryCounts[kat] !== undefined) {
            categoryCounts[kat]++;
        } else {
            categoryCounts['Lainnya']++;
        }

        const dayKey = logDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        if (last7Days.hasOwnProperty(dayKey)) {
            last7Days[dayKey]++;
        }
    });

    document.getElementById('statToday').textContent = todayCount;
    document.getElementById('statWeek').textContent = weekCount;
    document.getElementById('statMonth').textContent = monthCount;
    document.getElementById('statTotal').textContent = logs.length;

    renderTrendChart(last7Days);
    renderCategoryChart(categoryCounts);
}

let trendChartInstance = null;
let categoryChartInstance = null;

function renderTrendChart(dataObj) {
    const ctx = document.getElementById('trendChart').getContext('2d');
    const labels = Object.keys(dataObj);
    const data = Object.values(dataObj);

    if (trendChartInstance) trendChartInstance.destroy();

    trendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Jumlah Akses',
                data: data,
                borderColor: '#b8860b',
                backgroundColor: 'rgba(184, 134, 11, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#b8860b',
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } }
            }
        }
    });
}

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
                backgroundColor: ['#b8860b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, padding: 15 } }
            }
        }
    });
}

function logout() {
    if (confirm('Yakin ingin keluar dari dashboard admin?')) {
        localStorage.removeItem('admin_logged_in');
        localStorage.removeItem('admin_username');
        window.location.href = 'admin.html';
    }
}
