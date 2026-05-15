# Nexus AI Incident Analyst 🚀

An enterprise-grade, AI-powered log analysis and incident response platform designed for Site Reliability Engineering (SRE) and DevOps teams.

Nexus AI Incident Analyst moves beyond simple keyword matching and automated script generation. It leverages advanced Large Language Models (LLMs) to provide intelligent Root Cause Analysis (RCA), severity-based triage, and high-level strategic debugging guidance.

## 🌟 Key Features

- **Intelligent Root Cause Analysis (RCA):** Powered by the NVIDIA NIM API (LLaMA 3.1 8B Instruct), the system analyzes complex system, server, or application logs and generates structured, professional incident reports.
- **Severity-Based Triage:** Automatically detects issues and categorizes them by severity (`Critical`, `High`, `Medium`, `Low`) to help teams prioritize their incident response.
- **Strategic Debugging Guidance:** Provides safe, high-level investigation areas (e.g., "Verify Docker network connectivity") rather than risky, executable terminal scripts.
- **SRE-Style Observability Dashboard:** A premium, responsive UI featuring a dark-themed glassmorphism design with drag-and-drop file upload, real-time metrics, and clean visualizations.
- **Secure & Cloud-Ready:** Containerized with Docker and optimized for seamless serverless deployment on Vercel.

## 🛠️ Tech Stack

- **Backend:** Python, FastAPI
- **Frontend:** Vanilla JavaScript, HTML5, Modern CSS (Glassmorphism UI)
- **AI Integration:** NVIDIA NIM API (`meta/llama-3.1-8b-instruct`)
- **Deployment & Infra:** Docker, Docker Compose, Vercel

## 🚀 Getting Started Locally

### Prerequisites
- Python 3.9+
- An [NVIDIA Developer account](https://build.nvidia.com/) to obtain a free API key.

### 1. Clone the repository
```bash
git clone https://github.com/ruthweb-site/Nexus-ai.git
cd Nexus-ai
```

### 2. Set up Environment Variables
Create a `.env` file in the root directory and add your NVIDIA API Key:
```env
NVIDIA_API_KEY=your_actual_api_key_here
```

### 3. Run with Python (Standard)
Install dependencies and run the FastAPI server:
```bash
pip install -r requirements.txt
python main.py
```
*The application will be available at `http://localhost:8000`*

### 4. Run with Docker (Alternative)
If you prefer to use Docker, you can build and run the container:
```bash
docker-compose up --build
```
*The application will be available at `http://localhost:8000`*

## ☁️ Deployment (Vercel)

This project includes a `vercel.json` configuration file, making it ready for 1-click deployment on Vercel.

1. Go to [Vercel](https://vercel.com/) and import your GitHub repository.
2. Ensure the Framework Preset is set to **Other** and the Root Directory is `./`.
3. In the **Environment Variables** section, add your `NVIDIA_API_KEY`.
4. Click **Deploy**.

## 📄 License

This project is open-source and available for educational and professional use. 

---
*Built with ❤️ for SREs and DevOps Engineers.*
