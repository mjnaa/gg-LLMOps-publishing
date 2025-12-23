/*
 * ============================================================================
 * 공통 Input Range 커스텀
 * 1) 기능
 * - input[type="range"] 값에 따라 트랙 채움
 * ============================================================================
 */

(function () {
  'use strict';

  const SELECTOR = {
    RANGE: '.form-range'
  };

  /* ===== 1. 유틸리티 ===== */
  function calcPercent(rangeEl) {
    const min = Number(rangeEl.min || 0);
    const max = Number(rangeEl.max || 100);
    const val = Number(rangeEl.value || 0);

    if (max === min) return 0;

    const pct = ((val - min) * 100) / (max - min);
    return Math.min(100, Math.max(0, pct));
  }

  function applyFill(rangeEl) {
    if (!rangeEl) return;
    const pct = calcPercent(rangeEl);
    rangeEl.style.setProperty('--fill', pct + '%');
  }

  /* ===== 2. 초기 세팅 ===== */
  function init() {
    const ranges = document.querySelectorAll(SELECTOR.RANGE);
    if (!ranges.length) return;

    ranges.forEach((el) => applyFill(el));
  }

  /* ===== 3. 이벤트 바인딩 (위임) ===== */
  document.addEventListener('input', function (e) {
    const rangeEl = e.target;
    if (!rangeEl || !rangeEl.matches(SELECTOR.RANGE)) return;

    applyFill(rangeEl);
  });

  document.addEventListener('DOMContentLoaded', function () {
    init();
  });

})();
