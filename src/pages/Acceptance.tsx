import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Users, 
  Building, 
  BarChart3,
  TrendingUp,
  Award,
  Eye,
  Download,
  Upload,
  Search,
  Filter,
  Calendar,
  MapPin,
  Globe,
  Shield,
  Zap
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { HudPanel, DataCard, StatusBadge, GlowButton } from '../components/ui/HudPanel';
import { getSettings } from '../lib/sqlite';

interface Application {
  id: string;
  applicationNo: string;
  enterprise: string;
  category: 'beauty' | 'wine' | 'appliance' | 'electronics' | 'textile';
  type: 'new' | 'renewal' | 'modification';
  status: 'submitted' | 'under_review' | 'field_test' | 'approved' | 'rejected' | 'pending_docs';
  submitDate: string;
  expectedDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  compliance: number;
  riskScore: number;
  reviewer: string;
  progress: number;
}

interface AcceptanceCriteria {
  id: string;
  name: string;
  category: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  deadline: string;
  assignee: string;
  compliance: number;
}

interface ReviewWorkflow {
  id: string;
  applicationId: string;
  stage: 'initial_review' | 'technical_review' | 'compliance_check' | 'final_approval';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  reviewer: string;
  startDate: string;
  endDate: string;
  comments: string;
}

interface EnterpriseMetrics {
  total: number;
  active: number;
  newThisMonth: number;
  completionRate: number;
  avgProcessingTime: number;
}

