import React from 'react';
import { EntityManagementPage, FormModal } from '@framework/components/modal';
import { ReportList } from './ReportList';
import { ReportForm } from './ReportForm';
import { useReportsEnhanced } from './reportsStore';
import type { Report } from './types';

export const ReportManagementPage: React.FC<{ onReportSelect?: (reportId: string) => void }> = ({ onReportSelect }) => (
  <EntityManagementPage<Report, ReturnType<typeof useReportsEnhanced>>
    title="Report Management"
    entityName="report"
    ListComponent={ReportList}
    FormComponent={ReportForm}
    useStore={useReportsEnhanced}
    ModalComponent={FormModal}
    listProps={{ onReportSelect }}
  />
);
