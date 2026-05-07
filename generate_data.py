import pandas as pd
import argparse
from src.data_gen import generate_po_data

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', default='raw_po_data.csv')
    args = parser.parse_args()

    print(f"Extracting data from Nway ERP Simulation...")
    df = generate_po_data(days=180)
    df.to_csv(args.output, index=False)
    print(f"Extraction Complete. Saved {len(df)} rows to {args.output}")

if __name__ == "__main__":
    main()
