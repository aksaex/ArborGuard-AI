// ==========================================
// 1. NAVIGASI BOTTOM TABS (SLIDE)
// ==========================================
function switchTab(tabId, btnElement) {
    // Sembunyikan semua slide
    document.querySelectorAll('.slide').forEach(slide => slide.classList.remove('active'));
    // Tampilkan slide yang dipilih
    document.getElementById(tabId).classList.add('active');
    
    // Ubah warna tombol navigasi yang aktif
    if(btnElement) {
        document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
        btnElement.classList.add('active');
    }

    // Jika tab 'Pohon' dibuka, otomatis tarik data dari database Neon
    if(tabId === 'slide-trees') loadTrees();
}

// ==========================================
// 2. FETCH DATA POHON DARI DATABASE NEON (ANTI-CACHE)
// ==========================================
async function loadTrees() {
    const container = document.getElementById('treesContainer');
    try {
        // PERBAIKAN: Tambahkan { cache: 'no-store' } agar selalu mengambil data paling segar dari database!
        const res = await fetch('/api/trees', { cache: 'no-store' });
        const trees = await res.json();
        
        container.innerHTML = '';
        trees.forEach(tree => {
            // Kita batasi deskripsi agar tidak terlalu panjang di card
            let shortDesc = tree.description.length > 80 ? tree.description.substring(0, 80) + '...' : tree.description;
            container.innerHTML += `
                <div class="tree-card">
                    <img src="${tree.image_url}" alt="${tree.name}">
                    <div class="tree-card-info">
                        <h3>${tree.name}</h3>
                        <p>${shortDesc}</p>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        container.innerHTML = '<p style="padding:20px;">Gagal memuat ekosistem pohon dari database.</p>';
    }
}

// ==========================================
// 3. SMART LOCATION & WEATHER (HYBRID: MANUAL + GPS AKURASI TINGGI)
// ==========================================
let userLat = null;
let userLon = null;

function activateSmartLocation() {
    const btn = document.getElementById('btnLokasi');
    const cityInput = document.getElementById('cityOverride');
    
    if (navigator.geolocation) {
        btn.innerHTML = "<i class='fas fa-spinner fa-spin'></i>";
        
        // FITUR BARU: Memaksa browser mencari akurasi tertinggi (Satelit) bukan sekadar IP ISP
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLat = position.coords.latitude;
                userLon = position.coords.longitude;
                
                // Ubah tampilan UI jika GPS sukses
                if (cityInput) {
                    cityInput.value = ""; // Kosongkan input manual agar backend otomatis memakai GPS
                    cityInput.placeholder = "Satelit GPS Terkunci...";
                }
                
                btn.innerHTML = "<i class='fas fa-check'></i>";
                btn.style.background = "#4caf50";
                btn.title = "GPS Aktif";
                
                // Trigger/Pancing pesan otomatis ke AI tanpa ditampilkan ke layar user
                sendMessage("Tolong sapa saya secara ramah dan sebutkan cuaca di lokasi GPS saya saat ini. Jelaskan bagaimana cuaca tersebut dapat mempengaruhi perawatan tanaman hari ini.", true);
            },
            (error) => {
                // Jika gagal (karena tertutup awan, device tidak support, atau izin ditolak)
                alert("GPS meleset atau akses ditolak. Silakan ketik nama kota Anda (misal: Barru) secara manual di kolom lokasi.");
                btn.innerHTML = "<i class='fas fa-crosshairs'></i>";
            },
            // Parameter khusus untuk Akurasi Tinggi
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    } else {
        alert("Browser Anda tidak mendukung deteksi lokasi GPS.");
    }
}

// ==========================================
// 4. CHATBOT AI GEMINI (MULTIMODAL & KONTEKS)
// ==========================================
let selectedImageBase64 = null;
let selectedImageMimeType = null;

// Merapikan format teks balasan dari Gemini (Markdown ke HTML)
function formatBotReply(text) {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
               .replace(/\*(.*?)\n/g, '<br>• $1')
               .replace(/\n/g, '<br>');
}

// Fitur Preview Gambar
function previewImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('imagePreview').src = e.target.result;
            document.getElementById('imagePreviewContainer').style.display = 'flex';
            // Ambil base64 mentahnya
            selectedImageBase64 = e.target.result.split(',')[1];
            selectedImageMimeType = file.type;
        }
        reader.readAsDataURL(file);
    }
}

// Fitur Hapus Gambar
function removeImage() {
    selectedImageBase64 = null;
    selectedImageMimeType = null;
    document.getElementById('fileInput').value = '';
    document.getElementById('imagePreviewContainer').style.display = 'none';
}

// Fungsi Utama Mengirim Pesan
async function sendMessage(hiddenPrompt = null) {
    // Jika ada hiddenPrompt (dari GPS), gunakan itu. Jika tidak, ambil dari input user.
    let text = typeof hiddenPrompt === 'string' ? hiddenPrompt : document.getElementById('userInput').value.trim();
    
    // Validasi kosong
    if (!text && !selectedImageBase64) return;
    if (!text && selectedImageBase64) text = "Tolong analisis gambar pohon ini.";

    // Munculkan di layar HANYA JIKA ini pesan dari user (bukan pancingan GPS tersembunyi)
    if (typeof hiddenPrompt !== 'string') {
        const displayMsg = selectedImageBase64 ? `📷 [Gambar Terlampir] ${text}` : text;
        addMessageToUI(displayMsg, 'user-message');
    }

    // FITUR BARU: Ambil nilai kota manual dari input UI (jika user mengetiknya)
    const cityOverrideElement = document.getElementById('cityOverride');
    const cityOverrideValue = cityOverrideElement ? cityOverrideElement.value.trim() : "";

    const requestData = {
        message: text,
        lat: userLat,             // Koordinat GPS (jika tombol dilacak)
        lon: userLon,
        cityOverride: cityOverrideValue, // Kota Manual (jika diketik) -> Backend memprioritaskan ini!
        systemInstruction: document.getElementById('systemPrompt').value,
        imageBase64: selectedImageBase64,
        mimeType: selectedImageMimeType
    };

    // Bersihkan input dan preview (Hanya jika bukan auto-prompt dari sistem)
    if (typeof hiddenPrompt !== 'string') {
        document.getElementById('userInput').value = '';
        removeImage();
    }

    const loadingId = addMessageToUI('Menganalisis data lingkungan & botani...', 'bot-message');

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });
        
        const data = await response.json();
        document.getElementById(loadingId).remove(); // Hapus indikator loading
        addMessageToUI(formatBotReply(data.reply), 'bot-message'); // Tampilkan jawaban

    } catch (error) {
        document.getElementById(loadingId).remove();
        addMessageToUI('Maaf, komunikasi dengan satelit ArborGuard terputus.', 'bot-message');
    }
}

// Render Chat UI
function addMessageToUI(text, sender) {
    const chatRoom = document.getElementById('chatRoom');
    const div = document.createElement('div');
    div.classList.add('message', sender);
    
    const id = 'msg-' + Date.now();
    div.id = id;
    
    const avatar = sender === 'bot-message' 
        ? '<div class="avatar"><i class="fas fa-robot"></i></div>' 
        : '<div class="avatar" style="background:#1b5e20;"><i class="fas fa-user"></i></div>';
    
    div.innerHTML = `${avatar}<div class="text">${text}</div>`;
    chatRoom.appendChild(div);
    chatRoom.scrollTop = chatRoom.scrollHeight; // Auto scroll
    return id;
}

// Kirim dengan tombol Enter
function handleKeyPress(e) { 
    if (e.key === 'Enter') sendMessage(); 
}