import request from "@/axios/request";
import type { UserInfo } from "@/stores/user-store";

/**
 * 登录接口
 *
 * ⚠️ 当前为演示用 mock 实现，接入真实后端时：
 *   1. 删除下方 mock 逻辑
 *   2. 将 return mockLogin(...) 替换为：
 *      return request.post<LoginResult>("/auth/login", params)
 */
export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResult {
  token: string;
  userInfo: UserInfo;
  roles: string[];
  permissions: string[];
}

/** 演示账号权限配置 */
const DEMO_ACCOUNTS: Record<string, LoginResult> = {
  admin: {
    token: "mock-token-admin",
    userInfo: { id: 1, name: "系统管理员" },
    roles: ["admin"],
    permissions: ["*"], // 超级管理员：全部权限
  },
  viewer: {
    token: "mock-token-viewer",
    userInfo: { id: 2, name: "只读用户" },
    roles: ["viewer"],
    permissions: ["dashboard:view"], // 只能访问首页
  },
};

/** 模拟网络延迟 */
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function mockLogin(params: LoginParams): Promise<LoginResult> {
  await delay(300);
  const account = DEMO_ACCOUNTS[params.username];
  if (!account || params.password !== "123456") {
    throw new Error("账号或密码错误（演示账号：admin / viewer，密码均为 123456）");
  }
  return account;
}

export const loginApi = (params: LoginParams): Promise<LoginResult> => {
  // 接入真实后端时替换为：return request.post<LoginResult>("/auth/login", params)
  return mockLogin(params);
};

/** 获取当前用户信息（登录后调用） */
export const getUserInfoApi = (): Promise<LoginResult> => {
  return request.get<LoginResult>("/auth/user-info");
};

/** 退出登录 */
export const logoutApi = (): Promise<void> => {
  return request.post<void>("/auth/logout", undefined, { silent: true });
};
