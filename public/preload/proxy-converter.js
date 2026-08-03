function extractContent(item) {
    if (!item || !item.content)
        return '';
    if (typeof item.content === 'string')
        return item.content;
    if (Array.isArray(item.content)) {
        return item.content.map(function (c) {
            if (c.type === 'input_text' || c.type === 'text')
                return c.text || '';
            if (c.type === 'input_image' || c.type === 'image')
                return '[image]';
            return '';
        }).join('\n');
    }
    return '';
}
function extractContentFromChat(choice) {
    var msg = choice.message || choice.delta || {};
    var text = msg.content !== undefined && msg.content !== null ? msg.content : undefined;
    var reasoningContent = msg.reasoning_content !== undefined && msg.reasoning_content !== null ? msg.reasoning_content : undefined;
    var toolCalls = msg.tool_calls;
    return { text: text, reasoningContent: reasoningContent, toolCalls: toolCalls, finishReason: choice.finish_reason };
}
function mapRoleForChat(role) {
    if (role === 'developer')
        return 'system';
    if (role === 'system' || role === 'assistant' || role === 'user' || role === 'tool')
        return role;
    return 'user';
}
function mapRoleForAnthropic(role) {
    if (role === 'assistant')
        return 'assistant';
    return 'user';
}
function responsesToChat(body, model) {
    var messages = [];
    if (body.instructions) {
        messages.push({ role: 'system', content: body.instructions });
    }
    if (typeof body.input === 'string') {
        messages.push({ role: 'user', content: body.input });
    }
    else if (Array.isArray(body.input)) {
        body.input.forEach(function (item) {
            if (item.type === 'message' && item.role) {
                var c = extractContent(item);
                if (c)
                    messages.push({ role: mapRoleForChat(item.role), content: c });
            }
            else if (item.type === 'function_call') {
                messages.push({
                    role: 'assistant',
                    content: null,
                    tool_calls: [{
                            id: item.call_id || item.id || '',
                            type: 'function',
                            function: { name: item.name || '', arguments: item.arguments || '' },
                        }],
                });
            }
            else if (item.type === 'function_call_output') {
                var out = item.output;
                if (typeof out !== 'string') {
                    try {
                        out = JSON.stringify(out);
                    }
                    catch (e) {
                        out = String(out);
                    }
                }
                messages.push({ role: 'tool', tool_call_id: item.call_id || item.id || '', content: out });
            }
        });
    }
    var chatReq = {
        model: model || body.model || 'gpt-4o',
        messages: messages,
        stream: true,
    };
    if (body.tools)
        chatReq.tools = body.tools.map(function (t) {
            if (t.type === 'function' && t.function)
                return t;
            if (t.type === 'function' || t.name) {
                return { type: 'function', function: { name: t.name, description: t.description || '', parameters: t.parameters || t.input_schema || {} } };
            }
            return t;
        });
    if (body.tool_choice)
        chatReq.tool_choice = body.tool_choice;
    if (body.parallel_tool_calls !== undefined)
        chatReq.parallel_tool_calls = body.parallel_tool_calls;
    if (body.reasoning && body.reasoning.effort)
        chatReq.reasoning_effort = body.reasoning.effort;
    if (body.max_output_tokens)
        chatReq.max_tokens = body.max_output_tokens;
    if (body.temperature !== undefined)
        chatReq.temperature = body.temperature;
    var hasTools = Array.isArray(chatReq.tools) && chatReq.tools.length > 0;
    if (!hasTools) {
        delete chatReq.tools;
        delete chatReq.tool_choice;
        delete chatReq.parallel_tool_calls;
    }
    if (chatReq.stream)
        chatReq.stream_options = { include_usage: true };
    return chatReq;
}
function sseChatToResponses(raw, respId, state) {
    var lines = [];
    function finalizeReasoning() {
        if (!state.reasoningAdded || state.reasoningDone)
            return;
        var outputIndex = state.reasoningOutputIndex || 0;
        var itemId = state.reasoningItemId;
        var text = state.reasoningText || '';
        lines.push('event: response.reasoning_summary_text.done');
        lines.push('data: ' + JSON.stringify({
            type: 'response.reasoning_summary_text.done',
            item_id: itemId,
            output_index: outputIndex,
            summary_index: 0,
            text: text
        }));
        lines.push('event: response.reasoning_summary_part.done');
        lines.push('data: ' + JSON.stringify({
            type: 'response.reasoning_summary_part.done',
            item_id: itemId,
            output_index: outputIndex,
            summary_index: 0,
            part: { type: 'summary_text', text: text }
        }));
        lines.push('event: response.output_item.done');
        lines.push('data: ' + JSON.stringify({
            type: 'response.output_item.done',
            output_index: outputIndex,
            item: {
                id: itemId,
                type: 'reasoning',
                summary: [{ type: 'summary_text', text: text }]
            }
        }));
        state.reasoningDone = true;
        if (!state.responseJson.output)
            state.responseJson.output = [];
        state.responseJson.output.push({
            id: itemId,
            type: 'reasoning',
            summary: [{ type: 'summary_text', text: text }]
        });
    }
    raw.split('\n').forEach(function (line) {
        if (line.indexOf('data: ') !== 0)
            return;
        var payload = line.slice(6);
        if (payload === '[DONE]') {
            finalizeReasoning();
            if (state.text) {
                lines.push('event: response.output_text.done');
                lines.push('data: ' + JSON.stringify({
                    type: 'response.output_text.done',
                    output_index: state.msgOutputIndex || 0,
                    content_index: 0,
                    text: state.text
                }));
                lines.push('event: response.content_part.done');
                lines.push('data: ' + JSON.stringify({
                    type: 'response.content_part.done',
                    output_index: state.msgOutputIndex || 0,
                    content_index: 0,
                    part: { type: 'output_text', text: state.text, annotations: [] }
                }));
            }
            if (state.msgId) {
                var content = [];
                if (state.text)
                    content.push({ type: 'output_text', text: state.text, annotations: [] });
                Object.keys(state.toolCalls || {})
                    .sort(function (a, b) { return Number(a) - Number(b); })
                    .forEach(function (k) {
                    var tc = state.toolCalls[k];
                    if (!tc)
                        return;
                    lines.push('event: response.function_call_arguments.done');
                    lines.push('data: ' + JSON.stringify({
                        type: 'response.function_call_arguments.done',
                        output_index: tc._outputIndex || 0,
                        item_id: tc.id,
                        arguments: tc.arguments || ''
                    }));
                    var doneEvt = { type: 'function_call', id: tc.id, call_id: tc.id, name: tc.name || '', arguments: tc.arguments || '', status: 'completed' };
                    lines.push('event: response.output_item.done');
                    lines.push('data: ' + JSON.stringify({
                        type: 'response.output_item.done',
                        output_index: tc._outputIndex || 0,
                        item: doneEvt
                    }));
                    content.push(doneEvt);
                });
                lines.push('event: response.output_item.done');
                lines.push('data: ' + JSON.stringify({
                    type: 'response.output_item.done',
                    output_index: state.msgOutputIndex || 0,
                    item: { type: 'message', id: state.msgId, status: 'completed', role: 'assistant', content: content }
                }));
                state.responseJson.output = state.responseJson.output || [];
                state.responseJson.output.push({ type: 'message', id: state.msgId, status: 'completed', role: 'assistant', content: content });
                lines.push('event: response.completed');
                lines.push('data: ' + JSON.stringify({ type: 'response.completed', response: state.responseJson }));
                state.doneSent = true;
            }
            return;
        }
        try {
            var d = JSON.parse(payload);
            if (!d.choices || !d.choices.length)
                return;
            var choice = d.choices[0];
            var info = extractContentFromChat(choice);
            var idx = choice.index || 0;
            if (!state.msgId) {
                state.msgId = 'msg_' + (d.id || 'chatcmpl') + '_' + idx;
                state.outputId = 'output_' + (d.id || 'chat') + '_' + idx;
                state.responseJson = state.responseJson || {};
                state.responseJson.id = 'resp_' + (d.id || 'chat');
                state.responseJson.object = 'response';
                state.responseJson.created_at = Math.floor(Date.now() / 1000);
                state.responseJson.status = 'completed';
                state.responseJson.model = d.model || '';
                state.responseJson.output = [];
                state.nextOutputIndex = 0;
            }
            if (info.reasoningContent) {
                if (!state.reasoningAdded) {
                    var outputIndex = state.nextOutputIndex++;
                    var itemId = 'rs_' + (state.responseJson.id || 'resp');
                    state.reasoningAdded = true;
                    state.reasoningText = '';
                    state.reasoningItemId = itemId;
                    state.reasoningOutputIndex = outputIndex;
                    lines.push('event: response.output_item.added');
                    lines.push('data: ' + JSON.stringify({
                        type: 'response.output_item.added',
                        output_index: outputIndex,
                        item: { id: itemId, type: 'reasoning', status: 'in_progress', summary: [] }
                    }));
                    lines.push('event: response.reasoning_summary_part.added');
                    lines.push('data: ' + JSON.stringify({
                        type: 'response.reasoning_summary_part.added',
                        item_id: itemId,
                        output_index: outputIndex,
                        summary_index: 0,
                        part: { type: 'summary_text', text: '' }
                    }));
                }
                state.reasoningText += info.reasoningContent;
                lines.push('event: response.reasoning_summary_text.delta');
                lines.push('data: ' + JSON.stringify({
                    type: 'response.reasoning_summary_text.delta',
                    item_id: state.reasoningItemId,
                    output_index: state.reasoningOutputIndex,
                    summary_index: 0,
                    delta: info.reasoningContent
                }));
            }
            if (info.text) {
                finalizeReasoning();
                if (!state.textAdded) {
                    state.textAdded = true;
                    state.msgOutputIndex = state.nextOutputIndex++;
                    lines.push('event: response.output_item.added');
                    lines.push('data: ' + JSON.stringify({
                        type: 'response.output_item.added',
                        output_index: state.msgOutputIndex,
                        item: { type: 'message', id: state.msgId, status: 'in_progress', role: 'assistant', content: [] }
                    }));
                    lines.push('event: response.content_part.added');
                    lines.push('data: ' + JSON.stringify({
                        type: 'response.content_part.added',
                        output_index: state.msgOutputIndex,
                        content_index: 0,
                        part: { type: 'output_text', text: '' }
                    }));
                }
                lines.push('event: response.output_text.delta');
                lines.push('data: ' + JSON.stringify({
                    type: 'response.output_text.delta',
                    output_index: state.msgOutputIndex,
                    content_index: 0,
                    delta: info.text
                }));
                state.text = (state.text || '') + info.text;
            }
            if (info.toolCalls && info.toolCalls.length) {
                finalizeReasoning();
                info.toolCalls.forEach(function (tc) {
                    if (!state.toolCalls)
                        state.toolCalls = {};
                    var key = (tc.index !== undefined && tc.index !== null) ? tc.index : (tc.id || 0);
                    if (!state.toolCalls[key]) {
                        state.toolCalls[key] = { id: tc.id || ('call_' + key), name: '', arguments: '' };
                        state.toolCalls[key]._added = false;
                    }
                    var slot = state.toolCalls[key];
                    if (tc.id)
                        slot.id = tc.id;
                    if (tc.function && tc.function.name)
                        slot.name = tc.function.name;
                    if (!slot._added && slot.name) {
                        slot._added = true;
                        slot._outputIndex = state.nextOutputIndex++;
                        lines.push('event: response.output_item.added');
                        lines.push('data: ' + JSON.stringify({
                            type: 'response.output_item.added',
                            output_index: slot._outputIndex,
                            item: { type: 'function_call', id: slot.id, call_id: slot.id, name: slot.name, arguments: '', status: 'in_progress' }
                        }));
                    }
                    var delta = tc.function && tc.function.arguments || '';
                    if (delta) {
                        slot.arguments += delta;
                        lines.push('event: response.function_call_arguments.delta');
                        lines.push('data: ' + JSON.stringify({
                            type: 'response.function_call_arguments.delta',
                            output_index: slot._outputIndex || 0,
                            item_id: slot.id,
                            delta: delta
                        }));
                    }
                });
            }
            if (d.usage) {
                state.responseJson.usage = d.usage;
            }
        }
        catch (e) { }
    });
    return lines.join('\n') + (lines.length ? '\n' : '');
}
function chatToResponses(chatResp, model) {
    var resp = {
        id: 'resp_' + (chatResp.id || 'chat'),
        object: 'response',
        created_at: Math.floor(Date.now() / 1000),
        status: 'completed',
        model: model || chatResp.model || '',
        usage: chatResp.usage || {},
        output: [],
    };
    if (chatResp.choices && chatResp.choices.length) {
        chatResp.choices.forEach(function (choice) {
            var msg = choice.message || {};
            var content = [];
            if (msg.content)
                content.push({ type: 'output_text', text: msg.content, annotations: [] });
            if (msg.tool_calls) {
                msg.tool_calls.forEach(function (tc) {
                    content.push({
                        type: 'function_call',
                        id: tc.id,
                        call_id: tc.id,
                        name: tc.function && tc.function.name || '',
                        arguments: tc.function && tc.function.arguments || '',
                        status: 'completed',
                    });
                });
            }
            resp.output.push({
                type: 'message',
                id: 'msg_' + (chatResp.id || 'chat') + '_' + choice.index,
                role: 'assistant',
                content: content,
                status: 'completed',
            });
        });
    }
    resp.output_text = chatResp.choices && chatResp.choices[0] && chatResp.choices[0].message && chatResp.choices[0].message.content || '';
    return resp;
}
function responsesToAnthropic(body, model) {
    var system = body.instructions || '';
    var messages = [];
    if (typeof body.input === 'string') {
        messages.push({ role: 'user', content: body.input });
    }
    else if (Array.isArray(body.input)) {
        body.input.forEach(function (item) {
            if (item.type === 'message' && item.role) {
                var c = extractContent(item);
                if (!c)
                    return;
                if (item.role === 'system' || item.role === 'developer') {
                    system = system ? (system + '\n\n' + c) : c;
                }
                else {
                    messages.push({ role: mapRoleForAnthropic(item.role), content: c });
                }
            }
            else if (item.type === 'function_call') {
                var input = {};
                try {
                    input = item.arguments ? JSON.parse(item.arguments) : {};
                }
                catch (e) {
                    input = {};
                }
                messages.push({
                    role: 'assistant',
                    content: [{ type: 'tool_use', id: item.call_id || item.id || '', name: item.name || '', input: input }],
                });
            }
            else if (item.type === 'function_call_output') {
                var out = item.output;
                if (typeof out !== 'string') {
                    try {
                        out = JSON.stringify(out);
                    }
                    catch (e) {
                        out = String(out);
                    }
                }
                messages.push({
                    role: 'user',
                    content: [{ type: 'tool_result', tool_use_id: item.call_id || item.id || '', content: out }],
                });
            }
        });
    }
    var anthReq = {
        model: model || body.model || 'claude-sonnet-4-20250514',
        messages: messages,
        max_tokens: Number(body.max_output_tokens) || 8192,
        stream: true,
    };
    if (system)
        anthReq.system = system;
    if (body.tools)
        anthReq.tools = body.tools.map(function (t) {
            return { name: t.name || t.function && t.function.name || '', description: t.description || t.function && t.function.description || '', input_schema: t.input_schema || t.parameters || t.function && t.function.parameters || {} };
        });
    if (body.temperature !== undefined)
        anthReq.temperature = body.temperature;
    return anthReq;
}
function sseAnthropicToResponses(raw, respId, state) {
    var lines = [];
    raw.split('\n').forEach(function (line) {
        if (line.indexOf('event: ') === 0)
            return;
        if (line.indexOf('data: ') !== 0)
            return;
        try {
            var d = JSON.parse(line.slice(6));
            if (d.type === 'message_start') {
                state.msgId = d.message && d.message.id || 'msg_anth';
                state.responseJson = state.responseJson || {};
                state.responseJson.id = 'resp_anth_' + (d.message && d.message.id || '');
                state.responseJson.object = 'response';
                state.responseJson.created = Math.floor(Date.now() / 1000);
                state.responseJson.model = d.message && d.message.model || '';
                state.responseJson.output = [];
                state.text = '';
                state.toolCalls = {};
                state.nextOutputIndex = 0;
                state.msgOutputIndex = state.nextOutputIndex++;
                lines.push('event: response.output_item.added');
                lines.push('data: ' + JSON.stringify({
                    type: 'response.output_item.added',
                    output_index: state.msgOutputIndex,
                    item: { type: 'message', id: state.msgId, status: 'in_progress', role: 'assistant', content: [] }
                }));
                lines.push('event: response.content_part.added');
                lines.push('data: ' + JSON.stringify({
                    type: 'response.content_part.added',
                    output_index: state.msgOutputIndex,
                    content_index: 0,
                    part: { type: 'output_text', text: '' }
                }));
            }
            else if (d.type === 'content_block_start') {
                if (d.content_block && d.content_block.type === 'tool_use') {
                    var tc = d.content_block;
                    state.toolCalls[d.index] = { id: tc.id, name: tc.name, arguments: '', _outputIndex: state.nextOutputIndex++ };
                    lines.push('event: response.output_item.added');
                    lines.push('data: ' + JSON.stringify({
                        type: 'response.output_item.added',
                        output_index: state.toolCalls[d.index]._outputIndex,
                        item: { type: 'function_call', id: tc.id, call_id: tc.id, name: tc.name, arguments: '', status: 'in_progress' }
                    }));
                }
            }
            else if (d.type === 'content_block_delta') {
                if (d.delta && d.delta.type === 'text_delta') {
                    lines.push('event: response.output_text.delta');
                    lines.push('data: ' + JSON.stringify({
                        type: 'response.output_text.delta',
                        output_index: state.msgOutputIndex,
                        content_index: 0,
                        delta: d.delta.text
                    }));
                    state.text = (state.text || '') + d.delta.text;
                }
                else if (d.delta && d.delta.type === 'input_json_delta') {
                    var slot = d.index !== undefined && state.toolCalls[d.index];
                    if (slot) {
                        var pj = d.delta.partial_json || '';
                        slot.arguments += pj;
                        if (pj) {
                            lines.push('event: response.function_call_arguments.delta');
                            lines.push('data: ' + JSON.stringify({
                                type: 'response.function_call_arguments.delta',
                                output_index: slot._outputIndex || 0,
                                item_id: slot.id,
                                delta: pj
                            }));
                        }
                    }
                }
            }
            else if (d.type === 'message_delta') {
                if (d.usage)
                    state.responseJson.usage = d.usage;
            }
            else if (d.type === 'message_stop') {
                if (state.text) {
                    lines.push('event: response.output_text.done');
                    lines.push('data: ' + JSON.stringify({
                        type: 'response.output_text.done',
                        output_index: state.msgOutputIndex || 0,
                        content_index: 0,
                        text: state.text
                    }));
                    lines.push('event: response.content_part.done');
                    lines.push('data: ' + JSON.stringify({
                        type: 'response.content_part.done',
                        output_index: state.msgOutputIndex || 0,
                        content_index: 0,
                        part: { type: 'output_text', text: state.text, annotations: [] }
                    }));
                }
                if (state.msgId) {
                    var content = [];
                    if (state.text)
                        content.push({ type: 'output_text', text: state.text, annotations: [] });
                    Object.keys(state.toolCalls || {}).forEach(function (id) {
                        var tc = state.toolCalls[id];
                        var doneEvt = { type: 'function_call', id: tc.id, call_id: tc.id, name: tc.name, arguments: tc.arguments, status: 'completed' };
                        lines.push('event: response.output_item.done');
                        lines.push('data: ' + JSON.stringify({
                            type: 'response.output_item.done',
                            output_index: tc._outputIndex || 0,
                            item: doneEvt
                        }));
                        content.push(doneEvt);
                    });
                    lines.push('event: response.output_item.done');
                    lines.push('data: ' + JSON.stringify({
                        type: 'response.output_item.done',
                        output_index: state.msgOutputIndex || 0,
                        item: { type: 'message', id: state.msgId, status: 'completed', role: 'assistant', content: content }
                    }));
                    state.responseJson.output.push({ type: 'message', id: state.msgId, status: 'completed', role: 'assistant', content: content });
                    lines.push('event: response.completed');
                    lines.push('data: ' + JSON.stringify({ type: 'response.completed', response: state.responseJson }));
                }
            }
        }
        catch (e) { }
    });
    return lines.join('\n') + (lines.length ? '\n' : '');
}
function anthropicToResponses(anthResp, model) {
    var resp = {
        id: 'resp_anth_' + (anthResp.id || ''),
        object: 'response',
        created: Math.floor(Date.now() / 1000),
        model: model || anthResp.model || '',
        usage: anthResp.usage || {},
        output: [],
    };
    if (anthResp.content) {
        var content = [];
        anthResp.content.forEach(function (block) {
            if (block.type === 'text')
                content.push({ type: 'output_text', text: block.text, annotations: [] });
            if (block.type === 'tool_use')
                content.push({
                    type: 'function_call',
                    id: block.id,
                    call_id: block.id,
                    name: block.name,
                    arguments: JSON.stringify(block.input || {}),
                    status: 'completed',
                });
        });
        resp.output.push({
            type: 'message',
            id: 'msg_anth_' + (anthResp.id || ''),
            role: 'assistant',
            content: content,
            status: 'completed',
        });
    }
    return resp;
}
function convertRequest(member, body, path) {
    var apiFormat = member.apiFormat || '';
    if (apiFormat === 'openai_chat') {
        return { body: JSON.stringify(responsesToChat(body, member.model)), path: '/chat/completions' };
    }
    if (apiFormat === 'anthropic') {
        return { body: JSON.stringify(responsesToAnthropic(body, member.model)), path: '/v1/messages' };
    }
    return { body: JSON.stringify(body), path: path };
}
function convertResponse(member, bodyStr, isStream) {
    var apiFormat = member.apiFormat || '';
    if (!apiFormat)
        return bodyStr;
    try {
        var body = JSON.parse(bodyStr);
        if (body && body.error)
            return bodyStr;
        if (apiFormat === 'openai_chat') {
            if (!body || !Array.isArray(body.choices) || !body.choices.length)
                return bodyStr;
            return JSON.stringify(chatToResponses(body, member.model));
        }
        if (apiFormat === 'anthropic') {
            if (!body || !Array.isArray(body.content) || !body.content.length)
                return bodyStr;
            return JSON.stringify(anthropicToResponses(body, member.model));
        }
    }
    catch (e) { }
    return bodyStr;
}
function convertSse(member, chunk, state) {
    var apiFormat = member.apiFormat || '';
    if (!apiFormat)
        return chunk;
    if (apiFormat === 'openai_chat')
        return sseChatToResponses(chunk, '', state);
    if (apiFormat === 'anthropic')
        return sseAnthropicToResponses(chunk, '', state);
    return chunk;
}
module.exports = {
    convertRequest: convertRequest,
    convertResponse: convertResponse,
    convertSse: convertSse,
};
