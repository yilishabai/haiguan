from backend_py.db import SessionLocal


def seed_users():
    """初始化默认用户与角色（admin/operator/auditor）"""
    session = SessionLocal()
    try:
        from backend_py.models.users import User, Role
        import json

        def ensure_role(role_id: str, name: str, description: str, perms: list[str]):
            role = session.query(Role).filter(Role.id == role_id).first()
            if not role:
                role = Role(
                    id=role_id,
                    name=name,
                    description=description,
                    permissions=json.dumps(perms),
                )
                session.add(role)
            return role

        admin_role = ensure_role('admin', '管理员', '系统管理员，拥有所有权限', ['*'])
        trade_role = ensure_role('trade', '贸易跟单员', '负责订单跟单', ['orders:read', 'orders:write'])
        customs_role = ensure_role('customs', '关务专员', '负责关务申报', ['customs:read', 'customs:write'])
        logistics_role = ensure_role('logistics', '物流调度', '负责物流调度与跟踪', ['logistics:read', 'logistics:write'])
        finance_role = ensure_role('finance', '财务专员', '负责结算与支付', ['settlements:read', 'payment:write'])
        warehouse_role = ensure_role('warehouse', '仓储主管', '负责仓储与库存管理', ['warehouse:read', 'warehouse:write'])
        director_role = ensure_role('director', '供应链总监', '全局视角管理供应链', ['*'])
        ensure_role('operator', '操作员', '基础操作权限', ['orders:read', 'orders:write', 'customs:read', 'logistics:read'])
        ensure_role('auditor', '审计员', '只读审计权限', ['orders:read', 'customs:read', 'logistics:read', 'settlements:read', 'audit:read'])

        session.commit()

        admin_user = session.query(User).filter(User.username == 'admin').first()
        if not admin_user:
            admin_user = User(
                id='admin-001',
                username='admin',
                email='admin@example.com',
                name='系统管理员',
                is_active=True,
            )
            admin_user.set_password('admin')
            admin_user.roles = [admin_role]
            session.add(admin_user)
            session.commit()

        demo_user = session.query(User).filter(User.username == 'demo').first()
        if not demo_user:
            demo_user = User(
                id='demo-001',
                username='demo',
                email='demo@example.com',
                name='多角色示例用户',
                is_active=True,
            )
            demo_user.set_password('demo')
            demo_user.roles = [trade_role, logistics_role, finance_role]
            session.add(demo_user)
            session.commit()
    finally:
        session.close()


def seed_all():
    """统一种子入口"""
    seed_users()

