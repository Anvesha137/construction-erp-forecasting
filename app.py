from flask import Flask, render_template, jsonify
from src.data_gen import generate_po_data
from src.model_engine import run_pipeline
import os

app = Flask(__name__)

# Cache for the pipeline result
CACHED_DATA = None

def get_latest_data():
    global CACHED_DATA
    if CACHED_DATA is None:
        raw_df = generate_po_data(180)
        CACHED_DATA = run_pipeline(raw_df)
    return CACHED_DATA

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/procurement")
def procurement():
    return render_template("procurement.html")

@app.route("/inventory")
def inventory():
    return render_template("inventory.html")

@app.route("/projects")
def projects():
    return render_template("projects.html")

@app.route("/transport")
def transport():
    return render_template("transport.html")

@app.route("/hrms")
def hrms():
    return render_template("hrms.html")

@app.route("/api/data")
def api_data():
    return jsonify(get_latest_data())

@app.route("/api/refresh")
def api_refresh():
    global CACHED_DATA
    raw_df = generate_po_data(180)
    CACHED_DATA = run_pipeline(raw_df)
    return jsonify({"status": "ok", "run_time": CACHED_DATA["run_time"]})

if __name__ == "__main__":
    print("\n[OK] NWAY Demand Forecasting Dashboard (Production Ready)")
    print("   Open -> http://127.0.0.1:5000\n")
    app.run(debug=True, port=5000)
