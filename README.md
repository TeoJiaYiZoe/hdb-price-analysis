# HDB Price Insight — Fullstack (React + FastAPI)

## Project Aim

The aim of this project is to provide an interactive web app for **estimating HDB resale prices** and projecting future values based on remaining lease and target year. It integrates a **machine learning model exported from a Jupyter notebook** with a **FastAPI backend** and a **React frontend**, allowing users to easily query property prices and visualize projections. This tool helps users understand price trends and the impact of lease decay on HDB flats.

## Run

### Backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

### Frontend

```bash
cd ../frontend
npm install
npm run dev
```

Open http://localhost:5173

## Future-year Projection

We call the same model twice:

1. with your inputs (price now)
2. with `remaining_lease_years - (target_year - current_year)` (projected price)

If your model expects additional features, update `INPUT_FEATURES` and the React form accordingly.

## Debug

If you are unable to run the hdbp_price_insight.ipynb,it should be your env issue. This means your Jupyter notebook in VS Code is not detecting your .venv environment—it only sees the system Python (/local/program/python/python39/python.exe). That’s why requests (and any other packages installed in .venv) are not available in your notebook.

How to fix?

1. First, open a terminal in your project folder and activate your .venv
2. Ensure your .venv has ipykernel installed
   `pip install ipykernel`
3. Add your .venv as a Jupyter kernel
   Still in the activated .venv, run
   `python -m ipykernel install --user --name=hdb-venv --display-name "Python (.venv HDB)"`
   This registers your .venv as a selectable kernel in Jupyter/VS Code.
4. Restart VS Code and select the new kernel
