/**
 * 공통 유틸리티 모듈
 */
var Utils = (function () {
  'use strict';

  /**
   * HTML 템플릿을 fetch하여 반환
   */
  async function loadTemplate(path) {
    var response = await fetch(path);
    if (!response.ok) {
      throw new Error('Template load failed: ' + path);
    }
    return response.text();
  }

  /**
   * HTML 문자열을 DOM에 삽입
   */
  function renderTo(containerId, html) {
    var container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = html;
    }
  }

  /**
   * 이벤트 위임 헬퍼
   */
  function delegate(parent, selector, eventType, handler) {
    var el = typeof parent === 'string'
      ? document.querySelector(parent)
      : parent;
    if (!el) return;

    el.addEventListener(eventType, function (e) {
      var target = e.target.closest(selector);
      if (target && el.contains(target)) {
        handler(e, target);
      }
    });
  }

  /**
   * 파일 크기를 읽기 쉬운 형식으로 변환
   */
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    var units = ['B', 'KB', 'MB', 'GB'];
    var i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i];
  }

  /**
   * 날짜를 한국 형식으로 포맷
   */
  function formatDate(date) {
    var d = date instanceof Date ? date : new Date(date);
    var year = d.getFullYear();
    var month = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    var hours = String(d.getHours()).padStart(2, '0');
    var minutes = String(d.getMinutes()).padStart(2, '0');
    return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes;
  }

  /**
   * 고유 ID 생성
   */
  function generateId() {
    return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * 간단한 이벤트 버스
   */
  var eventBus = (function () {
    var listeners = {};

    function on(event, callback) {
      if (!listeners[event]) {
        listeners[event] = [];
      }
      listeners[event].push(callback);
    }

    function off(event, callback) {
      if (!listeners[event]) return;
      listeners[event] = listeners[event].filter(function (cb) {
        return cb !== callback;
      });
    }

    function emit(event, data) {
      if (!listeners[event]) return;
      listeners[event].forEach(function (cb) {
        cb(data);
      });
    }

    return { on: on, off: off, emit: emit };
  })();

  /**
   * HTML 이스케이프
   */
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return {
    loadTemplate: loadTemplate,
    renderTo: renderTo,
    delegate: delegate,
    formatFileSize: formatFileSize,
    formatDate: formatDate,
    generateId: generateId,
    eventBus: eventBus,
    escapeHtml: escapeHtml
  };
})();
