// ============================================================
// MUSEUM BAHARI ENDE - Admin Dashboard (VERSI CHART.JS + FIREBASE)
// ============================================================

// 1. TEMPEL KONFIGURASI FIREBASE ANDA DI SINI (Sama persis dengan soft_paywall.js)
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
// HALAMAN LOGIN
// ============================================================
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    if (localStorage.getItem('admin_logged_in') === 'true') {
        window.location.href = 'dashboard.html';
    }

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        // Untuk kesederhanaan, kita gunakan hardcoded hash dari panduan sebelumnya
        // Username: admin, Password: password (Hash: 5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8)
        const username = document.getElementById('username').value.trim().toLowerCase();
        const password = document.getElementById('password').value;
        
        // Hash sederhana untuk demo (di produksi, gunakan backend hashing)
        // Di sini kita cek langsung string hash-nya untuk kemudahan
        const inputHash = "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8"; 
        
        // Catatan: Untuk hashing asli di browser, kita butuh fungsi async sha256. 
        // Untuk versi simpel ini, kita anggap password "password" sudah benar jika sesuai.
        // Mari kita buat fungsi sha256 mini:
        sha256(password).then(hash => {
            if (username === 'admin' && hash === inputHash) {
                localStorage.setItem('admin_logged_in', 'true');
                localStorage.setItem('admin_username', 'Admin');
                window.location.href = 'dashboard.html';
            } else {
                document.getElementById('errorMsg').style.display = 'block';
            }
        });
    });
}

async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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
        // Ambil semua data log akses, urutkan dari yang terbaru
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
    
    // Data untuk Grafik
    const categoryCounts = { 'Dewasa': 0, 'Anak-anak': 0, 'Pelajar': 0, 'Reguler': 0, 'Member Khusus': 0, 'Lainnya': 0 };
    const last7Days = {};
    
    // Inisialisasi 7 hari terakhir dengan 0
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateKey = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        last7Days[dateKey] = 0;
    }

    logs.forEach(log => {
        // Hitung statistik waktu
        let logDate;
        if (log.waktu && log.waktu.toDate) {
            logDate = log.waktu.toDate(); // Firebase Timestamp
        } else {
            logDate = new Date(log.waktu); // Fallback
        }

        if (logDate.toDateString() === todayStr) todayCount++;
        if (logDate >= weekAgo) weekCount++;
        if (logDate >= monthAgo) monthCount++;

        // Hitung kategori
        const kat = log.kategori || 'Lainnya';
        if (categoryCounts[kat] !== undefined) {
            categoryCounts[kat]++;
        } else {
            categoryCounts['Lainnya']++;
        }

        // Hitung per hari untuk grafik
        const dayKey = logDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        if (last7Days.hasOwnProperty(dayKey)) {
            last7Days[dayKey]++;
        }
    });

    // Update Kartu Statistik
    document.getElementById('statToday').textContent = todayCount;
    document.getElementById('statWeek').textContent = weekCount;
    document.getElementById('statMonth').textContent = monthCount;
    document.getElementById('statTotal').textContent = logs.length;

    // Render Grafik
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
    
    // Hanya ambil kategori yang > 0 agar grafik rapi
    const activeCategories = Object.keys(dataObj).filter(k => dataObj[k] > 0);
    const activeData = activeCategories.map(k => dataObj[k]);

    if (categoryChartInstance) categoryChartInstance.destroy();

    categoryChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: activeCategories.length > 0 ? activeCategories : ['Belum ada data'],
            datasets: [{
                data: activeData.length > 0 ? activeData : [1],
                backgroundColor: [
                    '#b8860b', // Dewasa (Emas)
                    '#10b981', // Anak-anak (Hijau)
                    '#3b82f6', // Pelajar (Biru)
                    '#ef4444', // Reguler/Lainnya (Merah)
                    '#8b5cf6'  // Member (Ungu)
                ],
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
