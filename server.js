const express = require('express');
const cors = require('cors');
require('dotenv').config();
const axios = require('axios');
const { GoogleGenAI } = require('@google/genai');
const { Pool } = require('pg');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

const app = express();

// Konfigurasi Express
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public'));

// Konfigurasi Database Neon (PostgreSQL)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Konfigurasi Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Konfigurasi Multer (Simpan file di memori sementara sebelum ke Cloudinary)
const upload = multer({ storage: multer.memoryStorage() });

// Konfigurasi Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ==========================================
// 1. SMART AI CHATBOT (Location-Aware Hybrid)
// ==========================================
app.post('/api/chat', async (req, res) => {
    try {
        // Menerima input cityOverride (Manual) dan lat/lon (GPS)
        const { message, lat, lon, cityOverride, systemInstruction, imageBase64, mimeType } = req.body;
        let envContext = "";

        // Tarik data cuaca berdasarkan prioritas: Manual -> GPS
        try {
            let weatherUrl = "";
            
            if (cityOverride) {
                weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${cityOverride}&appid=${process.env.WEATHER_API_KEY}&units=metric&lang=id`;
            } else if (lat && lon) {
                weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.WEATHER_API_KEY}&units=metric&lang=id`;
            }

            if (weatherUrl) {
                const weatherRes = await axios.get(weatherUrl);
                const data = weatherRes.data;
                const locName = data.name;
                const temp = data.main.temp;
                const desc = data.weather[0].description;
                const humidity = data.main.humidity;
                
                envContext = `[SISTEM - KONTEKS LINGKUNGAN PENGGUNA SAAT INI]: 
                Pengguna berada di ${locName}. Kondisi cuaca: ${desc}, Suhu: ${temp}°C, Kelembapan: ${humidity}%. 
                INSTRUKSI KHUSUS: Sapa pengguna dengan menyebutkan lokasi dan cuacanya secara alami, lalu berikan saran terkait dampak cuaca tersebut pada tanaman secara umum, baru setelah itu jawab pertanyaan/pernyataan mereka.\n\n`;
            }
        } catch (err) { 
            console.log("Gagal deteksi cuaca, lanjut ke respons AI standar."); 
        }

        const finalPrompt = envContext + "Pertanyaan/Pernyataan User: " + message;
        let contentsArray = [finalPrompt];
        
        if (imageBase64) {
            contentsArray.push({ inlineData: { data: imageBase64, mimeType: mimeType } });
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contentsArray,
            config: { 
                systemInstruction: systemInstruction || "Kamu adalah ArborGuard, pakar botani dan edukator konservasi.", 
                temperature: 0.7 
            }
        });

        res.json({ reply: response.text });
    } catch (error) { 
        console.error("Error AI:", error);
        res.status(500).json({ error: "Terjadi kesalahan pada AI ArborGuard." }); 
    }
});

// ==========================================
// 2. CRUD POHON & ADMIN SYSTEM
// ==========================================

// Middleware Cek Admin (Sistem Keamanan Anti-Crash)
const verifyAdmin = (req, res, next) => {
    // Cek Authorization header dulu, JIKA tidak ada baru cek req.body
    const pwd = req.headers.authorization || (req.body && req.body.password);

    if (pwd === process.env.ADMIN_PASSWORD) {
        next();
    } else {
        res.status(401).json({ error: 'Akses Ditolak. Password salah.' });
    }
};

// Endpoint Login Admin
app.post('/api/admin/login', (req, res) => {
    if (req.body.password === process.env.ADMIN_PASSWORD) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false });
    }
});

// GET: Ambil semua daftar pohon (Untuk Publik & Admin)
app.get('/api/trees', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM protected_trees ORDER BY id DESC');
        res.json(result.rows);
    } catch (error) {
        console.error("Error Get Trees:", error);
        res.status(500).json({ error: 'Gagal mengambil data pohon' });
    }
});

// POST: Tambah Pohon Baru (Hanya Admin)
app.post('/api/trees', upload.single('image'), verifyAdmin, async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!req.file) {
            return res.status(400).json({ error: 'Gambar wajib diunggah.' });
        }
        
        // Convert ke Data URI untuk Cloudinary
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
        
        const cldRes = await cloudinary.uploader.upload(dataURI, { folder: "arborguard" });
        const result = await pool.query('INSERT INTO protected_trees (name, description, image_url) VALUES ($1, $2, $3) RETURNING *', [name, description, cldRes.secure_url]);
        
        res.json({ success: true, tree: result.rows[0] });
    } catch (e) { 
        console.error("Error Upload:", e);
        res.status(500).json({ error: 'Gagal tambah pohon.' }); 
    }
});

// PUT: Edit Deskripsi & Nama Pohon (Hanya Admin)
app.put('/api/trees/:id', verifyAdmin, async (req, res) => {
    try {
        const { name, description } = req.body;
        await pool.query('UPDATE protected_trees SET name = $1, description = $2 WHERE id = $3', [name, description, req.params.id]);
        res.json({ success: true });
    } catch (e) { 
        console.error("Error Edit:", e);
        res.status(500).json({ error: 'Gagal edit pohon.' }); 
    }
});

// DELETE: Hapus Pohon (Hanya Admin)
app.delete('/api/trees/:id', verifyAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM protected_trees WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (e) { 
        console.error("Error Delete:", e);
        res.status(500).json({ error: 'Gagal hapus pohon.' }); 
    }
});

// ==========================================
// 3. EXPORT UNTUK VERCEL (Wajib!)
// ==========================================
module.exports = app;

// Agar tetap bisa dijalankan di lokal komputer kamu saat testing (node server.js)
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server ArborGuard (Pro Mode) berjalan di Port ${PORT}`);
    });
}