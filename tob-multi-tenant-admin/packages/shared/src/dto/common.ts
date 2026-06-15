export interface ApiSuccessResponse<T> {
  code: 'OK';
  message: string;
  data: T;
}

export interface PageQuery {
  page: number;
  pageSize: number;
  keyword?: string;
}

export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface HealthData {
  service: string;
  status: 'ok';
  timestamp: string;
}

export type HealthResponse = ApiSuccessResponse<HealthData>;