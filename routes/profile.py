
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone

from database import profiles_collection
from models import UserProfile
from dependencies import get_current_user

router = APIRouter()


@router.post("/profile")
def create_or_update_profile(
    profile: UserProfile,
    current_user: dict = Depends(get_current_user)
):

    user_id = current_user["user_id"]

    profile_data = profile.model_dump()

    profile_data["user_id"] = user_id
    profile_data["profile_completed"] = True
    profile_data["updated_at"] = datetime.now(timezone.utc)

    profiles_collection.update_one(
        {"user_id": user_id},
        {"$set": profile_data},
        upsert=True
    )

    return {
        "message": "Profile saved successfully",
        "profile_completed": True
    }


@router.get("/profile")
def get_profile(
    current_user: dict = Depends(get_current_user)
):

    user_id = current_user["user_id"]

    profile = profiles_collection.find_one(
        {"user_id": user_id},
        {"_id": 0}
    )

    if not profile:
        return {
            "profile_completed": False,
            "message": "Please complete your profile"
        }

    return profile
