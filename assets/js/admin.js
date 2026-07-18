// assets/js/admin.js

// ============================================================
// KONFIGURASI
// ============================================================
const SHEET_ID = '14Yjote6VXC0LB65Sd_ZcgXdUE0kVexQFNhO_lbGhYVs';
const SHEET_KODE = 'Kode';
const SHEET_STATISTIK = 'Statistik';
const SHEET_ADMIN = 'Admin';

// ============================================================
// FUNGSI UTILITAS: SHA-256 Hash (untuk password)
// ============================================================
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================
// FUNGSI UTILITAS: Baca Google Sheet
// ============================================================
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
    // Cek apakah sudah login
    if (localStorage.getItem('admin_logged_in') === 'true') {
        window.location.href = 'dashboard.html';
    }

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const errorMsg = document.getElementById('errorMsg');
        
        errorMsg.style.display = 'none';
        
        // Hash password
        const passwordHash = await sha256(password);
        
        // Baca sheet Admin
        const data = await readSheet(SHEET_ADMIN);
        if (!data || !data.table || !data.table.rows) {
            errorMsg.innerHTML = '<i class="fa fa-exclamation-circle"></i> Gagal terhubung ke server.';
            errorMsg.style.display = 'block';
            return;
        }
        
        // Cari username yang cocok
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
    // Cek apakah sudah login
    if (localStorage.getItem('admin_logged_in') !== 'true') {
        window.location.href = 'admin.html';
    } else {
        document.getElementById('adminName').textContent = localStorage.getItem('admin_username') || 'Admin';
        loadDashboard();
    }
}

async function loadDashboard() {
    // Load semua data secara paralel
    const [statsData, codesData] = await Promise.all([
        readSheet(SHEET_STATISTIK),
        readSheet(SHEET_KODE)
    ]);
    
    // Hitung statistik
    calculateStats(statsData);
    
    // Render grafik
    renderChart(statsData);
    
    // Render tabel kode
    renderCodesTable(codesData);
    
    // Render log akses
    renderLogTable(statsData);
}

function calculateStats(data) {
    if (!data || !data.table || !data.table.rows) {
        document.getElementById('statToday').textContent = '0';
        document.getElementById('statWeek').textContent = '0';
        document.getElementById('statMonth').textContent = '0';
        return;
    }
    
    const now = new Date();
    const today = now.toDateString();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    let todayCount = 0, weekCount = 0, monthCount = 0;
    
    data.table.rows.forEach(row => {
        const cells = row.c;
        if (!cells || !cells[0] || !cells[0].v) return;
        
        const timestamp = new Date(cells[0].v);
        if (isNaN(timestamp)) return;
        
        if (timestamp.toDateString() === today) todayCount++;
        if (timestamp >= weekAgo) weekCount++;
        if (timestamp >= monthAgo) monthCount++;
    });
    
    document.getElementById('statToday').textContent = todayCount;
    document.getElementById('statWeek').textContent = weekCount;
    document.getElementById('statMonth').textContent = monthCount;
}

