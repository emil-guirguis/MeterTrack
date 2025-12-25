import { renderHook } from '@testing-library/react';
import { useFormTabs } from './useFormTabs';

describe('useFormTabs', () => {
  describe('basic functionality', () => {
    it('should return empty tabs when formFields is undefined', () => {
      const { result } = renderHook(() => useFormTabs(undefined, 'Basic'));

      expect(result.current.tabs).toEqual({});
      expect(result.current.tabList).toEqual([]);
      expect(result.current.fieldSections).toEqual({});
    });

    it('should return empty tabs when formFields is null', () => {
      const { result } = renderHook(() => useFormTabs(null as any, 'Basic'));

      expect(result.current.tabs).toEqual({});
      expect(result.current.tabList).toEqual([]);
      expect(result.current.fieldSections).toEqual({});
    });

    it('should organize fields into tabs and sections', () => {
      const formFields = {
        name: {
          label: 'Name',
          showOn: ['form'],
          formGrouping: {
            tabName: 'Basic',
            sectionName: 'General',
            tabOrder: 1,
            sectionOrder: 1,
            fieldOrder: 1,
          },
        },
        email: {
          label: 'Email',
          showOn: ['form'],
          formGrouping: {
            tabName: 'Basic',
            sectionName: 'General',
            tabOrder: 1,
            sectionOrder: 1,
            fieldOrder: 2,
          },
        },
      };

      const { result } = renderHook(() => useFormTabs(formFields, 'Basic'));

      expect(result.current.tabs.Basic).toBeDefined();
      expect(result.current.tabs.Basic.sections.General).toEqual(['name', 'email']);
      expect(result.current.tabList).toEqual(['Basic']);
    });
  });

  describe('field filtering', () => {
    it('should exclude fields without showOn form', () => {
      const formFields = {
        name: {
          label: 'Name',
          showOn: ['form'],
          formGrouping: { tabName: 'Basic', sectionName: 'General' },
        },
        internalId: {
          label: 'Internal ID',
          showOn: ['list'],
          formGrouping: { tabName: 'Basic', sectionName: 'General' },
        },
      };

      const { result } = renderHook(() => useFormTabs(formFields, 'Basic'));

      expect(result.current.tabs.Basic.sections.General).toEqual(['name']);
    });

    it('should include fields with empty showOn array', () => {
      const formFields = {
        name: {
          label: 'Name',
          showOn: [],
          formGrouping: { tabName: 'Basic', sectionName: 'General' },
        },
      };

      const { result } = renderHook(() => useFormTabs(formFields, 'Basic'));

      expect(result.current.tabs.Basic.sections.General).toEqual([]);
    });

    it('should include fields without showOn property', () => {
      const formFields = {
        name: {
          label: 'Name',
          formGrouping: { tabName: 'Basic', sectionName: 'General' },
        },
      };

      const { result } = renderHook(() => useFormTabs(formFields, 'Basic'));

      expect(result.current.tabs.Basic.sections.General).toEqual(['name']);
    });
  });

  describe('default values', () => {
    it('should use default tab name when not specified', () => {
      const formFields = {
        name: {
          label: 'Name',
          showOn: ['form'],
          formGrouping: { sectionName: 'General' },
        },
      };

      const { result } = renderHook(() => useFormTabs(formFields, 'Basic'));

      expect(result.current.tabs.Basic).toBeDefined();
      expect(result.current.tabs.Basic.sections.General).toEqual(['name']);
    });

    it('should use default section name when not specified', () => {
      const formFields = {
        name: {
          label: 'Name',
          showOn: ['form'],
          formGrouping: { tabName: 'Basic' },
        },
      };

      const { result } = renderHook(() => useFormTabs(formFields, 'Basic'));

      expect(result.current.tabs.Basic.sections.General).toEqual(['name']);
    });

    it('should use default orders when not specified', () => {
      const formFields = {
        name: {
          label: 'Name',
          showOn: ['form'],
          formGrouping: { tabName: 'Basic', sectionName: 'General' },
        },
      };

      const { result } = renderHook(() => useFormTabs(formFields, 'Basic'));

      expect(result.current.tabs.Basic.order).toBe(1);
      expect(result.current.tabs.Basic.sections.General).toBeDefined();
    });

    it('should use default field order of 999 when not specified', () => {
      const formFields = {
        name: {
          label: 'Name',
          showOn: ['form'],
          formGrouping: { tabName: 'Basic', sectionName: 'General', fieldOrder: 1 },
        },
        email: {
          label: 'Email',
          showOn: ['form'],
          formGrouping: { tabName: 'Basic', sectionName: 'General' },
        },
      };

      const { result } = renderHook(() => useFormTabs(formFields, 'Basic'));

      // name has fieldOrder 1, email has default 999, so name should come first
      expect(result.current.tabs.Basic.sections.General).toEqual(['name', 'email']);
    });

    it('should use default grouping when formGrouping is not specified', () => {
      const formFields = {
        name: {
          label: 'Name',
          showOn: ['form'],
        },
      };

      const { result } = renderHook(() => useFormTabs(formFields, 'Basic'));

      expect(result.current.tabs.Basic).toBeDefined();
      expect(result.current.tabs.Basic.sections.General).toEqual(['name']);
    });
  });

  describe('sorting', () => {
    it('should sort tabs by tabOrder', () => {
      const formFields = {
        network: {
          label: 'Network',
          showOn: ['form'],
          formGrouping: { tabName: 'Network', tabOrder: 2 },
        },
        basic: {
          label: 'Basic',
          showOn: ['form'],
          formGrouping: { tabName: 'Basic', tabOrder: 1 },
        },
        advanced: {
          label: 'Advanced',
          showOn: ['form'],
          formGrouping: { tabName: 'Advanced', tabOrder: 3 },
        },
      };

      const { result } = renderHook(() => useFormTabs(formFields, 'Basic'));

      expect(result.current.tabList).toEqual(['Basic', 'Network', 'Advanced']);
    });

    it('should sort sections by sectionOrder within a tab', () => {
      const formFields = {
        location: {
          label: 'Location',
          showOn: ['form'],
          formGrouping: {
            tabName: 'Basic',
            sectionName: 'Location',
            sectionOrder: 2,
          },
        },
        name: {
          label: 'Name',
          showOn: ['form'],
          formGrouping: {
            tabName: 'Basic',
            sectionName: 'General',
            sectionOrder: 1,
          },
        },
      };

      const { result } = renderHook(() => useFormTabs(formFields, 'Basic'));

      const sectionNames = Object.keys(result.current.tabs.Basic.sections);
      expect(sectionNames).toEqual(['General', 'Location']);
    });

    it('should sort fields by fieldOrder within a section', () => {
      const formFields = {
        email: {
          label: 'Email',
          showOn: ['form'],
          formGrouping: {
            tabName: 'Basic',
            sectionName: 'General',
            fieldOrder: 2,
          },
        },
        name: {
          label: 'Name',
          showOn: ['form'],
          formGrouping: {
            tabName: 'Basic',
            sectionName: 'General',
            fieldOrder: 1,
          },
        },
        phone: {
          label: 'Phone',
          showOn: ['form'],
          formGrouping: {
            tabName: 'Basic',
            sectionName: 'General',
            fieldOrder: 3,
          },
        },
      };

      const { result } = renderHook(() => useFormTabs(formFields, 'Basic'));

      expect(result.current.tabs.Basic.sections.General).toEqual([
        'name',
        'email',
        'phone',
      ]);
    });
  });

  describe('active tab', () => {
    it('should return field sections for the active tab', () => {
      const formFields = {
        name: {
          label: 'Name',
          showOn: ['form'],
          formGrouping: { tabName: 'Basic', sectionName: 'General' },
        },
        ipAddress: {
          label: 'IP Address',
          showOn: ['form'],
          formGrouping: { tabName: 'Network', sectionName: 'Connection' },
        },
      };

      const { result: basicResult } = renderHook(() =>
        useFormTabs(formFields, 'Basic')
      );
      expect(basicResult.current.fieldSections).toEqual({
        General: ['name'],
      });

      const { result: networkResult } = renderHook(() =>
        useFormTabs(formFields, 'Network')
      );
      expect(networkResult.current.fieldSections).toEqual({
        Connection: ['ipAddress'],
      });
    });

    it('should return empty field sections for non-existent active tab', () => {
      const formFields = {
        name: {
          label: 'Name',
          showOn: ['form'],
          formGrouping: { tabName: 'Basic', sectionName: 'General' },
        },
      };

      const { result } = renderHook(() => useFormTabs(formFields, 'NonExistent'));

      expect(result.current.fieldSections).toEqual({});
    });
  });

  describe('complex scenarios', () => {
    it('should handle multiple tabs with multiple sections and fields', () => {
      const formFields = {
        name: {
          label: 'Name',
          showOn: ['form'],
          formGrouping: {
            tabName: 'Basic',
            sectionName: 'General',
            tabOrder: 1,
            sectionOrder: 1,
            fieldOrder: 1,
          },
        },
        description: {
          label: 'Description',
          showOn: ['form'],
          formGrouping: {
            tabName: 'Basic',
            sectionName: 'General',
            tabOrder: 1,
            sectionOrder: 1,
            fieldOrder: 2,
          },
        },
        location: {
          label: 'Location',
          showOn: ['form'],
          formGrouping: {
            tabName: 'Basic',
            sectionName: 'Location',
            tabOrder: 1,
            sectionOrder: 2,
            fieldOrder: 1,
          },
        },
        ipAddress: {
          label: 'IP Address',
          showOn: ['form'],
          formGrouping: {
            tabName: 'Network',
            sectionName: 'Connection',
            tabOrder: 2,
            sectionOrder: 1,
            fieldOrder: 1,
          },
        },
        port: {
          label: 'Port',
          showOn: ['form'],
          formGrouping: {
            tabName: 'Network',
            sectionName: 'Connection',
            tabOrder: 2,
            sectionOrder: 1,
            fieldOrder: 2,
          },
        },
        protocol: {
          label: 'Protocol',
          showOn: ['form'],
          formGrouping: {
            tabName: 'Network',
            sectionName: 'Settings',
            tabOrder: 2,
            sectionOrder: 2,
            fieldOrder: 1,
          },
        },
      };

      const { result } = renderHook(() => useFormTabs(formFields, 'Basic'));

      expect(result.current.tabList).toEqual(['Basic', 'Network']);
      expect(Object.keys(result.current.tabs.Basic.sections)).toEqual([
        'General',
        'Location',
      ]);
      expect(Object.keys(result.current.tabs.Network.sections)).toEqual([
        'Connection',
        'Settings',
      ]);
      expect(result.current.tabs.Basic.sections.General).toEqual([
        'name',
        'description',
      ]);
      expect(result.current.tabs.Network.sections.Connection).toEqual([
        'ipAddress',
        'port',
      ]);
    });

    it('should handle mixed fields with and without formGrouping', () => {
      const formFields = {
        name: {
          label: 'Name',
          showOn: ['form'],
          formGrouping: {
            tabName: 'Custom',
            sectionName: 'Custom Section',
            tabOrder: 2,
          },
        },
        email: {
          label: 'Email',
          showOn: ['form'],
          // No formGrouping - should use defaults
        },
        phone: {
          label: 'Phone',
          showOn: ['form'],
          formGrouping: {
            tabName: 'Custom',
            sectionName: 'Custom Section',
          },
        },
      };

      const { result } = renderHook(() => useFormTabs(formFields, 'Basic'));

      // email should go to Basic/General (defaults)
      // name and phone should go to Custom/Custom Section
      expect(result.current.tabList).toEqual(['Basic', 'Custom']);
      expect(result.current.tabs.Basic.sections.General).toContain('email');
      expect(result.current.tabs.Custom.sections['Custom Section']).toContain(
        'name'
      );
      expect(result.current.tabs.Custom.sections['Custom Section']).toContain(
        'phone'
      );
    });
  });

  describe('memoization', () => {
    it('should not recalculate when formFields and activeTab are the same', () => {
      const formFields = {
        name: {
          label: 'Name',
          showOn: ['form'],
          formGrouping: { tabName: 'Basic', sectionName: 'General' },
        },
      };

      const { result: result1 } = renderHook(() =>
        useFormTabs(formFields, 'Basic')
      );
      const { result: result2 } = renderHook(() =>
        useFormTabs(formFields, 'Basic')
      );

      // Results should be the same object reference (memoized)
      expect(result1.current.tabs).toBe(result1.current.tabs);
    });

    it('should recalculate when activeTab changes', () => {
      const formFields = {
        name: {
          label: 'Name',
          showOn: ['form'],
          formGrouping: { tabName: 'Basic', sectionName: 'General' },
        },
        ipAddress: {
          label: 'IP Address',
          showOn: ['form'],
          formGrouping: { tabName: 'Network', sectionName: 'Connection' },
        },
      };

      const { result: result1 } = renderHook(() =>
        useFormTabs(formFields, 'Basic')
      );
      const { result: result2 } = renderHook(() =>
        useFormTabs(formFields, 'Network')
      );

      expect(result1.current.fieldSections).not.toEqual(
        result2.current.fieldSections
      );
    });
  });
});
