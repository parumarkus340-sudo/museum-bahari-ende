/* ==========================================================================
   CHAT WIDGET - MUSEUM BAHARI ENDE
   File: container_widget.js
   ========================================================================== */

(function() {
    'use strict';

    // Tunggu DOM selesai dimuat
    document.addEventListener('DOMContentLoaded', function() {
        
        // === 1. AMBIL SEMUA ELEMEN ===
        const chatToggle = document.getElementById('chatToggle');
        const chatClose = document.getElementById('chatClose');
        const chatBox = document.getElementById('chatBox');
        const chatMessages = document.getElementById('chatMessages');
        const chatInput = document.getElementById('chatInput');
        const chatSend = document.getElementById('chatSend');
        const quickReplies = document.querySelectorAll('.quick-reply-btn');
        const chatBadge = document.querySelector('.chat-badge');

        // Jika elemen tidak ada di halaman, hentikan eksekusi
        if (!chatToggle || !chatBox) {
            console.log('Chat widget tidak ditemukan di halaman ini.');
            return;
        }

        // === 2. KONFIGURASI (GANTI SESUAI KEBUTUHAN) ===
        const CONFIG = {
            whatsappNumber: '6281338607300', // Ganti dengan nomor WA Anda
            museumName: 'Museum Bahari Ende - Ngera Shells',
            jamBuka: '• Senin - Jumat: 08.00 - 16.00 WITA<br>• Sabtu - Minggu: 09.00 - 17.00 WITA<br>• Hari Libur Nasional: Tutup',
            hargaTiket: '• Dewasa: Rp 10.000<br>• Anak-anak: Rp 5.000<br>• Pelajar (dengan kartu): Rp 7.000<br>• Wisatawan Asing: Rp 25.000',
            lokasi: 'Jalan Soekarno, Kelurahan Kota Raja, Kecamatan Ende Selatan, Kabupaten Ende, NTT.',
            typingDelay: 1200 // Delay "sedang mengetik" dalam milidetik
        };

        // === 3. FUNGSI BUKA/TUTUP CHAT ===
        chatToggle.addEventListener('click', function() {
            chatBox.classList.add('active');
            if (chatBadge) chatBadge.style.display = 'none';
            setTimeout(function() { chatInput.focus(); }, 350);
        });

        chatClose.addEventListener('click', function() {
            chatBox.classList.remove('active');
        });

        // Tutup chat saat klik di luar (opsional)
        document.addEventListener('click', function(e) {
            if (!chatBox.contains(e.target) && !chatToggle.contains(e.target)) {
                if (chatBox.classList.contains('active')) {
                    chatBox.classList.remove('active');
                }
            }
        });

        // === 4. FUNGSI TAMBAH PESAN ===
        function addMessage(text, sender) {
            const msg = document.createElement('div');
            msg.className = 'message ' + sender + '-message';
            const now = new Date();
            const time = now.getHours().toString().padStart(2, '0') + ':' + 
                         now.getMinutes().toString().padStart(2, '0');
            msg.innerHTML = '<div class="message-bubble"><p>' + text + 
                           '</p><span class="message-time">' + time + '</span></div>';
            chatMessages.appendChild(msg);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        // === 5. TYPING INDICATOR ===
        function showTyping() {
            const typing = document.createElement('div');
            typing.className = 'message bot-message';
            typing.id = 'typingIndicator';
            typing.innerHTML = '<div class="message-bubble"><div class="typing-indicator"><span></span><span></span><span></span></div></div>';
            chatMessages.appendChild(typing);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        function hideTyping() {
            const typing = document.getElementById('typingIndicator');
            if (typing) typing.remove();
        }

        // === 6. AUTO-RESPONSE BOT ===
        function getBotResponse(userText) {
            const text = userText.toLowerCase();
            
            if (text.includes('jam') || text.includes('buka')) {
                return '🕐 <strong>Jam Operasional Museum:</strong><br>' + CONFIG.jamBuka;
            } else if (text.includes('tiket') || text.includes('harga') || text.includes('biaya')) {
                return '🎫 <strong>Harga Tiket Masuk:</strong><br>' + CONFIG.hargaTiket;
            } else if (text.includes('lokasi') || text.includes('alamat') || text.includes('dimana')) {
                return '📍 <strong>Lokasi Museum:</strong><br>' + CONFIG.lokasi + 
                       '<br><a href="index_map.html" style="color:#b8860b;font-weight:600;">Lihat Peta Lokasi →</a>';
            } else if (text.includes('koleksi') || text.includes('spesies') || text.includes('kerang')) {
                return '🐚 Museum kami memiliki <strong>750+ spesies biota laut</strong> dari 7 kategori utama: Mollusca, Pisces, Crustacea, Echinodermata, Reptilia, Alga, dan Coral. Termasuk fosil Ammonite jutaan tahun dan Kima Raksasa!<br><a href="koleksi.html" style="color:#b8860b;font-weight:600;">Lihat Katalog Koleksi →</a>';
            } else if (text.includes('admin') || text.includes('cs') || text.includes('orang') || text.includes('kontak')) {
                return '💬 Tentu! Saya akan sambungkan Anda ke admin kami via WhatsApp. Silakan klik tombol di bawah:';
            } else if (text.includes('halo') || text.includes('hai') || text.includes('hi') || text.includes('selamat')) {
                return 'Halo juga! 👋 Senang bertemu dengan Anda. Ada yang bisa kami bantu terkait ' + CONFIG.museumName + '?';
            } else if (text.includes('terima kasih') || text.includes('makasih') || text.includes('thanks')) {
                return 'Sama-sama! 😊 Senang bisa membantu. Jangan ragu bertanya lagi ya. Selamat menjelajahi museum kami!';
            } else if (text.includes('donasi') || text.includes('sumbang')) {
                return '🤝 Terima kasih atas niat baik Anda! Untuk informasi donasi, silakan hubungi admin kami via WhatsApp. Setiap dukungan sangat berarti bagi pelestarian warisan bahari kami.';
            } else if (text.includes('sejarah') || text.includes('pater')) {
                return '📜 Museum Bahari Ende didirikan oleh <strong>Alm. Pater Gabriel Goran, SVD</strong> pada tahun 1996, berawal dari koleksi pribadi sejak 1981. Kini dilanjutkan oleh Bapak Kalianus Nusa Nipa.<br><a href="about.html" style="color:#b8860b;font-weight:600;">Baca Sejarah Lengkap →</a>';
            } else {
                return 'Terima kasih atas pesan Anda. Untuk jawaban lebih cepat dan detail, silakan hubungi admin kami langsung via WhatsApp. Kami siap membantu! 💬';
            }
        }

        // === 7. FUNGSI KIRIM PESAN ===
        function sendMessage() {
            const text = chatInput.value.trim();
            if (!text) return;
            
            addMessage(text, 'user');
            chatInput.value = '';
            showTyping();
            
            setTimeout(function() {
                hideTyping();
                const response = getBotResponse(text);
                addMessage(response, 'bot');
                
                // Tampilkan tombol WhatsApp jika user minta admin
                if (text.toLowerCase().includes('admin') || 
                    text.toLowerCase().includes('cs') || 
                    text.toLowerCase().includes('kontak')) {
                    setTimeout(showWhatsAppButton, 500);
                }
            }, CONFIG.typingDelay);
        }

        // === 8. TOMBOL WHATSAPP ===
        function showWhatsAppButton() {
            const waBtn = document.createElement('div');
            waBtn.className = 'message bot-message';
            const waLink = 'https://wa.me/' + CONFIG.whatsappNumber + 
                          '?text=Halo,%20saya%20ingin%20bertanya%20tentang%20' + 
                          encodeURIComponent(CONFIG.museumName);
            waBtn.innerHTML = '<a href="' + waLink + '" target="_blank" style="display:inline-block;background:#25D366;color:#fff;padding:10px 18px;border-radius:25px;text-decoration:none;font-weight:600;font-size:13px;"><i class="fa fa-whatsapp"></i> Lanjut ke WhatsApp</a>';
            chatMessages.appendChild(waBtn);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        // === 9. EVENT LISTENER ===
        chatSend.addEventListener('click', sendMessage);
        
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
            }
        });

        // === 10. QUICK REPLIES ===
        quickReplies.forEach(function(btn) {
            btn.addEventListener('click', function() {
                const question = this.getAttribute('data-question');
                const label = this.textContent;
                
                addMessage(label, 'user');
                showTyping();
                
                setTimeout(function() {
                    hideTyping();
                    const response = getBotResponse(question);
                    addMessage(response, 'bot');
                    
                    if (question === 'admin') {
                        setTimeout(showWhatsAppButton, 500);
                    }
                }, 1000);
            });
        });

        // === 11. NOTIFIKASI AWAL (OPSIONAL) ===
        // Tampilkan notifikasi sambutan setelah 3 detik
        setTimeout(function() {
            if (!chatBox.classList.contains('active') && chatBadge) {
                chatBadge.style.display = 'flex';
            }
        }, 3000);

        console.log('✅ Chat Widget Museum Bahari Ende berhasil dimuat.');
    });
})();