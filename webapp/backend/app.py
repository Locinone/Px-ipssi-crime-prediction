# backend/app.py
from flask import Flask, request, jsonify
import pandas as pd
from flask_cors import CORS           # CORS pour localhost:3000

try:
    from flask_compress import Compress
    _gzip = True
except ImportError:
    _gzip = False

app = Flask(__name__)
CORS(app)                              # ouvrez plus finement en prod
if _gzip:
    Compress(app)

# ---------------------------------------------------------------------------
# Chargement CSV + échantillon 10 %
# ---------------------------------------------------------------------------
CSV_PATH = r"C:\Users\Nassim\Downloads\NYPD_Complaint_Data_Current__Year_To_Date__20250625.csv"

df_full = pd.read_csv(
    CSV_PATH,
    parse_dates=["CMPLNT_FR_DT"],
    dayfirst=False
)

if not pd.api.types.is_datetime64_any_dtype(df_full["CMPLNT_FR_DT"]):
    df_full["CMPLNT_FR_DT"] = pd.to_datetime(
        df_full["CMPLNT_FR_DT"], format="%m/%d/%Y", errors="coerce"
    )

df = (
    df_full
    .sample(frac=0.10, random_state=42)
    .reset_index(drop=True)
)
app.logger.info("✅ DataFrame réduit à 10 %% : %s lignes", len(df))

MAX_POINTS = 5_000

# ---------------------------------------------------------------------------
# /api/crime-types  — renvoie [(type, count)] triés par fréquence décroissante
# ---------------------------------------------------------------------------
@app.route("/api/crime-types")
def crime_types():
    stats = (
        df["OFNS_DESC"]
        .dropna()
        .value_counts()               # déjà décroissant
    )
    payload = [
        {"type": k, "count": int(v)}
        for k, v in stats.items()
    ]
    return jsonify(payload)

# ---------------------------------------------------------------------------
# /api/incidents
# ---------------------------------------------------------------------------
@app.route("/api/incidents")
def incidents():
    data = df.copy()

    # --- paramètres ---
    start_date = request.args.get("start_date")
    end_date   = request.args.get("end_date")
    crime_type = request.args.get("crime_type")  # CSV ex. "ROBBERY,ASSAULT"
    borough    = request.args.get("borough")
    bbox_str   = request.args.get("bbox")

    # --- filtre dates ---
    sd = pd.to_datetime(start_date, errors="coerce") if start_date else pd.NaT
    ed = pd.to_datetime(end_date,   errors="coerce") if end_date   else pd.NaT
    if not (pd.isna(sd) and pd.isna(ed)):
        data = data[data["CMPLNT_FR_DT"].between(sd or pd.Timestamp.min,
                                                 ed or pd.Timestamp.max)]

    # --- crimes multiples ---
    if crime_type:
        wanted = [c.strip() for c in crime_type.split(",") if c.strip()]
        data = data[data["OFNS_DESC"].isin(wanted)]

    if borough:
        data = data[data["BORO_NM"] == borough]

    # --- BBOX ---
    if bbox_str:
        try:
            w, s, e, n = map(float, bbox_str.split(","))
            data = data[(data["Longitude"].between(w, e)) &
                        (data["Latitude"] .between(s, n))]
        except ValueError:
            app.logger.warning("bbox mal formé : %s", bbox_str)

    # --- limite dure ---
    if len(data) > MAX_POINTS:
        data = data.sample(frac=MAX_POINTS / len(data), random_state=42)

    # --- GeoJSON ---
    features = []
    for idx, row in data.iterrows():
        lat, lon = row["Latitude"], row["Longitude"]
        if pd.notna(lat) and pd.notna(lon):
            dt = row["CMPLNT_FR_DT"]
            features.append({
                "type": "Feature",
                "id": str(idx),
                "properties": {
                    "CMPLNT_NUM":   row["CMPLNT_NUM"],
                    "BORO_NM":      row["BORO_NM"],
                    "CMPLNT_FR_DT": dt.strftime("%m/%d/%Y") if pd.notna(dt) else None,
                    "OFNS_DESC":    row["OFNS_DESC"],
                    "Latitude":     lat,
                    "Longitude":    lon,
                },
                "geometry": {"type": "Point", "coordinates": [lon, lat]}
            })

    return jsonify({"type": "FeatureCollection", "features": features})

# ---------------------------------------------------------------------------
if __name__ == "__main__":
    app.run(debug=True)
