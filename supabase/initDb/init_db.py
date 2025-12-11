import sqlite3
import random
import uuid
import os
import json
import time
from datetime import datetime, timedelta
from faker import Faker

# --- 1. 基础配置 ---
# 数据库路径 (根据此前沟通修正)
DB_PATH = r'../../backend_py/app.db'
NUM_ORDERS = 5000   # 生成订单数量
BATCH_SIZE = 500    # 批量提交阈值

# 初始化 Faker (强制中文环境)
fake = Faker('zh_CN')

# --- 2. 严格枚举 (来源于数据字典) ---
# 商品类别
CATEGORIES = ['beauty', 'electronics', 'wine', 'textile', 'appliance']
# 货币
CURRENCIES = ['CNY', 'USD', 'EUR', 'GBP']
# 订单状态
ORDER_STATUSES = ['pending', 'processing', 'customs', 'shipping', 'completed', 'blocked']
# 结算状态 (settlements)
SETTLEMENT_STATUSES = ['pending', 'processing', 'completed', 'failed']
# 物流状态 (logistics) - 注意：字典要求 completed 代表已签收
LOGISTICS_STATUSES = ['pickup', 'transit', 'customs', 'completed']
# 报关状态 (customs)
CUSTOMS_STATUSES = ['declared', 'cleared', 'held', 'inspecting']
# 风险等级
RISK_LEVELS = ['low', 'medium', 'high']
# 算法类别
ALGO_CATEGORIES = ['optimization', 'coordination', 'inventory', 'control', 'decision']

# --- 3. 中文语料池 (本地化) ---

# 虚拟企业池 (模拟200家固定客户，虽然没有表，但数据要真实)
ENTERPRISE_POOL = []
suffixes = ['进出口有限公司', '供应链管理公司', '国际贸易部', '跨境电商集团', '物流科技公司']
for _ in range(200):
    name = f"{fake.city()}{fake.word()}{random.choice(suffixes)}"
    ENTERPRISE_POOL.append(name)

# 商品与HS编码映射 (涵盖美妆/酒水/家电)
PRODUCT_MAP = {
    'beauty': [("玻尿酸补水面膜", "3304.99.00"), ("赋活抗皱眼霜", "3304.91.00"), ("纳米防晒喷雾", "3304.99.00")],
    'electronics': [("5G通信模组", "8517.62.99"), ("工业控制芯片", "8542.31.00"), ("柔性OLED屏", "8524.91.00")],
    'wine': [("波尔多AOC干红", "2204.21.00"), ("苏格兰威士忌", "2208.30.00"), ("精酿小麦啤酒", "2203.00.00")],
    'textile': [("高支棉衬衫面料", "5208.32.00"), ("聚酯纤维功能布", "5407.52.00"), ("真丝刺绣围巾", "6214.10.00")],
    'appliance': [("智能扫地机器人", "8508.11.00"), ("高速负离子吹风机", "8516.31.00"), ("嵌入式洗碗机", "8422.11.00")]
}

# --- 4. 辅助工具函数 ---

def get_iso_time(delta_days=0, base_time=None):
    """生成符合 ISO 8601 的时间字符串 (2025-12-11T08:30:00.000Z)"""
    if base_time:
        dt = base_time
    else:
        dt = datetime.now()
    # 增加随机小时偏移
    target = dt + timedelta(days=delta_days, hours=random.randint(-5, 5))
    return target.strftime("%Y-%m-%dT%H:%M:%S.000Z")

def get_date_str(dt_obj):
    """生成 YYYY-MM-DD 格式 (用于 customs_headers.declare_date)"""
    return dt_obj.strftime("%Y-%m-%d")

