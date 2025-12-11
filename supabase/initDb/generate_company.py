import pandas as pd
import random
from datetime import datetime, timedelta

# ================= 配置区域 =================
# 输入文件名 (请修改为您本地的实际文件名)
INPUT_FILE = '生成的企业名单.xlsx' 
# 输出文件名
OUTPUT_FILE = 'completed_enterprises.xlsx'

# 字段约束
TYPES = ['importer', 'exporter', 'both']
CATEGORIES = ['beauty', 'wine', 'appliance', 'electronics', 'textile']
STATUS_OPTIONS = ['active', 'inactive', 'blocked']
STATUS_WEIGHTS = [0.85, 0.10, 0.05]  # 85%活跃，10%不活跃，5%阻断

# 地区映射表 (可根据需要扩充)
REGIONS_KEYWORDS = [
    "上海", "北京", "深圳", "广州", "广东", "四川", "成都", "重庆", "绵阳", "宜宾",
    "河南", "郑州", "温州", "浙江", "杭州", "台州", "无锡", "江苏", "苏州", "常州",
    "合肥", "安徽", "佛山", "福州", "福建", "厦门", "江门", "广西", "天津",
    "西安", "陕西", "山东", "烟台", "青岛", "江西", "新疆", "东莞", "潮州", 
    "武汉", "湖北", "湖南", "长沙", "南京", "扬州", "宁波", "哈尔滨", "黑龙江"
]

# ================= 逻辑函数 =================

def get_region(name):
    """根据企业名称提取地区"""
    for region in REGIONS_KEYWORDS:
        if region in name:
            return region
    return "其他"  # 如果没匹配到，默认为其他

def get_category(name):
    """根据名称关键词推断品类，如果没有匹配则随机选择以符合Schema"""
    n = name.lower()
    if any(x in n for x in ["美妆", "化妆", "美容", "护肤"]):
        return "beauty"
    elif any(x in n for x in ["酒", "饮", "食品", "粮油", "农业"]): # 食品类归入酒水/食品大类
        return "wine"
    elif any(x in n for x in ["家电", "电器", "空调", "冰箱", "厨卫"]):
        return "appliance"
    elif any(x in n for x in ["电子", "科技", "光电", "显示", "通信", "数码", "电脑", "软件", "信息", "半导体", "智能", "机械", "装备", "动力"]):
        return "electronics"
    elif any(x in n for x in ["纺织", "服饰", "鞋", "衣", "纤维", "丝", "箱包"]):
        return "textile"
    else:
        # 对于物流、供应链、投资等无法明确归类的企业，随机分配一个合规品类
        return random.choice(CATEGORIES)

def get_type(name):
    """根据名称推断进出口类型"""
    if "进出口" in name:
        return "both"
    elif "贸易" in name:
        return "importer"
    else:
        return random.choice(TYPES)

def get_random_date():
    """生成最近一年的随机日期"""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=365)
    random_days = random.randrange((end_date - start_date).days)
    return (start_date + timedelta(days=random_days)).strftime("%Y-%m-%d")

# ================= 主程序 =================

def main():
    print(f"正在读取文件: {INPUT_FILE}...")
    try:
        # 读取输入文件，假设第一列是企业名称
        df_input = pd.read_excel(INPUT_FILE)
        # 假设名称在第一列，如果列名不同请修改
        company_names = df_input.iloc[:, 0].dropna().tolist()
        print(f"成功读取 {len(company_names)} 个企业名称。")
    except Exception as e:
        print(f"读取文件失败: {e}")
        return

    rows = []
    print("正在生成数据...")

    for idx, name in enumerate(company_names, 1):
        # 基础逻辑
        status = random.choices(STATUS_OPTIONS, weights=STATUS_WEIGHTS)[0]
        is_active = (status == 'active')
        
        row = {
            'id': f"E{idx:05d}",               # E00001
            'regNo': f"REG{idx:05d}",          # REG00001
            'name': name.strip(),
            'type': get_type(name),
            'category': get_category(name),
            'region': get_region(name),
            'status': status,
            'compliance': random.randint(70, 100), # 合规分 70-100
            'service_eligible': 1 if random.random() > 0.3 else 0, # 70%概率已接入
            'active_orders': random.randint(10, 500) if is_active else 0,
            'last_active': get_random_date()
        }
        rows.append(row)

    # 创建DataFrame
    df_result = pd.DataFrame(rows)

    # 按照要求的字段顺序排列
    columns_order = [
        'id', 'regNo', 'name', 'type', 'category', 'region', 
        'status', 'compliance', 'service_eligible', 'active_orders', 'last_active'
    ]
    df_result = df_result[columns_order]

    # 保存文件
    try:
        df_result.to_excel(OUTPUT_FILE, index=False)
        print(f"成功生成文件: {OUTPUT_FILE}")
        print("前5行预览：")
        print(df_result.head())
    except Exception as e:
        print(f"保存文件失败: {e}")

if __name__ == "__main__":
    main()