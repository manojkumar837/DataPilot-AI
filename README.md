# DataPilot AI 🚀
### AI-Powered Automatic Dashboard Builder (Power BI Inspired)

DataPilot AI is an enterprise-grade, autonomous business intelligence application that transforms raw datasets (CSV, Excel `.xlsx`, or JSON) into interactive, cross-filterable dashboards in seconds — requiring zero manual chart or KPI configuration.

---

## 🌟 Key Features

### 1. Zero-Config Data Profiling Engine
- **Intelligent Type Detection**: Automatically classifies columns into Numeric, Categorical, Datetime, Boolean, and Identifier keys.
- **Strict Identifier Isolation**: Keys, IDs (e.g., `Order ID`, `Customer UUID`) are never mistakenly aggregated as numerical measures.
- **Statistical Summaries**: Computes min, max, mean, median, standard deviation, quartiles (Q25, Q75), and statistical outliers (1.5 × IQR & 3σ z-scores).
- **Data Quality Audit**: Calculates data completeness, uniqueness, missing value percentages, duplicate counts, and generates an overall health grade (A-F).
- **Non-Destructive Cleaning**: Interactive preview of duplicate removal, outlier clipping, and missing value imputation before saving.

### 2. Automatic Dashboard Generation (Core Engine)
- **Automatic KPI Cards**: Detects domain-specific measures (Revenue, Sales, Profit, Orders, Employee Count, Rating, Units) and calculates verified sums, averages, distinct counts, and mini sparkline trends.
- **Adaptive Chart Selection**:
  - `Date + Numeric Measure` ➔ Smooth **Area / Line Chart** (aggregated into monthly or daily buckets).
  - `Category (cardinality 2-7) + Numeric Measure` ➔ **Donut / Pie Chart** with central total metric.
  - `Category (cardinality > 7) + Numeric Measure` ➔ Top-N sorted **Bar Chart**.
  - `Two Continuous Numeric Measures` ➔ **Scatter Plot** showing correlation.
  - `Continuous Single Measure` ➔ Binned **Histogram** distribution.
- **Dynamic Responsive Layout**:
  - Top Row: 4-5 High-Value Metric KPI Cards.
  - Middle Rows: Trend charts, category breakdowns, and correlations.
  - Bottom Row: Searchable, paginated raw data table.

### 3. Interactive Cross-Filtering & Multi-Dimensional Slicing
- **Cross-Chart Filtering**: Clicking any slice in a Donut chart or bar in a Bar chart automatically updates all KPI cards, other charts, and the data table to reflect that selection!
- **Active Filter Badges**: View and remove active filters with a single click.
- **Live Coverage Counter**: Displays live counts (e.g., *"Showing 97 of 350 records (27.7%)"*).
- **Date Range Filters & Search**: Interactive calendar pickers and full-text search across all dimensions.

### 4. Chart Explorer & Custom Visual Builder
- Design custom charts on-the-fly:
  - Choose chart type: Bar, Line, Area, Donut, Pie, Scatter, Histogram.
  - Select X-Axis, Y-Axis, and Aggregation function (SUM, AVG, COUNT, MIN, MAX).
  - Live interactive preview before pinning to the dashboard.

### 5. Verified AI Insights & Executive Narrative
- **100% Calculated Facts**: Distinguishes measured findings from recommendations.
- **Automated Findings**:
  - Top vs. bottom segment performance ratios.
  - Pareto 80/20 concentration analysis.
  - Period-over-period growth milestones and peak season detection.
  - Extreme transaction outlier alerts.
  - Pearson correlation co-movement (e.g., `Sales` vs. `Profit` r = 0.95).
- **Offline Ready**: Operates with rule-based heuristics out-of-the-box, with optional OpenAI/Gemini API key integration for conversational narratives.

### 6. "Chat With Your Data" Conversational AI
- Natural language query answering:
  - *"What are the main insights in this dataset?"*
  - *"Which category has the highest sales?"*
  - *"Show monthly trends for revenue"*
  - *"Are there any outliers in profit?"*
- Answers include verified numerical values and embedded dynamic charts directly inside the chat thread.
- Strictly parameterized; **never executes unrestricted arbitrary code**.

### 7. Export Capabilities
- **PDF Export**: Single-click PDF export containing title, KPIs, charts, and report generation date.
- **Filtered CSV**: Downloads the exact filtered slice of data.
- **Dashboard JSON**: Download and restore full dashboard configurations.
- **Persistent SQLite Database**: Dashboards and metadata are saved automatically and can be reopened anytime.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts, jsPDF, html2canvas |
| **Backend** | Python 3.11+, FastAPI, Pandas, NumPy, OpenPyXL, Uvicorn, Pydantic |
| **Database** | SQLite 3 |
| **Architecture** | RESTful API, Single-Page Application (SPA) with Embedded Dist Serving |

---

## 🚀 Getting Started

### Option 1: One-Click Full-Stack Runner (Recommended)

Run the backend and the compiled frontend together from a single command:

```powershell
# Navigate to the project root
cd C:\Users\acer\.gemini\antigravity\scratch\datapilot-ai

# Start server
python run.py
```

Open your browser to: **`http://localhost:8000`**

---

### Option 2: Running Backend & Frontend in Development Mode

#### 1. Start the FastAPI Backend (Port 8000)
```powershell
cd C:\Users\acer\.gemini\antigravity\scratch\datapilot-ai\backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### 2. Start the Vite React Frontend (Port 5173)
```powershell
cd C:\Users\acer\.gemini\antigravity\scratch\datapilot-ai\frontend
npm run dev
```

Open your browser to: **`http://localhost:5173`** (Vite proxies all `/api` requests to backend at `127.0.0.1:8000`).

---

## 🧪 Running the Automated Test Suite

A complete test suite is included in `backend/tests/test_full_suite.py` that verifies CSV/Excel/JSON ingestion, KPI generation, chart selection, cross-filtering, and AI query answering:

```powershell
cd C:\Users\acer\.gemini\antigravity\scratch\datapilot-ai
python backend\tests\test_full_suite.py
```

All 12 test suites will run and verify 100% of functional requirements.

---

## 📊 Ready-to-Use Sample Datasets

DataPilot AI includes three realistic synthetic datasets pre-packaged for instant 1-click dashboard generation:

1. **Retail Sales Performance**: 350 transactions across 4 global regions, Store Types, Categories, Sales, Profit, Discounts, and Customer Types.
2. **E-Commerce Global Logistics**: 400 order fulfillment records tracking Delivery Days, Sub-categories, Order IDs, and profit margins.
3. **HR Talent & Workforce**: 300 employee records with Department, Tenure, Compensation, Performance Rating, and Attrition risk.

Click **"Launch"** on any sample from the home page to immediately experience the automatic dashboard builder!
