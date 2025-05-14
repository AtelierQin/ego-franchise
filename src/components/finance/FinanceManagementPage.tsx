// src/components/finance/FinanceManagementPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { FeeRecord, FeeStatus, FeeRecordFormData, MonthlyStatement } from './types';
import FeeRecordList from './FeeRecordList';
import FeeRecordForm from './FeeRecordForm';
import MonthlyStatementDisplay from './MonthlyStatementDisplay';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase'; // Assuming supabase client is configured
import { toast } from 'sonner'; // Or your preferred toast library

// Mock user roles for demonstration
type UserRole = 'franchisee' | 'hq_finance';

interface FinanceManagementPageProps {
  currentUserRole: UserRole;
  currentUserId: string; // For franchisee to see their own records, or HQ to operate
}

const FinanceManagementPage: React.FC<FinanceManagementPageProps> = ({ currentUserRole, currentUserId }) => {
  const [records, setRecords] = useState<FeeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FeeRecord | null>(null);
  const [monthlyStatement, setMonthlyStatement] = useState<MonthlyStatement | null>(null);
  const [isStatementLoading, setIsStatementLoading] = useState(false);

  // These would be dynamic in a real app, e.g., from a selected order
  const [currentFranchiseeIdForNewRecord, setCurrentFranchiseeIdForNewRecord] = useState('');
  const [currentOrderIdForNewRecord, setCurrentOrderIdForNewRecord] = useState('');

  const fetchFeeRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase.from('fee_records').select('*');
      if (currentUserRole === 'franchisee') {
        query = query.eq('franchiseeId', currentUserId);
      }
      query = query.order('generatedDate', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      setRecords(data as FeeRecord[]); // Add type assertion
    } catch (error: any) {
      console.error('Error fetching fee records:', error);
      toast.error('获取货款记录失败: ' + error.message);
    }
    setIsLoading(false);
  }, [currentUserRole, currentUserId]);

  const fetchMonthlyStatement = useCallback(async () => {
    if (currentUserRole !== 'hq_finance' && currentUserRole !== 'franchisee') return;
    // For franchisee, they would fetch their own statement
    // For hq_finance, they might fetch for a selected franchisee or a general view
    setIsStatementLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // In a real app, this would fetch data from Supabase based on currentUserId (if franchisee)
      // or a selected franchiseeId (if hq_finance)
      const mockMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      const mockStatement: MonthlyStatement = {
        franchiseeId: currentUserRole === 'franchisee' ? currentUserId : (currentFranchiseeIdForNewRecord || 'FRAN-DEMO'),
        month: mockMonth,
        totalDueAmount: Math.random() * 50000 + 10000,
        outstandingBalance: Math.random() * 20000,
        statementDate: new Date().toISOString(),
      };
      setMonthlyStatement(mockStatement);
      toast.success(`获取 ${mockMonth} 对账信息成功`);
    } catch (error: any) {
      console.error('Error fetching monthly statement:', error);
      toast.error('获取月度对账信息失败: ' + error.message);
      setMonthlyStatement(null); // Clear statement on error
    }
    setIsStatementLoading(false);
  }, [currentUserRole, currentUserId, currentFranchiseeIdForNewRecord]);

  useEffect(() => {
    if (currentUserRole === 'franchisee') {
      fetchMonthlyStatement(); // Franchisees see their statement by default
    }
    // HQ Finance might trigger this manually or upon selecting a franchisee
  }, [fetchMonthlyStatement, currentUserRole]);

  useEffect(() => {
    fetchFeeRecords();
  }, [fetchFeeRecords]);

  const handleCreateNew = () => {
    if (currentUserRole === 'hq_finance') {
      // In a real app, you'd likely select an order/franchisee first
      // For now, let's assume these are set or prompted for
      if (!currentOrderIdForNewRecord || !currentFranchiseeIdForNewRecord) {
        toast.info('请先指定订单ID和加盟商ID以创建新货款记录。');
        // Mock setting them for demo purposes if not set
        setCurrentOrderIdForNewRecord(`ORD-${Date.now().toString().slice(-5)}`);
        setCurrentFranchiseeIdForNewRecord(`FRAN-${Date.now().toString().slice(-4)}`);
        // return;
      }
      setEditingRecord(null);
      setShowForm(true);
    } else {
      toast.error('您没有权限创建货款记录。');
    }
  };

  const handleEdit = (record: FeeRecord) => {
    if (currentUserRole === 'hq_finance') {
      setEditingRecord(record);
      setCurrentOrderIdForNewRecord(record.orderId);
      setCurrentFranchiseeIdForNewRecord(record.franchiseeId);
      setShowForm(true);
    } else {
      toast.error('您没有权限编辑货款记录。');
    }
  };

  const handleSubmitForm = async (formData: FeeRecordFormData) => {
    setIsLoading(true);
    try {
      const recordToSave = {
        ...formData,
        currency: 'CNY', // Default currency
        operatorId: currentUserRole === 'hq_finance' ? currentUserId : undefined,
        generatedDate: editingRecord ? editingRecord.generatedDate : new Date().toISOString(),
        // Ensure paymentDate is null if not provided or status is not Paid
        paymentDate: formData.status === FeeStatus.Paid && formData.paymentDate ? formData.paymentDate : null,
      };

      if (editingRecord && editingRecord.id) {
        const { error } = await supabase
          .from('fee_records')
          .update(recordToSave)
          .eq('id', editingRecord.id);
        if (error) throw error;
        toast.success('货款记录更新成功！');
      } else {
        // Create new record
        const { error } = await supabase.from('fee_records').insert(recordToSave);
        if (error) throw error;
        toast.success('货款记录创建成功！');
      }
      setShowForm(false);
      setEditingRecord(null);
      fetchFeeRecords(); // Refresh list
    } catch (error: any) {
      console.error('Error saving fee record:', error);
      toast.error('保存货款记录失败: ' + error.message);
    }
    setIsLoading(false);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingRecord(null);
  };

  // Placeholder for onViewDetails if needed
  const handleViewDetails = (record: FeeRecord) => {
    // Could navigate to a detailed view or show a modal
    toast.info(`查看详情: 订单 ${record.orderNumber || record.orderId}`);
  };

  const handleGenerateStatement = async () => {
    // This would typically be an action for HQ Finance
    if (currentUserRole === 'hq_finance') {
      if (!currentFranchiseeIdForNewRecord) {
        toast.info('请先指定一个加盟商ID以生成对账单。');
        return;
      }
      await fetchMonthlyStatement(); // Re-use fetch logic, which now uses currentFranchiseeIdForNewRecord for HQ
    } else {
      toast.error('您没有权限生成对账单。');
    }
  };

  const handleSendStatementReminder = (statement: MonthlyStatement) => {
    // Simulate sending a reminder
    toast.success(`已向加盟商 ${statement.franchiseeId} 发送 ${statement.month} 的对账提醒 (模拟)。`);
    console.log('Sending reminder for statement:', statement);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-primary">财务管理 - 货款记录</h1>

      {currentUserRole === 'hq_finance' && !showForm && (
        <div className="mb-4 flex justify-end">
          <Button onClick={handleCreateNew} disabled={isLoading}>
            新建货款记录
          </Button>
        </div>
      )}

      {showForm && currentUserRole === 'hq_finance' ? (
        <FeeRecordForm
          initialData={editingRecord}
          onSubmit={handleSubmitForm}
          onCancel={handleCancelForm}
          franchiseeId={currentFranchiseeIdForNewRecord} // Pass current values
          orderId={currentOrderIdForNewRecord}         // Pass current values
          isLoading={isLoading}
        />
      ) : (
        <>
          {isLoading && <p>加载中...</p>}
          {!isLoading && records.length === 0 && <p className="text-center text-gray-500 py-8">当前没有货款记录。</p>}
          {!isLoading && records.length > 0 && (
            <FeeRecordList
              records={records}
              onEdit={currentUserRole === 'hq_finance' ? handleEdit : undefined}
              onViewDetails={handleViewDetails} // Allow all roles to view details
              userRole={currentUserRole}
            />
          )}
        </>
      )}
      {/* Example of how to simulate setting order/franchisee ID for new records (for demo) */}
      {currentUserRole === 'hq_finance' && !showForm && (
        <div className="mt-4 p-2 border rounded text-sm bg-slate-50">
          <p className="font-semibold">模拟创建新记录 (开发辅助):</p>
          <div className="flex gap-2 mt-1">
            <input 
              type="text" 
              placeholder="预设订单ID" 
              value={currentOrderIdForNewRecord}
              onChange={(e) => setCurrentOrderIdForNewRecord(e.target.value)}
              className="border p-1 rounded text-xs"
            />
            <input 
              type="text" 
              placeholder="预设加盟商ID" 
              value={currentFranchiseeIdForNewRecord}
              onChange={(e) => setCurrentFranchiseeIdForNewRecord(e.target.value)}
              className="border p-1 rounded text-xs"
            />
          </div>
           <p className="text-xs text-gray-400 mt-1">为模拟创建，请输入一个订单ID和加盟商ID。</p>
        </div>
      )}

      {/* Monthly Statement Section */}
      <div className="mt-8 pt-8 border-t">
        <h2 className="text-xl font-semibold mb-4 text-primary">月度对账提醒</h2>
        {(currentUserRole === 'franchisee' || (currentUserRole === 'hq_finance' && monthlyStatement)) && (
          <MonthlyStatementDisplay 
            statement={monthlyStatement}
            userRole={currentUserRole}
            isLoading={isStatementLoading}
            onGenerateStatement={currentUserRole === 'hq_finance' ? handleGenerateStatement : undefined}
            onSendReminder={currentUserRole === 'hq_finance' ? handleSendStatementReminder : undefined}
          />
        )}
        {currentUserRole === 'hq_finance' && !monthlyStatement && (
           <div className="text-center p-4 border rounded bg-slate-50">
            <p className="mb-2">为加盟商 <Input className="inline-block w-auto text-xs mx-1 h-7" type="text" placeholder="加盟商ID" value={currentFranchiseeIdForNewRecord} onChange={(e) => setCurrentFranchiseeIdForNewRecord(e.target.value)} /> 生成对账单:</p>
            <Button onClick={handleGenerateStatement} disabled={isStatementLoading || !currentFranchiseeIdForNewRecord }>
              {isStatementLoading ? '加载中...' : '获取/生成对账信息'}
            </Button>
          </div>
        )}
         {currentUserRole === 'franchisee' && !monthlyStatement && !isStatementLoading && (
          <p className="text-center text-gray-500 py-4">当前没有您的月度对账信息。</p>
        )}
        {isStatementLoading && <p className="text-center">正在加载对账信息...</p>}
      </div>
    </div>
  );
};

export default FinanceManagementPage;