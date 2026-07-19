// ============================================================
// MUSEUM BAHARI ENDE - NGera Shells
// File: soft_paywall.js (VERSI FIREBASE - Stabil & Cepat)
// ============================================================
// 1. TEMPEL KONFIGURASI FIREBASE ANDA DI SINI
const firebaseConfig = {
  apiKey: "AIzaSyC7hlKKSsqxO9pBMKU_vvRPo6uDbfMYX8g",
  authDomain: "website-museum.firebaseapp.com",
  projectId: "website-museum",
  storageBucket: "website-museum.firebasestorage.app",
  messagingSenderId: "1083931496533",
  appId: "1:1083931496533:web:5116fc4eb57c010f5684dc",
  measurementId: "G-C69FK266K4"
};

// 2. Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Konfigurasi Sheet (Hanya untuk membaca kode akses, tidak untuk menulis log lagi)
const SHEET_ID = '14Yjote6VXC0LB65Sd_ZcgXdUE0kVexQFNhO_lbGhYVs';
const SHEET_NAME = 'Kode';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;
const FALLBACK_CODES = ['DEWASA10', 'ANAK5', 'PELAJAR7', 'WNA25', 'MEMBERVIP'];
let VALID_CODES = [];

// ============================================================
// FUNGSI: LOG STATISTIK KE FIREBASE (SANGAT MUDAH & STABIL)
// ============================================================
async function logAccess(code, kategori, durasi) {
    console.log("📊 Mencatat statistik ke Firebase...");
    try {
        await db.collection("log_akses").add({
            kode: code,
            kategori: kategori,
            durasi: durasi,
            waktu: firebase.firestore.FieldValue.serverTimestamp(), // Waktu otomatis dari server
            device: navigator.userAgent.substring(0, 60)
        });
        console.log("✅ BERHASIL! Data tercatat di Firebase Firestore.");
    } catch (error) {
        console.error("❌ Gagal mencatat ke Firebase:", error);
    }
}

// ============================================================
// FUNGSI: AMBIL DAFTAR KODE DARI GOOGLE SHEET (Hanya Baca)
// ============================================================
function isHeaderRow(cells) {
    if (!cells || !cells[0] || !cells[0].v) return false;
    const firstCell = cells[0].v.toString().trim().toUpperCase();
    return ['KODE', 'CODE', 'NAMA', 'NO', 'ID', 'TIMESTAMP'].includes(firstCell);
}

async function loadValidCodes() {
    try {
        const response = await fetch(SHEET_URL);
        if (!response.ok) throw new Error(`Status: ${response.status}`);
        
        const text = await response.text();
        const jsonString = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
        const data = JSON.parse(jsonString);
        
        const rows = data.table.rows;
        const codes = [];
        let startIndex = 0;
        
        if (rows.length > 0 && isHeaderRow(rows[0].c)) startIndex = 1;
        
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
        return codes;
    } catch (error) {
        console.warn("⚠️ Gagal baca Sheet, pakai fallback.");
        return FALLBACK_CODES;
    }
}

// ============================================================
// LOGIKA PAYWALL UTAMA
// ============================================================
document.addEventListener("DOMContentLoaded", async function() {
    VALID_CODES = await loadValidCodes();
    
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
            
            if (finalDurasi === -1) return { hasAccess: true, label: 'Member Khusus (Bebas)', permanent: true };
            
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

    window.checkAccessCode = function() {
        const code = inputCode.value.trim().toUpperCase();

        if (VALID_CODES.includes(code)) {
            const isMember = code.includes('MEMBER') || code.includes('VIP');
            const durasi = isMember ? -1 : 60;
            const kategori = isMember ? 'Member Khusus' : 'Reguler';
            
            // 🔥 PANGGIL FUNGSI LOG FIREBASE DI SINI
            logAccess(code, kategori, durasi);
            
            localStorage.setItem('museum_access_data', JSON.stringify({ code, timestamp: Date.now(), durasi }));
            
            if (overlay) overlay.style.display = 'none';
            document.body.style.overflow = 'auto';
            
            alert(`✅ Berhasil! Kode "${code}" diterima.\nDurasi: ${isMember ? 'Permanen' : '60 Menit'}`);
            location.reload();
        } else {
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
