function sendQuickPrompt(text) {
    document.getElementById('userInput').value = text;
    sendMessage();
}

function handleKeyPress(e) { 
    if (e.key === 'Enter') {
        e.preventDefault(); // Mencegah enter membuat baris baru di mobile
        sendMessage(); 
    }
}

async function sendMessage(hiddenPrompt = null) {
    const userInputEl = document.getElementById('userInput');
    let text = typeof hiddenPrompt === 'string' ? hiddenPrompt : userInputEl.value.trim();
    
    // Jangan kirim kalau kosong
    if (!text && !window.selectedImageBase64) return;
    
    // Jika ada gambar tapi tidak ada teks
    if (!text && window.selectedImageBase64) text = "Tolong analisis gambar ini.";

    // Render pesan user di layar (Hanya jika ini bukan pancingan otomatis dari GPS)
    if (typeof hiddenPrompt !== 'string') {
        const displayMsg = window.selectedImageBase64 ? `📷 [Gambar Terlampir] <br> ${text}` : text;
        addMessageToUI(displayMsg, 'user-message');
        
        userInputEl.value = '';
        userInputEl.blur(); // 🔥 FIX MOBILE: Tutup keyboard setelah kirim agar layar tidak sesak
    }

    const cityOverrideElement = document.getElementById('cityOverride');
    const cityOverrideValue = cityOverrideElement ? cityOverrideElement.value.trim() : "";

    const requestData = {
        message: text,
        lat: window.userLat,
        lon: window.userLon,
        cityOverride: cityOverrideValue,
        systemInstruction: document.getElementById('systemPrompt').value,
        imageBase64: window.selectedImageBase64,
        mimeType: window.selectedImageMimeType
    };

    // Bersihkan gambar setelah pesan dikirim
    if (typeof hiddenPrompt !== 'string') {
        if(typeof removeImage === 'function') removeImage();
    }

    // Indikator Loading Keren
    const loadingId = addMessageToUI('<i class="fas fa-circle-notch fa-spin text-arbor"></i> Sedang menganalisis...', 'bot-message');

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });
        
        const data = await response.json();
        document.getElementById(loadingId).remove(); // Hapus indikator loading
        
        if(data.reply) {
            addMessageToUI(formatBotReply(data.reply), 'bot-message'); 
        } else {
            addMessageToUI('Maaf, ada gangguan pada sistem respon AI.', 'bot-message');
        }

    } catch (error) {
        document.getElementById(loadingId).remove();
        addMessageToUI('Maaf, komunikasi dengan server ArborGuard terputus.', 'bot-message');
    }
}