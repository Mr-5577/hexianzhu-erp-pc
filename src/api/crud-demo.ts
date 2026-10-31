/**
 * CRUD 样板接口层
 *
 * ⚠️ 当前为演示用 mock 实现（内存数据 + 延迟模拟）。
 * 接入真实后端时，把每个方法的实现替换为 request 调用即可，
 * 页面层（src/views/demo/crud-demo/index.vue）无需任何改动：
 *
 *   export const getDemoListApi = (params: DemoListParams) =>
 *     request.get<PageResponse<DemoItem>>("/demo/list", params);
 */
import type { PageResponse } from "@/axios/request-types";

/** 列表项类型（按业务字段调整） */
export interface DemoItem {
  id: number;
  name: string;
  code: string;
  status: 0 | 1;
  amount: number;
  remark: string;
  createTime: string;
}

export interface DemoListParams {
  pageNum: number;
  pageSize: number;
  name?: string;
  status?: number | "";
}

export interface DemoSaveParams {
  id?: number;
  name: string;
  code: string;
  status: 0 | 1;
  amount: number;
  remark?: string;
}

// ==================== mock 数据 ====================
let idSeed = 28;

const MOCK_DATA: DemoItem[] = Array.from({ length: 27 }, (_, i) => ({
  id: i + 1,
  name: `示例项目 ${i + 1} 号`,
  code: `XM-2024-${String(i + 1).padStart(3, "0")}`,
  status: (i % 3 === 0 ? 0 : 1) as 0 | 1,
  amount: (i + 1) * 12000,
  remark: i % 2 === 0 ? "常规项目" : "",
  createTime: `2024-0${(i % 9) + 1}-1${i % 9} 10:00:00`,
}));

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

const now = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:00`;
};

// ==================== 接口定义（真实后端对接时只改这里） ====================

/** 分页列表 */
export const getDemoListApi = async (
  params: DemoListParams,
): Promise<PageResponse<DemoItem>> => {
  await delay();
  const filtered = MOCK_DATA.filter(
    (item) =>
      (!params.name || item.name.includes(params.name)) &&
      (params.status === "" || params.status === undefined
        ? true
        : item.status === Number(params.status)),
  );
  const start = (params.pageNum - 1) * params.pageSize;
  return {
    list: filtered.slice(start, start + params.pageSize),
    total: filtered.length,
    pageNum: params.pageNum,
    pageSize: params.pageSize,
    pages: Math.ceil(filtered.length / params.pageSize),
  };
};

/** 新增 */
export const createDemoApi = async (
  data: DemoSaveParams,
): Promise<DemoItem> => {
  await delay();
  const item: DemoItem = {
    ...data,
    id: ++idSeed,
    remark: data.remark || "",
    createTime: now(),
  };
  MOCK_DATA.unshift(item);
  return item;
};

/** 更新 */
export const updateDemoApi = async (
  data: DemoSaveParams,
): Promise<DemoItem> => {
  await delay();
  const index = MOCK_DATA.findIndex((item) => item.id === data.id);
  if (index === -1) throw new Error("记录不存在");
  MOCK_DATA[index] = { ...MOCK_DATA[index]!, ...data };
  return MOCK_DATA[index]!;
};

/** 删除 */
export const deleteDemoApi = async (id: number): Promise<void> => {
  await delay();
  const index = MOCK_DATA.findIndex((item) => item.id === id);
  if (index !== -1) MOCK_DATA.splice(index, 1);
};
