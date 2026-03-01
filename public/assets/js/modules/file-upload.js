/**
 * 파일 업로드 모듈 - 엑셀 파일 업로드 및 파싱
 */
var FileUpload = (function () {
  'use strict';

  var pendingFile = null;

  /**
   * 초기화
   */
  function init() {
    bindEvents();
  }

  /**
   * 이벤트 바인딩
   */
  function bindEvents() {
    var btnUpload = document.getElementById('btn-upload');
    var fileInput = document.getElementById('file-input-hidden');
    var dropZone = document.getElementById('upload-drop-zone');

    if (btnUpload) {
      btnUpload.addEventListener('click', openFilePicker);
    }
    if (fileInput) {
      fileInput.addEventListener('change', handleFileSelect);
    }
    if (dropZone) {
      dropZone.addEventListener('click', openFilePicker);
      dropZone.addEventListener('dragover', handleDragOver);
      dropZone.addEventListener('dragleave', handleDragLeave);
      dropZone.addEventListener('drop', handleDrop);
    }

    bindModalEvents();
  }

  /**
   * 모달 이벤트 바인딩
   */
  function bindModalEvents() {
    var modalSaveOk = document.getElementById('modal-save-ok');
    var modalSaveCancel = document.getElementById('modal-save-cancel');
    var modalSaveClose = document.getElementById('modal-save-close');

    if (modalSaveOk) {
      modalSaveOk.addEventListener('click', confirmSave);
    }
    if (modalSaveCancel) {
      modalSaveCancel.addEventListener('click', closeModal);
    }
    if (modalSaveClose) {
      modalSaveClose.addEventListener('click', closeModal);
    }
  }

  /**
   * 파일 탐색기 열기
   */
  function openFilePicker() {
    var fileInput = document.getElementById('file-input-hidden');
    if (fileInput) {
      fileInput.value = '';
      fileInput.click();
    }
  }

  /**
   * 파일 선택 핸들러
   */
  function handleFileSelect(e) {
    var files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }

  /**
   * 드래그 오버
   */
  function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('upload-area--dragover');
  }

  /**
   * 드래그 리브
   */
  function handleDragLeave(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('upload-area--dragover');
  }

  /**
   * 드롭 핸들러
   */
  function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('upload-area--dragover');
    var files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }

  /**
   * 파일 처리 - 유효성 검사 후 모달 표시
   */
  function processFile(file) {
    var validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    var validExtensions = ['.xlsx', '.xls'];
    var ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!validTypes.includes(file.type) && !validExtensions.includes(ext)) {
      alert('엑셀 파일(.xlsx, .xls)만 업로드할 수 있습니다.');
      return;
    }

    pendingFile = file;
    showSaveModal(file);
  }

  /**
   * 임시저장 묻기 모달 표시
   */
  function showSaveModal(file) {
    var modal = document.getElementById('modal-save-confirm');
    var fileName = document.getElementById('modal-file-name');
    var fileSize = document.getElementById('modal-file-size');

    if (fileName) fileName.textContent = file.name;
    if (fileSize) fileSize.textContent = Utils.formatFileSize(file.size);
    if (modal) modal.classList.add('modal-overlay--visible');
  }

  /**
   * 모달 닫기
   */
  function closeModal() {
    var modal = document.getElementById('modal-save-confirm');
    if (modal) modal.classList.remove('modal-overlay--visible');
    pendingFile = null;
  }

  /**
   * 저장 확정 - 파일을 파싱하여 임시저장에 추가
   */
  async function confirmSave() {
    if (!pendingFile) return;

    var file = pendingFile;
    closeModal();

    try {
      var data = await parseExcelFile(file);
      var fileRecord = {
        id: Utils.generateId(),
        name: file.name,
        size: file.size,
        timestamp: new Date().toISOString(),
        headers: data.headers,
        rows: data.rows
      };

      Utils.eventBus.emit('temp:file-added', fileRecord);
    } catch (err) {
      alert('파일을 읽는 중 오류가 발생했습니다: ' + err.message);
    }
  }

  /**
   * 엑셀 파일 파싱 (SheetJS)
   */
  function parseExcelFile(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();

      reader.onload = function (e) {
        try {
          var data = new Uint8Array(e.target.result);
          var workbook = XLSX.read(data, { type: 'array' });
          var sheetName = workbook.SheetNames[0];
          var sheet = workbook.Sheets[sheetName];
          var jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

          if (jsonData.length === 0) {
            resolve({ headers: [], rows: [] });
            return;
          }

          var headers = jsonData[0].map(function (h) {
            return h != null ? String(h) : '';
          });
          var rows = jsonData.slice(1).map(function (row) {
            return headers.map(function (_, i) {
              return row[i] != null ? String(row[i]) : '';
            });
          });

          resolve({ headers: headers, rows: rows });
        } catch (err) {
          reject(err);
        }
      };

      reader.onerror = function () {
        reject(new Error('파일 읽기 실패'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  return {
    init: init
  };
})();
