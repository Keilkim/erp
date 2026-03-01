/**
 * API 클라이언트 모듈
 */
var ApiClient = (function () {
  'use strict';

  var BASE_URL = '/api';

  /**
   * 공통 fetch 래퍼
   */
  async function request(endpoint, options) {
    var url = BASE_URL + endpoint;
    var config = Object.assign({
      headers: { 'Content-Type': 'application/json' }
    }, options || {});

    try {
      var response = await fetch(url, config);
      var json = await response.json();
      return json;
    } catch (err) {
      return {
        success: false,
        data: null,
        error: err.message,
        meta: null
      };
    }
  }

  /**
   * 파일 업로드 (multipart)
   */
  async function uploadFile(endpoint, file) {
    var url = BASE_URL + endpoint;
    var formData = new FormData();
    formData.append('file', file);

    try {
      var response = await fetch(url, {
        method: 'POST',
        body: formData
      });
      return response.json();
    } catch (err) {
      return {
        success: false,
        data: null,
        error: err.message,
        meta: null
      };
    }
  }

  /* ===== File API ===== */

  function getTempFiles() {
    return request('/files/temp');
  }

  function saveTempFile(fileData) {
    return request('/files/temp', {
      method: 'POST',
      body: JSON.stringify(fileData)
    });
  }

  function deleteTempFile(fileId) {
    return request('/files/temp?id=' + fileId, {
      method: 'DELETE'
    });
  }

  function getFinalFiles() {
    return request('/files/final');
  }

  function saveToFinal(fileId) {
    return request('/files/final', {
      method: 'POST',
      body: JSON.stringify({ fileId: fileId })
    });
  }

  function deleteFinalFile(fileId) {
    return request('/files/final?id=' + fileId, {
      method: 'DELETE'
    });
  }

  function saveExcelFile(fileData) {
    return request('/files/save', {
      method: 'POST',
      body: JSON.stringify(fileData)
    });
  }

  /* ===== AI API ===== */

  function sendChatMessage(message, context) {
    return request('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: message,
        context: context
      })
    });
  }

  return {
    request: request,
    uploadFile: uploadFile,
    getTempFiles: getTempFiles,
    saveTempFile: saveTempFile,
    deleteTempFile: deleteTempFile,
    getFinalFiles: getFinalFiles,
    saveToFinal: saveToFinal,
    deleteFinalFile: deleteFinalFile,
    saveExcelFile: saveExcelFile,
    sendChatMessage: sendChatMessage
  };
})();
