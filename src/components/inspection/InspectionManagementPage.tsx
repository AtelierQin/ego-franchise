// src/components/inspection/InspectionManagementPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  InspectionRecord,
  InspectionRecordFormData,
  DEFAULT_INSPECTION_CHECKLIST_TEMPLATE,
  InspectionCheckItemResult
} from './types';
import InspectionRecordList, { InspectionRecordDetails } from './InspectionRecordList';
import InspectionRecordForm from './InspectionRecordForm';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase'; // Assuming supabase client is configured
import { toast } from 'sonner'; // Or your preferred toast library
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';

// Mock user roles for demonstration
type UserRole = 'franchisee' | 'hq_supervisor';

interface InspectionManagementPageProps {
  currentUserRole: UserRole;
  currentUserId: string; // For supervisor to create, or franchisee to see their own records
}

const InspectionManagementPage: React.FC<InspectionManagementPageProps> = ({ currentUserRole, currentUserId }) => {
  const [records, setRecords] = useState<InspectionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<InspectionRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<InspectionRecord | null>(null);
  const [currentFranchiseeIdForNewRecord, setCurrentFranchiseeIdForNewRecord] = useState('');

  const fetchInspectionRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase.from('inspection_records').select('*');
      if (currentUserRole === 'franchisee') {
        query = query.eq('franchiseeId', currentUserId);
      }
      // Supervisors see all records they've created or all records if admin-like powers
      // For simplicity, let's assume supervisors can see all for now, or filter by supervisorId if needed
      // query = query.eq('supervisorId', currentUserId); 
      query = query.order('inspectionDate', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      setRecords(data as InspectionRecord[]);
    } catch (error: any) {
      console.error('Error fetching inspection records:', error);
      toast.error('获取巡店记录失败: ' + error.message);
    }
    setIsLoading(false);
  }, [currentUserRole, currentUserId]);

  useEffect(() => {
    fetchInspectionRecords();
  }, [fetchInspectionRecords]);

  const handleCreateNew = () => {
    if (currentUserRole === 'hq_supervisor') {
      if (!currentFranchiseeIdForNewRecord) {
        toast.info('请输入要巡检的加盟商ID。');
        // Mock for demo
        // setCurrentFranchiseeIdForNewRecord(`FRAN-${Date.now().toString().slice(-4)}`);
        // return;
      }
      setEditingRecord(null);
      setShowForm(true);
    } else {
      toast.error('您没有权限创建巡店记录。');
    }
  };

  const handleEdit = (record: InspectionRecord) => {
    if (currentUserRole === 'hq_supervisor') {
      // Convert InspectionRecord to InspectionRecordFormData
      const formData: InspectionRecordFormData = {
        franchiseeId: record.franchiseeId,
        inspectionDate: record.inspectionDate.split('T')[0], // Assuming ISO string
        checkItems: record.checkItems.map(ci => ({ ...ci, photosToUpload: [] })), // photosToUpload needs to be handled separately
        summary: record.summary || '',
      };
      setEditingRecord(record); // Keep original record for ID and other non-form data
      setCurrentFranchiseeIdForNewRecord(record.franchiseeId);
      setShowForm(true);
    } else {
      toast.error('您没有权限编辑巡店记录。');
    }
  };

  // Mock file upload to Supabase Storage
  const uploadFiles = async (filesMap: Map<string, File[]>): Promise<Map<string, string[]>> => {
    const uploadedFileUrls = new Map<string, string[]>();
    for (const [checkItemId, files] of filesMap.entries()) {
      if (files.length === 0) continue;
      const urls: string[] = [];
      for (const file of files) {
        const fileName = `${currentUserId}/${checkItemId}/${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage.from('inspection-photos').upload(fileName, file);
        if (error) {
          toast.error(`上传文件 ${file.name} 失败: ${error.message}`);
          throw error;
        }
        // Get public URL. Adjust if your bucket has RLS and requires signed URLs.
        const { data: publicUrlData } = supabase.storage.from('inspection-photos').getPublicUrl(data.path);
        urls.push(publicUrlData.publicUrl);
      }
      uploadedFileUrls.set(checkItemId, urls);
    }
    return uploadedFileUrls;
  };

  const handleSubmitForm = async (formData: InspectionRecordFormData, filesToUpload: Map<string, File[]>) => {
    setIsLoading(true);
    try {
      const uploadedPhotoUrlsByCheckItem = await uploadFiles(filesToUpload);

      const finalCheckItems: InspectionRecord['checkItems'] = formData.checkItems.map(item => {
        const existingPhotos = editingRecord?.checkItems.find(ci => ci.checkItemId === item.checkItemId)?.photos || [];
        const newUrls = uploadedPhotoUrlsByCheckItem.get(item.checkItemId) || [];
        // If editing and new files are uploaded for an item, decide if old ones are replaced or appended.
        // For simplicity, let's assume new uploads replace old ones for that item if any new files are present.
        return {
          checkItemId: item.checkItemId,
          result: item.result,
          notes: item.notes,
          photos: newUrls.length > 0 ? newUrls : (item.photosToUpload && item.photosToUpload.length === 0 && editingRecord ? existingPhotos : newUrls),
        };
      });

      const recordToSave = {
        supervisorId: currentUserId, // Assuming currentUserId is the supervisor's ID
        franchiseeId: formData.franchiseeId,
        inspectionDate: new Date(formData.inspectionDate).toISOString(),
        checkItems: finalCheckItems,
        summary: formData.summary,
        updatedAt: new Date().toISOString(),
      };

      if (editingRecord && editingRecord.id) {
        const { error } = await supabase
          .from('inspection_records')
          .update({...recordToSave, createdAt: editingRecord.createdAt }) // Keep original createdAt
          .eq('id', editingRecord.id);
        if (error) throw error;
        toast.success('巡店记录更新成功！');
      } else {
        const { error } = await supabase
          .from('inspection_records')
          .insert([{ ...recordToSave, createdAt: new Date().toISOString() }]);
        if (error) throw error;
        toast.success('巡店记录创建成功！');
      }
      setShowForm(false);
      setEditingRecord(null);
      fetchInspectionRecords(); // Refresh list
    } catch (error: any) {
      console.error('Error saving inspection record:', error);
      toast.error('保存巡店记录失败: ' + error.message);
    }
    setIsLoading(false);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingRecord(null);
  };

  const handleViewDetails = (record: InspectionRecord) => {
    setViewingRecord(record);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-primary">巡店管理</h1>

      {currentUserRole === 'hq_supervisor' && !showForm && (
        <div className="mb-4 flex items-end space-x-2">
          <div className='flex-grow'>
            <Label htmlFor="newRecordFranchiseeId">加盟商ID (用于新建)</Label>
            <Input 
              id="newRecordFranchiseeId"
              type="text" 
              placeholder="例如: FRAN-001"
              value={currentFranchiseeIdForNewRecord}
              onChange={(e) => setCurrentFranchiseeIdForNewRecord(e.target.value)}
              className="p-1 rounded text-sm w-full md:w-1/3"
            />
          </div>
          <Button onClick={handleCreateNew} disabled={isLoading || !currentFranchiseeIdForNewRecord}>
            新建巡店记录
          </Button>
        </div>
      )}

      {showForm && currentUserRole === 'hq_supervisor' ? (
        <InspectionRecordForm
          // If editingRecord exists, we need to transform it to InspectionRecordFormData
          initialData={editingRecord ? {
            franchiseeId: editingRecord.franchiseeId,
            inspectionDate: editingRecord.inspectionDate.split('T')[0],
            checkItems: editingRecord.checkItems.map(ci => ({...ci, photosToUpload: []})), // photosToUpload is transient
            summary: editingRecord.summary
          } : null}
          onSubmit={handleSubmitForm}
          onCancel={handleCancelForm}
          franchiseeId={currentFranchiseeIdForNewRecord} // Pass current value for new records
          isLoading={isLoading}
        />
      ) : (
        <>
          {isLoading && <p className="text-center py-4">加载中...</p>}
          {!isLoading && records.length === 0 && <p className="text-center text-gray-500 py-8">当前没有巡店记录。</p>}
          {!isLoading && records.length > 0 && (
            <InspectionRecordList
              records={records}
              onEdit={currentUserRole === 'hq_supervisor' ? handleEdit : undefined}
              onViewDetails={handleViewDetails}
              userRole={currentUserRole}
            />
          )}
        </>
      )}

      {viewingRecord && (
        <Dialog open={!!viewingRecord} onOpenChange={() => setViewingRecord(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>巡店记录详情</DialogTitle>
              <DialogDescription>
                加盟商: {viewingRecord.franchiseeId} - 日期: {new Date(viewingRecord.inspectionDate).toLocaleDateString()}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] p-1">
                <InspectionRecordDetails record={viewingRecord} />
            </ScrollArea>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">关闭</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default InspectionManagementPage;