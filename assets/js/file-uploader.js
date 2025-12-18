/*
 * ============================================================================
 * 공통 파일 업로더
 * 1) 기능
 * - UI 제어: 파일 선택 시 드롭존 숨김 및 파일 정보 표시 (토글)
 * - 드래그 앤 드롭: 인풋 영역에 파일 드래그 시 업로드 지원
 * - 파일 정보: 파일명 및 용량(KB, MB) 자동 계산 표기
 * - 초기화: 삭제 버튼 클릭 시 인풋 값 초기화 및 UI 복귀
 * ============================================================================
 */

(function () {
  'use strict';

  const SELECTORS = {
    WRAPPER: '[data-file-uploader]',
    INPUT: '[data-form-file-input]',
    ITEM: '[data-form-file-item]',
    NAME: '[data-form-file-name]',
    SIZE: '[data-form-file-size]',
    REMOVE: '[data-form-file-remove]'
  };

  const CLASSES = {
    FILLED: 'is-filled',
    DRAG_OVER: 'is-dragover',
    ERROR: 'is-error'
  };

  /* ===== 1. 유틸리티 ===== */
  // 파일 용량 변환 (Bytes -> KB, MB)
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }


  /* ===== 2. UI 업데이트 ===== */
  function updateFileUI(wrapper, file) {
    const $item = wrapper.querySelector(SELECTORS.ITEM);
    const $name = wrapper.querySelector(SELECTORS.NAME);
    const $size = wrapper.querySelector(SELECTORS.SIZE);

    if (!file) return;

    // 파일 정보 주입
    if ($name) $name.textContent = file.name;
    if ($size) $size.textContent = formatFileSize(file.size);

    // 클래스 토글 (CSS .form-file.is-filled 제어)
    wrapper.classList.add(CLASSES.FILLED);
    
    // 드롭존 효과 제거
    wrapper.classList.remove(CLASSES.DRAG_OVER);
  }

  function resetFileUI(wrapper) {
    const $input = wrapper.querySelector(SELECTORS.INPUT);
    const $name = wrapper.querySelector(SELECTORS.NAME);
    const $size = wrapper.querySelector(SELECTORS.SIZE);

    // 인풋 값 초기화 (동일 파일 재선택 가능하도록)
    if ($input) $input.value = '';

    // 텍스트 초기화
    if ($name) $name.textContent = '';
    if ($size) $size.textContent = '';

    // 클래스 제거
    wrapper.classList.remove(CLASSES.FILLED);
    wrapper.classList.remove(CLASSES.ERROR);
  }


  /* ===== 3. 핸들러 로직 ===== */
  function handleFileSelect(e) {
    const input = e.target;
    const wrapper = input.closest(SELECTORS.WRAPPER);
    if (!wrapper) return;

    // 확장성 고려: 현재는 단일 파일(files[0])만 처리. 
    // 추후 multiple 속성 사용 시 files 루프 필요.
    const file = input.files[0];

    if (file) {
      updateFileUI(wrapper, file);
    } else {
      // 파일 선택 창 열었다가 취소했을 경우 처리
    }
  }

  function handleRemoveClick(e) {
    const btn = e.target.closest(SELECTORS.REMOVE);
    if (!btn) return;

    const wrapper = btn.closest(SELECTORS.WRAPPER);
    if (wrapper) {
      resetFileUI(wrapper);
    }
  }

  /* ===== 4. 드래그 앤 드롭 이벤트 ===== */
  function initDragAndDrop() {
    const wrappers = document.querySelectorAll(SELECTORS.WRAPPER);

    wrappers.forEach(wrapper => {
      const input = wrapper.querySelector(SELECTORS.INPUT);
      if (!input) return;

      // 기본 브라우저 동작 방지
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        wrapper.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
        }, false);
      });

      // 스타일 활성화
      ['dragenter', 'dragover'].forEach(eventName => {
        wrapper.addEventListener(eventName, () => {
          if (!wrapper.classList.contains(CLASSES.FILLED)) {
            wrapper.classList.add(CLASSES.DRAG_OVER);
          }
        }, false);
      });

      // 스타일 비활성화
      ['dragleave', 'drop'].forEach(eventName => {
        wrapper.addEventListener(eventName, () => {
          wrapper.classList.remove(CLASSES.DRAG_OVER);
        }, false);
      });

      // 파일 드롭 처리
      wrapper.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files && files.length > 0) {
          input.files = files; // 인풋에 파일 할당
          // 수동으로 change 이벤트 트리거
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, false);
    });
  }


  /* ===== 5. 초기화 및 이벤트 바인딩 ===== */
  
  // input change 이벤트 위임
  document.addEventListener('change', (e) => {
    if (e.target.matches(SELECTORS.INPUT)) {
      handleFileSelect(e);
    }
  });

  // remove button click 이벤트 위임
  document.addEventListener('click', (e) => {
    if (e.target.closest(SELECTORS.REMOVE)) {
      handleRemoveClick(e);
    }
  });

  // DOM 로드 후 드래그 앤 드롭 초기화
  document.addEventListener('DOMContentLoaded', () => {
    initDragAndDrop();
  });

})();