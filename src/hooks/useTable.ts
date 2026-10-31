import { ref, reactive, type Ref } from "vue";
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZES } from "@/constants";

/**
 * 分页查询表格通用 Hook
 *
 * 封装「分页参数 + 查询参数 + 加载状态 + 数据请求」的样板代码，
 * 配合 base-vxe-table / base-table 的分页 props 直接使用。
 *
 * @param fetchApi 数据请求函数，接收合并后的查询参数，返回 { list, total }
 * @param options.immediate 是否立即请求（默认 true）
 * @param options.defaultParams 默认查询参数
 *
 * @example
 * const { tableData, loading, total, queryParams, loadData, resetQuery, handlePageChange } =
 *   useTable(getUserList, { defaultParams: { status: 1 } });
 */
export const useTable = <T = any, Q extends Record<string, any> = Record<string, any>>(
  fetchApi: (params: any) => Promise<{ list: T[]; total: number }>,
  options?: {
    immediate?: boolean;
    defaultParams?: Partial<Q>;
  },
) => {
  const tableData = ref<T[]>([]) as Ref<T[]>;
  const loading = ref(false);
  const total = ref(0);
  const currentPage = ref(1);
  const pageSize = ref(DEFAULT_PAGE_SIZE);
  const pageSizes = ref(DEFAULT_PAGE_SIZES);

  /** 查询条件（与分页参数分离，便于重置） */
  const queryParams = reactive<Q>({ ...(options?.defaultParams as Q) });

  /** 加载数据 */
  const loadData = async () => {
    loading.value = true;
    try {
      const res = await fetchApi({
        pageNum: currentPage.value,
        pageSize: pageSize.value,
        ...queryParams,
      });
      tableData.value = res?.list ?? [];
      total.value = res?.total ?? 0;
    } finally {
      loading.value = false;
    }
  };

  /** 查询（回到第一页） */
  const handleQuery = () => {
    currentPage.value = 1;
    loadData();
  };

  /** 重置查询条件并查询 */
  const resetQuery = () => {
    Object.keys(queryParams).forEach((key) => {
      delete (queryParams as Record<string, any>)[key];
    });
    Object.assign(queryParams, options?.defaultParams);
    handleQuery();
  };

  /** 分页变化（直接对接 base-vxe-table 的 pagination-change 事件） */
  const handlePageChange = (params: { currentPage: number; pageSize: number }) => {
    currentPage.value = params.currentPage;
    pageSize.value = params.pageSize;
    loadData();
  };

  if (options?.immediate !== false) {
    loadData();
  }

  return {
    tableData,
    loading,
    total,
    currentPage,
    pageSize,
    pageSizes,
    queryParams,
    loadData,
    handleQuery,
    resetQuery,
    handlePageChange,
  };
};
