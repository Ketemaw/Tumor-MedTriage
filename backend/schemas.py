from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class UserCreate(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None
    role: str = "clinic_staff"


class UserOut(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class PatientCreate(BaseModel):
    full_name: str
    age: Optional[int] = None
    sex: Optional[str] = None
    medical_record_number: Optional[str] = None


class PatientOut(BaseModel):
    id: int
    full_name: str
    age: Optional[int]
    sex: Optional[str]
    medical_record_number: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class PredictionOut(BaseModel):
    id: int
    predicted_class: str
    confidence: float
    priority: str
    all_probabilities: str
    created_at: datetime

    class Config:
        from_attributes = True


class ScanReview(BaseModel):
    status: str  # "reviewed" | "cleared"
    review_notes: Optional[str] = None


class ScanOut(BaseModel):
    id: int
    patient_id: int
    file_name: str
    status: str
    reviewed_by: Optional[int]
    reviewed_at: Optional[datetime]
    review_notes: Optional[str]
    created_at: datetime
    prediction: Optional[PredictionOut] = None

    class Config:
        from_attributes = True
