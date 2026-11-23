import os
import jwt
from datetime import datetime, timedelta, timezone
from pwdlib import PasswordHash
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
SESSION_EXPIRE_DAYS = int(os.getenv("SESSION_EXPIRE_DAYS", "7"))

password_hash = PasswordHash.recommended()


def hash_password(password: str):
    return password_hash.hash(password)


def verify_password(plain_password: str, hashed_password: str):
    return password_hash.verify(plain_password, hashed_password)


def create_access_token(user_id: str, session_id: str):
    expire = datetime.now(timezone.utc) + timedelta(days=SESSION_EXPIRE_DAYS)

    payload = {
        "sub": user_id,
        "sid": session_id,
        "exp": expire
    }

    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    return token, expire