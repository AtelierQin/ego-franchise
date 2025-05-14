import { createClient } from '@supabase/supabase-js';

// 这里使用环境变量，实际开发时需要在.env文件中配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// 创建Supabase客户端实例
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 用户角色枚举
export enum UserRole {
  APPLICANT = 'applicant',      // 意向加盟商
  FRANCHISEE = 'franchisee',    // 已签约/运营加盟商
  HQ_RECRUITER = 'hq_recruiter', // 总部招商专员
  HQ_OPS = 'hq_ops',           // 总部运营专员
  HQ_SUPERVISOR = 'hq_supervisor', // 总部区域督导
  HQ_FINANCE = 'hq_finance',    // 总部财务专员
  ADMIN = 'admin',             // 系统管理员
}

// 申请状态枚举
export enum ApplicationStatus {
  PENDING = 'pending',         // 待审核
  REVIEWING = 'reviewing',     // 审核中
  APPROVED = 'approved',       // 已通过
  REJECTED = 'rejected',       // 已驳回
  NEED_MORE_INFO = 'need_more_info', // 需补充材料
}

// 合同状态枚举
export enum ContractStatus {
  PENDING = 'pending',         // 待签署
  PARTIALLY_SIGNED = 'partially_signed', // 部分签署
  SIGNED = 'signed',           // 已签署
}

// 订单状态枚举
export enum OrderStatus {
  PENDING = 'pending',         // 待处理
  PROCESSING = 'processing',   // 处理中/已确认
  SHIPPED = 'shipped',         // 已发货
  COMPLETED = 'completed',     // 已完成/已收货
}

// 工单状态枚举
export enum TicketStatus {
  PENDING = 'pending',         // 待处理
  PROCESSING = 'processing',   // 处理中
  RESOLVED = 'resolved',       // 已解决/已关闭
}

// 货款支付状态枚举
export enum PaymentStatus {
  PENDING = 'pending',         // 待支付
  PAID = 'paid',               // 已支付
}