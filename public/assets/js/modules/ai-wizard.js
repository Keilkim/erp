/**
 * AI 마법사 모듈 - PPT 슬라이드 및 결재 문서 생성
 */
var AiWizard = (function () {
  'use strict';

  var activeTab = 'slide';

  /**
   * 초기화
   */
  async function init() {
    var html = await Utils.loadTemplate(
      '/assets/templates/modal-ai-wizard.html'
    );
    var modalContainer = document.getElementById('modal-container');
    if (modalContainer) {
      modalContainer.insertAdjacentHTML('beforeend', html);
    }
    bindEvents();
  }

  /**
   * 이벤트 바인딩
   */
  function bindEvents() {
    Utils.eventBus.on('wizard:open', openWizard);

    Utils.delegate('#modal-ai-wizard', '.wizard__tab', 'click',
      function (e, target) {
        switchTab(target.dataset.wizardTab);
      }
    );

    var closeBtn = document.getElementById('wizard-close');
    var cancelBtn = document.getElementById('wizard-cancel');
    var generateBtn = document.getElementById('wizard-generate');

    if (closeBtn) {
      closeBtn.addEventListener('click', closeWizard);
    }
    if (cancelBtn) {
      cancelBtn.addEventListener('click', closeWizard);
    }
    if (generateBtn) {
      generateBtn.addEventListener('click', handleGenerate);
    }
  }

  /**
   * 마법사 열기
   */
  function openWizard() {
    var modal = document.getElementById('modal-ai-wizard');
    if (!modal) return;

    updatePreview();
    modal.classList.add('modal-overlay--visible');
  }

  /**
   * 마법사 닫기
   */
  function closeWizard() {
    var modal = document.getElementById('modal-ai-wizard');
    if (modal) {
      modal.classList.remove('modal-overlay--visible');
    }
  }

  /**
   * 탭 전환
   */
  function switchTab(tab) {
    activeTab = tab;

    var tabs = document.querySelectorAll('.wizard__tab');
    tabs.forEach(function (t) {
      t.classList.remove('wizard__tab--active');
      if (t.dataset.wizardTab === tab) {
        t.classList.add('wizard__tab--active');
      }
    });

    var slideContent = document.getElementById('wizard-slide-content');
    var approvalContent = document.getElementById(
      'wizard-approval-content'
    );

    if (slideContent && approvalContent) {
      if (tab === 'slide') {
        slideContent.classList.remove('hidden');
        approvalContent.classList.add('hidden');
      } else {
        slideContent.classList.add('hidden');
        approvalContent.classList.remove('hidden');
      }
    }
  }

  /**
   * 프리뷰 업데이트
   */
  function updatePreview() {
    var excelData = ExcelSheet.getData();
    updateSlidePreview(excelData);
    updateApprovalPreview(excelData);
  }

  /**
   * 슬라이드 프리뷰
   */
  function updateSlidePreview(data) {
    var preview = document.getElementById('slide-preview');
    if (!preview) return;

    if (!data.headers || data.headers.length === 0) {
      preview.innerHTML =
        '<div class="slide-preview__item">' +
        '데이터 없음 - 엑셀 데이터를 먼저 로드하세요</div>';
      return;
    }

    var fileName = data.name || '문서';
    var slides = [
      { title: fileName + ' - 표지' },
      { title: '데이터 요약 (' + data.rows.length + '건)' },
      { title: '세부 내역' }
    ];

    preview.innerHTML = slides.map(function (slide, i) {
      return '<div class="slide-preview__item">' +
        '<div style="text-align:center;">' +
        '<div style="font-size:0.7rem;color:#94a3b8;">Slide ' +
        (i + 1) + '</div>' +
        '<div style="font-size:0.8rem;font-weight:600;">' +
        Utils.escapeHtml(slide.title) + '</div></div></div>';
    }).join('');
  }

  /**
   * 결재 문서 프리뷰
   */
  function updateApprovalPreview(data) {
    var titleVal = document.getElementById('approval-title-val');
    var dateVal = document.getElementById('approval-date-val');
    var bodyVal = document.getElementById('approval-body-val');

    if (titleVal) {
      titleVal.textContent = data.name
        ? data.name + ' 관련 결재 요청'
        : '결재 제목 미지정';
    }
    if (dateVal) {
      dateVal.textContent = Utils.formatDate(new Date());
    }
    if (bodyVal) {
      if (data.headers && data.headers.length > 0) {
        bodyVal.textContent = '첨부 엑셀 데이터 ' +
          data.rows.length + '건에 대한 결재를 요청합니다.';
      } else {
        bodyVal.textContent = '데이터를 먼저 로드해주세요.';
      }
    }
  }

  /**
   * 생성 처리
   */
  function handleGenerate() {
    var excelData = ExcelSheet.getData();

    if (!excelData.headers || excelData.headers.length === 0) {
      alert('엑셀 데이터가 없습니다. 먼저 데이터를 로드해주세요.');
      return;
    }

    if (activeTab === 'slide') {
      generateSlides(excelData);
    } else {
      generateApproval(excelData);
    }
  }

  /**
   * PPT 슬라이드 생성 (모의)
   */
  function generateSlides(data) {
    alert(
      'PPT 슬라이드가 생성되었습니다.\n\n' +
      '- 제목: ' + (data.name || '문서') + '\n' +
      '- 슬라이드 수: 3장\n' +
      '- 데이터: ' + data.rows.length + '건\n\n' +
      '(AI 서버 연결 시 실제 파일이 생성됩니다)'
    );
    closeWizard();
  }

  /**
   * 결재 문서 생성 (모의)
   */
  function generateApproval(data) {
    alert(
      '결재 문서가 생성되었습니다.\n\n' +
      '- 제목: ' + (data.name || '문서') + ' 결재 요청\n' +
      '- 데이터: ' + data.rows.length + '건\n\n' +
      '(그룹웨어 연동 시 실제 결재가 올라갑니다)'
    );
    closeWizard();
  }

  return {
    init: init
  };
})();
