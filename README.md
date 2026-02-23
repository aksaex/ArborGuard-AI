# ArborGuard AI

**Smart Botany Consultant & Tree Conservation Educator in Indonesia**

<img width="1920" height="1080" alt="{2209F4BE-B6B6-4F94-B5E7-BFB97ABD608E}" src="https://github.com/user-attachments/assets/915dc073-0176-4bb8-9bbe-ae17da610748" />


## 📖 About the Project

**ArborGuard AI** is an intelligent, multimodal web application designed to act as a virtual botanist and conservation educator. Its primary goal is to help users identify tree diseases, provide actionable care recommendations, and educate the public about protected flora in Indonesia.

This project was developed to bridge the gap in accessible botanical expertise. By integrating advanced Large Language Models (LLM) with real-time environmental data, ArborGuard AI doesn't just answer questions—it analyzes uploaded images of sick plants and gives tailored advice based on the user's current local weather conditions.

Built with a mobile-first approach, the application features a modern, App-like interface utilizing **Tailwind CSS**, **Vanilla JavaScript modules**, and a **robust Node.js** Serverless backend.

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Frontend UI** | HTML5 & Tailwind CSS | Mobile-first, responsive, and modern App-like styling |
| **Frontend Logic** | Vanilla JavaScript | Modular architecture (`ui.js`, `api.js`, `chat.js`, `location.js`) |
| **Backend** | Node.js & Express.js | API routing and server logic |
| **AI Engine** | Google Gemini 2.5 Flash | Multimodal AI for text and image analysis (`@google/genai`) |
| **External API** | OpenWeatherMap API | Real-time climate & weather context injection |
| **Database** | PostgreSQL (Neon) | Serverless SQL database for storing tree data |
| **Image Storage** | Cloudinary & Multer | Automatic image hosting & buffer processing |
| **Deployment** | Vercel | Serverless Functions & Static UI hosting with Anti-Cache config |

## ✨ Main Features

### 🌍 For Users (Public)
* **Smart AI Chatbot:** Interact with ArborGuard, a custom-prompted AI persona expert in botany and conservation.
* **Multimodal Vision Analysis:** Users can upload images of sick leaves or trees, and the AI will diagnose the visual symptoms (Healthy, Needs Care, or Critical).
* **Location-Aware Climate Context (Hybrid GPS):** Automatically detects user location via GPS (or manual city input) to fetch real-time weather data. The AI uses this data to adjust its watering and care recommendations (e.g., "Since it's 32°C in Makassar, water the plant twice today").
* **Protected Trees Gallery:** A dynamic gallery showcasing endangered Indonesian trees, fetched directly from the database with smooth Skeleton Loader UI.
* **App-Like Mobile Experience:** Bottom navigation bar, safe-area handling, and auto-scrolling chat that intelligently avoids mobile virtual keyboards.

### 🛡️ Admin Dashboard (Protected)
* **Secure Portal:** Password-protected admin login system via environment variables.
* **CRUD Tree Management:** Admins can effortlessly Post (with high-res image uploads), Edit, and Delete protected tree data.
* **Real-time Synchronization:** Built-in Vercel Anti-Cache headers ensure that any database modifications are instantly reflected on the public gallery without manual refreshing.
