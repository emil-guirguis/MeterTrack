import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

/**
 * Hook that provides validation data for form fields
 * Handles fetching and formatting data for validation dropdowns
 */
export const useValidationDataProvider = () => {
  const auth = useAuth();

  return async (entityName: string, fieldDef: any): Promise<Array<{ id: any; label: string }>> => {
    console.log(`[ValidationDataProvider] Fetching data for entity: ${entityName}`);
    console.log(`[ValidationDataProvider] Auth state:`, {
      isAuthenticated: auth.isAuthenticated,
      userTenant: auth.user?.client,
      locationsCount: auth.locations?.length || 0,
    });

    // Handle location entity
    if (entityName === 'location') {
      console.log(`[ValidationDataProvider] Getting locations from auth context`);

      // Get locations directly from auth context (backend already filters by tenant)
      const locations = auth.locations || [];

      if (!locations || locations.length === 0) {
        console.warn(`[ValidationDataProvider] No locations found in auth context`);
        return [];
      }

      console.log(`[ValidationDataProvider] Found ${locations.length} locations in auth context`);

      // Map locations to options using labelField from fieldDef
      const labelField = fieldDef.validationFields?.[0] || 'name';
      const options = locations.map((location: any) => ({
        id: location.location_id,
        label: location[labelField] || `${entityName} ${location.location_id}`,
      }));

      console.log(`[ValidationDataProvider] Mapped ${options.length} location options`);
      options.forEach((opt: any, idx: number) => {
        console.log(`  [${idx}] ID: ${opt.id}, Label: ${opt.label}`);
      });
      return options;
    }

    // Handle device entity
    if (entityName === 'device') {
      console.log(`[ValidationDataProvider] Fetching devices from API`);

      try {
        // Use authService's axios client which has proper interceptors and token handling
        const response = await (authService as any).apiClient.get('/device');

        console.log(`[ValidationDataProvider] Device response:`, response.data);

        // Handle both response formats: { success, data: { items } } and direct array
        let devices = [];
        if (response.data.success && response.data.data?.items) {
          devices = response.data.data.items;
        } else if (Array.isArray(response.data)) {
          devices = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          devices = response.data.data;
        }

        // Filter to only active devices
        devices = devices.filter((device: any) => device.active === true);

        if (devices.length === 0) {
          console.warn(`[ValidationDataProvider] No active devices found in response`);
          return [];
        }

        console.log(`[ValidationDataProvider] Fetched ${devices.length} active devices`);

        // Map devices to options using multiple validation fields
        const validationFields = fieldDef.validationFields || ['manufacturer', 'model_number'];
        const options = devices.map((device: any) => {
          // Combine multiple fields for the label
          // Handle both camelCase and snake_case field names
          const labelParts = validationFields
            .map((field: string) => {
              // Try camelCase first, then snake_case
              const camelCaseField = field.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
              return device[field] || device[camelCaseField];
            })
            .filter((val: any) => val);
          const label = labelParts.length > 0 ? labelParts.join(' - ') : `Device ${device.device_id}`;

          console.log(`[ValidationDataProvider] Device ${device.device_id}:`, {
            validationFields,
            labelParts,
            label,
            deviceKeys: Object.keys(device),
          });

          return {
            id: device.device_id,
            label,
          };
        });

        console.log(`[ValidationDataProvider] Mapped ${options.length} device options`);
        return options;
      } catch (error) {
        console.error(`[ValidationDataProvider] Error fetching devices:`, error);
        return [];
      }
    }

    // Add more entity types here as needed
    console.warn(`[ValidationDataProvider] Entity type '${entityName}' not yet supported`);
    return [];
  };
};
