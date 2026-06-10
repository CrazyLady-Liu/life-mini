import type { Equipment, DamageRecord, Maintenance, EquipmentHealth, RiskLevel } from '../types';

const CATEGORY_LIFESPAN_CONFIG: Record<string, { expectedUses: number; expectedDays: number }> = {
  '帐篷': { expectedUses: 80, expectedDays: 1825 },
  '睡袋': { expectedUses: 100, expectedDays: 1460 },
  '防潮垫': { expectedUses: 120, expectedDays: 1095 },
  '登山包': { expectedUses: 150, expectedDays: 1825 },
  '登山杖': { expectedUses: 200, expectedDays: 1095 },
  '炉具': { expectedUses: 100, expectedDays: 1460 },
  '灯具': { expectedUses: 80, expectedDays: 1095 },
  '桌椅': { expectedUses: 150, expectedDays: 1825 },
  '天幕': { expectedUses: 100, expectedDays: 1825 },
  '炊具': { expectedUses: 120, expectedDays: 1460 },
  '其他': { expectedUses: 100, expectedDays: 1460 },
};

const DAMAGE_SCORE_PENALTY = {
  minor: 5,
  moderate: 15,
  severe: 30,
  scrapped: 100,
};

const MAINTENANCE_COST_RATIO_THRESHOLD = 0.5;

export const calculateEquipmentHealth = (
  equipment: Equipment,
  damageRecords: DamageRecord[],
  maintenances: Maintenance[]
): EquipmentHealth => {
  const now = new Date();
  const purchaseDate = new Date(equipment.purchaseDate);
  const ageDays = Math.max(0, Math.floor((now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)));

  const config = CATEGORY_LIFESPAN_CONFIG[equipment.category] || CATEGORY_LIFESPAN_CONFIG['其他'];
  const expectedLifespanUses = config.expectedUses;
  const expectedLifespanDays = config.expectedDays;

  const equipmentDamages = damageRecords.filter((d) => d.equipmentId === equipment.id);
  const equipmentMaintenances = maintenances.filter((m) => m.equipmentId === equipment.id);

  const minorDamageCount = equipmentDamages.filter((d) => d.level === 'minor').length;
  const moderateDamageCount = equipmentDamages.filter((d) => d.level === 'moderate').length;
  const severeDamageCount = equipmentDamages.filter((d) => d.level === 'severe').length;
  const scrappedDamageCount = equipmentDamages.filter((d) => d.level === 'scrapped').length;
  const totalDamageCount = equipmentDamages.length;

  const totalMaintenanceCount = equipmentMaintenances.filter((m) => m.status === 'completed').length;
  const totalMaintenanceCost = equipmentMaintenances.reduce((sum, m) => sum + m.cost, 0);
  const maintenanceCostRatio = equipment.purchasePrice > 0 ? totalMaintenanceCost / equipment.purchasePrice : 0;

  const wearRatio = expectedLifespanUses > 0 ? equipment.usageCount / expectedLifespanUses : 0;
  const wearScore = Math.max(0, 100 - wearRatio * 100);

  let damagePenalty = 0;
  damagePenalty += minorDamageCount * DAMAGE_SCORE_PENALTY.minor;
  damagePenalty += moderateDamageCount * DAMAGE_SCORE_PENALTY.moderate;
  damagePenalty += severeDamageCount * DAMAGE_SCORE_PENALTY.severe;
  damagePenalty += scrappedDamageCount * DAMAGE_SCORE_PENALTY.scrapped;
  const damageScore = Math.max(0, 100 - damagePenalty);

  let maintenancePenalty = 0;
  maintenancePenalty += totalMaintenanceCount * 3;
  if (maintenanceCostRatio > MAINTENANCE_COST_RATIO_THRESHOLD) {
    maintenancePenalty += (maintenanceCostRatio - MAINTENANCE_COST_RATIO_THRESHOLD) * 100;
  }
  const maintenanceScore = Math.max(0, 100 - maintenancePenalty);

  const ageRatio = expectedLifespanDays > 0 ? ageDays / expectedLifespanDays : 0;
  const ageScore = Math.max(0, 100 - ageRatio * 100);

  const healthScore = Math.round(
    wearScore * 0.3 + damageScore * 0.3 + maintenanceScore * 0.25 + ageScore * 0.15
  );

  let riskLevel: RiskLevel = 'low';
  if (healthScore < 40) {
    riskLevel = 'high';
  } else if (healthScore < 70) {
    riskLevel = 'medium';
  }

  const monthlyUsageRate = ageDays > 0 ? (equipment.usageCount / ageDays) * 30 : 0;

  let remainingLifespanDays: number;
  if (monthlyUsageRate > 0) {
    const remainingUses = Math.max(0, expectedLifespanUses - equipment.usageCount);
    const remainingDaysByUsage = (remainingUses / monthlyUsageRate) * 30;
    const remainingDaysByAge = Math.max(0, expectedLifespanDays - ageDays);
    remainingLifespanDays = Math.min(remainingDaysByUsage, remainingDaysByAge);
  } else {
    remainingLifespanDays = Math.max(0, expectedLifespanDays - ageDays);
  }

  const estimatedScrapDate = new Date(now.getTime() + remainingLifespanDays * 24 * 60 * 60 * 1000);
  const estimatedScrapDateStr = estimatedScrapDate.toISOString().split('T')[0];

  if (equipment.status === 'scrapped' || equipment.status === 'decommissioned') {
    return {
      equipmentId: equipment.id,
      healthScore: 0,
      wearRate: 100,
      damageScore: 0,
      maintenanceScore: 0,
      ageScore: 0,
      riskLevel: 'high',
      estimatedScrapDate: purchaseDate.toISOString().split('T')[0],
      remainingLifespanDays: 0,
      totalDamageCount,
      totalMaintenanceCount,
      totalMaintenanceCost,
      maintenanceCostRatio,
      monthlyUsageRate,
      details: {
        usageCount: equipment.usageCount,
        expectedLifespanUses,
        ageDays,
        expectedLifespanDays,
        severeDamageCount,
        moderateDamageCount,
        minorDamageCount,
        scrappedDamageCount,
      },
    };
  }

  return {
    equipmentId: equipment.id,
    healthScore,
    wearRate: Math.round(wearRatio * 100),
    damageScore: Math.round(damageScore),
    maintenanceScore: Math.round(maintenanceScore),
    ageScore: Math.round(ageScore),
    riskLevel,
    estimatedScrapDate: estimatedScrapDateStr,
    remainingLifespanDays: Math.round(remainingLifespanDays),
    totalDamageCount,
    totalMaintenanceCount,
    totalMaintenanceCost,
    maintenanceCostRatio: Math.round(maintenanceCostRatio * 100) / 100,
    monthlyUsageRate: Math.round(monthlyUsageRate * 10) / 10,
    details: {
      usageCount: equipment.usageCount,
      expectedLifespanUses,
      ageDays,
      expectedLifespanDays,
      severeDamageCount,
      moderateDamageCount,
      minorDamageCount,
      scrappedDamageCount,
    },
  };
};

