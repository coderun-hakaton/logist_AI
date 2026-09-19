import os
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient

router = APIRouter()

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "karvonboshi")

_mongo = AsyncIOMotorClient(MONGO_URL)
apps_col = _mongo[DB_NAME]["driver_applications"]

ApplicationStatus = Literal["pending", "approved", "rejected"]


class DriverApplicationCreate(BaseModel):
    first_name: str = Field(min_length=1)
    last_name: str = Field(min_length=1)
    phone: str = Field(min_length=5)
    password: str = Field(min_length=6)
    city: Optional[str] = None
    experience_years: Optional[int] = None
    has_vehicle: bool = True
    car_brand: Optional[str] = None
    car_plate: Optional[str] = None
    capacity_kg: Optional[int] = None
    license_categories: Optional[str] = None
    license_image_url: Optional[str] = None
    tech_passport_image_url: Optional[str] = None


class DriverApplication(BaseModel):
    id: str
    first_name: str
    last_name: str
    phone: str
    password: Optional[str] = None
    city: Optional[str] = None
    experience_years: Optional[int] = None
    has_vehicle: bool = True
    car_brand: Optional[str] = None
    car_plate: Optional[str] = None
    capacity_kg: Optional[int] = None
    license_categories: Optional[str] = None
    license_image_url: Optional[str] = None
    tech_passport_image_url: Optional[str] = None
    status: ApplicationStatus = "pending"
    driver_id: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[str] = None
    rejection_reason: Optional[str] = None
    created_at: str
    updated_at: str


class ReviewRequest(BaseModel):
    status: ApplicationStatus
    reviewed_by: Optional[str] = None
    driver_id: Optional[str] = None
    rejection_reason: Optional[str] = None


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _serialize(doc: dict) -> dict:
    doc = dict(doc)
    doc.pop("_id", None)
    return doc


@router.post("/driver-applications", response_model=DriverApplication, status_code=201)
async def create_application(payload: DriverApplicationCreate):
    existing = await apps_col.find_one({"phone": payload.phone, "status": "pending"})
    if existing:
        raise HTTPException(
            status_code=409,
            detail="Bu telefon raqami bilan ko'rib chiqilmagan ariza allaqachon mavjud.",
        )

    now = _now()
    doc = {
        "id": str(uuid.uuid4()),
        **payload.model_dump(),
        "status": "pending",
        "driver_id": None,
        "reviewed_by": None,
        "reviewed_at": None,
        "rejection_reason": None,
        "created_at": now,
        "updated_at": now,
    }
    await apps_col.insert_one(dict(doc))
    return DriverApplication(**_serialize(doc))


@router.get("/driver-applications", response_model=List[DriverApplication])
async def list_applications(status: Optional[ApplicationStatus] = None):
    query: dict = {}
    if status:
        query["status"] = status
    docs = await apps_col.find(query).sort("created_at", -1).to_list(500)
    return [DriverApplication(**_serialize(d)) for d in docs]


@router.get("/driver-applications/{app_id}", response_model=DriverApplication)
async def get_application(app_id: str):
    doc = await apps_col.find_one({"id": app_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Ariza topilmadi.")
    return DriverApplication(**_serialize(doc))


@router.patch("/driver-applications/{app_id}", response_model=DriverApplication)
async def review_application(app_id: str, payload: ReviewRequest):
    doc = await apps_col.find_one({"id": app_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Ariza topilmadi.")

    update = {
        "status": payload.status,
        "reviewed_by": payload.reviewed_by,
        "reviewed_at": _now(),
        "updated_at": _now(),
        # Ko'rib chiqilgach parol saqlanmaydi
        "password": None,
    }
    if payload.status == "approved":
        update["driver_id"] = payload.driver_id
    if payload.status == "rejected":
        update["rejection_reason"] = payload.rejection_reason

    await apps_col.update_one({"id": app_id}, {"$set": update})
    fresh = await apps_col.find_one({"id": app_id})
    return DriverApplication(**_serialize(fresh))
