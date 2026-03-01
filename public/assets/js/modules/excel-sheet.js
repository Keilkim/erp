/**
 * 엑셀 시트 모듈 - 엑셀 데이터 표시 및 편집
 */
var ExcelSheet = (function () {
  'use strict';

  var state = {
    headers: [],
    rows: [],
    currentFileId: null,
    currentFileName: null,
    undoStack: [],
    redoStack: []
  };

  /**
   * 초기화
   */
  async function init() {
    var html = await Utils.loadTemplate('/assets/templates/excel-sheet.html');
    Utils.renderTo('excel-sheet-container', html);
    bindEvents();
  }

  /**
   * 이벤트 바인딩
   */
  function bindEvents() {
    var btnAddRow = document.getElementById('btn-add-row');
    var btnAddCol = document.getElementById('btn-add-col');
    var btnUndo = document.getElementById('btn-undo');
    var btnRedo = document.getElementById('btn-redo');

    if (btnAddRow) {
      btnAddRow.addEventListener('click', addRow);
    }
    if (btnAddCol) {
      btnAddCol.addEventListener('click', addColumn);
    }
    if (btnUndo) {
      btnUndo.addEventListener('click', undo);
    }
    if (btnRedo) {
      btnRedo.addEventListener('click', redo);
    }

    Utils.eventBus.on('file:selected', handleFileSelected);
    Utils.eventBus.on('ai:data-generated', handleAiData);
  }

  /**
   * 파일 선택 시 데이터 로드
   */
  function handleFileSelected(fileData) {
    if (!fileData) return;
    state.currentFileId = fileData.id;
    state.currentFileName = fileData.name;
    state.headers = fileData.headers || [];
    state.rows = fileData.rows || [];
    state.undoStack = [];
    state.redoStack = [];
    render();
    Utils.eventBus.emit('excel:updated', getData());
  }

  /**
   * AI 생성 데이터 로드
   */
  function handleAiData(data) {
    if (!data) return;
    saveUndoState();
    state.headers = data.headers || [];
    state.rows = data.rows || [];
    render();
    Utils.eventBus.emit('excel:updated', getData());
  }

  /**
   * 현재 데이터 반환
   */
  function getData() {
    return {
      id: state.currentFileId,
      name: state.currentFileName,
      headers: state.headers.slice(),
      rows: state.rows.map(function (row) { return row.slice(); })
    };
  }

  /**
   * 데이터 직접 설정
   */
  function setData(headers, rows, fileId, fileName) {
    state.headers = headers || [];
    state.rows = rows || [];
    state.currentFileId = fileId || null;
    state.currentFileName = fileName || null;
    state.undoStack = [];
    state.redoStack = [];
    render();
    Utils.eventBus.emit('excel:updated', getData());
  }

  /**
   * 테이블 렌더링
   */
  function render() {
    var wrap = document.getElementById('excel-table-wrap');
    var emptyState = document.getElementById('excel-empty-state');
    var fileNameEl = document.getElementById('current-file-name');

    if (!wrap) return;

    if (fileNameEl) {
      fileNameEl.textContent = state.currentFileName || '파일을 선택하세요';
    }

    if (state.headers.length === 0) {
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    renderTable(wrap);
  }

  /**
   * 테이블 DOM 생성
   */
  function renderTable(container) {
    var existingEmpty = container.querySelector('.excel-sheet__empty');
    var table = container.querySelector('.excel-sheet__table');

    if (!table) {
      table = document.createElement('table');
      table.className = 'excel-sheet__table';
      container.appendChild(table);
    }

    if (existingEmpty) {
      existingEmpty.classList.add('hidden');
    }

    var thead = buildThead();
    var tbody = buildTbody();
    table.innerHTML = '';
    table.appendChild(thead);
    table.appendChild(tbody);
  }

  /**
   * 테이블 헤더 빌드
   */
  function buildThead() {
    var thead = document.createElement('thead');
    var tr = document.createElement('tr');

    var thNum = document.createElement('th');
    thNum.className = 'excel-sheet__row-num';
    thNum.textContent = '#';
    tr.appendChild(thNum);

    state.headers.forEach(function (header) {
      var th = document.createElement('th');
      th.className = 'excel-sheet__th';
      th.textContent = header;
      tr.appendChild(th);
    });

    thead.appendChild(tr);
    return thead;
  }

  /**
   * 테이블 바디 빌드
   */
  function buildTbody() {
    var tbody = document.createElement('tbody');

    state.rows.forEach(function (row, rowIdx) {
      var tr = document.createElement('tr');

      var tdNum = document.createElement('td');
      tdNum.className = 'excel-sheet__row-num';
      tdNum.textContent = rowIdx + 1;
      tr.appendChild(tdNum);

      state.headers.forEach(function (_, colIdx) {
        var td = document.createElement('td');
        td.className = 'excel-sheet__td';

        var input = document.createElement('input');
        input.className = 'excel-sheet__cell';
        input.type = 'text';
        input.value = row[colIdx] != null ? row[colIdx] : '';
        input.dataset.row = rowIdx;
        input.dataset.col = colIdx;

        input.addEventListener('change', handleCellChange);
        td.appendChild(input);
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });

    return tbody;
  }

  /**
   * 셀 변경 핸들러
   */
  function handleCellChange(e) {
    var rowIdx = parseInt(e.target.dataset.row, 10);
    var colIdx = parseInt(e.target.dataset.col, 10);
    saveUndoState();
    state.rows[rowIdx][colIdx] = e.target.value;
    Utils.eventBus.emit('excel:updated', getData());
  }

  /**
   * 행 추가
   */
  function addRow() {
    if (state.headers.length === 0) return;
    saveUndoState();
    var newRow = new Array(state.headers.length).fill('');
    state.rows.push(newRow);
    render();
    Utils.eventBus.emit('excel:updated', getData());
  }

  /**
   * 열 추가
   */
  function addColumn() {
    var colName = prompt('열 이름을 입력하세요:');
    if (!colName) return;
    saveUndoState();
    state.headers.push(colName);
    state.rows.forEach(function (row) {
      row.push('');
    });
    render();
    Utils.eventBus.emit('excel:updated', getData());
  }

  /**
   * Undo 상태 저장
   */
  function saveUndoState() {
    state.undoStack.push({
      headers: state.headers.slice(),
      rows: state.rows.map(function (r) { return r.slice(); })
    });
    state.redoStack = [];
    if (state.undoStack.length > 50) {
      state.undoStack.shift();
    }
  }

  /**
   * Undo
   */
  function undo() {
    if (state.undoStack.length === 0) return;
    state.redoStack.push({
      headers: state.headers.slice(),
      rows: state.rows.map(function (r) { return r.slice(); })
    });
    var prev = state.undoStack.pop();
    state.headers = prev.headers;
    state.rows = prev.rows;
    render();
    Utils.eventBus.emit('excel:updated', getData());
  }

  /**
   * Redo
   */
  function redo() {
    if (state.redoStack.length === 0) return;
    state.undoStack.push({
      headers: state.headers.slice(),
      rows: state.rows.map(function (r) { return r.slice(); })
    });
    var next = state.redoStack.pop();
    state.headers = next.headers;
    state.rows = next.rows;
    render();
    Utils.eventBus.emit('excel:updated', getData());
  }

  /**
   * 시트 초기화
   */
  function clear() {
    state.headers = [];
    state.rows = [];
    state.currentFileId = null;
    state.currentFileName = null;
    state.undoStack = [];
    state.redoStack = [];
    render();
  }

  return {
    init: init,
    getData: getData,
    setData: setData,
    clear: clear
  };
})();
