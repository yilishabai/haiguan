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
            else:
                # Update permissions if role exists
                role.permissions = json.dumps(perms)
                role.name = name
                role.description = description
            return role

        admin_role = ensure_role('admin', '管理员', '系统管理员，拥有所有权限', ['*'])
        
        trade_role = ensure_role('trade', '贸易跟单员', '负责订单跟单', [
            'dashboard:read', 'orders:read', 'orders:write', 
            'enterprises:read', 'enterprises:write', 
            'collaboration:read', 'capabilities:read',
            'customs:read'
        ])
        
        customs_role = ensure_role('customs', '关务专员', '负责关务申报', [
            'dashboard:read', 'customs:read', 'customs:write', 
            'acceptance:read', 'enterprises:read'
        ])
        
        logistics_role = ensure_role('logistics', '物流调度', '负责物流调度与跟踪', [
            'dashboard:read', 'logistics:read', 'logistics:write', 
            'warehouse:read', 'customs:read'
        ])
        
        finance_role = ensure_role('finance', '财务专员', '负责结算与支付', [
            'dashboard:read', 'payment:read', 'payment:write', 'settlements:read',
            'customs:read'
        ])
        
        warehouse_role = ensure_role('warehouse', '仓储主管', '负责仓储与库存管理', [
            'dashboard:read', 'warehouse:read', 'warehouse:write', 
            'logistics:read'
        ])
        
        director_role = ensure_role('director', '供应链总监', '全局视角管理供应链', ['*'])
        
        ensure_role('operator', '操作员', '基础操作权限', [
            'dashboard:read', 'orders:read', 'customs:read', 'logistics:read', 
            'warehouse:read', 'enterprises:read', 'capabilities:read', 
            'collaboration:read', 'acceptance:read', 'payment:read'
        ])
        
        ensure_role('auditor', '审计员', '只读审计权限', [
            'dashboard:read', 'orders:read', 'customs:read', 'logistics:read', 
            'warehouse:read', 'enterprises:read', 'capabilities:read', 
            'collaboration:read', 'acceptance:read', 'payment:read', 
            'audit:read', 'users:read', 'settings:read'
        ])

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
            demo_user.roles = [trade_role, logistics_role, finance_role, customs_role]
            session.add(demo_user)
            session.commit()
    finally:
        session.close()


def seed_all():
    """统一种子入口"""
    seed_users()
    try:
        session = SessionLocal()
        from backend_py.models.enterprises import Enterprise
        import random
        from datetime import datetime, timedelta
        cnt = session.query(Enterprise).count()
        if cnt == 0:
            names = [
                '上海美妆集团有限公司','深圳电子科技有限公司','广州食品进出口公司','宁波服装贸易集团','青岛机械制造有限公司',
                '杭州跨境消费品集团','成都家居电器股份','天津酒类进出口公司','厦门贸易发展有限公司','苏州智能制造股份',
                '重庆轻工进出口公司','南京纺织品有限公司','武汉家电集团','郑州食品流通有限公司','西安电子信息股份',
                '济南葡萄酒贸易有限公司','福州小家电有限公司','合肥纺织进出口公司','大连机械制造集团','无锡新材料科技'
            ]
            regions = ['上海','深圳','广州','宁波','青岛','天津','厦门','成都','重庆','苏州','南京','武汉','郑州','西安','济南','福州','合肥','大连','无锡']
            categories = ['beauty','electronics','wine','textile','appliance']
            types = ['importer','exporter','both']
            statuses = ['active','inactive','blocked']
            base = datetime.utcnow()
            rows = []
            for i in range(1, 201):
                name = random.choice(names)
                region = random.choice(regions)
                category = random.choice(categories)
                ent = Enterprise(
                    id=f'E{i:05d}',
                    reg_no=f'{region[:2]}-{i:05d}',
                    name=name,
                    type=random.choice(types),
                    category=category,
                    region=region,
                    status=random.choices(statuses, weights=[0.8,0.15,0.05], k=1)[0],
                    compliance=round(random.uniform(80, 99.9), 1),
                    service_eligible=random.choice([0,1]),
                    active_orders=random.randint(0, 500),
                    last_active=base - timedelta(days=random.randint(0, 60))
                )
                rows.append(ent)
            session.add_all(rows)
            session.commit()
    finally:
        try:
            session.close()
        except Exception:
            pass

