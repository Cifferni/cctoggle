// @ts-nocheck
// 测试连接工具模块
// 提供统一的 API 连接测试和模型获取功能

/**
 * 测试 API 连接
 * @param {string} baseUrl - API 基础 URL
 * @param {string} apiKey - API Key
 * @param {string} appType - 应用类型 (codex/claude/gemini/openclaw)
 * @returns {Promise<{success: boolean, message?: string, error?: string, apiFormat?: string, wireApi?: string, availableModels?: string[]}>}
 */
export function testConnection(baseUrl, apiKey, appType) {
  return new Promise(function (resolve) {
    if (!baseUrl) {
      resolve({ success: false, error: "请输入 Base URL" });
      return;
    }
    var url = baseUrl.replace(/\/+$/, "");
    var headers = { "Content-Type": "application/json" };
    if (apiKey) {
      headers["Authorization"] = "Bearer " + apiKey;
    }

    // 根据 appType 选择测试策略
    if (appType === "claude") {
      testAnthropicApi(url, apiKey, resolve);
    } else if (appType === "gemini") {
      testGeminiApi(url, apiKey, resolve);
    } else {
      testOpenAiApi(url, headers, resolve);
    }
  });
}

/**
 * 获取可用模型列表
 * @param {string} baseUrl - API 基础 URL
 * @param {string} apiKey - API Key
 * @param {string} appType - 应用类型
 * @returns {Promise<{success: boolean, models?: string[], error?: string}>}
 */
export function fetchAvailableModels(baseUrl, apiKey, appType) {
  return new Promise(function (resolve) {
    if (!baseUrl) {
      resolve({ success: false, error: "请输入 Base URL" });
      return;
    }
    var url = baseUrl.replace(/\/+$/, "");
    var headers = { "Content-Type": "application/json" };
    if (apiKey) {
      headers["Authorization"] = "Bearer " + apiKey;
    }

    if (appType === "gemini") {
      // Gemini API
      var testUrl = url + "/v1beta/models?key=" + (apiKey || "");
      fetch(testUrl, { method: "GET" })
        .then(function (response) {
          if (response.ok) {
            return response.json().then(function (data) {
              var models = data.models || [];
              var modelIds = models.map(function (m) { return m.name || ""; }).filter(Boolean);
              resolve({ success: true, models: modelIds });
            });
          }
          resolve({ success: false, error: "获取模型失败：" + response.status });
        })
        .catch(function () {
          resolve({ success: false, error: "无法连接到 API" });
        });
    } else if (appType === "claude") {
      // Claude: 直接返回预设模型（Anthropic 没有公开的 /models 端点）
      resolve({ success: true, models: ["claude-3-5-haiku-20241022", "claude-3-haiku-20240307", "claude-3-sonnet-20240229"] });
    } else {
      // OpenAI 兼容 API（Codex/OpenClaw）
      var modelsUrl = url + "/models";
      fetch(modelsUrl, { method: "GET", headers: headers })
        .then(function (response) {
          if (response.ok) {
            return response.json().then(function (data) {
              var models = data.data || data.models || [];
              var modelIds = models.map(function (m) { return m.id || m.model || ""; }).filter(Boolean);
              resolve({ success: true, models: modelIds });
            });
          }
          resolve({ success: false, error: "获取模型失败：" + response.status });
        })
        .catch(function () {
          resolve({ success: false, error: "无法连接到 API" });
        });
    }
  });
}

/**
 * 测试 Anthropic API
 */
