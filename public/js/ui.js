// State Global
window.selectedImageBase64 = null;
window.selectedImageMimeType = null;

function switchTab(tabId, btnElement) {
    document.querySelectorAll('.slide').forEach(slide => {
        slide.classList.remove('active');
        slide.classList.add('hidden'); // Tailwind hidden
    });
    
    const activeSlide = document.getElementById(tabId);
    activeSlide.classList.remove('hidden');
    activeSlide.classList.add('active'); 
    
    if(btnElement) {
        document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
        btnElement.classList.add('active');
    }

    if(tabId === 'slide-trees' && typeof loadTrees === 'function') {
        loadTrees();
    }
}

// Fitur Multimodal Image Preview (Cocok dengan Tailwind)
function previewImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('imagePreview').src = e.target.result;
            document.getElementById('imagePreviewContainerWrapper').classList.remove('hidden');
            
            window.selectedImageBase64 = e.target.result.split(',')[1];
            window.selectedImageMimeType = file.type;
            
            scrollToBottom(); // Geser layar ke bawah agar gambar terlihat
        }
        reader.readAsDataURL(file);
    }
}

function removeImage() {
    window.selectedImageBase64 = null;
    window.selectedImageMimeType = null;
    document.getElementById('fileInput').value = '';
    document.getElementById('imagePreviewContainerWrapper').classList.add('hidden');
}

// Menambahkan Gelembung Chat ke Layar
function addMessageToUI(text, sender) {
    const chatRoom = document.getElementById('chatRoom');
    const div = document.createElement('div');
    div.className = `message ${sender}`; 
    
    const id = 'msg-' + Date.now();
    div.id = id;
    
    const avatar = sender === 'bot-message' 
        ? '<div class="avatar"><i class="fas fa-robot"></i></div>' 
        : '<div class="avatar"><i class="fas fa-user"></i></div>'; 
    
    div.innerHTML = `${avatar}<div class="text">${text}</div>`;
    chatRoom.appendChild(div);
    
    scrollToBottom();
    return id;
}

// Format teks Gemini (Markdown) menjadi HTML rapi
function formatBotReply(text) {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
               .replace(/\*(.*?)\n/g, '<br>• $1')
               .replace(/\n/g, '<br>');
}

// Fungsi Auto-Scroll
function scrollToBottom() {
    const chatRoom = document.getElementById('chatRoom');
    chatRoom.scrollTop = chatRoom.scrollHeight;
}

// 🔥 FIX KEYBOARD HP: Saat kolom chat disentuh, tunggu sebentar lalu scroll ke bawah!
document.addEventListener("DOMContentLoaded", () => {
    const userInput = document.getElementById('userInput');
    if(userInput) {
        userInput.addEventListener('focus', () => {
            setTimeout(scrollToBottom, 300); // Jeda 300ms menunggu animasi keyboard HP selesai
        });
    }
});