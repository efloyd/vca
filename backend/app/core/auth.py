from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from backend.app.config import settings

security = HTTPBearer()


def verify_admin(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    if credentials.credentials != settings.ADMIN_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin API key",
        )
    return credentials.credentials
