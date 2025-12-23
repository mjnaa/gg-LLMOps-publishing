/*
 * ============================================================================
 * 공통 숫자 슬라이더 (Input Number + Range 동기화)
 * 1) 기능
 * - 같은 영역(form-range-field) 내 number ↔ range 값 동기화
 * - min/max/step/value는 HTML 속성 기준으로 처리 
 * - number 입력 시 범위 보정 후 range에 반영
 * - range 조절 시 number에 즉시 반영
 * ============================================================================
 */

(function () {
  'use strict';

  const SELECTORS = {
    FIELD: '.form-range-field',
    NUMBER: '.js-range-number',
    RANGE: '.js-range-slider'
  };

  /* ===== 1. 유틸리티 ===== */
  function toNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return min;
    if (value < min) return min;
    if (value > max) return max;
    return value;
  }

  function getPair(field) {
    if (!field) return null;

    const numberEl = field.querySelector(SELECTORS.NUMBER) || field.querySelector('input[type="number"]');
    const rangeEl = field.querySelector(SELECTORS.RANGE) || field.querySelector('input[type="range"]');

    if (!numberEl || !rangeEl) return null;

    return { numberEl, rangeEl };
  }

  // range 기준(min/max)으로 number 값을 보정
  function normalizeNumberToRange(numberEl, rangeEl) {
    const min = toNumber(rangeEl.min);
    const max = toNumber(rangeEl.max);

    let value = toNumber(numberEl.value);
    value = clamp(value, min, max);

    numberEl.value = value;
    return value;
  }

  /* ===== 2. 동기화 함수 ===== */
  function syncFromRange(rangeEl, numberEl) {
    if (!rangeEl || !numberEl) return;
    numberEl.value = rangeEl.value;
  }

  function syncFromNumber(numberEl, rangeEl) {
    if (!numberEl || !rangeEl) return;

    const value = normalizeNumberToRange(numberEl, rangeEl);

    rangeEl.value = value;
    rangeEl.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /* ===== 3. 초기화 ===== */
  function initField(field) {
    const pair = getPair(field);
    if (!pair) return;

    const { numberEl, rangeEl } = pair;

    // 초기값은 range를 우선 (없으면 number 기준)
    if (rangeEl.value !== '' && rangeEl.value != null) {
      syncFromRange(rangeEl, numberEl);
    } else if (numberEl.value !== '' && numberEl.value != null) {
      syncFromNumber(numberEl, rangeEl);
    } else {
      // 둘 다 비어있으면 min 기준으로 맞춤
      const min = rangeEl.min !== '' ? rangeEl.min : '0';
      rangeEl.value = min;
      numberEl.value = min;
      rangeEl.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  function initAll() {
    const fields = document.querySelectorAll(SELECTORS.FIELD);
    if (!fields.length) return;

    fields.forEach((field) => {
      initField(field);
    });
  }

  /* ===== 4. 이벤트 위임 ===== */
  document.addEventListener('input', function (e) {
    const target = e.target;
    if (!target) return;

    const field = target.closest(SELECTORS.FIELD);
    if (!field) return;

    const pair = getPair(field);
    if (!pair) return;

    const { numberEl, rangeEl } = pair;

    // range → number
    if (target === rangeEl) {
      syncFromRange(rangeEl, numberEl);
      return;
    }

    // number → range
    if (target === numberEl) {
      syncFromNumber(numberEl, rangeEl);
    }
  });

  /* ===== 5. DOM 로드 후 초기화 ===== */
  document.addEventListener('DOMContentLoaded', function () {
    initAll();
  });

})();
