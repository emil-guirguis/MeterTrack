import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BaseList } from '@framework/components/list/BaseList';
import { useTemplatesEnhanced } from '../../store/entities/templatesStore';
import { useAuth } from '../../hooks/useAuth';
import type { EmailTemplate } from '../../types/entities';
import { Permission } from '../../types/auth';
import type { ColumnDefinition, BulkAction } from '../../types/ui';
import '@framework/components/common/TableCellStyles.css';
import './TemplateList.css';

interface TemplateListProps {
    onTemplateEdit?: (template: EmailTemplate) => void;
    onTemplateCreate?: () => void;
}

export const TemplateListSimple: React.FC<TemplateListProps> = ({
    onTemplateEdit,
    onTemplateCreate,
}) => {
    const { checkPermission } = useAuth();
    const templates = useTemplatesEnhanced();

    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');

    // Check permissions
    const canCreate = checkPermission(Permission.TEMPLATE_CREATE);
    const canUpdate = checkPermission(Permission.TEMPLATE_UPDATE);
    const canDelete = checkPermission(Permission.TEMPLATE_DELETE);

    // Load templates on component mount
    useEffect(() => {
        templates.fetchItems();
    }, []);

    // Apply filters and search
    useEffect(() => {
        const filters: Record<string, any> = {};

        if (categoryFilter) filters.category = categoryFilter;
        if (statusFilter) filters.status = statusFilter;

        templates.setFilters(filters);
        templates.setSearch(searchQuery);
        templates.fetchItems();
    }, [searchQuery, categoryFilter, statusFilter]);

    // Define table columns
    const columns: ColumnDefinition<EmailTemplate>[] = useMemo(() => [
        {
            key: 'name',
            label: 'Name',
            sortable: true,
            render: (value, template) => (
                <div className="table-cell--two-line">
                    <div className="table-cell__primary">{value}</div>
                    <div className="table-cell__secondary">{template.category}</div>
                </div>
            ),
        },
        {
            key: 'subject',
            label: 'Subject',
            sortable: true,
            render: (value) => (
                <div className="table-cell--truncate table-cell--subject">
                    {value}
                </div>
            ),
            responsive: 'hide-mobile',
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (value) => {
                const getStatusVariant = (status: string) => {
                    switch (status) {
                        case 'active': return 'success';
                        case 'inactive': return 'neutral';
                        case 'draft': return 'warning';
                        default: return 'neutral';
                    }
                };
                return (
                    <span className={`badge badge--${getStatusVariant(value)} badge--uppercase`}>
                        {/* {value.charAt(0).toUpperCase() + value.slice(1)} */}
                    </span>
                );
            },
        },
        {
            key: 'usageCount',
            label: 'Usage',
            sortable: true,
            render: (value) => (
                <span className="table-cell--numeric">
                    {value || 0}
                </span>
            ),
            responsive: 'hide-mobile',
        },
        {
            key: 'lastUsed',
            label: 'Last Used',
            sortable: true,
            render: (value) => value ? new Date(value).toLocaleDateString() : 'Never',
            responsive: 'hide-tablet',
        },
        {
            key: 'updatedAt',
            label: 'Updated',
            sortable: true,
            render: (value) => new Date(value).toLocaleDateString(),
            responsive: 'hide-tablet',
        },
    ], []);

    // Define bulk actions
    const bulkActions: BulkAction<EmailTemplate>[] = useMemo(() => {
        const actions: BulkAction<EmailTemplate>[] = [];

        if (canUpdate) {
            actions.push(
                {
                    id: 'activate',
                    label: 'Activate',
                    icon: '✅',
                    color: 'success',
                    action: async (selectedTemplates) => {
                        const templateIds = selectedTemplates.map(t => t.id);
                        await templates.bulkUpdateStatus(templateIds, 'active');
                    },
                    confirm: true,
                    confirmMessage: 'Are you sure you want to activate the selected templates?',
                },
                {
                    id: 'deactivate',
                    label: 'Deactivate',
                    icon: '❌',
                    color: 'warning',
                    action: async (selectedTemplates) => {
                        const templateIds = selectedTemplates.map(t => t.id);
                        await templates.bulkUpdateStatus(templateIds, 'inactive');
                    },
                    confirm: true,
                    confirmMessage: 'Are you sure you want to deactivate the selected templates?',
                }
            );
        }

        actions.push({
            id: 'export',
            label: 'Export CSV',
            icon: '📄',
            color: 'primary',
            action: async (selectedTemplates) => {
                exportTemplatesToCSV(selectedTemplates);
            },
        });

        return actions;
    }, [canUpdate, templates]);

    // Handle template actions
    const handleTemplateEdit = useCallback((template: EmailTemplate) => {
        if (!canUpdate) return;
        onTemplateEdit?.(template);
    }, [canUpdate, onTemplateEdit]);

    const handleTemplateDelete = useCallback(async (template: EmailTemplate) => {
        if (!canDelete) return;
        
        const confirmed = window.confirm(
            `Are you sure you want to delete template "${template.name}"? This action cannot be undone.`
        );
        
        if (confirmed) {
            await templates.deleteItem(template.id);
        }
    }, [canDelete, templates]);

    // Export functionality
    const exportTemplatesToCSV = useCallback((templatesToExport: EmailTemplate[]) => {
        const headers = ['Name', 'Subject', 'Category', 'Status', 'Usage Count', 'Last Used', 'Created', 'Updated'];
        const csvContent = [
            headers.join(','),
            ...templatesToExport.map(template => [
                `"${template.name}"`,
                `"${template.subject}"`,
                template.category,
                template.status,
                template.usageCount || 0,
                template.lastUsed ? new Date(template.lastUsed).toISOString() : '',
                new Date(template.createdAt).toISOString(),
                new Date(template.updatedAt).toISOString(),
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `templates_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, []);

    const filters = (
        <>
            <div className="template-list__search">
                <input
                    type="text"
                    placeholder="Search templates by name or subject..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="template-list__search-input"
                />
            </div>

            <div className="template-list__filter-group">
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="template-list__filter-select"
                    aria-label="Filter by category"
                >
                    <option value="">All Categories</option>
                    <option value="meter_readings">Meter Readings</option>
                    <option value="meter_errors">Meter Errors</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="general">General</option>
                </select>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="template-list__filter-select"
                    aria-label="Filter by status"
                >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="draft">Draft</option>
                </select>

                {(categoryFilter || statusFilter || searchQuery) && (
                    <button
                        type="button"
                        className="template-list__clear-filters"
                        onClick={() => {
                            setCategoryFilter('');
                            setStatusFilter('');
                            setSearchQuery('');
                        }}
                    >
                        Clear Filters
                    </button>
                )}
            </div>
        </>
    );

    const headerActions = (
        <div className="data-table__header-actions-inline">
            {canCreate && (
                <button
                    type="button"
                    className="template-list__btn template-list__btn--primary"
                    onClick={onTemplateCreate}
                    aria-label="Create a new template"
                >
                    ➕ Create Template
                </button>
            )}
        </div>
    );

    const stats = (
        <div className="list__stats">
            <div className="list__stat">
                <span className="list__stat-value">{templates.activeTemplates.length}</span>
                <span className="list__stat-label">Active Templates</span>
            </div>
            <div className="list__stat">
                <span className="list__stat-value">{templates.inactiveTemplates.length}</span>
                <span className="list__stat-label">Inactive Templates</span>
            </div>
            <div className="list__stat">
                <span className="list__stat-value">{templates.draftTemplates.length}</span>
                <span className="list__stat-label">Draft Templates</span>
            </div>
            <div className="list__stat">
                <span className="list__stat-value">{templates.items.length}</span>
                <span className="list__stat-label">Total Templates</span>
            </div>
        </div>
    );

    return (
        <div className="template-list">
            <BaseList
                title="Templates"
                filters={filters}
                headerActions={headerActions}
                stats={stats}
                data={templates.items}
                columns={columns}
                loading={templates.list.loading}
                error={templates.list.error || undefined}
                emptyMessage="No templates found. Create your first template to get started."
                onEdit={canUpdate ? handleTemplateEdit : undefined}
                onDelete={canDelete ? handleTemplateDelete : undefined}
                onSelect={bulkActions.length > 0 ? () => {} : undefined}
                bulkActions={bulkActions}
                pagination={{
                    currentPage: templates.list.page,
                    pageSize: templates.list.pageSize,
                    total: templates.list.total,
                    onPageChange: (page) => {
                        templates.setPage(page);
                        templates.fetchItems();
                    },
                    onPageSizeChange: (size) => {
                        templates.setPageSize(size);
                        templates.fetchItems();
                    },
                    showSizeChanger: true,
                    pageSizeOptions: [10, 25, 50, 100],
                }}
            />

            {/* Export Modal
            <BaseForm
                isOpen={showExportModal}
                title="Export Templates"
                onClose={() => setShowExportModal(false)}
                onSubmit={exportAllTemplates}
            >
                <div className="template-list__export-content">
                    <p>Export all templates to CSV format?</p>
                    <p className="template-list__export-info">
                        This will include: Name, Subject, Category, Status, Usage Count, Last Used, Created, and Updated dates
                    </p>
                    <p className="template-list__export-count">
                        <strong>{templates.items.length} templates</strong> will be exported.
                    </p>
                </div>
            </BaseForm> */}
        </div>
    );
};