/*
 * ============================================================================
 * 모달 팝업
 * 1) 트리거  
 *    - data-modal-target="#modal-id"
 * 2) 닫기 버튼  
 *    - data-modal-close
 * 3) 모달 속성  
 *    - data-modal  
 *      · data-modal-backdrop-close="false" → 백드롭 클릭 시 닫힘 비활성 (기본 true)  
 *      · data-modal-esc="false" → ESC 닫기 비활성 (기본 true)
 * 4) 기능  
 *    - ESC 닫기 처리  
 *    - 백드롭/오버레이 클릭 닫기(옵션)  
 *    - 포커스 트랩 및 반환  
 *    - 중첩 모달 관리  
 *    - 스크롤 잠금 처리
 * ============================================================================
 */

(function () {
  'use strict';

  /* ===== 상태 관리 ===== */
  var openStack = [];
  var LOCK_CLASS = 'is-scroll-locked';

  /* ===== 포커스 가능 요소 ===== */
  var FOCUSABLE = [
    'a[href]', 'area[href]',
    'button:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  /* ===== z-index 기준 ===== */
  var BASE_Z = 3000;

  /* ===== 유틸 ===== */
  // 모달 열림 여부
  function isOpen(el) {
    return !!(el && el.classList.contains('is-open'));
  }

  // 현재 최상단 모달
  function topModal() {
    return openStack[openStack.length - 1] || null;
  }

  // 모달 패널 요소
  function getPanel(modal) {
    return modal.querySelector('[data-modal-panel]') || modal;
  }

  // 모달 옵션 파싱
  function getOpts(modalEl) {
    return {
      backdropClose: modalEl.getAttribute('data-modal-backdrop-close') !== 'false',
      escClose: modalEl.getAttribute('data-modal-esc') !== 'false'
    };
  }

  /* ===== 스크롤 잠금 ===== */
  function lockScroll() {
    document.documentElement.classList.add(LOCK_CLASS);
    document.body.classList.add(LOCK_CLASS);
  }

  function unlockScroll() {
    if (openStack.length !== 0) return;
    document.documentElement.classList.remove(LOCK_CLASS);
    document.body.classList.remove(LOCK_CLASS);
  }

  /* ===== z-index 레벨 설정 ===== */
  function setZForLevel(modal, level) {
    var backdropZ = BASE_Z + level * 2 - 1;
    var modalZ = BASE_Z + level * 2;

    if (modal.__backdrop) modal.__backdrop.style.zIndex = String(backdropZ);
    modal.style.zIndex = String(modalZ);
  }

  /* ===== 모달을 body로 ===== */
  function portalToBody(modal) {
    // 이미 body 직계거나 포탈된 경우 제외
    if (modal.__placeholder || modal.parentNode === document.body) return;

    var placeholder = document.createComment('modal-placeholder');
    modal.__placeholder = placeholder;
    modal.__originalParent = modal.parentNode;

    modal.parentNode.insertBefore(placeholder, modal);
    document.body.appendChild(modal);
  }

  // 모달 원위치 복구
  function restoreFromPortal(modal) {
    if (!modal.__placeholder || !modal.__originalParent) return;

    modal.__originalParent.insertBefore(modal, modal.__placeholder);
    modal.__placeholder.remove();

    modal.__placeholder = null;
    modal.__originalParent = null;
  }

  /* ===== 포커스 ===== */
  // panel tabindex 저장
  function storePanelTabindex(modal, panel) {
    modal.__prevPanelTabindex = panel.getAttribute('tabindex');
  }

  // panel tabindex 복구
  function restorePanelTabindex(modal, panel) {
    if (modal.__prevPanelTabindex === null) panel.removeAttribute('tabindex');
    else panel.setAttribute('tabindex', modal.__prevPanelTabindex);

    modal.__prevPanelTabindex = null;
  }

  // 모달 열릴 때 포커스 이동
  function moveFocusToPanel(modal) {
    var panel = getPanel(modal);

    storePanelTabindex(modal, panel);
    panel.setAttribute('tabindex', '-1');

    try { panel.focus({ preventScroll: true }); }
    catch (e) { panel.focus(); }
  }

  // Tab 포커스 트랩
  function trapFocus(panel, e) {
    var focusables = panel.querySelectorAll(FOCUSABLE);
    if (!focusables.length) return;

    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    var active = document.activeElement;

    // 포커스가 패널 외부에 있는 경우 보정
    if (!panel.contains(active)) {
      e.preventDefault();
      first.focus();
      return;
    }

    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
      return;
    }

    if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  // 모달 닫힘 후 포커스 처리
  function focusAfterClose(closedModal) {
    var nextTop = topModal();

    // 하위 모달이 남아있으면 해당 모달로 포커스 이동
    if (nextTop) {
      var panel = getPanel(nextTop);
      setTimeout(function () {
        try { panel.focus({ preventScroll: true }); }
        catch (e) { panel.focus(); }
      }, 0);
      return;
    }

    // 스택이 비었으면 오프너로 복귀
    var opener = closedModal.__opener;
    if (opener && opener.focus) {
      setTimeout(function () {
        try { opener.focus({ preventScroll: true }); }
        catch (e) { opener.focus(); }
      }, 0);
    }
  }

  /* ===== 백드롭 ===== */
  function createBackdrop(modal) {
    var backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop is-open';
    backdrop.__modal = modal;

    modal.__backdrop = backdrop;
    document.body.appendChild(backdrop);
  }

  function removeBackdrop(modal) {
    if (!modal.__backdrop) return;
    modal.__backdrop.remove();
    modal.__backdrop = null;
  }

  /* ===== 모달 API ===== */
  var Modal = {
    open: function (selectorOrEl) {
      var modal = (typeof selectorOrEl === 'string')
        ? document.querySelector(selectorOrEl)
        : selectorOrEl;

      if (!modal || isOpen(modal)) return;

      // 오프너 저장 (포커스 복귀용)
      var opener = document.activeElement;
      modal.__opener = (opener && opener.focus) ? opener : null;

      portalToBody(modal);
      createBackdrop(modal);

      openStack.push(modal);
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');

      lockScroll();
      setZForLevel(modal, openStack.length);
      moveFocusToPanel(modal);
    },

    close: function (selectorOrEl) {
      var modal = (typeof selectorOrEl === 'string')
        ? document.querySelector(selectorOrEl)
        : selectorOrEl;

      if (!modal || !isOpen(modal)) return;

      var panel = getPanel(modal);

      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');

      // 스택에서 제거
      var idx = openStack.lastIndexOf(modal);
      if (idx > -1) openStack.splice(idx, 1);

      // 백드롭 제거
      removeBackdrop(modal);

      // 남은 모달 z-index 재정렬
      for (var i = 0; i < openStack.length; i++) {
        setZForLevel(openStack[i], i + 1);
      }

      // tabindex 원복 + 포커스 처리 + 스크롤 잠금 해제 + 포탈 복구
      restorePanelTabindex(modal, panel);
      focusAfterClose(modal);
      unlockScroll();
      restoreFromPortal(modal);
    },

    closeTop: function () {
      var top = topModal();
      if (top) Modal.close(top);
    }
  };

  window.SimpleModal = Modal;

  /* ===== 이벤트 바인딩 ===== */
  document.addEventListener('click', function (e) {

    // 1) 모달 열기
    var trigger = e.target.closest && e.target.closest('[data-modal-target]');
    if (trigger) {
      var sel = trigger.getAttribute('data-modal-target');
      if (sel) {
        e.preventDefault();
        Modal.open(sel);
      }
      return;
    }

    // 2) 닫기 버튼
    var closer = e.target.closest && e.target.closest('[data-modal-close]');
    if (closer) {
      var hostModal = closer.closest('[data-modal]');
      if (hostModal) {
        e.preventDefault();
        e.stopPropagation();
        Modal.close(hostModal);
      }
      return;
    }

    // 3) 백드롭 클릭
    if (e.target.classList && e.target.classList.contains('modal-backdrop')) {
      var modalFromBackdrop = e.target.__modal;
      if (!modalFromBackdrop) return;

      if (getOpts(modalFromBackdrop).backdropClose) {
        Modal.close(modalFromBackdrop);
      }
      return;
    }

    // 4) 오버레이 빈 영역 클릭 
    var top = topModal();
    if (!top) return;

    var panel = getPanel(top);
    var clickedInsideTop = e.target.closest('[data-modal]') === top;
    var clickedInsidePanel = panel.contains(e.target);

    if (clickedInsideTop && !clickedInsidePanel) {
      if (getOpts(top).backdropClose) {
        Modal.close(top);
      }
    }
  });

  document.addEventListener('keydown', function (e) {
    var top = topModal();
    if (!top) return;

    // ESC 닫기
    if (e.key === 'Escape') {
      if (getOpts(top).escClose) {
        e.preventDefault();
        Modal.close(top);
      }
      return;
    }

    // Tab 포커스 트랩
    if (e.key === 'Tab') {
      trapFocus(getPanel(top), e);
    }
  });

})();