def generate_distinct_code(algo_name, category):
    """
    根据算法类别生成 20+ 行差异化明显的 Python 伪代码
    """
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    if category == 'optimization':
        return f"""# Algorithm: {algo_name}
# Category: Optimization (Scipy/Linear Programming)
# Generated: {ts}

import numpy as np
from scipy.optimize import minimize, LinearConstraint

class ResourceOptimizer:
    '''
    Uses Nelder-Mead method to optimize logistics resource allocation.
    Target: Minimize total transport cost.
    '''
    def __init__(self, constraints):
        self.constraints = constraints
        self.history = []

    def objective_function(self, x):
        # Cost function: distance * weight * fuel_price
        return np.sum(x**2) + {random.randint(10, 50)} * np.mean(x)

    def run(self, initial_guess):
        print("Starting optimization loop...")
        try:
            res = minimize(
                self.objective_function, 
                initial_guess, 
                method='Nelder-Mead',
                options={{'xtol': 1e-8, 'disp': True}}
            )
            self.history.append(res.fun)
            return {{
                "optimal_params": res.x.tolist(),
                "min_cost": res.fun,
                "success": res.success
            }}
        except Exception as e:
            return {{"error": str(e)}}
"""
    elif category == 'decision':
        return f"""# Algorithm: {algo_name}
# Category: Decision Support (Random Forest)
# Generated: {ts}

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from core.utils import DataPreprocessor

MODEL_PATH = '/opt/models/{algo_name}_v2.pkl'

class RiskAssessor:
    def __init__(self):
        self.model = None
        self.preprocessor = DataPreprocessor()

    def load_weights(self):
        try:
            self.model = joblib.load(MODEL_PATH)
            print("Model loaded successfully.")
        except FileNotFoundError:
            print("Warning: Model weights not found, initializing empty.")

    def predict_risk_level(self, transaction_data):
        '''
        Input: JSON dict of transaction details
        Output: 'low', 'medium', 'high'
        '''
        df = pd.DataFrame([transaction_data])
        cleaned_data = self.preprocessor.transform(df)
        
        # Feature engineering block
        cleaned_data['amount_log'] = np.log1p(cleaned_data['amount'])
        
        probs = self.model.predict_proba(cleaned_data)
        risk_score = probs[0][1] # Probability of positive class (fraud)
        
        if risk_score > 0.85:
            return "high"
        elif risk_score > 0.45:
            return "medium"
        else:
            return "low"
"""
    elif category == 'inventory':
        return f"""# Algorithm: {algo_name}
# Category: Inventory Control (Time Series)
# Generated: {ts}

import math
from datetime import datetime

class SafetyStockCalculator:
    '''
    Dynamic safety stock calculation based on lead time variance.
    Formula: SS = Z * sqrt( (AvgLT * sigmaD^2) + (AvgD^2 * sigmaLT^2) )
    '''
    def __init__(self, service_level=0.95):
        # Z-score for 95% service level is approx 1.65
        self.z_score = 1.65 if service_level == 0.95 else 1.96
    
    def calculate(self, avg_daily_sales, std_dev_sales, avg_lead_time, std_dev_lead_time):
        term1 = avg_lead_time * (std_dev_sales ** 2)
        term2 = (avg_daily_sales ** 2) * (std_dev_lead_time ** 2)
        
        safety_stock = self.z_score * math.sqrt(term1 + term2)
        
        return {{
            "safety_stock": math.ceil(safety_stock),
            "reorder_point": (avg_daily_sales * avg_lead_time) + safety_stock,
            "calculated_at": datetime.now().isoformat()
        }}

    def update_forecast(self, sales_history):
        # Simple Moving Average
        return sum(sales_history[-7:]) / 7
"""
    else:
        # Default Template
        return f"""# Algorithm: {algo_name}
# Category: General Logic
# Generated: {ts}

import json
import logging

logger = logging.getLogger(__name__)

def execute_logic(context_data):
    '''
    Main entry point for business rule execution.
    '''
    results = []
    
    # Validation Phase
    if not context_data.get('id'):
        raise ValueError("Missing ID")
        
    # Processing Phase
    for item in context_data.get('items', []):
        score = 0
        if item['value'] > 1000:
            score += 10
        if item['category'] in ['restricted', 'sensitive']:
            score += 50
            
        results.append({{
            "item_id": item['id'],
            "compliance_score": score,
            "passed": score < 60
        }})
        
    return {{
        "summary": "Processed " + str(len(results)) + " items",
        "details": results,
        "status": "OK"
    }}
"""

# --- 5. 核心逻辑 ---

def clean_database(cursor):
    """
    清理旧数据，保留用户表。
    注意：因为企业表已被移除（合并入订单），所以删除 orders 表即清理了企业数据。
    """
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
            # 重置自增ID
            cursor.execute(f"DELETE FROM sqlite_sequence WHERE name='{table}'")
        except sqlite3.OperationalError:
            # 防止表不存在时报错
            pass
    print("   已清除所有业务交易数据及旧的企业记录。")

