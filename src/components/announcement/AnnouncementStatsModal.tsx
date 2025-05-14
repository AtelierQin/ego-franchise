// /Users/hq/Documents/Coding/ego-franchise/ego-franchise/src/components/announcement/AnnouncementStatsModal.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { User } from '@supabase/supabase-js'; // Assuming you might want to fetch user details
import { toast } from 'sonner';

interface AnnouncementStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcementId: string | null;
  announcementTitle: string | null;
}

interface ReadRecord {
  user_id: string;
  read_at: string;
  // Potentially join with users table to get user details like email or name
  users?: { email?: string; raw_user_meta_data?: { name?: string } };
}

const AnnouncementStatsModal: React.FC<AnnouncementStatsModalProps> = ({ isOpen, onClose, announcementId, announcementTitle }) => {
  const [readRecords, setReadRecords] = useState<ReadRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  // For MVP, we'll just list who read. Determining total target audience and unread can be complex.

  const fetchReadStats = useCallback(async () => {
    if (!announcementId) return;
    setLoading(true);
    try {
      // Fetch users who have read this announcement
      // We also attempt to fetch basic user info (email, name) if profiles/users table is set up for it
      const { data, error } = await supabase
        .from('announcement_reads')
        .select(`
          user_id,
          read_at,
          users ( email, raw_user_meta_data->name )
        `)
        .eq('announcement_id', announcementId)
        .order('read_at', { ascending: false });

      if (error) throw error;
      setReadRecords(data || []);
    } catch (err: any) {
      console.error('Error fetching announcement read stats:', err);
      toast.error('加载阅读统计失败', { description: err.message });
    }
    setLoading(false);
  }, [announcementId]);

  useEffect(() => {
    if (isOpen && announcementId) {
      fetchReadStats();
    }
  }, [isOpen, announcementId, fetchReadStats]);

  if (!isOpen || !announcementId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>阅读统计: {announcementTitle || '公告'}</DialogTitle>
          <DialogDescription>
            查看已阅读此公告的用户列表。
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="p-6 text-center">正在加载统计数据...</div>
        ) : (
          <ScrollArea className="h-[400px] mt-4">
            {readRecords.length === 0 ? (
              <p className="text-center text-gray-500 py-4">暂无用户阅读此公告。</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用户</TableHead>
                    <TableHead>阅读时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {readRecords.map((record) => (
                    <TableRow key={record.user_id}>
                      <TableCell>
                        {record.users?.raw_user_meta_data?.name || record.users?.email || record.user_id}
                      </TableCell>
                      <TableCell>{new Date(record.read_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        )}

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AnnouncementStatsModal;