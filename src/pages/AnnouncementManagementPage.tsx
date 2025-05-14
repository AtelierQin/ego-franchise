// src/pages/AnnouncementManagementPage.tsx
import React, { useState, useEffect } from 'react';
import { Announcement, AnnouncementFormData, AnnouncementImportance } from '@/components/announcement/types';
import AnnouncementForm from '@/components/announcement/AnnouncementForm';
import AnnouncementList from '@/components/announcement/AnnouncementList';
import AnnouncementDetail from '@/components/announcement/AnnouncementDetail';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import { useAuth, UserRole } from '@/components/auth/AuthContext';
import { AlertDialog } from '@/components/ui/alert-dialog';

// 模拟数据 - 实际应用中应从Supabase获取
const mockFranchisees = [
  { id: 'f1', name: '上海浦东店' },
  { id: 'f2', name: '北京朝阳店' },
  { id: 'f3', name: '广州天河店' },
  { id: 'f4', name: '深圳南山店' },
];

// 模拟公告数据
const mockAnnouncements: Announcement[] = [
  {
    id: 'a1',
    title: '2025年春节营业安排通知',
    content: '各加盟商：\n\n根据国家法定假日安排，2025年春节期间（2月18日至2月24日）总部将暂停发货。请各加盟商提前做好备货计划。\n\n春节前最后一批发货时间为2月17日，节后恢复发货时间为2月25日。\n\n祝各位新春快乐，生意兴隆！',
    publisherId: 'admin1',
    publisherName: '运营部 张经理',
    publishDate: '2025-01-15T10:00:00Z',
    importance: AnnouncementImportance.Important,
    targetAudience: 'all_franchisees',
    readByFranchisees: ['f1', 'f3'],
  },
  {
    id: 'a2',
    title: '新品上市预告：逸刻轻食系列',
    content: '各加盟商：\n\n我们很高兴地通知大家，逸刻轻食系列新品将于下月正式上市。该系列包含5款低卡健康轻食产品，针对年轻白领和健身人群，预计将带来可观的销售增长。\n\n详细产品介绍和价格将在下周发布，敬请期待。',
    publisherId: 'admin2',
    publisherName: '产品部 李经理',
    publishDate: '2025-01-10T14:30:00Z',
    importance: AnnouncementImportance.Normal,
    targetAudience: 'all_franchisees',
    readByFranchisees: ['f2'],
  },
  {
    id: 'a3',
    title: '北京地区门店促销活动指南',
    content: '北京地区加盟商：\n\n为配合北京市商圈春季促销季，总部将为北京地区门店提供专项促销支持。活动时间为3月1日至3月15日。\n\n请查看附件中的详细活动方案和物料申请流程。',
    publisherId: 'admin1',
    publisherName: '运营部 张经理',
    publishDate: '2025-01-05T09:15:00Z',
    importance: AnnouncementImportance.Normal,
    targetAudience: ['f2'],
    attachmentUrl: 'https://example.com/files/beijing_promotion.pdf',
    readByFranchisees: [],
  },
];

