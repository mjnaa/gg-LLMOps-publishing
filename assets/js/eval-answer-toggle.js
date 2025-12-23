/*
 * ============================================================================
 * 평가 관리 / 평가 결과 - 답변 전체보기 토글 (92-evaluation-create-step2.html)
 * 1) 기능
 * - 7줄 초과 시 말줄임 표시 + 전체보기 버튼 활성화 
 * ============================================================================
 */

(function () {
  'use strict';

  const ITEMS = document.querySelectorAll('.eval-answer');
  const MAX_LINES = 7;

  ITEMS.forEach(item => {
    const text = item.querySelector('.eval-answer-text');
    const btn  = item.querySelector('.eval-answer-more');
    if (!text || !btn) return;

    // 1) clamp 제거한 상태에서 실제 높이 측정
    const originalDisplay = text.style.display;
    text.style.display = 'block';

    const lineHeight = parseFloat(getComputedStyle(text).lineHeight);
    const maxHeight  = lineHeight * MAX_LINES;

    const isOverflow = text.scrollHeight > maxHeight + 1;

    // 원복
    text.style.display = originalDisplay;

    // 2) 넘칠 때만 버튼 활성화
    if (!isOverflow) return;

    btn.hidden = false;

    btn.addEventListener('click', () => {
      const expanded = item.classList.toggle('is-expanded');
      btn.textContent = expanded ? '접기' : '+ 전체보기';
      btn.setAttribute('aria-expanded', expanded);
    });
  });
})();
