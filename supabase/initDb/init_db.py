import sqlite3
import random
import uuid
import os
import json
import time
from datetime import datetime, timedelta
from faker import Faker

# --- 1. 基础配置 ---
# 数据库路径（固定相对于脚本目录）
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../backend_py/app.db'))
# 企业名单 Excel 文件名
ENTERPRISE_FILE = '生成的企业名单.xlsx'

NUM_ORDERS = 321542   # 生成订单数量
BATCH_SIZE = 500    # 批量提交阈值

# 初始化 Faker
fake = Faker('zh_CN')

# 尝试导入 openpyxl，用于读取 Excel
try:
    import openpyxl
except ImportError:
    print("❌ 错误：缺少 openpyxl 库，无法读取 Excel 文件。")
    print("请运行: pip install openpyxl")
    exit(1)

# --- 2. 严格枚举 (来源于数据字典) ---
CATEGORIES = ['beauty', 'electronics', 'wine', 'textile', 'appliance']
CURRENCIES = ['CNY', 'USD', 'EUR', 'GBP']
ORDER_STATUSES = ['pending', 'processing', 'customs', 'shipping', 'completed', 'blocked']
SETTLEMENT_STATUSES = ['pending', 'processing', 'completed', 'failed']
LOGISTICS_STATUSES = ['pickup', 'transit', 'customs', 'completed']
CUSTOMS_STATUSES = ['declared', 'cleared', 'held', 'inspecting']
RISK_LEVELS = ['low', 'medium', 'high']

# --- 3. 数据加载与语料池 ---

def load_enterprises_from_excel():
    """
    使用 openpyxl 读取 Excel 文件。
    读取第一个 Sheet 的第一列作为企业名称。
    """
    pool = []
    file_path = os.path.join(os.path.dirname(__file__), ENTERPRISE_FILE)
    
    if os.path.exists(file_path):
        print(f"📂 发现 Excel 文件: {ENTERPRISE_FILE}，正在读取...")
        try:
            workbook = openpyxl.load_workbook(file_path, read_only=True)
            sheet = workbook.active # 获取第一个 Sheet
            
            # 遍历第一列 (A列)
            for row in sheet.iter_rows(min_row=1, max_col=1, values_only=True):
                if row and row[0]:
                    val = str(row[0]).strip()
                    # 简单的表头过滤
                    if val not in ['企业名称', 'Company Name', 'Name', '企业', '名称']:
                        pool.append(val)
                        
            print(f"✅ 成功加载 {len(pool)} 家企业名称。")
        except Exception as e:
            print(f"⚠️ 读取 Excel 出错 ({e})，将回退到模拟生成模式。")
    else:
        print(f"⚠️ 未找到文件 '{ENTERPRISE_FILE}'，将回退到模拟生成模式。")

    # 如果没读到数据，回退到 Faker 生成
    if not pool:
        print("🎲 未读取到有效数据，正在使用 Faker 生成虚拟企业名单...")
        suffixes = ['进出口有限公司', '供应链管理公司', '国际贸易部', '跨境电商集团', '物流科技公司']
        for _ in range(200):
            pool.append(f"{fake.city()}{fake.word()}{random.choice(suffixes)}")
            
    return pool

# 加载企业池
ENTERPRISE_POOL = load_enterprises_from_excel()

# 商品与HS编码映射
PRODUCT_MAP = {
    'beauty': [("玻尿酸补水面膜", "3304.99.00"), ("赋活抗皱眼霜", "3304.91.00"), ("纳米防晒喷雾", "3304.99.00")],
    'electronics': [("5G通信模组", "8517.62.99"), ("工业控制芯片", "8542.31.00"), ("柔性OLED屏", "8524.91.00")],
    'wine': [("波尔多AOC干红", "2204.21.00"), ("苏格兰威士忌", "2208.30.00"), ("精酿小麦啤酒", "2203.00.00")],
    'textile': [("高支棉衬衫面料", "5208.32.00"), ("聚酯纤维功能布", "5407.52.00"), ("真丝刺绣围巾", "6214.10.00")],
    'appliance': [("智能扫地机器人", "8508.11.00"), ("高速负离子吹风机", "8516.31.00"), ("嵌入式洗碗机", "8422.11.00")]
}

# --- 4. 辅助工具函数 ---

def get_iso_time(delta_days=0, base_time=None):
    if base_time:
        dt = base_time
    else:
        dt = datetime.now()
    target = dt + timedelta(days=delta_days, hours=random.randint(-5, 5))
    return target.strftime("%Y-%m-%dT%H:%M:%S.000Z")

def get_date_str(dt_obj):
    return dt_obj.strftime("%Y-%m-%d")

