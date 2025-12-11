from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend_py.db import init_db
from backend_py.routers.orders import router as orders_router
from backend_py.routers.customs import router as customs_router
from backend_py.routers.logistics import router as logistics_router
from backend_py.routers.settlements import router as settlements_router
from backend_py.routers.warehouse import router as warehouse_router
from backend_py.routers.algorithms import router as algorithms_router
from backend_py.routers.business_models import router as business_models_router
from backend_py.routers.enterprises import router as enterprises_router
from backend_py.routers.jobs import router as jobs_router
from backend_py.routers.risk import router as risk_router
from backend_py.routers.model_metrics import router as model_metrics_router
from backend_py.routers.auth import router as auth_router
from backend_py.routers.users import router as users_router
from backend_py.seed import seed_all

app = FastAPI()

# 初始化数据库 & 基础数据
init_db()
seed_all()

# CORS 设置，允许本地前端访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 路由注册
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(orders_router)
app.include_router(customs_router)
app.include_router(logistics_router)
app.include_router(settlements_router)
app.include_router(warehouse_router)
app.include_router(algorithms_router)
app.include_router(business_models_router)
app.include_router(enterprises_router)
app.include_router(jobs_router)
app.include_router(risk_router)
app.include_router(model_metrics_router)


@app.get('/api/health')
def health():
    return {'ok': True}

