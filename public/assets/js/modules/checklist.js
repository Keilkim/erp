/**
 * 확인 리스트 모듈 - 엑셀 데이터 검토 패널
 */
var Checklist = (function () {
  'use strict';

  var isCollapsed = false;

  /**
   * 초기화
   */
  async function init() {
    var html = await Utils.loadTemplate(
      '/assets/templates/checklist.html'
    );
    Utils.renderTo('checklist-container', html);
    bindEvents();
  }

  /**
   * 이벤트 바인딩
   */
  function bindEvents() {
    var toggleEl = document.getElementById('checklist-toggle');
    if (toggleEl) {
      toggleEl.addEventListener('click', togglePanel);
    }

    Utils.eventBus.on('excel:updated', handleDataUpdate);
  }

  /**
   * 패널 토글
   */
  function togglePanel() {
    var panel = document.getElementById('checklist-panel');
    var icon = document.getElementById('checklist-toggle-icon');
    if (!panel) return;

    isCollapsed = !isCollapsed;
    panel.classList.toggle('checklist-panel--collapsed', isCollapsed);
    if (icon) {
      icon.textContent = isCollapsed ? '\u25B2' : '\u25BC';
    }
  }

  /**
   * 데이터 업데이트 핸들러
   */
  function handleDataUpdate(data) {
    if (!data) return;
    renderTable(data.headers, data.rows);
  }

  /**
   * 테이블 렌더링
   */
  function renderTable(headers, rows) {
    var emptyEl = document.getElementById('checklist-empty');
    var tableEl = document.getElementById('checklist-table');
    var theadEl = document.getElementById('checklist-thead');
    var tbodyEl = document.getElementById('checklist-tbody');

    if (!tableEl || !theadEl || !tbodyEl) return;

    if (!headers || headers.length === 0) {
      if (emptyEl) emptyEl.classList.remove('hidden');
      tableEl.classList.add('hidden');
      return;
    }

    if (emptyEl) emptyEl.classList.add('hidden');
    tableEl.classList.remove('hidden');

    var headerRow = document.createElement('tr');
    var thIdx = document.createElement('th');
    thIdx.textContent = '#';
    headerRow.appendChild(thIdx);

    headers.forEach(function (header) {
      var th = document.createElement('th');
      th.textContent = header;
      headerRow.appendChild(th);
    });

    theadEl.innerHTML = '';
    theadEl.appendChild(headerRow);

    tbodyEl.innerHTML = '';
    var displayRows = rows.slice(0, 100);

    displayRows.forEach(function (row, idx) {
      var tr = document.createElement('tr');

      var tdIdx = document.createElement('td');
      tdIdx.textContent = idx + 1;
      tr.appendChild(tdIdx);

      headers.forEach(function (_, colIdx) {
        var td = document.createElement('td');
        td.textContent = row[colIdx] != null ? row[colIdx] : '';
        tr.appendChild(td);
      });

      tbodyEl.appendChild(tr);
    });
  }

  return {
    init: init
  };
})();
