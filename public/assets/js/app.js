/**
 * App - 메인 오케스트레이터
 * 전체 애플리케이션 초기화 및 모듈 간 조율
 */
var App = (function () {
  'use strict';

  /**
   * 애플리케이션 시작
   */
  async function init() {
    try {
      await loadLayout();
      await initModules();
      bindGlobalEvents();
    } catch (err) {
      document.getElementById('app').innerHTML =
        '<div style="padding:2rem;color:red;">' +
        '앱 로드 실패: ' + err.message + '</div>';
    }
  }

  /**
   * 레이아웃 템플릿 로드
   */
  async function loadLayout() {
    var html = await Utils.loadTemplate('/assets/templates/layout.html');
    Utils.renderTo('app', html);

    var modalHtml = await Utils.loadTemplate(
      '/assets/templates/modal-save-confirm.html'
    );
    var modalContainer = document.getElementById('modal-container');
    if (modalContainer) {
      modalContainer.innerHTML = modalHtml;
    }
  }

  /**
   * 모듈 초기화
   */
  async function initModules() {
    await ExcelSheet.init();
    await Checklist.init();
    await TempStorage.init();
    await FinalStorage.init();
    await AiChat.init();
    await AiWizard.init();
    FileUpload.init();
  }

  /**
   * 전역 이벤트 바인딩
   */
  function bindGlobalEvents() {
    bindTabSwitcher();
    bindSaveExcelButton();
  }

  /**
   * 사이드바 탭 전환
   */
  function bindTabSwitcher() {
    Utils.delegate('.tab-switcher', '.tab-switcher__tab', 'click',
      function (e, target) {
        var tabs = document.querySelectorAll('.tab-switcher__tab');
        tabs.forEach(function (tab) {
          tab.classList.remove('tab-switcher__tab--active');
        });
        target.classList.add('tab-switcher__tab--active');

        var tabName = target.dataset.tab;
        if (tabName === 'temp') {
          showPanel('panel-temp');
          hidePanel('panel-final');
        } else if (tabName === 'final') {
          hidePanel('panel-temp');
          showPanel('panel-final');
        }
      }
    );
  }

  /**
   * 패널 표시
   */
  function showPanel(id) {
    var el = document.getElementById(id);
    if (el) el.classList.remove('sidebar-panel--hidden');
  }

  /**
   * 패널 숨김
   */
  function hidePanel(id) {
    var el = document.getElementById(id);
    if (el) el.classList.add('sidebar-panel--hidden');
  }

  /**
   * 엑셀 저장 버튼 (헤더)
   */
  function bindSaveExcelButton() {
    var btn = document.getElementById('btn-save-excel');
    if (!btn) return;

    btn.addEventListener('click', function () {
      var data = ExcelSheet.getData();

      if (!data.headers || data.headers.length === 0) {
        alert('저장할 엑셀 데이터가 없습니다.');
        return;
      }

      try {
        var fileName = data.name || 'export.xlsx';
        var wsData = [data.headers].concat(data.rows);
        var ws = XLSX.utils.aoa_to_sheet(wsData);
        var wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
        XLSX.writeFile(wb, fileName);
      } catch (err) {
        alert('파일 저장 실패: ' + err.message);
      }
    });
  }

  return { init: init };
})();

document.addEventListener('DOMContentLoaded', function () {
  App.init();
});
