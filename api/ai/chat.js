const { success, error, notAllowed } = require('../_lib/response');

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/' +
  'gemini-3.1-pro-preview:generateContent';

const SYSTEM_PROMPT = `당신은 ERP 시스템의 AI 어시스턴트입니다.
사용자의 요청에 따라 엑셀 데이터를 분석, 수정, 생성합니다.

## 응답 규칙
1. 한국어로 답변합니다.
2. 엑셀 데이터를 생성하거나 수정해야 할 경우, 반드시 응답 맨 끝에
   아래 JSON 블록을 포함하세요:
   \`\`\`excel-json
   {"headers":["열1","열2"],"rows":[["값1","값2"]]}
   \`\`\`
3. 단순 질문이나 분석 결과만 전달할 경우 JSON 블록 없이 텍스트만 응답합니다.
4. 모든 셀 값은 문자열로 반환합니다.`;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return notAllowed(res);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return error(res, 'GEMINI_API_KEY가 설정되지 않았습니다.', 500);
  }

  try {
    const { message, context } = req.body;

    if (!message) {
      return error(res, 'message가 필요합니다.', 400);
    }

    const userPrompt = buildUserPrompt(message, context);
    const geminiResponse = await callGemini(apiKey, userPrompt);
    const parsed = parseGeminiResponse(geminiResponse);

    return success(res, parsed);
  } catch (err) {
    return error(res, err.message);
  }
};

function buildUserPrompt(message, context) {
  let prompt = message;

  if (context && context.headers && context.headers.length > 0) {
    prompt += '\n\n[현재 엑셀 데이터 컨텍스트]\n';
    prompt += '열: ' + context.headers.join(', ') + '\n';
    prompt += '행 수: ' + context.rowCount + '\n';

    if (context.sampleRows && context.sampleRows.length > 0) {
      prompt += '샘플 데이터 (최대 5행):\n';
      context.sampleRows.forEach(function (row, i) {
        prompt += (i + 1) + '. ' + row.join(' | ') + '\n';
      });
    }
  }

  return prompt;
}

async function callGemini(apiKey, userPrompt) {
  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: SYSTEM_PROMPT + '\n\n' + userPrompt }]
      }
    ],
    generationConfig: {
      temperature: 1.0,
      maxOutputTokens: 4096
    }
  };

  const response = await fetch(GEMINI_API_URL + '?key=' + apiKey, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error('Gemini API 오류 (' + response.status + '): ' + errBody);
  }

  const data = await response.json();

  if (!data.candidates || data.candidates.length === 0) {
    throw new Error('Gemini 응답이 비어있습니다.');
  }

  const parts = data.candidates[0].content.parts;
  return parts.map(function (p) { return p.text || ''; }).join('');
}

function parseGeminiResponse(text) {
  const excelJsonRegex = /```excel-json\s*([\s\S]*?)```/;
  const match = text.match(excelJsonRegex);

  let message = text;
  let excelData = null;

  if (match) {
    message = text.replace(excelJsonRegex, '').trim();
    try {
      excelData = JSON.parse(match[1].trim());
      if (excelData.headers) {
        excelData.rows = (excelData.rows || []).map(function (row) {
          return row.map(function (cell) {
            return cell != null ? String(cell) : '';
          });
        });
      }
    } catch (e) {
      excelData = null;
    }
  }

  const result = { message: message };
  if (excelData) {
    result.excelData = excelData;
  }
  return result;
}
