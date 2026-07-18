// assets/js/soft_paywall.js - VERSI CSV (Lebih Reliable)

const SHEET_ID = '14Yjote6VXC0LB65Sd_ZcgXdUE0kVexQFNhO_lbGhYVs';
const SHEET_NAME = 'Kode';

// URL format CSV - lebih sederhana dan reliable
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0&sheet=${encodeURIComponent(SHEET_NAME)}`;

const FALLBACK_CODES = ['DEWASA10', 'ANAK5', 'PELAJAR7', 'WNA25', 'MEMBERVIP'];
let VALID_CODES = [];

async function loadValidCodes() {
    try {
        console.log("🔄 Mengambil data dari Google Sheet (format CSV)...");
        
        const response = await fetch(SHEET_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }
        
        const text = await response.text();
        console.log("📦 Raw CSV Data:", text);
        
        // Parse CSV sederhana - setiap baris adalah 1 kode
        const lines = text.split('\n');
        const codes = [];
        
        lines.forEach((line, index) => {
            // Bersihkan baris dari kutip, koma, spasi, dan karakter baru
            const cleanLine = line.replace(/["\r]/g, '').trim().toUpperCase();
            
            // Abaikan baris kosong dan header "KODE"
            if (cleanLine && cleanLine !== 'KODE' && index > 0) {
                codes.push(cleanLine);
            }
        });
        
        console.log("✅ BERHASIL! Daftar kode:", codes);
        return codes;
    } catch (e) {
        console.error("❌ GAGAL:", e.message);
        console.warn("⚠️ Menggunakan kode cadangan:", FALLBACK_CODES);
        return FALLBACK_CODES;
    }
}

document.addEventListener("DOMContentLoaded", async function() {
    VALID_CODES = await loadValidCodes();
    console.log("📋 Kode yang diizinkan:", VALID_CODES);
    
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
                return { hasAccess: true, label: 'Akses Reguler (1 Jam)', remaining: remainingMinutes, permanent: false };
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
            if (!status.permanent) infoText += ` <span style="opacity: 0.8;">(Sisa: ${status.remaining} menit)</span>`;
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
        console.log("🔑 Mencoba kode:", code);

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
            console.warn("❌ Kode ditolak. Daftar valid:", VALID_CODES);
            if (errorMsg) errorMsg.style.display = 'block';
            if (inputCode) inputCode.value = '';
        }
    };

    window.logoutAccess = function() {
        if (confirm('Yakin ingin mengakhiri akses?')) {
            localStorage.removeItem('museum_access_data');
            location.reload();
        }
    };
});
