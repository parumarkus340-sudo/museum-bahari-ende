// assets/js/admin.js (VERSI DIPERBAIKI - Statistik Lebih Akurat)

// ============================================================
// KONFIGURASI
// ============================================================
const SHEET_ID = '14Yjote6VXC0LB65Sd_ZcgXdUE0kVexQFNhO_lbGhYVs';
const SHEET_KODE = 'Kode';
const SHEET_STATISTIK = 'Statistik';
const SHEET_ADMIN = 'Admin';

// ============================================================
// FUNGSI UTILITAS: SHA-256 Hash
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
        console.log(`📖 Membaca sheet: ${sheetName}...`);
        const response = await fetch(url);
        const text = await response.text();
        const jsonString = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
        const data = JSON.parse(jsonString);
        console.log(`✅ Sheet "${sheetName}" berhasil dibaca. Baris: ${data.table?.rows?.length || 0}`);
        return data;
    } catch (e) {
        console.error(`❌ Gagal membaca sheet ${sheetName}:`, e);
        return null;
    }
}

// ============================================================
// FUNGSI UTILITAS: Parse Timestamp dari Google Sheet
// ============================================================
function parseTimestamp(cell) {
    if (!cell || !cell.v) return null;
    
    // Google Sheets bisa mengirim timestamp dalam beberapa format:
    // 1. Number (milliseconds since epoch) - format "v"
    // 2. String ISO - format "f" (formatted)
    // 3. Object Date
    
    try {
        // Format 1: Number (paling umum dari Apps Script)
        if (typeof cell.v === 'number') {
            return new Date(cell.v);
        }
        
        // Format 2: String (ISO atau format Google)
        if (typeof cell.v === 'string') {
            const d = new Date(cell.v);
            if (!isNaN(d.getTime())) return d;
        }
        
        // Format 3: Gunakan formatted value "f" jika ada
        if (cell.f) {
            const d = new Date(cell.f);
            if (!isNaN(d.getTime())) return d;
        }
        
        return null;
    } catch (e) {
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
        loadDashboard();
    }
}

async function loadDashboard() {
    console.log("🚀 Memuat dashboard...");
    
    const [statsData, codesData] = await Promise.all([
        readSheet(SHEET_STATISTIK),
        readSheet(SHEET_KODE)
    ]);
    
    // DEBUG: Tampilkan data mentah
    console.log("📊 Data Statistik mentah:", statsData);
    
    calculateStats(statsData);
    renderChart(statsData);
    renderCodesTable(codesData);
    renderLogTable(statsData);
}

// ============================================================
// FUNGSI: HITUNG STATISTIK
// ============================================================
function calculateStats(data) {
    const elToday = document.getElementById('statToday');
    const elWeek = document.getElementById('statWeek');
    const elMonth = document.getElementById('statMonth');
    
    if (!data || !data.table || !data.table.rows || data.table.rows.length === 0) {
        console.warn("⚠️ Tidak ada data statistik.");
        elToday.textContent = '0';
        elWeek.textContent = '0';
        elMonth.textContent = '0';
        return;
    }
    
    const now = new Date();
    const todayStr = now.toDateString();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    let todayCount = 0, weekCount = 0, monthCount = 0;
    let parsedCount = 0;
    
    data.table.rows.forEach((row, index) => {
        // Skip header row
        if (index === 0) return;
        
        const cells = row.c;
        if (!cells || !cells[0]) return;
        
        const timestamp = parseTimestamp(cells[0]);
        if (!timestamp) {
            console.warn(`⚠️ Baris ${index + 1}: Timestamp tidak valid:`, cells[0]);
            return;
        }
        
        parsedCount++;
        
        // Normalisasi ke awal hari untuk perbandingan yang akurat
        const tsDay = new Date(timestamp.getFullYear(), timestamp.getMonth(), timestamp.getDate());
        const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        if (tsDay.getTime() === todayDay.getTime()) todayCount++;
        if (timestamp >= weekAgo) weekCount++;
        if (timestamp >= monthAgo) monthCount++;
    });
    
    console.log(`📈 Statistik: Hari=${todayCount}, Minggu=${weekCount}, Bulan=${monthCount}, Total parsed=${parsedCount}`);
    
    elToday.textContent = todayCount;
    elWeek.textContent = weekCount;
    elMonth.textContent = monthCount;
}

