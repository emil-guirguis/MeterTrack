import { BaseList } from './BaseList';
import type { BaseListProps } from './BaseList';
import './ListFilters.css';
import './DataList.css';

/**
 * DataList Component
 * 
 * Wrapper around BaseList for backward compatibility.
 * All new lists should use BaseList directly.
 */
export type DataListProps<T> = BaseListProps<T>;

export function DataList<T extends Record<string, any>>(props: DataListProps<T>) {
  return <BaseList {...props} />;
}

export default DataList;