function testAnthropicApi(url, apiKey, callback) {
  // 尝试多个可能的路径
  var paths = ["/v1/messages", "/messages", ""];
  var headers = {
    "Content-Type": "application/json",
    "x-api-key": apiKey || "",
    "anthropic-version": "2023-06-01",
  };
  var models = ["claude-3-5-haiku-20241022", "claude-3-haiku-20240307", "claude-3-sonnet-20240229"];

  tryPath(0);

  function tryPath(pathIndex) {
    if (pathIndex >= paths.length) {
      callback({ success: false, error: "无法连接到 Anthropic API，请检查 URL 和 API Key" });
      return;
    }
    var testUrl = url + paths[pathIndex];
    tryModel(0, testUrl, pathIndex);
  }

  function tryModel(modelIndex, testUrl, pathIndex) {
    if (modelIndex >= models.length) {
      // 所有模型都失败，尝试下一个路径
      tryPath(pathIndex + 1);
      return;
    }
    var testBody = JSON.stringify({
      model: models[modelIndex],
      max_tokens: 5,
      messages: [{ role: "user", content: "Hi" }],
    });
    fetch(testUrl, { method: "POST", headers: headers, body: testBody })
      .then(function (response) {
        if (response.ok) {
          callback({
            success: true,
            apiFormat: "anthropic",
            wireApi: "responses",
            message: "Anthropic API 连接成功",
          });
        } else if (response.status === 400) {
          // 模型不存在，尝试下一个
          tryModel(modelIndex + 1, testUrl, pathIndex);
        } else if (response.status === 404) {
          // 路径不存在，尝试下一个路径
          tryPath(pathIndex + 1);
        } else {
          callback({ success: false, error: "连接失败：" + response.status });
        }
      })
      .catch(function () {
        callback({ success: false, error: "无法连接到 Anthropic API" });
      });
  }
}

/**
 * 测试 Google Gemini API
 */
function testGeminiApi(url, apiKey, callback) {
  var testUrl = url + "/v1beta/models?key=" + (apiKey || "");
  fetch(testUrl, { method: "GET" })
    .then(function (response) {
      if (response.ok) {
        return response.json().then(function (data) {
          var models = data.models || [];
          var modelIds = models.map(function (m) { return m.name || ""; }).filter(Boolean);
          callback({
            success: true,
            message: "Google Gemini API 连接成功",
            availableModels: modelIds,
          });
        });
      } else {
        callback({ success: false, error: "连接失败：" + response.status });
      }
    })
    .catch(function () {
      callback({ success: false, error: "无法连接到 Google Gemini API" });
    });
}

/**
 * 测试 OpenAI 兼容 API
 */
function testOpenAiApi(url, headers, callback) {
  var modelsUrl = url + "/models";
  fetch(modelsUrl, { method: "GET", headers: headers })
    .then(function (response) {
      if (response.ok) {
        return response.json().then(function (data) {
          var models = data.data || data.models || [];
          var modelIds = models.map(function (m) { return m.id || m.model || ""; }).filter(Boolean);
          callback({
            success: true,
            apiFormat: "openai_chat",
            wireApi: "chat",
            message: "检测成功：OpenAI 兼容 API",
          });
        });
      }
      testResponsesEndpoint(url, headers, callback);
    })
    .catch(function () {
      testResponsesEndpoint(url, headers, callback);
    });
}

/**
 * 测试 Responses 端点
 */
function testResponsesEndpoint(url, headers, callback) {
  var responsesUrl = url + "/responses";
  // 尝试获取 Responses 端点的模型列表
  var modelsUrl = url + "/models";
  fetch(modelsUrl, { method: "GET", headers: headers })
    .then(function (response) {
      if (response.ok) {
        return response.json().then(function (data) {
          var models = data.data || data.models || [];
          var modelIds = models.map(function (m) { return m.id || m.model || ""; }).filter(Boolean);
          callback({
            success: true,
            apiFormat: "openai_responses",
            wireApi: "responses",
            availableModels: modelIds,
            message: "检测成功：Responses 格式",
          });
        });
      }
      callback({ success: false, error: "无法连接到 API，请检查 URL 和 API Key" });
    })
    .catch(function () {
      callback({ success: false, error: "无法连接到 API，请检查 URL 和网络连接" });
    });
}
