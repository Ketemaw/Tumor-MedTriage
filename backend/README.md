# MedTriage Backend

## Setup
1. Copy `.env.example` to `.env` and fill in your real DATABASE_URL and SECRET_KEY
   (generate a secret key with: python -c "import secrets; print(secrets.token_hex(32))")
2. Place your trained `.h5` model in `ml_models/` (path must match MODEL_PATH in .env)
3. Create a virtual environment and install dependencies:
   python -m venv venv
   venv\Scripts\activate      (Windows)
   pip install -r requirements.txt
4. Create the Postgres database: CREATE DATABASE medtriage;
5. Create tables (or set up Alembic migrations):
   python -c "from database import engine, Base; import models; Base.metadata.create_all(engine)"
6. Run the server:
   uvicorn main:app --reload

## Verified end-to-end (in a sandbox test pass before delivery)
- Signup (clinic_staff and radiologist roles)
- Login + JWT auth
- RBAC: clinic_staff blocked from /queue (403), radiologist allowed
- Patient creation
- Scan upload -> real model prediction -> priority assignment
- Triage queue sorted by urgency
- Review/clear workflow
- Duplicate email rejection

Note: bcrypt is pinned to 4.0.1 in requirements.txt to avoid a known
passlib/bcrypt version conflict that causes a "password cannot be longer
than 72 bytes" error on newer bcrypt releases.
