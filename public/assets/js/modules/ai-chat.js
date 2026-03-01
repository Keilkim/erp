/**
 * AI 채팅 모듈 - 프롬프트 입력 및 AI 응답 처리
 */
var AiChat = (function () {
  'use strict';

  var messages = [];

  /**
   * 초기화
   */
  async function init() {
    var html = await Utils.loadTemplate('/assets/templates/ai-chat.html');
    Utils.renderTo('ai-chat-container', html);
    bindEvents();
  }

  /**
   * 이벤트 바인딩
   */
  function bindEvents() {
    var input = document.getElementById('chat-input');
    var sendBtn = document.getElementById('btn-send-chat');
    var clearBtn = document.getElementById('btn-clear-chat');
    var wizardBtn = document.getElementById('btn-ai-wizard');

    if (input) {
      input.addEventListener('input', handleInputChange);
      input.addEventListener('keydown', handleKeyDown);
    }
    if (sendBtn) {
      sendBtn.addEventListener('click', sendMessage);
    }
    if (clearBtn) {
      clearBtn.addEventListener('click', clearChat);
    }
    if (wizardBtn) {
      wizardBtn.addEventListener('click', function () {
        Utils.eventBus.emit('wizard:open');
      });
    }
  }

  /**
   * 입력 변경 - 전송 버튼 활성화
   */
  function handleInputChange(e) {
    var sendBtn = document.getElementById('btn-send-chat');
    if (sendBtn) {
      sendBtn.disabled = e.target.value.trim() === '';
    }
    autoResizeTextarea(e.target);
  }

  /**
   * 키 입력 핸들러 (Enter: 전송, Shift+Enter: 줄바꿈)
   */
  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  /**
   * 텍스트에어리어 자동 높이
   */
  function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    var maxHeight = 120;
    var newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = newHeight + 'px';
  }

  /**
   * 메시지 전송
   */
  async function sendMessage() {
    var input = document.getElementById('chat-input');
    if (!input) return;

    var text = input.value.trim();
    if (!text) return;

    addMessage('user', text);
    input.value = '';
    input.style.height = 'auto';

    var sendBtn = document.getElementById('btn-send-chat');
    if (sendBtn) sendBtn.disabled = true;

    var excelData = ExcelSheet.getData();
    var context = {
      headers: excelData.headers,
      rowCount: excelData.rows.length,
      sampleRows: excelData.rows.slice(0, 5)
    };

    try {
      var result = await ApiClient.sendChatMessage(text, context);

      if (result.success && result.data) {
        addMessage('ai', result.data.message);

        if (result.data.excelData) {
          Utils.eventBus.emit('ai:data-generated', {
            headers: result.data.excelData.headers,
            rows: result.data.excelData.rows
          });
        }
      } else {
        addAiMockResponse(text, excelData);
      }
    } catch (err) {
      addAiMockResponse(text, excelData);
    }
  }

  /**
   * 모의 AI 응답 (API 미연결 시)
   */
  function addAiMockResponse(userText, excelData) {
    var response = generateMockResponse(userText, excelData);
    addMessage('ai', response.message, response.actions);

    if (response.excelData) {
      Utils.eventBus.emit('ai:data-generated', response.excelData);
    }
  }

  /**
   * 모의 응답 생성
   */
  function generateMockResponse(text, excelData) {
    var lower = text.toLowerCase();

    if (lower.includes('샘플') || lower.includes('생성')) {
      return {
        message: '샘플 데이터를 생성했습니다. ' +
          '엑셀 시트에서 확인해주세요.',
        excelData: {
          headers: ['이름', '부서', '직급', '입사일', '급여'],
          rows: [
            ['김철수', '개발팀', '과장', '2020-03-15', '5500000'],
            ['이영희', '기획팀', '대리', '2021-07-01', '4200000'],
            ['박민수', '영업팀', '차장', '2018-11-20', '6800000'],
            ['정수진', '인사팀', '사원', '2023-01-10', '3500000'],
            ['최동현', '개발팀', '부장', '2015-05-08', '8000000']
          ]
        }
      };
    }

    if (lower.includes('분석') || lower.includes('요약')) {
      if (excelData.headers.length > 0) {
        return {
          message: '현재 엑셀 데이터 분석 결과입니다:\n\n' +
            '- 총 ' + excelData.rows.length + '개의 행\n' +
            '- ' + excelData.headers.length + '개의 열 (' +
            excelData.headers.join(', ') + ')\n\n' +
            '추가 분석이 필요하시면 말씀해주세요.'
        };
      }
      return {
        message: '분석할 엑셀 데이터가 없습니다. ' +
          '파일을 업로드하거나 "샘플 데이터 생성"을 요청해주세요.'
      };
    }

    return {
      message: '네, 요청을 확인했습니다. "샘플 데이터 생성", ' +
        '"데이터 분석" 등의 명령어를 사용해보세요.\n\n' +
        '현재 AI 서버가 연결되지 않아 모의 응답입니다.'
    };
  }

  /**
   * 메시지 추가 및 렌더링
   */
  function addMessage(role, text, actions) {
    messages.push({
      id: Utils.generateId(),
      role: role,
      text: text,
      actions: actions || [],
      timestamp: new Date().toISOString()
    });
    renderMessages();
  }

  /**
   * 메시지 목록 렌더링
   */
  function renderMessages() {
    var container = document.getElementById('chat-messages');
    if (!container) return;

    if (messages.length === 0) {
      container.innerHTML = buildWelcomeHtml();
      return;
    }

    container.innerHTML = messages.map(function (msg) {
      return buildMessageHtml(msg);
    }).join('');

    container.scrollTop = container.scrollHeight;
  }

  /**
   * 웰컴 메시지 HTML
   */
  function buildWelcomeHtml() {
    return '<div class="ai-chat__welcome">' +
      '<span class="ai-chat__welcome-icon">' +
      '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="1">' +
      '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2' +
      ' 0 012 2z"></path></svg></span>' +
      '<span class="ai-chat__welcome-title">AI 어시스턴트</span>' +
      '<span class="ai-chat__welcome-desc">' +
      '엑셀 데이터 분석, 수정, 생성을 도와드립니다. ' +
      '프롬프트를 입력해보세요.</span></div>';
  }

  /**
   * 메시지 HTML 빌드
   */
  function buildMessageHtml(msg) {
    var roleClass = msg.role === 'user' ? 'user' : 'ai';
    var avatar = msg.role === 'user' ? 'U' : 'AI';
    var bodyText = Utils.escapeHtml(msg.text).replace(/\n/g, '<br>');

    var actionsHtml = '';
    if (msg.actions && msg.actions.length > 0) {
      actionsHtml = '<div class="chat-message__actions">' +
        msg.actions.map(function (action) {
          return '<button class="chat-message__action-btn" ' +
            'data-action="' + action.type + '">' +
            Utils.escapeHtml(action.label) + '</button>';
        }).join('') + '</div>';
    }

    return '<div class="chat-message chat-message--' + roleClass + '">' +
      '<span class="chat-message__avatar">' + avatar + '</span>' +
      '<div class="chat-message__body">' + bodyText +
      actionsHtml + '</div></div>';
  }

  /**
   * 채팅 초기화
   */
  function clearChat() {
    messages = [];
    renderMessages();
  }

  return {
    init: init,
    clearChat: clearChat
  };
})();
