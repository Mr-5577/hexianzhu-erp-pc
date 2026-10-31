// ============================================================================
// 通用工具函数
// ============================================================================

/**
 * 将 Blob 保存为本地文件
 * @param blob 二进制数据
 * @param fileName 文件名
 */
export const saveBlobAsFile = (blob: Blob, fileName: string) => {
  const link = document.createElement("a");
  const href = URL.createObjectURL(blob);
  link.href = href;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(href);
};

/**
 * 从下载响应头中解析文件名（兼容后端 filename*=UTF-8'' 与 filename= 两种写法）
 */
export const getFileNameFromHeaders = (headers: any, fallback = "download") => {
  const disposition: string = headers?.["content-disposition"] || "";
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);
  const normalMatch = disposition.match(/filename="?([^";]+)"?/i);
  if (normalMatch?.[1]) return decodeURIComponent(normalMatch[1]);
  return fallback;
};

/**
 * 金额千分位格式化
 * @example formatMoney(1234567.891) // "1,234,567.89"
 */
export const formatMoney = (
  value: number | string | null | undefined,
  digits = 2,
): string => {
  const num = Number(value);
  if (value === null || value === undefined || value === "" || isNaN(num)) {
    return "";
  }
  return num.toLocaleString("zh-CN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

/**
 * 扁平数组转树形结构
 * @param list 扁平数据
 * @param options 字段映射配置
 */
export const listToTree = <T extends Record<string, any>>(
  list: T[],
  options?: {
    idField?: string;
    parentField?: string;
    childrenField?: string;
  },
): T[] => {
  const idField = options?.idField || "id";
  const parentField = options?.parentField || "parentId";
  const childrenField = options?.childrenField || "children";

  const map = new Map<any, Record<string, any>>();
  const tree: Record<string, any>[] = [];

  list.forEach((item) =>
    map.set((item as Record<string, any>)[idField], { ...item }),
  );
  map.forEach((item) => {
    const parent = map.get(item[parentField]);
    if (parent) {
      (parent[childrenField] ||= []).push(item);
    } else {
      tree.push(item);
    }
  });
  return tree as T[];
};
