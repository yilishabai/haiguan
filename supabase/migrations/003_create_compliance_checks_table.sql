-- 合规检查表 (compliance_checks)
CREATE TABLE compliance_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    hs_code VARCHAR(20) NOT NULL,
    risk_level VARCHAR(10) CHECK (risk_level IN ('low', 'medium', 'high')),
    check_result TEXT NOT NULL,
    ai_suggestions JSONB,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_compliance_checks_order_id ON compliance_checks(order_id);
CREATE INDEX idx_compliance_checks_risk_level ON compliance_checks(risk_level);

-- 权限设置
GRANT SELECT ON compliance_checks TO anon;
GRANT ALL PRIVILEGES ON compliance_checks TO authenticated;