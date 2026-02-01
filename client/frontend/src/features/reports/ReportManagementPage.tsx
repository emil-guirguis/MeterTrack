import React from 'react';
import { EntityManagementPage } from '@framework/components/modal';
import { useReportsEnhanced } from './reportsStore';
import type { Report } from '../../services/reportingService';

export const ReportManagementPage: React.FC<{ onReportSelect?: (reportId: string) => void }> = () => (
  <EntityManagementPage<Report, ReturnType<typeof useReportsEnhanced>>
    title="Report Management"
    entityName="report"
    ListComponent={ReportList}
    FormComponent={ReportForm}
    useStore={useReportsEnhanced}
    ModalComponent={FormModal}
  />
);
