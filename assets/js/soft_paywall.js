// ============================================================
// MUSEUM BAHARI ENDE - NGera Shells
// File: soft_paywall.js (VERSI FINAL LENGKAP + LOG STATISTIK)
// ============================================================

// ============================================================
// KONFIGURASI
// ============================================================
const SHEET_ID = '14Yjote6VXC0LB65Sd_ZcgXdUE0kVexQFNhO_lbGhYVs';
const SHEET_NAME = 'Kode';
const SHEET_STATISTIK = 'Statistik';

// URL Google Sheet (untuk membaca kode akses)
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;

// ⚠️ PENTING: Ganti URL di bawah dengan URL Apps Script Anda
// Cara mendapatkannya: Buka Google Sheet → Extensions → Apps Script → Deploy → New deployment → Web app
const SCRIPT_URL = 'https://script.google.com/macros/s/GANTI_DENGAN_URL_APPS_SCRIPT_ANDA/exec';

// Kode cadangan jika Google Sheet offline/error
const FALLBACK_CODES = ['DEWASA10', 'ANAK5', 'PELAJAR7', 'WNA25', 'MEMBERVIP'];
let VALID_CODES = [];

// ============================================================
// FUNGSI: LOG STATISTIK AKSES KE GOOGLE SHEETS
// ============================================================
async function logAccess(code, kategori, durasi) {
    // Jika SCRIPT_URL belum di-set, skip logging
    if (SCRIPT_URL.includes('GANTI_DENGAN_URL_APPS_SCRIPT_ANDA')) {
        console.warn("⚠️ Logging dinonaktifkan. Setup Apps Script terlebih dahulu.");
        return;
    }
    
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
// FUNGSI: AMBIL DAFTAR KODE DARI GOOGLE SHEET
// ============================================================
async function loadValidCodes() {
    try {
        console.log("🚀 Mengambil data dari Google Sheet...");
        const response = await fetch(SHEET_URL);
        
        if (!response.ok) throw new Error(`Gagal terhubung. Status: ${response.status}`);
        
        const text = await response.text();
        // Bersihkan bungkus JSONP dari Google
        const jsonString = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
        const data = JSON.parse(jsonString);
        
        const rows = data.table.rows;
        const codes = [];
        
        rows.forEach((row) => {
            const cells = row.c;
            if (!cells) return;
            
            // Kolom A (index 0) = Kode
            const kode = cells[0]?.v?.toString().trim().toUpperCase();
            // Kolom F (index 5) = Status
            const status = cells[5]?.v?.toString().trim().toLowerCase();
            
            // Abaikan header "KODE" dan hanya ambil yang statusnya "aktif"
            if (kode && kode !== 'KODE' && (status === 'aktif' || status === undefined)) {
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
// FUNGSI UTAMA: DIJALANKAN SETELAH HALAMAN SIAP
// ============================================================
document.addEventListener("DOMContentLoaded", async function() {
    // 1. Muat kode dari Google Sheet
    VALID_CODES = await loadValidCodes();
    console.log("📋 Sistem siap. Kode yang diizinkan:", VALID_CODES);
    
    // 2. Ambil elemen-elemen dari HTML
    const overlay = document.getElementById('paywall-overlay');
    const inputCode = document.getElementById('accessCode');
    const errorMsg = document.getElementById('error-msg');
    const accessInfo = document.getElementById('access-info');

    // ========================================================
    // FUNGSI: CEK STATUS AKSES PENGGUNA
    // ========================================================
    function checkAccessStatus() {
        const storedData = localStorage.getItem('museum_access_data');
        if (!storedData) return { hasAccess: false };
        
        try {
            const data = JSON.parse(storedData);
            const { code, timestamp, durasi } = data;
            
            // Jika kode dihapus/dinonaktifkan di Sheet, akses otomatis dicabut
            if (!VALID_CODES.includes(code)) {
                localStorage.removeItem('museum_access_data');
                return { hasAccess: false };
            }
            
            // Kode mengandung MEMBER atau VIP = akses permanen
            const isMember = code.includes('MEMBER') || code.includes('VIP');
            const finalDurasi = isMember ? -1 : durasi;
            
            if (finalDurasi === -1) {
                return { hasAccess: true, label: 'Member Khusus (Bebas)', permanent: true };
            }
            
            // Cek sisa waktu untuk akses reguler
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
                // Waktu habis
                localStorage.removeItem('museum_access_data');
                return { hasAccess: false };
            }
        } catch (e) {
            return { hasAccess: false };
        }
    }

    // ========================================================
    // EKSEKUSI: CEK STATUS SAAT HALAMAN DIMUAT
    // ========================================================
    const status = checkAccessStatus();
    
    if (status.hasAccess) {
        // Pengguna sudah punya akses → sembunyikan overlay
        if (overlay) overlay.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Tampilkan badge akses aktif di pojok kanan atas
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
        // Pengguna belum punya akses → tampilkan overlay
        if (overlay) overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        if (accessInfo) accessInfo.style.display = 'none';
    }

    // ========================================================
    // FUNGSI: SAAT TOMBOL "AKTIFKAN AKSES" DIKLIK
    // ========================================================
    window.checkAccessCode = function() {
        const code = inputCode.value.trim().toUpperCase();
        console.log("🔑 Mencoba memasukkan kode:", code);

        if (VALID_CODES.includes(code)) {
            // Tentukan apakah Member atau Reguler
            const isMember = code.includes('MEMBER') || code.includes('VIP');
            const durasi = isMember ? -1 : 60;
            const kategori = isMember ? 'Member Khusus' : 'Reguler';
            
            // 📊 CATAT STATISTIK AKSES
            logAccess(code, kategori, durasi);
            
            // Simpan status akses ke localStorage
            localStorage.setItem('museum_access_data', JSON.stringify({ 
                code, 
                timestamp: Date.now(), 
                durasi 
            }));
            
            // Sembunyikan overlay
            if (overlay) overlay.style.display = 'none';
            document.body.style.overflow = 'auto';
            
            // Tampilkan pesan sukses
            let message = `✅ Berhasil! Kode "${code}" diterima.`;
            message += isMember 
                ? '\n\nAnda mendapatkan akses Member Khusus (Bebas tanpa batas waktu).' 
                : '\n\nDurasi akses: 60 menit (1 Jam).';
            alert(message);
            
            // Refresh halaman untuk menampilkan badge akses
            location.reload();
        } else {
            console.warn("❌ Kode DITOLAK. Daftar kode valid saat ini:", VALID_CODES);
            if (errorMsg) errorMsg.style.display = 'block';
            if (inputCode) inputCode.value = '';
        }
    };

    // ========================================================
    // FUNGSI: LOGOUT / KELUAR DARI AKSES
    // ========================================================
    window.logoutAccess = function() {
        if (confirm('Yakin ingin mengakhiri akses? Anda harus memasukkan kode lagi untuk masuk kembali.')) {
            localStorage.removeItem('museum_access_data');
            location.reload();
        }
    };
});