window.userLat = null;
window.userLon = null;

function activateSmartLocation() {
    const btn = document.getElementById('btnLokasi');
    const cityInput = document.getElementById('cityOverride');
    
    if (navigator.geolocation) {
        const originalIcon = btn.innerHTML;
        btn.innerHTML = "<i class='fas fa-spinner fa-spin text-lg'></i>";
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                window.userLat = position.coords.latitude;
                window.userLon = position.coords.longitude;
                
                if (cityInput) {
                    cityInput.value = ""; 
                    cityInput.placeholder = "Satelit GPS Terkunci";
                    cityInput.disabled = true; // Kunci input agar tidak diketik manual lagi
                    cityInput.classList.add('text-green-600', 'font-semibold');
                }
                
                btn.innerHTML = "<i class='fas fa-check text-lg'></i>";
                btn.classList.add('text-green-600');
                btn.title = "GPS Aktif";
                
                if(typeof sendMessage === 'function') {
                    // Pancingan tak terlihat agar AI menyapa duluan
                    sendMessage("Sapa saya secara ramah dan sebutkan cuaca di lokasi GPS saya saat ini. Berikan peringatan/saran perawatan tanaman secara ringkas.", true);
                }
            },
            (error) => {
                alert("GPS ditolak atau gagal. Silakan ketik nama kota Anda (Misal: Barru) secara manual.");
                btn.innerHTML = originalIcon;
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    } else {
        alert("Browser Anda tidak mendukung deteksi lokasi GPS.");
    }
}

// Logika Input Kota Manual
function handleCityEnter(e) {
    if (e.key === 'Enter') {
        const cityInput = document.getElementById('cityOverride');
        const city = cityInput.value.trim();
        
        if(city) {
            cityInput.blur(); // 🔥 FIX MOBILE: Paksa tutup keyboard HP agar layar kembali lega!
            
            // Reset koordinat GPS (karena user memilih pakai nama kota)
            window.userLat = null;
            window.userLon = null;

            alert('📍 Lokasi disetel ke: ' + city + '. \nAI akan menggunakan cuaca kota ini untuk analisis.');
            document.getElementById('userInput').focus(); // Otomatis pindahkan kursor ke kolom chat
        }
    }
}