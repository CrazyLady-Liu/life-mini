import { useState, useMemo } from 'react';
import type { ScenarioTemplate, ScenarioCategory } from './types';
import { SCENARIO_CATEGORY_LABELS, CHART_TYPE_LABELS } from './types';
import { SCENARIO_TEMPLATES } from './scenarios';
import {
  BarChart3,
  TrendingUp,
  Layers,
  Activity,
  CircleDot,
  Grid3X3,
  Funnel,
  GitBranch,
  Sparkles,
  Search,
  ChevronRight,
  Star,
} from 'lucide-react';

interface ScenarioSelectorProps {
  onSelectScenario: (scenario: ScenarioTemplate) => void;
  onAdvancedConfig: () => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  'bar-chart-3': <BarChart3 className="w-6 h-6" />,
  'trending-up': <TrendingUp className="w-6 h-6" />,
  'layers': <Layers className="w-6 h-6" />,
  'activity': <Activity className="w-6 h-6" />,
  'circle-dot': <CircleDot className="w-6 h-6" />,
  'grid-3x3': <Grid3X3 className="w-6 h-6" />,
  'funnel': <Funnel className="w-6 h-6" />,
  'git-branch': <GitBranch className="w-6 h-6" />,
};

const CATEGORY_ICONS: Record<ScenarioCategory, React.ReactNode> = {
  flow: <GitBranch className="w-4 h-4" />,
  distribution: <Grid3X3 className="w-4 h-4" />,
  trend: <TrendingUp className="w-4 h-4" />,
  comparison: <BarChart3 className="w-4 h-4" />,
  performance: <CircleDot className="w-4 h-4" />,
};

const CATEGORIES: (ScenarioCategory | 'all')[] = ['all', 'flow', 'distribution', 'trend', 'comparison', 'performance'];

export default function ScenarioSelector({ onSelectScenario, onAdvancedConfig }: ScenarioSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<ScenarioCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredScenarios = useMemo(() => {
    let result = SCENARIO_TEMPLATES;
    
    if (activeCategory !== 'all') {
      result = result.filter((s) => s.category === activeCategory);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [activeCategory, searchQuery]);

  const recommendedScenarios = useMemo(
    () => SCENARIO_TEMPLATES.filter((s) => s.recommended),
    []
  );

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-8 py-8 text-white">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">自助分析画布</h2>
              <p className="text-emerald-100 text-sm mt-0.5">选择分析场景，快速生成数据洞察</p>
            </div>
          </div>
          
          <div className="mt-6 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-200" />
            <input
              type="text"
              placeholder="搜索分析场景..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-emerald-200 focus:outline-none focus:ring-2 focus:ring-white/40 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-6">
          {activeCategory === 'all' && recommendedScenarios.length > 0 && !searchQuery && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <h3 className="text-lg font-semibold text-gray-800">推荐场景</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recommendedScenarios.map((scenario) => (
                  <ScenarioCard
                    key={scenario.id}
                    scenario={scenario}
                    onSelect={() => onSelectScenario(scenario)}
                    featured
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {cat === 'all' ? (
                  <span className="text-xs">全部</span>
                ) : (
                  <>
                    {CATEGORY_ICONS[cat]}
                    <span>{SCENARIO_CATEGORY_LABELS[cat]}</span>
                  </>
                )}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredScenarios.map((scenario) => (
              <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              onSelect={() => onSelectScenario(scenario)}
            />
          ))}
          </div>

          <div className="mt-8 p-6 bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl border border-gray-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-500 to-gray-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800">自由配置分析</h4>
                <p className="text-sm text-gray-500 mt-0.5">
                  想完全自定义分析维度和指标？进入高级配置模式
                </p>
              </div>
              <button
                onClick={onAdvancedConfig}
                className="flex items-center gap-1 px-4 py-2.5 bg-white text-gray-700 rounded-lg hover:bg-gray-100 border border-gray-300 transition-colors"
              >
                <span className="text-sm font-medium">高级配置</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScenarioCard({
  scenario,
  onSelect,
  featured = false,
}: {
  scenario: ScenarioTemplate;
  onSelect: () => void;
  featured?: boolean;
}) {
  const icon = ICON_MAP[scenario.icon] || <BarChart3 className="w-6 h-6" />;
  
  return (
    <button
      onClick={onSelect}
      className={`group text-left bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-emerald-300 transition-all duration-200 relative overflow-hidden ${
        featured ? 'ring-2 ring-amber-200 bg-gradient-to-br from-amber-50/50 to-white' : ''
      }`}
    >
      {featured && (
        <div className="absolute top-0 right-0">
          <div className="bg-gradient-to-bl from-amber-400 to-orange-500 text-white text-xs px-3 py-1 rounded-bl-lg font-medium">
            推荐
          </div>
        </div>
      )}
      
      <div className="flex items-start gap-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
            featured
              ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
              : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
          }`}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-800 group-hover:text-emerald-600 transition-colors">
            {scenario.name}
          </h4>
          <p className="text-xs text-gray-400 mt-0.5">
            {CHART_TYPE_LABELS[scenario.chartType]}
          </p>
        </div>
      </div>
      
      <p className="text-sm text-gray-500 mt-3 line-clamp-2">
        {scenario.description}
      </p>
      
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-gray-400 flex items-center gap-1">
          {CATEGORY_ICONS[scenario.category]}
          {SCENARIO_CATEGORY_LABELS[scenario.category]}
        </span>
        <span className="text-emerald-500 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
          开始分析
          <ChevronRight className="w-4 h-4" />
        </span>
      </div>
    </button>
  );
}