def generate_distinct_code(algo_name, category):
    """生成具有明显差异的 Python 伪代码"""
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    if category == 'optimization':
        return f"""# Algorithm: {algo_name}
# Category: Optimization (Linear Programming)
# Generated: {ts}

import numpy as np
from scipy.optimize import linprog

class LogisticsOptimizer:
    '''
    Solves transportation problems to minimize cost under capacity constraints.
    '''
    def __init__(self, cost_matrix, supply, demand):
        self.c = cost_matrix
        self.supply = supply
        self.demand = demand

    def solve(self):
        # Flatten constraints for SciPy linprog
        print("Initializing simplex algorithm...")
        res = linprog(c=self.c, A_eq=self.supply, b_eq=self.demand)
        
        if res.success:
            return {{
                "status": "OPTIMAL",
                "min_cost": round(res.fun, 2),
                "flow": res.x.tolist()
            }}
        else:
            return {{"status": "INFEASIBLE", "error": res.message}}
"""
    elif category == 'decision':
        return f"""# Algorithm: {algo_name}
# Category: Decision Support (XGBoost)
# Generated: {ts}

import xgboost as xgb
import pandas as pd
from core.io import DataLoader

MODEL_FILE = 'weights/{algo_name}.json'

class FraudDetector:
    def __init__(self):
        self.bst = None
        self.loader = DataLoader()

    def load_model(self):
        self.bst = xgb.Booster()
        self.bst.load_model(MODEL_FILE)
        print(f"XGBoost model loaded from {{MODEL_FILE}}")

    def predict(self, transaction_id):
        '''
        Returns fraud probability (0-1)
        '''
        features = self.loader.get_features(transaction_id)
        dmatrix = xgb.DMatrix(pd.DataFrame([features]))
        
        score = self.bst.predict(dmatrix)[0]
        
        return {{
            "id": transaction_id,
            "risk_score": float(score),
            "verdict": "BLOCK" if score > 0.9 else "PASS"
        }}
"""
    elif category == 'inventory':
        return f"""# Algorithm: {algo_name}
# Category: Inventory Control (Exponential Smoothing)
# Generated: {ts}

class DemandForecaster:
    '''
    Implements Holt-Winters Exponential Smoothing for seasonal demand.
    '''
    def __init__(self, alpha=0.4, beta=0.2, gamma=0.3):
        self.alpha = alpha
        self.beta = beta
        self.gamma = gamma
        self.seasonality = 12 # Monthly seasonality

    def fit(self, history):
        level = sum(history) / len(history)
        trend = (history[-1] - history[0]) / len(history)
        
        print("Fitting model parameters...")
        # Iterative update simulation
        for val in history:
            prev_level = level
            level = self.alpha * val + (1 - self.alpha) * (level + trend)
            trend = self.beta * (level - prev_level) + (1 - self.beta) * trend
            
        return {{
            "next_period_forecast": int(level + trend),
            "confidence_interval": [int(level * 0.9), int(level * 1.1)]
        }}
"""
    else: # Control / General
        return f"""# Algorithm: {algo_name}
# Category: Process Control (PID Controller)
# Generated: {ts}

import time

class TemperatureController:
    def __init__(self, kp, ki, kd, setpoint):
        self.kp = kp
        self.ki = ki
        self.kd = kd
        self.setpoint = setpoint
        self.prev_error = 0
        self.integral = 0

    def update(self, current_value):
        error = self.setpoint - current_value
        self.integral += error
        derivative = error - self.prev_error
        
        output = (self.kp * error) + (self.ki * self.integral) + (self.kd * derivative)
        
        self.prev_error = error
        return {{
            "control_signal": max(0, min(100, output)), # Clamp 0-100%
            "error_margin": round(error, 4),
            "timestamp": time.time()
        }}
"""

# --- 5. 核心逻辑 ---

def clean_database(cursor):
    """清理旧数据，保留用户表"""
    print("🧹 正在执行全量数据清理 (保留 Users/Roles)...")
    tables_to_clear = [
        'orders', 'settlements', 'logistics', 'inventory', 
        'algorithms', 'business_models', 'jobs', 
        'model_metrics', 'model_execution_logs', 
        'customs_headers', 'customs_items'
    ]
    for table in tables_to_clear:
        try:
            cursor.execute(f"DELETE FROM {table}")
            cursor.execute(f"DELETE FROM sqlite_sequence WHERE name='{table}'")
        except sqlite3.OperationalError:
            pass
    print("   已清除所有业务交易数据。")