function renderChart(data) {
    const container = document.getElementById('chartContainer');
    if (!data || !data.table || !data.table.rows) {
        container.innerHTML = '<div class="loading">Tidak ada data</div>';
        return;
    }
    
    // Hitung akses per hari (7 hari terakhir)
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        days.push({
            date: date.toDateString(),
            label: date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }),
            count: 0
        });
    }
    
    data.table.rows.forEach(row => {
        const cells = row.c;
        if (!cells || !cells[0] || !cells[0].v) return;
        const timestamp = new Date(cells[0].v);
        if (isNaN(timestamp)) return;
        
        const day = days.find(d => d.date === timestamp.toDateString());
        if (day) day.count++;
    });
    
    const maxCount = Math.max(...days.map(d => d.count), 1);
    
    let html = '';
    days.forEach(day => {
        const height = (day.count / maxCount) * 100;
        html += `
            <div class="chart-bar" style="height: ${Math.max(height, 5)}%;" title="${day.label}: ${day.count} akses">
                <span class="bar-value">${day.count}</span>
                <span class="bar-label">${day.label}</span>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

async function renderCodesTable(data) {
    const container = document.getElementById('codesTable');
    if (!data || !data.table || !data.table.rows) {
        container.innerHTML = '<p>Tidak ada data kode.</p>';
        document.getElementById('statCodes').textContent = '0';
        return;
    }
    
    let activeCount = 0;
    let html = `<table>
        <thead>
            <tr>
                <th>Kode</th>
                <th>Kategori</th>
                <th>Durasi</th>
                <th>Status</th>
                <th>Aksi</th>
            </tr>
        </thead>
        <tbody>`;
    
    data.table.rows.forEach((row, index) => {
        const cells = row.c;
        if (!cells || !cells[0] || !cells[0].v) return;
        
        const kode = cells[0].v.toString().trim();
        const kategori = cells[1]?.v?.toString() || '-';
        const durasi = cells[2]?.v || 60;
        const status = cells[5]?.v?.toString().toLowerCase() || 'aktif';
        
        if (status === 'aktif') activeCount++;
        
        const isMember = durasi == -1;
        const statusBadge = status === 'aktif' 
            ? '<span class="badge-aktif">Aktif</span>' 
            : '<span class="badge-nonaktif">Nonaktif</span>';
        const kategoriBadge = isMember 
            ? `<span class="badge-member"><i class="fa fa-diamond"></i> ${kategori}</span>`
            : kategori;
        
        html += `
            <tr>
                <td><strong>${kode}</strong></td>
                <td>${kategoriBadge}</td>
                <td>${isMember ? '∞ Permanen' : durasi + ' menit'}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn-action btn-toggle" onclick="toggleCode('${kode}', '${status === 'aktif' ? 'nonaktif' : 'aktif'}')">
                        <i class="fa fa-${status === 'aktif' ? 'ban' : 'check'}"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
    document.getElementById('statCodes').textContent = activeCount;
}

function renderLogTable(data) {
    const container = document.getElementById('logTable');
    if (!data || !data.table || !data.table.rows || data.table.rows.length === 0) {
        container.innerHTML = '<p>Belum ada log akses.</p>';
        return;
    }
    
    // Ambil 20 terbaru (dari bawah)
    const rows = data.table.rows.slice(-20).reverse();
    
    let html = `<table>
        <thead>
            <tr>
                <th>Waktu</th>
                <th>Kode</th>
                <th>Kategori</th>
                <th>Durasi</th>
            </tr>
        </thead>
        <tbody>`;
    
    rows.forEach(row => {
        const cells = row.c;
        if (!cells) return;
        
        const timestamp = cells[0]?.v ? new Date(cells[0].v) : '-';
        const kode = cells[1]?.v?.toString() || '-';
        const kategori = cells[2]?.v?.toString() || '-';
        const durasi = cells[3]?.v;
        
        const waktu = timestamp instanceof Date && !isNaN(timestamp)
            ? timestamp.toLocaleString('id-ID', { 
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            })
            : '-';
        
        html += `
            <tr>
                <td>${waktu}</td>
                <td><strong>${kode}</strong></td>
                <td>${kategori}</td>
                <td>${durasi == -1 ? '∞ Permanen' : (durasi || 60) + ' menit'}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

// ============================================================
// AKSI ADMIN
// ============================================================
async function addCode() {
    const kode = document.getElementById('newCode').value.trim().toUpperCase();
    const durasi = document.getElementById('newDurasi').value;
    const kategori = document.getElementById('newKategori').value;
    
    if (!kode) {
        alert('Kode tidak boleh kosong!');
        return;
    }
    
    // Karena Google Sheets tidak bisa ditulis langsung dari client-side JavaScript
    // (butuh Apps Script), kita buka sheet di tab baru untuk admin menambahkan manual
    const hargaMap = {
        'Dewasa': 10000,
        'Anak-anak': 5000,
        'Pelajar': 7000,
        'Wisatawan Asing': 25000,
        'Member Khusus': 0
    };
    const labelMap = {
        'Dewasa': 'Dewasa (1 Jam)',
        'Anak-anak': 'Anak-anak (1 Jam)',
        'Pelajar': 'Pelajar (1 Jam)',
        'Wisatawan Asing': 'Wisatawan Asing (1 Jam)',
        'Member Khusus': 'Member Khusus (Bebas)'
    };
    const harga = kategori === 'Member Khusus' ? 'Gratis' : 'Rp' + (hargaMap[kategori] || 10000).toLocaleString('id-ID');
    const label = kategori === 'Member Khusus' ? 'Member Khusus (Bebas)' : `${kategori} (${durasi} Menit)`;
    const finalDurasi = kategori === 'Member Khusus' ? -1 : durasi;
    
    const message = `Silakan tambahkan baris baru di Google Sheet dengan data:\n\n` +
                    `Kode: ${kode}\n` +
                    `Kategori: ${kategori}\n` +
                    `Durasi: ${finalDurasi}\n` +
                    `Label: ${label}\n` +
                    `Harga: ${harga}\n` +
                    `Status: aktif\n\n` +
                    `Klik OK untuk membuka Google Sheet.`;
    
    if (confirm(message)) {
        window.open(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`, '_blank');
    }
}

async function toggleCode(kode, newStatus) {
    // Sama seperti addCode - buka sheet untuk admin mengubah status
    const message = `Untuk mengubah status kode "${kode}" menjadi "${newStatus}", ` +
                    `silakan ubah kolom Status di Google Sheet.\n\nKlik OK untuk membuka Google Sheet.`;
    
    if (confirm(message)) {
        window.open(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`, '_blank');
    }
}

function logout() {
    if (confirm('Yakin ingin keluar dari dashboard admin?')) {
        localStorage.removeItem('admin_logged_in');
        localStorage.removeItem('admin_username');
        window.location.href = 'admin.html';
    }
}