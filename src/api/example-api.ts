import request from "@/axios/request";
import type { PageParams, PageResponse } from "@/axios/request-types";

// ============================================================
// GET - 查询数据
// ============================================================

// 无参数
export const getData = () => {
  return request.get<PageResponse<any>>("/api/endpoint");
};

// 带 URL 参数
export const getDataById = (id: string) => {
  return request.get<PageResponse<any>>(`/api/endpoint/${id}`);
};

// 带查询参数
export const getDataList = (params: { pageNum: number; pageSize: number }) => {
  return request.get<PageResponse<any>>("/api/endpoint", params);
};

// 带查询参数 + 自定义配置（静默模式）
export const getDataSilent = (params: any) => {
  return request.get<PageResponse<any>>("/api/endpoint", params, {
    silent: true,
  });
};

// 带查询参数 + 不显示 Loading
export const getDataNoLoading = (params: any) => {
  return request.get<PageResponse<any>>("/api/endpoint", params, {
    showLoading: false,
  });
};

// ============================================================
// POST - 新增数据
// ============================================================

// 基础新增
export const createData = (data: any) => {
  return request.post<PageResponse<any>>("/api/endpoint", data);
};

// 新增 + 成功提示
export const createDataWithMessage = (data: any) => {
  return request.post<PageResponse<any>>("/api/endpoint", data, {
    showSuccessMessage: true,
    successMessage: "创建成功",
  });
};

// 新增 + 自定义 Loading
export const createDataWithLoading = (data: any) => {
  return request.post<PageResponse<any>>("/api/endpoint", data, {
    showLoading: true,
    loadingText: "提交中...",
  });
};

// 新增 + 静默模式（不显示任何提示）
export const createDataSilent = (data: any) => {
  return request.post<PageResponse<any>>("/api/endpoint", data, {
    silent: true,
  });
};

// ============================================================
// PUT - 更新数据
// ============================================================

// URL 带 ID 更新
export const updateData = (id: string, data: any) => {
  return request.put<PageResponse<any>>(`/api/endpoint/${id}`, data);
};

// 更新 + 成功提示
export const updateDataWithMessage = (id: string, data: any) => {
  return request.put<PageResponse<any>>(`/api/endpoint/${id}`, data, {
    showSuccessMessage: true,
    successMessage: "更新成功",
  });
};

// 更新（ID 在 data 中）
export const updateDataById = (data: { id: string; [key: string]: any }) => {
  return request.put<PageResponse<any>>(`/api/endpoint/${data.id}`, data);
};

// ============================================================
// DELETE - 删除数据
// ============================================================

// URL 带 ID 删除
export const deleteData = (id: string) => {
  return request.delete<PageResponse<any>>(`/api/endpoint/${id}`);
};

// 删除 + 成功提示
export const deleteDataWithMessage = (id: string) => {
  return request.delete<PageResponse<any>>(
    `/api/endpoint/${id}`,
    {},
    {
      showSuccessMessage: true,
      successMessage: "删除成功",
    },
  );
};

// 批量删除（通过 params 传参）
export const batchDeleteData = (ids: string[]) => {
  return request.delete<PageResponse<any>>("/api/endpoint/batch", { ids });
};

// 批量删除 + 成功提示
export const batchDeleteWithMessage = (ids: string[]) => {
  return request.delete<PageResponse<any>>(
    "/api/endpoint/batch",
    { ids },
    {
      showSuccessMessage: true,
      successMessage: "批量删除成功",
    },
  );
};

// 批量删除 + 静默模式
export const batchDeleteSilent = (ids: string[]) => {
  return request.delete<PageResponse<any>>(
    "/api/endpoint/batch",
    { ids },
    {
      silent: true,
    },
  );
};

// ============================================================
// Download - 文件下载
// ============================================================

// 基础下载
export const downloadFile = (params: any) => {
  return request.download("/api/endpoint/export", params);
};

// 下载 + 自定义文件名
export const downloadWithFilename = (params: any, filename?: string) => {
  return request.download(
    "/api/endpoint/export",
    params,
    filename || "默认文件名.xlsx",
  );
};

// 使用 exportFile（POST 方式）
export const exportFile = (params: any, filename?: string) => {
  return request.exportFile(
    "/api/endpoint/export",
    params,
    filename || "数据导出.xlsx",
    "post",
  );
};

// 使用 exportFile（GET 方式）
export const exportFileGet = (params: any, filename?: string) => {
  return request.exportFile(
    "/api/endpoint/export",
    params,
    filename || "数据导出.xlsx",
    "get",
  );
};

// 下载模板
export const downloadTemplate = () => {
  return request.download("/api/endpoint/template", {}, "导入模板.xlsx");
};
