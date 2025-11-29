from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

engine = create_engine('sqlite:///backend_py/app.db', echo=False, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
Base = declarative_base()

def init_db():
    import backend_py.models.orders
    import backend_py.models.customs
    import backend_py.models.logistics
    import backend_py.models.settlements
    import backend_py.models.warehouse
    import backend_py.models.algorithms
    import backend_py.models.jobs
    Base.metadata.create_all(bind=engine)
