# 🌾 Krishi Sakhi

**Krishi Sakhi AI** is an intelligent farming assistant application built for **Smart India Hackathon 2025**. It provides Kerala farmers with AI-powered agricultural guidance, weather insights, crop management advice, and personalized farming recommendations through an intuitive web interface.

---

## 🚀 Features

| Feature                    | Description                                                               |
| -------------------------- | ------------------------------------------------------------------------- |
| 🤖 **AI Chat Assistant**   | Interactive AI chatbot for farming queries powered by Google Gemini      |
| 🌦️ **Weather Integration** | Real-time weather data and forecasts for farming decisions               |
| 📱 **Mobile-First Design** | Responsive design optimized for mobile devices                           |
| 🗣️ **Voice Recognition**   | Speech-to-text input for hands-free interaction                          |
| 🔊 **Text-to-Speech**      | Audio responses in both English and Malayalam                            |
| 🌐 **Multilingual Support**| English and Malayalam language support                                   |
| 📸 **Image Analysis**      | Upload crop images for disease detection and analysis                    |
| 💾 **Chat History**        | Save and manage previous conversations                                    |
| 🔍 **Smart Search**        | Search through chat history and farming knowledge                        |
| 🎯 **Quick Suggestions**   | Dynamic farming topic suggestions updated every 5 minutes               |
| 📊 **Activity Tracking**   | Log and monitor farming activities                                        |
| 💰 **Scheme Information**  | Access to government farming schemes and subsidies                       |
| 📚 **Knowledge Base**      | Comprehensive farming guides and best practices                          |

---

## 🛠️ Tech Stack

### **Frontend**
| Technology        | Purpose                          |
| ----------------- | -------------------------------- |
| **React + TypeScript** | Component-based UI framework |
| **Tailwind CSS**  | Utility-first styling           |
| **Vite**          | Fast build tool and dev server  |
| **Lucide React**  | Modern icon library             |

### **Backend**
| Technology        | Purpose                          |
| ----------------- | -------------------------------- |
| **Flask**         | Python web framework             |
| **SQLite**        | Lightweight database            |
| **Google Gemini API** | AI conversation engine       |
| **GROQ API**      | Fast AI content generation      |
| **gTTS**          | Text-to-speech conversion       |

### **APIs & Services**
| Service           | Purpose                          |
| ----------------- | -------------------------------- |
| **OpenWeather API** | Weather data and forecasts     |
| **Google Translate** | Multi-language support        |
| **Web Speech API** | Voice recognition              |

---

## 📂 Project Structure

```
Krishi-Sakhi-SIH-25/
├── 📁 frontend/               # React TypeScript frontend
│   ├── 📁 src/
│   │   ├── 📁 components/     # Reusable UI components
│   │   ├── 📁 contexts/       # React context providers
│   │   ├── 📁 pages/          # Application pages
│   │   └── 📁 config/         # API configuration
│   ├── package.json
│   └── vite.config.ts
├── 📁 blueprints/             # Flask route modules
│   ├── chat.py               # Chat functionality
│   ├── home.py               # Dashboard features
│   ├── knowledge.py          # Knowledge base
│   ├── schemes.py            # Government schemes
│   └── profile.py            # User management
├── 📁 instance/               # Database files
├── main.py                   # Flask application entry
├── models.py                 # Database models
├── requirements.txt          # Python dependencies
├── cleanup.ps1               # Project cleanup script
└── run-app.ps1              # Application runner script
```

---

## 🚀 Quick Start

### Prerequisites

| Tool              | Version       | Purpose                    |
| ----------------- | ------------- | -------------------------- |
| **Node.js**       | 16.0+ or 18.0+ | Frontend development     |
| **Python**        | 3.8+          | Backend development        |
| **Git**           | Latest        | Version control            |

### 🏃‍♂️ One-Command Setup & Run

```powershell
# Clone the repository
git clone https://github.com/saptarshiroy39/Krishi-Sakhi-SIH-25.git
cd Krishi-Sakhi-SIH-25

# Run the complete setup and start application
.\run-app.ps1
```

The script will:
- ✅ Check Node.js and Python installations
- 📦 Install all frontend and backend dependencies
- 🗄️ Initialize the database
- 🚀 Start both frontend and backend servers

### 🧹 Clean Installation

```powershell
# Clean all generated files and dependencies
.\cleanup.ps1

# Fresh setup
.\run-app.ps1
```

---

## 🌐 Application Access

