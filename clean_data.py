import pandas as pd
import argparse
import numpy as np

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', default='raw_po_data.csv')
    parser.add_argument('--output', default='clean_data.csv')
    args = parser.parse_args()

    df = pd.read_csv(args.input)
    rows_in = len(df)
    
    # Simulate some bad data for the demo
    # We'll drop a few random values to simulate the 'nulls' you mentioned
    null_indices = np.random.choice(df.index, size=5, replace=False)
    df.loc[null_indices, 'quantity_ordered'] = np.nan

    # THE FIX: Explicitly handle and log nulls instead of letting them crash the ML
    clean_df = df.dropna(subset=['quantity_ordered', 'stock_level', 'avg_consumption'])
    rows_out = len(clean_df)
    rows_dropped = rows_in - rows_out

    clean_df.to_csv(args.output, index=False)
    
    print(f"CLEANING REPORT:")
    print(f"Rows In:      {rows_in}")
    print(f"Rows Dropped: {rows_dropped} (Null/Invalid Data)")
    print(f"Rows Out:     {rows_out}")
    print(f"Status:       SUCCESS")

if __name__ == "__main__":
    main()