export const Acceptance: React.FC = () => {
  const [activeTab, setActiveTab] = useState('applications');
  const [applications, setApplications] = useState<Application[]>([]);
  const [acceptanceCriteria, setAcceptanceCriteria] = useState<AcceptanceCriteria[]>([]);
  const [reviewWorkflows, setReviewWorkflows] = useState<ReviewWorkflow[]>([]);
  const [enterpriseMetrics, setEnterpriseMetrics] = useState<EnterpriseMetrics | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [appPage, setAppPage] = useState(1);
  const [appPageSize, setAppPageSize] = useState(10);

  // 模拟数据
  useEffect(() => {
    const generateApplications = (): Application[] => [
      {
        id: '1',
        applicationNo: 'APP20241227001',
        enterprise: '上海美妆集团有限公司',
        category: 'beauty',
        type: 'new',
        status: 'under_review',
        submitDate: '2024-12-15',
        expectedDate: '2025-01-15',
        priority: 'high',
        compliance: 94.2,
        riskScore: 28,
        reviewer: '张审核员',
        progress: 67.5
      },
      {
        id: '2',
        applicationNo: 'APP20241227002',
        enterprise: '深圳电子科技有限公司',
        category: 'electronics',
        type: 'renewal',
        status: 'field_test',
        submitDate: '2024-12-10',
        expectedDate: '2025-01-10',
        priority: 'urgent',
        compliance: 87.8,
        riskScore: 45,
        reviewer: '李技术专家',
        progress: 82.1
      },
      {
        id: '3',
        applicationNo: 'APP20241227003',
        enterprise: '广州食品进出口公司',
        category: 'wine',
        type: 'new',
        status: 'approved',
        submitDate: '2024-11-20',
        expectedDate: '2024-12-20',
        priority: 'medium',
        compliance: 96.5,
        riskScore: 12,
        reviewer: '王合规专员',
        progress: 100
      },
      {
        id: '4',
        applicationNo: 'APP20241227004',
        enterprise: '宁波服装贸易集团',
        category: 'textile',
        type: 'modification',
        status: 'pending_docs',
        submitDate: '2024-12-18',
        expectedDate: '2025-01-18',
        priority: 'low',
        compliance: 73.4,
        riskScore: 67,
        reviewer: '赵流程专员',
        progress: 34.2
      },
      {
        id: '5',
        applicationNo: 'APP20241227005',
        enterprise: '青岛机械制造有限公司',
        category: 'appliance',
        type: 'new',
        status: 'rejected',
        submitDate: '2024-12-05',
        expectedDate: '2025-01-05',
        priority: 'high',
        compliance: 68.9,
        riskScore: 78,
        reviewer: '陈高级工程师',
        progress: 45.8
      }
    ];

    const generateAcceptanceCriteria = (): AcceptanceCriteria[] => [
      {
        id: '1',
        name: 'NMPA合规性检查',
        category: 'beauty',
        status: 'completed',
        progress: 100,
        deadline: '2024-12-31',
        assignee: '合规团队',
        compliance: 98.5
      },
      {
        id: '2',
        name: '技术文档完整性',
        category: 'electronics',
        status: 'in_progress',
        progress: 78.9,
        deadline: '2025-01-15',
        assignee: '技术审核组',
        compliance: 87.3
      },
      {
        id: '3',
        name: '安全性评估报告',
        category: 'wine',
        status: 'pending',
        progress: 0,
        deadline: '2025-01-10',
        assignee: '安全评估专家',
        compliance: 0
      },
      {
        id: '4',
        name: '质量管理体系',
        category: 'textile',
        status: 'completed',
        progress: 100,
        deadline: '2024-12-25',
        assignee: '质量管理部',
        compliance: 94.7
      },
      {
        id: '5',
        name: '环保标准符合性',
        category: 'appliance',
        status: 'failed',
        progress: 45.2,
        deadline: '2024-12-20',
        assignee: '环保检测组',
        compliance: 72.1
      }
    ];

    const generateReviewWorkflows = (): ReviewWorkflow[] => [
      {
        id: '1',
        applicationId: 'APP20241227001',
        stage: 'initial_review',
        status: 'completed',
        reviewer: '张审核员',
        startDate: '2024-12-16',
        endDate: '2024-12-18',
        comments: '基础材料完整，符合初步要求'
      },
      {
        id: '2',
        applicationId: 'APP20241227001',
        stage: 'technical_review',
        status: 'in_progress',
        reviewer: '李技术专家',
        startDate: '2024-12-19',
        endDate: '',
        comments: '技术方案需要进一步验证'
      },
      {
        id: '3',
        applicationId: 'APP20241227002',
        stage: 'compliance_check',
        status: 'pending',
        reviewer: '王合规专员',
        startDate: '',
        endDate: '',
        comments: ''
      }
    ];

    const generateEnterpriseMetrics = (): EnterpriseMetrics => ({
      total: 19456,
      active: 1247,
      newThisMonth: 234,
      completionRate: 87.3,
      avgProcessingTime: 21.5
    });

    setApplications(generateApplications());
    setAcceptanceCriteria(generateAcceptanceCriteria());
    setReviewWorkflows(generateReviewWorkflows());
    setEnterpriseMetrics(generateEnterpriseMetrics());

    let timer: any;
    const setup = async () => {
      try {
        const rows = await getSettings();
        const val = rows.find((r: any) => r.key === 'sync_interval')?.value || '3000';
        const delay = Math.max(500, parseInt(val) || 3000);
        timer = setInterval(() => {
          setApplications(generateApplications());
          setAcceptanceCriteria(generateAcceptanceCriteria());
          setReviewWorkflows(generateReviewWorkflows());
          setEnterpriseMetrics(generateEnterpriseMetrics());
        }, delay);
      } catch (_) {
        timer = setInterval(() => {
          setApplications(generateApplications());
          setAcceptanceCriteria(generateAcceptanceCriteria());
          setReviewWorkflows(generateReviewWorkflows());
          setEnterpriseMetrics(generateEnterpriseMetrics());
        }, 3000);
      }
    };
    setup();

    return () => { if (timer) clearInterval(timer); };
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-emerald-green" />;
      case 'rejected':
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-alert-red" />;
      case 'under_review':
      case 'in_progress':
      case 'field_test':
        return <Clock className="w-4 h-4 text-cyber-cyan" />;
      case 'submitted':
      case 'pending':
      case 'pending_docs':
        return <FileText className="w-4 h-4 text-yellow-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-alert-red bg-alert-red/20';
      case 'high': return 'text-orange-400 bg-orange-400/20';
      case 'medium': return 'text-cyber-cyan bg-cyber-cyan/20';
      case 'low': return 'text-gray-400 bg-gray-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'beauty': return <Eye className="w-4 h-4 text-pink-400" />;
      case 'wine': return <Globe className="w-4 h-4 text-purple-400" />;
      case 'appliance': return <Zap className="w-4 h-4 text-blue-400" />;
      case 'electronics': return <Shield className="w-4 h-4 text-cyber-cyan" />;
      case 'textile': return <FileText className="w-4 h-4 text-green-400" />;
      default: return <Building className="w-4 h-4 text-gray-400" />;
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.enterprise.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.applicationNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || app.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });
  const totalAppPages = Math.max(1, Math.ceil(filteredApplications.length / appPageSize));
  const currentAppPage = Math.min(appPage, totalAppPages);
  const appStart = (currentAppPage - 1) * appPageSize;
  const pagedApplications = filteredApplications.slice(appStart, appStart + appPageSize);

  // 统计数据
  const statsData = [
    { name: '已提交', value: applications.filter(a => a.status === 'submitted').length, fill: '#F59E0B' },
    { name: '审核中', value: applications.filter(a => ['under_review', 'field_test'].includes(a.status)).length, fill: '#00F0FF' },
    { name: '已批准', value: applications.filter(a => a.status === 'approved').length, fill: '#10B981' },
    { name: '已驳回', value: applications.filter(a => a.status === 'rejected').length, fill: '#EF4444' }
  ];

  const monthlyTrend = [
    { month: '8月', applications: 156, approvals: 134, rejections: 22 },
    { month: '9月', applications: 189, approvals: 167, rejections: 18 },
    { month: '10月', applications: 234, approvals: 198, rejections: 28 },
    { month: '11月', applications: 198, approvals: 178, rejections: 15 },
    { month: '12月', applications: 267, approvals: 234, rejections: 21 }
  ];

  const COLORS = ['#00F0FF', '#2E5CFF', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">应用与验收管理</h1>
          <p className="text-gray-400">跨境供应链企业应用审批与验收流程管理中心</p>
        </div>
        <div className="flex space-x-4">
          <GlowButton variant="primary">
            <Upload className="w-4 h-4 mr-2" />
            批量导入
          </GlowButton>
          <GlowButton variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            导出报告
          </GlowButton>
        </div>
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <DataCard 
          title="总申请数" 
          value={applications.length.toString()} 
          unit="笔" 
          trend="up" 
          status="good" 
          icon={<FileText className="w-6 h-6 text-cyber-cyan" />}
        />
        <DataCard 
          title="待审核" 
          value={applications.filter(a => ['under_review', 'field_test'].includes(a.status)).length.toString()} 
          unit="笔" 
          trend="up" 
          status="warning" 
          icon={<Clock className="w-6 h-6 text-yellow-400" />}
        />
        <DataCard 
          title="通过率" 
          value="87.3" 
          unit="%" 
          trend="up" 
          status="excellent" 
          icon={<CheckCircle className="w-6 h-6 text-emerald-green" />}
        />
        <DataCard 
          title="平均处理时间" 
          value={enterpriseMetrics?.avgProcessingTime.toString() || '21.5'} 
          unit="天" 
          trend="down" 
          status="good" 
          icon={<Calendar className="w-6 h-6 text-blue-400" />}
        />
        <DataCard 
          title="合规率" 
          value="94.2" 
          unit="%" 
          trend="up" 
          status="excellent" 
          icon={<Award className="w-6 h-6 text-purple-400" />}
        />
      </div>

      {/* 标签页导航 */}
      <div className="border-b border-gray-700">
        <nav className="flex space-x-8">
          {[
            { id: 'applications', label: '应用审批', icon: FileText },
            { id: 'criteria', label: '验收标准', icon: Award },
            { id: 'workflow', label: '审核流程', icon: BarChart3 },
            { id: 'analytics', label: '统计分析', icon: TrendingUp }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-cyber-cyan text-cyber-cyan'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* 标签页内容 */}
      <div className="space-y-6">
        {activeTab === 'applications' && (
          <div className="space-y-6">
            {/* 搜索和筛选 */}
            <HudPanel className="p-6">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索企业名称或申请号..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-cyber-cyan"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyber-cyan"
                  >
                    <option value="all">所有品类</option>
                    <option value="beauty">美妆</option>
                    <option value="wine">酒类</option>
                    <option value="appliance">家电</option>
                    <option value="electronics">电子</option>
                    <option value="textile">纺织</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyber-cyan"
                  >
                    <option value="all">所有状态</option>
                    <option value="submitted">已提交</option>
                    <option value="under_review">审核中</option>
                    <option value="field_test">现场核查</option>
                    <option value="approved">已批准</option>
                    <option value="rejected">已驳回</option>
                  </select>
                </div>
              </div>
            </HudPanel>

            {/* 应用列表 */}
            <HudPanel className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">应用审批列表</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-300">申请号</th>
                      <th className="text-left py-3 px-4 text-gray-300">企业</th>
                      <th className="text-left py-3 px-4 text-gray-300">品类</th>
                      <th className="text-left py-3 px-4 text-gray-300">类型</th>
                      <th className="text-left py-3 px-4 text-gray-300">状态</th>
                      <th className="text-left py-3 px-4 text-gray-300">优先级</th>
                      <th className="text-left py-3 px-4 text-gray-300">合规率</th>
                      <th className="text-left py-3 px-4 text-gray-300">进度</th>
                      <th className="text-left py-3 px-4 text-gray-300">审核员</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedApplications.map((app) => (
                      <tr key={app.id} className="border-b border-gray-800 hover:bg-gray-800">
                        <td className="py-3 px-4 text-cyber-cyan font-medium">{app.applicationNo}</td>
                        <td className="py-3 px-4 text-white">{app.enterprise}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            {getCategoryIcon(app.category)}
                            <span className="text-white text-xs">
                              {app.category === 'beauty' ? '美妆' :
                               app.category === 'wine' ? '酒类' :
                               app.category === 'appliance' ? '家电' :
                               app.category === 'electronics' ? '电子' :
                               app.category === 'textile' ? '纺织' : app.category}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-white text-xs">
                          {app.type === 'new' ? '新申请' :
                           app.type === 'renewal' ? '续证' :
                           app.type === 'modification' ? '变更' : app.type}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(app.status)}
                            <StatusBadge status={app.status} />
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(app.priority)}`}>
                            {app.priority === 'urgent' ? '紧急' :
                             app.priority === 'high' ? '高' :
                             app.priority === 'medium' ? '中' :
                             app.priority === 'low' ? '低' : app.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={app.compliance >= 90 ? 'text-emerald-green' : app.compliance >= 80 ? 'text-cyber-cyan' : 'text-alert-red'}>
                            {app.compliance}%
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-cyber-cyan to-neon-blue h-2 rounded-full transition-all duration-300"
                                style={{ width: `${app.progress}%` }}
                              />
                            </div>
                            <span className="text-white text-xs">{app.progress}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-white text-xs">{app.reviewer}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>每页</span>
                    <select value={appPageSize} onChange={(e)=>{ setAppPageSize(parseInt(e.target.value)||10); setAppPage(1); }} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white">
                      {[10,20,50].map(s=> (<option key={s} value={s}>{s}</option>))}
                    </select>
                    <span>项</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-2 py-1 rounded bg-gray-800 text-gray-200 border border-gray-700 disabled:opacity-50" onClick={()=>setAppPage(p=>Math.max(1,p-1))} disabled={currentAppPage<=1}>上一页</button>
                    <span className="text-xs text-gray-400">{currentAppPage}/{totalAppPages}</span>
                    <button className="px-2 py-1 rounded bg-gray-800 text-gray-200 border border-gray-700 disabled:opacity-50" onClick={()=>setAppPage(p=>Math.min(totalAppPages,p+1))} disabled={currentAppPage>=totalAppPages}>下一页</button>
                  </div>
                </div>
              </div>
            </HudPanel>
          </div>
        )}

        {activeTab === 'criteria' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {acceptanceCriteria.map((criteria) => (
                <HudPanel key={criteria.id} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-medium">{criteria.name}</h3>
                    {getStatusIcon(criteria.status)}
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">进度</span>
                      <span className="text-white">{criteria.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-emerald-green to-cyber-cyan h-2 rounded-full transition-all duration-300"
                        style={{ width: `${criteria.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">合规率</span>
                      <span className={criteria.compliance >= 90 ? 'text-emerald-green' : criteria.compliance >= 80 ? 'text-cyber-cyan' : 'text-alert-red'}>
                        {criteria.compliance}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">截止日期</span>
                      <span className="text-white">{criteria.deadline}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">负责人</span>
                      <span className="text-white">{criteria.assignee}</span>
                    </div>
                  </div>
                </HudPanel>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'workflow' && (
          <div className="space-y-6">
            <HudPanel className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">审核流程追踪</h3>
              <div className="space-y-4">
                {reviewWorkflows.map((workflow) => (
                  <div key={workflow.id} className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(workflow.status)}
                        <div>
                          <div className="text-white font-medium">
                            {workflow.stage === 'initial_review' ? '初审' :
                             workflow.stage === 'technical_review' ? '技术评审' :
                             workflow.stage === 'compliance_check' ? '合规检查' :
                             workflow.stage === 'final_approval' ? '最终审批' : workflow.stage}
                          </div>
                          <div className="text-gray-400 text-sm">审核员: {workflow.reviewer}</div>
                        </div>
                      </div>
                      <StatusBadge status={workflow.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">开始时间: </span>
                        <span className="text-white">{workflow.startDate || '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">结束时间: </span>
                        <span className="text-white">{workflow.endDate || '-'}</span>
                      </div>
                    </div>
                    {workflow.comments && (
                      <div className="mt-3 p-3 bg-gray-700 rounded-lg">
                        <div className="text-gray-400 text-sm mb-1">审核意见:</div>
                        <div className="text-white text-sm">{workflow.comments}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </HudPanel>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <HudPanel className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">申请状态分布</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </HudPanel>

            <HudPanel className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">月度趋势分析</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="applications" fill="#00F0FF" name="申请数" />
                  <Bar dataKey="approvals" fill="#10B981" name="批准数" />
                  <Bar dataKey="rejections" fill="#EF4444" name="驳回数" />
                </BarChart>
              </ResponsiveContainer>
            </HudPanel>
          </div>
        )}
      </div>
    </div>
  );
};