| Service           | URL                           | Description                    |
| ----------------- | ----------------------------- | ------------------------------ |
| **Frontend App**  | http://localhost:3000         | Main application interface     |
| **Backend API**   | http://127.0.0.1:5000         | REST API endpoints             |
| **API Docs**      | http://127.0.0.1:5000/api/docs| API documentation             |

---

## 🔧 Manual Setup (Alternative)

### Backend Setup

```bash
# Install Python dependencies
pip install -r requirements.txt

# Initialize database
python init_db.py

# Start Flask server
python main.py
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## 📱 Application Pages

| Page              | Route             | Features                               |
| ----------------- | ----------------- | -------------------------------------- |
| **Home**          | `/`               | Dashboard, quick actions, weather      |
| **Chat**          | `/chat`           | AI assistant, voice input, image upload|
| **Knowledge**     | `/knowledge`      | Farming guides, tips, market prices    |
| **Activities**    | `/activities`     | Farm activity logging and tracking     |
| **Schemes**       | `/schemes`        | Government schemes and subsidies       |
| **Profile**       | `/profile`        | User settings and preferences          |
| **Notifications** | `/notifications`  | Important alerts and updates           |

---

## 🎯 Key Features Explained

### 🤖 **AI Chat Assistant**
- Powered by Google Gemini for intelligent responses
- Context-aware conversations about farming
- Support for both English and Malayalam
- Image analysis for crop disease detection

### 🌦️ **Weather Integration**
- Real-time weather data from OpenWeather API
- 7-day forecasts for farming planning
- Weather-based farming recommendations
- Location-specific data for Kerala

### 🗣️ **Voice & Audio Features**
- Speech-to-text for hands-free input
- Text-to-speech responses in local language
- Voice commands for quick interactions
- Optimized for field use

### 📱 **Mobile Experience**
- Touch-optimized interface
- Responsive design for all screen sizes
- Offline capability for essential features
- Progressive Web App (PWA) support

---

## 🔐 Environment Setup

Create a `.env` file in the root directory:

```env
# AI API Keys
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key

# Weather API
OPENWEATHER_API_KEY=your_openweather_key

# Database
DATABASE_URL=sqlite:///instance/app.db

# Flask Configuration
FLASK_ENV=development
SECRET_KEY=your_secret_key
```

---

## 🌱 Future Enhancements

- 🛰️ **Satellite imagery** for crop monitoring
- 🌾 **IoT integration** for sensor data
- 💹 **Market price predictions** using ML
- 🤝 **Community features** for farmer networking
- 📊 **Advanced analytics** dashboard
- 🎯 **Personalized recommendations** engine

---

## 🤝 Contributing

We welcome contributions to improve Krishi Sakhi AI!

1. **Fork** the repository
2. Create a **feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. Open a **Pull Request**

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Team

**Krishi Sakhi AI** is developed for **Smart India Hackathon 2025** by:

| Role                  | Responsibility                    |
| --------------------- | --------------------------------- |
| **Frontend Developer** | React UI/UX implementation      |
| **Backend Developer**  | Flask API and AI integration    |
| **AI/ML Engineer**     | Model training and optimization |
| **Mobile Developer**   | Mobile optimization and PWA     |
| **UI/UX Designer**     | User interface design           |
| **Project Manager**    | Coordination and planning        |

---

## ⭐ Support

If you find this project helpful, please consider:

- ⭐ **Starring** this repository
- 👥 **Following** our team
- 🐛 **Reporting** issues or bugs
- 💡 **Suggesting** new features

[![GitHub stars](https://img.shields.io/github/stars/saptarshiroy39/Krishi-Sakhi-SIH-25.svg?style=social&label=Star)](https://github.com/saptarshiroy39/Krishi-Sakhi-SIH-25)
[![GitHub followers](https://img.shields.io/github/followers/saptarshiroy39.svg?style=social&label=Follow)](https://github.com/saptarshiroy39)

---

## 📞 Contact

For questions, feedback, or collaboration opportunities:

- 📧 **Email**: [saptarshiroy39@gmail.com](mailto:saptarshiroy39@gmail.com)
- 🐙 **GitHub**: [@saptarshiroy39](https://github.com/saptarshiroy39)
- 💼 **LinkedIn**: [Saptarshi Roy](https://linkedin.com/in/saptarshiroy39)

---

<div align="center">

**🌾 Empowering Kerala Farmers with AI Technology 🌾**

*Made with ❤️ for Smart India Hackathon 2025*

</div>