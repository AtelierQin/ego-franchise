// src/components/announcement/types.ts

/**
 * 公告重要等级
 */
export enum AnnouncementImportance {
  Normal = '普通',
  Important = '重要',
}

/**
 * 公告接口定义
 */
export interface Announcement {
  id: string; // 公告ID
  title: string; // 标题
  content: string; // 内容 (支持Markdown或简单富文本)
  attachmentUrl?: string; // 附件链接 (Supabase Storage URL)
  publisherId: string; // 发布人ID (HQ Ops/Admin)
  publisherName?: string; // 发布人姓名
  publishDate: string; // 发布时间 (ISO 8601 string)
  importance: AnnouncementImportance; // 重要等级
  targetAudience: 'all_franchisees' | string[]; // 接收对象: 'all_franchisees' 或加盟商ID列表
  readByFranchisees?: string[]; // 已读加盟商ID列表
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 用于创建或更新公告的表单数据接口
 */
export interface AnnouncementFormData {
  title: string;
  content: string;
  attachment?: File | null; // 用于上传的新附件
  importance: AnnouncementImportance;
  targetAudienceType: 'all' | 'specific';
  selectedFranchiseeIds: string[]; // 仅当 targetAudienceType 为 'specific' 时使用
}

/**
 * 公告已读回执记录
 */
export interface AnnouncementReadReceipt {
  id: string;
  announcementId: string;
  franchiseeId: string;
  readAt: string; // 阅读时间 (ISO 8601 string)
}