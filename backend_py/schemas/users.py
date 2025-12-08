from pydantic import BaseModel
from typing import Optional, List


class RoleInfo(BaseModel):
    id: str
    name: str
    description: Optional[str]
    permissions: Optional[str]

    class Config:
        from_attributes = True


class UserInfo(BaseModel):
    id: str
    username: str
    email: Optional[str]
    name: str
    is_active: bool
    roles: List[RoleInfo]

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    username: str
    password: str
    role_id: Optional[str] = None


class LoginResponse(BaseModel):
    token: str
    user: UserInfo
    current_role: RoleInfo
    available_roles: List[RoleInfo]


class UserCreate(BaseModel):
    username: str
    password: str
    email: Optional[str] = None
    name: str
    role_ids: List[str] = []


class UserUpdate(BaseModel):
    email: Optional[str] = None
    name: Optional[str] = None
    is_active: Optional[bool] = None
    role_ids: Optional[List[str]] = None


class UserOut(BaseModel):
    id: str
    username: str
    email: Optional[str]
    name: str
    is_active: bool
    roles: List[RoleInfo]
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class RoleCreate(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    permissions: str


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[str] = None


class RoleOut(BaseModel):
    id: str
    name: str
    description: Optional[str]
    permissions: Optional[str]
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

