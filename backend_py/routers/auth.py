from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import secrets
from typing import Optional

from backend_py.db import SessionLocal
from backend_py.models.users import User, Role
from backend_py.schemas.users import LoginRequest, LoginResponse, UserInfo, RoleInfo

router = APIRouter(prefix='/api/auth')
security = HTTPBearer()

# 简单内存 token 存储（生产环境应使用 JWT/Redis）
token_store: dict[str, dict] = {}


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def generate_token() -> str:
    return secrets.token_urlsafe(32)


def create_token(user_id: str, role_id: str) -> str:
    token = generate_token()
    token_store[token] = {
        'user_id': user_id,
        'role_id': role_id,
        'expires_at': (datetime.utcnow() + timedelta(days=7)).isoformat(),
    }
    return token


def verify_token(token: str) -> Optional[dict]:
    data = token_store.get(token)
    if not data:
        return None
    expires_at = datetime.fromisoformat(data['expires_at'])
    if datetime.utcnow() > expires_at:
        token_store.pop(token, None)
        return None
    return data


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> tuple[User, Role]:
    token = credentials.credentials
    token_data = verify_token(token)
    if not token_data:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    user = db.query(User).filter(User.id == token_data['user_id']).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")

    role = db.query(Role).filter(Role.id == token_data['role_id']).first()
    if not role:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Role not found")

    if role.id not in [r.id for r in user.roles]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User does not have this role")
    return user, role


@router.post('/login', response_model=LoginResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()
    if not user or not user.check_password(data.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive")

    roles = user.roles
    if not roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User has no roles assigned")

    if data.role_id:
        role = db.query(Role).filter(Role.id == data.role_id).first()
        if not role or role.id not in [r.id for r in roles]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User does not have the specified role")
    else:
        role = roles[0]

    token = create_token(user.id, role.id)
    return LoginResponse(
        token=token,
        user=UserInfo(
            id=user.id,
            username=user.username,
            email=user.email,
            name=user.name,
            is_active=user.is_active,
            roles=[RoleInfo.model_validate(r) for r in roles],
        ),
        current_role=RoleInfo.model_validate(role),
        available_roles=[RoleInfo.model_validate(r) for r in roles],
    )


@router.post('/logout')
def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    token_store.pop(token, None)
    return {'ok': True}


@router.get('/me', response_model=LoginResponse)
def get_me(user_role: tuple[User, Role] = Depends(get_current_user)):
    user, role = user_role
    roles = user.roles
    return LoginResponse(
        token='',
        user=UserInfo(
            id=user.id,
            username=user.username,
            email=user.email,
            name=user.name,
            is_active=user.is_active,
            roles=[RoleInfo.model_validate(r) for r in roles],
        ),
        current_role=RoleInfo.model_validate(role),
        available_roles=[RoleInfo.model_validate(r) for r in roles],
    )


@router.post('/switch-role')
def switch_role(
    payload: dict = Body(...),
    user_role: tuple[User, Role] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user, _ = user_role
    role_id = payload.get('role_id')
    if not role_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="role_id is required")
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role or role.id not in [r.id for r in user.roles]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User does not have this role")
    token = create_token(user.id, role.id)
    return {'token': token, 'role': RoleInfo.model_validate(role)}