export const calculateAllHealthScores = (
  equipments: Equipment[],
  damageRecords: DamageRecord[],
  maintenances: Maintenance[]
): EquipmentHealth[] => {
  return equipments.map((eq) => calculateEquipmentHealth(eq, damageRecords, maintenances));
};

export const getHealthScoreColor = (score: number): string => {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#f97316';
  return '#ef4444';
};

export const getRiskLevelLabel = (level: RiskLevel): string => {
  const labels: Record<RiskLevel, string> = {
    low: '低风险',
    medium: '中风险',
    high: '高风险',
  };
  return labels[level];
};

export const getRiskLevelColor = (level: RiskLevel): string => {
  const colors: Record<RiskLevel, string> = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444',
  };
  return colors[level];
};

export const getHealthStats = (healthScores: EquipmentHealth[]) => {
  const total = healthScores.length;
  const highRisk = healthScores.filter((h) => h.riskLevel === 'high').length;
  const mediumRisk = healthScores.filter((h) => h.riskLevel === 'medium').length;
  const lowRisk = healthScores.filter((h) => h.riskLevel === 'low').length;
  const avgScore = total > 0 ? Math.round(healthScores.reduce((sum, h) => sum + h.healthScore, 0) / total) : 0;
  const totalMaintenanceCost = healthScores.reduce((sum, h) => sum + h.totalMaintenanceCost, 0);

  const soonToScrap = healthScores.filter((h) => h.remainingLifespanDays <= 90 && h.remainingLifespanDays > 0).length;

  return {
    total,
    highRisk,
    mediumRisk,
    lowRisk,
    avgScore,
    totalMaintenanceCost,
    soonToScrap,
  };
};

export const getCategoryHealthStats = (
  healthScores: EquipmentHealth[],
  equipments: Equipment[]
) => {
  const categoryMap = new Map<string, { count: number; totalScore: number; highRisk: number }>();

  healthScores.forEach((health) => {
    const equipment = equipments.find((e) => e.id === health.equipmentId);
    if (!equipment) return;

    const category = equipment.category;
    const existing = categoryMap.get(category) || { count: 0, totalScore: 0, highRisk: 0 };
    categoryMap.set(category, {
      count: existing.count + 1,
      totalScore: existing.totalScore + health.healthScore,
      highRisk: existing.highRisk + (health.riskLevel === 'high' ? 1 : 0),
    });
  });

  return Array.from(categoryMap.entries()).map(([name, data]) => ({
    name,
    装备数量: data.count,
    平均健康度: Math.round(data.totalScore / data.count),
    高风险数量: data.highRisk,
  }));
};
