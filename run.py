import sys
import os
import webbrowser
import time
from pathlib import Path

# Add backend directory to path
BASE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = BASE_DIR / "backend"
sys.path.insert(0, str(BACKEND_DIR))

if __name__ == "__main__":
    import uvicorn
    from app.database import init_db
    
    print("=" * 65)
    print("           DATAPILOT AI — AUTONOMOUS DASHBOARD BUILDER")
    print("=" * 65)
    print(" Initializing SQLite Database...")
    init_db()
    print(" Backend API & Embedded Frontend Ready!")
    print(" URL: http://localhost:8000")
    print("=" * 65)
    
    # Run uvicorn server
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=False)
