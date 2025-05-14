// src/components/finance/FeeRecordList.tsx
import React from 'react';
import { FeeRecord, FeeStatus } from './types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FeeRecordListProps {
  records: FeeRecord[];
  onEdit?: (record: FeeRecord) => void; // For HQ Finance to edit
  onViewDetails?: (record: FeeRecord) => void; // For Franchisee to view, or HQ for more details
  userRole: 'franchisee' | 'hq_finance';
}

const getStatusVariant = (status: FeeStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case FeeStatus.Paid:
      return 'default'; // Greenish or success-like
    case FeeStatus.Pending:
      return 'secondary'; // Yellowish or warning-like
    case FeeStatus.Overdue:
      return 'destructive'; // Reddish or error-like
    default:
      return 'outline';
  }
};

const FeeRecordList: React.FC<FeeRecordListProps> = ({ records, onEdit, onViewDetails, userRole }) => {
  if (!records || records.length === 0) {
    return <p className="text-center text-gray-500 py-4">没有找到货款记录。</p>;
  }

  return (
    <ScrollArea className="rounded-md border h-[calc(100vh-220px)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>订单号</TableHead>
            {userRole === 'hq_finance' && <TableHead>加盟商ID</TableHead>}
            <TableHead className="text-right">金额</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>生成日期</TableHead>
            <TableHead>支付日期</TableHead>
            {userRole === 'hq_finance' && <TableHead>操作人</TableHead>}
            <TableHead>备注</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map(record => (
            <TableRow key={record.id}>
              <TableCell>{record.orderNumber || record.orderId}</TableCell>
              {userRole === 'hq_finance' && <TableCell>{record.franchiseeId}</TableCell>}
              <TableCell className="text-right">¥{record.amount.toFixed(2)}</TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(record.status)}>{record.status}</Badge>
              </TableCell>
              <TableCell>{new Date(record.generatedDate).toLocaleDateString()}</TableCell>
              <TableCell>{record.paymentDate ? new Date(record.paymentDate).toLocaleDateString() : '-'}</TableCell>
              {userRole === 'hq_finance' && <TableCell>{record.operatorId || '-'}</TableCell>}
              <TableCell className="max-w-xs truncate" title={record.remarks}>{record.remarks || '-'}</TableCell>
              <TableCell className="text-right">
                {userRole === 'hq_finance' && onEdit && (
                  <Button variant="outline" size="sm" onClick={() => onEdit(record)} className="mr-2">
                    编辑
                  </Button>
                )}
                {onViewDetails && (
                  <Button variant="ghost" size="sm" onClick={() => onViewDetails(record)}>
                    详情
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
};

export default FeeRecordList;