const AnnouncementManagementPage: React.FC = () => {
  // 获取认证上下文
  const { profile, hasRole } = useAuth();
  
  // 状态管理
  const [announcements, setAnnouncements] = useState<Announcement[]>(mockAnnouncements);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [readAnnouncementIds, setReadAnnouncementIds] = useState<string[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  
  // 根据用户角色确定页面行为
  const isFranchisee = hasRole('franchisee');
  const isHqOps = hasRole(['hq_ops', 'admin']);
  const currentUserId = profile?.id || '';
  const userRole = isFranchisee ? 'franchisee' : 'hq_ops_admin';
  
  // 初始化已读公告ID列表
  useEffect(() => {
    if (isFranchisee) {
      const readIds = announcements
        .filter(a => a.readByFranchisees?.includes(currentUserId))
        .map(a => a.id);
      setReadAnnouncementIds(readIds);
    }
  }, [announcements, isFranchisee, currentUserId]);

  // 处理公告提交（创建或编辑）
  const handleAnnouncementSubmit = (formData: AnnouncementFormData) => {
    const now = new Date().toISOString();
    
    if (isEditing && selectedAnnouncement) {
      // 编辑现有公告
      const updatedAnnouncements = announcements.map(a => {
        if (a.id === selectedAnnouncement.id) {
          return {
            ...a,
            title: formData.title,
            content: formData.content,
            importance: formData.importance,
            targetAudience: formData.targetAudienceType === 'all' ? 'all_franchisees' : formData.selectedFranchiseeIds,
            // 如果有新附件，则更新附件URL（实际应用中需要上传到Supabase Storage）
            attachmentUrl: formData.attachment ? URL.createObjectURL(formData.attachment) : a.attachmentUrl,
          };
        }
        return a;
      });
      
      setAnnouncements(updatedAnnouncements);
      setIsEditing(false);
    } else {
      // 创建新公告
      const newAnnouncement: Announcement = {
        id: `a${Date.now()}`, // 生成临时ID，实际应用中由数据库生成
        title: formData.title,
        content: formData.content,
        publisherId: 'admin1', // 模拟当前用户ID
        publisherName: '运营部 张经理', // 模拟当前用户名
        publishDate: now,
        importance: formData.importance,
        targetAudience: formData.targetAudienceType === 'all' ? 'all_franchisees' : formData.selectedFranchiseeIds,
        readByFranchisees: [],
        // 如果有附件，则设置附件URL（实际应用中需要上传到Supabase Storage）
        attachmentUrl: formData.attachment ? URL.createObjectURL(formData.attachment) : undefined,
      };
      
      setAnnouncements([newAnnouncement, ...announcements]);
      setIsCreating(false);
    }
    
    // 重置选中的公告
    setSelectedAnnouncement(null);
  };

  // 查看公告详情
  const handleViewDetails = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setIsCreating(false);
    setIsEditing(false);
  };

  // 编辑公告
  const handleEdit = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setIsEditing(true);
    setIsCreating(false);
  };

  // 处理删除公告确认
  const handleDelete = (announcementId: string) => {
    setAnnouncementToDelete(announcementId);
    setShowConfirmDialog(true);
  };

  // 执行删除公告
  const handleDeleteAnnouncement = () => {
    if (!announcementToDelete) return;
    
    // 实际应用中应调用Supabase删除
    const updatedAnnouncements = announcements.filter(a => a.id !== announcementToDelete);
    setAnnouncements(updatedAnnouncements);
    
    // 如果正在查看的公告被删除，关闭详情面板
    if (selectedAnnouncement?.id === announcementToDelete) {
      setSelectedAnnouncement(null);
    }
    
    setAnnouncementToDelete(null);
    setShowConfirmDialog(false);
    
    // 显示成功消息
    setSuccessMessage('公告已成功删除');
    setShowSuccessDialog(true);
  };

  // 标记公告为已读
  const handleMarkAsRead = (announcementId: string) => {
    // 更新公告的已读状态
    const updatedAnnouncements = announcements.map(a => {
      if (a.id === announcementId) {
        const readByFranchisees = [...(a.readByFranchisees || [])];
        if (!readByFranchisees.includes(currentUserId)) {
          readByFranchisees.push(currentUserId);
        }
        return { ...a, readByFranchisees };
      }
      return a;
    });
    
    setAnnouncements(updatedAnnouncements);
    setReadAnnouncementIds([...readAnnouncementIds, announcementId]);
  };

  // 取消创建或编辑
  const handleCancel = () => {
    setIsCreating(false);
    setIsEditing(false);
    setSelectedAnnouncement(null);
  };

  // 渲染内容
  const renderContent = () => {
    if (isCreating || isEditing) {
      return (
        <AnnouncementForm
          initialData={isEditing ? selectedAnnouncement : null}
          onSubmit={handleAnnouncementSubmit}
          onCancel={handleCancel}
          franchisees={mockFranchisees}
        />
      );
    }

    if (selectedAnnouncement) {
      return (
        <AnnouncementDetail
          announcement={selectedAnnouncement}
          onBack={() => setSelectedAnnouncement(null)}
          onMarkAsRead={isFranchisee ? () => handleMarkAsRead(selectedAnnouncement.id) : undefined}
          isRead={isFranchisee && readAnnouncementIds.includes(selectedAnnouncement.id)}
          userRole={isFranchisee ? 'franchisee' : 'hq_ops_admin'}
        />
      );
    }

    return (
      <>
        {isHqOps && (
          <div className="flex justify-end mb-4">
            <Button 
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-1"
              aria-label="创建新公告"
            >
              <Plus className="h-4 w-4" />
              创建新公告
            </Button>
          </div>
        )}
        
        <AnnouncementList
          announcements={announcements}
          onViewDetails={handleViewDetails}
          onEdit={isHqOps ? handleEdit : undefined}
          onDelete={isHqOps ? handleDelete : undefined}
          onMarkAsRead={isFranchisee ? handleMarkAsRead : undefined}
          userRole={isFranchisee ? 'franchisee' : 'hq_ops_admin'}
          readAnnouncementIds={readAnnouncementIds}
        />
      </>
    );
  }

  return (
    <div className="container mx-auto py-6">
      {/* 确认删除对话框 */}
      <AlertDialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        title="确认删除"
        description="您确定要删除这条公告吗？此操作无法撤销。"
        cancelText="取消"
        confirmText="删除"
        onConfirm={handleDeleteAnnouncement}
        variant="destructive"
      />
      
      {/* 成功提示对话框 */}
      <AlertDialog
        open={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
        title="操作成功"
        description={successMessage || '操作已成功完成'}
        confirmText="确定"
      />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">公告管理</h1>
        <div className="flex space-x-4">
          {/* 显示当前用户角色 */}
          <div className="px-4 py-2 bg-gray-100 rounded-md">
            当前角色: {isFranchisee ? '加盟商' : isHqOps ? '总部运营' : '其他'}
          </div>
          
          {/* 总部角色才显示新建公告按钮 */}
          {isHqOps && (
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="mr-2 h-4 w-4" /> 新建公告
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">全部公告</TabsTrigger>
          <TabsTrigger value="important">重要公告</TabsTrigger>
          {isFranchisee && (
            <TabsTrigger value="unread">未读公告</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="all" className="mt-0">
          <Card>
            <CardContent className="pt-6">
              {renderContent()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="important" className="mt-0">
          <Card>
            <CardContent className="pt-6">
              {isCreating || isEditing || selectedAnnouncement ? (
                renderContent()
              ) : (
                <AnnouncementList
                  announcements={announcements.filter(a => a.importance === AnnouncementImportance.Important)}
                  onViewDetails={handleViewDetails}
                  onEdit={isHqOps ? handleEdit : undefined}
                  onDelete={isHqOps ? handleDelete : undefined}
                  onMarkAsRead={isFranchisee ? handleMarkAsRead : undefined}
                  userRole={isFranchisee ? 'franchisee' : 'hq_ops_admin'}
                  readAnnouncementIds={readAnnouncementIds}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isFranchisee && (
          <TabsContent value="unread" className="mt-0">
            <Card>
              <CardContent className="pt-6">
                {isCreating || isEditing || selectedAnnouncement ? (
                  renderContent()
                ) : (
                  <AnnouncementList
                    announcements={announcements.filter(a => !readAnnouncementIds.includes(a.id))}
                    onViewDetails={handleViewDetails}
                    onEdit={undefined}
                    onDelete={undefined}
                    onMarkAsRead={handleMarkAsRead}
                    userRole="franchisee"
                    readAnnouncementIds={readAnnouncementIds}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );