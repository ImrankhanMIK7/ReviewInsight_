<img width="1920" height="1080" alt="Screenshot 2026-06-15 172130" src="https://github.com/user-attachments/assets/8667f545-572b-4a9f-bf8f-dad69f6ce23b" />
# ReviewInsight AI

A portfolio-grade, SaaS-style AI Review Analysis Platform built from scratch using only free and open-source technologies. It automatically detects schema headers from uploaded review files, executes natural language processing (NLP) to classify review sentiment, infers missing star ratings, extracts key customer discussion themes, and populates a high-end glassmorphism dashboard.

---

## 🚀 Core Features

- **Smart Upload Engine**: Support for CSV, XLSX, and JSON file parsing.
- **Auto Header Mapping**: No manual mapping required; parses columns based on semantic heuristic patterns.
- **Sentiment Pipeline**: Powered by NLTK VADER & TextBlob, classifying comments as Positive, Neutral, or Negative.
- **Smart Star Inference**: If ratings are missing, estimates 1-5 star ratings directly from review text sentiment.
- **NLP Insights & Summaries**: Evaluates what customers like/dislike, common complaints, suggestions, and extracts tf-idf keywords.
- **SaaS Dashboard (Dark Default)**: Includes visual telemetry charts (Pie, Bar, Area charts) using Recharts.
- **Review Explorer**: Interactive search and filtering table with full pagination.
- **Data Export**: Re-export cleaned data results back to CSV or Excel (.xlsx) formats.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 15 (React 19), TypeScript, Tailwind CSS, Recharts, Framer Motion, Lucide Icons.
- **Backend**: FastAPI (Python), Pandas, NumPy, NLTK, TextBlob, Scikit-Learn.
- **Database**: SQLite.

---
<img width="1920" height="1080" alt="Screenshot 2026-06-15 172149" src="https://github.com/user-attachments/assets/5684eb78-edf8-42cd-9996-4660c5608ca5" />
<img width="1920" height="1080" alt="Screenshot 2026-06-15 172206" src="https://github.com/user-attachments/assets/7250be3d-bcc7-4d3e-90bd-a3752ee07b9b" />

## 📂 Project Structure

```
reviewinsight-ai/
├── backend/
│   ├── main.py                 # FastAPI server & endpoints
│   ├── database.py             # SQLite connection & ORM queries
│   ├── requirements.txt        # Python backend library list
│   └── utils/
│       ├── cleaner.py          # Data cleaning & deduplication
│       ├── detector.py         # Column header mapping heuristics
│       ├── analyzer.py         # Sentiment VADER & Rating estimator
│       └── summarizer.py       # TF-IDF keyword extractor
│
├── frontend/
│   ├── package.json            # Node dependency configuration
│   ├── tsconfig.json           # TypeScript configuration
│   ├── tailwind.config.ts      # Tailwind glassmorphic layout theme
│   ├── next.config.ts          # API rewrite proxy
│   └── src/
│       ├── app/
│       │   ├── layout.tsx      # Sidebar navigation & layout shell
│       │   ├── page.tsx        # Charts & KPI Dashboard
│       │   ├── upload/page.tsx # File drag-and-drop uploader
│       │   ├── insights/page.tsx # NLP summary lists & suggestions
│       │   └── reviews/page.tsx # Review table search and explorer
│       └── lib/
│           └── api.ts          # Fetch interface
│
├── sample_reviews.csv          # Mock dataset for quick testing
└── README.md                   # Setup guide
```

---

## 💻 Local Setup & Installation

### 1. Backend Server Setup
From the project root:
```bash
# Navigate to backend
cd backend

# Create python virtual environment
python -m venv venv

# Activate environment
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Windows (Command Prompt):
.\venv\Scripts\activate.bat
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Download required NLTK corpora
python -c "import nltk; nltk.download('vader_lexicon'); nltk.download('punkt')"

# Run FastAPI server
python main.py
```
*The API server will run at: `http://localhost:8000`*

---

### 2. Frontend client Setup
Open a new terminal shell from the project root:
```bash
# Navigate to frontend
cd frontend

# Install package dependencies
npm install

# Run dev server
npm run dev
```
*The Next.js client app will launch at: `http://localhost:3000`*

---

## 📦 Deployment Instructions

### Frontend (Vercel)
1. Push your project files to a Github Repository.
2. Link your repository to Vercel.
3. In Project Settings, set **Framework Preset** to `Next.js`.
4. Add environment variables if pointing to a production domain (or configure Next.js rewrites to direct API requests to the Render backend).

### Backend (Render Free Tier)
1. Log in to Render and create a new **Web Service**.
2. Select your Github Repository.
3. Configure the settings:
   - **Environment**: `Python`
   - **Build Command**: `pip install -r backend/requirements.txt && python -c "import nltk; nltk.download('vader_lexicon'); nltk.download('punkt')"`
   - **Start Command**: `python backend/main.py`
4. Set scale / instances to Render Free tier.
