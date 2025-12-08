from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from backend_py.db import SessionLocal
from backend_py.models.users import User, Role
from backend_py.schemas.users import (
    UserCreate,
    UserUpdate,
    UserOut,
    RoleCreate,
    RoleUpdate,
    RoleOut,
)
from backend_py.routers.auth import get_current_user

ROLES_FIXED = True

router = APIRouter(prefix='/api/users')


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get('', response_model=List[UserOut])
def list_users(q: str = '', offset: int = 0, limit: int = 10, db: Session = Depends(get_db), user_role=Depends(get_current_user)):
    query = db.query(User)
    if q:
        query = query.filter(
            (User.username.like(f'%{q}%'))
            | (User.name.like(f'%{q}%'))
            | (User.email.like(f'%{q}%'))
        )
    users = query.order_by(User.created_at.desc()).offset(offset).limit(limit).all()
    result: List[UserOut] = []
    for u in users:
        result.append(
            UserOut(
                id=u.id,
                username=u.username,
                email=u.email,
                name=u.name,
                is_active=u.is_active,
                roles=[
                    RoleOut(
                        id=r.id,
                        name=r.name,
                        description=r.description,
                        permissions=r.permissions,
                        created_at=r.created_at.isoformat(),
                        updated_at=r.updated_at.isoformat(),
                    )
                    for r in u.roles
                ],
                created_at=u.created_at.isoformat(),
                updated_at=u.updated_at.isoformat(),
            )
        )
    return result


@router.get('/count')
def count_users(q: str = '', db: Session = Depends(get_db), user_role=Depends(get_current_user)):
    query = db.query(User)
    if q:
        query = query.filter(
            (User.username.like(f'%{q}%'))
            | (User.name.like(f'%{q}%'))
            | (User.email.like(f'%{q}%'))
        )
    return {'count': query.count()}


