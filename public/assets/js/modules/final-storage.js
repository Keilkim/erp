/**
 * 최종본 저장 모듈 - 최종 파일 관리
 */
var FinalStorage = (function () {
  'use strict';

  var files = [];
  var activeFileId = null;

  /**
   * 초기화
   */
  async function init() {
    var html = await Utils.loadTemplate(
      '/assets/templates/sidebar-final.html'
    );
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
    Utils.eventBus.on('final:file-added', handleFileAdded);

    Utils.delegate('#panel-final', '.file-item', 'click',
      function (e, target) {
        var actionBtn = e.target.closest('.file-item__btn');
        if (actionBtn) return;
        var fileId = target.dataset.fileId;
        selectFile(fileId);
      }
    );

    Utils.delegate('#panel-final', '.file-item__btn--save', 'click',
      function (e, target) {
        e.stopPropagation();
        var item = target.closest('.file-item');
        if (item) saveToExcel(item.dataset.fileId);
      }
    );

    Utils.delegate('#panel-final', '.file-item__btn--delete', 'click',
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
      var saved = localStorage.getItem('erp_final_files');
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
      localStorage.setItem('erp_final_files', JSON.stringify(files));
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
      source: 'final'
    });
  }

  /**
   * 엑셀 파일로 다운로드 저장
   */
  function saveToExcel(fileId) {
    var file = files.find(function (f) { return f.id === fileId; });
    if (!file) return;

    try {
      var wsData = [file.headers].concat(file.rows);
      var ws = XLSX.utils.aoa_to_sheet(wsData);
      var wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      XLSX.writeFile(wb, file.name);
    } catch (err) {
      alert('파일 저장 중 오류: ' + err.message);
    }
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
   * 패널 표시/숨김
   */
  function show() {
    var panel = document.getElementById('panel-final');
    if (panel) panel.classList.remove('sidebar-panel--hidden');
  }

  function hide() {
    var panel = document.getElementById('panel-final');
    if (panel) panel.classList.add('sidebar-panel--hidden');
  }

  /**
   * 리스트 렌더링
   */
  function renderList() {
    var listEl = document.getElementById('final-file-list');
    var countEl = document.getElementById('final-count');
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
      '<path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 ' +
      '012-2h5l2 3h9a2 2 0 012 2z"></path></svg></span>' +
      '<span>최종본 문서가 없습니다</span></div>';
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
      'stroke="#2563eb" stroke-width="2">' +
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
      'title="엑셀 파일로 저장">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="2">' +
      '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"></path>' +
      '<polyline points="7 10 12 15 17 10"></polyline>' +
      '<line x1="12" y1="15" x2="12" y2="3"></line></svg></button>' +
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
    init: init,
    show: show,
    hide: hide
  };
})();
