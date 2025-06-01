/**
 * Utility types for the application
 */

/**
 * Adds timestamps to any type
 */
export type WithTimestamps<T> = T & {
  created_at: string;
  updated_at: string;
};

/**
 * Adds an ID to any type
 * @deprecated Use specific ID types like WithEventId, WithTicketId, etc.
 */
export type WithId<T> = T & {
  id: string;
};

/**
 * Adds specific ID fields to types
 */
export type WithEventId<T> = T & {
  event_id: string;
};

export type WithTicketId<T> = T & {
  ticket_id: string;
};

export type WithAttendeeId<T> = T & {
  attendee_id: string;
};

export type WithRegistrationId<T> = T & {
  registration_id: string;
};

export type WithPackageId<T> = T & {
  package_id: string;
};

export type WithFunctionId<T> = T & {
  function_id: string;
};

/**
 * API response wrapper for consistent error handling
 */
export type ApiResponse<T> = {
  data: T | null;
  error: Error | null;
};

/**
 * Paginated API response
 */
export type PaginatedResponse<T> = {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

/**
 * Makes all properties of T nullable
 */
export type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

/**
 * Makes specific properties of T optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Makes specific properties of T required
 */
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Extracts the promise type
 */
export type PromiseType<T extends Promise<any>> = T extends Promise<infer U> ? U : never;

/**
 * Deep partial type
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};