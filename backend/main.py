from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import auth, users, patients, scans, queue

app = FastAPI(title="MedTriage API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(patients.router)
app.include_router(scans.router)
app.include_router(queue.router)