def generate_algo_and_models(cursor):
    print("🧠 正在生成 25+ 算法与业务模型库...")
    
    # 1. 算法库 (Algorithms)
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
        # accuracy/performance: 0-100 (REAL)
        algos.append((
            str(uuid.uuid4()), 
            name, 
            cat, 
            f"v{random.randint(1,5)}.{random.randint(0,9)}", # version
            random.choice(['active', 'active', 'testing']),  # status
            round(random.uniform(85.0, 99.9), 1),            # accuracy (0-100)
            round(random.uniform(20.0, 98.0), 1),            # performance (0-100)
            random.randint(1000, 500000),                    # usage
            f"针对{cat}场景的高性能算法，支持实时调用。",       # description
            json.dumps(["GPU加速", "自动容错", "实时日志"], ensure_ascii=False), # features (JSON String)
            get_iso_time(),                                  # last_updated
            f"{fake.last_name()}博士",                       # author
            generate_distinct_code(f"Algo_{i}", cat)         # code
        ))
    cursor.executemany("INSERT INTO algorithms VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)", algos)

    # 2. 业务模型 (Business Models)
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
        # scenarios/compliance: JSON Object String
        # chapters: JSON Array String
        models.append((
            str(uuid.uuid4()), 
            name, 
            cat, 
            f"2025.R{i}", 
            random.choice(['active', 'active', 'development']),
            random.randint(50, 2000),       # enterprises
            random.randint(5000, 500000),   # orders
            f"基于海关最新公告的{name}标准业务模型。", # description
            json.dumps({"type": "standard", "region": "CN"}, ensure_ascii=False), # scenarios
            json.dumps({"level": "Strict", "audit": "Annual"}, ensure_ascii=False), # compliance
            json.dumps([str(x) for x in range(1, random.randint(3,8))]), # chapters e.g. ["1","2"]
            round(random.uniform(90.0, 99.9), 1), # success_rate (0-100)
            get_iso_time(), 
            f"{fake.company()}关务部" # maintainer
        ))
    cursor.executemany("INSERT INTO business_models VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)", models)

def generate_inventory(cursor):
    print("📦 正在根据商品类别初始化库存...")
    inv_data = []
    # 展平所有商品
    all_products = [p[0] for cat in PRODUCT_MAP.values() for p in cat]
    for prod_name in all_products:
        inv_data.append((
            prod_name,
            random.randint(1000, 5000),  # current
            random.randint(5000, 10000), # target
            random.randint(200, 800),    # production
            random.randint(100, 600),    # sales
            random.randint(60, 100)      # efficiency (0-100)
        ))
    cursor.executemany("INSERT INTO inventory VALUES (?,?,?,?,?,?)", inv_data)

