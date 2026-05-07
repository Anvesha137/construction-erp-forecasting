# Nway ERP — AI-Powered Construction Intelligence Dashboard

> An end-to-end Machine Learning pipeline integrated into a multi-module ERP web application built for Nway Technologies. Designed as an intern project to demonstrate how AI-driven demand forecasting can eliminate material shortages, reduce procurement delays, and cut wasteful ordering in the Indian construction industry.

---

## Table of Contents

- [Project Overview](#-project-overview)
- [The Problem Statement](#-the-problem-statement)
- [Why We Built This](#-why-we-built-this)
- [Live Modules](#-live-modules)
- [Technology Stack](#-technology-stack)
- [The Data](#-the-data)
- [Machine Learning Pipeline](#-machine-learning-pipeline)
  - [Feature Engineering](#feature-engineering)
  - [Model 1: Linear Regression (Baseline)](#model-1-linear-regression-baseline)
  - [Model 2: Decision Tree Regressor (Primary)](#model-2-decision-tree-regressor-primary)
  - [GridSearchCV Hyperparameter Tuning](#gridsearchcv-hyperparameter-tuning)
  - [Cross-Validation](#cross-validation)
  - [Evaluation Metrics](#evaluation-metrics)
- [Project Structure](#-project-structure)
- [Setup & Run](#-setup--run)
- [API Reference](#-api-reference)
- [Future Roadmap](#-future-roadmap)

---

## 🏗️ Project Overview

**Project Name:** Nway ERP — Intelligent Construction Dashboard  
**Company:** Nway Technologies Pvt. Ltd. (nwaytech.com)  
**Product Line:** Nway ERP for Construction  
**Role:** AI Engineering Intern  

Nway Technologies is a Madhya Pradesh-based ERP company with 16+ years of experience serving the construction, transport, and HR sectors. This project is a functional MVP module built on top of their existing ERP philosophy — bringing an **AI Forecasting engine** directly into their Construction ERP's procurement and inventory workflows.

The dashboard is a full-stack web application that:
1. Simulates realistic ERP data (Purchase Orders, Stock Levels, Supplier Lead Times)
2. Runs a Machine Learning pipeline to forecast the next 7 days of material demand for each construction item
3. Surfaces those predictions across six interconnected ERP modules via a professional, production-ready UI

---

## ❗ The Problem Statement

Large-scale construction projects in India face a **₹300–500 Crore annual loss** from poor material planning. The specific problems are:

1. **Site Halts:** Workers arrive but materials haven't. A delay in ordering 50kg cement bags can stop work for 50 laborers for an entire day.
2. **Over-Ordering:** Site managers over-order out of fear and tie up capital in materials that spoil in the rain (sand, cement bags) or take up storage space.
3. **Manual Estimation:** The current process relies on a site engineer's "gut feeling" or a simple spreadsheet formula — neither of which accounts for seasonality, project phase, or supplier delays.
4. **No Cross-Site Visibility:** Materials are lying idle at Site B while Site A is running critically low, but nobody knows because data is siloed in spreadsheets.

---

## 💡 Why We Built This

Nway ERP already manages procurement and inventory data. The data was there — it just wasn't being used intelligently. Instead of building a new system, we plugged an ML forecasting engine on top of the existing data schema.

The core idea: **If you can predict when a shortage will happen before it happens, you can automate the Purchase Order before any human even notices.**

This directly feeds the **Procurement Module** — the AI creates a draft PO for approval when it detects a future shortage given the supplier's lead time. If a supplier takes 5 days to deliver and the AI predicts stock-out in 4 days, it raises the alert and creates the PO automatically.

---

## 🖥️ Live Modules

The application is a full multi-module ERP system with 6 functional screens:

| Module | URL | What It Does |
| :--- | :--- | :--- |
| **AI Forecasting Dashboard** | `/` | Main KPI view, interactive demand charts, 7-day forecast per material |
| **Procurement** | `/procurement` | Pending PO approvals (AI-drafted), Vendor ratings, TLMS logistics sync |
| **Inventory** | `/inventory` | Multi-site stock levels, critical low-stock alerts |
| **Projects (BIM)** | `/projects` | Active construction sites, completion %, budget burn rates |
| **Transport TLMS** | `/transport` | Live fleet tracking, in-transit delivery ETAs, delayed truck alerts |
| **HRMS Integration** | `/hrms` | Workforce allocation, site-wise attendance, manpower shortage flags |

---

## 🛠️ Technology Stack

**Backend:**
- **Python 3.14** — Core language
- **Flask** — Lightweight web server and REST API gateway
- **scikit-learn** — ML model training (LinearRegression, DecisionTreeRegressor, GridSearchCV)
- **pandas** — Data manipulation and feature engineering
- **NumPy** — Numerical computation and signal generation for synthetic data

**Frontend:**
- **HTML5 / Vanilla CSS / Vanilla JavaScript** — No frameworks, complete control
- **Chart.js v4** — Interactive line charts and bar charts
- **Google Fonts (Inter + JetBrains Mono)** — Professional enterprise typography
- **Jinja2** — Flask's native HTML templating engine

**Data:**
- **Synthetic ERP Simulation** — No external API or database required; data is generated in-memory using mathematical models to accurately replicate real Purchase Order patterns

---

## 📊 The Data

**No external API is used.** The data is synthetically generated by `src/data_gen.py` to simulate exactly what a real Nway ERP PostgreSQL database would return.

### What Gets Generated
- **180 days** of daily Purchase Order history
- **10 unique construction materials (SKUs)** across 5 categories
- **7 real-world suppliers** (UltraTech Cement, Tata Tiscon, Finolex Cables, Asian Paints Pro, Kajaria Ceramics, Jindal Steel & Power, Local Sand Syndicate)
- **Total records generated: ~1,800 rows** (180 days × 10 SKUs)

### Data Columns
| Column | Type | Description |
| :--- | :--- | :--- |
| `po_date` | datetime | Date of the Purchase Order |
| `sku_id` | string | Unique material code (e.g., `NW-CON-001`) |
| `sku_name` | string | Human-readable item name |
| `category` | string | Material category (Raw Material, Plumbing, Electrical, etc.) |
| `quantity_ordered` | int | Units ordered on that date |
| `supplier` | string | Vendor who fulfilled the order |
| `lead_time_days` | int | Days from PO to delivery |
| `stock_level` | int | Stock on hand at time of order |
| `avg_consumption` | float | Average daily usage (base_demand / 30) |

### Data Realism — How We Simulate Real Patterns

The synthetic data is not random noise. It uses three mathematical signals layered together:

```python
# Annual seasonality (higher demand in summer/dry months for construction)
seasonal = 1 + 0.3 * sin(2π * day_of_year / 365)

# Weekly cycle (weekends have lower labor = lower consumption)
weekly = 1 + 0.1 * sin(2π * weekday / 7)

# Gaussian noise (real-world unpredictability)
noise = Normal(mean=1.0, std=0.15)

# Final quantity = base_demand × seasonal × weekly × noise
quantity = max(5, int(base_demand × seasonal × weekly × noise))
```

This produces data that behaves like real construction site procurement — with peaks, troughs, and randomness.

---

## 🤖 Machine Learning Pipeline

The full pipeline lives in `src/model_engine.py` and runs in 4 stages: **Feature Engineering → Train/Test Split → Model Training + Tuning → Forecasting.**

### Feature Engineering

Raw PO data alone isn't enough for a good model. We compute 10 features that capture both **momentum** and **inventory health**:

| Feature | How It's Calculated | Why It Matters |
| :--- | :--- | :--- |
| `rolling_7d` | 7-day rolling mean of `quantity_ordered` | Captures short-term demand momentum |
| `rolling_30d` | 30-day rolling mean of `quantity_ordered` | Captures long-term trend/baseline |
| `days_since_last_po` | Days since the previous PO for this SKU | Flags irregular ordering patterns |
| `stock_level` | Raw stock on hand | Direct inventory health signal |
| `stock_vs_consumption` | `stock_level / avg_consumption` | "Days of stock remaining" — critical for alerts |
| `stock_turnover` | `quantity_ordered / stock_level` | How fast this item is moving |
| `order_frequency` | Total orders / 6 months | High-frequency vs low-frequency items |
| `lead_time_days` | Supplier-specific delivery time | Determines how far ahead to forecast |
| `day_of_week` | 0=Monday ... 6=Sunday | Captures weekly labor/demand patterns |
| `month` | 1–12 | Captures annual seasonality |

### Train / Test Split

```python
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
```
- **80% of data** used for training
- **20% of data** held out for evaluation
- `random_state=42` for reproducibility

---

### Model 1: Linear Regression (Baseline)

```python
from sklearn.linear_model import LinearRegression
lr = LinearRegression()
lr.fit(X_train, y_train)
```

**Why we included it:**
Linear Regression is the simplest possible model. It assumes demand is a weighted sum of all 10 features. We use it as a **baseline benchmark** — if our advanced model can't beat this, something is wrong with our approach.

**Limitation:** Real construction demand is non-linear. If `stock_level` is low AND `month` is July (peak season), demand spikes disproportionately — Linear Regression can't capture this interaction.

---

### Model 2: Decision Tree Regressor (Primary Model)

```python
from sklearn.tree import DecisionTreeRegressor
dt = DecisionTreeRegressor(random_state=42)
```

**Why a Decision Tree?**

A Decision Tree learns **if-then-else rules** from the data. For example, it might learn:

```
If rolling_7d > 180:
    If month is June or July:
        Predict: 250 units
    Else:
        Predict: 190 units
Else:
    If stock_vs_consumption < 3:
        Predict: 140 units  ← Trigger reorder alert
    Else:
        Predict: 95 units
```

This is exactly how a **senior procurement manager thinks** — intuitively and conditionally. A Decision Tree formalizes this human reasoning into a mathematical structure.

**Why not a Neural Network?**
- Our dataset has ~1,800 rows. Neural networks need millions of rows to outperform tree models.
- Decision Trees are **fully interpretable** — you can explain every prediction to a non-technical site manager or CEO.
- Training time is milliseconds vs. seconds/minutes for neural networks.
- No GPU required. Runs on any laptop.

**Why not Random Forest?**
Random Forest would give marginally better accuracy but is essentially a black-box. For a construction company where a procurement manager needs to trust the AI's recommendations, **explainability matters more than a 2% accuracy gain.**

---

### GridSearchCV Hyperparameter Tuning

```python
param_grid = {
    "max_depth":         [3, 5, 7],
    "min_samples_split": [2, 5, 10],
    "min_samples_leaf":  [1, 2, 4]
}
gs = GridSearchCV(dt_base, param_grid, cv=5, scoring="neg_mean_absolute_error", n_jobs=-1)
gs.fit(X_train, y_train)
```

**What this does:** GridSearchCV exhaustively tests **3 × 3 × 3 = 27 different combinations** of hyperparameters and picks the best one.

**Why these three parameters?**

| Parameter | What It Controls | Risk if Wrong |
| :--- | :--- | :--- |
| `max_depth` | How deep the tree grows | Too deep = overfitting (memorises noise); Too shallow = underfitting |
| `min_samples_split` | Minimum data points to split a node | Too low = noisy splits; Too high = misses patterns |
| `min_samples_leaf` | Minimum data points in a leaf node | Too low = predictions on outliers; Too high = loses specificity |

`n_jobs=-1` means it uses all CPU cores in parallel — speeds up training significantly.

---

### Cross-Validation

```python
cv_r2 = cross_val_score(dt, X_train, y_train, cv=5, scoring="r2")
```

We run **5-Fold Cross-Validation** on the best Decision Tree. This splits the training data into 5 groups, trains on 4, tests on 1, and rotates. This tells us how **stable** the model is — if CV R² is `0.88 ± 0.02`, the model is reliable. If it's `0.88 ± 0.25`, the model is unreliable and sensitive to which data it sees.

---

### Evaluation Metrics

| Metric | What It Measures | Our Target |
| :--- | :--- | :--- |
| **MAE** (Mean Absolute Error) | Average prediction error in units | Lower is better |
| **R² Score** | % of demand variance explained by the model | Closer to 1.0 is better |
| **CV R² (mean ± std)** | How stable the model is across different data splits | High mean, low std |

---

## 📁 Project Structure

```
Nway-Project/
├── app.py                    # Flask server & all REST API routes
├── requirements.txt          # Python dependencies
├── README.md                 # This file
│
├── src/                      # Core backend logic
│   ├── config.py             # SKU definitions, supplier lists, ML feature columns
│   ├── data_gen.py           # Synthetic ERP data generator (simulates 180-day PO history)
│   └── model_engine.py       # Feature engineering, model training, forecasting engine
│
├── templates/                # Jinja2 HTML templates (one per module)
│   ├── index.html            # AI Forecasting Dashboard (main)
│   ├── procurement.html      # Procurement & PO Approvals
│   ├── inventory.html        # Multi-site Inventory Control
│   ├── projects.html         # BIM Project Tracking
│   ├── transport.html        # Transport TLMS Fleet Management
│   └── hrms.html             # HRMS Workforce Management
│
└── static/                   # Frontend assets
    ├── css/
    │   └── style.css         # Nway-branded design system
    └── js/
        └── dashboard.js      # Chart rendering, sidebar routing, API calls
```

---

## 🚀 Setup & Run

### Prerequisites
- Python 3.10+

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/nway-erp-ai-dashboard.git
cd nway-erp-ai-dashboard
```

### 2. Install dependencies
```bash
python -m pip install -r requirements.txt
```

### 3. Run the application
```bash
python app.py
```

### 4. Open the dashboard
Navigate to: **http://127.0.0.1:5000**

The ML pipeline runs automatically on startup. The first load may take 10–20 seconds while the Decision Tree trains. Subsequent API calls use the cached result.

---

## 📡 API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/data` | GET | Returns the full pipeline result (KPIs, forecasts, logs) |
| `/api/refresh` | GET | Re-runs the entire ML pipeline with fresh simulated data and returns new results |

### Sample `/api/data` Response
```json
{
  "run_time": "07 May 2026, 16:30:00",
  "total_skus": 10,
  "total_records": 1800,
  "lr": { "mae": 18.5, "r2": 0.74 },
  "dt": {
    "mae": 8.2, "r2": 0.91,
    "cv_r2_mean": 0.89, "cv_r2_std": 0.03,
    "best_params": { "max_depth": 7, "min_samples_leaf": 2, "min_samples_split": 5 }
  },
  "forecasts": [ ... ],
  "logs": [ ... ]
}
```

---

## 🔮 Future Roadmap

1. **Live Database Integration** — Connect `data_gen.py` to Nway's actual PostgreSQL/Oracle backend via SQLAlchemy
2. **Model Persistence** — Save trained models as `.pkl` files so the server doesn't retrain on every restart
3. **Auto-PO Trigger** — When AI detects stock-out risk, automatically create a draft Purchase Order in the Procurement module database instead of just a UI alert
4. **TLMS Sync** — When a PO is approved, automatically dispatch the nearest available truck from Transport TLMS
5. **Role-Based Access Control (RBAC)** — Site Engineers see only their site. Procurement Managers see all POs. CFO sees only budget views.
6. **Alerting Engine** — Send SMS/Email via Twilio or AWS SNS when a critical reorder alert is triggered
7. **Model Upgrade** — Once real data volume exceeds 50,000 rows, upgrade to **XGBoost** or **LightGBM** for higher accuracy
