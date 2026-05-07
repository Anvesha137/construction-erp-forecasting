# Configuration for Nway ERP Simulation

SKUS = [
    {"id": "NW-CON-001", "name": "Portland Cement (50kg)",          "category": "Raw Material"},
    {"id": "NW-CON-002", "name": "TMT Steel Bars (12mm)",           "category": "Raw Material"},
    {"id": "NW-CON-003", "name": "Ready-Mix Concrete (M30)",        "category": "Raw Material"},
    {"id": "NW-PLM-004", "name": "UPVC Pipes (4 inch)",             "category": "Plumbing"},
    {"id": "NW-ELE-005", "name": "Copper Wire (2.5 sq mm)",         "category": "Electrical"},
    {"id": "NW-FIN-006", "name": "Weatherproof Emulsion (20L)",     "category": "Finishing"},
    {"id": "NW-CON-007", "name": "River Sand (per Ton)",            "category": "Raw Material"},
    {"id": "NW-FIN-008", "name": "Vitrified Tiles (600x600mm)",     "category": "Finishing"},
    {"id": "NW-HVAC-009", "name": "HVAC Ducting Sheet (GI)",        "category": "HVAC"},
    {"id": "NW-SFT-010", "name": "Industrial Safety Helmets",       "category": "Safety Gear"},
]

SUPPLIERS = [
    "UltraTech Cement Ltd.", 
    "Tata Tiscon", 
    "Finolex Cables",
    "Asian Paints Pro", 
    "Kajaria Ceramics",
    "Jindal Steel & Power",
    "Local Sand Syndicate"
]

# ML Constants
FEATURE_COLS = [
    "rolling_7d", "rolling_30d", "days_since_last_po",
    "stock_level", "stock_vs_consumption", "stock_turnover",
    "order_frequency", "lead_time_days", "day_of_week", "month"
]
