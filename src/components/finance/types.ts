// src/components/finance/types.ts

/**
 * 货款记录状态
 */
export enum FeeStatus {
  Pending = '待支付',
  Paid = '已支付',
  Overdue = '已逾期', // 可选，MVP阶段可能不包含
}

/**
 * 货款记录接口定义
 */
export interface FeeRecord {
  id: string; // 货款记录ID
  orderId: string; // 关联订单ID
  franchiseeId: string; // 加盟商ID
  amount: number; // 应付金额
  currency: string; // 币种，默认为 CNY
  generatedDate: string; // 生成日期 (ISO 8601 string)
  status: FeeStatus; // 支付状态
  paymentDate?: string; // 支付日期 (ISO 8601 string, optional)
  operatorId?: string; // 操作人ID (HQ Finance)
  remarks?: string; // 备注 (optional)
  // 关联订单的简要信息，方便展示
  orderNumber?: string; // 订单号
  orderDate?: string; // 订单日期
}

/**
 * 用于创建或更新货款记录的表单数据接口
 */
export interface FeeRecordFormData {
  orderId: string;
  franchiseeId: string;
  amount: number;
  status: FeeStatus;
  paymentDate?: string;
  remarks?: string;
}

/**
 * 月度对账提醒信息
 */
export interface MonthlyStatement {
  franchiseeId: string;
  month: string; // YYYY-MM 格式
  totalDueAmount: number; // 本月应付货款总额
  outstandingBalance: number; // 当前未付货款总额
  statementDate: string; // 对账单生成日期
}