// assets/js/soft_paywall.js

document.addEventListener("DOMContentLoaded", function() {
    // Ambil elemen-elemen dari HTML
    const overlay = document.getElementById('paywall-overlay');
    const inputCode = document.getElementById('accessCode');
    const errorMsg = document.getElementById('error-msg');

    // Cek apakah pengguna sudah pernah membuka akses sebelumnya
    const hasAccess = localStorage.getItem('museum_access_granted');
    
    if (hasAccess === 'true') {
        // Jika sudah punya akses, sembunyikan overlay dan izinkan scroll
        if (overlay) overlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    } else {
        // Jika belum, tampilkan overlay dan kunci scroll halaman
        if (overlay) overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    // Fungsi untuk memeriksa kode (ditempel ke window agar bisa dipanggil oleh onclick di HTML)
    window.checkAccessCode = function() {
        const code = inputCode.value.trim().toUpperCase();
        
        // GANTI 'NGERA2026' dengan kode rahasia yang Anda berikan via WhatsApp
        const secretCode = 'NGERA2026'; 

        if (code === secretCode) {
            // Simpan status akses di browser pengguna
            localStorage.setItem('museum_access_granted', 'true');
            
            // Sembunyikan overlay dan kembalikan fungsi scroll
            if (overlay) overlay.style.display = 'none';
            document.body.style.overflow = 'auto';
            
            alert('Terima kasih atas dukungan Anda! Akses ke halaman koleksi telah dibuka.');
        } else {
            // Tampilkan pesan error jika kode salah
            if (errorMsg) errorMsg.style.display = 'block';
            if (inputCode) inputCode.value = ''; // Kosongkan input
        }
    };
});