def generate_transactions(cursor, conn):
    print(f"💸 正在生成 {NUM_ORDERS} 条订单流 (模拟 {len(ENTERPRISE_POOL)} 家企业的业务)...")
    
    buffer = {
        'orders': [], 'settlements': [], 'logistics': [],
        'customs_headers': [], 'customs_items': []
    }
    
    for _ in range(NUM_ORDERS):
        # --- 1. 基础信息 ---
        order_id = str(uuid.uuid4())
        category = random.choice(CATEGORIES)
        enterprise = random.choice(ENTERPRISE_POOL) # 从虚拟池中取
        base_time = fake.date_time_between(start_date='-1y', end_date='now')
        
        # 随机决定该订单的当前状态
        # 权重倾向于 completed 以展示全流程数据
        status = random.choices(ORDER_STATUSES, weights=[10, 20, 15, 20, 30, 5], k=1)[0]
        
        # --- 2. 插入 Orders ---
        buffer['orders'].append((
            order_id,
            f"ORD{base_time.strftime('%Y%m%d')}{random.randint(10000, 99999)}",
            enterprise,
            category,
            status,
            round(random.uniform(500, 50000), 2),
            random.choice(CURRENCIES),
            get_iso_time(base_time=base_time),                # created_at
            get_iso_time(base_time=base_time, delta_days=1)   # updated_at
        ))
        
        # --- 3. 关联表逻辑 (仅当状态进展到相应阶段时生成) ---
        
        # 结算 (Settlements)
        # 只有 processing 及之后的状态才有结算记录
        if status in ['processing', 'customs', 'shipping', 'completed']:
            settle_status = 'completed' if status == 'completed' else 'processing'
            if status == 'blocked': settle_status = 'failed'
            
            buffer['settlements'].append((
                str(uuid.uuid4()), 
                order_id, 
                settle_status,
                random.randint(2, 72),      # settlement_time (INTEGER hours)
                random.choice(RISK_LEVELS)
            ))
            
        # 物流 (Logistics)
        # 只有 customs, shipping, completed 才有物流
        if status in ['customs', 'shipping', 'completed']:
            # 映射订单状态到物流状态
            log_status = 'transit'
            if status == 'customs': log_status = 'customs'
            if status == 'completed': log_status = 'completed'
            
            buffer['logistics'].append((
                str(uuid.uuid4()),
                f"SF{random.randint(100000000, 999999999)}",
                f"中国{fake.city()}", f"美国洛杉矶", # Origin/Dest
                log_status,
                random.randint(100, 300), # estimated_time (INTEGER hours)
                random.randint(90, 320),  # actual_time (INTEGER hours)
                random.randint(70, 100),  # efficiency (0-100)
                order_id
            ))
            
        # 报关 (Customs)
        # shipping, completed 肯定已报关；customs 正在报关
        if status in ['customs', 'shipping', 'completed']:
            cust_status = 'cleared' if status in ['shipping', 'completed'] else 'inspecting'
            header_id = str(uuid.uuid4())
            
            # Header
            buffer['customs_headers'].append((
                header_id,
                f"DEC{random.randint(100000000, 999999999)}",
                enterprise, 
                enterprise, # consignor
                "Overseas Buyer Inc.", # consignee
                random.choice(['CNSGH', 'CNNGB', 'CNHKG']), # port_code
                "0110", # trade_mode
                "USD",  # currency
                random.uniform(5000, 50000), # total_value
                random.uniform(100, 500),    # gross_weight
                random.uniform(90, 480),     # net_weight
                random.randint(1, 50),       # packages
                "CN", "US",                  # country_origin/dest
                cust_status,
                get_date_str(base_time),     # declare_date (YYYY-MM-DD)
                order_id,
                get_iso_time(base_time=base_time)
            ))
            
            # Items (取商品详情)
            prod_info = random.choice(PRODUCT_MAP[category]) # (name, hs_code)
            buffer['customs_items'].append((
                str(uuid.uuid4()), header_id, 1,
                prod_info[1], # hs_code
                prod_info[0], # name
                "标准箱装",    # spec
                "PCS",        # unit
                random.randint(10, 1000),     # qty
                random.uniform(10, 100),      # unit_price
                random.uniform(100, 10000),   # amount
                "CN", 0.13, 0.05, 0.0, 0.13   # origin, tax...
            ))

        # 批量写入
        if len(buffer['orders']) >= BATCH_SIZE:
            _flush(cursor, buffer)

    # 尾部写入
    if buffer['orders']:
        _flush(cursor, buffer)

def _flush(cursor, data):
    cursor.executemany("INSERT INTO orders VALUES (?,?,?,?,?,?,?,?,?)", data['orders'])
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
        # 1. 清理 (清除旧的企业数据和业务记录)
        clean_database(cursor)
        
        # 2. 生成基础库 (25+ 算法与模型)
        generate_algo_and_models(cursor)
        
        # 3. 生成库存
        generate_inventory(cursor)
        
        # 4. 生成交易流水 (订单 -> 结算/物流/报关)
        generate_transactions(cursor, conn)
        
        conn.commit()
        
        print(f"\n✅ 数据初始化完成！")
        print(f"   - 订单生成数: {NUM_ORDERS}")
        print(f"   - 虚拟企业数: {len(ENTERPRISE_POOL)} (已重置)")
        print(f"   - 算法/模型: 25+ (代码已差异化)")
        
    except Exception as e:
        print(f"\n❌ 发生异常: {e}")
        import traceback
        traceback.print_exc()
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    main()