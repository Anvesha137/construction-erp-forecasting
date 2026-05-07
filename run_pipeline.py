import pandas as pd
import argparse
import json
from src.model_engine import run_pipeline

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', default='clean_data.csv')
    parser.add_argument('--output', default='forecast_output.csv')
    parser.add_argument('--log', default='pipeline_log.json')
    args = parser.parse_args()

    print(f"Loading cleaned data...")
    df = pd.read_csv(args.input)
    df['po_date'] = pd.to_datetime(df['po_date'])

    print(f"Executing Machine Learning Pipeline (Decision Tree)...")
    results = run_pipeline(df)

    # 1. Save Forecast CSV (Flattening the nested forecast data)
    forecast_list = []
    for f in results['forecasts']:
        for pred in f['forecast']:
            forecast_list.append({
                'sku_id': f['sku_id'],
                'sku_name': f['sku_name'],
                'date': pred['date'],
                'predicted_quantity': pred['predicted'],
                'supplier': f['supplier'],
                'current_stock': f['current_stock']
            })
    
    pd.DataFrame(forecast_list).to_csv(args.output, index=False)
    
    # 2. Save Audit Log
    log_data = {
        "timestamp": results['run_time'],
        "rows_in": results['total_records'],
        "skus_processed": results['total_skus'],
        "dt_mae": results['dt']['mae'],
        "dt_r2": results['dt']['r2'],
        "status": "SUCCESS"
    }
    
    with open(args.log, 'w') as f:
        json.dump(log_data, f, indent=4)

    print(f"Pipeline Complete.")
    print(f"Forecast saved to {args.output}")
    print(f"Log saved to {args.log}")

if __name__ == "__main__":
    main()
