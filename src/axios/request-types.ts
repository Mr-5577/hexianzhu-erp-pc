/**
 * 请求配置选项
 */
export interface RequestOptions {
  /** 是否显示全局 Loading */
  showLoading?: boolean;
  /** Loading 提示文本 */
  loadingText?: string;
  /** 是否显示错误提示 */
  showError?: boolean;
  /** 自定义错误提示文本 */
  errorMessage?: string;
  /** 静默模式，不显示任何提示（通常用于轮询等场景） */
  silent?: boolean;
  /** 是否显示成功提示 */
  showSuccessMessage?: boolean;
  /** 自定义成功提示文本 */
  successMessage?: string;
}

/**
 * 后端统一响应结构（根据实际后端调整）
 */
export interface ApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
  success: boolean;
}

/**
 * 分页响应结构
 */
export interface PageResponse<T = any> {
  list: T[];
  total: number;
  pageNum: number;
  pageSize: number;
  pages: number;
}

/**
 * 分页请求参数
 */
export interface PageParams {
  pageNum: number;
  pageSize: number;
  [key: string]: any;
}
