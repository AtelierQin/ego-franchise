// src/components/inspection/InspectionRecordForm.tsx
import React, { useState, useEffect } from 'react';
import {
  InspectionRecordFormData,
  InspectionCheckItemResult,
  DEFAULT_INSPECTION_CHECKLIST_TEMPLATE,
  InspectionCheckItemRecord,
  InspectionCheckItemTemplate
} from './types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface InspectionRecordFormProps {
  initialData?: InspectionRecordFormData | null;
  onSubmit: (data: InspectionRecordFormData, files: Map<string, File[]>) => void;
  onCancel: () => void;
  franchiseeId?: string; // Pre-fill if creating for a specific franchisee
  isLoading?: boolean;
}

const InspectionRecordForm: React.FC<InspectionRecordFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  franchiseeId,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<InspectionRecordFormData>({
    franchiseeId: initialData?.franchiseeId || franchiseeId || '',
    inspectionDate: initialData?.inspectionDate || new Date().toISOString().split('T')[0],
    checkItems: initialData?.checkItems || DEFAULT_INSPECTION_CHECKLIST_TEMPLATE.map(item => ({
      checkItemId: item.id,
      result: InspectionCheckItemResult.NotApplicable,
      notes: '',
      photosToUpload: [],
    })),
    summary: initialData?.summary || '',
  });
  const [filesToUpload, setFilesToUpload] = useState<Map<string, File[]>>(new Map());

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      // Note: File rehydration from initialData is not handled here as it's complex.
      // This form assumes new file uploads for edits if photos need changing.
    } else {
      // Reset for new form, pre-fill franchiseeId if provided
      setFormData({
        franchiseeId: franchiseeId || '',
        inspectionDate: new Date().toISOString().split('T')[0],
        checkItems: DEFAULT_INSPECTION_CHECKLIST_TEMPLATE.map(item => ({
          checkItemId: item.id,
          result: InspectionCheckItemResult.NotApplicable,
          notes: '',
          photosToUpload: [],
        })),
        summary: '',
      });
    }
  }, [initialData, franchiseeId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckItemChange = (
    index: number,
    field: keyof InspectionCheckItemRecord | 'photosToUpload',
    value: string | InspectionCheckItemResult | File[]
  ) => {
    setFormData(prev => {
      const newCheckItems = [...prev.checkItems];
      if (field === 'photosToUpload') {
        newCheckItems[index] = { ...newCheckItems[index], photosToUpload: value as File[] };
        // Update filesToUpload map
        const currentFiles = filesToUpload.get(newCheckItems[index].checkItemId) || [];
        const updatedFiles = new Map(filesToUpload);
        updatedFiles.set(newCheckItems[index].checkItemId, value as File[]); 
        setFilesToUpload(updatedFiles);
      } else {
        (newCheckItems[index] as any)[field] = value;
      }
      return { ...prev, checkItems: newCheckItems };
    });
  };

  const handleFileChange = (checkItemId: string, index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      // Limit to 3 files per item as per PRD (FR-E.1.3)
      const limitedFiles = selectedFiles.slice(0, 3);
      handleCheckItemChange(index, 'photosToUpload', limitedFiles);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData, filesToUpload);
  };

  const getCheckItemText = (checkItemId: string): string => {
    const item = DEFAULT_INSPECTION_CHECKLIST_TEMPLATE.find(i => i.id === checkItemId);
    return item ? item.text : '未知检查项';
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{initialData ? '编辑巡店记录' : '新建巡店记录'}</CardTitle>
        <CardDescription>请填写巡店详细信息并记录检查结果。</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="franchiseeId">加盟商ID</Label>
            <Input id="franchiseeId" name="franchiseeId" value={formData.franchiseeId} onChange={handleChange} required placeholder="例如：FRAN-001" />
          </div>
          <div>
            <Label htmlFor="inspectionDate">巡店日期</Label>
            <Input id="inspectionDate" name="inspectionDate" type="date" value={formData.inspectionDate} onChange={handleChange} required />
          </div>

          <Separator />
          <h3 className="text-lg font-medium">检查项详情</h3>
          {formData.checkItems.map((item, index) => (
            <div key={item.checkItemId} className="p-4 border rounded-md space-y-3 bg-slate-50/50">
              <p className="font-semibold">{index + 1}. {getCheckItemText(item.checkItemId)}</p>
              <div>
                <Label htmlFor={`checkItem-result-${index}`}>检查结果</Label>
                <Select
                  value={item.result}
                  onValueChange={(value: InspectionCheckItemResult) => handleCheckItemChange(index, 'result', value)}
                >
                  <SelectTrigger id={`checkItem-result-${index}`}>
                    <SelectValue placeholder="选择结果" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(InspectionCheckItemResult).map(res => (
                      <SelectItem key={res} value={res}>{res}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {(item.result === InspectionCheckItemResult.No || item.notes) && (
                 <div>
                  <Label htmlFor={`checkItem-notes-${index}`}>问题描述/备注</Label>
                  <Textarea
                    id={`checkItem-notes-${index}`}
                    value={item.notes || ''}
                    onChange={(e) => handleCheckItemChange(index, 'notes', e.target.value)}
                    placeholder="详细描述问题或备注信息..."
                  />
                </div>
              )}
              <div>
                <Label htmlFor={`checkItem-photos-${index}`}>上传照片 (最多3张)</Label>
                <Input
                  id={`checkItem-photos-${index}`}
                  type="file"
                  multiple
                  accept="image/jpeg, image/png, image/gif"
                  onChange={(e) => handleFileChange(item.checkItemId, index, e)}
                  className="mt-1"
                />
                {item.photosToUpload && item.photosToUpload.length > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    已选择 {item.photosToUpload.length} 个文件: {item.photosToUpload.map(f => f.name).join(', ')}
                  </div>
                )}
              </div>
            </div>
          ))}

          <Separator />
          <div>
            <Label htmlFor="summary">整体巡店总结/建议</Label>
            <Textarea id="summary" name="summary" value={formData.summary} onChange={handleChange} rows={4} placeholder="输入整体总结或改进建议..." />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            取消
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? '提交中...' : (initialData ? '更新记录' : '提交记录')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default InspectionRecordForm;