# HDB Price Insight Backend (FastAPI)

This backend **does not train a model**. It expects a pre-trained `model.joblib` or `full_pipeline.pkl` exported from your
`hdb_price_insight.ipynb` (or any notebook). The exported model must implement a `.predict(X)` interface that works with a `pandas.DataFrame`.

---

## Expected Artifact

Place your exported artifact at:backend/model/full_pipeline.pkl

The file should be a dictionary saved via `joblib.dump({"pipeline": your_pipeline})`, where `your_pipeline.predict(X)` accepts a DataFrame with the following columns:

- `town` (str)
- `flat_type` (str)
- `remaining_lease_years` (float)
- `target_year` (int)

---

## Setup & Run

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

## API Endpoints

1. Health Check

GET /health
Response:

```bash
{
  "status": "ok",
  "has_model": true
}
```

has_model indicates whether the backend successfully loaded your pipeline.

2.Predict HDB Price

POST /predict

Request body example:

```bash
{
    "town": "ANG MO KIO",
    "flat_type": "4 ROOM",
    "remaining_lease_years": 70,
    "target_year": 2030
}
```

target_year is optional. If omitted, only the current predicted price is returned.

target_year must be greater than or equal to the current year, and within a reasonable future (max 80 years).

Response example:

```bash
{"predicted_price_now":729540.54,"predicted_price_target_year":660332.92,"years_into_future":5,"price_change_pct":-9.49}
```

predicted_price_now → estimated resale price for the current year.

predicted_price_target_year → projected price for the future target_year, calculated by reducing remaining lease by the number of years into the future and re-predicting using the same model.

years_into_future → difference between target_year and current year.

price_change_pct → percentage change from now to target year.

Note: The projected price is model-driven, so small reductions in remaining lease may produce little or no change depending on how the model learned patterns from historical data.
