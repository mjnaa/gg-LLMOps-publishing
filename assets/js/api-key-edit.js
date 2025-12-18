/*
 * ============================================================================
 * API 키 수정 토글
 * 1) 기능
 * - API 수정: 조회 리스트 숨김 / 체크 리스트 노출
 * - API 목록 닫기: 조회 리스트 복귀
 * - 클래스(is-edit) 기반 토글
 * ============================================================================
 */

(function () {
  'use strict';

  const SELECTOR = {
    PANEL: '.api-edit-panel', 
    BTN_OPEN: '.api-toggle-open',
    BTN_CLOSE: '.api-toggle-close'
  };

  const CLASS_NAME = {
    EDIT_MODE: 'is-edit'
  };

  // API 목록 표시 모드 전환 (panel: 대상 요소, open: 활성화 여부)
  function toggle(panel, open) {
    if (!panel) return;

    // 해당 패널의 클래스 제어
    panel.classList.toggle(CLASS_NAME.EDIT_MODE, open);

    // 해당 패널 내의 버튼만 제어
    const btnOpen = panel.querySelector(SELECTOR.BTN_OPEN);
    if (btnOpen) {
      btnOpen.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
  }

  // 이벤트 리스너 통합 관리
  document.addEventListener('click', function (e) {
    const target = e.target;

    // 클릭된 요소가 오픈/클로즈 버튼인지 확인
    const openBtn = target.closest(SELECTOR.BTN_OPEN);
    const closeBtn = target.closest(SELECTOR.BTN_CLOSE);

    if (openBtn) {
      const panel = openBtn.closest(SELECTOR.PANEL);
      toggle(panel, true);
    } else if (closeBtn) {
      const panel = closeBtn.closest(SELECTOR.PANEL);
      toggle(panel, false);
    }
  });

})();