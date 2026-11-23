
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from uuid import uuid4
from bson import ObjectId

from database import users_collection, sessions_collection
from models import UserRegister, UserLogin
from security import hash_password, verify_password, create_access_token
from dependencies import get_current_user

router = APIRouter()


@router.post("/register")
def register_user(user: UserRegister):

    existing_user = users_collection.find_one({"email": user.email})

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    hashed_password = hash_password(user.password)

    user_data = {
        "name": user.name,
        "email": user.email,
        "password_hash": hashed_password,
        "created_at": datetime.now(timezone.utc)
    }

    result = users_collection.insert_one(user_data)

    return {
        "message": "User registered successfully",
        "user_id": str(result.inserted_id)
    }


@router.post("/login")
def login_user(user: UserLogin):

    existing_user = users_collection.find_one({"email": user.email})

    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(user.password, existing_user["password_hash"]):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    session_id = str(uuid4())

    token, expire = create_access_token(
        str(existing_user["_id"]),
        session_id
    )

    sessions_collection.insert_one({
        "session_id": session_id,
        "user_id": str(existing_user["_id"]),
        "created_at": datetime.now(timezone.utc),
        "expires_at": expire,
        "is_active": True
    })

    return {
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer",
        "session_id": session_id,
        "expires_at": expire
    }


@router.get("/me")
def get_current_user_details(
    current_user: dict = Depends(get_current_user)
):

    user = users_collection.find_one(
        {"_id": ObjectId(current_user["user_id"])},
        {"_id": 0, "name": 1, "email": 1}
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user


@router.post("/logout")
def logout_user(
    current_user: dict = Depends(get_current_user)
):

    result = sessions_collection.update_one(
        {
            "session_id": current_user["session_id"],
            "user_id": current_user["user_id"],
            "is_active": True
        },
        {
            "$set": {
                "is_active": False,
                "logged_out_at": datetime.now(timezone.utc)
            }
        }
    )

    if result.modified_count:
        return {
            "message": "Logout successful"
        }

    raise HTTPException(
        status_code=401,
        detail="Session already inactive"
    )
