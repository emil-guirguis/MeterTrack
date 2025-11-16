// Auth types - to be provided by implementing project
// This is a placeholder that should be replaced with actual auth types

export type Permission = string;

export interface AuthContext {
  checkPermission: (permission: Permission) => boolean;
}
