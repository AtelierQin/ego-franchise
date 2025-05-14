// src/components/finance/MonthlyStatementDisplay.tsx
import React from 'react';
import { MonthlyStatement } from './types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface MonthlyStatementDisplayProps {
  statement: MonthlyStatement | null;
  onGenerateStatement?: () => void; // For HQ Finance to trigger generation
  onSendReminder?: (statement: MonthlyStatement) => void; // For HQ Finance to (manually) send
  isLoading?: boolean;
  userRole: 'franchisee' | 'hq_finance';
}

const MonthlyStatementDisplay: React.FC<MonthlyStatementDisplayProps> = ({
  statement,
  onGenerateStatement,
  onSendReminder,
  isLoading = false,
  userRole,
}) => {
  if (userRole === 'hq_finance' && !statement && onGenerateStatement) {
    return (
      <Card className="w-full max-w-md mx-auto mt-6">
        <CardHeader>
          <CardTitle>月度对账提醒</CardTitle>
          <CardDescription>当前没有可显示的对账单信息。</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={onGenerateStatement} disabled={isLoading}>
            {isLoading ? '生成中...' : '生成上月对账单'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!statement) {
    return (
      <Card className="w-full max-w-md mx-auto mt-6">
        <CardHeader>
          <CardTitle>月度对账提醒</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 py-4">没有可显示的对账信息。</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-6">
      <CardHeader>
        <CardTitle>月度对账提醒 - {statement.month}</CardTitle>
        <CardDescription>
          加盟商ID: {statement.franchiseeId} | 对账单生成日期: {new Date(statement.statementDate).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm font-medium text-gray-600">本月应付货款总额:</p>
          <p className="text-lg font-semibold text-primary">¥{statement.totalDueAmount.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">当前未付货款总额:</p>
          <p className="text-lg font-semibold text-destructive">¥{statement.outstandingBalance.toFixed(2)}</p>
        </div>
        {userRole === 'hq_finance' && onSendReminder && (
          <div className="pt-4 text-right">
            <Button onClick={() => onSendReminder(statement)} variant="outline" disabled={isLoading}>
              {isLoading ? '处理中...' : '发送提醒 (模拟)'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MonthlyStatementDisplay;