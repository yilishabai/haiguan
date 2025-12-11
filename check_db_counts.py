import sqlite3
import os

DB_PATH = r'D:\flb\haiguan3\backend_py\app.db'

def check_counts():
    if not os.path.exists(DB_PATH):
        print(f"DB not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    queries = [
        ("Total Orders", "SELECT COUNT(*) FROM orders"),
        ("Orders (status in processing,customs,shipping,completed)", "SELECT COUNT(*) FROM orders WHERE status IN ('processing', 'customs', 'shipping', 'completed')"),
        ("Settlements (Total)", "SELECT COUNT(*) FROM settlements"),
        ("Settlements (processing/completed)", "SELECT COUNT(*) FROM settlements WHERE status IN ('processing', 'completed')"),
        ("Customs Headers (Total)", "SELECT COUNT(*) FROM customs_headers"),
        ("Customs Headers (status!=declared)", "SELECT COUNT(*) FROM customs_headers WHERE status!='declared'"),
        ("Customs Headers (status=cleared)", "SELECT COUNT(*) FROM customs_headers WHERE status='cleared'"),
        ("Logistics (Total)", "SELECT COUNT(*) FROM logistics"),
        ("Logistics (status!=pickup)", "SELECT COUNT(*) FROM logistics WHERE status!='pickup'"),
        ("Logistics (status in transit,completed)", "SELECT COUNT(*) FROM logistics WHERE status IN ('transit', 'completed')"),
        ("Logistics (status=completed)", "SELECT COUNT(*) FROM logistics WHERE status='completed'"),
    ]

    print(f"{'Metric':<50} | {'Count':<10}")
    print("-" * 65)
    for name, sql in queries:
        try:
            cursor.execute(sql)
            count = cursor.fetchone()[0]
            print(f"{name:<50} | {count:<10}")
        except Exception as e:
            print(f"{name:<50} | Error: {e}")

    conn.close()

if __name__ == "__main__":
    check_counts()
