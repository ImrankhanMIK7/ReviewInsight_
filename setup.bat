@echo off
echo ==========================================================
echo           ReviewInsight AI - Platform Local Setup
echo ==========================================================
echo.

echo STEP 1: Setting up Python Backend Virtual Environment...
cd backend
python -m venv venv
call venv\Scripts\activate.bat
echo Installing backend requirements...
pip install -r requirements.txt
python -c "import nltk; nltk.download('vader_lexicon'); nltk.download('punkt')"
cd ..

echo.
echo STEP 2: Setting up Next.js Frontend NPM packages...
cd frontend
echo Installing Node.js packages (Make sure Node.js is installed)...
call npm install
cd ..

echo.
echo ==========================================================
echo  Setup Completed! 
echo ==========================================================
echo  To run the backend:
echo     cd backend
echo     venv\Scripts\activate.bat
echo     python main.py
echo.
echo  To run the frontend (in a separate terminal):
echo     cd frontend
echo     npm run dev
echo ==========================================================
pause
