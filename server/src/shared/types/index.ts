// Every controller response is shaped through this envelope, so frontend
// code (and the admin dashboard) can rely on one consistent contract instead
// of each endpoint inventing its own shape.
export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export enum Role {
  CREATOR = 'CREATOR',
  ADMIN = 'ADMIN',
}
