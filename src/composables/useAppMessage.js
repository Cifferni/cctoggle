import { createDiscreteApi } from "naive-ui";

// 独立的 message / dialog 实例，供 composable 在 setup 外使用
const { message, dialog } = createDiscreteApi(["message", "dialog"]);

export { message as appMessage, dialog as appDialog };
