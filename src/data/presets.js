// 自动从 cc-switch 同步的内置模板（含各 Agent / 大模型专属参数）
// 由脚本生成，请勿手改。来源: cc-switch-main/src/config/*ProviderPresets.ts
export const PRESETS = {
  "codex": [
    {
      "name": "OpenAI Official",
      "websiteUrl": "https://chatgpt.com/codex",
      "apiKeyUrl": "",
      "category": "official",
      "icon": "openai",
      "iconColor": "#00A67E",
      "badge": "official",
      "configType": "openai",
      "baseUrl": "",
      "model": "",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "",
      "models": [],
      "modelCatalog": [],
      "endpointCandidates": [],
      "config": "",
      "authData": {}
    },
    {
      "name": "Kimi",
      "websiteUrl": "https://platform.kimi.com?aff=cc-switch",
      "apiKeyUrl": "https://platform.kimi.com/console/api-keys?aff=cc-switch",
      "category": "cn_official",
      "icon": "kimi",
      "iconColor": "#6366F1",
      "badge": "prime",
      "configType": "openai",
      "baseUrl": "https://api.moonshot.cn/v1",
      "model": "kimi-k2.7-code",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "openai_chat",
      "models": [
        "kimi-k2.7-code",
        "kimi-k3"
      ],
      "modelCatalog": [
        {
          "model": "kimi-k2.7-code",
          "displayName": "Kimi K2.7 Code",
          "contextWindow": 262144
        },
        {
          "model": "kimi-k3",
          "displayName": "Kimi K3",
          "contextWindow": 1048576
        }
      ],
      "endpointCandidates": [
        "https://api.moonshot.cn/v1"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"kimi-k2.7-code\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"kimi\"\nbase_url = \"https://api.moonshot.cn/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "Kimi For Coding",
      "websiteUrl": "https://www.kimi.com/code/?aff=cc-switch",
      "apiKeyUrl": "https://www.kimi.com/code/?aff=cc-switch",
      "category": "cn_official",
      "icon": "kimi",
      "iconColor": "#6366F1",
      "badge": "prime",
      "configType": "openai",
      "baseUrl": "https://api.kimi.com/coding/v1",
      "model": "kimi-for-coding",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "openai_chat",
      "models": [
        "kimi-for-coding"
      ],
      "modelCatalog": [
        {
          "model": "kimi-for-coding",
          "displayName": "Kimi For Coding",
          "contextWindow": 262144
        }
      ],
      "endpointCandidates": [
        "https://api.kimi.com/coding/v1"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"kimi-for-coding\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"kimi_coding\"\nbase_url = \"https://api.kimi.com/coding/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "PackyCode",
      "websiteUrl": "https://www.packyapi.com",
      "apiKeyUrl": "https://www.packyapi.com/register?aff=cc-switch",
      "category": "third_party",
      "icon": "packycode",
      "iconColor": "",
      "badge": "partner",
      "configType": "openai",
      "baseUrl": "https://www.packyapi.com/v1",
      "model": "gpt-5.5",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "",
      "models": [],
      "modelCatalog": [],
      "endpointCandidates": [
        "https://www.packyapi.com/v1",
        "https://api-slb.packyapi.com/v1"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"gpt-5.5\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"packycode\"\nbase_url = \"https://www.packyapi.com/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "ZetaAPI",
      "websiteUrl": "https://zetaapi.ai",
      "apiKeyUrl": "https://zetaapi.ai/go/u117",
      "category": "aggregator",
      "icon": "zetaapi",
      "iconColor": "",
      "badge": "partner",
      "configType": "openai",
      "baseUrl": "https://api.zetaapi.ai/v1",
      "model": "gpt-5.5",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "",
      "models": [],
      "modelCatalog": [],
      "endpointCandidates": [
        "https://api.zetaapi.ai/v1"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"gpt-5.5\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"zetaapi\"\nbase_url = \"https://api.zetaapi.ai/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "APINebula",
      "websiteUrl": "https://apinebula.com",
      "apiKeyUrl": "https://apinebula.com/VjM74M",
      "category": "third_party",
      "icon": "apinebula",
      "iconColor": "",
      "badge": "partner",
      "configType": "openai",
      "baseUrl": "https://apinebula.com/v1",
      "model": "gpt-5.5",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "openai_responses",
      "models": [],
      "modelCatalog": [],
      "endpointCandidates": [
        "https://apinebula.com/v1"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"gpt-5.5\"\nreview_model = \"gpt-5.5\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"APINebula\"\nbase_url = \"https://apinebula.com/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "AICodeMirror",
      "websiteUrl": "https://www.aicodemirror.com",
      "apiKeyUrl": "https://www.aicodemirror.com/register?invitecode=9915W3",
      "category": "custom",
      "icon": "aicodemirror",
      "iconColor": "#000000",
      "badge": "partner",
      "configType": "openai",
      "baseUrl": "https://api.aicodemirror.com/api/codex/backend-api/codex",
      "model": "gpt-5.5",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "",
      "models": [],
      "modelCatalog": [],
      "endpointCandidates": [
        "https://api.aicodemirror.com/api/codex/backend-api/codex",
        "https://api.claudecode.net.cn/api/codex/backend-api/codex"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"gpt-5.5\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"aicodemirror\"\nbase_url = \"https://api.aicodemirror.com/api/codex/backend-api/codex\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "PatewayAI",
      "websiteUrl": "https://pateway.ai",
      "apiKeyUrl": "https://pateway.ai/?ch=etzpm8&aff=WB6M6F67#/",
      "category": "third_party",
      "icon": "pateway",
      "iconColor": "",
      "badge": "partner",
      "configType": "openai",
      "baseUrl": "https://api.pateway.ai/v1",
      "model": "gpt-5.5",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "",
      "models": [],
      "modelCatalog": [],
      "endpointCandidates": [
        "https://api.pateway.ai/v1"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"gpt-5.5\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"patewayai\"\nbase_url = \"https://api.pateway.ai/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "FennoAI",
      "websiteUrl": "https://api.fenno.ai",
      "apiKeyUrl": "https://api.fenno.ai/register?redirect=/purchase?tab=subscription%26group=16&aff=P9MR3D3PLCNL",
      "category": "aggregator",
      "icon": "fenno",
      "iconColor": "",
      "badge": "partner",
      "configType": "openai",
      "baseUrl": "https://api.fenno.ai",
      "model": "gpt-5.5",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "",
      "models": [],
      "modelCatalog": [],
      "endpointCandidates": [
        "https://api.fenno.ai"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"gpt-5.5\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"fenno\"\nbase_url = \"https://api.fenno.ai\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "RunAPI",
      "websiteUrl": "https://runapi.co",
      "apiKeyUrl": "https://runapi.co/register?aff=iOKB",
      "category": "aggregator",
      "icon": "runapi",
      "iconColor": "",
      "badge": "partner",
      "configType": "openai",
      "baseUrl": "https://runapi.co/v1",
      "model": "gpt-5.5",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "",
      "models": [],
      "modelCatalog": [],
      "endpointCandidates": [],
      "config": "model_provider = \"custom\"\nmodel = \"gpt-5.5\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"runapi\"\nbase_url = \"https://runapi.co/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "Unity2.ai",
      "websiteUrl": "https://unity2.ai",
      "apiKeyUrl": "https://unity2.ai/register?source=ccs",
      "category": "aggregator",
      "icon": "unity2",
      "iconColor": "",
      "badge": "partner",
      "configType": "openai",
      "baseUrl": "https://api.unity2.ai",
      "model": "gpt-5.5",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "",
      "models": [],
      "modelCatalog": [],
      "endpointCandidates": [
        "https://api.unity2.ai"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"gpt-5.5\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"unity2\"\nbase_url = \"https://api.unity2.ai\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "Shengsuanyun",
      "websiteUrl": "https://www.shengsuanyun.com/?from=CH_4HHXMRYF",
      "apiKeyUrl": "https://www.shengsuanyun.com/?from=CH_4HHXMRYF",
      "category": "aggregator",
      "icon": "shengsuanyun",
      "iconColor": "",
      "badge": "partner",
      "configType": "openai",
      "baseUrl": "https://router.shengsuanyun.com/api/v1",
      "model": "openai/gpt-5.5",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "",
      "models": [],
      "modelCatalog": [],
      "endpointCandidates": [],
      "config": "model_provider = \"custom\"\nmodel = \"openai/gpt-5.5\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"shengsuanyun\"\nbase_url = \"https://router.shengsuanyun.com/api/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "AIGoCode",
      "websiteUrl": "https://aigocode.com",
      "apiKeyUrl": "https://aigocode.com/invite/CC-SWITCH",
      "category": "third_party",
      "icon": "aigocode",
      "iconColor": "#5B7FFF",
      "badge": "partner",
      "configType": "openai",
      "baseUrl": "https://api.aigocode.com",
      "model": "gpt-5.5",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "",
      "models": [],
      "modelCatalog": [],
      "endpointCandidates": [
        "https://api.aigocode.com"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"gpt-5.5\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"aigocode\"\nbase_url = \"https://api.aigocode.com\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "SubRouter",
      "websiteUrl": "https://subrouter.ai",
      "apiKeyUrl": "https://subrouter.ai/register?aff=l3ri",
      "category": "aggregator",
      "icon": "subrouter",
      "iconColor": "",
      "badge": "partner",
      "configType": "openai",
      "baseUrl": "https://subrouter.ai/v1",
      "model": "gpt-5.5",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "",
      "models": [],
      "modelCatalog": [],
      "endpointCandidates": [
        "https://subrouter.ai/v1"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"gpt-5.5\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"subrouter\"\nbase_url = \"https://subrouter.ai/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "APIKEY.FUN",
      "websiteUrl": "https://apikey.fun",
      "apiKeyUrl": "https://apikey.fun/register?aff=CCSwitch",
      "category": "third_party",
      "icon": "apikeyfun",
      "iconColor": "",
      "badge": "partner",
      "configType": "openai",
      "baseUrl": "https://api.apikey.fun/v1",
      "model": "gpt-5.5",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "openai_responses",
      "models": [],
      "modelCatalog": [],
      "endpointCandidates": [
        "https://api.apikey.fun/v1",
        "https://slb.apikey.fun/v1"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"gpt-5.5\"\nreview_model = \"gpt-5.5\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"APIKEY.FUN\"\nbase_url = \"https://api.apikey.fun/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "Code0",
      "websiteUrl": "https://code0.ai",
      "apiKeyUrl": "https://code0.ai/agent/register/B2XHxGjGmRvqgznY",
      "category": "aggregator",
      "icon": "code0",
      "iconColor": "",
      "badge": "partner",
      "configType": "openai",
      "baseUrl": "https://code0.ai/v1",
      "model": "gpt-5.5",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "",
      "models": [],
      "modelCatalog": [],
      "endpointCandidates": [
        "https://code0.ai/v1"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"gpt-5.5\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"code0\"\nbase_url = \"https://code0.ai/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "TeamoRouter",
      "websiteUrl": "https://teamorouter.com",
      "apiKeyUrl": "https://teamorouter.com/?utm_source=cc_switch&utm_medium=referral&utm_campaign=ai_directory",
      "category": "aggregator",
      "icon": "teamorouter",
      "iconColor": "",
      "badge": "partner",
      "configType": "openai",
      "baseUrl": "https://api.teamorouter.com/v1",
      "model": "gpt-5.5",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "",
      "models": [],
      "modelCatalog": [],
      "endpointCandidates": [
        "https://api.teamorouter.com/v1"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"gpt-5.5\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"teamorouter\"\nbase_url = \"https://api.teamorouter.com/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "ClaudeCN",
      "websiteUrl": "https://claudecn.top",
      "apiKeyUrl": "https://claudecn.ai/register?aff=HEL9",
      "category": "third_party",
      "icon": "claudecn",
      "iconColor": "",
      "badge": "partner",
      "configType": "openai",
      "baseUrl": "https://claudecn.top/v1",
      "model": "gpt-5.5",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "",
      "models": [],
      "modelCatalog": [],
      "endpointCandidates": [],
      "config": "model_provider = \"custom\"\nmodel = \"gpt-5.5\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"claudecn\"\nbase_url = \"https://claudecn.top/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "火山Agentplan",
      "websiteUrl": "https://www.volcengine.com/activity/codingplan?ac=MMAP8JTTCAQ2&rc=6J6FV5N2&utm_campaign=hw&utm_content=ccswitch&utm_medium=devrel_tool_web&utm_source=OWO&utm_term=ccswitch",
      "apiKeyUrl": "https://www.volcengine.com/activity/codingplan?ac=MMAP8JTTCAQ2&rc=6J6FV5N2&utm_campaign=hw&utm_content=ccswitch&utm_medium=devrel_tool_web&utm_source=OWO&utm_term=ccswitch",
      "category": "cn_official",
      "icon": "huoshan",
      "iconColor": "#3370FF",
      "badge": "partner",
      "configType": "openai",
      "baseUrl": "https://ark.cn-beijing.volces.com/api/coding/v3",
      "model": "ark-code-latest",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "openai_chat",
      "models": [
        "ark-code-latest"
      ],
      "modelCatalog": [
        {
          "model": "ark-code-latest",
          "displayName": "Ark Code Latest",
          "contextWindow": 256000
        }
      ],
      "endpointCandidates": [
        "https://ark.cn-beijing.volces.com/api/coding/v3"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"ark-code-latest\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"ark_agentplan\"\nbase_url = \"https://ark.cn-beijing.volces.com/api/coding/v3\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "BytePlus",
      "websiteUrl": "https://www.byteplus.com/en/product/modelark?utm_campaign=hw&utm_content=ccswitch&utm_medium=devrel_tool_web&utm_source=OWO&utm_term=ccswitch",
      "apiKeyUrl": "https://www.byteplus.com/en/product/modelark?utm_campaign=hw&utm_content=ccswitch&utm_medium=devrel_tool_web&utm_source=OWO&utm_term=ccswitch",
      "category": "cn_official",
      "icon": "byteplus",
      "iconColor": "#3370FF",
      "badge": "partner",
      "configType": "openai",
      "baseUrl": "https://ark.ap-southeast.bytepluses.com/api/coding/v3",
      "model": "ark-code-latest",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "openai_chat",
      "models": [
        "ark-code-latest"
      ],
      "modelCatalog": [
        {
          "model": "ark-code-latest",
          "displayName": "Ark Code Latest",
          "contextWindow": 256000
        }
      ],
      "endpointCandidates": [
        "https://ark.ap-southeast.bytepluses.com/api/coding/v3"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"ark-code-latest\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"byteplus\"\nbase_url = \"https://ark.ap-southeast.bytepluses.com/api/coding/v3\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "DouBaoSeed",
      "websiteUrl": "https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey?apikey=%7B%7D&utm_campaign=hw&utm_content=ccswitch&utm_medium=devrel_tool_web&utm_source=OWO&utm_term=ccswitch",
      "apiKeyUrl": "https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey?apikey=%7B%7D&utm_campaign=hw&utm_content=ccswitch&utm_medium=devrel_tool_web&utm_source=OWO&utm_term=ccswitch",
      "category": "cn_official",
      "icon": "doubao",
      "iconColor": "#3370FF",
      "badge": "partner",
      "configType": "openai",
      "baseUrl": "https://ark.cn-beijing.volces.com/api/v3",
      "model": "doubao-seed-2-1-pro-260628",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "openai_responses",
      "models": [
        "doubao-seed-2-1-pro-260628"
      ],
      "modelCatalog": [
        {
          "model": "doubao-seed-2-1-pro-260628",
          "displayName": "Doubao Seed 2.1 Pro",
          "contextWindow": 262144
        }
      ],
      "endpointCandidates": [
        "https://ark.cn-beijing.volces.com/api/v3"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"doubao-seed-2-1-pro-260628\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"doubaoseed\"\nbase_url = \"https://ark.cn-beijing.volces.com/api/v3\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "SiliconFlow",
      "websiteUrl": "https://siliconflow.cn",
      "apiKeyUrl": "https://cloud.siliconflow.cn/i/YflgU2Ve",
      "category": "aggregator",
      "icon": "siliconflow",
      "iconColor": "#6E29F6",
      "badge": "partner",
      "configType": "openai",
      "baseUrl": "https://api.siliconflow.cn/v1",
      "model": "Pro/MiniMaxAI/MiniMax-M2.7",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "openai_chat",
      "models": [
        "Pro/MiniMaxAI/MiniMax-M2.7"
      ],
      "modelCatalog": [
        {
          "model": "Pro/MiniMaxAI/MiniMax-M2.7",
          "displayName": "Pro / MiniMax M2.7",
          "contextWindow": 200000
        }
      ],
      "endpointCandidates": [
        "https://api.siliconflow.cn/v1"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"Pro/MiniMaxAI/MiniMax-M2.7\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"siliconflow\"\nbase_url = \"https://api.siliconflow.cn/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "SiliconFlow en",
      "websiteUrl": "https://siliconflow.com",
      "apiKeyUrl": "https://cloud.siliconflow.cn/i/YflgU2Ve",
      "category": "aggregator",
      "icon": "siliconflow",
      "iconColor": "#000000",
      "badge": "partner",
      "configType": "openai",
      "baseUrl": "https://api.siliconflow.com/v1",
      "model": "MiniMaxAI/MiniMax-M2.7",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "openai_chat",
      "models": [
        "MiniMaxAI/MiniMax-M2.7"
      ],
      "modelCatalog": [
        {
          "model": "MiniMaxAI/MiniMax-M2.7",
          "displayName": "MiniMax M2.7",
          "contextWindow": 200000
        }
      ],
      "endpointCandidates": [
        "https://api.siliconflow.com/v1"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"MiniMaxAI/MiniMax-M2.7\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"siliconflow_en\"\nbase_url = \"https://api.siliconflow.com/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "NekoCode",
      "websiteUrl": "https://nekocode.ai",
      "apiKeyUrl": "https://nekocode.ai?aff=CCSWITCH",
      "category": "aggregator",
      "icon": "nekocode",
      "iconColor": "",
      "badge": "partner",
      "configType": "openai",
      "baseUrl": "https://nekocode.ai/v1",
      "model": "gpt-5.5",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "",
      "models": [],
      "modelCatalog": [],
      "endpointCandidates": [
        "https://nekocode.ai/v1"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"gpt-5.5\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"nekocode\"\nbase_url = \"https://nekocode.ai/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "AtlasCloud",
      "websiteUrl": "https://www.atlascloud.ai/console/coding-plan",
      "apiKeyUrl": "https://www.atlascloud.ai/console/coding-plan",
      "category": "aggregator",
      "icon": "atlascloud",
      "iconColor": "",
      "badge": "partner",
      "configType": "openai",
      "baseUrl": "https://api.atlascloud.ai/v1",
      "model": "zai-org/glm-5.1",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "openai_chat",
      "models": [
        "zai-org/glm-5.1"
      ],
      "modelCatalog": [
        {
          "model": "zai-org/glm-5.1",
          "displayName": "GLM 5.1",
          "contextWindow": 200000
        }
      ],
      "endpointCandidates": [
        "https://api.atlascloud.ai/v1"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"zai-org/glm-5.1\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"AtlasCloud\"\nbase_url = \"https://api.atlascloud.ai/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "Compshare",
      "websiteUrl": "https://www.compshare.cn",
      "apiKeyUrl": "https://www.compshare.cn/coding-plan?ytag=GPU_YY_YX_git_cc-switch",
      "category": "aggregator",
      "icon": "ucloud",
      "iconColor": "#000000",
      "badge": "partner",
      "configType": "openai",
      "baseUrl": "https://api.modelverse.cn/v1",
      "model": "gpt-5.5",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "",
      "models": [],
      "modelCatalog": [],
      "endpointCandidates": [
        "https://api.modelverse.cn/v1"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"gpt-5.5\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"compshare\"\nbase_url = \"https://api.modelverse.cn/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "Compshare Coding Plan",
      "websiteUrl": "https://www.compshare.cn",
      "apiKeyUrl": "https://www.compshare.cn/coding-plan?ytag=GPU_YY_YX_git_cc-switch",
      "category": "aggregator",
      "icon": "ucloud",
      "iconColor": "#000000",
      "badge": "partner",
      "configType": "openai",
      "baseUrl": "https://cp.compshare.cn/v1",
      "model": "gpt-5.5",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "",
      "models": [],
      "modelCatalog": [],
      "endpointCandidates": [
        "https://cp.compshare.cn/v1"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"gpt-5.5\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"compshare_coding\"\nbase_url = \"https://cp.compshare.cn/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "CCSub",
      "websiteUrl": "https://www.ccsub.net",
      "apiKeyUrl": "https://www.ccsub.net/register?ref=Y6Z8DXEA",
      "category": "aggregator",
      "icon": "ccsub",
      "iconColor": "",
      "badge": "partner",
      "configType": "openai",
      "baseUrl": "https://www.ccsub.net/v1",
      "model": "gpt-5.5",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "",
      "models": [],
      "modelCatalog": [],
      "endpointCandidates": [
        "https://www.ccsub.net/v1"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"gpt-5.5\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"ccsub\"\nbase_url = \"https://www.ccsub.net/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "SSSAiCode",
      "websiteUrl": "https://sssaicodeapi.com",
      "apiKeyUrl": "https://sssaicodeapi.com/register?ref=DCP0SM",
      "category": "third_party",
      "icon": "sssaicode",
      "iconColor": "#000000",
      "badge": "partner",
      "configType": "openai",
      "baseUrl": "https://node-hk.sssaicodeapi.com/api/v1",
      "model": "gpt-5.5",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "",
      "models": [],
      "modelCatalog": [],
      "endpointCandidates": [
        "https://node-hk.sssaicodeapi.com/api/v1",
        "https://node-hk.sssaiapi.com/api/v1",
        "https://node-cf.sssaicodeapi.com/api/v1"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"gpt-5.5\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"sssaicode\"\nbase_url = \"https://node-hk.sssaicodeapi.com/api/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "Micu",
      "websiteUrl": "https://www.micuapi.ai",
      "apiKeyUrl": "https://www.micuapi.ai/register?aff=aOYQ",
      "category": "third_party",
      "icon": "micu",
      "iconColor": "#000000",
      "badge": "partner",
      "configType": "openai",
      "baseUrl": "https://www.micuapi.ai/v1",
      "model": "gpt-5.5",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "",
      "models": [],
      "modelCatalog": [],
      "endpointCandidates": [
        "https://www.micuapi.ai/v1"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"gpt-5.5\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"micu\"\nbase_url = \"https://www.micuapi.ai/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "RightCode",
      "websiteUrl": "https://www.right.codes",
      "apiKeyUrl": "https://www.right.codes/register?aff=CCSWITCH",
      "category": "third_party",
      "icon": "rc",
      "iconColor": "#E96B2C",
      "badge": "partner",
      "configType": "openai",
      "baseUrl": "https://right.codes/codex/v1",
      "model": "gpt-5.5",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "",
      "models": [],
      "modelCatalog": [],
      "endpointCandidates": [],
      "config": "model_provider = \"custom\"\nmodel = \"gpt-5.5\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"rightcode\"\nbase_url = \"https://right.codes/codex/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "ETok.ai",
      "websiteUrl": "https://etok.ai",
      "apiKeyUrl": "https://etok.ai",
      "category": "third_party",
      "icon": "etok",
      "iconColor": "#000000",
      "badge": "partner",
      "configType": "openai",
      "baseUrl": "https://api.etok.ai/v1",
      "model": "gpt-5.5",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "",
      "models": [],
      "modelCatalog": [],
      "endpointCandidates": [
        "https://api.etok.ai/v1"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"gpt-5.5\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"etok\"\nbase_url = \"https://api.etok.ai/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "Cubence",
      "websiteUrl": "https://cubence.com",
      "apiKeyUrl": "https://cubence.com/signup?code=CCSWITCH&source=ccs",
      "category": "third_party",
      "icon": "cubence",
      "iconColor": "#000000",
      "badge": "partner",
      "configType": "openai",
      "baseUrl": "https://api.cubence.com/v1",
      "model": "gpt-5.5",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "",
      "models": [],
      "modelCatalog": [],
      "endpointCandidates": [
        "https://api.cubence.com/v1",
        "https://api-cf.cubence.com/v1",
        "https://api-dmit.cubence.com/v1",
        "https://api-bwg.cubence.com/v1"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"gpt-5.5\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"cubence\"\nbase_url = \"https://api.cubence.com/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "CrazyRouter",
      "websiteUrl": "https://www.crazyrouter.com",
      "apiKeyUrl": "https://www.crazyrouter.com/register?aff=OZcm&ref=cc-switch",
      "category": "custom",
      "icon": "crazyrouter",
      "iconColor": "#000000",
      "badge": "partner",
      "configType": "openai",
      "baseUrl": "https://cn.crazyrouter.com/v1",
      "model": "gpt-5.5",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "",
      "models": [],
      "modelCatalog": [],
      "endpointCandidates": [
        "https://cn.crazyrouter.com/v1"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"gpt-5.5\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"crazyrouter\"\nbase_url = \"https://cn.crazyrouter.com/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "DMXAPI",
      "websiteUrl": "https://www.dmxapi.cn",
      "apiKeyUrl": "",
      "category": "aggregator",
      "icon": "",
      "iconColor": "",
      "badge": "partner",
      "configType": "openai",
      "baseUrl": "https://www.dmxapi.cn/v1",
      "model": "gpt-5.5",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "",
      "models": [],
      "modelCatalog": [],
      "endpointCandidates": [
        "https://www.dmxapi.cn/v1"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"gpt-5.5\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"dmxapi\"\nbase_url = \"https://www.dmxapi.cn/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "Qiniu",
      "websiteUrl": "https://s.qiniu.com/nMvAvy",
      "apiKeyUrl": "https://s.qiniu.com/nMvAvy",
      "category": "aggregator",
      "icon": "qiniu",
      "iconColor": "",
      "badge": "partner",
      "configType": "openai",
      "baseUrl": "https://api.qnaigc.com/bypass/openai/v1",
      "model": "gpt-5.5",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "",
      "models": [],
      "modelCatalog": [],
      "endpointCandidates": [
        "https://api.qnaigc.com/bypass/openai/v1",
        "https://api.modelink.ai/bypass/openai/v1"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"gpt-5.5\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"qiniu\"\nbase_url = \"https://api.qnaigc.com/bypass/openai/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "SudoCode.chat",
      "websiteUrl": "https://sudocode.chat",
      "apiKeyUrl": "https://sudocode.chat/register?utm_source=ccswitch&utm_medium=partner",
      "category": "third_party",
      "icon": "sudocode",
      "iconColor": "",
      "badge": "partner",
      "configType": "openai",
      "baseUrl": "https://api.sudocode.chat/v1",
      "model": "gpt-5.6-sol",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "openai_responses",
      "models": [],
      "modelCatalog": [],
      "endpointCandidates": [
        "https://api.sudocode.chat/v1"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"gpt-5.6-sol\"\nreview_model = \"gpt-5.6-sol\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"SudoCode\"\nbase_url = \"https://api.sudocode.chat/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "SudoCode.us",
      "websiteUrl": "https://sudocode.us",
      "apiKeyUrl": "https://sudocode.us",
      "category": "third_party",
      "icon": "sudocode-us",
      "iconColor": "",
      "badge": "partner",
      "configType": "openai",
      "baseUrl": "https://sudocode.us/v1",
      "model": "gpt-5.5",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "openai_responses",
      "models": [],
      "modelCatalog": [],
      "endpointCandidates": [
        "https://sudocode.us/v1",
        "https://sudocode.run/v1"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"gpt-5.5\"\nreview_model = \"gpt-5.5\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\nmodel_verbosity = \"high\"\n\n[model_providers.custom]\nname = \"sudocode\"\nbase_url = \"https://sudocode.us/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "Amux",
      "websiteUrl": "https://amux.ai",
      "apiKeyUrl": "https://amux.ai",
      "category": "aggregator",
      "icon": "amux",
      "iconColor": "",
      "badge": "",
      "configType": "openai",
      "baseUrl": "https://api.amux.ai/v1",
      "model": "gpt-5.5",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "",
      "models": [],
      "modelCatalog": [],
      "endpointCandidates": [
        "https://api.amux.ai/v1"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"gpt-5.5\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"amux\"\nbase_url = \"https://api.amux.ai/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "Azure OpenAI",
      "websiteUrl": "https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/codex",
      "apiKeyUrl": "",
      "category": "third_party",
      "icon": "azure",
      "iconColor": "#0078D4",
      "badge": "official",
      "configType": "openai",
      "baseUrl": "https://YOUR_RESOURCE_NAME.openai.azure.com/openai",
      "model": "gpt-5.5",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "",
      "models": [],
      "modelCatalog": [],
      "endpointCandidates": [
        "https://YOUR_RESOURCE_NAME.openai.azure.com/openai"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"gpt-5.5\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"Azure OpenAI\"\nbase_url = \"https://YOUR_RESOURCE_NAME.openai.azure.com/openai\"\nenv_key = \"OPENAI_API_KEY\"\nquery_params = { \"api-version\" = \"2025-04-01-preview\" }\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "DeepSeek",
      "websiteUrl": "https://platform.deepseek.com",
      "apiKeyUrl": "https://platform.deepseek.com/api_keys",
      "category": "cn_official",
      "icon": "deepseek",
      "iconColor": "#1E88E5",
      "badge": "",
      "configType": "openai",
      "baseUrl": "https://api.deepseek.com",
      "model": "deepseek-v4-flash",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "openai_chat",
      "models": [
        "deepseek-v4-flash",
        "deepseek-v4-pro"
      ],
      "modelCatalog": [
        {
          "model": "deepseek-v4-flash",
          "displayName": "DeepSeek V4 Flash",
          "contextWindow": 1000000
        },
        {
          "model": "deepseek-v4-pro",
          "displayName": "DeepSeek V4 Pro",
          "contextWindow": 1000000
        }
      ],
      "endpointCandidates": [
        "https://api.deepseek.com"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"deepseek-v4-flash\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"deepseek\"\nbase_url = \"https://api.deepseek.com\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "Zhipu GLM",
      "websiteUrl": "https://open.bigmodel.cn",
      "apiKeyUrl": "https://www.bigmodel.cn/claude-code?ic=RRVJPB5SII",
      "category": "cn_official",
      "icon": "zhipu",
      "iconColor": "#0F62FE",
      "badge": "",
      "configType": "openai",
      "baseUrl": "https://open.bigmodel.cn/api/coding/paas/v4",
      "model": "glm-5.2",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "openai_chat",
      "models": [
        "glm-5.2"
      ],
      "modelCatalog": [
        {
          "model": "glm-5.2",
          "displayName": "GLM-5.2",
          "contextWindow": 200000
        }
      ],
      "endpointCandidates": [
        "https://open.bigmodel.cn/api/coding/paas/v4"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"glm-5.2\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"zhipu_glm\"\nbase_url = \"https://open.bigmodel.cn/api/coding/paas/v4\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "Zhipu GLM en",
      "websiteUrl": "https://z.ai",
      "apiKeyUrl": "https://z.ai/subscribe?ic=8JVLJQFSKB",
      "category": "cn_official",
      "icon": "zhipu",
      "iconColor": "#0F62FE",
      "badge": "",
      "configType": "openai",
      "baseUrl": "https://api.z.ai/api/coding/paas/v4",
      "model": "glm-5.2",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "openai_chat",
      "models": [
        "glm-5.2"
      ],
      "modelCatalog": [
        {
          "model": "glm-5.2",
          "displayName": "GLM-5.2",
          "contextWindow": 200000
        }
      ],
      "endpointCandidates": [
        "https://api.z.ai/api/coding/paas/v4"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"glm-5.2\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"zhipu_glm_en\"\nbase_url = \"https://api.z.ai/api/coding/paas/v4\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "Baidu Qianfan Coding Plan",
      "websiteUrl": "https://cloud.baidu.com/product/qianfan_modelbuilder",
      "apiKeyUrl": "https://console.bce.baidu.com/qianfan/ais/console/applicationConsole/application",
      "category": "cn_official",
      "icon": "baidu",
      "iconColor": "#2932E1",
      "badge": "",
      "configType": "openai",
      "baseUrl": "https://qianfan.baidubce.com/v2/coding",
      "model": "qianfan-code-latest",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "openai_chat",
      "models": [
        "qianfan-code-latest"
      ],
      "modelCatalog": [
        {
          "model": "qianfan-code-latest",
          "displayName": "Qianfan Code Latest",
          "contextWindow": 131072
        }
      ],
      "endpointCandidates": [
        "https://qianfan.baidubce.com/v2/coding"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"qianfan-code-latest\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"qianfan_coding\"\nbase_url = \"https://qianfan.baidubce.com/v2/coding\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "Bailian",
      "websiteUrl": "https://bailian.console.aliyun.com",
      "apiKeyUrl": "https://bailian.console.aliyun.com/#/api-key",
      "category": "cn_official",
      "icon": "bailian",
      "iconColor": "#624AFF",
      "badge": "",
      "configType": "openai",
      "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
      "model": "qwen3-coder-plus",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "openai_responses",
      "models": [
        "qwen3-coder-plus"
      ],
      "modelCatalog": [
        {
          "model": "qwen3-coder-plus",
          "displayName": "Qwen3 Coder Plus",
          "contextWindow": 1048576
        }
      ],
      "endpointCandidates": [
        "https://dashscope.aliyuncs.com/compatible-mode/v1"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"qwen3-coder-plus\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"bailian\"\nbase_url = \"https://dashscope.aliyuncs.com/compatible-mode/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "StepFun",
      "websiteUrl": "https://platform.stepfun.com/step-plan",
      "apiKeyUrl": "https://platform.stepfun.com/interface-key",
      "category": "cn_official",
      "icon": "stepfun",
      "iconColor": "#16D6D2",
      "badge": "",
      "configType": "openai",
      "baseUrl": "https://api.stepfun.com/step_plan/v1",
      "model": "step-3.7-flash",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "openai_chat",
      "models": [
        "step-3.7-flash",
        "step-3.5-flash-2603",
        "step-3.5-flash"
      ],
      "modelCatalog": [
        {
          "model": "step-3.7-flash",
          "displayName": "Step 3.7 Flash",
          "contextWindow": 262144
        },
        {
          "model": "step-3.5-flash-2603",
          "displayName": "Step 3.5 Flash 2603",
          "contextWindow": 262144
        },
        {
          "model": "step-3.5-flash",
          "displayName": "Step 3.5 Flash",
          "contextWindow": 262144
        }
      ],
      "endpointCandidates": [
        "https://api.stepfun.com/step_plan/v1"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"step-3.7-flash\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"stepfun\"\nbase_url = \"https://api.stepfun.com/step_plan/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "StepFun en",
      "websiteUrl": "https://platform.stepfun.ai/step-plan",
      "apiKeyUrl": "https://platform.stepfun.ai/interface-key",
      "category": "cn_official",
      "icon": "stepfun",
      "iconColor": "#16D6D2",
      "badge": "",
      "configType": "openai",
      "baseUrl": "https://api.stepfun.ai/step_plan/v1",
      "model": "step-3.7-flash",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "openai_chat",
      "models": [
        "step-3.7-flash",
        "step-3.5-flash-2603",
        "step-3.5-flash"
      ],
      "modelCatalog": [
        {
          "model": "step-3.7-flash",
          "displayName": "Step 3.7 Flash",
          "contextWindow": 262144
        },
        {
          "model": "step-3.5-flash-2603",
          "displayName": "Step 3.5 Flash 2603",
          "contextWindow": 262144
        },
        {
          "model": "step-3.5-flash",
          "displayName": "Step 3.5 Flash",
          "contextWindow": 262144
        }
      ],
      "endpointCandidates": [
        "https://api.stepfun.ai/step_plan/v1"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"step-3.7-flash\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"stepfun_en\"\nbase_url = \"https://api.stepfun.ai/step_plan/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "ModelScope",
      "websiteUrl": "https://modelscope.cn",
      "apiKeyUrl": "https://modelscope.cn/my/myaccesstoken",
      "category": "aggregator",
      "icon": "modelscope",
      "iconColor": "#624AFF",
      "badge": "",
      "configType": "openai",
      "baseUrl": "https://api-inference.modelscope.cn/v1",
      "model": "ZhipuAI/GLM-5.1",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "openai_chat",
      "models": [
        "ZhipuAI/GLM-5.1"
      ],
      "modelCatalog": [
        {
          "model": "ZhipuAI/GLM-5.1",
          "displayName": "ZhipuAI / GLM-5.1",
          "contextWindow": 200000
        }
      ],
      "endpointCandidates": [
        "https://api-inference.modelscope.cn/v1"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"ZhipuAI/GLM-5.1\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"modelscope\"\nbase_url = \"https://api-inference.modelscope.cn/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "Longcat",
      "websiteUrl": "https://longcat.chat/platform",
      "apiKeyUrl": "https://longcat.chat/platform/api_keys",
      "category": "cn_official",
      "icon": "longcat",
      "iconColor": "#29E154",
      "badge": "",
      "configType": "openai",
      "baseUrl": "https://api.longcat.chat/openai/v1",
      "model": "LongCat-2.0",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "openai_responses",
      "models": [
        "LongCat-2.0"
      ],
      "modelCatalog": [
        {
          "model": "LongCat-2.0",
          "displayName": "LongCat 2.0",
          "contextWindow": 1048576
        }
      ],
      "endpointCandidates": [
        "https://api.longcat.chat/openai/v1"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"LongCat-2.0\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"longcat\"\nbase_url = \"https://api.longcat.chat/openai/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "MiniMax",
      "websiteUrl": "https://platform.minimaxi.com",
      "apiKeyUrl": "https://platform.minimaxi.com/subscribe/coding-plan",
      "category": "cn_official",
      "icon": "minimax",
      "iconColor": "#FF6B6B",
      "badge": "",
      "configType": "openai",
      "baseUrl": "https://api.minimaxi.com/v1",
      "model": "MiniMax-M3",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "openai_responses",
      "models": [
        "MiniMax-M3"
      ],
      "modelCatalog": [
        {
          "model": "MiniMax-M3",
          "displayName": "MiniMax-M3",
          "contextWindow": 1000000,
          "supportsParallelToolCalls": true,
          "inputModalities": [
            "text",
            "image"
          ],
          "baseInstructions": "You are Codex, a coding agent based on MiniMax-M3. You and the user share the same workspace and collaborate to achieve the user's goals."
        }
      ],
      "endpointCandidates": [
        "https://api.minimaxi.com/v1"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"MiniMax-M3\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"minimax\"\nbase_url = \"https://api.minimaxi.com/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "MiniMax en",
      "websiteUrl": "https://platform.minimax.io",
      "apiKeyUrl": "https://platform.minimax.io/subscribe/coding-plan",
      "category": "cn_official",
      "icon": "minimax",
      "iconColor": "#FF6B6B",
      "badge": "",
      "configType": "openai",
      "baseUrl": "https://api.minimax.io/v1",
      "model": "MiniMax-M3",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "openai_responses",
      "models": [
        "MiniMax-M3"
      ],
      "modelCatalog": [
        {
          "model": "MiniMax-M3",
          "displayName": "MiniMax-M3",
          "contextWindow": 1000000,
          "supportsParallelToolCalls": true,
          "inputModalities": [
            "text",
            "image"
          ],
          "baseInstructions": "You are Codex, a coding agent based on MiniMax-M3. You and the user share the same workspace and collaborate to achieve the user's goals."
        }
      ],
      "endpointCandidates": [
        "https://api.minimax.io/v1"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"MiniMax-M3\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"minimax_en\"\nbase_url = \"https://api.minimax.io/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "BaiLing",
      "websiteUrl": "https://alipaytbox.yuque.com/sxs0ba/ling/get_started",
      "apiKeyUrl": "https://ling.tbox.cn/open",
      "category": "cn_official",
      "icon": "",
      "iconColor": "",
      "badge": "",
      "configType": "openai",
      "baseUrl": "https://api.tbox.cn/api/llm/v1",
      "model": "Ling-2.6-1T",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "openai_chat",
      "models": [
        "Ling-2.6-1T"
      ],
      "modelCatalog": [
        {
          "model": "Ling-2.6-1T",
          "displayName": "Ling-2.6-1T",
          "contextWindow": 262144
        }
      ],
      "endpointCandidates": [
        "https://api.tbox.cn/api/llm/v1"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"Ling-2.6-1T\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"bailing\"\nbase_url = \"https://api.tbox.cn/api/llm/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "Xiaomi MiMo",
      "websiteUrl": "https://platform.xiaomimimo.com",
      "apiKeyUrl": "https://platform.xiaomimimo.com/#/console/api-keys",
      "category": "cn_official",
      "icon": "xiaomimimo",
      "iconColor": "#000000",
      "badge": "",
      "configType": "openai",
      "baseUrl": "https://api.xiaomimimo.com/v1",
      "model": "mimo-v2.5-pro",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "openai_responses",
      "models": [
        "mimo-v2.5-pro",
        "mimo-v2.5"
      ],
      "modelCatalog": [
        {
          "model": "mimo-v2.5-pro",
          "displayName": "MiMo V2.5 Pro",
          "contextWindow": 1048576,
          "inputModalities": [
            "text"
          ],
          "baseInstructions": "You are MiMo, an AI assistant developed by Xiaomi. Today's date: {date} {week}. Your knowledge cutoff date is December 2024."
        },
        {
          "model": "mimo-v2.5",
          "displayName": "MiMo V2.5",
          "contextWindow": 1048576,
          "inputModalities": [
            "text",
            "image"
          ],
          "baseInstructions": "You are MiMo, an AI assistant developed by Xiaomi. Today's date: {date} {week}. Your knowledge cutoff date is December 2024."
        }
      ],
      "endpointCandidates": [
        "https://api.xiaomimimo.com/v1"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"mimo-v2.5-pro\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"xiaomi_mimo\"\nbase_url = \"https://api.xiaomimimo.com/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "Xiaomi MiMo Token Plan (China)",
      "websiteUrl": "https://platform.xiaomimimo.com/#/token-plan",
      "apiKeyUrl": "https://platform.xiaomimimo.com/#/console/plan-manage",
      "category": "cn_official",
      "icon": "xiaomimimo",
      "iconColor": "#000000",
      "badge": "",
      "configType": "openai",
      "baseUrl": "https://token-plan-cn.xiaomimimo.com/v1",
      "model": "mimo-v2.5-pro",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "openai_responses",
      "models": [
        "mimo-v2.5-pro",
        "mimo-v2.5"
      ],
      "modelCatalog": [
        {
          "model": "mimo-v2.5-pro",
          "displayName": "MiMo V2.5 Pro",
          "contextWindow": 1048576,
          "inputModalities": [
            "text"
          ],
          "baseInstructions": "You are MiMo, an AI assistant developed by Xiaomi. Today's date: {date} {week}. Your knowledge cutoff date is December 2024."
        },
        {
          "model": "mimo-v2.5",
          "displayName": "MiMo V2.5",
          "contextWindow": 1048576,
          "inputModalities": [
            "text",
            "image"
          ],
          "baseInstructions": "You are MiMo, an AI assistant developed by Xiaomi. Today's date: {date} {week}. Your knowledge cutoff date is December 2024."
        }
      ],
      "endpointCandidates": [
        "https://token-plan-cn.xiaomimimo.com/v1"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"mimo-v2.5-pro\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"xiaomi_mimo_token_plan\"\nbase_url = \"https://token-plan-cn.xiaomimimo.com/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "Novita AI",
      "websiteUrl": "https://novita.ai",
      "apiKeyUrl": "https://novita.ai",
      "category": "aggregator",
      "icon": "novita",
      "iconColor": "#000000",
      "badge": "",
      "configType": "openai",
      "baseUrl": "https://api.novita.ai/openai/v1",
      "model": "zai-org/glm-5.1",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "openai_chat",
      "models": [
        "zai-org/glm-5.1"
      ],
      "modelCatalog": [
        {
          "model": "zai-org/glm-5.1",
          "displayName": "GLM-5.1",
          "contextWindow": 202800
        }
      ],
      "endpointCandidates": [
        "https://api.novita.ai/openai/v1"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"zai-org/glm-5.1\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"novita\"\nbase_url = \"https://api.novita.ai/openai/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "xAI (Grok)",
      "websiteUrl": "https://x.ai/api",
      "apiKeyUrl": "https://console.x.ai",
      "category": "third_party",
      "icon": "xai",
      "iconColor": "#000000",
      "badge": "",
      "configType": "openai",
      "baseUrl": "https://api.x.ai/v1",
      "model": "grok-4.5",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "openai_responses",
      "models": [
        "grok-4.5"
      ],
      "modelCatalog": [
        {
          "model": "grok-4.5",
          "displayName": "Grok 4.5",
          "contextWindow": 500000,
          "supportsParallelToolCalls": true,
          "inputModalities": [
            "text",
            "image"
          ]
        }
      ],
      "endpointCandidates": [
        "https://api.x.ai/v1"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"grok-4.5\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"xai\"\nbase_url = \"https://api.x.ai/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "xAI (Grok) OAuth",
      "websiteUrl": "https://x.ai/grok",
      "apiKeyUrl": "",
      "category": "third_party",
      "icon": "xai",
      "iconColor": "#000000",
      "badge": "",
      "configType": "openai",
      "baseUrl": "https://api.x.ai/v1",
      "model": "grok-4.5",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "openai_responses",
      "models": [
        "grok-4.5"
      ],
      "modelCatalog": [
        {
          "model": "grok-4.5",
          "displayName": "Grok 4.5",
          "contextWindow": 500000,
          "supportsParallelToolCalls": true,
          "inputModalities": [
            "text",
            "image"
          ]
        }
      ],
      "endpointCandidates": [],
      "config": "model_provider = \"custom\"\nmodel = \"grok-4.5\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"xai\"\nbase_url = \"https://api.x.ai/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "Nvidia",
      "websiteUrl": "https://build.nvidia.com",
      "apiKeyUrl": "https://build.nvidia.com/settings/api-keys",
      "category": "aggregator",
      "icon": "nvidia",
      "iconColor": "#000000",
      "badge": "",
      "configType": "openai",
      "baseUrl": "https://integrate.api.nvidia.com/v1",
      "model": "moonshotai/kimi-k2.5",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "openai_chat",
      "models": [
        "moonshotai/kimi-k2.5"
      ],
      "modelCatalog": [
        {
          "model": "moonshotai/kimi-k2.5",
          "displayName": "Kimi K2.5",
          "contextWindow": 262144
        }
      ],
      "endpointCandidates": [
        "https://integrate.api.nvidia.com/v1"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"moonshotai/kimi-k2.5\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"nvidia\"\nbase_url = \"https://integrate.api.nvidia.com/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "OpenCode Go",
      "websiteUrl": "https://opencode.ai/go",
      "apiKeyUrl": "https://opencode.ai/go?ref=2YTRG2NGTX",
      "category": "third_party",
      "icon": "opencode",
      "iconColor": "#211E1E",
      "badge": "",
      "configType": "openai",
      "baseUrl": "https://opencode.ai/zen/go/v1",
      "model": "glm-5.2",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "openai_chat",
      "models": [
        "glm-5.2",
        "glm-5.1",
        "kimi-k2.7-code",
        "deepseek-v4-pro",
        "deepseek-v4-flash",
        "mimo-v2.5-pro"
      ],
      "modelCatalog": [
        {
          "model": "glm-5.2",
          "displayName": "GLM 5.2",
          "contextWindow": 204800
        },
        {
          "model": "glm-5.1",
          "displayName": "GLM 5.1",
          "contextWindow": 204800
        },
        {
          "model": "kimi-k2.7-code",
          "displayName": "Kimi K2.7 Code",
          "contextWindow": 262144
        },
        {
          "model": "deepseek-v4-pro",
          "displayName": "DeepSeek V4 Pro"
        },
        {
          "model": "deepseek-v4-flash",
          "displayName": "DeepSeek V4 Flash"
        },
        {
          "model": "mimo-v2.5-pro",
          "displayName": "MiMo V2.5 Pro",
          "contextWindow": 1048576
        }
      ],
      "endpointCandidates": [
        "https://opencode.ai/zen/go/v1"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"glm-5.2\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"opencode_go\"\nbase_url = \"https://opencode.ai/zen/go/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "AiHubMix",
      "websiteUrl": "https://aihubmix.com",
      "apiKeyUrl": "",
      "category": "aggregator",
      "icon": "aihubmix",
      "iconColor": "#006FFB",
      "badge": "",
      "configType": "openai",
      "baseUrl": "https://aihubmix.com/v1",
      "model": "gpt-5.5",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "",
      "models": [],
      "modelCatalog": [],
      "endpointCandidates": [
        "https://aihubmix.com/v1",
        "https://api.aihubmix.com/v1"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"gpt-5.5\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"aihubmix\"\nbase_url = \"https://aihubmix.com/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "CherryIN",
      "websiteUrl": "https://open.cherryin.ai",
      "apiKeyUrl": "https://open.cherryin.ai/console/token",
      "category": "aggregator",
      "icon": "cherryin",
      "iconColor": "",
      "badge": "",
      "configType": "openai",
      "baseUrl": "https://open.cherryin.net/v1",
      "model": "openai/gpt-5.5",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "",
      "models": [],
      "modelCatalog": [],
      "endpointCandidates": [
        "https://open.cherryin.net/v1"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"openai/gpt-5.5\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"cherryin\"\nbase_url = \"https://open.cherryin.net/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "RelaxyCode",
      "websiteUrl": "https://www.relaxycode.com",
      "apiKeyUrl": "https://www.relaxycode.com/register",
      "category": "third_party",
      "icon": "relaxcode",
      "iconColor": "",
      "badge": "",
      "configType": "openai",
      "baseUrl": "https://www.relaxycode.com/v1",
      "model": "gpt-5.5",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "",
      "models": [],
      "modelCatalog": [],
      "endpointCandidates": [],
      "config": "model_provider = \"custom\"\nmodel = \"gpt-5.5\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"relaxycode\"\nbase_url = \"https://www.relaxycode.com/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "E-FlowCode",
      "websiteUrl": "https://e-flowcode.cc",
      "apiKeyUrl": "https://e-flowcode.cc",
      "category": "third_party",
      "icon": "eflowcode",
      "iconColor": "#000000",
      "badge": "",
      "configType": "openai",
      "baseUrl": "https://e-flowcode.cc/v1",
      "model": "gpt-5.5",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "",
      "models": [],
      "modelCatalog": [],
      "endpointCandidates": [
        "https://e-flowcode.cc/v1"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"gpt-5.5\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\npersonality = \"pragmatic\"\n\n[model_providers.custom]\nname = \"E-FlowCode\"\nbase_url = \"https://e-flowcode.cc/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true\nmodel_context_window = 1000000\nmodel_auto_compact_token_limit = 9000000",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "PIPELLM",
      "websiteUrl": "https://code.pipellm.ai",
      "apiKeyUrl": "https://code.pipellm.ai/login?ref=uvw650za",
      "category": "aggregator",
      "icon": "pipellm",
      "iconColor": "",
      "badge": "",
      "configType": "openai",
      "baseUrl": "https://cc-api.pipellm.ai/v1",
      "model": "gpt-5.5",
      "reasoningEffort": "medium",
      "wireApi": "responses",
      "apiFormat": "",
      "models": [],
      "modelCatalog": [],
      "endpointCandidates": [
        "https://cc-api.pipellm.ai/v1"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"gpt-5.5\"\nmodel_reasoning_effort = \"medium\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"PIPELLM\"\nwire_api = \"responses\"\nrequires_openai_auth = true\nbase_url = \"https://cc-api.pipellm.ai/v1\"",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "OpenRouter",
      "websiteUrl": "https://openrouter.ai",
      "apiKeyUrl": "https://openrouter.ai/keys",
      "category": "aggregator",
      "icon": "openrouter",
      "iconColor": "#6566F1",
      "badge": "",
      "configType": "openai",
      "baseUrl": "https://openrouter.ai/api/v1",
      "model": "gpt-5.5",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "",
      "models": [],
      "modelCatalog": [],
      "endpointCandidates": [],
      "config": "model_provider = \"custom\"\nmodel = \"gpt-5.5\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"openrouter\"\nbase_url = \"https://openrouter.ai/api/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    },
    {
      "name": "TheRouter",
      "websiteUrl": "https://therouter.ai",
      "apiKeyUrl": "https://dashboard.therouter.ai",
      "category": "aggregator",
      "icon": "",
      "iconColor": "",
      "badge": "",
      "configType": "openai",
      "baseUrl": "https://api.therouter.ai/v1",
      "model": "openai/gpt-5.3-codex",
      "reasoningEffort": "high",
      "wireApi": "responses",
      "apiFormat": "",
      "models": [],
      "modelCatalog": [],
      "endpointCandidates": [
        "https://api.therouter.ai/v1"
      ],
      "config": "model_provider = \"custom\"\nmodel = \"openai/gpt-5.3-codex\"\nmodel_reasoning_effort = \"high\"\ndisable_response_storage = true\n\n[model_providers.custom]\nname = \"therouter\"\nbase_url = \"https://api.therouter.ai/v1\"\nwire_api = \"responses\"\nrequires_openai_auth = true",
      "authData": {
        "OPENAI_API_KEY": ""
      }
    }
  ],
  "claude": [
    {
      "name": "Claude Official",
      "websiteUrl": "https://www.anthropic.com/claude-code",
      "apiKeyUrl": "",
      "category": "official",
      "icon": "anthropic",
      "iconColor": "#D4915D",
      "badge": "official",
      "configType": "anthropic",
      "baseUrl": "",
      "model": "",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {}
      }
    },
    {
      "name": "Kimi",
      "websiteUrl": "https://platform.kimi.com?aff=cc-switch",
      "apiKeyUrl": "",
      "category": "cn_official",
      "icon": "kimi",
      "iconColor": "#6366F1",
      "badge": "prime",
      "configType": "anthropic",
      "baseUrl": "https://api.moonshot.cn/anthropic",
      "model": "kimi-k2.7-code",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://api.moonshot.cn/anthropic",
          "ANTHROPIC_AUTH_TOKEN": "",
          "ANTHROPIC_MODEL": "kimi-k2.7-code",
          "ANTHROPIC_DEFAULT_HAIKU_MODEL": "kimi-k2.7-code",
          "ANTHROPIC_DEFAULT_SONNET_MODEL": "kimi-k2.7-code",
          "ANTHROPIC_DEFAULT_OPUS_MODEL": "kimi-k2.7-code"
        }
      }
    },
    {
      "name": "Kimi For Coding",
      "websiteUrl": "https://www.kimi.com/code/?aff=cc-switch",
      "apiKeyUrl": "",
      "category": "cn_official",
      "icon": "kimi",
      "iconColor": "#6366F1",
      "badge": "prime",
      "configType": "anthropic",
      "baseUrl": "https://api.kimi.com/coding/",
      "model": "kimi-for-coding",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://api.kimi.com/coding/",
          "ANTHROPIC_AUTH_TOKEN": "",
          "ANTHROPIC_MODEL": "kimi-for-coding",
          "ANTHROPIC_DEFAULT_HAIKU_MODEL": "kimi-for-coding",
          "ANTHROPIC_DEFAULT_SONNET_MODEL": "kimi-for-coding",
          "ANTHROPIC_DEFAULT_OPUS_MODEL": "kimi-for-coding",
          "CLAUDE_CODE_MAX_CONTEXT_TOKENS": "262144",
          "CLAUDE_CODE_AUTO_COMPACT_WINDOW": "262144"
        }
      }
    },
    {
      "name": "PackyCode",
      "websiteUrl": "https://www.packyapi.com",
      "apiKeyUrl": "https://www.packyapi.com/register?aff=cc-switch",
      "category": "third_party",
      "icon": "packycode",
      "iconColor": "",
      "badge": "partner",
      "configType": "anthropic",
      "baseUrl": "https://www.packyapi.com",
      "model": "",
      "endpointCandidates": [
        "https://www.packyapi.com",
        "https://api-slb.packyapi.com"
      ],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://www.packyapi.com",
          "ANTHROPIC_AUTH_TOKEN": ""
        }
      }
    },
    {
      "name": "ZetaAPI",
      "websiteUrl": "https://zetaapi.ai",
      "apiKeyUrl": "https://zetaapi.ai/go/u117",
      "category": "aggregator",
      "icon": "zetaapi",
      "iconColor": "",
      "badge": "partner",
      "configType": "anthropic",
      "baseUrl": "https://api.zetaapi.ai",
      "model": "",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://api.zetaapi.ai",
          "ANTHROPIC_AUTH_TOKEN": ""
        }
      }
    },
    {
      "name": "APINebula",
      "websiteUrl": "https://apinebula.com",
      "apiKeyUrl": "https://apinebula.com/VjM74M",
      "category": "third_party",
      "icon": "apinebula",
      "iconColor": "",
      "badge": "partner",
      "configType": "anthropic",
      "baseUrl": "https://apinebula.com",
      "model": "",
      "endpointCandidates": [
        "https://apinebula.com"
      ],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://apinebula.com",
          "ANTHROPIC_AUTH_TOKEN": "",
          "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
        }
      }
    },
    {
      "name": "AICodeMirror",
      "websiteUrl": "https://www.aicodemirror.com",
      "apiKeyUrl": "https://www.aicodemirror.com/register?invitecode=9915W3",
      "category": "third_party",
      "icon": "aicodemirror",
      "iconColor": "#000000",
      "badge": "partner",
      "configType": "anthropic",
      "baseUrl": "https://api.aicodemirror.com/api/claudecode",
      "model": "",
      "endpointCandidates": [
        "https://api.aicodemirror.com/api/claudecode",
        "https://api.claudecode.net.cn/api/claudecode"
      ],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://api.aicodemirror.com/api/claudecode",
          "ANTHROPIC_AUTH_TOKEN": ""
        }
      }
    },
    {
      "name": "PatewayAI",
      "websiteUrl": "https://pateway.ai",
      "apiKeyUrl": "https://pateway.ai/?ch=etzpm8&aff=WB6M6F67#/",
      "category": "third_party",
      "icon": "pateway",
      "iconColor": "",
      "badge": "partner",
      "configType": "anthropic",
      "baseUrl": "https://api.pateway.ai",
      "model": "",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://api.pateway.ai",
          "ANTHROPIC_API_KEY": ""
        }
      }
    },
    {
      "name": "FennoAI",
      "websiteUrl": "https://api.fenno.ai",
      "apiKeyUrl": "https://api.fenno.ai/register?redirect=/purchase?tab=subscription%26group=16&aff=P9MR3D3PLCNL",
      "category": "aggregator",
      "icon": "fenno",
      "iconColor": "",
      "badge": "partner",
      "configType": "anthropic",
      "baseUrl": "https://api.fenno.ai",
      "model": "",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://api.fenno.ai",
          "ANTHROPIC_AUTH_TOKEN": ""
        }
      }
    },
    {
      "name": "RunAPI",
      "websiteUrl": "https://runapi.co",
      "apiKeyUrl": "https://runapi.co/register?aff=iOKB",
      "category": "aggregator",
      "icon": "runapi",
      "iconColor": "",
      "badge": "partner",
      "configType": "anthropic",
      "baseUrl": "https://runapi.co",
      "model": "",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://runapi.co",
          "ANTHROPIC_AUTH_TOKEN": ""
        }
      }
    },
    {
      "name": "Unity2.ai",
      "websiteUrl": "https://unity2.ai",
      "apiKeyUrl": "https://unity2.ai/register?source=ccs",
      "category": "aggregator",
      "icon": "unity2",
      "iconColor": "",
      "badge": "partner",
      "configType": "anthropic",
      "baseUrl": "https://api.unity2.ai",
      "model": "",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://api.unity2.ai",
          "ANTHROPIC_AUTH_TOKEN": ""
        }
      }
    },
    {
      "name": "Shengsuanyun",
      "websiteUrl": "https://www.shengsuanyun.com/?from=CH_4HHXMRYF",
      "apiKeyUrl": "https://www.shengsuanyun.com/?from=CH_4HHXMRYF",
      "category": "aggregator",
      "icon": "shengsuanyun",
      "iconColor": "",
      "badge": "partner",
      "configType": "anthropic",
      "baseUrl": "https://router.shengsuanyun.com/api",
      "model": "anthropic/claude-sonnet-5",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://router.shengsuanyun.com/api",
          "ANTHROPIC_AUTH_TOKEN": "",
          "ANTHROPIC_MODEL": "anthropic/claude-sonnet-5",
          "ANTHROPIC_DEFAULT_HAIKU_MODEL": "anthropic/claude-haiku-4.5",
          "ANTHROPIC_DEFAULT_SONNET_MODEL": "anthropic/claude-sonnet-5",
          "ANTHROPIC_DEFAULT_OPUS_MODEL": "anthropic/claude-opus-4.8"
        }
      }
    },
    {
      "name": "AIGoCode",
      "websiteUrl": "https://aigocode.com",
      "apiKeyUrl": "https://aigocode.com/invite/CC-SWITCH",
      "category": "third_party",
      "icon": "aigocode",
      "iconColor": "#5B7FFF",
      "badge": "partner",
      "configType": "anthropic",
      "baseUrl": "https://api.aigocode.com",
      "model": "",
      "endpointCandidates": [
        "https://api.aigocode.com"
      ],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://api.aigocode.com",
          "ANTHROPIC_AUTH_TOKEN": ""
        }
      }
    },
    {
      "name": "SubRouter",
      "websiteUrl": "https://subrouter.ai",
      "apiKeyUrl": "https://subrouter.ai/register?aff=l3ri",
      "category": "aggregator",
      "icon": "subrouter",
      "iconColor": "",
      "badge": "partner",
      "configType": "anthropic",
      "baseUrl": "https://subrouter.ai",
      "model": "",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://subrouter.ai",
          "ANTHROPIC_AUTH_TOKEN": ""
        }
      }
    },
    {
      "name": "APIKEY.FUN",
      "websiteUrl": "https://apikey.fun",
      "apiKeyUrl": "https://apikey.fun/register?aff=CCSwitch",
      "category": "third_party",
      "icon": "apikeyfun",
      "iconColor": "",
      "badge": "partner",
      "configType": "anthropic",
      "baseUrl": "https://api.apikey.fun",
      "model": "",
      "endpointCandidates": [
        "https://api.apikey.fun",
        "https://slb.apikey.fun"
      ],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://api.apikey.fun",
          "ANTHROPIC_AUTH_TOKEN": "",
          "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
        }
      }
    },
    {
      "name": "ClaudeAPI",
      "websiteUrl": "https://claudeapi.com",
      "apiKeyUrl": "https://console.claudeapi.com/register?aff=pCLD",
      "category": "aggregator",
      "icon": "claudeapi",
      "iconColor": "",
      "badge": "partner",
      "configType": "anthropic",
      "baseUrl": "https://gw.claudeapi.com",
      "model": "",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://gw.claudeapi.com",
          "ANTHROPIC_AUTH_TOKEN": ""
        }
      }
    },
    {
      "name": "Code0",
      "websiteUrl": "https://code0.ai",
      "apiKeyUrl": "https://code0.ai/agent/register/B2XHxGjGmRvqgznY",
      "category": "aggregator",
      "icon": "code0",
      "iconColor": "",
      "badge": "partner",
      "configType": "anthropic",
      "baseUrl": "https://code0.ai",
      "model": "",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://code0.ai",
          "ANTHROPIC_AUTH_TOKEN": ""
        }
      }
    },
    {
      "name": "TeamoRouter",
      "websiteUrl": "https://teamorouter.com",
      "apiKeyUrl": "https://teamorouter.com/?utm_source=cc_switch&utm_medium=referral&utm_campaign=ai_directory",
      "category": "aggregator",
      "icon": "teamorouter",
      "iconColor": "",
      "badge": "partner",
      "configType": "anthropic",
      "baseUrl": "https://api.teamorouter.com",
      "model": "",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://api.teamorouter.com",
          "ANTHROPIC_AUTH_TOKEN": ""
        }
      }
    },
    {
      "name": "ClaudeCN",
      "websiteUrl": "https://claudecn.top",
      "apiKeyUrl": "https://claudecn.ai/register?aff=HEL9",
      "category": "third_party",
      "icon": "claudecn",
      "iconColor": "",
      "badge": "partner",
      "configType": "anthropic",
      "baseUrl": "https://claudecn.top",
      "model": "",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://claudecn.top",
          "ANTHROPIC_AUTH_TOKEN": ""
        }
      }
    },
    {
      "name": "火山Agentplan",
      "websiteUrl": "https://www.volcengine.com/activity/codingplan?ac=MMAP8JTTCAQ2&rc=6J6FV5N2&utm_campaign=hw&utm_content=ccswitch&utm_medium=devrel_tool_web&utm_source=OWO&utm_term=ccswitch",
      "apiKeyUrl": "https://www.volcengine.com/activity/codingplan?ac=MMAP8JTTCAQ2&rc=6J6FV5N2&utm_campaign=hw&utm_content=ccswitch&utm_medium=devrel_tool_web&utm_source=OWO&utm_term=ccswitch",
      "category": "cn_official",
      "icon": "huoshan",
      "iconColor": "#3370FF",
      "badge": "partner",
      "configType": "anthropic",
      "baseUrl": "https://ark.cn-beijing.volces.com/api/coding",
      "model": "ark-code-latest",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://ark.cn-beijing.volces.com/api/coding",
          "ANTHROPIC_AUTH_TOKEN": "",
          "ANTHROPIC_MODEL": "ark-code-latest",
          "ANTHROPIC_DEFAULT_HAIKU_MODEL": "ark-code-latest",
          "ANTHROPIC_DEFAULT_SONNET_MODEL": "ark-code-latest",
          "ANTHROPIC_DEFAULT_OPUS_MODEL": "ark-code-latest"
        }
      }
    },
    {
      "name": "BytePlus",
      "websiteUrl": "https://www.byteplus.com/en/product/modelark?utm_campaign=hw&utm_content=ccswitch&utm_medium=devrel_tool_web&utm_source=OWO&utm_term=ccswitch",
      "apiKeyUrl": "https://www.byteplus.com/en/product/modelark?utm_campaign=hw&utm_content=ccswitch&utm_medium=devrel_tool_web&utm_source=OWO&utm_term=ccswitch",
      "category": "cn_official",
      "icon": "byteplus",
      "iconColor": "#3370FF",
      "badge": "partner",
      "configType": "anthropic",
      "baseUrl": "https://ark.ap-southeast.bytepluses.com/api/coding",
      "model": "ark-code-latest",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://ark.ap-southeast.bytepluses.com/api/coding",
          "ANTHROPIC_AUTH_TOKEN": "",
          "ANTHROPIC_MODEL": "ark-code-latest",
          "ANTHROPIC_DEFAULT_HAIKU_MODEL": "ark-code-latest",
          "ANTHROPIC_DEFAULT_SONNET_MODEL": "ark-code-latest",
          "ANTHROPIC_DEFAULT_OPUS_MODEL": "ark-code-latest"
        }
      }
    },
    {
      "name": "DouBaoSeed",
      "websiteUrl": "https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey?apikey=%7B%7D&utm_campaign=hw&utm_content=ccswitch&utm_medium=devrel_tool_web&utm_source=OWO&utm_term=ccswitch",
      "apiKeyUrl": "https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey?apikey=%7B%7D&utm_campaign=hw&utm_content=ccswitch&utm_medium=devrel_tool_web&utm_source=OWO&utm_term=ccswitch",
      "category": "cn_official",
      "icon": "doubao",
      "iconColor": "#3370FF",
      "badge": "partner",
      "configType": "anthropic",
      "baseUrl": "https://ark.cn-beijing.volces.com/api/compatible",
      "model": "doubao-seed-2-1-pro-260628",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://ark.cn-beijing.volces.com/api/compatible",
          "ANTHROPIC_AUTH_TOKEN": "",
          "API_TIMEOUT_MS": "3000000",
          "ANTHROPIC_MODEL": "doubao-seed-2-1-pro-260628",
          "ANTHROPIC_DEFAULT_SONNET_MODEL": "doubao-seed-2-1-pro-260628",
          "ANTHROPIC_DEFAULT_OPUS_MODEL": "doubao-seed-2-1-pro-260628",
          "ANTHROPIC_DEFAULT_HAIKU_MODEL": "doubao-seed-2-1-pro-260628"
        }
      }
    },
    {
      "name": "SiliconFlow",
      "websiteUrl": "https://siliconflow.cn",
      "apiKeyUrl": "https://cloud.siliconflow.cn/i/YflgU2Ve",
      "category": "aggregator",
      "icon": "siliconflow",
      "iconColor": "#6E29F6",
      "badge": "partner",
      "configType": "anthropic",
      "baseUrl": "https://api.siliconflow.cn",
      "model": "Pro/MiniMaxAI/MiniMax-M2.7",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://api.siliconflow.cn",
          "ANTHROPIC_AUTH_TOKEN": "",
          "ANTHROPIC_MODEL": "Pro/MiniMaxAI/MiniMax-M2.7",
          "ANTHROPIC_DEFAULT_HAIKU_MODEL": "Pro/MiniMaxAI/MiniMax-M2.7",
          "ANTHROPIC_DEFAULT_SONNET_MODEL": "Pro/MiniMaxAI/MiniMax-M2.7",
          "ANTHROPIC_DEFAULT_OPUS_MODEL": "Pro/MiniMaxAI/MiniMax-M2.7"
        }
      }
    },
    {
      "name": "SiliconFlow en",
      "websiteUrl": "https://siliconflow.com",
      "apiKeyUrl": "https://cloud.siliconflow.cn/i/YflgU2Ve",
      "category": "aggregator",
      "icon": "siliconflow",
      "iconColor": "#000000",
      "badge": "partner",
      "configType": "anthropic",
      "baseUrl": "https://api.siliconflow.com",
      "model": "MiniMaxAI/MiniMax-M2.7",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://api.siliconflow.com",
          "ANTHROPIC_AUTH_TOKEN": "",
          "ANTHROPIC_MODEL": "MiniMaxAI/MiniMax-M2.7",
          "ANTHROPIC_DEFAULT_HAIKU_MODEL": "MiniMaxAI/MiniMax-M2.7",
          "ANTHROPIC_DEFAULT_SONNET_MODEL": "MiniMaxAI/MiniMax-M2.7",
          "ANTHROPIC_DEFAULT_OPUS_MODEL": "MiniMaxAI/MiniMax-M2.7"
        }
      }
    },
    {
      "name": "NekoCode",
      "websiteUrl": "https://nekocode.ai",
      "apiKeyUrl": "https://nekocode.ai?aff=CCSWITCH",
      "category": "aggregator",
      "icon": "nekocode",
      "iconColor": "",
      "badge": "partner",
      "configType": "anthropic",
      "baseUrl": "https://nekocode.ai",
      "model": "",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://nekocode.ai",
          "ANTHROPIC_AUTH_TOKEN": ""
        }
      }
    },
    {
      "name": "AtlasCloud",
      "websiteUrl": "https://www.atlascloud.ai/console/coding-plan",
      "apiKeyUrl": "https://www.atlascloud.ai/console/coding-plan",
      "category": "aggregator",
      "icon": "atlascloud",
      "iconColor": "",
      "badge": "partner",
      "configType": "anthropic",
      "baseUrl": "https://api.atlascloud.ai",
      "model": "zai-org/glm-5.1",
      "endpointCandidates": [
        "https://api.atlascloud.ai"
      ],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://api.atlascloud.ai",
          "ANTHROPIC_AUTH_TOKEN": "",
          "ANTHROPIC_MODEL": "zai-org/glm-5.1",
          "ANTHROPIC_DEFAULT_HAIKU_MODEL": "zai-org/glm-5.1",
          "ANTHROPIC_DEFAULT_SONNET_MODEL": "zai-org/glm-5.1",
          "ANTHROPIC_DEFAULT_OPUS_MODEL": "zai-org/glm-5.1",
          "CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS": "1"
        }
      }
    },
    {
      "name": "Compshare",
      "websiteUrl": "https://www.compshare.cn",
      "apiKeyUrl": "https://www.compshare.cn/coding-plan?ytag=GPU_YY_YX_git_cc-switch",
      "category": "aggregator",
      "icon": "ucloud",
      "iconColor": "#000000",
      "badge": "partner",
      "configType": "anthropic",
      "baseUrl": "https://api.modelverse.cn",
      "model": "",
      "endpointCandidates": [
        "https://api.modelverse.cn"
      ],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://api.modelverse.cn",
          "ANTHROPIC_AUTH_TOKEN": ""
        }
      }
    },
    {
      "name": "Compshare Coding Plan",
      "websiteUrl": "https://www.compshare.cn",
      "apiKeyUrl": "https://www.compshare.cn/coding-plan?ytag=GPU_YY_YX_git_cc-switch",
      "category": "aggregator",
      "icon": "ucloud",
      "iconColor": "#000000",
      "badge": "partner",
      "configType": "anthropic",
      "baseUrl": "https://cp.compshare.cn",
      "model": "",
      "endpointCandidates": [
        "https://cp.compshare.cn"
      ],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://cp.compshare.cn",
          "ANTHROPIC_AUTH_TOKEN": ""
        }
      }
    },
    {
      "name": "CCSub",
      "websiteUrl": "https://www.ccsub.net",
      "apiKeyUrl": "https://www.ccsub.net/register?ref=Y6Z8DXEA",
      "category": "aggregator",
      "icon": "ccsub",
      "iconColor": "",
      "badge": "partner",
      "configType": "anthropic",
      "baseUrl": "https://www.ccsub.net",
      "model": "",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://www.ccsub.net",
          "ANTHROPIC_AUTH_TOKEN": ""
        }
      }
    },
    {
      "name": "SSSAiCode",
      "websiteUrl": "https://sssaicodeapi.com",
      "apiKeyUrl": "https://sssaicodeapi.com/register?ref=DCP0SM",
      "category": "third_party",
      "icon": "sssaicode",
      "iconColor": "#000000",
      "badge": "partner",
      "configType": "anthropic",
      "baseUrl": "https://node-hk.sssaicodeapi.com/api",
      "model": "",
      "endpointCandidates": [
        "https://node-hk.sssaicodeapi.com/api",
        "https://node-hk.sssaiapi.com/api",
        "https://node-cf.sssaicodeapi.com/api"
      ],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://node-hk.sssaicodeapi.com/api",
          "ANTHROPIC_AUTH_TOKEN": ""
        }
      }
    },
    {
      "name": "Micu",
      "websiteUrl": "https://www.micuapi.ai",
      "apiKeyUrl": "https://www.micuapi.ai/register?aff=aOYQ",
      "category": "third_party",
      "icon": "micu",
      "iconColor": "#000000",
      "badge": "partner",
      "configType": "anthropic",
      "baseUrl": "https://www.micuapi.ai",
      "model": "",
      "endpointCandidates": [
        "https://www.micuapi.ai"
      ],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://www.micuapi.ai",
          "ANTHROPIC_AUTH_TOKEN": ""
        }
      }
    },
    {
      "name": "RightCode",
      "websiteUrl": "https://www.right.codes",
      "apiKeyUrl": "https://www.right.codes/register?aff=CCSWITCH",
      "category": "third_party",
      "icon": "rc",
      "iconColor": "#E96B2C",
      "badge": "partner",
      "configType": "anthropic",
      "baseUrl": "https://www.right.codes/claude",
      "model": "",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://www.right.codes/claude",
          "ANTHROPIC_AUTH_TOKEN": ""
        }
      }
    },
    {
      "name": "ETok.ai",
      "websiteUrl": "https://etok.ai",
      "apiKeyUrl": "https://etok.ai",
      "category": "third_party",
      "icon": "etok",
      "iconColor": "#000000",
      "badge": "partner",
      "configType": "anthropic",
      "baseUrl": "https://api.etok.ai",
      "model": "",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://api.etok.ai",
          "ANTHROPIC_AUTH_TOKEN": ""
        }
      }
    },
    {
      "name": "Cubence",
      "websiteUrl": "https://cubence.com",
      "apiKeyUrl": "https://cubence.com/signup?code=CCSWITCH&source=ccs",
      "category": "third_party",
      "icon": "cubence",
      "iconColor": "#000000",
      "badge": "partner",
      "configType": "anthropic",
      "baseUrl": "https://api.cubence.com",
      "model": "",
      "endpointCandidates": [
        "https://api.cubence.com",
        "https://api-cf.cubence.com",
        "https://api-dmit.cubence.com",
        "https://api-bwg.cubence.com"
      ],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://api.cubence.com",
          "ANTHROPIC_AUTH_TOKEN": ""
        }
      }
    },
    {
      "name": "CrazyRouter",
      "websiteUrl": "https://www.crazyrouter.com",
      "apiKeyUrl": "https://www.crazyrouter.com/register?aff=OZcm&ref=cc-switch",
      "category": "third_party",
      "icon": "crazyrouter",
      "iconColor": "#000000",
      "badge": "partner",
      "configType": "anthropic",
      "baseUrl": "https://cn.crazyrouter.com",
      "model": "",
      "endpointCandidates": [
        "https://cn.crazyrouter.com"
      ],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://cn.crazyrouter.com",
          "ANTHROPIC_AUTH_TOKEN": ""
        }
      }
    },
    {
      "name": "DMXAPI",
      "websiteUrl": "https://www.dmxapi.cn",
      "apiKeyUrl": "https://www.dmxapi.cn",
      "category": "aggregator",
      "icon": "",
      "iconColor": "",
      "badge": "partner",
      "configType": "anthropic",
      "baseUrl": "https://www.dmxapi.cn",
      "model": "",
      "endpointCandidates": [
        "https://www.dmxapi.cn",
        "https://api.dmxapi.cn"
      ],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://www.dmxapi.cn",
          "ANTHROPIC_AUTH_TOKEN": ""
        }
      }
    },
    {
      "name": "Qiniu",
      "websiteUrl": "https://s.qiniu.com/nMvAvy",
      "apiKeyUrl": "https://s.qiniu.com/nMvAvy",
      "category": "aggregator",
      "icon": "qiniu",
      "iconColor": "",
      "badge": "partner",
      "configType": "anthropic",
      "baseUrl": "https://api.qnaigc.com",
      "model": "",
      "endpointCandidates": [
        "https://api.qnaigc.com",
        "https://api.modelink.ai"
      ],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://api.qnaigc.com",
          "ANTHROPIC_AUTH_TOKEN": ""
        }
      }
    },
    {
      "name": "SudoCode.chat",
      "websiteUrl": "https://sudocode.chat",
      "apiKeyUrl": "https://sudocode.chat/register?utm_source=ccswitch&utm_medium=partner",
      "category": "third_party",
      "icon": "sudocode",
      "iconColor": "",
      "badge": "partner",
      "configType": "anthropic",
      "baseUrl": "https://api.sudocode.chat",
      "model": "",
      "endpointCandidates": [
        "https://api.sudocode.chat"
      ],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://api.sudocode.chat",
          "ANTHROPIC_AUTH_TOKEN": "",
          "API_TIMEOUT_MS": "300000"
        }
      }
    },
    {
      "name": "SudoCode.us",
      "websiteUrl": "https://sudocode.us",
      "apiKeyUrl": "https://sudocode.us",
      "category": "third_party",
      "icon": "sudocode-us",
      "iconColor": "",
      "badge": "partner",
      "configType": "anthropic",
      "baseUrl": "https://sudocode.us",
      "model": "",
      "endpointCandidates": [
        "https://sudocode.us",
        "https://sudocode.run"
      ],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://sudocode.us",
          "ANTHROPIC_AUTH_TOKEN": "",
          "API_TIMEOUT_MS": "300000"
        }
      }
    },
    {
      "name": "Amux",
      "websiteUrl": "https://amux.ai",
      "apiKeyUrl": "https://amux.ai",
      "category": "aggregator",
      "icon": "amux",
      "iconColor": "",
      "badge": "",
      "configType": "anthropic",
      "baseUrl": "https://api.amux.ai",
      "model": "",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://api.amux.ai",
          "ANTHROPIC_AUTH_TOKEN": ""
        }
      }
    },
    {
      "name": "Gemini Native",
      "websiteUrl": "https://ai.google.dev/gemini-api",
      "apiKeyUrl": "https://aistudio.google.com/app/apikey",
      "category": "third_party",
      "icon": "gemini",
      "iconColor": "#4285F4",
      "badge": "",
      "configType": "anthropic",
      "baseUrl": "https://generativelanguage.googleapis.com",
      "model": "gemini-3.5-flash",
      "endpointCandidates": [
        "https://generativelanguage.googleapis.com"
      ],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://generativelanguage.googleapis.com",
          "ANTHROPIC_API_KEY": "",
          "ANTHROPIC_MODEL": "gemini-3.5-flash",
          "ANTHROPIC_DEFAULT_HAIKU_MODEL": "gemini-3.5-flash",
          "ANTHROPIC_DEFAULT_SONNET_MODEL": "gemini-3.5-flash",
          "ANTHROPIC_DEFAULT_OPUS_MODEL": "gemini-3.5-flash"
        }
      }
    },
    {
      "name": "DeepSeek",
      "websiteUrl": "https://platform.deepseek.com",
      "apiKeyUrl": "",
      "category": "cn_official",
      "icon": "deepseek",
      "iconColor": "#1E88E5",
      "badge": "",
      "configType": "anthropic",
      "baseUrl": "https://api.deepseek.com/anthropic",
      "model": "deepseek-v4-pro",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://api.deepseek.com/anthropic",
          "ANTHROPIC_AUTH_TOKEN": "",
          "ANTHROPIC_MODEL": "deepseek-v4-pro",
          "ANTHROPIC_DEFAULT_HAIKU_MODEL": "deepseek-v4-flash",
          "ANTHROPIC_DEFAULT_SONNET_MODEL": "deepseek-v4-pro",
          "ANTHROPIC_DEFAULT_OPUS_MODEL": "deepseek-v4-pro"
        }
      }
    },
    {
      "name": "OpenCode Go",
      "websiteUrl": "https://opencode.ai/go",
      "apiKeyUrl": "https://opencode.ai/go?ref=2YTRG2NGTX",
      "category": "third_party",
      "icon": "opencode",
      "iconColor": "#211E1E",
      "badge": "",
      "configType": "anthropic",
      "baseUrl": "https://opencode.ai/zen/go",
      "model": "deepseek-v4-flash",
      "endpointCandidates": [
        "https://opencode.ai/zen/go"
      ],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://opencode.ai/zen/go",
          "ANTHROPIC_AUTH_TOKEN": "",
          "ANTHROPIC_MODEL": "deepseek-v4-flash",
          "ANTHROPIC_DEFAULT_HAIKU_MODEL": "deepseek-v4-flash",
          "ANTHROPIC_DEFAULT_SONNET_MODEL": "deepseek-v4-flash",
          "ANTHROPIC_DEFAULT_OPUS_MODEL": "deepseek-v4-flash"
        }
      }
    },
    {
      "name": "Zhipu GLM",
      "websiteUrl": "https://open.bigmodel.cn",
      "apiKeyUrl": "https://www.bigmodel.cn/claude-code?ic=RRVJPB5SII",
      "category": "cn_official",
      "icon": "zhipu",
      "iconColor": "#0F62FE",
      "badge": "",
      "configType": "anthropic",
      "baseUrl": "https://open.bigmodel.cn/api/anthropic",
      "model": "glm-5.1",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://open.bigmodel.cn/api/anthropic",
          "ANTHROPIC_AUTH_TOKEN": "",
          "ANTHROPIC_MODEL": "glm-5.1",
          "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-5.1",
          "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-5.1",
          "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-5.1"
        }
      }
    },
    {
      "name": "Zhipu GLM en",
      "websiteUrl": "https://z.ai",
      "apiKeyUrl": "https://z.ai/subscribe?ic=8JVLJQFSKB",
      "category": "cn_official",
      "icon": "zhipu",
      "iconColor": "#0F62FE",
      "badge": "",
      "configType": "anthropic",
      "baseUrl": "https://api.z.ai/api/anthropic",
      "model": "glm-5.1",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://api.z.ai/api/anthropic",
          "ANTHROPIC_AUTH_TOKEN": "",
          "ANTHROPIC_MODEL": "glm-5.1",
          "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-5.1",
          "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-5.1",
          "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-5.1"
        }
      }
    },
    {
      "name": "Baidu Qianfan Coding Plan",
      "websiteUrl": "https://cloud.baidu.com/product/qianfan_modelbuilder",
      "apiKeyUrl": "https://console.bce.baidu.com/qianfan/ais/console/applicationConsole/application",
      "category": "cn_official",
      "icon": "baidu",
      "iconColor": "#2932E1",
      "badge": "",
      "configType": "anthropic",
      "baseUrl": "https://qianfan.baidubce.com/anthropic/coding",
      "model": "qianfan-code-latest",
      "endpointCandidates": [
        "https://qianfan.baidubce.com/anthropic/coding"
      ],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://qianfan.baidubce.com/anthropic/coding",
          "ANTHROPIC_AUTH_TOKEN": "",
          "ANTHROPIC_MODEL": "qianfan-code-latest",
          "ANTHROPIC_DEFAULT_HAIKU_MODEL": "qianfan-code-latest",
          "ANTHROPIC_DEFAULT_SONNET_MODEL": "qianfan-code-latest",
          "ANTHROPIC_DEFAULT_OPUS_MODEL": "qianfan-code-latest"
        }
      }
    },
    {
      "name": "Bailian",
      "websiteUrl": "https://bailian.console.aliyun.com",
      "apiKeyUrl": "",
      "category": "cn_official",
      "icon": "bailian",
      "iconColor": "#624AFF",
      "badge": "",
      "configType": "anthropic",
      "baseUrl": "https://dashscope.aliyuncs.com/apps/anthropic",
      "model": "",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://dashscope.aliyuncs.com/apps/anthropic",
          "ANTHROPIC_AUTH_TOKEN": ""
        }
      }
    },
    {
      "name": "Bailian For Coding",
      "websiteUrl": "https://bailian.console.aliyun.com",
      "apiKeyUrl": "",
      "category": "cn_official",
      "icon": "bailian",
      "iconColor": "#624AFF",
      "badge": "",
      "configType": "anthropic",
      "baseUrl": "https://coding.dashscope.aliyuncs.com/apps/anthropic",
      "model": "",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://coding.dashscope.aliyuncs.com/apps/anthropic",
          "ANTHROPIC_AUTH_TOKEN": ""
        }
      }
    },
    {
      "name": "StepFun",
      "websiteUrl": "https://platform.stepfun.com/step-plan",
      "apiKeyUrl": "https://platform.stepfun.com/interface-key",
      "category": "cn_official",
      "icon": "stepfun",
      "iconColor": "#16D6D2",
      "badge": "",
      "configType": "anthropic",
      "baseUrl": "https://api.stepfun.com/step_plan",
      "model": "step-3.5-flash-2603",
      "endpointCandidates": [
        "https://api.stepfun.com/step_plan"
      ],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://api.stepfun.com/step_plan",
          "ANTHROPIC_AUTH_TOKEN": "",
          "ANTHROPIC_MODEL": "step-3.5-flash-2603",
          "ANTHROPIC_DEFAULT_HAIKU_MODEL": "step-3.5-flash-2603",
          "ANTHROPIC_DEFAULT_SONNET_MODEL": "step-3.5-flash-2603",
          "ANTHROPIC_DEFAULT_OPUS_MODEL": "step-3.5-flash-2603"
        }
      }
    },
    {
      "name": "StepFun en",
      "websiteUrl": "https://platform.stepfun.ai/step-plan",
      "apiKeyUrl": "https://platform.stepfun.ai/interface-key",
      "category": "cn_official",
      "icon": "stepfun",
      "iconColor": "#16D6D2",
      "badge": "",
      "configType": "anthropic",
      "baseUrl": "https://api.stepfun.ai/step_plan",
      "model": "step-3.5-flash-2603",
      "endpointCandidates": [
        "https://api.stepfun.ai/step_plan"
      ],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://api.stepfun.ai/step_plan",
          "ANTHROPIC_AUTH_TOKEN": "",
          "ANTHROPIC_MODEL": "step-3.5-flash-2603",
          "ANTHROPIC_DEFAULT_HAIKU_MODEL": "step-3.5-flash-2603",
          "ANTHROPIC_DEFAULT_SONNET_MODEL": "step-3.5-flash-2603",
          "ANTHROPIC_DEFAULT_OPUS_MODEL": "step-3.5-flash-2603"
        }
      }
    },
    {
      "name": "ModelScope",
      "websiteUrl": "https://modelscope.cn",
      "apiKeyUrl": "",
      "category": "aggregator",
      "icon": "modelscope",
      "iconColor": "#624AFF",
      "badge": "",
      "configType": "anthropic",
      "baseUrl": "https://api-inference.modelscope.cn",
      "model": "ZhipuAI/GLM-5.1",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://api-inference.modelscope.cn",
          "ANTHROPIC_AUTH_TOKEN": "",
          "ANTHROPIC_MODEL": "ZhipuAI/GLM-5.1",
          "ANTHROPIC_DEFAULT_HAIKU_MODEL": "ZhipuAI/GLM-5.1",
          "ANTHROPIC_DEFAULT_SONNET_MODEL": "ZhipuAI/GLM-5.1",
          "ANTHROPIC_DEFAULT_OPUS_MODEL": "ZhipuAI/GLM-5.1"
        }
      }
    },
    {
      "name": "KAT-Coder",
      "websiteUrl": "https://console.streamlake.ai",
      "apiKeyUrl": "https://console.streamlake.ai/console/api-key",
      "category": "cn_official",
      "icon": "catcoder",
      "iconColor": "",
      "badge": "",
      "configType": "anthropic",
      "baseUrl": "https://vanchin.streamlake.ai/api/gateway/v1/endpoints/${ENDPOINT_ID}/claude-code-proxy",
      "model": "KAT-Coder-Pro V1",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://vanchin.streamlake.ai/api/gateway/v1/endpoints/${ENDPOINT_ID}/claude-code-proxy",
          "ANTHROPIC_AUTH_TOKEN": "",
          "ANTHROPIC_MODEL": "KAT-Coder-Pro V1",
          "ANTHROPIC_DEFAULT_HAIKU_MODEL": "KAT-Coder-Air V1",
          "ANTHROPIC_DEFAULT_SONNET_MODEL": "KAT-Coder-Pro V1",
          "ANTHROPIC_DEFAULT_OPUS_MODEL": "KAT-Coder-Pro V1"
        }
      }
    },
    {
      "name": "Longcat",
      "websiteUrl": "https://longcat.chat/platform",
      "apiKeyUrl": "https://longcat.chat/platform/api_keys",
      "category": "cn_official",
      "icon": "longcat",
      "iconColor": "#29E154",
      "badge": "",
      "configType": "anthropic",
      "baseUrl": "https://api.longcat.chat/anthropic",
      "model": "LongCat-2.0",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://api.longcat.chat/anthropic",
          "ANTHROPIC_AUTH_TOKEN": "",
          "ANTHROPIC_MODEL": "LongCat-2.0",
          "ANTHROPIC_SMALL_FAST_MODEL": "LongCat-2.0",
          "ANTHROPIC_DEFAULT_HAIKU_MODEL": "LongCat-2.0",
          "ANTHROPIC_DEFAULT_SONNET_MODEL": "LongCat-2.0",
          "ANTHROPIC_DEFAULT_OPUS_MODEL": "LongCat-2.0",
          "CLAUDE_CODE_MAX_OUTPUT_TOKENS": "131072",
          "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": 1
        }
      }
    },
    {
      "name": "MiniMax",
      "websiteUrl": "https://platform.minimaxi.com",
      "apiKeyUrl": "https://platform.minimaxi.com/subscribe/coding-plan",
      "category": "cn_official",
      "icon": "minimax",
      "iconColor": "#FF6B6B",
      "badge": "",
      "configType": "anthropic",
      "baseUrl": "https://api.minimaxi.com/anthropic",
      "model": "MiniMax-M2.7",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://api.minimaxi.com/anthropic",
          "ANTHROPIC_AUTH_TOKEN": "",
          "API_TIMEOUT_MS": "3000000",
          "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": 1,
          "ANTHROPIC_MODEL": "MiniMax-M2.7",
          "ANTHROPIC_DEFAULT_SONNET_MODEL": "MiniMax-M2.7",
          "ANTHROPIC_DEFAULT_OPUS_MODEL": "MiniMax-M2.7",
          "ANTHROPIC_DEFAULT_HAIKU_MODEL": "MiniMax-M2.7"
        }
      }
    },
    {
      "name": "MiniMax en",
      "websiteUrl": "https://platform.minimax.io",
      "apiKeyUrl": "https://platform.minimax.io/subscribe/coding-plan",
      "category": "cn_official",
      "icon": "minimax",
      "iconColor": "#FF6B6B",
      "badge": "",
      "configType": "anthropic",
      "baseUrl": "https://api.minimax.io/anthropic",
      "model": "MiniMax-M2.7",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://api.minimax.io/anthropic",
          "ANTHROPIC_AUTH_TOKEN": "",
          "API_TIMEOUT_MS": "3000000",
          "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": 1,
          "ANTHROPIC_MODEL": "MiniMax-M2.7",
          "ANTHROPIC_DEFAULT_SONNET_MODEL": "MiniMax-M2.7",
          "ANTHROPIC_DEFAULT_OPUS_MODEL": "MiniMax-M2.7",
          "ANTHROPIC_DEFAULT_HAIKU_MODEL": "MiniMax-M2.7"
        }
      }
    },
    {
      "name": "BaiLing",
      "websiteUrl": "https://alipaytbox.yuque.com/sxs0ba/ling/get_started",
      "apiKeyUrl": "",
      "category": "cn_official",
      "icon": "",
      "iconColor": "",
      "badge": "",
      "configType": "anthropic",
      "baseUrl": "https://api.tbox.cn/api/anthropic",
      "model": "Ling-2.5-1T",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://api.tbox.cn/api/anthropic",
          "ANTHROPIC_AUTH_TOKEN": "",
          "ANTHROPIC_MODEL": "Ling-2.5-1T",
          "ANTHROPIC_DEFAULT_HAIKU_MODEL": "Ling-2.5-1T",
          "ANTHROPIC_DEFAULT_SONNET_MODEL": "Ling-2.5-1T",
          "ANTHROPIC_DEFAULT_OPUS_MODEL": "Ling-2.5-1T"
        }
      }
    },
    {
      "name": "AiHubMix",
      "websiteUrl": "https://aihubmix.com",
      "apiKeyUrl": "https://aihubmix.com",
      "category": "aggregator",
      "icon": "aihubmix",
      "iconColor": "#006FFB",
      "badge": "",
      "configType": "anthropic",
      "baseUrl": "https://aihubmix.com",
      "model": "",
      "endpointCandidates": [
        "https://aihubmix.com",
        "https://api.aihubmix.com"
      ],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://aihubmix.com",
          "ANTHROPIC_API_KEY": ""
        }
      }
    },
    {
      "name": "CherryIN",
      "websiteUrl": "https://open.cherryin.ai",
      "apiKeyUrl": "https://open.cherryin.ai/console/token",
      "category": "aggregator",
      "icon": "cherryin",
      "iconColor": "",
      "badge": "",
      "configType": "anthropic",
      "baseUrl": "https://open.cherryin.net",
      "model": "anthropic/claude-sonnet-5",
      "endpointCandidates": [
        "https://open.cherryin.net"
      ],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://open.cherryin.net",
          "ANTHROPIC_AUTH_TOKEN": "",
          "ANTHROPIC_MODEL": "anthropic/claude-sonnet-5",
          "ANTHROPIC_DEFAULT_HAIKU_MODEL": "anthropic/claude-haiku-4.5",
          "ANTHROPIC_DEFAULT_SONNET_MODEL": "anthropic/claude-sonnet-5",
          "ANTHROPIC_DEFAULT_OPUS_MODEL": "anthropic/claude-opus-4.8"
        }
      }
    },
    {
      "name": "RelaxyCode",
      "websiteUrl": "https://www.relaxycode.com",
      "apiKeyUrl": "https://www.relaxycode.com/register",
      "category": "third_party",
      "icon": "relaxcode",
      "iconColor": "",
      "badge": "",
      "configType": "anthropic",
      "baseUrl": "https://www.relaxycode.com",
      "model": "",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://www.relaxycode.com",
          "ANTHROPIC_AUTH_TOKEN": ""
        }
      }
    },
    {
      "name": "E-FlowCode",
      "websiteUrl": "https://e-flowcode.cc",
      "apiKeyUrl": "https://e-flowcode.cc",
      "category": "third_party",
      "icon": "eflowcode",
      "iconColor": "#000000",
      "badge": "",
      "configType": "anthropic",
      "baseUrl": "https://e-flowcode.cc",
      "model": "",
      "endpointCandidates": [
        "https://e-flowcode.cc"
      ],
      "settingsConfig": {
        "effortLevel": "high",
        "env": {
          "ANTHROPIC_AUTH_TOKEN": "",
          "ANTHROPIC_BASE_URL": "https://e-flowcode.cc"
        },
        "enabledPlugins": {
          "superpowers@superpowers-marketplace": true
        },
        "includeCoAuthoredBy": false,
        "ENABLE_TOOL_SEARCH": true,
        "skipWebFetchPreflight": true
      }
    },
    {
      "name": "OpenRouter",
      "websiteUrl": "https://openrouter.ai",
      "apiKeyUrl": "https://openrouter.ai/keys",
      "category": "aggregator",
      "icon": "openrouter",
      "iconColor": "#6566F1",
      "badge": "",
      "configType": "anthropic",
      "baseUrl": "https://openrouter.ai/api",
      "model": "anthropic/claude-sonnet-5",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://openrouter.ai/api",
          "ANTHROPIC_AUTH_TOKEN": "",
          "ANTHROPIC_MODEL": "anthropic/claude-sonnet-5",
          "ANTHROPIC_DEFAULT_HAIKU_MODEL": "anthropic/claude-haiku-4.5",
          "ANTHROPIC_DEFAULT_SONNET_MODEL": "anthropic/claude-sonnet-5",
          "ANTHROPIC_DEFAULT_OPUS_MODEL": "anthropic/claude-opus-4.8"
        }
      }
    },
    {
      "name": "TheRouter",
      "websiteUrl": "https://therouter.ai",
      "apiKeyUrl": "https://dashboard.therouter.ai",
      "category": "aggregator",
      "icon": "",
      "iconColor": "",
      "badge": "",
      "configType": "anthropic",
      "baseUrl": "https://api.therouter.ai",
      "model": "anthropic/claude-sonnet-5",
      "endpointCandidates": [
        "https://api.therouter.ai"
      ],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://api.therouter.ai",
          "ANTHROPIC_AUTH_TOKEN": "",
          "ANTHROPIC_API_KEY": "",
          "ANTHROPIC_MODEL": "anthropic/claude-sonnet-5",
          "ANTHROPIC_DEFAULT_HAIKU_MODEL": "anthropic/claude-haiku-4.5",
          "ANTHROPIC_DEFAULT_SONNET_MODEL": "anthropic/claude-sonnet-5",
          "ANTHROPIC_DEFAULT_OPUS_MODEL": "anthropic/claude-opus-4.8"
        }
      }
    },
    {
      "name": "Novita AI",
      "websiteUrl": "https://novita.ai",
      "apiKeyUrl": "https://novita.ai",
      "category": "aggregator",
      "icon": "novita",
      "iconColor": "#000000",
      "badge": "",
      "configType": "anthropic",
      "baseUrl": "https://api.novita.ai/anthropic",
      "model": "zai-org/glm-5.1",
      "endpointCandidates": [
        "https://api.novita.ai/anthropic"
      ],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://api.novita.ai/anthropic",
          "ANTHROPIC_AUTH_TOKEN": "",
          "ANTHROPIC_MODEL": "zai-org/glm-5.1",
          "ANTHROPIC_DEFAULT_HAIKU_MODEL": "zai-org/glm-5.1",
          "ANTHROPIC_DEFAULT_SONNET_MODEL": "zai-org/glm-5.1",
          "ANTHROPIC_DEFAULT_OPUS_MODEL": "zai-org/glm-5.1"
        }
      }
    },
    {
      "name": "GitHub Copilot",
      "websiteUrl": "https://github.com/features/copilot",
      "apiKeyUrl": "",
      "category": "third_party",
      "icon": "github",
      "iconColor": "#000000",
      "badge": "",
      "configType": "anthropic",
      "baseUrl": "https://api.githubcopilot.com",
      "model": "claude-sonnet-5",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://api.githubcopilot.com",
          "ANTHROPIC_MODEL": "claude-sonnet-5",
          "ANTHROPIC_DEFAULT_HAIKU_MODEL": "claude-haiku-4.5",
          "ANTHROPIC_DEFAULT_SONNET_MODEL": "claude-sonnet-5",
          "ANTHROPIC_DEFAULT_OPUS_MODEL": "claude-sonnet-5"
        }
      }
    },
    {
      "name": "Codex",
      "websiteUrl": "https://openai.com/chatgpt/pricing",
      "apiKeyUrl": "",
      "category": "third_party",
      "icon": "openai",
      "iconColor": "#000000",
      "badge": "",
      "configType": "anthropic",
      "baseUrl": "https://chatgpt.com/backend-api/codex",
      "model": "gpt-5.6",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://chatgpt.com/backend-api/codex",
          "ANTHROPIC_MODEL": "gpt-5.6",
          "ANTHROPIC_DEFAULT_HAIKU_MODEL": "gpt-5.6-luna",
          "ANTHROPIC_DEFAULT_SONNET_MODEL": "gpt-5.6",
          "ANTHROPIC_DEFAULT_OPUS_MODEL": "gpt-5.6",
          "CLAUDE_CODE_MAX_CONTEXT_TOKENS": "372000",
          "CLAUDE_CODE_AUTO_COMPACT_WINDOW": "372000"
        }
      }
    },
    {
      "name": "xAI (Grok)",
      "websiteUrl": "https://x.ai/grok",
      "apiKeyUrl": "",
      "category": "third_party",
      "icon": "xai",
      "iconColor": "#000000",
      "badge": "",
      "configType": "anthropic",
      "baseUrl": "https://api.x.ai/v1",
      "model": "grok-4.5",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://api.x.ai/v1",
          "ANTHROPIC_MODEL": "grok-4.5",
          "ANTHROPIC_DEFAULT_HAIKU_MODEL": "grok-4.5",
          "ANTHROPIC_DEFAULT_SONNET_MODEL": "grok-4.5",
          "ANTHROPIC_DEFAULT_OPUS_MODEL": "grok-4.5"
        }
      }
    },
    {
      "name": "Nvidia",
      "websiteUrl": "https://build.nvidia.com",
      "apiKeyUrl": "https://build.nvidia.com/settings/api-keys",
      "category": "aggregator",
      "icon": "nvidia",
      "iconColor": "#000000",
      "badge": "",
      "configType": "anthropic",
      "baseUrl": "https://integrate.api.nvidia.com",
      "model": "moonshotai/kimi-k2.5",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://integrate.api.nvidia.com",
          "ANTHROPIC_AUTH_TOKEN": "",
          "ANTHROPIC_MODEL": "moonshotai/kimi-k2.5",
          "ANTHROPIC_DEFAULT_HAIKU_MODEL": "moonshotai/kimi-k2.5",
          "ANTHROPIC_DEFAULT_SONNET_MODEL": "moonshotai/kimi-k2.5",
          "ANTHROPIC_DEFAULT_OPUS_MODEL": "moonshotai/kimi-k2.5"
        }
      }
    },
    {
      "name": "PIPELLM",
      "websiteUrl": "https://code.pipellm.ai",
      "apiKeyUrl": "https://code.pipellm.ai/login?ref=uvw650za",
      "category": "aggregator",
      "icon": "pipellm",
      "iconColor": "",
      "badge": "",
      "configType": "anthropic",
      "baseUrl": "https://cc-api.pipellm.ai",
      "model": "claude-opus-4-8",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://cc-api.pipellm.ai",
          "ANTHROPIC_AUTH_TOKEN": "",
          "ANTHROPIC_MODEL": "claude-opus-4-8",
          "ANTHROPIC_DEFAULT_HAIKU_MODEL": "claude-haiku-4-5-20251001",
          "ANTHROPIC_DEFAULT_SONNET_MODEL": "claude-sonnet-5",
          "ANTHROPIC_DEFAULT_OPUS_MODEL": "claude-opus-4-8"
        },
        "includeCoAuthoredBy": false
      }
    },
    {
      "name": "Xiaomi MiMo",
      "websiteUrl": "https://platform.xiaomimimo.com",
      "apiKeyUrl": "https://platform.xiaomimimo.com/#/console/api-keys",
      "category": "cn_official",
      "icon": "xiaomimimo",
      "iconColor": "#000000",
      "badge": "",
      "configType": "anthropic",
      "baseUrl": "https://api.xiaomimimo.com/anthropic",
      "model": "mimo-v2.5-pro",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://api.xiaomimimo.com/anthropic",
          "ANTHROPIC_AUTH_TOKEN": "",
          "ANTHROPIC_MODEL": "mimo-v2.5-pro",
          "ANTHROPIC_DEFAULT_HAIKU_MODEL": "mimo-v2.5-pro",
          "ANTHROPIC_DEFAULT_SONNET_MODEL": "mimo-v2.5-pro",
          "ANTHROPIC_DEFAULT_OPUS_MODEL": "mimo-v2.5-pro"
        }
      }
    },
    {
      "name": "Xiaomi MiMo Token Plan (China)",
      "websiteUrl": "https://platform.xiaomimimo.com/#/token-plan",
      "apiKeyUrl": "https://platform.xiaomimimo.com/#/console/plan-manage",
      "category": "cn_official",
      "icon": "xiaomimimo",
      "iconColor": "#000000",
      "badge": "",
      "configType": "anthropic",
      "baseUrl": "https://token-plan-cn.xiaomimimo.com/anthropic",
      "model": "mimo-v2.5-pro",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://token-plan-cn.xiaomimimo.com/anthropic",
          "ANTHROPIC_AUTH_TOKEN": "",
          "ANTHROPIC_MODEL": "mimo-v2.5-pro",
          "ANTHROPIC_DEFAULT_HAIKU_MODEL": "mimo-v2.5-pro",
          "ANTHROPIC_DEFAULT_SONNET_MODEL": "mimo-v2.5-pro",
          "ANTHROPIC_DEFAULT_OPUS_MODEL": "mimo-v2.5-pro"
        }
      }
    },
    {
      "name": "AWS Bedrock (AKSK)",
      "websiteUrl": "https://aws.amazon.com/bedrock/",
      "apiKeyUrl": "",
      "category": "cloud_provider",
      "icon": "aws",
      "iconColor": "#FF9900",
      "badge": "",
      "configType": "anthropic",
      "baseUrl": "https://bedrock-runtime.${AWS_REGION}.amazonaws.com",
      "model": "global.anthropic.claude-opus-4-8",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://bedrock-runtime.${AWS_REGION}.amazonaws.com",
          "AWS_ACCESS_KEY_ID": "${AWS_ACCESS_KEY_ID}",
          "AWS_SECRET_ACCESS_KEY": "${AWS_SECRET_ACCESS_KEY}",
          "AWS_REGION": "${AWS_REGION}",
          "ANTHROPIC_MODEL": "global.anthropic.claude-opus-4-8",
          "ANTHROPIC_DEFAULT_HAIKU_MODEL": "global.anthropic.claude-haiku-4-5-20251001-v1:0",
          "ANTHROPIC_DEFAULT_SONNET_MODEL": "global.anthropic.claude-sonnet-5",
          "ANTHROPIC_DEFAULT_OPUS_MODEL": "global.anthropic.claude-opus-4-8",
          "CLAUDE_CODE_USE_BEDROCK": "1"
        }
      }
    },
    {
      "name": "AWS Bedrock (API Key)",
      "websiteUrl": "https://aws.amazon.com/bedrock/",
      "apiKeyUrl": "",
      "category": "cloud_provider",
      "icon": "aws",
      "iconColor": "#FF9900",
      "badge": "",
      "configType": "anthropic",
      "baseUrl": "https://bedrock-runtime.${AWS_REGION}.amazonaws.com",
      "model": "global.anthropic.claude-opus-4-8",
      "endpointCandidates": [],
      "settingsConfig": {
        "apiKey": "",
        "env": {
          "ANTHROPIC_BASE_URL": "https://bedrock-runtime.${AWS_REGION}.amazonaws.com",
          "AWS_REGION": "${AWS_REGION}",
          "ANTHROPIC_MODEL": "global.anthropic.claude-opus-4-8",
          "ANTHROPIC_DEFAULT_HAIKU_MODEL": "global.anthropic.claude-haiku-4-5-20251001-v1:0",
          "ANTHROPIC_DEFAULT_SONNET_MODEL": "global.anthropic.claude-sonnet-5",
          "ANTHROPIC_DEFAULT_OPUS_MODEL": "global.anthropic.claude-opus-4-8",
          "CLAUDE_CODE_USE_BEDROCK": "1"
        }
      }
    }
  ],
  "openclaw": [
    {
      "name": "Kimi",
      "websiteUrl": "https://platform.kimi.com?aff=cc-switch",
      "apiKeyUrl": "https://platform.kimi.com/console/api-keys?aff=cc-switch",
      "category": "cn_official",
      "icon": "kimi",
      "iconColor": "#6366F1",
      "badge": "prime",
      "configType": "openclaw",
      "apiProtocol": "openai-completions",
      "baseUrl": "https://api.moonshot.cn/v1",
      "model": "kimi-k2.7-code",
      "models": [
        "kimi-k2.7-code",
        "kimi-k3"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://api.moonshot.cn/v1",
        "apiKey": "",
        "api": "openai-completions",
        "models": [
          {
            "id": "kimi-k2.7-code",
            "name": "Kimi K2.7 Code",
            "contextWindow": 262144,
            "cost": {
              "input": 0.95,
              "output": 4,
              "cacheRead": 0.19
            }
          },
          {
            "id": "kimi-k3",
            "name": "Kimi K3",
            "contextWindow": 1048576,
            "cost": {
              "input": 3,
              "output": 15,
              "cacheRead": 0.3,
              "cacheWrite": 0
            }
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "kimi/kimi-k2.7-code"
        },
        "modelCatalog": {
          "kimi/kimi-k2.7-code": {
            "alias": "Kimi"
          }
        }
      }
    },
    {
      "name": "Kimi For Coding",
      "websiteUrl": "https://www.kimi.com/code/?aff=cc-switch",
      "apiKeyUrl": "https://platform.kimi.com/console/api-keys?aff=cc-switch",
      "category": "cn_official",
      "icon": "kimi",
      "iconColor": "#6366F1",
      "badge": "prime",
      "configType": "openclaw",
      "apiProtocol": "openai-completions",
      "baseUrl": "https://api.kimi.com/v1",
      "model": "kimi-for-coding",
      "models": [
        "kimi-for-coding"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://api.kimi.com/v1",
        "apiKey": "",
        "api": "openai-completions",
        "models": [
          {
            "id": "kimi-for-coding",
            "name": "Kimi For Coding",
            "contextWindow": 131072,
            "cost": {
              "input": 0.95,
              "output": 4,
              "cacheRead": 0.19
            }
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "kimi-coding/kimi-for-coding"
        },
        "modelCatalog": {
          "kimi-coding/kimi-for-coding": {
            "alias": "Kimi"
          }
        }
      }
    },
    {
      "name": "PackyCode",
      "websiteUrl": "https://www.packyapi.com",
      "apiKeyUrl": "https://www.packyapi.com/register?aff=cc-switch",
      "category": "third_party",
      "icon": "packycode",
      "iconColor": "",
      "badge": "partner",
      "configType": "openclaw",
      "apiProtocol": "anthropic-messages",
      "baseUrl": "https://www.packyapi.com",
      "model": "claude-opus-4-8",
      "models": [
        "claude-opus-4-8",
        "claude-sonnet-5"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://www.packyapi.com",
        "apiKey": "",
        "api": "anthropic-messages",
        "models": [
          {
            "id": "claude-opus-4-8",
            "name": "Claude Opus 4.8",
            "contextWindow": 1000000,
            "cost": {
              "input": 5,
              "output": 25
            }
          },
          {
            "id": "claude-sonnet-5",
            "name": "Claude Sonnet 5",
            "contextWindow": 1000000,
            "cost": {
              "input": 3,
              "output": 15
            }
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "packycode/claude-opus-4-8",
          "fallbacks": [
            "packycode/claude-sonnet-5"
          ]
        },
        "modelCatalog": {
          "packycode/claude-opus-4-8": {
            "alias": "Opus"
          },
          "packycode/claude-sonnet-5": {
            "alias": "Sonnet"
          }
        }
      }
    },
    {
      "name": "ZetaAPI",
      "websiteUrl": "https://zetaapi.ai",
      "apiKeyUrl": "https://zetaapi.ai/go/u117",
      "category": "aggregator",
      "icon": "zetaapi",
      "iconColor": "",
      "badge": "partner",
      "configType": "openclaw",
      "apiProtocol": "openai-completions",
      "baseUrl": "https://api.zetaapi.ai/v1",
      "model": "gpt-5.5",
      "models": [
        "gpt-5.5"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://api.zetaapi.ai/v1",
        "apiKey": "",
        "api": "openai-completions",
        "models": [
          {
            "id": "gpt-5.5",
            "name": "GPT-5.5",
            "contextWindow": 400000
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "zetaapi/gpt-5.5"
        },
        "modelCatalog": {
          "zetaapi/gpt-5.5": {
            "alias": "GPT-5.5"
          }
        }
      }
    },
    {
      "name": "APINebula",
      "websiteUrl": "https://apinebula.com",
      "apiKeyUrl": "https://apinebula.com/VjM74M",
      "category": "third_party",
      "icon": "apinebula",
      "iconColor": "",
      "badge": "partner",
      "configType": "openclaw",
      "apiProtocol": "openai-completions",
      "baseUrl": "https://apinebula.com/v1",
      "model": "gpt-5.5",
      "models": [
        "gpt-5.5"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://apinebula.com/v1",
        "apiKey": "",
        "api": "openai-completions",
        "models": [
          {
            "id": "gpt-5.5",
            "name": "GPT-5.5"
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "apinebula/gpt-5.5"
        }
      }
    },
    {
      "name": "AICodeMirror",
      "websiteUrl": "https://www.aicodemirror.com",
      "apiKeyUrl": "https://www.aicodemirror.com/register?invitecode=9915W3",
      "category": "third_party",
      "icon": "aicodemirror",
      "iconColor": "#000000",
      "badge": "partner",
      "configType": "openclaw",
      "apiProtocol": "anthropic-messages",
      "baseUrl": "https://api.aicodemirror.com/api/claudecode",
      "model": "claude-opus-4-8",
      "models": [
        "claude-opus-4-8",
        "claude-sonnet-5"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://api.aicodemirror.com/api/claudecode",
        "apiKey": "",
        "api": "anthropic-messages",
        "models": [
          {
            "id": "claude-opus-4-8",
            "name": "Claude Opus 4.8",
            "contextWindow": 1000000,
            "cost": {
              "input": 5,
              "output": 25
            }
          },
          {
            "id": "claude-sonnet-5",
            "name": "Claude Sonnet 5",
            "contextWindow": 1000000,
            "cost": {
              "input": 3,
              "output": 15
            }
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "aicodemirror/claude-opus-4-8",
          "fallbacks": [
            "aicodemirror/claude-sonnet-5"
          ]
        },
        "modelCatalog": {
          "aicodemirror/claude-opus-4-8": {
            "alias": "Opus"
          },
          "aicodemirror/claude-sonnet-5": {
            "alias": "Sonnet"
          }
        }
      }
    },
    {
      "name": "FennoAI",
      "websiteUrl": "https://api.fenno.ai",
      "apiKeyUrl": "https://api.fenno.ai/register?redirect=/purchase?tab=subscription%26group=16&aff=P9MR3D3PLCNL",
      "category": "aggregator",
      "icon": "fenno",
      "iconColor": "",
      "badge": "partner",
      "configType": "openclaw",
      "apiProtocol": "openai-completions",
      "baseUrl": "https://api.fenno.ai/v1",
      "model": "gpt-5.5",
      "models": [
        "gpt-5.5"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://api.fenno.ai/v1",
        "apiKey": "",
        "api": "openai-completions",
        "models": [
          {
            "id": "gpt-5.5",
            "name": "GPT-5.5",
            "contextWindow": 400000
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "fenno/gpt-5.5"
        },
        "modelCatalog": {
          "fenno/gpt-5.5": {
            "alias": "GPT-5.5"
          }
        }
      }
    },
    {
      "name": "RunAPI",
      "websiteUrl": "https://runapi.co",
      "apiKeyUrl": "https://runapi.co/register?aff=iOKB",
      "category": "aggregator",
      "icon": "runapi",
      "iconColor": "",
      "badge": "partner",
      "configType": "openclaw",
      "apiProtocol": "anthropic-messages",
      "baseUrl": "https://runapi.co",
      "model": "claude-opus-4-8",
      "models": [
        "claude-opus-4-8",
        "claude-sonnet-5",
        "claude-haiku-4-5"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://runapi.co",
        "apiKey": "",
        "api": "anthropic-messages",
        "models": [
          {
            "id": "claude-opus-4-8",
            "name": "Claude Opus 4.8",
            "contextWindow": 1000000
          },
          {
            "id": "claude-sonnet-5",
            "name": "Claude Sonnet 5",
            "contextWindow": 1000000
          },
          {
            "id": "claude-haiku-4-5",
            "name": "Claude Haiku 4.5",
            "contextWindow": 200000
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "runapi/claude-sonnet-5"
        },
        "modelCatalog": {
          "runapi/claude-opus-4-8": {
            "alias": "Opus"
          },
          "runapi/claude-sonnet-5": {
            "alias": "Sonnet"
          },
          "runapi/claude-haiku-4-5": {
            "alias": "Haiku"
          }
        }
      }
    },
    {
      "name": "Unity2.ai",
      "websiteUrl": "https://unity2.ai",
      "apiKeyUrl": "https://unity2.ai/register?source=ccs",
      "category": "aggregator",
      "icon": "unity2",
      "iconColor": "",
      "badge": "partner",
      "configType": "openclaw",
      "apiProtocol": "openai-completions",
      "baseUrl": "https://api.unity2.ai/v1",
      "model": "gpt-5.5",
      "models": [
        "gpt-5.5"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://api.unity2.ai/v1",
        "apiKey": "",
        "api": "openai-completions",
        "models": [
          {
            "id": "gpt-5.5",
            "name": "GPT-5.5",
            "contextWindow": 400000,
            "cost": {
              "input": 5,
              "output": 15
            }
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "unity2/gpt-5.5"
        },
        "modelCatalog": {
          "unity2/gpt-5.5": {
            "alias": "GPT-5.5"
          }
        }
      }
    },
    {
      "name": "Shengsuanyun",
      "websiteUrl": "https://www.shengsuanyun.com/?from=CH_4HHXMRYF",
      "apiKeyUrl": "https://www.shengsuanyun.com/?from=CH_4HHXMRYF",
      "category": "aggregator",
      "icon": "shengsuanyun",
      "iconColor": "",
      "badge": "partner",
      "configType": "openclaw",
      "apiProtocol": "anthropic-messages",
      "baseUrl": "https://router.shengsuanyun.com/api",
      "model": "anthropic/claude-opus-4.8",
      "models": [
        "anthropic/claude-opus-4.8",
        "anthropic/claude-sonnet-5"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://router.shengsuanyun.com/api",
        "apiKey": "",
        "api": "anthropic-messages",
        "models": [
          {
            "id": "anthropic/claude-opus-4.8",
            "name": "Claude Opus 4.8",
            "contextWindow": 1000000,
            "cost": {
              "input": 5,
              "output": 25
            }
          },
          {
            "id": "anthropic/claude-sonnet-5",
            "name": "Claude Sonnet 5",
            "contextWindow": 1000000,
            "cost": {
              "input": 3,
              "output": 15
            }
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "shengsuanyun/anthropic/claude-opus-4.8",
          "fallbacks": [
            "shengsuanyun/anthropic/claude-sonnet-5"
          ]
        },
        "modelCatalog": {
          "shengsuanyun/anthropic/claude-opus-4.8": {
            "alias": "Opus"
          },
          "shengsuanyun/anthropic/claude-sonnet-5": {
            "alias": "Sonnet"
          }
        }
      }
    },
    {
      "name": "AIGoCode",
      "websiteUrl": "https://aigocode.com",
      "apiKeyUrl": "https://aigocode.com/invite/CC-SWITCH",
      "category": "third_party",
      "icon": "aigocode",
      "iconColor": "#5B7FFF",
      "badge": "partner",
      "configType": "openclaw",
      "apiProtocol": "anthropic-messages",
      "baseUrl": "https://api.aigocode.com",
      "model": "claude-opus-4-8",
      "models": [
        "claude-opus-4-8",
        "claude-sonnet-5"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://api.aigocode.com",
        "apiKey": "",
        "api": "anthropic-messages",
        "models": [
          {
            "id": "claude-opus-4-8",
            "name": "Claude Opus 4.8",
            "contextWindow": 1000000,
            "cost": {
              "input": 5,
              "output": 25
            }
          },
          {
            "id": "claude-sonnet-5",
            "name": "Claude Sonnet 5",
            "contextWindow": 1000000,
            "cost": {
              "input": 3,
              "output": 15
            }
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "aigocode/claude-opus-4-8",
          "fallbacks": [
            "aigocode/claude-sonnet-5"
          ]
        },
        "modelCatalog": {
          "aigocode/claude-opus-4-8": {
            "alias": "Opus"
          },
          "aigocode/claude-sonnet-5": {
            "alias": "Sonnet"
          }
        }
      }
    },
    {
      "name": "SubRouter",
      "websiteUrl": "https://subrouter.ai",
      "apiKeyUrl": "https://subrouter.ai/register?aff=l3ri",
      "category": "aggregator",
      "icon": "subrouter",
      "iconColor": "",
      "badge": "partner",
      "configType": "openclaw",
      "apiProtocol": "openai-completions",
      "baseUrl": "https://subrouter.ai/v1",
      "model": "gpt-5.5",
      "models": [
        "gpt-5.5"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://subrouter.ai/v1",
        "apiKey": "",
        "api": "openai-completions",
        "models": [
          {
            "id": "gpt-5.5",
            "name": "GPT-5.5",
            "contextWindow": 400000
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "subrouter/gpt-5.5"
        },
        "modelCatalog": {
          "subrouter/gpt-5.5": {
            "alias": "GPT-5.5"
          }
        }
      }
    },
    {
      "name": "APIKEY.FUN",
      "websiteUrl": "https://apikey.fun",
      "apiKeyUrl": "https://apikey.fun/register?aff=CCSwitch",
      "category": "third_party",
      "icon": "apikeyfun",
      "iconColor": "",
      "badge": "partner",
      "configType": "openclaw",
      "apiProtocol": "anthropic-messages",
      "baseUrl": "https://api.apikey.fun",
      "model": "claude-opus-4-8",
      "models": [
        "claude-opus-4-8",
        "claude-sonnet-5",
        "claude-haiku-4-5"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://api.apikey.fun",
        "apiKey": "",
        "api": "anthropic-messages",
        "models": [
          {
            "id": "claude-opus-4-8",
            "name": "Claude Opus 4.8",
            "contextWindow": 1000000
          },
          {
            "id": "claude-sonnet-5",
            "name": "Claude Sonnet 5",
            "contextWindow": 1000000
          },
          {
            "id": "claude-haiku-4-5",
            "name": "Claude Haiku 4.5",
            "contextWindow": 200000
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "apikeyfun/claude-opus-4-8",
          "fallbacks": [
            "apikeyfun/claude-sonnet-5"
          ]
        },
        "modelCatalog": {
          "apikeyfun/claude-opus-4-8": {
            "alias": "Opus"
          },
          "apikeyfun/claude-sonnet-5": {
            "alias": "Sonnet"
          },
          "apikeyfun/claude-haiku-4-5": {
            "alias": "Haiku"
          }
        }
      }
    },
    {
      "name": "Code0",
      "websiteUrl": "https://code0.ai",
      "apiKeyUrl": "https://code0.ai/agent/register/B2XHxGjGmRvqgznY",
      "category": "aggregator",
      "icon": "code0",
      "iconColor": "",
      "badge": "partner",
      "configType": "openclaw",
      "apiProtocol": "openai-completions",
      "baseUrl": "https://code0.ai/v1",
      "model": "gpt-5.5",
      "models": [
        "gpt-5.5"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://code0.ai/v1",
        "apiKey": "",
        "api": "openai-completions",
        "models": [
          {
            "id": "gpt-5.5",
            "name": "GPT-5.5",
            "contextWindow": 400000
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "code0/gpt-5.5"
        },
        "modelCatalog": {
          "code0/gpt-5.5": {
            "alias": "GPT-5.5"
          }
        }
      }
    },
    {
      "name": "TeamoRouter",
      "websiteUrl": "https://teamorouter.com",
      "apiKeyUrl": "https://teamorouter.com/?utm_source=cc_switch&utm_medium=referral&utm_campaign=ai_directory",
      "category": "aggregator",
      "icon": "teamorouter",
      "iconColor": "",
      "badge": "partner",
      "configType": "openclaw",
      "apiProtocol": "openai-completions",
      "baseUrl": "https://api.teamorouter.com/v1",
      "model": "gpt-5.5",
      "models": [
        "gpt-5.5"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://api.teamorouter.com/v1",
        "apiKey": "",
        "api": "openai-completions",
        "models": [
          {
            "id": "gpt-5.5",
            "name": "GPT-5.5",
            "contextWindow": 400000
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "teamorouter/gpt-5.5"
        },
        "modelCatalog": {
          "teamorouter/gpt-5.5": {
            "alias": "GPT-5.5"
          }
        }
      }
    },
    {
      "name": "ClaudeCN",
      "websiteUrl": "https://claudecn.top",
      "apiKeyUrl": "https://claudecn.ai/register?aff=HEL9",
      "category": "third_party",
      "icon": "claudecn",
      "iconColor": "",
      "badge": "partner",
      "configType": "openclaw",
      "apiProtocol": "anthropic-messages",
      "baseUrl": "https://claudecn.top",
      "model": "claude-opus-4-8",
      "models": [
        "claude-opus-4-8",
        "claude-sonnet-5",
        "claude-haiku-4-5"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://claudecn.top",
        "apiKey": "",
        "api": "anthropic-messages",
        "models": [
          {
            "id": "claude-opus-4-8",
            "name": "Claude Opus 4.8",
            "contextWindow": 1000000
          },
          {
            "id": "claude-sonnet-5",
            "name": "Claude Sonnet 5",
            "contextWindow": 1000000
          },
          {
            "id": "claude-haiku-4-5",
            "name": "Claude Haiku 4.5",
            "contextWindow": 200000
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "claudecn/claude-sonnet-5"
        },
        "modelCatalog": {
          "claudecn/claude-opus-4-8": {
            "alias": "Opus"
          },
          "claudecn/claude-sonnet-5": {
            "alias": "Sonnet"
          },
          "claudecn/claude-haiku-4-5": {
            "alias": "Haiku"
          }
        }
      }
    },
    {
      "name": "火山Agentplan",
      "websiteUrl": "https://www.volcengine.com/activity/codingplan?ac=MMAP8JTTCAQ2&rc=6J6FV5N2&utm_campaign=hw&utm_content=ccswitch&utm_medium=devrel_tool_web&utm_source=OWO&utm_term=ccswitch",
      "apiKeyUrl": "https://www.volcengine.com/activity/codingplan?ac=MMAP8JTTCAQ2&rc=6J6FV5N2&utm_campaign=hw&utm_content=ccswitch&utm_medium=devrel_tool_web&utm_source=OWO&utm_term=ccswitch",
      "category": "cn_official",
      "icon": "huoshan",
      "iconColor": "#3370FF",
      "badge": "partner",
      "configType": "openclaw",
      "apiProtocol": "openai-completions",
      "baseUrl": "https://ark.cn-beijing.volces.com/api/coding/v3",
      "model": "ark-code-latest",
      "models": [
        "ark-code-latest"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://ark.cn-beijing.volces.com/api/coding/v3",
        "apiKey": "",
        "api": "openai-completions",
        "models": [
          {
            "id": "ark-code-latest",
            "name": "Ark Code Latest",
            "contextWindow": 256000
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "ark_agentplan/ark-code-latest"
        },
        "modelCatalog": {
          "ark_agentplan/ark-code-latest": {
            "alias": "Ark Code"
          }
        }
      }
    },
    {
      "name": "BytePlus",
      "websiteUrl": "https://www.byteplus.com/en/product/modelark?utm_campaign=hw&utm_content=ccswitch&utm_medium=devrel_tool_web&utm_source=OWO&utm_term=ccswitch",
      "apiKeyUrl": "https://www.byteplus.com/en/product/modelark?utm_campaign=hw&utm_content=ccswitch&utm_medium=devrel_tool_web&utm_source=OWO&utm_term=ccswitch",
      "category": "cn_official",
      "icon": "byteplus",
      "iconColor": "#3370FF",
      "badge": "partner",
      "configType": "openclaw",
      "apiProtocol": "openai-completions",
      "baseUrl": "https://ark.ap-southeast.bytepluses.com/api/coding/v3",
      "model": "ark-code-latest",
      "models": [
        "ark-code-latest"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://ark.ap-southeast.bytepluses.com/api/coding/v3",
        "apiKey": "",
        "api": "openai-completions",
        "models": [
          {
            "id": "ark-code-latest",
            "name": "Ark Code Latest",
            "contextWindow": 256000
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "byteplus/ark-code-latest"
        },
        "modelCatalog": {
          "byteplus/ark-code-latest": {
            "alias": "Ark Code"
          }
        }
      }
    },
    {
      "name": "DouBaoSeed",
      "websiteUrl": "https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey?apikey=%7B%7D&utm_campaign=hw&utm_content=ccswitch&utm_medium=devrel_tool_web&utm_source=OWO&utm_term=ccswitch",
      "apiKeyUrl": "https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey?apikey=%7B%7D&utm_campaign=hw&utm_content=ccswitch&utm_medium=devrel_tool_web&utm_source=OWO&utm_term=ccswitch",
      "category": "cn_official",
      "icon": "doubao",
      "iconColor": "#3370FF",
      "badge": "partner",
      "configType": "openclaw",
      "apiProtocol": "openai-completions",
      "baseUrl": "https://ark.cn-beijing.volces.com/api/v3",
      "model": "doubao-seed-2-1-pro-260628",
      "models": [
        "doubao-seed-2-1-pro-260628"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://ark.cn-beijing.volces.com/api/v3",
        "apiKey": "",
        "api": "openai-completions",
        "models": [
          {
            "id": "doubao-seed-2-1-pro-260628",
            "name": "DouBao Seed 2.1 Pro",
            "contextWindow": 262144,
            "cost": {
              "input": 0.84,
              "output": 4.2
            }
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "doubaoseed/doubao-seed-2-1-pro-260628"
        },
        "modelCatalog": {
          "doubaoseed/doubao-seed-2-1-pro-260628": {
            "alias": "DouBao"
          }
        }
      }
    },
    {
      "name": "SiliconFlow",
      "websiteUrl": "https://siliconflow.cn",
      "apiKeyUrl": "https://cloud.siliconflow.cn/i/YflgU2Ve",
      "category": "aggregator",
      "icon": "siliconflow",
      "iconColor": "#6E29F6",
      "badge": "partner",
      "configType": "openclaw",
      "apiProtocol": "openai-completions",
      "baseUrl": "https://api.siliconflow.cn/v1",
      "model": "Pro/MiniMaxAI/MiniMax-M2.7",
      "models": [
        "Pro/MiniMaxAI/MiniMax-M2.7"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://api.siliconflow.cn/v1",
        "apiKey": "",
        "api": "openai-completions",
        "models": [
          {
            "id": "Pro/MiniMaxAI/MiniMax-M2.7",
            "name": "MiniMax M2.7",
            "contextWindow": 200000,
            "cost": {
              "input": 0.3,
              "output": 1.2,
              "cacheRead": 0.06,
              "cacheWrite": 0.375
            }
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "siliconflow/Pro/MiniMaxAI/MiniMax-M2.7"
        },
        "modelCatalog": {
          "siliconflow/Pro/MiniMaxAI/MiniMax-M2.7": {
            "alias": "MiniMax"
          }
        }
      }
    },
    {
      "name": "SiliconFlow en",
      "websiteUrl": "https://siliconflow.com",
      "apiKeyUrl": "https://cloud.siliconflow.cn/i/YflgU2Ve",
      "category": "aggregator",
      "icon": "siliconflow",
      "iconColor": "#000000",
      "badge": "partner",
      "configType": "openclaw",
      "apiProtocol": "openai-completions",
      "baseUrl": "https://api.siliconflow.com/v1",
      "model": "MiniMaxAI/MiniMax-M2.7",
      "models": [
        "MiniMaxAI/MiniMax-M2.7"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://api.siliconflow.com/v1",
        "apiKey": "",
        "api": "openai-completions",
        "models": [
          {
            "id": "MiniMaxAI/MiniMax-M2.7",
            "name": "MiniMax M2.7",
            "contextWindow": 200000,
            "cost": {
              "input": 0.3,
              "output": 1.2,
              "cacheRead": 0.06,
              "cacheWrite": 0.375
            }
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "siliconflow-en/MiniMaxAI/MiniMax-M2.7"
        },
        "modelCatalog": {
          "siliconflow-en/MiniMaxAI/MiniMax-M2.7": {
            "alias": "MiniMax"
          }
        }
      }
    },
    {
      "name": "NekoCode",
      "websiteUrl": "https://nekocode.ai",
      "apiKeyUrl": "https://nekocode.ai?aff=CCSWITCH",
      "category": "aggregator",
      "icon": "nekocode",
      "iconColor": "",
      "badge": "partner",
      "configType": "openclaw",
      "apiProtocol": "openai-completions",
      "baseUrl": "https://nekocode.ai/v1",
      "model": "gpt-5.5",
      "models": [
        "gpt-5.5"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://nekocode.ai/v1",
        "apiKey": "",
        "api": "openai-completions",
        "models": [
          {
            "id": "gpt-5.5",
            "name": "GPT-5.5",
            "contextWindow": 400000
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "nekocode/gpt-5.5"
        },
        "modelCatalog": {
          "nekocode/gpt-5.5": {
            "alias": "GPT-5.5"
          }
        }
      }
    },
    {
      "name": "AtlasCloud",
      "websiteUrl": "https://www.atlascloud.ai/console/coding-plan",
      "apiKeyUrl": "https://www.atlascloud.ai/console/coding-plan",
      "category": "aggregator",
      "icon": "atlascloud",
      "iconColor": "",
      "badge": "partner",
      "configType": "openclaw",
      "apiProtocol": "openai-completions",
      "baseUrl": "https://api.atlascloud.ai/v1",
      "model": "zai-org/glm-5.1",
      "models": [
        "zai-org/glm-5.1"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://api.atlascloud.ai/v1",
        "apiKey": "",
        "api": "openai-completions",
        "models": [
          {
            "id": "zai-org/glm-5.1",
            "name": "GLM 5.1"
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "atlascloud/zai-org/glm-5.1"
        }
      }
    },
    {
      "name": "Compshare",
      "websiteUrl": "https://www.compshare.cn",
      "apiKeyUrl": "https://www.compshare.cn/coding-plan?ytag=GPU_YY_YX_git_cc-switch",
      "category": "aggregator",
      "icon": "ucloud",
      "iconColor": "#000000",
      "badge": "partner",
      "configType": "openclaw",
      "apiProtocol": "anthropic-messages",
      "baseUrl": "https://api.modelverse.cn/v1",
      "model": "claude-opus-4-8",
      "models": [
        "claude-opus-4-8"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://api.modelverse.cn/v1",
        "apiKey": "",
        "api": "anthropic-messages",
        "models": [
          {
            "id": "claude-opus-4-8",
            "name": "Claude Opus 4.8",
            "contextWindow": 1000000,
            "cost": {
              "input": 5,
              "output": 25
            }
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "compshare/claude-opus-4-8"
        },
        "modelCatalog": {
          "compshare/claude-opus-4-8": {
            "alias": "Opus"
          }
        }
      }
    },
    {
      "name": "Compshare Coding Plan",
      "websiteUrl": "https://www.compshare.cn",
      "apiKeyUrl": "https://www.compshare.cn/coding-plan?ytag=GPU_YY_YX_git_cc-switch",
      "category": "aggregator",
      "icon": "ucloud",
      "iconColor": "#000000",
      "badge": "partner",
      "configType": "openclaw",
      "apiProtocol": "anthropic-messages",
      "baseUrl": "https://cp.compshare.cn/v1",
      "model": "claude-opus-4-8",
      "models": [
        "claude-opus-4-8"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://cp.compshare.cn/v1",
        "apiKey": "",
        "api": "anthropic-messages",
        "models": [
          {
            "id": "claude-opus-4-8",
            "name": "Claude Opus 4.8",
            "contextWindow": 1000000,
            "cost": {
              "input": 5,
              "output": 25
            }
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "compshare-coding/claude-opus-4-8"
        },
        "modelCatalog": {
          "compshare-coding/claude-opus-4-8": {
            "alias": "Opus"
          }
        }
      }
    },
    {
      "name": "CCSub",
      "websiteUrl": "https://www.ccsub.net",
      "apiKeyUrl": "https://www.ccsub.net/register?ref=Y6Z8DXEA",
      "category": "aggregator",
      "icon": "ccsub",
      "iconColor": "",
      "badge": "partner",
      "configType": "openclaw",
      "apiProtocol": "openai-completions",
      "baseUrl": "https://www.ccsub.net/v1",
      "model": "gpt-5.5",
      "models": [
        "gpt-5.5"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://www.ccsub.net/v1",
        "apiKey": "",
        "api": "openai-completions",
        "models": [
          {
            "id": "gpt-5.5",
            "name": "GPT-5.5",
            "contextWindow": 400000,
            "cost": {
              "input": 5,
              "output": 15
            }
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "ccsub/gpt-5.5"
        },
        "modelCatalog": {
          "ccsub/gpt-5.5": {
            "alias": "GPT-5.5"
          }
        }
      }
    },
    {
      "name": "SSSAiCode",
      "websiteUrl": "https://sssaicodeapi.com",
      "apiKeyUrl": "https://sssaicodeapi.com/register?ref=DCP0SM",
      "category": "third_party",
      "icon": "sssaicode",
      "iconColor": "#000000",
      "badge": "partner",
      "configType": "openclaw",
      "apiProtocol": "anthropic-messages",
      "baseUrl": "https://node-hk.sssaicodeapi.com/api",
      "model": "claude-opus-4-8",
      "models": [
        "claude-opus-4-8",
        "claude-sonnet-5"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://node-hk.sssaicodeapi.com/api",
        "apiKey": "",
        "api": "anthropic-messages",
        "models": [
          {
            "id": "claude-opus-4-8",
            "name": "Claude Opus 4.8",
            "contextWindow": 1000000,
            "cost": {
              "input": 5,
              "output": 25
            }
          },
          {
            "id": "claude-sonnet-5",
            "name": "Claude Sonnet 5",
            "contextWindow": 1000000,
            "cost": {
              "input": 3,
              "output": 15
            }
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "sssaicode/claude-opus-4-8",
          "fallbacks": [
            "sssaicode/claude-sonnet-5"
          ]
        },
        "modelCatalog": {
          "sssaicode/claude-opus-4-8": {
            "alias": "Opus"
          },
          "sssaicode/claude-sonnet-5": {
            "alias": "Sonnet"
          }
        }
      }
    },
    {
      "name": "Micu",
      "websiteUrl": "https://www.micuapi.ai",
      "apiKeyUrl": "https://www.micuapi.ai/register?aff=aOYQ",
      "category": "third_party",
      "icon": "micu",
      "iconColor": "#000000",
      "badge": "partner",
      "configType": "openclaw",
      "apiProtocol": "anthropic-messages",
      "baseUrl": "https://www.micuapi.ai",
      "model": "claude-opus-4-8",
      "models": [
        "claude-opus-4-8"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://www.micuapi.ai",
        "apiKey": "",
        "api": "anthropic-messages",
        "models": [
          {
            "id": "claude-opus-4-8",
            "name": "Claude Opus 4.8",
            "contextWindow": 1000000,
            "cost": {
              "input": 5,
              "output": 25
            }
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "micu/claude-opus-4-8"
        },
        "modelCatalog": {
          "micu/claude-opus-4-8": {
            "alias": "Opus"
          }
        }
      }
    },
    {
      "name": "RightCode",
      "websiteUrl": "https://www.right.codes",
      "apiKeyUrl": "https://www.right.codes/register?aff=CCSWITCH",
      "category": "third_party",
      "icon": "rc",
      "iconColor": "#E96B2C",
      "badge": "partner",
      "configType": "openclaw",
      "apiProtocol": "anthropic-messages",
      "baseUrl": "https://www.right.codes/claude",
      "model": "claude-opus-4-8",
      "models": [
        "claude-opus-4-8",
        "claude-sonnet-5"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://www.right.codes/claude",
        "apiKey": "",
        "api": "anthropic-messages",
        "models": [
          {
            "id": "claude-opus-4-8",
            "name": "Claude Opus 4.8",
            "contextWindow": 1000000,
            "cost": {
              "input": 5,
              "output": 25
            }
          },
          {
            "id": "claude-sonnet-5",
            "name": "Claude Sonnet 5",
            "contextWindow": 1000000,
            "cost": {
              "input": 3,
              "output": 15
            }
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "rightcode/claude-opus-4-8",
          "fallbacks": [
            "rightcode/claude-sonnet-5"
          ]
        },
        "modelCatalog": {
          "rightcode/claude-opus-4-8": {
            "alias": "Opus"
          },
          "rightcode/claude-sonnet-5": {
            "alias": "Sonnet"
          }
        }
      }
    },
    {
      "name": "ETok.ai",
      "websiteUrl": "https://etok.ai",
      "apiKeyUrl": "https://etok.ai",
      "category": "third_party",
      "icon": "etok",
      "iconColor": "#000000",
      "badge": "partner",
      "configType": "openclaw",
      "apiProtocol": "anthropic-messages",
      "baseUrl": "https://api.etok.ai",
      "model": "claude-opus-4-8",
      "models": [
        "claude-opus-4-8"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://api.etok.ai",
        "apiKey": "",
        "api": "anthropic-messages",
        "models": [
          {
            "id": "claude-opus-4-8",
            "name": "Claude Opus 4.8",
            "contextWindow": 1000000,
            "cost": {
              "input": 5,
              "output": 25
            }
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "etok/claude-opus-4-8"
        },
        "modelCatalog": {
          "etok/claude-opus-4-8": {
            "alias": "Opus"
          }
        }
      }
    },
    {
      "name": "Cubence",
      "websiteUrl": "https://cubence.com",
      "apiKeyUrl": "https://cubence.com/signup?code=CCSWITCH&source=ccs",
      "category": "third_party",
      "icon": "cubence",
      "iconColor": "#000000",
      "badge": "partner",
      "configType": "openclaw",
      "apiProtocol": "anthropic-messages",
      "baseUrl": "https://api.cubence.com",
      "model": "claude-opus-4-8",
      "models": [
        "claude-opus-4-8",
        "claude-sonnet-5"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://api.cubence.com",
        "apiKey": "",
        "api": "anthropic-messages",
        "models": [
          {
            "id": "claude-opus-4-8",
            "name": "Claude Opus 4.8",
            "contextWindow": 1000000,
            "cost": {
              "input": 5,
              "output": 25
            }
          },
          {
            "id": "claude-sonnet-5",
            "name": "Claude Sonnet 5",
            "contextWindow": 1000000,
            "cost": {
              "input": 3,
              "output": 15
            }
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "cubence/claude-opus-4-8",
          "fallbacks": [
            "cubence/claude-sonnet-5"
          ]
        },
        "modelCatalog": {
          "cubence/claude-opus-4-8": {
            "alias": "Opus"
          },
          "cubence/claude-sonnet-5": {
            "alias": "Sonnet"
          }
        }
      }
    },
    {
      "name": "CrazyRouter",
      "websiteUrl": "https://www.crazyrouter.com",
      "apiKeyUrl": "https://www.crazyrouter.com/register?aff=OZcm&ref=cc-switch",
      "category": "third_party",
      "icon": "crazyrouter",
      "iconColor": "#000000",
      "badge": "partner",
      "configType": "openclaw",
      "apiProtocol": "anthropic-messages",
      "baseUrl": "https://cn.crazyrouter.com/v1",
      "model": "claude-opus-4-8",
      "models": [
        "claude-opus-4-8",
        "claude-sonnet-5"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://cn.crazyrouter.com/v1",
        "apiKey": "",
        "api": "anthropic-messages",
        "models": [
          {
            "id": "claude-opus-4-8",
            "name": "Claude Opus 4.8",
            "contextWindow": 1000000,
            "cost": {
              "input": 5,
              "output": 25
            }
          },
          {
            "id": "claude-sonnet-5",
            "name": "Claude Sonnet 5",
            "contextWindow": 1000000,
            "cost": {
              "input": 3,
              "output": 15
            }
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "crazyrouter/claude-opus-4-8",
          "fallbacks": [
            "crazyrouter/claude-sonnet-5"
          ]
        },
        "modelCatalog": {
          "crazyrouter/claude-opus-4-8": {
            "alias": "Opus"
          },
          "crazyrouter/claude-sonnet-5": {
            "alias": "Sonnet"
          }
        }
      }
    },
    {
      "name": "DMXAPI",
      "websiteUrl": "https://www.dmxapi.cn",
      "apiKeyUrl": "https://www.dmxapi.cn",
      "category": "aggregator",
      "icon": "",
      "iconColor": "",
      "badge": "partner",
      "configType": "openclaw",
      "apiProtocol": "anthropic-messages",
      "baseUrl": "https://www.dmxapi.cn",
      "model": "claude-opus-4-8",
      "models": [
        "claude-opus-4-8",
        "claude-sonnet-5"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://www.dmxapi.cn",
        "apiKey": "",
        "api": "anthropic-messages",
        "models": [
          {
            "id": "claude-opus-4-8",
            "name": "Claude Opus 4.8",
            "contextWindow": 1000000,
            "cost": {
              "input": 5,
              "output": 25
            }
          },
          {
            "id": "claude-sonnet-5",
            "name": "Claude Sonnet 5",
            "contextWindow": 1000000,
            "cost": {
              "input": 3,
              "output": 15
            }
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "dmxapi/claude-opus-4-8",
          "fallbacks": [
            "dmxapi/claude-sonnet-5"
          ]
        },
        "modelCatalog": {
          "dmxapi/claude-opus-4-8": {
            "alias": "Opus"
          },
          "dmxapi/claude-sonnet-5": {
            "alias": "Sonnet"
          }
        }
      }
    },
    {
      "name": "Qiniu",
      "websiteUrl": "https://s.qiniu.com/nMvAvy",
      "apiKeyUrl": "https://s.qiniu.com/nMvAvy",
      "category": "aggregator",
      "icon": "qiniu",
      "iconColor": "",
      "badge": "partner",
      "configType": "openclaw",
      "apiProtocol": "openai-completions",
      "baseUrl": "https://api.qnaigc.com/v1",
      "model": "gpt-5.5",
      "models": [
        "gpt-5.5"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://api.qnaigc.com/v1",
        "apiKey": "",
        "api": "openai-completions",
        "models": [
          {
            "id": "gpt-5.5",
            "name": "GPT-5.5",
            "contextWindow": 400000
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "qiniu/gpt-5.5"
        },
        "modelCatalog": {
          "qiniu/gpt-5.5": {
            "alias": "GPT-5.5"
          }
        }
      }
    },
    {
      "name": "SudoCode.chat",
      "websiteUrl": "https://sudocode.chat",
      "apiKeyUrl": "https://sudocode.chat/register?utm_source=ccswitch&utm_medium=partner",
      "category": "third_party",
      "icon": "sudocode",
      "iconColor": "",
      "badge": "partner",
      "configType": "openclaw",
      "apiProtocol": "openai-responses",
      "baseUrl": "https://api.sudocode.chat/v1",
      "model": "gpt-5.6-sol",
      "models": [
        "gpt-5.6-sol"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://api.sudocode.chat/v1",
        "apiKey": "",
        "api": "openai-responses",
        "models": [
          {
            "id": "gpt-5.6-sol",
            "name": "GPT-5.6 Sol"
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "sudocode/gpt-5.6-sol"
        }
      }
    },
    {
      "name": "SudoCode.us",
      "websiteUrl": "https://sudocode.us",
      "apiKeyUrl": "https://sudocode.us",
      "category": "third_party",
      "icon": "sudocode-us",
      "iconColor": "",
      "badge": "partner",
      "configType": "openclaw",
      "apiProtocol": "openai-responses",
      "baseUrl": "https://sudocode.us/v1",
      "model": "gpt-5.5",
      "models": [
        "gpt-5.5"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://sudocode.us/v1",
        "apiKey": "",
        "api": "openai-responses",
        "models": [
          {
            "id": "gpt-5.5",
            "name": "GPT-5.5"
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "sudocode-us/gpt-5.5"
        }
      }
    },
    {
      "name": "Amux",
      "websiteUrl": "https://amux.ai",
      "apiKeyUrl": "https://amux.ai",
      "category": "aggregator",
      "icon": "amux",
      "iconColor": "",
      "badge": "",
      "configType": "openclaw",
      "apiProtocol": "openai-completions",
      "baseUrl": "https://api.amux.ai/v1",
      "model": "gpt-5.5",
      "models": [
        "gpt-5.5"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://api.amux.ai/v1",
        "apiKey": "",
        "api": "openai-completions",
        "models": [
          {
            "id": "gpt-5.5",
            "name": "GPT-5.5",
            "contextWindow": 400000
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "amux/gpt-5.5"
        },
        "modelCatalog": {
          "amux/gpt-5.5": {
            "alias": "GPT-5.5"
          }
        }
      }
    },
    {
      "name": "DeepSeek",
      "websiteUrl": "https://platform.deepseek.com",
      "apiKeyUrl": "https://platform.deepseek.com/api_keys",
      "category": "cn_official",
      "icon": "deepseek",
      "iconColor": "#1E88E5",
      "badge": "",
      "configType": "openclaw",
      "apiProtocol": "openai-completions",
      "baseUrl": "https://api.deepseek.com/v1",
      "model": "deepseek-v4-pro",
      "models": [
        "deepseek-v4-pro",
        "deepseek-v4-flash"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://api.deepseek.com/v1",
        "apiKey": "",
        "api": "openai-completions",
        "models": [
          {
            "id": "deepseek-v4-pro",
            "name": "DeepSeek V4 Pro",
            "contextWindow": 1000000,
            "cost": {
              "input": 0.435,
              "output": 0.87,
              "cacheRead": 0.003625
            }
          },
          {
            "id": "deepseek-v4-flash",
            "name": "DeepSeek V4 Flash",
            "contextWindow": 1000000,
            "cost": {
              "input": 0.14,
              "output": 0.28
            }
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "deepseek/deepseek-v4-flash",
          "fallbacks": [
            "deepseek/deepseek-v4-pro"
          ]
        },
        "modelCatalog": {
          "deepseek/deepseek-v4-flash": {
            "alias": "Flash"
          },
          "deepseek/deepseek-v4-pro": {
            "alias": "Pro"
          }
        }
      }
    },
    {
      "name": "Zhipu GLM",
      "websiteUrl": "https://open.bigmodel.cn",
      "apiKeyUrl": "https://www.bigmodel.cn/claude-code?ic=RRVJPB5SII",
      "category": "cn_official",
      "icon": "zhipu",
      "iconColor": "#0F62FE",
      "badge": "",
      "configType": "openclaw",
      "apiProtocol": "openai-completions",
      "baseUrl": "https://open.bigmodel.cn/api/coding/paas/v4",
      "model": "glm-5.1",
      "models": [
        "glm-5.1"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://open.bigmodel.cn/api/coding/paas/v4",
        "apiKey": "",
        "api": "openai-completions",
        "models": [
          {
            "id": "glm-5.1",
            "name": "GLM-5.1",
            "contextWindow": 128000,
            "cost": {
              "input": 1.4,
              "output": 4.4,
              "cacheRead": 0.26
            }
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "zhipu/glm-5.1"
        },
        "modelCatalog": {
          "zhipu/glm-5.1": {
            "alias": "GLM"
          }
        }
      }
    },
    {
      "name": "Zhipu GLM en",
      "websiteUrl": "https://z.ai",
      "apiKeyUrl": "https://z.ai/subscribe?ic=8JVLJQFSKB",
      "category": "cn_official",
      "icon": "zhipu",
      "iconColor": "#0F62FE",
      "badge": "",
      "configType": "openclaw",
      "apiProtocol": "openai-completions",
      "baseUrl": "https://api.z.ai/api/coding/paas/v4",
      "model": "glm-5.1",
      "models": [
        "glm-5.1"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://api.z.ai/api/coding/paas/v4",
        "apiKey": "",
        "api": "openai-completions",
        "models": [
          {
            "id": "glm-5.1",
            "name": "GLM-5.1",
            "contextWindow": 128000,
            "cost": {
              "input": 1.4,
              "output": 4.4,
              "cacheRead": 0.26
            }
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "zhipu-en/glm-5.1"
        },
        "modelCatalog": {
          "zhipu-en/glm-5.1": {
            "alias": "GLM"
          }
        }
      }
    },
    {
      "name": "Qwen Coder",
      "websiteUrl": "https://bailian.console.aliyun.com",
      "apiKeyUrl": "https://bailian.console.aliyun.com/#/api-key",
      "category": "cn_official",
      "icon": "qwen",
      "iconColor": "#FF6A00",
      "badge": "",
      "configType": "openclaw",
      "apiProtocol": "openai-completions",
      "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
      "model": "qwen3.5-plus",
      "models": [
        "qwen3.5-plus"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "apiKey": "",
        "api": "openai-completions",
        "models": [
          {
            "id": "qwen3.5-plus",
            "name": "Qwen3.5 Plus",
            "contextWindow": 32000,
            "cost": {
              "input": 0.26,
              "output": 1.56,
              "cacheRead": 0.052
            }
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "qwen/qwen3.5-plus"
        },
        "modelCatalog": {
          "qwen/qwen3.5-plus": {
            "alias": "Qwen"
          }
        }
      }
    },
    {
      "name": "StepFun",
      "websiteUrl": "https://platform.stepfun.com/step-plan",
      "apiKeyUrl": "https://platform.stepfun.com/interface-key",
      "category": "cn_official",
      "icon": "stepfun",
      "iconColor": "#16D6D2",
      "badge": "",
      "configType": "openclaw",
      "apiProtocol": "openai-completions",
      "baseUrl": "https://api.stepfun.com/step_plan/v1",
      "model": "step-3.5-flash-2603",
      "models": [
        "step-3.5-flash-2603",
        "step-3.5-flash"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://api.stepfun.com/step_plan/v1",
        "apiKey": "",
        "api": "openai-completions",
        "models": [
          {
            "id": "step-3.5-flash-2603",
            "name": "Step 3.5 Flash 2603",
            "contextWindow": 262144
          },
          {
            "id": "step-3.5-flash",
            "name": "Step 3.5 Flash",
            "contextWindow": 262144
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "stepfun/step-3.5-flash-2603"
        },
        "modelCatalog": {
          "stepfun/step-3.5-flash-2603": {
            "alias": "StepFun"
          },
          "stepfun/step-3.5-flash": {
            "alias": "StepFun Flash"
          }
        }
      }
    },
    {
      "name": "StepFun en",
      "websiteUrl": "https://platform.stepfun.ai/step-plan",
      "apiKeyUrl": "https://platform.stepfun.ai/interface-key",
      "category": "cn_official",
      "icon": "stepfun",
      "iconColor": "#16D6D2",
      "badge": "",
      "configType": "openclaw",
      "apiProtocol": "openai-completions",
      "baseUrl": "https://api.stepfun.ai/step_plan/v1",
      "model": "step-3.5-flash-2603",
      "models": [
        "step-3.5-flash-2603",
        "step-3.5-flash"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://api.stepfun.ai/step_plan/v1",
        "apiKey": "",
        "api": "openai-completions",
        "models": [
          {
            "id": "step-3.5-flash-2603",
            "name": "Step 3.5 Flash 2603",
            "contextWindow": 262144
          },
          {
            "id": "step-3.5-flash",
            "name": "Step 3.5 Flash",
            "contextWindow": 262144
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "stepfun-en/step-3.5-flash-2603"
        },
        "modelCatalog": {
          "stepfun-en/step-3.5-flash-2603": {
            "alias": "StepFun"
          },
          "stepfun-en/step-3.5-flash": {
            "alias": "StepFun Flash"
          }
        }
      }
    },
    {
      "name": "MiniMax",
      "websiteUrl": "https://platform.minimaxi.com",
      "apiKeyUrl": "https://platform.minimaxi.com/subscribe/coding-plan",
      "category": "cn_official",
      "icon": "minimax",
      "iconColor": "#FF6B6B",
      "badge": "",
      "configType": "openclaw",
      "apiProtocol": "openai-completions",
      "baseUrl": "https://api.minimaxi.com/v1",
      "model": "MiniMax-M2.7",
      "models": [
        "MiniMax-M2.7"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://api.minimaxi.com/v1",
        "apiKey": "",
        "api": "openai-completions",
        "models": [
          {
            "id": "MiniMax-M2.7",
            "name": "MiniMax M2.7",
            "contextWindow": 200000,
            "cost": {
              "input": 0.3,
              "output": 1.2,
              "cacheRead": 0.06,
              "cacheWrite": 0.375
            }
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "minimax/MiniMax-M2.7"
        },
        "modelCatalog": {
          "minimax/MiniMax-M2.7": {
            "alias": "MiniMax"
          }
        }
      }
    },
    {
      "name": "MiniMax en",
      "websiteUrl": "https://platform.minimax.io",
      "apiKeyUrl": "https://platform.minimax.io/subscribe/coding-plan",
      "category": "cn_official",
      "icon": "minimax",
      "iconColor": "#FF6B6B",
      "badge": "",
      "configType": "openclaw",
      "apiProtocol": "openai-completions",
      "baseUrl": "https://api.minimax.io/v1",
      "model": "MiniMax-M2.7",
      "models": [
        "MiniMax-M2.7"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://api.minimax.io/v1",
        "apiKey": "",
        "api": "openai-completions",
        "models": [
          {
            "id": "MiniMax-M2.7",
            "name": "MiniMax M2.7",
            "contextWindow": 200000,
            "cost": {
              "input": 0.3,
              "output": 1.2,
              "cacheRead": 0.06,
              "cacheWrite": 0.375
            }
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "minimax-en/MiniMax-M2.7"
        },
        "modelCatalog": {
          "minimax-en/MiniMax-M2.7": {
            "alias": "MiniMax"
          }
        }
      }
    },
    {
      "name": "KAT-Coder",
      "websiteUrl": "https://console.streamlake.ai",
      "apiKeyUrl": "https://console.streamlake.ai/console/api-key",
      "category": "cn_official",
      "icon": "catcoder",
      "iconColor": "",
      "badge": "",
      "configType": "openclaw",
      "apiProtocol": "openai-completions",
      "baseUrl": "https://vanchin.streamlake.ai/api/gateway/v1/endpoints/${ENDPOINT_ID}/openai",
      "model": "KAT-Coder-Pro",
      "models": [
        "KAT-Coder-Pro"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://vanchin.streamlake.ai/api/gateway/v1/endpoints/${ENDPOINT_ID}/openai",
        "apiKey": "",
        "api": "openai-completions",
        "models": [
          {
            "id": "KAT-Coder-Pro",
            "name": "KAT-Coder Pro",
            "contextWindow": 128000,
            "cost": {
              "input": 0.3,
              "output": 1.2,
              "cacheRead": 0.06
            }
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "katcoder/KAT-Coder-Pro"
        },
        "modelCatalog": {
          "katcoder/KAT-Coder-Pro": {
            "alias": "KAT-Coder"
          }
        }
      }
    },
    {
      "name": "Longcat",
      "websiteUrl": "https://longcat.chat/platform",
      "apiKeyUrl": "https://longcat.chat/platform/api_keys",
      "category": "cn_official",
      "icon": "longcat",
      "iconColor": "#29E154",
      "badge": "",
      "configType": "openclaw",
      "apiProtocol": "openai-completions",
      "baseUrl": "https://api.longcat.chat/openai/v1",
      "model": "LongCat-2.0",
      "models": [
        "LongCat-2.0"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://api.longcat.chat/openai/v1",
        "apiKey": "",
        "api": "openai-completions",
        "authHeader": true,
        "models": [
          {
            "id": "LongCat-2.0",
            "name": "LongCat 2.0",
            "reasoning": false,
            "input": [
              "text"
            ],
            "contextWindow": 1048576,
            "maxTokens": 131072,
            "compat": {
              "maxTokensField": "max_tokens"
            },
            "cost": {
              "input": 0.75,
              "output": 2.95,
              "cacheRead": 0.015
            }
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "longcat/LongCat-2.0"
        },
        "modelCatalog": {
          "longcat/LongCat-2.0": {
            "alias": "LongCat"
          }
        }
      }
    },
    {
      "name": "BaiLing",
      "websiteUrl": "https://alipaytbox.yuque.com/sxs0ba/ling/get_started",
      "apiKeyUrl": "",
      "category": "cn_official",
      "icon": "",
      "iconColor": "",
      "badge": "",
      "configType": "openclaw",
      "apiProtocol": "openai-completions",
      "baseUrl": "https://api.tbox.cn/v1",
      "model": "Ling-2.5-1T",
      "models": [
        "Ling-2.5-1T"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://api.tbox.cn/v1",
        "apiKey": "",
        "api": "openai-completions",
        "models": [
          {
            "id": "Ling-2.5-1T",
            "name": "Ling 2.5 1T",
            "contextWindow": 128000,
            "cost": {
              "input": 0.56,
              "output": 2.24
            }
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "bailing/Ling-2.5-1T"
        },
        "modelCatalog": {
          "bailing/Ling-2.5-1T": {
            "alias": "BaiLing"
          }
        }
      }
    },
    {
      "name": "Xiaomi MiMo",
      "websiteUrl": "https://platform.xiaomimimo.com",
      "apiKeyUrl": "https://platform.xiaomimimo.com/#/console/api-keys",
      "category": "cn_official",
      "icon": "xiaomimimo",
      "iconColor": "#000000",
      "badge": "",
      "configType": "openclaw",
      "apiProtocol": "openai-completions",
      "baseUrl": "https://api.xiaomimimo.com/v1",
      "model": "mimo-v2.5-pro",
      "models": [
        "mimo-v2.5-pro"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://api.xiaomimimo.com/v1",
        "apiKey": "",
        "api": "openai-completions",
        "models": [
          {
            "id": "mimo-v2.5-pro",
            "name": "MiMo V2.5 Pro",
            "reasoning": true,
            "input": [
              "text"
            ],
            "contextWindow": 1048576,
            "maxTokens": 131072,
            "cost": {
              "input": 1,
              "output": 3,
              "cacheRead": 0.2,
              "cacheWrite": 0
            }
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "xiaomimimo/mimo-v2.5-pro"
        },
        "modelCatalog": {
          "xiaomimimo/mimo-v2.5-pro": {
            "alias": "MiMo"
          }
        }
      }
    },
    {
      "name": "Xiaomi MiMo Token Plan (China)",
      "websiteUrl": "https://platform.xiaomimimo.com/#/token-plan",
      "apiKeyUrl": "https://platform.xiaomimimo.com/#/console/plan-manage",
      "category": "cn_official",
      "icon": "xiaomimimo",
      "iconColor": "#000000",
      "badge": "",
      "configType": "openclaw",
      "apiProtocol": "openai-completions",
      "baseUrl": "https://token-plan-cn.xiaomimimo.com/v1",
      "model": "mimo-v2.5-pro",
      "models": [
        "mimo-v2.5-pro",
        "mimo-v2.5"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://token-plan-cn.xiaomimimo.com/v1",
        "apiKey": "",
        "api": "openai-completions",
        "models": [
          {
            "id": "mimo-v2.5-pro",
            "name": "MiMo V2.5 Pro",
            "reasoning": true,
            "input": [
              "text"
            ],
            "contextWindow": 1048576,
            "maxTokens": 131072
          },
          {
            "id": "mimo-v2.5",
            "name": "MiMo V2.5",
            "reasoning": true,
            "input": [
              "text",
              "image"
            ],
            "contextWindow": 1048576,
            "maxTokens": 131072
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "xiaomi-mimo-token-plan/mimo-v2.5-pro"
        },
        "modelCatalog": {
          "xiaomi-mimo-token-plan/mimo-v2.5-pro": {
            "alias": "MiMo Token Plan (China)"
          },
          "xiaomi-mimo-token-plan/mimo-v2.5": {
            "alias": "MiMo Token Plan (China) Multimodal"
          }
        }
      }
    },
    {
      "name": "AiHubMix",
      "websiteUrl": "https://aihubmix.com",
      "apiKeyUrl": "https://aihubmix.com",
      "category": "aggregator",
      "icon": "aihubmix",
      "iconColor": "#006FFB",
      "badge": "",
      "configType": "openclaw",
      "apiProtocol": "anthropic-messages",
      "baseUrl": "https://aihubmix.com",
      "model": "claude-opus-4-8",
      "models": [
        "claude-opus-4-8",
        "claude-sonnet-5"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://aihubmix.com",
        "apiKey": "",
        "api": "anthropic-messages",
        "models": [
          {
            "id": "claude-opus-4-8",
            "name": "Claude Opus 4.8",
            "contextWindow": 1000000,
            "cost": {
              "input": 5,
              "output": 25
            }
          },
          {
            "id": "claude-sonnet-5",
            "name": "Claude Sonnet 5",
            "contextWindow": 1000000,
            "cost": {
              "input": 3,
              "output": 15
            }
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "aihubmix/claude-opus-4-8",
          "fallbacks": [
            "aihubmix/claude-sonnet-5"
          ]
        },
        "modelCatalog": {
          "aihubmix/claude-opus-4-8": {
            "alias": "Opus"
          },
          "aihubmix/claude-sonnet-5": {
            "alias": "Sonnet"
          }
        }
      }
    },
    {
      "name": "CherryIN",
      "websiteUrl": "https://open.cherryin.ai",
      "apiKeyUrl": "https://open.cherryin.ai/console/token",
      "category": "aggregator",
      "icon": "cherryin",
      "iconColor": "",
      "badge": "",
      "configType": "openclaw",
      "apiProtocol": "anthropic-messages",
      "baseUrl": "https://open.cherryin.net",
      "model": "anthropic/claude-opus-4.8",
      "models": [
        "anthropic/claude-opus-4.8",
        "anthropic/claude-sonnet-5"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://open.cherryin.net",
        "apiKey": "",
        "api": "anthropic-messages",
        "models": [
          {
            "id": "anthropic/claude-opus-4.8",
            "name": "Claude Opus 4.8",
            "contextWindow": 1000000
          },
          {
            "id": "anthropic/claude-sonnet-5",
            "name": "Claude Sonnet 5",
            "contextWindow": 1000000
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "cherryin/anthropic/claude-opus-4.8",
          "fallbacks": [
            "cherryin/anthropic/claude-sonnet-5"
          ]
        },
        "modelCatalog": {
          "cherryin/anthropic/claude-opus-4.8": {
            "alias": "Opus"
          },
          "cherryin/anthropic/claude-sonnet-5": {
            "alias": "Sonnet"
          }
        }
      }
    },
    {
      "name": "OpenRouter",
      "websiteUrl": "https://openrouter.ai",
      "apiKeyUrl": "https://openrouter.ai/keys",
      "category": "aggregator",
      "icon": "openrouter",
      "iconColor": "#6566F1",
      "badge": "",
      "configType": "openclaw",
      "apiProtocol": "openai-completions",
      "baseUrl": "https://openrouter.ai/api/v1",
      "model": "anthropic/claude-opus-4.8",
      "models": [
        "anthropic/claude-opus-4.8",
        "anthropic/claude-sonnet-5"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://openrouter.ai/api/v1",
        "apiKey": "",
        "api": "openai-completions",
        "models": [
          {
            "id": "anthropic/claude-opus-4.8",
            "name": "Claude Opus 4.8",
            "contextWindow": 1000000,
            "cost": {
              "input": 5,
              "output": 25
            }
          },
          {
            "id": "anthropic/claude-sonnet-5",
            "name": "Claude Sonnet 5",
            "contextWindow": 1000000,
            "cost": {
              "input": 3,
              "output": 15
            }
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "openrouter/anthropic/claude-opus-4.8",
          "fallbacks": [
            "openrouter/anthropic/claude-sonnet-5"
          ]
        },
        "modelCatalog": {
          "openrouter/anthropic/claude-opus-4.8": {
            "alias": "Opus"
          },
          "openrouter/anthropic/claude-sonnet-5": {
            "alias": "Sonnet"
          }
        }
      }
    },
    {
      "name": "TheRouter",
      "websiteUrl": "https://therouter.ai",
      "apiKeyUrl": "https://dashboard.therouter.ai",
      "category": "aggregator",
      "icon": "",
      "iconColor": "",
      "badge": "",
      "configType": "openclaw",
      "apiProtocol": "openai-completions",
      "baseUrl": "https://api.therouter.ai/v1",
      "model": "anthropic/claude-sonnet-5",
      "models": [
        "anthropic/claude-sonnet-5",
        "openai/gpt-5.3-codex",
        "openai/gpt-5.2",
        "google/gemini-3.5-flash",
        "qwen/qwen3-coder-480b"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://api.therouter.ai/v1",
        "apiKey": "",
        "api": "openai-completions",
        "models": [
          {
            "id": "anthropic/claude-sonnet-5",
            "name": "Claude Sonnet 5",
            "contextWindow": 1000000,
            "cost": {
              "input": 3,
              "output": 15,
              "cacheRead": 0.3,
              "cacheWrite": 3.75
            }
          },
          {
            "id": "openai/gpt-5.3-codex",
            "name": "GPT-5.3 Codex",
            "contextWindow": 400000,
            "cost": {
              "input": 5,
              "output": 40,
              "cacheRead": 0.5
            }
          },
          {
            "id": "openai/gpt-5.2",
            "name": "GPT-5.2",
            "contextWindow": 400000,
            "cost": {
              "input": 1.75,
              "output": 14,
              "cacheRead": 0.175
            }
          },
          {
            "id": "google/gemini-3.5-flash",
            "name": "Gemini 3.5 Flash",
            "contextWindow": 1000000,
            "cost": {
              "input": 1.5,
              "output": 9,
              "cacheRead": 0.15
            }
          },
          {
            "id": "qwen/qwen3-coder-480b",
            "name": "Qwen3 Coder 480B",
            "contextWindow": 262144,
            "cost": {
              "input": 0.6,
              "output": 2.35
            }
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "therouter/anthropic/claude-sonnet-5",
          "fallbacks": [
            "therouter/openai/gpt-5.2",
            "therouter/google/gemini-3.5-flash"
          ]
        },
        "modelCatalog": {
          "therouter/anthropic/claude-sonnet-5": {
            "alias": "Sonnet"
          },
          "therouter/openai/gpt-5.2": {
            "alias": "GPT-5.2"
          },
          "therouter/google/gemini-3.5-flash": {
            "alias": "Gemini Flash"
          },
          "therouter/openai/gpt-5.3-codex": {
            "alias": "Codex"
          },
          "therouter/qwen/qwen3-coder-480b": {
            "alias": "Qwen Coder"
          }
        }
      }
    },
    {
      "name": "ModelScope",
      "websiteUrl": "https://modelscope.cn",
      "apiKeyUrl": "https://modelscope.cn/my/myaccesstoken",
      "category": "aggregator",
      "icon": "modelscope",
      "iconColor": "#624AFF",
      "badge": "",
      "configType": "openclaw",
      "apiProtocol": "openai-completions",
      "baseUrl": "https://api-inference.modelscope.cn/v1",
      "model": "ZhipuAI/GLM-5.1",
      "models": [
        "ZhipuAI/GLM-5.1"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://api-inference.modelscope.cn/v1",
        "apiKey": "",
        "api": "openai-completions",
        "models": [
          {
            "id": "ZhipuAI/GLM-5.1",
            "name": "GLM-5.1",
            "contextWindow": 128000,
            "cost": {
              "input": 1.4,
              "output": 4.4,
              "cacheRead": 0.26
            }
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "modelscope/ZhipuAI/GLM-5.1"
        },
        "modelCatalog": {
          "modelscope/ZhipuAI/GLM-5.1": {
            "alias": "GLM"
          }
        }
      }
    },
    {
      "name": "Novita AI",
      "websiteUrl": "https://novita.ai",
      "apiKeyUrl": "https://novita.ai",
      "category": "aggregator",
      "icon": "novita",
      "iconColor": "#000000",
      "badge": "",
      "configType": "openclaw",
      "apiProtocol": "openai-completions",
      "baseUrl": "https://api.novita.ai/openai",
      "model": "zai-org/glm-5.1",
      "models": [
        "zai-org/glm-5.1"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://api.novita.ai/openai",
        "apiKey": "",
        "api": "openai-completions",
        "models": [
          {
            "id": "zai-org/glm-5.1",
            "name": "GLM-5.1",
            "contextWindow": 202800,
            "cost": {
              "input": 1,
              "output": 3.2,
              "cacheRead": 0.2
            }
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "novita/zai-org/glm-5.1"
        },
        "modelCatalog": {
          "novita/zai-org/glm-5.1": {
            "alias": "GLM-5.1"
          }
        }
      }
    },
    {
      "name": "Nvidia",
      "websiteUrl": "https://build.nvidia.com",
      "apiKeyUrl": "https://build.nvidia.com/settings/api-keys",
      "category": "aggregator",
      "icon": "nvidia",
      "iconColor": "#000000",
      "badge": "",
      "configType": "openclaw",
      "apiProtocol": "openai-completions",
      "baseUrl": "https://integrate.api.nvidia.com/v1",
      "model": "moonshotai/kimi-k2.5",
      "models": [
        "moonshotai/kimi-k2.5"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://integrate.api.nvidia.com/v1",
        "apiKey": "",
        "api": "openai-completions",
        "models": [
          {
            "id": "moonshotai/kimi-k2.5",
            "name": "Kimi K2.5",
            "contextWindow": 131072,
            "cost": {
              "input": 0.6,
              "output": 3,
              "cacheRead": 0.1
            }
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "nvidia/moonshotai/kimi-k2.5"
        },
        "modelCatalog": {
          "nvidia/moonshotai/kimi-k2.5": {
            "alias": "Kimi"
          }
        }
      }
    },
    {
      "name": "PIPELLM",
      "websiteUrl": "https://code.pipellm.ai",
      "apiKeyUrl": "https://code.pipellm.ai/login?ref=uvw650za",
      "category": "aggregator",
      "icon": "pipellm",
      "iconColor": "",
      "badge": "",
      "configType": "openclaw",
      "apiProtocol": "anthropic-messages",
      "baseUrl": "https://cc-api.pipellm.ai",
      "model": "claude-opus-4-8",
      "models": [
        "claude-opus-4-8",
        "claude-sonnet-5",
        "claude-haiku-4-5-20251001"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://cc-api.pipellm.ai",
        "apiKey": "",
        "api": "anthropic-messages",
        "models": [
          {
            "id": "claude-opus-4-8",
            "name": "claude-opus-4-8",
            "contextWindow": 1000000,
            "cost": {
              "input": 5,
              "output": 25
            }
          },
          {
            "id": "claude-sonnet-5",
            "name": "claude-sonnet-5",
            "contextWindow": 1000000,
            "cost": {
              "input": 3,
              "output": 15
            }
          },
          {
            "id": "claude-haiku-4-5-20251001",
            "name": "claude-haiku-4-5-20251001",
            "contextWindow": 200000,
            "cost": {
              "input": 0.8,
              "output": 4
            }
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "pipellm/claude-opus-4-8",
          "fallbacks": [
            "pipellm/claude-sonnet-5"
          ]
        },
        "modelCatalog": {
          "pipellm/claude-opus-4-8": {
            "alias": "Opus"
          },
          "pipellm/claude-sonnet-5": {
            "alias": "Sonnet"
          },
          "pipellm/claude-haiku-4-5-20251001": {
            "alias": "Haiku"
          }
        }
      }
    },
    {
      "name": "E-FlowCode",
      "websiteUrl": "https://e-flowcode.cc",
      "apiKeyUrl": "https://e-flowcode.cc",
      "category": "third_party",
      "icon": "eflowcode",
      "iconColor": "#000000",
      "badge": "",
      "configType": "openclaw",
      "apiProtocol": "openai-responses",
      "baseUrl": "https://e-flowcode.cc/v1",
      "model": "gpt-5.3-codex",
      "models": [
        "gpt-5.3-codex",
        "gpt-5.5",
        "gpt-5.2-codex",
        "gpt-5.2"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "api": "openai-responses",
        "apiKey": "",
        "baseUrl": "https://e-flowcode.cc/v1",
        "headers": {
          "User-Agent": "codex_cli_rs/0.77.0 (Windows 10.0.26100; x86_64) WindowsTerminal"
        },
        "models": [
          {
            "contextWindow": 200000,
            "cost": {
              "cacheRead": 0,
              "cacheWrite": 0,
              "input": 0,
              "output": 0
            },
            "id": "gpt-5.3-codex",
            "maxTokens": 32000,
            "name": "gpt-5.3-codex"
          },
          {
            "id": "gpt-5.5",
            "name": "gpt-5.5"
          },
          {
            "id": "gpt-5.2-codex",
            "name": "gpt-5.2-codex"
          },
          {
            "id": "gpt-5.2",
            "name": "gpt-5.2"
          }
        ]
      },
      "suggestedDefaults": {
        "model": {
          "primary": "eflowcode/gpt-5.3-codex",
          "fallbacks": [
            "eflowcode/gpt-5.5",
            "eflowcode/gpt-5.2-codex"
          ]
        },
        "modelCatalog": {
          "eflowcode/gpt-5.3-codex": {
            "alias": "gpt-5.3-codex"
          },
          "eflowcode/gpt-5.5": {
            "alias": "gpt-5.5"
          },
          "eflowcode/gpt-5.2-codex": {
            "alias": "gpt-5.2-codex"
          },
          "eflowcode/gpt-5.2": {
            "alias": "gpt-5.2"
          }
        }
      }
    },
    {
      "name": "AWS Bedrock",
      "websiteUrl": "https://aws.amazon.com/bedrock/",
      "apiKeyUrl": "",
      "category": "cloud_provider",
      "icon": "aws",
      "iconColor": "#FF9900",
      "badge": "",
      "configType": "openclaw",
      "apiProtocol": "bedrock-converse-stream",
      "baseUrl": "https://bedrock-runtime.us-west-2.amazonaws.com",
      "model": "anthropic.claude-opus-4-8",
      "models": [
        "anthropic.claude-opus-4-8",
        "anthropic.claude-sonnet-5",
        "anthropic.claude-haiku-4-5-20251022-v1:0"
      ],
      "endpointCandidates": [],
      "settingsConfig": {
        "baseUrl": "https://bedrock-runtime.us-west-2.amazonaws.com",
        "apiKey": "",
        "api": "bedrock-converse-stream",
        "models": [
          {
            "id": "anthropic.claude-opus-4-8",
            "name": "Claude Opus 4.8",
            "contextWindow": 1000000,
            "cost": {
              "input": 5,
              "output": 25,
              "cacheRead": 0.5,
              "cacheWrite": 6.25
            }
          },
          {
            "id": "anthropic.claude-sonnet-5",
            "name": "Claude Sonnet 5",
            "contextWindow": 1000000,
            "cost": {
              "input": 3,
              "output": 15,
              "cacheRead": 0.3,
              "cacheWrite": 3.75
            }
          },
          {
            "id": "anthropic.claude-haiku-4-5-20251022-v1:0",
            "name": "Claude Haiku 4.5",
            "contextWindow": 200000,
            "cost": {
              "input": 0.8,
              "output": 4,
              "cacheRead": 0.08,
              "cacheWrite": 1
            }
          }
        ]
      },
      "suggestedDefaults": null
    }
  ],
  "gemini": [
    {
      "name": "Google Official",
      "websiteUrl": "https://ai.google.dev/",
      "apiKeyUrl": "https://aistudio.google.com/apikey",
      "category": "official",
      "icon": "gemini",
      "iconColor": "#4285F4",
      "badge": "official",
      "configType": "gemini",
      "baseUrl": "",
      "model": "",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {}
      }
    },
    {
      "name": "PackyCode",
      "websiteUrl": "https://www.packyapi.com",
      "apiKeyUrl": "https://www.packyapi.com/register?aff=cc-switch",
      "category": "third_party",
      "icon": "packycode",
      "iconColor": "",
      "badge": "partner",
      "configType": "gemini",
      "baseUrl": "https://www.packyapi.com",
      "model": "gemini-3.5-flash",
      "endpointCandidates": [
        "https://api-slb.packyapi.com",
        "https://www.packyapi.com"
      ],
      "settingsConfig": {
        "env": {
          "GOOGLE_GEMINI_BASE_URL": "https://www.packyapi.com",
          "GEMINI_MODEL": "gemini-3.5-flash"
        }
      }
    },
    {
      "name": "APINebula",
      "websiteUrl": "https://apinebula.com",
      "apiKeyUrl": "https://apinebula.com/VjM74M",
      "category": "third_party",
      "icon": "apinebula",
      "iconColor": "",
      "badge": "partner",
      "configType": "gemini",
      "baseUrl": "https://apinebula.com",
      "model": "gemini-3.5-flash",
      "endpointCandidates": [
        "https://apinebula.com"
      ],
      "settingsConfig": {
        "env": {
          "GOOGLE_GEMINI_BASE_URL": "https://apinebula.com",
          "GEMINI_API_KEY": "",
          "GEMINI_MODEL": "gemini-3.5-flash"
        }
      }
    },
    {
      "name": "AICodeMirror",
      "websiteUrl": "https://www.aicodemirror.com",
      "apiKeyUrl": "https://www.aicodemirror.com/register?invitecode=9915W3",
      "category": "third_party",
      "icon": "aicodemirror",
      "iconColor": "#000000",
      "badge": "partner",
      "configType": "gemini",
      "baseUrl": "https://api.aicodemirror.com/api/gemini",
      "model": "gemini-3.5-flash",
      "endpointCandidates": [
        "https://api.aicodemirror.com/api/gemini",
        "https://api.claudecode.net.cn/api/gemini"
      ],
      "settingsConfig": {
        "env": {
          "GOOGLE_GEMINI_BASE_URL": "https://api.aicodemirror.com/api/gemini",
          "GEMINI_MODEL": "gemini-3.5-flash"
        }
      }
    },
    {
      "name": "Unity2.ai",
      "websiteUrl": "https://unity2.ai",
      "apiKeyUrl": "https://unity2.ai/register?source=ccs",
      "category": "aggregator",
      "icon": "unity2",
      "iconColor": "",
      "badge": "partner",
      "configType": "gemini",
      "baseUrl": "https://api.unity2.ai",
      "model": "gemini-3.1-pro",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "GOOGLE_GEMINI_BASE_URL": "https://api.unity2.ai",
          "GEMINI_MODEL": "gemini-3.1-pro"
        }
      }
    },
    {
      "name": "Shengsuanyun",
      "websiteUrl": "https://www.shengsuanyun.com/?from=CH_4HHXMRYF",
      "apiKeyUrl": "https://www.shengsuanyun.com/?from=CH_4HHXMRYF",
      "category": "aggregator",
      "icon": "shengsuanyun",
      "iconColor": "",
      "badge": "partner",
      "configType": "gemini",
      "baseUrl": "https://router.shengsuanyun.com/api",
      "model": "google/gemini-3.5-flash",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "GOOGLE_GEMINI_BASE_URL": "https://router.shengsuanyun.com/api",
          "GEMINI_MODEL": "google/gemini-3.5-flash"
        }
      }
    },
    {
      "name": "AIGoCode",
      "websiteUrl": "https://aigocode.com",
      "apiKeyUrl": "https://aigocode.com/invite/CC-SWITCH",
      "category": "third_party",
      "icon": "aigocode",
      "iconColor": "#5B7FFF",
      "badge": "partner",
      "configType": "gemini",
      "baseUrl": "https://api.aigocode.com",
      "model": "gemini-3.5-flash",
      "endpointCandidates": [
        "https://api.aigocode.com"
      ],
      "settingsConfig": {
        "env": {
          "GOOGLE_GEMINI_BASE_URL": "https://api.aigocode.com",
          "GEMINI_MODEL": "gemini-3.5-flash"
        }
      }
    },
    {
      "name": "SubRouter",
      "websiteUrl": "https://subrouter.ai",
      "apiKeyUrl": "https://subrouter.ai/register?aff=l3ri",
      "category": "aggregator",
      "icon": "subrouter",
      "iconColor": "",
      "badge": "partner",
      "configType": "gemini",
      "baseUrl": "https://subrouter.ai/v1beta",
      "model": "gemini-3.5-flash",
      "endpointCandidates": [
        "https://subrouter.ai/v1beta"
      ],
      "settingsConfig": {
        "env": {
          "GOOGLE_GEMINI_BASE_URL": "https://subrouter.ai/v1beta",
          "GEMINI_MODEL": "gemini-3.5-flash"
        }
      }
    },
    {
      "name": "APIKEY.FUN",
      "websiteUrl": "https://apikey.fun",
      "apiKeyUrl": "https://apikey.fun/register?aff=CCSwitch",
      "category": "third_party",
      "icon": "apikeyfun",
      "iconColor": "",
      "badge": "partner",
      "configType": "gemini",
      "baseUrl": "https://api.apikey.fun",
      "model": "gemini-3.5-flash",
      "endpointCandidates": [
        "https://api.apikey.fun",
        "https://slb.apikey.fun"
      ],
      "settingsConfig": {
        "env": {
          "GOOGLE_GEMINI_BASE_URL": "https://api.apikey.fun",
          "GEMINI_API_KEY": "",
          "GEMINI_MODEL": "gemini-3.5-flash"
        }
      }
    },
    {
      "name": "Code0",
      "websiteUrl": "https://code0.ai",
      "apiKeyUrl": "https://code0.ai/agent/register/B2XHxGjGmRvqgznY",
      "category": "aggregator",
      "icon": "code0",
      "iconColor": "",
      "badge": "partner",
      "configType": "gemini",
      "baseUrl": "https://code0.ai",
      "model": "gemini-3.1-pro-preview",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "GOOGLE_GEMINI_BASE_URL": "https://code0.ai",
          "GEMINI_MODEL": "gemini-3.1-pro-preview"
        }
      }
    },
    {
      "name": "SSSAiCode",
      "websiteUrl": "https://sssaicodeapi.com",
      "apiKeyUrl": "https://sssaicodeapi.com/register?ref=DCP0SM",
      "category": "third_party",
      "icon": "sssaicode",
      "iconColor": "#000000",
      "badge": "partner",
      "configType": "gemini",
      "baseUrl": "https://node-hk.sssaicodeapi.com/api",
      "model": "gemini-3.5-flash",
      "endpointCandidates": [
        "https://node-hk.sssaicodeapi.com/api",
        "https://node-hk.sssaiapi.com/api",
        "https://node-cf.sssaicodeapi.com/api"
      ],
      "settingsConfig": {
        "env": {
          "GOOGLE_GEMINI_BASE_URL": "https://node-hk.sssaicodeapi.com/api",
          "GEMINI_MODEL": "gemini-3.5-flash"
        }
      }
    },
    {
      "name": "ETok.ai",
      "websiteUrl": "https://etok.ai",
      "apiKeyUrl": "https://etok.ai",
      "category": "third_party",
      "icon": "etok",
      "iconColor": "#000000",
      "badge": "partner",
      "configType": "gemini",
      "baseUrl": "https://api.etok.ai/v1beta",
      "model": "gemini-3.5-flash",
      "endpointCandidates": [
        "https://api.etok.ai/v1beta"
      ],
      "settingsConfig": {
        "env": {
          "GOOGLE_GEMINI_BASE_URL": "https://api.etok.ai/v1beta",
          "GEMINI_MODEL": "gemini-3.5-flash"
        }
      }
    },
    {
      "name": "Cubence",
      "websiteUrl": "https://cubence.com",
      "apiKeyUrl": "https://cubence.com/signup?code=CCSWITCH&source=ccs",
      "category": "third_party",
      "icon": "cubence",
      "iconColor": "#000000",
      "badge": "partner",
      "configType": "gemini",
      "baseUrl": "https://api.cubence.com",
      "model": "gemini-3.5-flash",
      "endpointCandidates": [
        "https://api.cubence.com/v1",
        "https://api-cf.cubence.com/v1",
        "https://api-dmit.cubence.com/v1",
        "https://api-bwg.cubence.com/v1"
      ],
      "settingsConfig": {
        "env": {
          "GOOGLE_GEMINI_BASE_URL": "https://api.cubence.com",
          "GEMINI_MODEL": "gemini-3.5-flash"
        }
      }
    },
    {
      "name": "CrazyRouter",
      "websiteUrl": "https://www.crazyrouter.com",
      "apiKeyUrl": "https://www.crazyrouter.com/register?aff=OZcm&ref=cc-switch",
      "category": "third_party",
      "icon": "crazyrouter",
      "iconColor": "#000000",
      "badge": "partner",
      "configType": "gemini",
      "baseUrl": "https://cn.crazyrouter.com",
      "model": "gemini-3.5-flash",
      "endpointCandidates": [
        "https://cn.crazyrouter.com"
      ],
      "settingsConfig": {
        "env": {
          "GOOGLE_GEMINI_BASE_URL": "https://cn.crazyrouter.com",
          "GEMINI_MODEL": "gemini-3.5-flash"
        }
      }
    },
    {
      "name": "Qiniu",
      "websiteUrl": "https://s.qiniu.com/nMvAvy",
      "apiKeyUrl": "https://s.qiniu.com/nMvAvy",
      "category": "aggregator",
      "icon": "qiniu",
      "iconColor": "",
      "badge": "partner",
      "configType": "gemini",
      "baseUrl": "https://api.qnaigc.com/bypass/vertex",
      "model": "gemini-3.1-pro-preview",
      "endpointCandidates": [
        "https://api.qnaigc.com/bypass/vertex",
        "https://api.modelink.ai/bypass/vertex"
      ],
      "settingsConfig": {
        "env": {
          "GOOGLE_GEMINI_BASE_URL": "https://api.qnaigc.com/bypass/vertex",
          "GEMINI_MODEL": "gemini-3.1-pro-preview"
        }
      }
    },
    {
      "name": "SudoCode.us",
      "websiteUrl": "https://sudocode.us",
      "apiKeyUrl": "https://sudocode.us",
      "category": "third_party",
      "icon": "sudocode-us",
      "iconColor": "",
      "badge": "partner",
      "configType": "gemini",
      "baseUrl": "https://sudocode.us",
      "model": "gemini-3.1-flash-lite",
      "endpointCandidates": [
        "https://sudocode.us",
        "https://sudocode.run"
      ],
      "settingsConfig": {
        "env": {
          "GOOGLE_GEMINI_BASE_URL": "https://sudocode.us",
          "GEMINI_API_KEY": "",
          "GEMINI_MODEL": "gemini-3.1-flash-lite"
        }
      }
    },
    {
      "name": "E-FlowCode",
      "websiteUrl": "https://e-flowcode.cc",
      "apiKeyUrl": "https://e-flowcode.cc",
      "category": "third_party",
      "icon": "eflowcode",
      "iconColor": "#000000",
      "badge": "",
      "configType": "gemini",
      "baseUrl": "https://e-flowcode.cc",
      "model": "gemini-3.5-flash",
      "endpointCandidates": [
        "https://e-flowcode.cc"
      ],
      "settingsConfig": {
        "env": {
          "GOOGLE_GEMINI_BASE_URL": "https://e-flowcode.cc",
          "GEMINI_API_KEY": "",
          "GEMINI_MODEL": "gemini-3.5-flash"
        },
        "config": {
          "general": {
            "previewFeatures": true,
            "sessionRetention": {
              "enabled": true,
              "maxAge": "30d",
              "warningAcknowledged": true
            }
          },
          "mcpServers": {},
          "security": {
            "auth": {
              "selectedType": "gemini-api-key"
            }
          }
        }
      }
    },
    {
      "name": "CherryIN",
      "websiteUrl": "https://open.cherryin.ai",
      "apiKeyUrl": "https://open.cherryin.ai/console/token",
      "category": "aggregator",
      "icon": "cherryin",
      "iconColor": "",
      "badge": "",
      "configType": "gemini",
      "baseUrl": "https://open.cherryin.net",
      "model": "google/gemini-3.5-flash",
      "endpointCandidates": [
        "https://open.cherryin.net"
      ],
      "settingsConfig": {
        "env": {
          "GOOGLE_GEMINI_BASE_URL": "https://open.cherryin.net",
          "GEMINI_API_KEY": "",
          "GEMINI_MODEL": "google/gemini-3.5-flash"
        }
      }
    },
    {
      "name": "OpenRouter",
      "websiteUrl": "https://openrouter.ai",
      "apiKeyUrl": "https://openrouter.ai/keys",
      "category": "aggregator",
      "icon": "openrouter",
      "iconColor": "#6566F1",
      "badge": "",
      "configType": "gemini",
      "baseUrl": "https://openrouter.ai/api",
      "model": "gemini-3.5-flash",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "GOOGLE_GEMINI_BASE_URL": "https://openrouter.ai/api",
          "GEMINI_MODEL": "gemini-3.5-flash"
        }
      }
    },
    {
      "name": "TheRouter",
      "websiteUrl": "https://therouter.ai",
      "apiKeyUrl": "https://dashboard.therouter.ai",
      "category": "aggregator",
      "icon": "",
      "iconColor": "",
      "badge": "",
      "configType": "gemini",
      "baseUrl": "https://api.therouter.ai",
      "model": "gemini-3.5-flash",
      "endpointCandidates": [
        "https://api.therouter.ai"
      ],
      "settingsConfig": {
        "env": {
          "GOOGLE_GEMINI_BASE_URL": "https://api.therouter.ai",
          "GEMINI_MODEL": "gemini-3.5-flash"
        }
      }
    },
    {
      "name": "自定义",
      "websiteUrl": "",
      "apiKeyUrl": "",
      "category": "custom",
      "icon": "",
      "iconColor": "",
      "badge": "",
      "configType": "gemini",
      "baseUrl": "",
      "model": "gemini-3.5-flash",
      "endpointCandidates": [],
      "settingsConfig": {
        "env": {
          "GOOGLE_GEMINI_BASE_URL": "",
          "GEMINI_MODEL": "gemini-3.5-flash"
        }
      }
    }
  ]
};

export default PRESETS;
