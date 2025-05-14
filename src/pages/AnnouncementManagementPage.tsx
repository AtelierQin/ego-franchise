// src/pages/AnnouncementManagementPage.tsx
import React, { useState, useEffect } from 'react';
import { Announcement, AnnouncementFormData, AnnouncementImportance } from '@/components/announcement/types';
import AnnouncementForm from '@/components/announcement/AnnouncementForm';
import AnnouncementList from '@/components/announcement/AnnouncementList';
import AnnouncementStatsModal from '@/components/announcement/AnnouncementStatsModal';
import AnnouncementDetail from '@/components/announcement/AnnouncementDetail';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import { useAuth, UserRole } from '@/components/auth/AuthContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/lib/supabase'; // 新增导入 supabase
import { useToast } from '@/components/ui/use-toast'; // 新增导入 useToast

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

// 定义提交给 handleAnnouncementSubmit 的数据结构
interface AnnouncementSubmitData extends Omit<AnnouncementFormData, 'attachment'> {
  attachmentUrl?: string;
}

const AnnouncementManagementPage: React.FC = () => {
  const { toast } = useToast(); // 初始化 toast
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
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedAnnouncementForStats, setSelectedAnnouncementForStats] = useState<Announcement | null>(null);
  
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
  const handleAnnouncementSubmit = async (data: AnnouncementSubmitData) => { // 修改参数类型
    const now = new Date().toISOString();
    // 模拟当前用户信息，实际应用中应从 AuthContext 获取
    const publisherId = profile?.id || 'mock_admin_id';
    const publisherName = profile?.full_name || '总部管理员';
    const now = new Date().toISOString();
    
    const announcementDataToSave = {
      title: data.title,
      content: data.content,
      importance: data.importance,
      target_audience_type: data.targetAudienceType,
      target_franchisee_ids: data.targetAudienceType === 'specific' ? data.selectedFranchiseeIds : null,
      attachment_url: data.attachmentUrl, // 使用传递过来的 attachmentUrl
      publisher_id: publisherId,
      // publisher_name: publisherName, // publisher_name 可以考虑从 profiles 表关联查询或在前端组合
      publish_date: now, // 对于新建，发布日期是现在
    };

    try {
      if (isEditing && selectedAnnouncement) {
        // 编辑现有公告
        const { error } = await supabase
          .from('announcements')
          .update({
            ...announcementDataToSave,
            updated_at: now,
            // publish_date 不应在编辑时更新，除非业务逻辑允许
          })
          .eq('id', selectedAnnouncement.id);
        if (error) throw error;
        toast({ title: '成功', description: '公告已更新。' });
        // 更新本地状态
        setAnnouncements(prev => prev.map(a => a.id === selectedAnnouncement.id ? { 
            ...a, 
            ...announcementDataToSave, 
            targetAudience: data.targetAudienceType === 'all' ? 'all_franchisees' : data.selectedFranchiseeIds,
            attachmentUrl: data.attachmentUrl,
            publishDate: a.publishDate, // 保持原有发布日期
            publisherName: publisherName, // 更新可能变化的发布者名
        } as Announcement : a));
        setIsEditing(false);
      } else {
        // 创建新公告
        const { data: newRecord, error } = await supabase
          .from('announcements')
          .insert(announcementDataToSave)
          .select()
          .single();
        if (error) throw error;
        if (!newRecord) throw new Error('创建公告失败，未返回记录。');
        
        toast({ title: '成功', description: '公告已发布。' });
        // 更新本地状态
        const newAnnouncementEntry: Announcement = {
          id: newRecord.id,
          title: newRecord.title,
          content: newRecord.content,
          publisherId: newRecord.publisher_id,
          publisherName: publisherName, // 假设
          publishDate: newRecord.publish_date,
          importance: newRecord.importance,
          targetAudience: newRecord.target_audience_type === 'all_franchisees' || newRecord.target_audience_type === 'all' 
                          ? 'all_franchisees' 
                          : newRecord.target_franchisee_ids || [],
          attachmentUrl: newRecord.attachment_url,
          readByFranchisees: [], // 新公告无人阅读
          createdAt: newRecord.created_at,
          updatedAt: newRecord.updated_at,
        };
        setAnnouncements(prev => [newAnnouncementEntry, ...prev]);
        setIsCreating(false);
      }
    } catch (error: any) {
      console.error('Error saving announcement:', error);
      toast({ title: '错误', description: `保存公告失败: ${error.message}`, variant: 'destructive' });
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

  // 查看公告统计
  const handleViewStats = (announcement: Announcement) => {
    setSelectedAnnouncementForStats(announcement);
    setShowStatsModal(true);
  };

  // 执行删除公告
  const handleDeleteAnnouncement = async () => {
    if (!announcementToDelete) return;
    
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', announcementToDelete);
      if (error) throw error;

      const updatedAnnouncements = announcements.filter(a => a.id !== announcementToDelete);
      setAnnouncements(updatedAnnouncements);
      
      if (selectedAnnouncement?.id === announcementToDelete) {
        setSelectedAnnouncement(null);
      }
      
      toast({ title: '成功', description: '公告已成功删除。' });
    } catch (err: any) {
      console.error('Error deleting announcement:', err);
      toast({ title: '错误', description: `删除公告失败: ${err.message}`, variant: 'destructive' });
    }
    
    setAnnouncementToDelete(null);
    setShowConfirmDialog(false);
  };

  // 标记公告为已读
  const handleMarkAsRead = async (announcementId: string) => {
    if (!currentUserId || readAnnouncementIds.includes(announcementId)) return;

    try {
      // 1. 更新 Supabase 数据库
      const { error } = await supabase
        .from('announcement_reads')
        .insert({
          announcement_id: announcementId,
          user_id: currentUserId,
          read_at: new Date().toISOString(),
        });
      if (error) {
        // 检查是否因为唯一约束冲突 (重复读取)
        if (error.code === '23505') { // PostgreSQL unique_violation
          console.warn(`User ${currentUserId} already marked announcement ${announcementId} as read.`);
        } else {
          throw error;
        }
      }

      // 2. 更新本地状态 (optimistic update or after successful DB operation)
      const updatedAnnouncements = announcements.map(a => {
        if (a.id === announcementId) {
          const readBy = Array.isArray(a.readByFranchisees) ? [...a.readByFranchisees] : [];
          if (!readBy.includes(currentUserId)) {
            readBy.push(currentUserId);
          }
          return { ...a, readByFranchisees: readBy };
        }
        return a;
      });
      setAnnouncements(updatedAnnouncements);
      setReadAnnouncementIds(prev => [...prev, announcementId]);
      toast({ title: '公告已标记为已读', description: `公告ID: ${announcementId}` });

    } catch (err: any) {
      console.error('Error marking announcement as read:', err);
      toast({ title: '错误', description: `标记已读失败: ${err.message}`, variant: 'destructive' });
    }
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
          onViewStats={isHqOps ? handleViewStats : undefined}
        />
      </>
    );
  }

  return (
    <div className="container mx-auto py-6">
      {/* 确认删除对话框 */}
      {/* 确认删除对话框 */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除这条公告吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAnnouncement} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* 成功提示对话框 - 可以用 Toast 替代，或者保留简单的确认 */}
      {/* AlertDialog for success is a bit heavy, consider using toast for success messages */}
      {/* For now, let's assume toasts are preferred for success messages */}
      {/* If a modal is strictly needed for success:
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>操作成功</AlertDialogTitle>
            <AlertDialogDescription>{successMessage || '操作已成功完成'}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowSuccessDialog(false)}>确定</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      */}
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

      {selectedAnnouncementForStats && (
        <AnnouncementStatsModal
          isOpen={showStatsModal}
          onClose={() => {
            setShowStatsModal(false);
            setSelectedAnnouncementForStats(null);
          }}
          announcementId={selectedAnnouncementForStats.id}
          announcementTitle={selectedAnnouncementForStats.title}
        />
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