def generate_algo_and_models(cursor):
    print("🧠 正在生成 25+ 算法与业务模型库...")
    
    # 1. 算法库
    algo_seeds = [
        ("仓储路径蚁群优化算法", "optimization"), ("多式联运协同调度引擎", "coordination"),
        ("库存动态安全水位模型", "inventory"), ("自动化设备控制逻辑", "control"),
        ("跨境贸易风险决策树", "decision"), ("集装箱装载率计算器", "optimization"),
        ("关务NLP合规审查", "decision"), ("汇率波动LSTM预测", "decision"),
        ("冷链温度异常检测", "control"), ("订单自动拆单算法", "coordination"),
        ("供应链弹性评分模型", "decision"), ("AGV小车调度系统", "control"),
        ("滞销品预警分析", "inventory"), ("运费实时竞价算法", "optimization"),
        ("OCR单证识别核心", "control"), ("HS编码智能归类", "decision"),
        ("退货物流网络规划", "optimization"), ("供应商信用评级", "decision"),
        ("港口拥堵指数计算", "coordination"), ("补货量线性回归预测", "inventory"),
        ("碳排放计算器V2", "decision"), ("最后一公里配送路由", "optimization"),
        ("危险品合规扫描", "control"), ("跨境支付反洗钱", "decision"),
        ("保税仓容积率优化", "inventory")
    ]
    
    algos = []
    for i, (name, cat) in enumerate(algo_seeds):
        algos.append((
            str(uuid.uuid4()), name, cat, 
            f"v{random.randint(1,5)}.{random.randint(0,9)}", 
            random.choice(['active', 'active', 'testing']), 
            round(random.uniform(85.0, 99.9), 1),
            round(random.uniform(20.0, 98.0), 1),
            random.randint(1000, 500000),
            f"针对{cat}场景的高性能算法，支持实时调用。",
            json.dumps(["GPU加速", "自动容错", "实时日志"], ensure_ascii=False),
            get_iso_time(), f"{fake.last_name()}博士",
            generate_distinct_code(f"Algo_{i}", cat)
        ))
    cursor.executemany("INSERT INTO algorithms VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)", algos)

    # 2. 业务模型
    model_seeds = [
        ("跨境电商B2B直接出口(9710)", "B2B"), ("跨境电商出口海外仓(9810)", "B2B"),
        ("网购保税进口(1210)", "Import"), ("直购进口(9610)", "Import"),
        ("一般贸易进口(0110)", "General"), ("进料加工(0200)", "Processing"),
        ("保税物流中心进出境", "Logistics"), ("海南离岛免税监管", "Tax"),
        ("市场采购贸易(1039)", "Market"), ("快件进出境A类", "Express"),
        ("RCEP原产地规则判定", "Compliance"), ("两步申报业务流程", "Customs"),
        ("跨境支付反洗钱模型", "Finance"), ("出口退税智能计算", "Tax"),
        ("AEO高级认证标准模型", "Compliance"), ("冷链食品溯源监管", "Traceability"),
        ("危险化学品进出口风控", "Safety"), ("知识产权海关保护", "IPR"),
        ("濒危物种进出口核查", "Compliance"), ("自动进口许可证管理", "License"),
        ("中欧班列通关协调", "Logistics"), ("海运舱单预申报", "Customs"),
        ("跨境电商退货中心仓", "Logistics"), ("关税保证保险风控", "Insurance"),
        ("加工贸易单耗管理", "Processing")
    ]
    
    models = []
    for i, (name, cat) in enumerate(model_seeds):
        models.append((
            str(uuid.uuid4()), name, cat, f"2025.R{i}", 
            random.choice(['active', 'active', 'development']),
            random.randint(50, 2000), random.randint(5000, 500000),
            f"基于海关最新公告的{name}标准业务模型。",
            json.dumps({"type": "standard", "region": "CN"}, ensure_ascii=False),
            json.dumps({"level": "Strict", "audit": "Annual"}, ensure_ascii=False),
            json.dumps([str(x) for x in range(1, random.randint(3,8))]),
            round(random.uniform(90.0, 99.9), 1),
            get_iso_time(), f"{fake.company()}关务部"
        ))
    cursor.executemany("INSERT INTO business_models VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)", models)

def generate_inventory(cursor):
    print("📦 正在根据商品类别初始化库存...")
    inv_data = []
    all_products = [p[0] for cat in PRODUCT_MAP.values() for p in cat]
    for prod_name in all_products:
        inv_data.append((
            prod_name,
            random.randint(1000, 5000), random.randint(5000, 10000),
            random.randint(200, 800), random.randint(100, 600),
            random.randint(60, 100)
        ))
    cursor.executemany("INSERT INTO inventory VALUES (?,?,?,?,?,?)", inv_data)

