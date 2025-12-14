
from backend_py.db import SessionLocal, engine
from sqlalchemy import text

def migrate_db():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE model_execution_logs ADD COLUMN order_id VARCHAR"))
            print("Added order_id column to model_execution_logs")
        except Exception as e:
            print(f"Migration failed (maybe column exists): {e}")

if __name__ == "__main__":
    migrate_db()
