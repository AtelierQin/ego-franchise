// src/components/announcement/AnnouncementDetail.tsx
import React from 'react';
import { Announcement, AnnouncementImportance } from './types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Download, ArrowLeft, CheckCircle } from 'lucide-react';

interface AnnouncementDetailProps {
  announcement: Announcement;
  onBack: () => void;
  onMarkAsRead?: () => void;
  isRead?: boolean;
  userRole: 'franchisee' | 'hq_ops_admin';
}

const AnnouncementDetail: React.FC<AnnouncementDetailProps> = ({
  announcement,
  onBack,
  onMarkAsRead,
  isRead = false,
  userRole,
}) => {
  const { title, content, importance, publishDate, attachmentUrl, publisherName } = announcement;
  
  const formattedDate = publishDate ? format(new Date(publishDate), 'yyyy-MM-dd HH:mm') : '';
  
  const handleDownloadAttachment = () => {
    if (attachmentUrl) {
      window.open(attachmentUrl, '_blank');
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="flex items-center gap-1"
            aria-label="返回公告列表"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
          
          <Badge 
            variant={importance === AnnouncementImportance.Important ? 'destructive' : 'secondary'}
            className="ml-2"
          >
            {importance}
          </Badge>
        </div>
        
        <CardTitle className="text-2xl mt-4">{title}</CardTitle>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mt-2">
          <span>发布人: {publisherName}</span>
          <span>发布时间: {formattedDate}</span>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 pb-4">
        <div className="prose max-w-none">
          {/* 支持Markdown或富文本渲染，这里简单使用白文本和换行符 */}
          {content.split('\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
        
        {attachmentUrl && (
          <div className="mt-6 p-4 border rounded-md bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">附件</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownloadAttachment}
                className="flex items-center gap-1"
                aria-label="下载附件"
              >
                <Download className="h-4 w-4" />
                下载
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      
      {userRole === 'franchisee' && (
        <CardFooter className="flex justify-end border-t pt-4">
          <Button
            variant={isRead ? 'outline' : 'default'}
            onClick={onMarkAsRead}
            disabled={isRead}
            className="flex items-center gap-1"
            aria-label={isRead ? '已标记为已读' : '标记为已读'}
          >
            <CheckCircle className="h-4 w-4" />
            {isRead ? '已读' : '标记为已读'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default AnnouncementDetail;