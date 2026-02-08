<div align="center">
<img width="1200" height="475" alt="Botanica-AI Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# 🌿 Botanica AI
### *Your Proactive AI Orchard & Garden Companion*

[![Built with AI Studio](https://img.shields.io/badge/Built%20with-AI%20Studio-blue?style=for-the-badge)](https://ai.studio/apps/drive/1_3y7nzEZ8gusCQtoB7k_0PR3IucRUDUa)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-green?style=for-the-badge)](https://web.dev/progressive-web-apps/)

</div>

---

## 🌟 Project Vision
**Botanica AI** is a Progressive Web App (PWA) designed to revolutionize the way you manage your orchard or vegetable garden. It goes beyond simple tracking by introducing **Botanica**, a proactive AI agent that understands your plants' needs based on their type, your location, and visual health indicators.

## 🤖 Meet "Botanica" — Your Proactive Expert
Botanica isn't just a chatbot; it's a dedicated horticultural assistant:
- **📅 Proactive Management:** Automatically alerts you when it's time to prune determined species.
- **✂️ Grafting Optimization:** Identifies the perfect periods for successful grafts based on local conditions.
- **📸 Visual Diagnosis:** Analyze photos of your plants to identify diseases, nutrient deficiencies, or pests.
- **💬 Expertise on Demand:** Converse with Botanica to learn more about specific care techniques or garden history.

## 🚀 Key Features
- **📱 PWA Excellence:** Installable on mobile devices for a native app experience with offline potential.
- **📍 Location-Aware Care:** Tailors advice based on your specific geographic location and weather patterns.
- **🏡 Garden Management:** Easily log your plants, upload photos, and track their growth journey.
- **🛡️ Health Monitoring:** AI-driven health assessments via image recognition.

## 🛠️ Tech Stack
- **Core:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **AI Engine:** [Google Gemini AI](https://ai.google.dev/) (via `@google/genai`)
- **Backend & Auth:** [Supabase](https://supabase.com/) (Database, Authentication, Storage)
- **Documentation:** [Marked](https://marked.js.org/) (for rendering AI responses)

> [!IMPORTANT]
> **Supabase Shared Project Convention:**  
> Since the Supabase project is shared, all resources **MUST** be prefixed with `botanica_` to avoid conflicts:
> - **Tables:** `botanica_plants`, `botanica_tasks`, etc.
> - **Storage Buckets:** `botanica_images`, `botanica_assets`.

## ⚙️ Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (Latest LTS)
- A **Google Gemini API Key** (Obtain one at [Google AI Studio](https://aistudio.google.com/))
- A **Supabase Project** (URL and Anon Key)

### Steps
1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd Botanica-AI
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure Environment:**
   Create a `.env.local` file in the root and add your keys:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_key
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. **Run Development Server:**
   ```bash
   npm run dev
   ```

---

<div align="center">
Developed with ❤️ for urban farmers and orchard enthusiasts.
</div>
