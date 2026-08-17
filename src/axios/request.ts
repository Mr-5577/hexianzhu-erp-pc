import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { ElMessage, ElLoading } from "element-plus";
import type { RequestOptions } from "./request-types";

// 默认配置
const DEFAULT_OPTIONS: RequestOptions = {
  showLoading: true,
  loadingText: "加载中...",
  showError: true,
  errorMessage: "请求失败，请稍后重试",
  silent: false,
  showSuccessMessage: false,
  successMessage: "操作成功",
};

class Request {
  private instance: AxiosInstance;
  private loadingInstance: ReturnType<typeof ElLoading.service> | null = null;
  private loadingCount = 0;

  constructor(baseURL?: string) {
    this.instance = axios.create({
      baseURL: baseURL || import.meta.env.VITE_API_BASE_URL || "/api",
      timeout: 30000,
      headers: {
        "Content-Type": "application/json;charset=utf-8",
      },
    });

    // 请求拦截器
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // 添加 Token
        const token = localStorage.getItem("token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // 添加时间戳防止缓存（GET 请求）
        if (config.method?.toUpperCase() === "GET") {
          config.params = {
            ...config.params,
            _t: Date.now(),
          };
        }

        return config;
      },
      (error) => {
        console.error("请求拦截器错误:", error);
        return Promise.reject(error);
      },
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        const { data, config } = response;
        const options = (config as any)._requestOptions as RequestOptions;

        // 关闭 Loading
        this.closeLoading();

        // 如果是文件下载，直接返回 response
        if (config.responseType === "blob") {
          return response;
        }

        // 根据后端约定的响应结构处理
        // 假设后端返回格式为: { code: 0, data: any, message: string }
        if (data.code !== undefined) {
          if (data.code === 0) {
            // 成功提示
            if (options?.showSuccessMessage && options?.successMessage) {
              ElMessage.success(options.successMessage);
            }
            return data.data;
          } else if (data.code === 401) {
            // Token 过期或未登录
            ElMessage.error("登录已过期，请重新登录");
            // 跳转到登录页
            window.location.href = "/login";
            return Promise.reject(data);
          } else {
            // 业务错误
            if (!options?.silent) {
              ElMessage.error(data.message || options?.errorMessage);
            }
            return Promise.reject(data);
          }
        }

        // 如果后端没有统一格式，直接返回 data
        return data;
      },
      (error) => {
        // 关闭 Loading
        this.closeLoading();

        const options = (error.config as any)
          ?._requestOptions as RequestOptions;

        // 网络错误处理
        if (!error.response) {
          if (!options?.silent) {
            ElMessage.error("网络连接异常，请检查网络设置");
          }
          return Promise.reject(error);
        }

        const { status, data } = error.response;

        // HTTP 状态码错误处理
        const errorMessages: Record<number, string> = {
          400: "请求参数错误",
          401: "未授权，请重新登录",
          403: "拒绝访问",
          404: "请求资源不存在",
          500: "服务器内部错误",
          502: "网关错误",
          503: "服务不可用",
          504: "网关超时",
        };

        const message =
          data?.message ||
          errorMessages[status] ||
          options?.errorMessage ||
          "请求失败";

        if (!options?.silent) {
          ElMessage.error(message);
        }

        return Promise.reject(error);
      },
    );
  }

  /**
   * 显示 Loading
   */
  private showLoading(options: RequestOptions) {
    if (options.showLoading) {
      this.loadingCount++;
      if (!this.loadingInstance) {
        this.loadingInstance = ElLoading.service({
          fullscreen: true,
          lock: true,
          text: options.loadingText || "加载中...",
          background: "rgba(0, 0, 0, 0.7)",
        });
      }
    }
  }

  /**
   * 关闭 Loading
   */
  private closeLoading() {
    this.loadingCount--;
    if (this.loadingCount <= 0) {
      this.loadingCount = 0;
      if (this.loadingInstance) {
        this.loadingInstance.close();
        this.loadingInstance = null;
      }
    }
  }

  /**
   * 核心请求方法
   */
  public async request<T = any>(
    config: AxiosRequestConfig,
    options?: RequestOptions,
  ): Promise<T> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    // 将 options 挂载到 config 上，供拦截器使用
    (config as any)._requestOptions = opts;

    // 显示 Loading
    this.showLoading(opts);

    try {
      const response = await this.instance.request<T>(config);
      return response as T;
    } catch (error) {
      // 错误已经在拦截器中处理，这里直接抛出
      throw error;
    }
  }

  /**
   * GET 请求
   */
  public get<T = any>(
    url: string,
    params?: Record<string, any>,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request<T>(
      {
        url,
        method: "GET",
        params,
      },
      options,
    );
  }

  /**
   * POST 请求
   */
  public post<T = any>(
    url: string,
    data?: Record<string, any>,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request<T>(
      {
        url,
        method: "POST",
        data,
      },
      options,
    );
  }

  /**
   * PUT 请求
   */
  public put<T = any>(
    url: string,
    data?: Record<string, any>,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request<T>(
      {
        url,
        method: "PUT",
        data,
      },
      options,
    );
  }

  /**
   * DELETE 请求
   */
  public delete<T = any>(
    url: string,
    params?: Record<string, any>,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request<T>(
      {
        url,
        method: "DELETE",
        params,
      },
      options,
    );
  }

  /**
   * 文件下载（POST 方式）
   */
  public download(
    url: string,
    data?: Record<string, any>,
    fileName?: string,
  ): Promise<void> {
    return this.request<AxiosResponse<Blob>>(
      {
        url,
        method: "POST",
        data,
        responseType: "blob",
      },
      {
        showLoading: true,
        loadingText: "下载中...",
      },
    ).then((response) => {
      // 拦截器对 blob 返回完整 response，取 data
      const blob = response?.data || response;
      const link = document.createElement("a");
      const href = URL.createObjectURL(blob);
      link.href = href;
      link.download = fileName || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
    });
  }

  /**
   * 文件导出（支持 GET/POST）
   */
  public exportFile(
    url: string,
    params?: Record<string, any>,
    fileName?: string,
    method: "get" | "post" = "post",
  ): Promise<void> {
    const config: AxiosRequestConfig = {
      url,
      method,
      responseType: "blob",
    };

    if (method === "get") {
      config.params = params;
    } else {
      config.data = params;
    }

    return this.request<AxiosResponse<Blob>>(config, {
      showLoading: true,
      loadingText: "导出中...",
    }).then((response) => {
      // 拦截器对 blob 返回完整 response，取 data
      const blob = response?.data || response;
      const link = document.createElement("a");
      const href = URL.createObjectURL(blob);
      link.href = href;
      link.download = fileName || "export.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
    });
  }
}

// 创建单例
const request = new Request(import.meta.env.VITE_API_BASE_URL);

export default request;
export { Request };
