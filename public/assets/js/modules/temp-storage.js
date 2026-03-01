/**
 * 임시 저장 모듈 - 임시 파일 관리
 */
var TempStorage = (function () {
  'use strict';

  var files = [];
  var activeFileId = null;

  /**
   * 초기화
   */
  async function init() {
    var html = await Utils.loadTemplate('/assets/templates/sidebar-temp.html');
    var container = document.getElementById('sidebar-content');
    if (container) {
      container.insertAdjacentHTML('beforeend', html);
    }
    bindEvents();
    loadFiles();
  }

  /**
   * 이벤트 바인딩
   */
  function bindEvents() {
    Utils.eventBus.on('temp:file-added', handleFileAdded);

    Utils.delegate('#panel-temp', '.file-item', 'click', function (e, target) {
      var actionBtn = e.target.closest('.file-item__btn');
      if (actionBtn) return;
      var fileId = target.dataset.fileId;
      selectFile(fileId);
    });

    Utils.delegate('#panel-temp', '.file-item__btn--save', 'click',
      function (e, target) {
        e.stopPropagation();
        var item = target.closest('.file-item');
        if (item) moveToFinal(item.dataset.fileId);
      }
    );

    Utils.delegate('#panel-temp', '.file-item__btn--delete', 'click',
      function (e, target) {
        e.stopPropagation();
        var item = target.closest('.file-item');
        if (item) deleteFile(item.dataset.fileId);
      }
    );
  }

  /**
   * 파일 목록 로드 (로컬 스토리지)
   */
  function loadFiles() {
    try {
      var saved = localStorage.getItem('erp_temp_files');
      if (saved) {
        files = JSON.parse(saved);
      }
    } catch (e) {
      files = [];
    }
    renderList();
  }

  /**
   * 파일 목록 저장
   */
  function saveFiles() {
    try {
      localStorage.setItem('erp_temp_files', JSON.stringify(files));
    } catch (e) {
      /* storage full */
    }
  }

  /**
   * 파일 추가 핸들러
   */
  function handleFileAdded(fileRecord) {
    files.unshift(fileRecord);
    saveFiles();
    renderList();
  }

  /**
   * 파일 선택 - 엑셀시트에 로드
   */
  function selectFile(fileId) {
    var file = files.find(function (f) { return f.id === fileId; });
    if (!file) return;

    activeFileId = fileId;
    renderList();

    Utils.eventBus.emit('file:selected', {
      id: file.id,
      name: file.name,
      headers: file.headers,
      rows: file.rows,
      source: 'temp'
    });
  }

  /**
   * 최종본으로 이동
   */
  function moveToFinal(fileId) {
    var file = files.find(function (f) { return f.id === fileId; });
    if (!file) return;

    var confirmMove = confirm(
      '"' + file.name + '"을(를) 최종본으로 저장하시겠습니까?'
    );
    if (!confirmMove) return;

    var finalRecord = {
      id: Utils.generateId(),
      name: file.name,
      size: file.size,
      timestamp: new Date().toISOString(),
      headers: file.headers,
      rows: file.rows
    };

    Utils.eventBus.emit('final:file-added', finalRecord);
  }

  /**
   * 파일 삭제
   */
  function deleteFile(fileId) {
    var file = files.find(function (f) { return f.id === fileId; });
    if (!file) return;

    var confirmDel = confirm(
      '"' + file.name + '"을(를) 삭제하시겠습니까?'
    );
    if (!confirmDel) return;

    files = files.filter(function (f) { return f.id !== fileId; });
    if (activeFileId === fileId) {
      activeFileId = null;
    }
    saveFiles();
    renderList();
  }

  /**
   * 리스트 렌더링
   */
  function renderList() {
    var listEl = document.getElementById('temp-file-list');
    var countEl = document.getElementById('temp-count');
    if (!listEl) return;

    if (countEl) countEl.textContent = files.length;

    if (files.length === 0) {
      listEl.innerHTML = buildEmptyHtml();
      return;
    }

    listEl.innerHTML = files.map(function (file) {
      return buildFileItemHtml(file);
    }).join('');
  }

  /**
   * 빈 상태 HTML
   */
  function buildEmptyHtml() {
    return '<div class="file-list__empty">' +
      '<span class="file-list__empty-icon">' +
      '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="1">' +
      '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 ' +
      '002-2V8z"></path>' +
      '<polyline points="14 2 14 8 20 8"></polyline></svg></span>' +
      '<span>업로드된 파일이 없습니다</span></div>';
  }

  /**
   * 파일 아이템 HTML
   */
  function buildFileItemHtml(file) {
    var isActive = file.id === activeFileId;
    var activeClass = isActive ? ' file-item--active' : '';

    return '<div class="file-item' + activeClass + '" ' +
      'data-file-id="' + file.id + '">' +
      '<span class="file-item__icon">' +
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" ' +
      'stroke="#16a34a" stroke-width="2">' +
      '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 ' +
      '002-2V8z"></path>' +
      '<polyline points="14 2 14 8 20 8"></polyline></svg></span>' +
      '<div class="file-item__info">' +
      '<div class="file-item__name">' +
      Utils.escapeHtml(file.name) + '</div>' +
      '<div class="file-item__meta">' +
      Utils.formatDate(file.timestamp) + '</div></div>' +
      '<div class="file-item__actions">' +
      '<button class="file-item__btn file-item__btn--save" ' +
      'title="최종본으로 저장">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="2">' +
      '<polyline points="20 6 9 17 4 12"></polyline></svg></button>' +
      '<button class="file-item__btn file-item__btn--delete" ' +
      'title="삭제">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="2">' +
      '<polyline points="3 6 5 6 21 6"></polyline>' +
      '<path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 ' +
      '2 0 012-2h4a2 2 0 012 2v2"></path></svg></button>' +
      '</div></div>';
  }

  return {
    init: init
  };
})();
