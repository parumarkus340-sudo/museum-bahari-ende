/* ==========================================================================
   FITUR SALIN NOMOR REKENING - MUSEUM BAHARI ENDE
   File: rekening.js
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function() {
    // Ambil elemen tombol dan teks nomor rekening
    const copyBtn = document.querySelector('.copy-btn');
    const rekNumberEl = document.getElementById('rekNumber');

    // Pastikan elemen ada di halaman sebelum menambahkan event listener
    if (copyBtn && rekNumberEl) {
        copyBtn.addEventListener('click', function() {
            const rekText = rekNumberEl.innerText.trim();
            
            // Metode modern: Clipboard API (membutuhkan HTTPS atau localhost)
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(rekText).then(() => {
                    showSuccessFeedback();
                }).catch(err => {
                    console.error('Gagal menyalin via Clipboard API: ', err);
                    fallbackCopy(rekText);
                });
            } else {
                // Metode fallback untuk browser lama atau lingkungan non-HTTPS
                fallbackCopy(rekText);
            }
        });
    }

    /**
     * Fungsi untuk memberikan feedback visual bahwa teks berhasil disalin
     */
    function showSuccessFeedback() {
        const originalHTML = copyBtn.innerHTML;
        
        // Ubah tampilan tombol menjadi hijau
        copyBtn.innerHTML = '<i class="fa fa-check"></i> Tersalin!';
        copyBtn.style.background = '#25D366';
        copyBtn.style.color = '#fff';
        copyBtn.style.borderColor = '#25D366';

        // Kembalikan ke tampilan semula setelah 2 detik
        setTimeout(function() {
            copyBtn.innerHTML = originalHTML;
            copyBtn.style.background = '#f4f1ea';
            copyBtn.style.color = '#2c241b';
            copyBtn.style.borderColor = '#b8860b';
        }, 2000);
    }

    /**
     * Fungsi fallback menggunakan execCommand jika Clipboard API tidak didukung
     */
    function fallbackCopy(text) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px"; // Sembunyikan di luar layar
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand('copy');
            if (successful) {
                showSuccessFeedback();
            } else {
                alert("Gagal menyalin otomatis. Silakan salin manual: " + text);
            }
        } catch (err) {
            console.error('Fallback: Gagal menyalin', err);
            alert("Silakan salin manual: " + text);
        }

        // Hapus elemen textarea sementara
        document.body.removeChild(textArea);
    }
});