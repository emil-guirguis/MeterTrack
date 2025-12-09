import React from 'react';
import { DataList } from '@framework/components/list/DataList';
import { useBaseList } from '../../../../../framework/frontend/components/list/hooks/useBaseList';
import { useTemplatesEnhanced } from '../../store/entities/templatesStore';
import type { EmailTemplate } from '../../types/entities';
import { Permission } from '../../types/auth';
import {
  emailTemplateColumns,
  emailTemplateFilters,
  emailTemplateStats,
  emailTemplateBulkActions,
  emailTemplateExportConfig,
} from '../../config/emailTemplateConfig';
import '@framework/components/common/TableCellStyles.css';
import './TemplateList.css';

interface EmailTemplateListSimpleProps {
    onTemplateSelect?: (template: EmailTemplate) => void;
    onTemplateEdit?: (template: EmailTemplate) => void;
    onTemplateCreate?: () => void;
}

export const EmailTemplateListSimple: React.FC<EmailTemplateListSimpleProps> = ({
    onTemplateSelect,
    onTemplateEdit,
    onTemplateCreate,
}) => {
    const baseList = useBaseList<EmailTemplate, ReturnType<typeof useTemplatesEnhanced> & { bulkUpdateStatus: (ids: string[], status: string) => Promise<void> }>({
        entityName: 'template',
        entityNamePlural: 'templates',
        useStore: useTemplatesEnhanced as any,
        features: {
            allowCreate: true,
            allowEdit: true,
            allowDelete: true,
            allowBulkActions: true,
            allowExport: true,
            allowImport: false,
            allowSearch: true,
            allowFilters: true,
            allowStats: true,
        },
        permissions: {
            create: Permission.TEMPLATE_CREATE,
            update: Permission.TEMPLATE_UPDATE,
            delete: Permission.TEMPLATE_DELETE,
        },
        columns: emailTemplateColumns,
        filters: emailTemplateFilters,
        stats: emailTemplateStats,
        bulkActions: emailTemplateBulkActions,
        export: emailTemplateExportConfig,
        onEdit: onTemplateEdit,
        onCreate: onTemplateCreate,
        onSelect: onTemplateSelect,
    });

    return (
        <div className="template-list">
            <DataList
                title="Templates"
                filters={baseList.renderFilters()}
                headerActions={baseList.renderHeaderActions()}
                stats={baseList.renderStats()}
                data={baseList.data}
                columns={baseList.columns}
                loading={baseList.loading}
                error={baseList.error}
                emptyMessage="No templates found. Create your first template to get started."
                onEdit={baseList.handleEdit}
                onDelete={baseList.handleDelete}
                onSelect={baseList.bulkActions.length > 0 ? () => {} : undefined}
                bulkActions={baseList.bulkActions}
                pagination={baseList.pagination}
            />
            {baseList.renderExportModal()}
            {baseList.renderImportModal()}
        </div>
    );
};
