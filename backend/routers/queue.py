from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from database import get_db
import models
import schemas
from routers.auth import get_current_user, require_role

router = APIRouter(prefix="/queue", tags=["Triage Queue"])

PRIORITY_ORDER = {"urgent": 0, "moderate": 1, "low": 2}


@router.get("", response_model=list[schemas.ScanOut])
def get_triage_queue(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("radiologist", "admin")),
):
    """
    Returns all pending scans, sorted urgent-first, and within the same
    priority level, oldest-first — so nothing sits forgotten in the queue.
    """
    scans = (
        db.query(models.Scan)
        .options(joinedload(models.Scan.prediction))
        .filter(models.Scan.status == "pending")
        .all()
    )

    def sort_key(scan: models.Scan):
        priority = scan.prediction.priority if scan.prediction else "moderate"
        return (PRIORITY_ORDER.get(priority, 1), scan.created_at)

    scans.sort(key=sort_key)
    return scans


@router.patch("/scans/{scan_id}/review", response_model=schemas.ScanOut)
def review_scan(
    scan_id: int,
    review: schemas.ScanReview,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("radiologist", "admin")),
):
    scan = db.query(models.Scan).filter(models.Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    scan.status = review.status
    scan.reviewed_by = current_user.id
    scan.reviewed_at = datetime.utcnow()
    scan.review_notes = review.review_notes
    db.commit()
    db.refresh(scan)
    return scan