// ============================================================
// FUNGSI: RENDER GRAFIK 7 HARI
// ============================================================
function renderChart(data) {
    const container = document.getElementById('chartContainer');
    
    if (!data || !data.table || !data.table.rows || data.table.rows.length === 0) {
        container.innerHTML = `
            <div class="loading">
                <i class="fa fa-info-circle" style="color: #ffc107;"></i><br>
                Belum ada data statistik.<br>
                <small style="color: #94a3b8;">Data akan muncul setelah pengunjung menggunakan kode akses.</small>
            </div>
        `;
        return;
    }
    
    // Siapkan 7 hari terakhir
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        days.push({
            dateKey: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
            label: date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }),
            count: 0
        });
    }
    
    // Hitung akses per hari
    data.table.rows.forEach((row, index) => {
        if (index === 0) return; // Skip header
        const cells = row.c;
        if (!cells || !cells[0]) return;
        
        const timestamp = parseTimestamp(cells[0]);
        if (!timestamp) return;
        
        const dateKey = `${timestamp.getFullYear()}-${timestamp.getMonth()}-${timestamp.getDate()}`;
        const day = days.find(d => d.dateKey === dateKey);
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

// ============================================================
// FUNGSI: RENDER TABEL KODE
// ============================================================
async function renderCodesTable(data) {
    const container = document.getElementById('codesTable');
    
    if (!data || !data.table || !data.table.rows || data.table.rows.length === 0) {
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
        if (index === 0) return; // Skip header
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

// ============================================================
// FUNGSI: RENDER LOG AKSES
// ============================================================
function renderLogTable(data) {
    const container = document.getElementById('logTable');
    
    if (!data || !data.table || !data.table.rows || data.table.rows.length <= 1) {
        container.innerHTML = `
            <p style="text-align: center; color: #6c757d; padding: 20px;">
                <i class="fa fa-info-circle"></i> Belum ada log akses.<br>
                <small>Log akan muncul setelah pengunjung menggunakan kode akses.</small>
            </p>
        `;
        return;
    }
    
    // Ambil 20 terbaru (skip header, lalu reverse)
    const rows = data.table.rows.slice(1).slice(-20).reverse();
    
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
        
        const timestamp = parseTimestamp(cells[0]);
        const kode = cells[1]?.v?.toString() || '-';
        const kategori = cells[2]?.v?.toString() || '-';
        const durasi = cells[3]?.v;
        
        const waktu = timestamp 
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
function addCode() {
    const kode = document.getElementById('newCode').value.trim().toUpperCase();
    const durasi = document.getElementById('newDurasi').value;
    const kategori = document.getElementById('newKategori').value;
    
    if (!kode) {
        alert('Kode tidak boleh kosong!');
        return;
    }
    
    const hargaMap = {
        'Dewasa': 10000, 'Anak-anak': 5000, 'Pelajar': 7000,
        'Wisatawan Asing': 25000, 'Member Khusus': 0
    };
    const harga = kategori === 'Member Khusus' ? 'Gratis' : 'Rp' + (hargaMap[kategori] || 10000).toLocaleString('id-ID');
    const finalDurasi = kategori === 'Member Khusus' ? -1 : durasi;
    const label = kategori === 'Member Khusus' ? 'Member Khusus (Bebas)' : `${kategori} (${durasi} Menit)`;
    
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

function toggleCode(kode, newStatus) {
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

// ============================================================
// FUNGSI: REFRESH DASHBOARD MANUAL
// ============================================================
function refreshDashboard() {
    location.reload();
}
