// src/components/inspection/InspectionRecordList.tsx
import React from 'react';
import { InspectionRecord, InspectionCheckItemResult, DEFAULT_INSPECTION_CHECKLIST_TEMPLATE } from './types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface InspectionRecordListProps {
  records: InspectionRecord[];
  onEdit?: (record: InspectionRecord) => void; // For HQ Supervisor to edit
  onViewDetails?: (record: InspectionRecord) => void; // For detailed view
  userRole: 'franchisee' | 'hq_supervisor';
}

const getResultVariant = (result: InspectionCheckItemResult): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (result) {
    case InspectionCheckItemResult.Yes:
      return 'default'; // Greenish or success-like
    case InspectionCheckItemResult.No:
      return 'destructive'; // Reddish or error-like
    case InspectionCheckItemResult.NotApplicable:
      return 'secondary'; // Neutral or info-like
    default:
      return 'outline';
  }
};

const getCheckItemText = (checkItemId: string): string => {
  const item = DEFAULT_INSPECTION_CHECKLIST_TEMPLATE.find(i => i.id === checkItemId);
  return item ? item.text : '未知检查项';
};

const InspectionRecordList: React.FC<InspectionRecordListProps> = ({ records, onEdit, onViewDetails, userRole }) => {
  if (!records || records.length === 0) {
    return <p className="text-center text-gray-500 py-4">没有找到巡店记录。</p>;
  }

  return (
    <ScrollArea className="rounded-md border h-[calc(100vh-250px)]">
      <Table>
        <TableHeader>
          <TableRow>
            {userRole === 'hq_supervisor' && <TableHead>加盟商ID</TableHead>}
            <TableHead>巡店日期</TableHead>
            <TableHead>巡店员ID</TableHead>
            <TableHead>总结摘要</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map(record => (
            <React.Fragment key={record.id}>
              <TableRow>
                {userRole === 'hq_supervisor' && <TableCell>{record.franchiseeId}</TableCell>}
                <TableCell>{new Date(record.inspectionDate).toLocaleDateString()}</TableCell>
                <TableCell>{record.supervisorId}</TableCell>
                <TableCell className="max-w-sm truncate" title={record.summary}>{record.summary || '-'}</TableCell>
                <TableCell className="text-right">
                  {userRole === 'hq_supervisor' && onEdit && (
                    <Button variant="outline" size="sm" onClick={() => onEdit(record)} className="mr-2">
                      编辑
                    </Button>
                  )}
                  {onViewDetails && (
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value={`item-${record.id}`} className="border-none">
                        <AccordionTrigger asChild>
                           <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onViewDetails(record); }}>
                            详情
                          </Button>
                        </AccordionTrigger>
                      </AccordionItem>
                    </Accordion>
                  )}
                </TableCell>
              </TableRow>
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
};

// Separate component for detailed view, could be a modal or an expanded section
export const InspectionRecordDetails: React.FC<{ record: InspectionRecord }> = ({ record }) => {
  return (
    <div className="p-4 bg-slate-50 rounded-md mt-2 space-y-4">
      <h4 className="text-lg font-semibold">巡店详情 - {new Date(record.inspectionDate).toLocaleDateString()}</h4>
      <p><span className="font-medium">加盟商ID:</span> {record.franchiseeId}</p>
      <p><span className="font-medium">巡店员ID:</span> {record.supervisorId}</p>
      <div>
        <h5 className="font-medium mb-2">检查项结果:</h5>
        <ul className="list-disc pl-5 space-y-2">
          {record.checkItems.map((item, index) => (
            <li key={index}>
              <span className="font-semibold">{getCheckItemText(item.checkItemId)}: </span>
              <Badge variant={getResultVariant(item.result)}>{item.result}</Badge>
              {item.notes && <p className="text-sm text-gray-600 mt-1">备注: {item.notes}</p>}
              {item.photos && item.photos.length > 0 && (
                <div className="mt-1">
                  <p className="text-sm font-medium">照片:</p>
                  <div className="flex space-x-2 mt-1">
                    {item.photos.map((photoUrl, pIndex) => (
                      <a key={pIndex} href={photoUrl} target="_blank" rel="noopener noreferrer">
                        <img src={photoUrl} alt={`检查项 ${index+1} 照片 ${pIndex+1}`} className="h-16 w-16 object-cover rounded" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
      {record.summary && (
        <div>
          <h5 className="font-medium">总结:</h5>
          <p className="text-gray-700 whitespace-pre-wrap">{record.summary}</p>
        </div>
      )}
      <p className="text-xs text-gray-500">记录创建于: {new Date(record.createdAt).toLocaleString()}</p>
    </div>
  );
};

export default InspectionRecordList;