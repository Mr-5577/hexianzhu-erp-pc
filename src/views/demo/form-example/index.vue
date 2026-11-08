<!-- 表单组件示例：BaseInput / BaseSelect / BaseCascader / BaseForm -->
<template>
  <div class="form-demo">
    <el-tabs v-model="activeTab">
      <!-- ==================== BaseInput ==================== -->
      <el-tab-pane label="BaseInput 输入框" name="input">
        <el-card shadow="never">
          <el-form label-width="140px" style="max-width: 560px">
            <el-form-item label="基础输入（trim）">
              <base-input
                v-model="inputDemo.basic"
                placeholder="自动去除首尾空格"
              />
              <div class="demo-value">当前值：{{ inputDemo.basic }}</div>
            </el-form-item>

            <el-form-item label="防抖输入（500ms）">
              <base-input
                v-model="inputDemo.debounce"
                :debounce="500"
                placeholder="停止输入 500ms 后才更新值"
                @search="handleInputSearch"
              />
              <div class="demo-value">
                当前值：{{ inputDemo.debounce }}
              </div>
            </el-form-item>

            <el-form-item label="大写转换">
              <base-input
                v-model="inputDemo.upper"
                uppercase
                placeholder="输入自动转大写，如合同编号"
              />
            </el-form-item>

            <el-form-item label="文本域">
              <base-input
                v-model="inputDemo.remark"
                type="textarea"
                :rows="3"
                :maxlength="200"
                show-word-limit
                placeholder="最多 200 字"
              />
            </el-form-item>

            <el-form-item label="回车搜索">
              <base-input
                v-model="inputDemo.keyword"
                placeholder="回车或点清空触发 @search"
                @search="handleInputSearch"
              />
            </el-form-item>

            <el-form-item label="宽度（style 优先）">
              <div class="width-row">
                <base-input
                  v-model="inputDemo.widthProp"
                  :width="180"
                  placeholder="width=180（数字自动转 px）"
                />
                <base-input
                  v-model="inputDemo.widthStyle"
                  style="width: 180px"
                  placeholder="style 里的 width"
                />
              </div>
              <div class="demo-value">
                width prop 只作默认值，父级 style 优先级更高（此处两者渲染等宽）
              </div>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- ==================== BaseSelect ==================== -->
      <el-tab-pane label="BaseSelect 下拉选择" name="select">
        <el-card shadow="never">
          <el-form label-width="140px" style="max-width: 560px">
            <el-form-item label="单选（可搜索）">
              <base-select
                v-model="selectDemo.single"
                :options="statusOptions"
                filterable
                placeholder="请选择状态"
                @change="(val: any) => ElMessage.info(`选中：${val}`)"
              />
            </el-form-item>

            <el-form-item label="多选（折叠标签）">
              <base-select
                v-model="selectDemo.multiple"
                :options="statusOptions"
                multiple
                collapse-tags
                collapse-tags-tooltip
                :max-collapse-tags="2"
                filterable
                placeholder="可多选，最多显示 2 个标签"
              />
              <div class="demo-value">
                当前值：{{ selectDemo.multiple }}
              </div>
            </el-form-item>

            <el-form-item label="自定义字段名">
              <base-select
                v-model="selectDemo.customKey"
                :options="supplierOptions"
                value-key="id"
                label-key="name"
                placeholder="value-key / label-key 映射"
              />
              <div class="demo-value">
                当前值：{{ selectDemo.customKey }}
              </div>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- ==================== BaseCascader ==================== -->
      <el-tab-pane label="BaseCascader 级联选择" name="cascader">
        <el-card shadow="never">
          <el-form label-width="140px" style="max-width: 560px">
            <el-form-item label="单选（可搜索）">
              <base-cascader
                v-model="cascaderDemo.single"
                :options="regionOptions"
                filterable
                placeholder="请选择省 / 市 / 区"
                @change="handleCascaderChange"
              />
              <div class="demo-value">
                当前值：{{ cascaderDemo.single }}
              </div>
            </el-form-item>

            <el-form-item label="仅返回叶子值">
              <base-cascader
                v-model="cascaderDemo.leafOnly"
                :options="regionOptions"
                :emit-path="false"
                placeholder="emit-path=false 时只返回末级值"
              />
              <div class="demo-value">
                当前值：{{ cascaderDemo.leafOnly }}
              </div>
            </el-form-item>

            <el-form-item label="多选（折叠标签）">
              <base-cascader
                v-model="cascaderDemo.multiple"
                :options="regionOptions"
                multiple
                collapse-tags
                collapse-tags-tooltip
                placeholder="多选模式"
              />
            </el-form-item>

            <el-form-item label="父级可选（严格模式）">
              <base-cascader
                v-model="cascaderDemo.strict"
                :options="regionOptions"
                check-strictly
                placeholder="check-strictly：任意层级都可选中"
              />
              <div class="demo-value">
                当前值：{{ cascaderDemo.strict }}
              </div>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- ==================== BaseForm ==================== -->
      <el-tab-pane label="BaseForm 配置化表单" name="form">
        <el-card shadow="never">
          <base-form
            v-model="formData"
            :items="formItems"
            label-width="110px"
            show-actions
            submit-text="保存"
            :submit-loading="submitting"
            @submit="handleSubmit"
            @reset="handleReset"
          />

          <el-divider />
          <h4>表单实时数据：</h4>
          <pre class="form-json">{{ formData }}</pre>
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { ElMessage } from "element-plus";

