// ============================================================
// MUSEUM BAHARI ENDE - NGera Shells
// File: admin.js (VERSI FINAL - Tanpa Error)
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
        console.log(`✅ Sheet "${sheetName}" berhasil dibaca. Total baris: ${data.table?.rows?.length || 0}`);
        return data;
    } catch (e) {
        console.error(`❌ Gagal membaca sheet ${sheetName}:`, e);
        return null;
    }
}

// ============================================================
// FUNGSI UTILITAS: Parse Timestamp
// ============================================================
function parseTimestamp(cell) {
    if (!cell || !cell.v) return null;
    try {
        if (typeof cell.v === 'number') return new Date(cell.v);
        if (typeof cell.v === 'string') {
            const d = new Date(cell.v);
            if (!isNaN(d.getTime())) return d;
        }
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
// FUNGSI: Deteksi Header (VERSI FINAL - Akurat & Aman)
// ============================================================
function isHeaderRow(cells) {
    if (!cells || !cells[0] || !cells[0].v) return false;
    
    const firstCell = cells[0].v.toString().trim().toUpperCase();
    
    // HANYA deteksi kata kunci header yang eksplisit
    const headerKeywords = ['KODE', 'CODE', 'NAMA', 'NO', 'NO.', 'NOMOR', 'ID', 'KEY', 'USERNAME', 'TIMESTAMP'];
    
    return headerKeywords.includes(firstCell);
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
    
    calculateStats(statsData);
    renderChart(statsData);
    renderCodesTable(codesData);
    renderLogTable(statsData);
}

// ============================================================
// FUNGSI: HITUNG STATISTIK AKSES
// ============================================================
function calculateStats(data) {
    const elToday = document.getElementById('statToday');
    const elWeek = document.getElementById('statWeek');
    const elMonth = document.getElementById('statMonth');
    
    if (!data || !data.table || !data.table.rows || data.table.rows.length === 0) {
        elToday.textContent = '0';
        elWeek.textContent = '0';
        elMonth.textContent = '0';
        return;
    }
    
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    let todayCount = 0, weekCount = 0, monthCount = 0;
    
    data.table.rows.forEach((row, index) => {
        if (index === 0 && isHeaderRow(row.c)) return; // Skip header
        
        const cells = row.c;
        if (!cells || !cells[0]) return;
        
        const timestamp = parseTimestamp(cells[0]);
        if (!timestamp) return;
        
        const tsDay = new Date(timestamp.getFullYear(), timestamp.getMonth(), timestamp.getDate());
        const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        if (tsDay.getTime() === todayDay.getTime()) todayCount++;
        if (timestamp >= weekAgo) weekCount++;
        if (timestamp >= monthAgo) monthCount++;
    });
    
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
    
    data.table.rows.forEach((row, index) => {
        if (index === 0 && isHeaderRow(row.c)) return;
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
// FUNGSI: RENDER TABEL KODE (VERSI FINAL)
// ============================================================
async function renderCodesTable(data) {
    const container = document.getElementById('codesTable');
    const elStatCodes = document.getElementById('statCodes');
    
    if (!data || !data.table || !data.table.rows) {
        container.innerHTML = '<p>Tidak ada data kode.</p>';
        elStatCodes.textContent = '0';
        return;
    }
    
    let totalRows = data.table.rows.length;
    let headerSkipped = false;
    let headerContent = null;
    let totalKodes = 0;
    let kodeAktif = 0;
    let kodeNonaktif = 0;
    let kodeTanpaStatus = 0;
    let barisKosong = 0;
    
    let kodeAktifList = [];
    let kodeNonaktifList = [];
    
    let html = `<table>
        <thead>
            <tr>
                <th style="width: 50px;">No</th>
                <th>Kode</th>
                <th>Kategori</th>
                <th>Durasi</th>
                <th>Status</th>
                <th style="width: 100px;">Aksi</th>
            </tr>
        </thead>
        <tbody>`;
    
    let nomor = 1;
    let startIndex = 0;
    
    // Deteksi header dengan fungsi yang akurat
    if (data.table.rows.length > 0) {
        const firstRow = data.table.rows[0];
        if (isHeaderRow(firstRow.c)) {
            headerSkipped = true;
            headerContent = firstRow.c[0]?.v?.toString() || '(kosong)';
            startIndex = 1;
            console.log(`✅ HEADER TERDETEKSI: "${headerContent}" → akan di-skip`);
        } else {
            console.log(`ℹ️ Tidak ada header. Semua baris dianggap sebagai data kode.`);
        }
    }
    
    // Proses semua baris
    data.table.rows.forEach((row, index) => {
        if (index < startIndex) return;
        
        const cells = row.c;
        
        if (!cells || cells.every(c => !c || !c.v || c.v.toString().trim() === '')) {
            barisKosong++;
            return;
        }
        
        const kode = cells[0]?.v?.toString().trim();
        if (!kode) {
            barisKosong++;
            return;
        }
        
        totalKodes++;
        const kategori = cells[1]?.v?.toString() || '-';
        const durasi = cells[2]?.v || 60;
        const status = cells[5]?.v?.toString().trim().toLowerCase() || '';
        
        if (status === 'aktif') {
            kodeAktif++;
            kodeAktifList.push(kode);
        } else if (status === 'nonaktif') {
            kodeNonaktif++;
            kodeNonaktifList.push(kode);
        } else {
            kodeTanpaStatus++;
            kodeAktif++;
            kodeAktifList.push(kode);
        }
        
        const isMember = durasi == -1;
        const statusBadge = (status === 'aktif' || status === '')
            ? '<span class="badge-aktif">Aktif</span>' 
            : '<span class="badge-nonaktif">Nonaktif</span>';
        const kategoriBadge = isMember 
            ? `<span class="badge-member"><i class="fa fa-diamond"></i> ${kategori}</span>`
            : kategori;
        
        const statusForToggle = (status === 'aktif' || status === '') ? 'nonaktif' : 'aktif';
        
        html += `
            <tr>
                <td>${nomor++}</td>
                <td><strong>${kode}</strong></td>
                <td>${kategoriBadge}</td>
                <td>${isMember ? '∞ Permanen' : durasi + ' menit'}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn-action btn-toggle" onclick="toggleCode('${kode}', '${statusForToggle}')">
                        <i class="fa fa-${statusForToggle === 'aktif' ? 'check' : 'ban'}"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    
    // Ringkasan statistik
    const summaryHtml = `
        <div style="background: #f8f9fa; border-left: 4px solid #b8860b; padding: 15px; margin-bottom: 20px; border-radius: 6px; font-size: 0.9em;">
            <strong style="color: #0a192f;"><i class="fa fa-info-circle"></i> Ringkasan Data dari Google Sheet:</strong>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; margin-top: 10px;">
                <div>📊 Total baris di Sheet: <strong>${totalRows}</strong></div>
                <div>✅ Header: <strong>${headerSkipped ? 'Ada ("' + headerContent + '")' : 'Tidak ada'}</strong></div>
                <div>📝 Total kode valid: <strong>${totalKodes}</strong></div>
                <div>🟢 Kode Aktif: <strong style="color: #10b981;">${kodeAktif}</strong></div>
                <div>🔴 Kode Nonaktif: <strong style="color: #ef4444;">${kodeNonaktif}</strong></div>
                <div>⚪ Tanpa status: <strong style="color: #6c757d;">${kodeTanpaStatus}</strong></div>
            </div>
        </div>
    `;
    
    container.innerHTML = summaryHtml + html;
    elStatCodes.textContent = kodeAktif;
    
    console.log("=".repeat(60));
    console.log("📊 RINGKASAN STATISTIK KODE:");
    console.log(`   Total baris di Sheet: ${totalRows}`);
    console.log(`   Header: ${headerSkipped ? 'Ada ("' + headerContent + '")' : 'Tidak ada'}`);
    console.log(`   Total kode valid: ${totalKodes}`);
    console.log(`   ✅ Kode Aktif: ${kodeAktif}`);
    console.log(`   ❌ Kode Nonaktif: ${kodeNonaktif}`);
    console.log(`   ⚪ Tanpa status: ${kodeTanpaStatus}`);
    console.log(`   📋 Daftar kode aktif:`, kodeAktifList);
    console.log("=".repeat(60));
}

// ============================================================
// FUNGSI: RENDER LOG AKSES
// ============================================================
function renderLogTable(data) {
    const container = document.getElementById('logTable');
    
    if (!data || !data.table || !data.table.rows || data.table.rows.length === 0) {
        container.innerHTML = `
            <p style="text-align: center; color: #6c757d; padding: 20px;">
                <i class="fa fa-info-circle"></i> Belum ada log akses.<br>
                <small>Log akan muncul setelah pengunjung menggunakan kode akses.</small>
            </p>
        `;
        return;
    }
    
    const startIndex = (data.table.rows.length > 0 && isHeaderRow(data.table.rows[0].c)) ? 1 : 0;
    const rows = data.table.rows.slice(startIndex).slice(-20).reverse();
    
    if (rows.length === 0) {
        container.innerHTML = `
            <p style="text-align: center; color: #6c757d; padding: 20px;">
                <i class="fa fa-info-circle"></i> Belum ada log akses.
            </p>
        `;
        return;
    }
    
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
                    `silakan ubah kolom Status (F) di Google Sheet.\n\nKlik OK untuk membuka Google Sheet.`;
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
