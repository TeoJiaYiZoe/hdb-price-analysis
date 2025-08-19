from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
import pandas as pd
import joblib
import os

# Load full pipeline
ARTIFACT_PATH = os.path.join(os.path.dirname(__file__), "model", "full_pipeline.pkl")
pipeline = joblib.load(ARTIFACT_PATH)

app = FastAPI(title="HDB Price Insight — API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictRequest(BaseModel):
    town: str
    flat_type: str
    remaining_lease_years: float = Field(..., gt=0, le=99)
    target_year: Optional[int] = Field(None, description="Year to project price to (>= current year)")

    @field_validator("target_year")
    @classmethod
    def validate_target_year(cls, v):
        if v is None:
            return v
        current_year = datetime.now().year
        if v < current_year:
            raise ValueError(f"target_year must be >= {current_year}")
        if v > current_year + 80:
            raise ValueError("target_year is too far into the future")
        return v

class PredictResponse(BaseModel):
    predicted_price_now: float
    predicted_price_target_year: Optional[float] = None
    years_into_future: Optional[int] = None
    price_change_pct: Optional[float] = None

@app.get("/health")
def health():
    return {"status": "ok", "has_model": pipeline is not None}

@app.post("/api/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    if pipeline is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    current_year = datetime.now().year

    # "Now" prediction
    row_now = {
        "town": req.town,
        "flat_type": req.flat_type,
        "remaining_lease_years": req.remaining_lease_years,
        "year": current_year
    }
    X_now = pd.DataFrame([row_now])
    try:
        y_now = float(pipeline.predict(X_now)[0])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Model prediction failed for 'now': {e}")

    resp = {
        "predicted_price_now": round(y_now, 2),
        "predicted_price_target_year": None,
        "years_into_future": None,
        "price_change_pct": None
    }

    # Future prediction
    if req.target_year:
        years_ahead = req.target_year - current_year
        future_lease = req.remaining_lease_years - years_ahead

        # Enforce: no prediction if lease runs out
        if future_lease <= 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot predict for target_year={req.target_year} because remaining lease ({req.remaining_lease_years}) is too short"
            )

        row_future = {
            "town": req.town,
            "flat_type": req.flat_type,
            "remaining_lease_years": future_lease,
            "year": req.target_year
        }
        X_future = pd.DataFrame([row_future])
        try:
            y_future = float(pipeline.predict(X_future)[0])
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Model prediction failed for 'target_year': {e}")

        resp["predicted_price_target_year"] = round(y_future, 2)
        resp["years_into_future"] = years_ahead
        resp["price_change_pct"] = round((y_future - y_now) / y_now * 100, 2)

    return resp
