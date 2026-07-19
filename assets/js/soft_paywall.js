// ============================================================
// MUSEUM BAHARI ENDE - Ngera Shells
// File: soft_paywall.js (VERSI FINAL - Dengan Logging Lengkap)
// ============================================================

const SHEET_ID = '14Yjote6VXC0LB65Sd_ZcgXdUE0kVexQFNhO_lbGhYVs';
const SHEET_NAME = 'Kode';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;

// ⚠️ PENTING: URL harus berakhiran /exec (bukan /dev)
const SCRIPT_URL = 'https://script.google.com/a/macros/guru.sd.belajar.id/s/AKfycbyC6MwzG1kjz235hJQrHIhcp0B0BHdDIHcutImgZgE/exec';

const FALLBACK_CODES = ['DEWASA10', 'ANAK5', 'PELAJAR7', 'WNA25', 'MEMBERVIP'];
let VALID_CODES = [];

// ============================================================
// FUNGSI: Deteksi Header
// ============================================================
function isHeaderRow(cells) {
    if (!cells || !cells[0] || !cells[0].v) return false;
    const firstCell = cells[0].v.toString().trim().toUpperCase();
    const headerKeywords = ['KODE', 'CODE', 'NAMA', 'NO', 'NO.', 'NOMOR', 'ID', 'KEY', 'USERNAME', 'TIMESTAMP'];
    return headerKeywords.includes(firstCell);
}

// ============================================================
// FUNGSI: LOG STATISTIK (VERSI FINAL DENGAN DEBUG LENGKAP)
// ============================================================
async function logAccess(code, kategori, durasi) {
    console.log("=".repeat(60));
    console.log("📊 FUNGSI logAccess() DIPANGGIL");
    console.log("   Kode:", code);
    console.log("   Kategori:", kategori);
    console.log("   Durasi:", durasi);
    console.log("   SCRIPT_URL:", SCRIPT_URL);
    
    // Validasi URL
    if (!SCRIPT_URL || SCRIPT_URL === '') {
        console.error("❌ ERROR: SCRIPT_URL kosong!");
        console.log("=".repeat(60));
        return;
    }
    
    if (SCRIPT_URL.includes('/dev')) {
        console.error("❌ ERROR: URL masih /dev! Harus /exec agar bisa diakses pengunjung.");
        console.log("=".repeat(60));
        return;
    }
    
    if (SCRIPT_URL.includes('GANTI_DENGAN')) {
        console.error("❌ ERROR: URL belum diisi! Silakan update SCRIPT_URL.");
        console.log("=".repeat(60));
        return;
    }
    
    // Siapkan data
    const data = {
        timestamp: new Date().toISOString(),
        code: code,
        kategori: kategori,
        durasi: durasi,
        device: navigator.userAgent.substring(0, 100)
    };
    
    console.log("   Data yang akan dikirim:", JSON.stringify(data, null, 2));
    
    try {
        console.log("   Mengirim data ke Apps Script...");
        
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(data)
        });
        
        console.log("✅ BERHASIL! Data terkirim ke Apps Script (mode: no-cors)");
        console.log("   Silakan cek tab 'Statistik' di Google Sheet Anda.");
        console.log("=".repeat(60));
        
        // Tampilkan notifikasi visual (opsional)
        showNotification('✅ Statistik tercatat!', 'success');
        
    } catch (error) {
        console.error("❌ GAGAL mengirim data:", error);
        console.error("   Error message:", error.message);
        console.error("   Error name:", error.name);
        console.log("=".repeat(60));
        
        showNotification('❌ Gagal mencatat statistik', 'error');
    }
}

// ============================================================
// FUNGSI: Tampilkan Notifikasi Visual (Opsional)
// ============================================================
function showNotification(message, type = 'info') {
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6'
    };
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 999999;
        font-family: 'Exo', sans-serif;
        font-size: 0.9em;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
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

    // ========================================================
    // FUNGSI: SAAT TOMBOL "AKTIFKAN AKSES" DIKLIK
    // ========================================================
    window.checkAccessCode = function() {
        const code = inputCode.value.trim().toUpperCase();
        console.log("🔑 Tombol diklik. Mencoba memasukkan kode:", code);

        if (VALID_CODES.includes(code)) {
            console.log("✅ Kode VALID!");
            
            const isMember = code.includes('MEMBER') || code.includes('VIP');
            const durasi = isMember ? -1 : 60;
            const kategori = isMember ? 'Member Khusus' : 'Reguler';
            
            console.log("   Kategori:", kategori);
            console.log("   Durasi:", durasi);
            
            // PANGGIL logAccess() - INI YANG PENTING!
            console.log("📞 Memanggil fungsi logAccess()...");
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
