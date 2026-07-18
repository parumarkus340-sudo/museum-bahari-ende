// assets/js/soft_paywall.js (VERSI FINAL & ANTI-GAGAL)

const SHEET_ID = '14Yjote6VXC0LB65Sd_ZcgXdUE0kVexQFNhO_lbGhYVs';
const SHEET_NAME = 'Kode';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;

// Kode cadangan jika Google Sheet benar-benar down
const FALLBACK_CODES = ['DEWASA10', 'ANAK5', 'PELAJAR7', 'WNA25', 'MEMBERVIP'];
let VALID_CODES = [];

async function loadValidCodes() {
    try {
        console.log("🔄 Mengambil data dari Google Sheet (Format JSON)...");
        const response = await fetch(SHEET_URL);
        
        if (!response.ok) {
            throw new Error(`Gagal terhubung. Status: ${response.status}`);
        }
        
        const text = await response.text();
        // Bersihkan bungkus JSONP dari Google agar menjadi JSON murni
        const jsonString = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
        const data = JSON.parse(jsonString);
        
        const rows = data.table.rows;
        const codes = [];
        
        rows.forEach((row, index) => {
            const cells = row.c;
            if (!cells) return;
            
            // Ambil Kolom A (index 0) untuk Kode
            const kode = cells[0]?.v?.toString().trim().toUpperCase();
            // Ambil Kolom F (index 5) untuk Status
            const status = cells[5]?.v?.toString().trim().toLowerCase();
            
            // Abaikan baris header ("KODE") dan hanya ambil yang statusnya "aktif"
            if (kode && kode !== 'KODE' && (status === 'aktif' || status === undefined)) {
                codes.push(kode);
            }
        });
        
        console.log("✅ BERHASIL! Daftar kode yang valid dari Sheet:", codes);
        return codes;
    } catch (error) {
        console.error("❌ Gagal mengambil dari Google Sheet:", error);
        console.warn("⚠️ Menggunakan kode cadangan (Fallback).");
        return FALLBACK_CODES;
    }
}

document.addEventListener("DOMContentLoaded", async function() {
    // 1. Muat kode dari Sheet terlebih dahulu
    VALID_CODES = await loadValidCodes();
    console.log("📋 Sistem siap. Kode yang diizinkan saat ini:", VALID_CODES);
    
    const overlay = document.getElementById('paywall-overlay');
    const inputCode = document.getElementById('accessCode');
    const errorMsg = document.getElementById('error-msg');
    const accessInfo = document.getElementById('access-info');

    // 2. Fungsi cek status akses
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
            
            const isMember = code.includes('MEMBER') || code.includes('VIP');
            const finalDurasi = isMember ? -1 : durasi;
            
            if (finalDurasi === -1) {
                return { hasAccess: true, label: 'Member Khusus (Bebas)', permanent: true };
            }
            
            const elapsedMinutes = (Date.now() - timestamp) / (1000 * 60);
            const remainingMinutes = Math.ceil(finalDurasi - elapsedMinutes);
            
            if (remainingMinutes > 0) {
                return { hasAccess: true, label: 'Akses Reguler (1 Jam)', remaining: remainingMinutes, permanent: false };
            } else {
                localStorage.removeItem('museum_access_data');
                return { hasAccess: false };
            }
        } catch (e) {
            return { hasAccess: false };
        }
    }

    // 3. Eksekusi saat halaman dimuat
    const status = checkAccessStatus();
    
    if (status.hasAccess) {
        if (overlay) overlay.style.display = 'none';
        document.body.style.overflow = 'auto';
        if (accessInfo) {
            let infoText = `<i class="fa fa-check-circle"></i> Akses Aktif: <strong>${status.label}</strong>`;
            if (!status.permanent) infoText += ` <span style="opacity: 0.8;">(Sisa: ${status.remaining} mnt)</span>`;
            infoText += ` <span style="margin-left:10px; cursor:pointer; text-decoration:underline; font-size:0.85em;" onclick="logoutAccess()">[Keluar]</span>`;
            accessInfo.innerHTML = infoText;
            accessInfo.style.display = 'block';
        }
    } else {
        if (overlay) overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        if (accessInfo) accessInfo.style.display = 'none';
    }

    // 4. Fungsi saat tombol "Aktifkan Akses" diklik
    window.checkAccessCode = function() {
        const code = inputCode.value.trim().toUpperCase();
        console.log("🔑 Mencoba memasukkan kode:", code);

        if (VALID_CODES.includes(code)) {
            const isMember = code.includes('MEMBER') || code.includes('VIP');
            const durasi = isMember ? -1 : 60;
            
            localStorage.setItem('museum_access_data', JSON.stringify({ code, timestamp: Date.now(), durasi }));
            
            if (overlay) overlay.style.display = 'none';
            document.body.style.overflow = 'auto';
            
            let message = `✅ Berhasil! Kode "${code}" diterima.`;
            message += isMember ? '\n\nAnda mendapatkan akses Member Khusus (Bebas).' : '\n\nDurasi akses: 60 menit (1 Jam).';
            alert(message);
            location.reload();
        } else {
            console.warn("❌ Kode DITOLAK. Daftar kode valid saat ini:", VALID_CODES);
            if (errorMsg) errorMsg.style.display = 'block';
            if (inputCode) inputCode.value = '';
        }
    };

    // 5. Fungsi logout
    window.logoutAccess = function() {
        if (confirm('Yakin ingin mengakhiri akses?')) {
            localStorage.removeItem('museum_access_data');
            location.reload();
        }
    };
});