const activeTab = ref("input");

// ==================== BaseInput ====================
const inputDemo = reactive({
  basic: "",
  debounce: "",
  upper: "",
  remark: "",
  keyword: "",
  widthProp: "",
  widthStyle: "",
});

const handleInputSearch = (value: string) => {
  ElMessage.info(`触发搜索：${value || "(空)"}`);
};

// ==================== BaseSelect ====================
const statusOptions = [
  { value: 1, label: "草稿" },
  { value: 2, label: "待审核" },
  { value: 3, label: "已通过" },
  { value: 4, label: "已驳回", disabled: true },
  { value: 5, label: "已归档" },
];

const supplierOptions = [
  { id: "S001", name: "中建集团" },
  { id: "S002", name: "三菱电梯" },
  { id: "S003", name: "华安消防" },
];

const selectDemo = reactive({
  single: undefined,
  multiple: [],
  customKey: undefined,
});

// ==================== BaseCascader ====================
const regionOptions = [
  {
    value: "zhejiang",
    label: "浙江省",
    children: [
      {
        value: "hangzhou",
        label: "杭州市",
        children: [
          { value: "xihu", label: "西湖区" },
          { value: "gongshu", label: "拱墅区" },
        ],
      },
      {
        value: "ningbo",
        label: "宁波市",
        children: [{ value: "haishu", label: "海曙区" }],
      },
    ],
  },
  {
    value: "jiangsu",
    label: "江苏省",
    children: [
      {
        value: "nanjing",
        label: "南京市",
        children: [
          { value: "xuanwu", label: "玄武区" },
          { value: "gulou", label: "鼓楼区" },
        ],
      },
    ],
  },
];

const cascaderDemo = reactive({
  single: undefined,
  leafOnly: undefined,
  multiple: [],
  strict: undefined,
});

const handleCascaderChange = (value: any, selectedOptions: any) => {
  console.log("选中值：", value, "选中节点：", selectedOptions);
};

// ==================== BaseForm ====================
const submitting = ref(false);

const formData = ref<Record<string, any>>({});

/** 配置化表单项：type 支持 input/textarea/select/cascader/date-picker/switch/radio/checkbox/input-number 等 */
const formItems = [
  {
    prop: "contractName",
    label: "合同名称",
    type: "input",
    required: true,
    placeholder: "请输入合同名称",
  },
  {
    prop: "contractNo",
    label: "合同编号",
    type: "input",
    required: true,
    tip: "编号规则：HT-年份-序号",
  },
  {
    prop: "supplier",
    label: "供应商",
    type: "select",
    required: true,
    options: supplierOptions,
    // BaseSelect 的字段映射通过 props 透传
    props: { valueKey: "id", labelKey: "name", filterable: true },
  },
  {
    prop: "region",
    label: "项目地区",
    type: "cascader",
    options: regionOptions,
  },
  {
    prop: "signDate",
    label: "签订日期",
    type: "date-picker",
    required: true,
  },
  {
    prop: "amount",
    label: "合同金额",
    type: "input-number",
    required: true,
    props: { min: 0, max: 99999999 },
  },
  {
    prop: "payType",
    label: "付款方式",
    type: "radio",
    defaultValue: "month",
    options: [
      { label: "按月支付", value: "month" },
      { label: "按进度支付", value: "progress" },
      { label: "一次性支付", value: "once" },
    ],
  },
  {
    prop: "isFrame",
    label: "是否框架协议",
    type: "switch",
    defaultValue: false,
  },
  {
    prop: "remark",
    label: "备注",
    type: "textarea",
  },
] as any[];

const handleSubmit = (values: Record<string, any>) => {
  submitting.value = true;
  // 模拟提交
  setTimeout(() => {
    submitting.value = false;
    ElMessage.success("校验通过，提交成功");
    console.log("提交数据：", values);
  }, 800);
};

const handleReset = () => {
  ElMessage.info("表单已重置");
};
</script>

<style scoped>
.form-demo {
  padding: 12px;
  background: #fff;
  height: 100%;
  overflow: auto;
}

.demo-value {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.width-row {
  display: flex;
  gap: 8px;
  width: 100%;
}

.form-json {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 12px;
  max-height: 240px;
  overflow: auto;
}
</style>
