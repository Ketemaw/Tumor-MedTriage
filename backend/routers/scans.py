import os
import json
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from routers.auth import get_current_user
from config import settings
from ml.predict import predict_scan

router = APIRouter(tags=["Scans"])

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg"}
MAX_FILE_SIZE_MB = 15


@router.post("/patients/{patient_id}/scans", response_model=schemas.ScanOut)
async def upload_scan(
    patient_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type {ext} not allowed")

    contents = await file.read()
    if len(contents) / (1024 * 1024) > MAX_FILE_SIZE_MB:
        raise HTTPException(status_code=400, detail=f"File exceeds {MAX_FILE_SIZE_MB}MB limit")

    os.makedirs(settings.upload_dir, exist_ok=True)
    unique_name = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(settings.upload_dir, unique_name)
    with open(file_path, "wb") as f:
        f.write(contents)

    db_scan = models.Scan(
        patient_id=patient_id,
        uploaded_by=current_user.id,
        file_path=file_path,
        file_name=file.filename,
        status="pending",
    )
    db.add(db_scan)
    db.commit()
    db.refresh(db_scan)

   
    try:
        result = predict_scan(file_path)
        db_prediction = models.Prediction(
            scan_id=db_scan.id,
            predicted_class=result["predicted_class"],
            confidence=result["confidence"],
            priority=result["priority"],
            all_probabilities=json.dumps(result["all_probabilities"]),
        )
        db.add(db_prediction)
        db.commit()
        db.refresh(db_scan)
    except Exception as e:
     
        raise HTTPException(status_code=500, detail=f"Scan saved, but prediction failed: {str(e)}")

    return db_scan


@router.get("/patients/{patient_id}/scans", response_model=list[schemas.ScanOut])
def list_patient_scans(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return (
        db.query(models.Scan)
        .filter(models.Scan.patient_id == patient_id)
        .order_by(models.Scan.created_at.desc())
        .all()
    )


@router.get("/scans/{scan_id}", response_model=schemas.ScanOut)
def get_scan(
    scan_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    scan = db.query(models.Scan).filter(models.Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan


@router.get("/scans/{scan_id}/image")
def get_scan_image(
    scan_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    scan = db.query(models.Scan).filter(models.Scan.id == scan_id).first()
    if not scan or not os.path.exists(scan.file_path):
        raise HTTPException(status_code=404, detail="Scan image not found")
    return FileResponse(scan.file_path)
