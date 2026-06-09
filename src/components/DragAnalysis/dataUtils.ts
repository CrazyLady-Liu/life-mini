import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import type {
  AnalysisConfig,
  ChartDataPoint,
  SankeyData,
  HeatmapCell,
  FunnelItem,
  ConfigField,
  FilterCondition,
} from './types';
import { equipmentStatusLabels, rentalStatusLabels, damageLevelLabels } from '@/utils/format';
import type { Equipment, Rental, Customer } from '@/types';

const getEquipmentStatusLabel = (status: string) => equipmentStatusLabels[status] || status;
const getRentalStatusLabel = (status: string) => rentalStatusLabels[status] || status;
const getDamageLevelLabel = (level: string) => damageLevelLabels[level] || level;

const getCustomerType = (rentalCount: number): string => {
  if (rentalCount >= 8) return 'VIP客户';
  if (rentalCount >= 5) return '活跃客户';
  if (rentalCount >= 2) return '普通客户';
  return '新客户';
};

const getPackageType = (price: number): string => {
  if (price >= 200) return '豪华套餐';
  if (price >= 100) return '标准套餐';
  return '经济套餐';
};

const getMonthLabel = (dateStr: string): string => {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}月`;
};

const getQuarterLabel = (dateStr: string): string => {
  const date = new Date(dateStr);
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `Q${quarter}`;
};

const getYearLabel = (dateStr: string): string => {
  return `${new Date(dateStr).getFullYear()}年`;
};

export interface JoinedData {
  equipment: Equipment;
  rental?: Rental;
  customer?: Customer;
}

export const useJoinedData = () => {
  const { equipments, rentals, customers, suppliers } = useAppStore();

  return useMemo(() => {
    const data: JoinedData[] = [];

    rentals.forEach((rental) => {
      const equipment = equipments.find((e) => e.id === rental.equipmentId);
      const customer = customers.find((c) => c.id === rental.customerId);
      if (equipment) {
        data.push({ equipment, rental, customer });
      }
    });

    return data;
  }, [equipments, rentals, customers, suppliers]);
};

export const getDimensionValue = (item: JoinedData, fieldId: string): string => {
  const { equipment, rental, customer } = item;

  switch (fieldId) {
    case 'category':
      return equipment.category;
    case 'equipmentName':
      return equipment.name;
    case 'brand':
      return equipment.brand;
    case 'status':
      return getEquipmentStatusLabel(equipment.status);
    case 'location':
      return equipment.location;
    case 'customerName':
      return customer?.name || '未知';
    case 'customerType':
      return customer ? getCustomerType(customer.rentalCount) : '未知';
    case 'rentalStatus':
      return rental ? getRentalStatusLabel(rental.status) : '未知';
    case 'month':
      return rental ? getMonthLabel(rental.createdAt) : '未知';
    case 'quarter':
      return rental ? getQuarterLabel(rental.createdAt) : '未知';
    case 'year':
      return rental ? getYearLabel(rental.createdAt) : '未知';
    case 'supplierName':
      return '供应商';
    case 'damageLevel':
      return '未知';
    case 'maintenanceType':
      return '未知';
    case 'packageType':
      return rental ? getPackageType(rental.price) : '未知';
    default:
      return '未知';
  }
};

export const getMeasureValue = (item: JoinedData, fieldId: string): number => {
  const { equipment, rental } = item;

  switch (fieldId) {
    case 'usageCount':
      return equipment.usageCount;
    case 'rentalCount':
      return 1;
    case 'rentalRevenue':
      return rental?.price || 0;
    case 'purchasePrice':
      return equipment.purchasePrice;
    case 'equipmentCount':
      return 1;
    case 'customerCount':
      return 1;
    case 'avgRentalPrice':
      return rental?.price || 0;
    case 'totalRevenue':
      return rental?.price || 0;
    case 'damageCount':
      return 0;
    case 'maintenanceCost':
      return 0;
    case 'maintenanceCount':
      return 0;
    case 'roi':
      return rental ? (rental.price / equipment.purchasePrice) * 100 : 0;
    default:
      return 0;
  }
};

const aggregateValues = (values: number[], aggregation: string = 'sum'): number => {
  if (values.length === 0) return 0;

  switch (aggregation) {
    case 'sum':
      return values.reduce((a, b) => a + b, 0);
    case 'avg':
      return values.reduce((a, b) => a + b, 0) / values.length;
    case 'count':
      return values.length;
    case 'max':
      return Math.max(...values);
    case 'min':
      return Math.min(...values);
    default:
      return values.reduce((a, b) => a + b, 0);
  }
};

const applyFilters = (data: JoinedData[], filters: FilterCondition[]): JoinedData[] => {
  if (filters.length === 0) return data;

  return data.filter((item) => {
    return filters.every((filter) => {
      const dimValue = getDimensionValue(item, filter.fieldId);
      const filterValue = filter.value as string;

      switch (filter.operator) {
        case 'eq':
          return dimValue === filterValue;
        case 'neq':
          return dimValue !== filterValue;
        case 'contains':
          return dimValue.includes(filterValue);
        case 'in':
          return (filter.value as string[]).includes(dimValue);
        default:
          return true;
      }
    });
  });
};

export const generateChartData = (
  data: JoinedData[],
  config: AnalysisConfig
): ChartDataPoint[] => {
  const filteredData = applyFilters(data, config.filters);
  const { xAxis, yAxis, legend } = config;

  if (xAxis.length === 0 || yAxis.length === 0) {
    return [];
  }

  const xField = xAxis[0];
  const hasLegend = legend.length > 0;
  const legendField = legend[0];

  const groupedData = new Map<string, Map<string, number[]>>();

  filteredData.forEach((item) => {
    const xValue = getDimensionValue(item, xField.id);
    const legendValue = hasLegend ? getDimensionValue(item, legendField.id) : 'total';

    if (!groupedData.has(xValue)) {
      groupedData.set(xValue, new Map());
    }

    const legendMap = groupedData.get(xValue)!;
    yAxis.forEach((yField) => {
      const key = hasLegend ? `${yField.name}_${legendValue}` : yField.name;
      if (!legendMap.has(key)) {
        legendMap.set(key, []);
      }
      legendMap.get(key)!.push(getMeasureValue(item, yField.id));
    });
  });

  const result: ChartDataPoint[] = [];
  const sortedKeys = Array.from(groupedData.keys()).sort();

  sortedKeys.forEach((xValue) => {
    const point: ChartDataPoint = { name: xValue };
    const legendMap = groupedData.get(xValue)!;

    legendMap.forEach((values, key) => {
      const yField = yAxis.find((yf) => key.startsWith(yf.name));
      if (yField) {
        point[key] = Math.round(aggregateValues(values, yField.aggregation) * 100) / 100;
      }
    });

    result.push(point);
  });

  return result;
};

export const generateSankeyData = (
  data: JoinedData[],
  dimensions: ConfigField[]
): SankeyData => {
  if (dimensions.length < 2) {
    return { nodes: [], links: [] };
  }

  const nodes: { name: string; category: string }[] = [];
  const nodeIndexMap = new Map<string, number>();
  const linkMap = new Map<string, number>();

  const addNode = (name: string, category: string): number => {
    const key = `${category}-${name}`;
    if (nodeIndexMap.has(key)) {
      return nodeIndexMap.get(key)!;
    }
    const index = nodes.length;
    nodes.push({ name, category });
    nodeIndexMap.set(key, index);
    return index;
  };

  data.forEach((item) => {
    for (let i = 0; i < dimensions.length - 1; i++) {
      const sourceDim = dimensions[i];
      const targetDim = dimensions[i + 1];
      const sourceValue = getDimensionValue(item, sourceDim.id);
      const targetValue = getDimensionValue(item, targetDim.id);

      const sourceIndex = addNode(sourceValue, sourceDim.name);
      const targetIndex = addNode(targetValue, targetDim.name);

      const linkKey = `${sourceIndex}-${targetIndex}`;
      linkMap.set(linkKey, (linkMap.get(linkKey) || 0) + 1);
    }
  });

  const links = Array.from(linkMap.entries()).map(([key, value]) => {
    const [source, target] = key.split('-').map(Number);
    return { source, target, value };
  });

  return { nodes, links };
};

export const generateHeatmapData = (
  data: JoinedData[],
  xField: ConfigField,
  yField: ConfigField,
  valueField: ConfigField
): HeatmapCell[] => {
  const cellMap = new Map<string, number[]>();

  data.forEach((item) => {
    const xValue = getDimensionValue(item, xField.id);
    const yValue = getDimensionValue(item, yField.id);
    const key = `${xValue}||${yValue}`;

    if (!cellMap.has(key)) {
      cellMap.set(key, []);
    }
    cellMap.get(key)!.push(getMeasureValue(item, valueField.id));
  });

  const cells: HeatmapCell[] = [];
  cellMap.forEach((values, key) => {
    const [x, y] = key.split('||');
    cells.push({
      x,
      y,
      value: Math.round(aggregateValues(values, valueField.aggregation) * 100) / 100,
    });
  });

  return cells;
};

export const generateFunnelData = (
  data: JoinedData[],
  dimension: ConfigField,
  measure: ConfigField
): FunnelItem[] => {
  const valueMap = new Map<string, number[]>();

  data.forEach((item) => {
    const dimValue = getDimensionValue(item, dimension.id);
    if (!valueMap.has(dimValue)) {
      valueMap.set(dimValue, []);
    }
    valueMap.get(dimValue)!.push(getMeasureValue(item, measure.id));
  });

  const items: FunnelItem[] = Array.from(valueMap.entries())
    .map(([name, values]) => ({
      name,
      value: Math.round(aggregateValues(values, measure.aggregation) * 100) / 100,
    }))
    .sort((a, b) => b.value - a.value);

  return items;
};

export const generateScatterData = (
  data: JoinedData[],
  xField: ConfigField,
  yField: ConfigField,
  categoryField?: ConfigField
): ChartDataPoint[] => {
  if (categoryField) {
    const groupedMap = new Map<string, { x: number[]; y: number[] }>();

    data.forEach((item) => {
      const catValue = getDimensionValue(item, categoryField.id);
      if (!groupedMap.has(catValue)) {
        groupedMap.set(catValue, { x: [], y: [] });
      }
      const group = groupedMap.get(catValue)!;
      group.x.push(getMeasureValue(item, xField.id));
      group.y.push(getMeasureValue(item, yField.id));
    });

    return Array.from(groupedMap.entries()).map(([name, group]) => ({
      name,
      x: aggregateValues(group.x, xField.aggregation || 'avg'),
      y: aggregateValues(group.y, yField.aggregation || 'avg'),
      value: group.x.length,
    }));
  }

  const result: ChartDataPoint[] = data.map((item, index) => ({
    name: `点${index + 1}`,
    x: getMeasureValue(item, xField.id),
    y: getMeasureValue(item, yField.id),
    value: 1,
  }));

  return result;
};
