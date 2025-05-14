// src/components/inspection/types.ts

/**
 * 巡店检查项结果类型
 */
export enum InspectionCheckItemResult {
  Yes = '是',
  No = '否',
  NotApplicable = '不适用',
}

/**
 * 巡店检查项定义
 */
export interface InspectionCheckItemTemplate {
  id: string;
  text: string; // 检查项描述，例如：门店清洁度
  // resultType: 'yes_no_na' | 'rating_1_5'; // MVP 简化为 yes_no_na
}

/**
 * 单个巡店检查项的记录结果
 */
export interface InspectionCheckItemRecord {
  checkItemId: string; // 关联 InspectionCheckItemTemplate 的 ID
  result: InspectionCheckItemResult;
  notes?: string; // 对不符合项或需说明的文字描述
  photos?: string[]; // 问题照片链接列表 (Supabase Storage URLs)
}

/**
 * 巡店记录接口定义
 */
export interface InspectionRecord {
  id: string; // 巡店记录ID
  supervisorId: string; // 巡店员ID (HQ Supervisor)
  franchiseeId: string; // 被巡门店ID (Franchisee)
  inspectionDate: string; // 巡店日期 (ISO 8601 string)
  // templateId: string; // 巡店模板ID (MVP阶段可能只有一个默认模板)
  checkItems: InspectionCheckItemRecord[]; // 各检查项的记录结果
  summary?: string; // 整体巡店总结或建议
  createdAt: string; // 记录创建时间
  updatedAt: string; // 记录更新时间
}

/**
 * 用于创建或更新巡店记录的表单数据接口
 */
export interface InspectionRecordFormData {
  franchiseeId: string;
  inspectionDate: string;
  checkItems: Array<Omit<InspectionCheckItemRecord, 'photos'> & { photosToUpload?: File[] }>; // 简化照片处理
  summary?: string;
}

/**
 * 预设的巡店检查清单模板 (MVP)
 */
export const DEFAULT_INSPECTION_CHECKLIST_TEMPLATE: InspectionCheckItemTemplate[] = [
  { id: 'check_1', text: '门店清洁度是否达标？' },
  { id: 'check_2', text: '商品陈列是否规范有序？' },
  { id: 'check_3', text: '员工服务礼仪是否符合标准？' },
  { id: 'check_4', text: '店内VI形象是否正确执行？' },
  { id: 'check_5', text: '促销活动是否按要求布置？' },
  { id: 'check_6', text: '消防安全设施是否完好有效？' },
  { id: 'check_7', text: '食品安全操作是否规范？(若适用)' },
];