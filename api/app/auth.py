import firebase_admin
from firebase_admin import auth as fb_auth
from firebase_admin import credentials
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

from .config import settings

cred = credentials.Certificate(settings.firebase_credentials_path)
firebase_admin.initialize_app(cred)

bearer = HTTPBearer()


class FirebaseUser(BaseModel):
    uid: str
    email: str | None = None
    role: str = "admin"
    org_id: str | None = None


async def get_current_user(
    auth_creds: HTTPAuthorizationCredentials = Depends(bearer),
) -> FirebaseUser:
    try:
        decoded = fb_auth.verify_id_token(auth_creds.credentials)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

    return FirebaseUser(
        uid=decoded["uid"],
        email=decoded.get("email"),
        role=decoded.get("role", "admin"),
        org_id=decoded.get("org_id"),
    )