@router.get('/{user_id}', response_model=UserOut)
def get_user(user_id: str, db: Session = Depends(get_db), user_role=Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserOut(
        id=user.id,
        username=user.username,
        email=user.email,
        name=user.name,
        is_active=user.is_active,
        roles=[
            RoleOut(
                id=r.id,
                name=r.name,
                description=r.description,
                permissions=r.permissions,
                created_at=r.created_at.isoformat(),
                updated_at=r.updated_at.isoformat(),
            )
            for r in user.roles
        ],
        created_at=user.created_at.isoformat(),
        updated_at=user.updated_at.isoformat(),
    )


@router.post('', response_model=UserOut)
def create_user(data: UserCreate, db: Session = Depends(get_db), user_role=Depends(get_current_user)):
    _, role = user_role
    if role.id != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only administrators can create users")

    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists")
    if data.email and db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists")

    new_user = User(
        id=f'user-{uuid.uuid4().hex[:8]}',
        username=data.username,
        email=data.email,
        name=data.name,
        is_active=True,
    )
    new_user.set_password(data.password)
    if data.role_ids:
        roles = db.query(Role).filter(Role.id.in_(data.role_ids)).all()
        new_user.roles = roles

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return UserOut(
        id=new_user.id,
        username=new_user.username,
        email=new_user.email,
        name=new_user.name,
        is_active=new_user.is_active,
        roles=[
            RoleOut(
                id=r.id,
                name=r.name,
                description=r.description,
                permissions=r.permissions,
                created_at=r.created_at.isoformat(),
                updated_at=r.updated_at.isoformat(),
            )
            for r in new_user.roles
        ],
        created_at=new_user.created_at.isoformat(),
        updated_at=new_user.updated_at.isoformat(),
    )


@router.put('/{user_id}', response_model=UserOut)
def update_user(user_id: str, data: UserUpdate, db: Session = Depends(get_db), user_role=Depends(get_current_user)):
    _, role = user_role
    if role.id != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only administrators can update users")

    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    if data.email is not None:
        existing = db.query(User).filter(User.email == data.email, User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists")
        target.email = data.email
    if data.name is not None:
        target.name = data.name
    if data.is_active is not None:
        target.is_active = data.is_active
    if data.role_ids is not None:
        roles = db.query(Role).filter(Role.id.in_(data.role_ids)).all()
        target.roles = roles

    db.commit()
    db.refresh(target)
    return UserOut(
        id=target.id,
        username=target.username,
        email=target.email,
        name=target.name,
        is_active=target.is_active,
        roles=[
            RoleOut(
                id=r.id,
                name=r.name,
                description=r.description,
                permissions=r.permissions,
                created_at=r.created_at.isoformat(),
                updated_at=r.updated_at.isoformat(),
            )
            for r in target.roles
        ],
        created_at=target.created_at.isoformat(),
        updated_at=target.updated_at.isoformat(),
    )


@router.delete('/{user_id}')
def delete_user(user_id: str, db: Session = Depends(get_db), user_role=Depends(get_current_user)):
    current_user, role = user_role
    if role.id != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only administrators can delete users")
    if current_user.id == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete yourself")

    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(target)
    db.commit()
    return {'ok': True}


@router.post('/{user_id}/reset-password')
def reset_password(user_id: str, new_password: str, db: Session = Depends(get_db), user_role=Depends(get_current_user)):
    _, role = user_role
    if role.id != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only administrators can reset passwords")
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    target.set_password(new_password)
    db.commit()
    return {'ok': True}


@router.get('/roles', response_model=List[RoleOut])
def list_roles(db: Session = Depends(get_db), user_role=Depends(get_current_user)):
    roles = db.query(Role).all()
    return [
        RoleOut(
            id=r.id,
            name=r.name,
            description=r.description,
            permissions=r.permissions,
            created_at=r.created_at.isoformat(),
            updated_at=r.updated_at.isoformat(),
        )
        for r in roles
    ]


@router.post('/roles', response_model=RoleOut)
def create_role(data: RoleCreate, db: Session = Depends(get_db), user_role=Depends(get_current_user)):
    _, role = user_role
    if role.id != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only administrators can create roles")
    if ROLES_FIXED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="角色为固定配置，禁止新增")
    if db.query(Role).filter(Role.id == data.id).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role ID already exists")

    new_role = Role(
        id=data.id,
        name=data.name,
        description=data.description,
        permissions=data.permissions,
    )
    db.add(new_role)
    db.commit()
    db.refresh(new_role)
    return RoleOut(
        id=new_role.id,
        name=new_role.name,
        description=new_role.description,
        permissions=new_role.permissions,
        created_at=new_role.created_at.isoformat(),
        updated_at=new_role.updated_at.isoformat(),
    )


@router.put('/roles/{role_id}', response_model=RoleOut)
def update_role(role_id: str, data: RoleUpdate, db: Session = Depends(get_db), user_role=Depends(get_current_user)):
    _, role = user_role
    if role.id != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only administrators can update roles")
    if ROLES_FIXED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="角色为固定配置，禁止编辑")

    target = db.query(Role).filter(Role.id == role_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Role not found")

    if data.name is not None:
        target.name = data.name
    if data.description is not None:
        target.description = data.description
    if data.permissions is not None:
        target.permissions = data.permissions

    db.commit()
    db.refresh(target)
    return RoleOut(
        id=target.id,
        name=target.name,
        description=target.description,
        permissions=target.permissions,
        created_at=target.created_at.isoformat(),
        updated_at=target.updated_at.isoformat(),
    )


@router.delete('/roles/{role_id}')
def delete_role(role_id: str, db: Session = Depends(get_db), user_role=Depends(get_current_user)):
    _, role = user_role
    if role.id != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only administrators can delete roles")
    if ROLES_FIXED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="角色为固定配置，禁止删除")
    if role_id in ['admin', 'operator', 'auditor']:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete system default roles")

    target = db.query(Role).filter(Role.id == role_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Role not found")

    db.delete(target)
    db.commit()
    return {'ok': True}

