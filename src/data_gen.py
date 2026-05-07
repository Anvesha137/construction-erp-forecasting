import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
from .config import SKUS, SUPPLIERS

def generate_po_data(days=180):
    """
    Simulates historical Purchase Order (PO) data from an ERP system.
    Includes seasonality, weekly trends, and random noise.
    """
    rows = []
    base = datetime.today() - timedelta(days=days)
    for sku in SKUS:
        base_demand = random.randint(50, 300)
        lead_time   = random.randint(3, 14)
        for d in range(days):
            date = base + timedelta(days=d)
            # Seasonal + Weekly + Noise
            seasonal  = 1 + 0.3 * np.sin(2 * np.pi * date.timetuple().tm_yday / 365)
            weekly    = 1 + 0.1 * np.sin(2 * np.pi * date.weekday() / 7)
            noise     = np.random.normal(1, 0.15)
            
            qty       = max(5, int(base_demand * seasonal * weekly * noise))
            stock     = max(10, int(qty * random.uniform(0.8, 2.5)))
            
            rows.append({
                "po_date":           date.strftime("%Y-%m-%d"),
                "sku_id":            sku["id"],
                "sku_name":          sku["name"],
                "category":          sku["category"],
                "quantity_ordered":  qty,
                "supplier":          random.choice(SUPPLIERS),
                "lead_time_days":    lead_time + random.randint(-1, 2),
                "stock_level":       stock,
                "avg_consumption":   round(base_demand / 30, 2),
            })
    df = pd.DataFrame(rows)
    df["po_date"] = pd.to_datetime(df["po_date"])
    return df
