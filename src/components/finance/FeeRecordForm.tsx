// src/components/finance/FeeRecordForm.tsx
import React, { useState, useEffect } from 'react';
import { FeeRecord, FeeStatus, FeeRecordFormData } from './types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

interface FeeRecordFormProps {
  initialData?: FeeRecord | null;
  onSubmit: (data: FeeRecordFormData) => void;
  onCancel: () => void;
  franchiseeId: string; // Assuming franchiseeId is passed for new records
  orderId: string; // Assuming orderId is passed for new records
  isLoading?: boolean;
}

const FeeRecordForm: React.FC<FeeRecordFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  franchiseeId,
  orderId,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<FeeRecordFormData>({
    orderId: initialData?.orderId || orderId || '',
    franchiseeId: initialData?.franchiseeId || franchiseeId || '',
    amount: initialData?.amount || 0,
    status: initialData?.status || FeeStatus.Pending,
    paymentDate: initialData?.paymentDate || '',
    remarks: initialData?.remarks || '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        orderId: initialData.orderId,
        franchiseeId: initialData.franchiseeId,
        amount: initialData.amount,
        status: initialData.status,
        paymentDate: initialData.paymentDate || '',
        remarks: initialData.remarks || '',
      });
    } else {
      // For new records, ensure orderId and franchiseeId are pre-filled if provided
      setFormData(prev => ({
        ...prev,
        orderId: orderId || '',
        franchiseeId: franchiseeId || '',
        amount: 0,
        status: FeeStatus.Pending,
        paymentDate: '',
        remarks: '',
      }));
    }
  }, [initialData, orderId, franchiseeId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) || 0 : value }));
  };

  const handleStatusChange = (value: FeeStatus) => {
    setFormData(prev => ({ ...prev, status: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>{initialData ? '编辑货款记录' : '新建货款记录'}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="orderId">订单ID</Label>
            <Input id="orderId" name="orderId" value={formData.orderId} onChange={handleChange} required disabled />
          </div>
          <div>
            <Label htmlFor="franchiseeId">加盟商ID</Label>
            <Input id="franchiseeId" name="franchiseeId" value={formData.franchiseeId} onChange={handleChange} required disabled />
          </div>
          <div>
            <Label htmlFor="amount">应付金额</Label>
            <Input id="amount" name="amount" type="number" value={formData.amount} onChange={handleChange} required min={0} step="0.01" />
          </div>
          <div>
            <Label htmlFor="status">支付状态</Label>
            <Select onValueChange={handleStatusChange} defaultValue={formData.status}>
              <SelectTrigger id="status">
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(FeeStatus).map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {formData.status === FeeStatus.Paid && (
            <div>
              <Label htmlFor="paymentDate">支付日期</Label>
              <Input id="paymentDate" name="paymentDate" type="date" value={formData.paymentDate} onChange={handleChange} />
            </div>
          )}
          <div>
            <Label htmlFor="remarks">备注</Label>
            <Textarea id="remarks" name="remarks" value={formData.remarks} onChange={handleChange} />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            取消
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? '提交中...' : (initialData ? '更新记录' : '创建记录')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default FeeRecordForm;