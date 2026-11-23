
import os
import jwt

from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jwt.exceptions import InvalidTokenError

from database import sessions_collection

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

security = HTTPBearer(
    scheme_name="JWT Authentication",
    description="Enter your JWT access token"
)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("sub")
        session_id = payload.get("sid")

        if not user_id or not session_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token"
            )

        session = sessions_collection.find_one({
            "session_id": session_id,
            "user_id": user_id,
            "is_active": True
        })

        if not session:
            raise HTTPException(
                status_code=401,
                detail="Session expired or logged out"
            )

        return {
            "user_id": user_id,
            "session_id": session_id
        }

    except InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )
