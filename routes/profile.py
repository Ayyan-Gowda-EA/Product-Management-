from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File
)
from fastapi.responses import Response
from datetime import datetime, timezone
from bson.binary import Binary
from PIL import Image, UnidentifiedImageError
from io import BytesIO

from database import profiles_collection
from models import UserProfile
from dependencies import get_current_user


router = APIRouter()

MAX_FILE_SIZE = 2 * 1024 * 1024

ALLOWED_IMAGE_FORMATS = {
    "JPEG": "image/jpeg",
    "PNG": "image/png"
}


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
        {
            "_id": 0,
            "profile_picture": 0,
            "profile_picture_type": 0
        }
    )

    if not profile:
        return {
            "profile_completed": False,
            "has_profile_picture": False,
            "message": "Please complete your profile"
        }

    return profile


@router.post("/profile/picture")
def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):

    user_id = current_user["user_id"]

    try:
        image_data = file.file.read(MAX_FILE_SIZE + 1)
    finally:
        file.file.close()

    if not image_data:
        raise HTTPException(
            status_code=400,
            detail="Please select a valid image"
        )

    if len(image_data) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Profile picture must not exceed 2 MB"
        )

    try:
        with Image.open(BytesIO(image_data)) as image:

            image_format = image.format

            if image_format not in ALLOWED_IMAGE_FORMATS:
                raise HTTPException(
                    status_code=400,
                    detail="Only JPG, JPEG and PNG images are allowed"
                )

            if image.width * image.height > 16000000:
                raise HTTPException(
                    status_code=400,
                    detail="Image dimensions are too large"
                )

            image.verify()

        with Image.open(BytesIO(image_data)) as image:
            image.load()

    except (
        UnidentifiedImageError,
        OSError,
        ValueError,
        SyntaxError,
        Image.DecompressionBombError
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid or corrupted image file"
        )

    profiles_collection.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "profile_picture": Binary(image_data),
                "profile_picture_type": ALLOWED_IMAGE_FORMATS[
                    image_format
                ],
                "has_profile_picture": True,
                "updated_at": datetime.now(timezone.utc)
            },
            "$setOnInsert": {
                "profile_completed": False
            }
        },
        upsert=True
    )

    return {
        "message": "Profile picture uploaded successfully",
        "has_profile_picture": True
    }


@router.get("/profile/picture")
def get_profile_picture(
    current_user: dict = Depends(get_current_user)
):

    user_id = current_user["user_id"]

    profile = profiles_collection.find_one(
        {"user_id": user_id},
        {
            "_id": 0,
            "profile_picture": 1,
            "profile_picture_type": 1
        }
    )

    if not profile or not profile.get("profile_picture"):
        raise HTTPException(
            status_code=404,
            detail="Profile picture not found"
        )

    return Response(
        content=bytes(profile["profile_picture"]),
        media_type=profile["profile_picture_type"],
        headers={
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff"
        }
    )


@router.delete("/profile/picture")
def delete_profile_picture(
    current_user: dict = Depends(get_current_user)
):

    user_id = current_user["user_id"]

    result = profiles_collection.update_one(
        {
            "user_id": user_id,
            "profile_picture": {"$exists": True}
        },
        {
            "$unset": {
                "profile_picture": "",
                "profile_picture_type": ""
            },
            "$set": {
                "has_profile_picture": False,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Profile picture not found"
        )

    return {
        "message": "Profile picture removed successfully",
        "has_profile_picture": False
    }