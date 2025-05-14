// src/components/announcement/AnnouncementList.tsx
import React from 'react';
import { Announcement, AnnouncementImportance } from './types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AnnouncementListProps {
  announcements: Announcement[];
  onViewDetails: (announcement: Announcement) => void;
  onMarkAsRead?: (announcementId: string) => void; // For Franchisee
  onEdit?: (announcement: Announcement) => void; // For HQ Ops/Admin
  onDelete?: (announcementId: string) => void; // For HQ Ops/Admin
  onViewStats?: (announcement: Announcement) => void; // For HQ Ops/Admin to view read statistics
  userRole: 'franchisee' | 'hq_ops_admin';
  readAnnouncementIds?: string[]; // For Franchisee to show read status
}

const getImportanceVariant = (importance: AnnouncementImportance): 'default' | 'destructive' | 'secondary' => {
  switch (importance) {
    case AnnouncementImportance.Important:
      return 'destructive'; // More prominent for important
    case AnnouncementImportance.Normal:
      return 'secondary';
    default:
      return 'secondary';
  }
};

const AnnouncementList: React.FC<AnnouncementListProps> = ({
  announcements,
  onViewDetails,
  onMarkAsRead,
  onEdit,
  onDelete,
  onViewStats, // Add onViewStats to destructured props
  userRole,
  readAnnouncementIds = [],
}) => {
  if (!announcements || announcements.length === 0) {
    return <p className="text-center text-gray-500 py-4">当前没有公告。</p>;
  }

  return (
    <ScrollArea className="rounded-md border h-[calc(100vh-250px)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>标题</TableHead>
            <TableHead>重要等级</TableHead>
            <TableHead>发布日期</TableHead>
            {userRole === 'hq_ops_admin' && <TableHead>发布人</TableHead>}
            {userRole === 'hq_ops_admin' && <TableHead>接收对象</TableHead>}
            {userRole === 'franchisee' && <TableHead>阅读状态</TableHead>}
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {announcements.map(announcement => {
            const isRead = userRole === 'franchisee' && readAnnouncementIds.includes(announcement.id);
            return (
              <TableRow key={announcement.id} className={isRead ? 'opacity-70' : ''}>
                <TableCell className="font-medium max-w-xs truncate" title={announcement.title}>{announcement.title}</TableCell>
                <TableCell>
                  <Badge variant={getImportanceVariant(announcement.importance)}>{announcement.importance}</Badge>
                </TableCell>
                <TableCell>{new Date(announcement.publishDate).toLocaleDateString()}</TableCell>
                {userRole === 'hq_ops_admin' && <TableCell>{announcement.publisherId}</TableCell>}
                {userRole === 'hq_ops_admin' && (
                  <TableCell className="max-w-[150px] truncate" title={Array.isArray(announcement.targetAudience) ? announcement.targetAudience.join(', ') : '全体加盟商'}>
                    {Array.isArray(announcement.targetAudience) ? `${announcement.targetAudience.length} 个特定加盟商` : '全体加盟商'}
                  </TableCell>
                )}
                {userRole === 'franchisee' && (
                  <TableCell>
                    {isRead ? (
                      <Badge variant="default">已读</Badge>
                    ) : (
                      <Badge variant="outline">未读</Badge>
                    )}
                  </TableCell>
                )}
                <TableCell className="text-right space-x-2 whitespace-nowrap">
                  <Button variant="ghost" size="sm" onClick={() => onViewDetails(announcement)}>
                    查看详情
                  </Button>
                  {userRole === 'franchisee' && !isRead && onMarkAsRead && (
                    <Button variant="outline" size="sm" onClick={() => onMarkAsRead(announcement.id)}>
                      标记已读
                    </Button>
                  )}
                  {userRole === 'hq_ops_admin' && onEdit && (
                    <Button variant="outline" size="sm" onClick={() => onEdit(announcement)}>
                      编辑
                    </Button>
                  )}
                  {userRole === 'hq_ops_admin' && onDelete && (
                    <Button variant="destructive" size="sm" onClick={() => onDelete(announcement.id)}>
                      删除
                    </Button>
                  )}
                  {userRole === 'hq_ops_admin' && onViewStats && (
                    <Button variant="outline" size="sm" onClick={() => onViewStats(announcement)}>
                      查看统计
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </ScrollArea>
  );
};

export default AnnouncementList;