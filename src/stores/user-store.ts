import { defineStore } from "pinia";
import { ref } from "vue";

export const useUserStore = defineStore(
  "user-store",
  () => {
    const userInfo = ref(null);
    const token = ref<string>("");

    const setUserInfo = (info: null) => {
      userInfo.value = info;
    };

    const clearUserInfo = () => {
      userInfo.value = null;
      token.value = "";
    };

    const setToken = (newToken: string) => {
      token.value = newToken;
    };

    return {
      // 数据
      userInfo,
      token,

      // 方法
      setUserInfo,
      setToken,
      clearUserInfo,
    };
  },
  {
    persist: true, // 添加持久化配置
  },
);
