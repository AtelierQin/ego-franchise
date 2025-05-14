// src/components/announcement/AnnouncementForm.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AnnouncementFormData, AnnouncementImportance, Announcement } from './types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox'; // Assuming you have a Checkbox component

interface AnnouncementFormProps {
  initialData?: Announcement | null;
  onSubmit: (data: AnnouncementFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  // Mock list of franchisees for selection, in a real app this would come from a data source
  franchisees?: Array<{ id: string; name: string }>; 
}

const AnnouncementForm: React.FC<AnnouncementFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  franchisees = [], // Default to empty array
}) => {
  const [formData, setFormData] = useState<AnnouncementFormData>({
    title: initialData?.title || '',
    content: initialData?.content || '',
    attachment: null,
    importance: initialData?.importance || AnnouncementImportance.Normal,
    targetAudienceType: initialData?.targetAudience === 'all_franchisees' ? 'all' : (initialData?.targetAudience && initialData.targetAudience.length > 0 ? 'specific' : 'all'),
    selectedFranchiseeIds: initialData?.targetAudience && Array.isArray(initialData.targetAudience) ? initialData.targetAudience : [],
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        content: initialData.content,
        attachment: null, // Attachment re-upload is required for edits
        importance: initialData.importance,
        targetAudienceType: initialData.targetAudience === 'all_franchisees' ? 'all' : 'specific',
        selectedFranchiseeIds: Array.isArray(initialData.targetAudience) ? initialData.targetAudience : [],
      });
    } else {
      setFormData({
        title: '',
        content: '',
        attachment: null,
        importance: AnnouncementImportance.Normal,
        targetAudienceType: 'all',
        selectedFranchiseeIds: [],
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImportanceChange = (value: AnnouncementImportance) => {
    setFormData(prev => ({ ...prev, importance: value }));
  };

  const handleTargetAudienceTypeChange = (value: 'all' | 'specific') => {
    setFormData(prev => ({ 
      ...prev, 
      targetAudienceType: value,
      selectedFranchiseeIds: value === 'all' ? [] : prev.selectedFranchiseeIds 
    }));
  };

  const handleFranchiseeSelectionChange = (franchiseeId: string) => {
    setFormData(prev => {
      const newSelectedIds = prev.selectedFranchiseeIds.includes(franchiseeId)
        ? prev.selectedFranchiseeIds.filter(id => id !== franchiseeId)
        : [...prev.selectedFranchiseeIds, franchiseeId];
      return { ...prev, selectedFranchiseeIds: newSelectedIds };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, attachment: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    let attachmentUrl: string | undefined = initialData?.attachmentUrl;

    if (formData.attachment) {
      const file = formData.attachment;
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `announcement-attachments/${fileName}`;

      try {
        const { error: uploadError } = await supabase.storage
          .from('announcement-attachments') // Make sure this bucket exists and has correct policies
          .upload(filePath, file);

        if (uploadError) {
          console.error('Error uploading attachment:', uploadError);
          // Handle error (e.g., show a toast message)
          alert(`附件上传失败: ${uploadError.message}`);
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from('announcement-attachments')
          .getPublicUrl(filePath);
        
        attachmentUrl = publicUrlData.publicUrl;
      } catch (error) {
        console.error('Error during attachment upload process:', error);
        alert('附件上传过程中发生错误。');
        return;
      }
    }

    // Prepare data for submission, excluding the File object if it was uploaded
    const submissionData: AnnouncementFormData & { attachmentUrl?: string } = {
      ...formData,
      attachmentUrl: attachmentUrl,
    };
    // The actual File object should not be part of the data sent to the backend if it's already uploaded.
    // The onSubmit prop expects AnnouncementFormData, which has `attachment?: File | null`.
    // We need to ensure the parent component (AnnouncementManagementPage) handles this correctly.
    // For now, we'll pass the original formData structure but the parent should use attachmentUrl.
    // Or, we modify onSubmit to accept attachmentUrl directly.
    // Let's assume onSubmit will be adapted or a new prop is used for the URL.

    // For the purpose of this component, we'll call onSubmit with the original formData structure,
    // but the parent (AnnouncementManagementPage) will need to be aware of the new attachmentUrl if it's handling the DB save.
    // A better approach would be for onSubmit to take the final data structure including attachmentUrl.
    // Let's modify what we pass to onSubmit.
    const finalDataToSubmit = {
        title: formData.title,
        content: formData.content,
        importance: formData.importance,
        targetAudienceType: formData.targetAudienceType,
        selectedFranchiseeIds: formData.selectedFranchiseeIds,
        // attachment: formData.attachment, // No longer sending the file object directly if uploaded
        attachmentUrl: attachmentUrl, // Send the URL instead
    };

    onSubmit(finalDataToSubmit as any); // Cast as any for now, parent needs to expect attachmentUrl
  };

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>{initialData ? '编辑公告' : '新建公告'}</CardTitle>
        <CardDescription>填写公告内容并选择发布对象。</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">标题</Label>
            <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="content">内容 (支持Markdown)</Label>
            <Textarea id="content" name="content" value={formData.content} onChange={handleChange} required rows={8} placeholder="输入公告正文..." />
          </div>
          <div>
            <Label htmlFor="importance">重要等级</Label>
            <Select onValueChange={handleImportanceChange} defaultValue={formData.importance}>
              <SelectTrigger id="importance">
                <SelectValue placeholder="选择等级" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(AnnouncementImportance).map(level => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="attachment">附件 (可选, PDF)</Label>
            <Input id="attachment" type="file" accept=".pdf" onChange={handleFileChange} />
            {initialData?.attachmentUrl && !formData.attachment && (
              <p className="text-xs text-gray-500 mt-1">当前附件: <a href={initialData.attachmentUrl} target="_blank" rel="noopener noreferrer" className="underline">查看附件</a> (上传新附件将替换)</p>
            )}
            {formData.attachment && (
              <p className="text-xs text-gray-500 mt-1">已选择文件: {formData.attachment.name}</p>
            )}
          </div>
          <div>
            <Label>接收对象</Label>
            <Select onValueChange={handleTargetAudienceTypeChange} defaultValue={formData.targetAudienceType}>
              <SelectTrigger>
                <SelectValue placeholder="选择接收对象类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全体已签约加盟商</SelectItem>
                <SelectItem value="specific">特定加盟商</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {formData.targetAudienceType === 'specific' && (
            <div className="p-3 border rounded-md max-h-60 overflow-y-auto">
              <Label className="mb-2 block">选择特定加盟商:</Label>
              {franchisees.length > 0 ? franchisees.map(fran => (
                <div key={fran.id} className="flex items-center space-x-2 mb-1">
                  <Checkbox 
                    id={`fran-${fran.id}`}
                    checked={formData.selectedFranchiseeIds.includes(fran.id)}
                    onCheckedChange={() => handleFranchiseeSelectionChange(fran.id)}
                  />
                  <Label htmlFor={`fran-${fran.id}`} className="font-normal">{fran.name} ({fran.id})</Label>
                </div>
              )) : <p className="text-xs text-gray-500">没有可供选择的加盟商。</p>}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            取消
          </Button>
          <Button type="submit" disabled={isLoading || (formData.targetAudienceType === 'specific' && formData.selectedFranchiseeIds.length === 0)}>
            {isLoading ? '提交中...' : (initialData ? '更新公告' : '发布公告')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default AnnouncementForm;