def generate_transactions(cursor, conn):
    print(f"💸 正在生成 {NUM_ORDERS} 条订单流 (使用 Excel 加载的 {len(ENTERPRISE_POOL)} 家企业)...")
    
    buffer = {
        'orders': [], 'settlements': [], 'logistics': [],
        'customs_headers': [], 'customs_items': []
    }
    
    for _ in range(NUM_ORDERS):
        order_id = str(uuid.uuid4())
        category = random.choice(CATEGORIES)
        enterprise = random.choice(ENTERPRISE_POOL)
        base_time = fake.date_time_between(start_date='-1y', end_date='now')
        status = random.choices(ORDER_STATUSES, weights=[10, 20, 15, 20, 30, 5], k=1)[0]
        
        # 1. Orders
        buffer['orders'].append((
            order_id,
            f"ORD{base_time.strftime('%Y%m%d')}{random.randint(10000, 99999)}",
            enterprise, category, status,
            round(random.uniform(500, 50000), 2),
            random.choice(CURRENCIES),
            get_iso_time(base_time=base_time),
            get_iso_time(base_time=base_time, delta_days=1)
        ))
        
        # 2. 关联逻辑
        # 结算
        if status in ['processing', 'customs', 'shipping', 'completed']:
            settle_status = 'completed' if status == 'completed' else 'processing'
            if status == 'blocked': settle_status = 'failed'
            buffer['settlements'].append((
                str(uuid.uuid4()), order_id, settle_status,
                random.randint(2, 72), random.choice(RISK_LEVELS)
            ))
            
        # 物流
        if status in ['customs', 'shipping', 'completed']:
            log_status = 'transit'
            if status == 'customs': log_status = 'customs'
            if status == 'completed': log_status = 'completed'
            buffer['logistics'].append((
                str(uuid.uuid4()), f"SF{random.randint(100000000, 999999999)}",
                f"中国{fake.city()}", f"美国洛杉矶",
                log_status, random.randint(100, 300), random.randint(90, 320),
                random.randint(70, 100), order_id
            ))
            
        # 报关
        if status in ['customs', 'shipping', 'completed']:
            cust_status = 'cleared' if status in ['shipping', 'completed'] else 'inspecting'
            header_id = str(uuid.uuid4())
            buffer['customs_headers'].append((
                header_id, f"DEC{random.randint(100000000, 999999999)}",
                enterprise, enterprise, "Overseas Buyer Inc.",
                random.choice(['CNSGH', 'CNNGB', 'CNHKG']),
                "0110", "USD",
                random.uniform(5000, 50000), random.uniform(100, 500),
                random.uniform(90, 480), random.randint(1, 50),
                "CN", "US", cust_status,
                get_date_str(base_time), order_id, get_iso_time(base_time=base_time)
            ))
            
            prod_info = random.choice(PRODUCT_MAP[category])
            buffer['customs_items'].append((
                str(uuid.uuid4()), header_id, 1,
                prod_info[1], prod_info[0], "标准箱装", "PCS",
                random.randint(10, 1000), random.uniform(10, 100),
                random.uniform(100, 10000),
                "CN", 0.13, 0.05, 0.0, 0.13
            ))

        # 批量写入
        if len(buffer['orders']) >= BATCH_SIZE:
            _flush(cursor, buffer)

    if buffer['orders']:
        _flush(cursor, buffer)

def _flush(cursor, data):
    cursor.executemany(
        "INSERT INTO orders (id, order_number, enterprise, category, status, amount, currency, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)",
        data['orders']
    )
    cursor.executemany("INSERT INTO settlements VALUES (?,?,?,?,?)", data['settlements'])
    cursor.executemany("INSERT INTO logistics VALUES (?,?,?,?,?,?,?,?,?)", data['logistics'])
    cursor.executemany("INSERT INTO customs_headers VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", data['customs_headers'])
    cursor.executemany("INSERT INTO customs_items VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", data['customs_items'])
    for k in data: data[k].clear()

# --- 主程序入口 ---
def main():
    print(f"🚀 初始化脚本启动")
    print(f"📂 目标数据库: {os.path.abspath(DB_PATH)}")
    
    if not os.path.exists(DB_PATH):
        print(f"❌ 错误：找不到数据库文件。请确认路径是否正确。")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # 1. 尝试加载 Excel 企业名单 (已在全局变量初始化)
        
        # 2. 清理
        clean_database(cursor)
        
        # 3. 生成基础库
        generate_algo_and_models(cursor)
        generate_inventory(cursor)
        
        # 4. 生成交易流水
        generate_transactions(cursor, conn)
        
        conn.commit()
        
        print(f"\n✅ 数据初始化完成！")
        print(f"   - 订单生成数: {NUM_ORDERS}")
        print(f"   - 企业来源: {ENTERPRISE_FILE}")
        
    except Exception as e:
        print(f"\n❌ 发生异常: {e}")
        import traceback
        traceback.print_exc()
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    main()
