// ============================================================
// MUSEUM BAHARI ENDE - Ngera Shells
// File: soft_paywall.js (VERSI FINAL)
// ============================================================

const SHEET_ID = '14Yjote6VXC0LB65Sd_ZcgXdUE0kVexQFNhO_lbGhYVs';
const SHEET_NAME = 'Kode';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;

// ⚠️ Ganti dengan URL Apps Script Anda (harus berakhiran /exec)
const SCRIPT_URL = 'https://script.google.com/a/macros/guru.sd.belajar.id/s/AKfycbyC6MwzG1kjz235hJQrHIhcp0B0BHdDIHcutImgZgE/exec';

const FALLBACK_CODES = ['DEWASA10', 'ANAK5', 'PELAJAR7', 'WNA25', 'MEMBERVIP'];
let VALID_CODES = [];

// ============================================================
// FUNGSI: LOG STATISTIK
// ============================================================
async function logAccess(code, kategori, durasi) {
    try {
        const data = {
            timestamp: new Date().toISOString(),
            code: code,
            kategori: kategori,
            durasi: durasi,
            device: navigator.userAgent.substring(0, 100)
        };
        
        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        console.log("📊 Statistik akses tercatat.");
    } catch (e) {
        console.warn("⚠️ Gagal mencatat statistik:", e);
    }
}

// ============================================================
// FUNGSI: Deteksi Header (Konsisten dengan admin.js)
// ============================================================
function isHeaderRow(cells) {
    if (!cells || !cells[0] || !cells[0].v) return false;
    const firstCell = cells[0].v.toString().trim().toUpperCase();
    const headerKeywords = ['KODE', 'CODE', 'NAMA', 'NO', 'NO.', 'NOMOR', 'ID', 'KEY', 'USERNAME', 'TIMESTAMP'];
    return headerKeywords.includes(firstCell);
}

// ============================================================
// FUNGSI: AMBIL DAFTAR KODE
// ============================================================
async function loadValidCodes() {
    try {
        console.log("🚀 Mengambil data dari Google Sheet...");
        const response = await fetch(SHEET_URL);
        
        if (!response.ok) throw new Error(`Gagal terhubung. Status: ${response.status}`);
        
        const text = await response.text();
        const jsonString = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
        const data = JSON.parse(jsonString);
        
        const rows = data.table.rows;
        const codes = [];
        let startIndex = 0;
        
        // Skip header jika ada
        if (rows.length > 0 && isHeaderRow(rows[0].c)) {
            startIndex = 1;
            console.log("✅ Header terdeteksi, di-skip.");
        }
        
        rows.forEach((row, index) => {
            if (index < startIndex) return;
            
            const cells = row.c;
            if (!cells) return;
            
            const kode = cells[0]?.v?.toString().trim().toUpperCase();
            const status = cells[5]?.v?.toString().trim().toLowerCase();
            
            if (kode && (status === 'aktif' || status === undefined || status === '')) {
                codes.push(kode);
            }
        });
        
        console.log("✅ BERHASIL! Daftar kode valid:", codes);
        return codes;
    } catch (error) {
        console.error("❌ Gagal mengambil dari Google Sheet:", error);
        console.warn("⚠️ Menggunakan kode cadangan (Fallback).");
        return FALLBACK_CODES;
    }
}

// ============================================================
// FUNGSI UTAMA
// ============================================================
document.addEventListener("DOMContentLoaded", async function() {
    VALID_CODES = await loadValidCodes();
    console.log("📋 Sistem siap. Kode yang diizinkan:", VALID_CODES);
    
    const overlay = document.getElementById('paywall-overlay');
    const inputCode = document.getElementById('accessCode');
    const errorMsg = document.getElementById('error-msg');
    const accessInfo = document.getElementById('access-info');

    function checkAccessStatus() {
        const storedData = localStorage.getItem('museum_access_data');
        if (!storedData) return { hasAccess: false };
        
        try {
            const data = JSON.parse(storedData);
            const { code, timestamp, durasi } = data;
            
            if (!VALID_CODES.includes(code)) {
                localStorage.removeItem('museum_access_data');
                return { hasAccess: false };
            }
            
            const isMember = code.includes('MEMBER') || code.includes('VIP');
            const finalDurasi = isMember ? -1 : durasi;
            
            if (finalDurasi === -1) {
                return { hasAccess: true, label: 'Member Khusus (Bebas)', permanent: true };
            }
            
            const elapsedMinutes = (Date.now() - timestamp) / (1000 * 60);
            const remainingMinutes = Math.ceil(finalDurasi - elapsedMinutes);
            
            if (remainingMinutes > 0) {
                return { 
                    hasAccess: true, 
                    label: 'Akses Reguler (1 Jam)', 
                    remaining: remainingMinutes, 
                    permanent: false 
                };
            } else {
                localStorage.removeItem('museum_access_data');
                return { hasAccess: false };
            }
        } catch (e) {
            return { hasAccess: false };
        }
    }

    const status = checkAccessStatus();
    
    if (status.hasAccess) {
        if (overlay) overlay.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        if (accessInfo) {
            let infoText = `<i class="fa fa-check-circle"></i> Akses Aktif: <strong>${status.label}</strong>`;
            if (!status.permanent) {
                infoText += ` <span style="opacity: 0.8;">(Sisa: ${status.remaining} mnt)</span>`;
            }
            infoText += ` <span style="margin-left:10px; cursor:pointer; text-decoration:underline; font-size:0.85em;" onclick="logoutAccess()">[Keluar]</span>`;
            accessInfo.innerHTML = infoText;
            accessInfo.style.display = 'block';
        }
    } else {
        if (overlay) overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        if (accessInfo) accessInfo.style.display = 'none';
    }

    window.checkAccessCode = function() {
        const code = inputCode.value.trim().toUpperCase();
        console.log("🔑 Mencoba memasukkan kode:", code);

        if (VALID_CODES.includes(code)) {
            const isMember = code.includes('MEMBER') || code.includes('VIP');
            const durasi = isMember ? -1 : 60;
            const kategori = isMember ? 'Member Khusus' : 'Reguler';
            
            logAccess(code, kategori, durasi);
            
            localStorage.setItem('museum_access_data', JSON.stringify({ 
                code, 
                timestamp: Date.now(), 
                durasi 
            }));
            
            if (overlay) overlay.style.display = 'none';
            document.body.style.overflow = 'auto';
            
            let message = `✅ Berhasil! Kode "${code}" diterima.`;
            message += isMember 
                ? '\n\nAnda mendapatkan akses Member Khusus (Bebas tanpa batas waktu).' 
                : '\n\nDurasi akses: 60 menit (1 Jam).';
            alert(message);
            
            location.reload();
        } else {
            console.warn("❌ Kode DITOLAK. Daftar kode valid saat ini:", VALID_CODES);
            if (errorMsg) errorMsg.style.display = 'block';
            if (inputCode) inputCode.value = '';
        }
    };

    window.logoutAccess = function() {
        if (confirm('Yakin ingin mengakhiri akses? Anda harus memasukkan kode lagi untuk masuk kembali.')) {
            localStorage.removeItem('museum_access_data');
            location.reload();
        }
    };
});
