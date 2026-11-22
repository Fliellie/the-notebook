(() => {
  'use strict';

  const SHEET_W = 640;
  const SHEET_H = 906;
  const MAX_CHARS_PER_LINE = 71;

  const state = {
    bookId: null,
    book: null,
    pages: [],
    spreadIndex: 0,
    activeSide: 'left',
    activeTool: 'text',
    zoomedMode: false,
    overviewMode: false,
    inkColor: '#153b75',
    drawStyle: {
      color: '#1e1b18',
      width: 2.5,
      opacity: 1
    },
    dirtyPages: new Set(),
    saveTimer: null,
    searchQuery: '',
    searchMatches: [],
    searchCursor: -1,
    contextTargetSide: 'left',
    isHandlingOverflow: false,
    isErasing: false
  };

  const dom = {};

  function cacheDom() {
    dom.paperWorkspace = document.getElementById('paperWorkspace');
    dom.spreadScaleStage = document.getElementById('spreadScaleStage');
    dom.paperSpread = document.getElementById('paperSpread');

    dom.btnBackLibrary = document.getElementById('btnBackLibrary');
    dom.btnPrevSpread = document.getElementById('btnPrevSpread');
    dom.btnNextSpread = document.getElementById('btnNextSpread');

    dom.leftPage = document.getElementById('leftPage');
    dom.rightPage = document.getElementById('rightPage');
    dom.leftTitle = document.getElementById('leftTitle');
    dom.leftDate = document.getElementById('leftDate');
    dom.rightTitle = document.getElementById('rightTitle');
    dom.rightDate = document.getElementById('rightDate');

    dom.leftEditor = document.getElementById('leftEditor');
    dom.rightEditor = document.getElementById('rightEditor');

    dom.leftSvg = document.getElementById('leftSvg');
    dom.rightSvg = document.getElementById('rightSvg');
    dom.leftImages = document.getElementById('leftImages');
    dom.rightImages = document.getElementById('rightImages');
    dom.leftTables = document.getElementById('leftTables');
    dom.rightTables = document.getElementById('rightTables');
    dom.leftFreeTexts = document.getElementById('leftFreeTexts');
    dom.rightFreeTexts = document.getElementById('rightFreeTexts');

    dom.leftPageNum = document.getElementById('leftPageNum');
    dom.rightPageNum = document.getElementById('rightPageNum');

    dom.btnInsertTable = document.getElementById('btnInsertTable');
    dom.btnInsertFreeText = document.getElementById('btnInsertFreeText');
    dom.btnToggleHeading = document.getElementById('btnToggleHeading');
    dom.btnToggleCode = document.getElementById('btnToggleCode');
    dom.btnOverviewGrid = document.getElementById('btnOverviewGrid');
    dom.btnOpenSketchpad = document.getElementById('btnOpenSketchpad');

    dom.searchInput = document.getElementById('searchInput');
    dom.searchBadge = document.getElementById('searchBadge');
    dom.jumpPageInput = document.getElementById('jumpPageInput');
    dom.btnToggleZoom = document.getElementById('btnToggleZoom');
    dom.zoomIconLabel = document.getElementById('zoomIconLabel');
    dom.saveDot = document.getElementById('saveDot');

    dom.overviewViewport = document.getElementById('overviewViewport');
    dom.overviewGrid = document.getElementById('overviewGrid');

    dom.drawStylePanel = document.getElementById('drawStylePanel');
    dom.strokeSwatches = document.getElementById('strokeSwatches');
    dom.strokeWidthRow = document.getElementById('strokeWidthRow');
    dom.strokeOpacitySlider = document.getElementById('strokeOpacitySlider');
    dom.opacityValLabel = document.getElementById('opacityValLabel');
    dom.btnUndoDraw = document.getElementById('btnUndoDraw');
    dom.btnClearDraw = document.getElementById('btnClearDraw');

    dom.zoomStatusTag = document.getElementById('zoomStatusTag');
    dom.pageCounterText = document.getElementById('pageCounterText');

    dom.pageContextMenu = document.getElementById('pageContextMenu');
    dom.ctxAddLeft = document.getElementById('ctxAddLeft');
    dom.ctxAddRight = document.getElementById('ctxAddRight');
    dom.ctxDeletePage = document.getElementById('ctxDeletePage');

    dom.guideBackdrop = document.getElementById('guideBackdrop');
    dom.btnOpenGuide = document.getElementById('btnOpenGuide');
    dom.btnCloseGuide = document.getElementById('btnCloseGuide');
  }

  /* ================= PAGE DATA HELPERS ================= */
  function createBlankPage(title = '', date = '') {
    return {
      title,
      date,
      content: '',
      shapes: [],
      images: [],
      tables: [],
      freeTexts: []
    };
  }

  function normalizePage(rawPage) {
    if (!rawPage || typeof rawPage !== 'object') return createBlankPage();
    let content = '';
    if (typeof rawPage.content === 'string') {
      content = rawPage.content;
    } else if (typeof NotebookStore._legacyLinesToMarkdown === 'function') {
      content = NotebookStore._legacyLinesToMarkdown(rawPage);
    } else if (Array.isArray(rawPage.lines)) {
      content = rawPage.lines.join('\n').trimEnd();
    }

    return {
      title: rawPage.title || '',
      date: rawPage.date || '',
      content,
      shapes: Array.isArray(rawPage.shapes) ? rawPage.shapes : [],
      images: Array.isArray(rawPage.images) ? rawPage.images : [],
      tables: Array.isArray(rawPage.tables) ? rawPage.tables : [],
      freeTexts: Array.isArray(rawPage.freeTexts) ? rawPage.freeTexts : []
    };
  }

  function ensureEvenPages() {
    while (state.pages.length < 2) {
      state.pages.push(createBlankPage());
    }
    if (state.pages.length % 2 !== 0) {
      state.pages.push(createBlankPage());
    }
  }

  function getPageIndex(side) {
    return side === 'right' ? state.spreadIndex + 1 : state.spreadIndex;
  }

  function getPage(side) {
    const idx = getPageIndex(side);
    if (!state.pages[idx]) {
      state.pages[idx] = createBlankPage();
    }
    return state.pages[idx];
  }

  function getSideRefs(side) {
    if (side === 'right') {
      return {
        pageEl: dom.rightPage,
        titleEl: dom.rightTitle,
        dateEl: dom.rightDate,
        editor: dom.rightEditor,
        svg: dom.rightSvg,
        images: dom.rightImages,
        tables: dom.rightTables,
        freeTexts: dom.rightFreeTexts,
        badge: dom.rightPageNum
      };
    }
    return {
      pageEl: dom.leftPage,
      titleEl: dom.leftTitle,
      dateEl: dom.leftDate,
      editor: dom.leftEditor,
      svg: dom.leftSvg,
      images: dom.leftImages,
      tables: dom.leftTables,
      freeTexts: dom.leftFreeTexts,
      badge: dom.leftPageNum
    };
  }

  /* ================= PERSISTENCE ================= */
  function markDirty(pageIdx) {
    if (typeof pageIdx === 'number' && pageIdx >= 0) {
      state.dirtyPages.add(pageIdx);
    }
    scheduleSave();
  }

  function scheduleSave() {
    if (dom.saveDot) dom.saveDot.classList.add('saving');
    clearTimeout(state.saveTimer);
    state.saveTimer = setTimeout(flushSave, 350);
  }

  function flushSave() {
    clearTimeout(state.saveTimer);
    if (!state.bookId) return;

    const firstPage = state.pages[0] || {};
    const metaPatch = {
      title: (firstPage.title && firstPage.title.trim()) || state.book?.title || 'Untitled Volume',
      date: (firstPage.date && firstPage.date.trim()) || state.book?.date || '',
      ink_color: state.inkColor,
      font_index: 0
    };

    const dirtyCopy = new Set(state.dirtyPages);
    state.dirtyPages.clear();

    NotebookStore.saveNoteDelta(state.bookId, metaPatch, state.pages, dirtyCopy);
    if (dom.saveDot) dom.saveDot.classList.remove('saving');
  }

  /* ================= MARKDOWN & MATH ($$ & //) <-> LIVE WYSIWYG DOM ================= */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function extractBracedGroup(str, openIndex) {
    if (str[openIndex] !== '{') return null;
    let depth = 0;
    for (let i = openIndex; i < str.length; i++) {
      if (str[i] === '{') {
        depth++;
      } else if (str[i] === '}') {
        depth--;
        if (depth === 0) {
          return {
            content: str.slice(openIndex + 1, i),
            endIndex: i
          };
        }
      }
    }
    return null;
  }



function normalizeLatexInput(rawExpr) {
    return String(rawExpr || '')
      .trim()
      // Tu dong sua loi copy bi nhan doi dau '\' (VD: \\, -> \, ; \\Big\\vert -> \Big\vert ; \\int -> \int)
      .replace(/\\\\([,;!: ]|[a-zA-Z]+)/g, '\\$1')
      // Ho tro go nhanh 'pi' va '*' trong cu phap //...//
      .replace(/(^|[^\\a-zA-Z])pi\b/g, '$1\\pi')
      .replace(/\s*\*\s*/g, ' \\cdot ');
  }

  function renderMathFormula(rawExpr, isBlock = false) {
    const cleaned = normalizeLatexInput(rawExpr);
    if (!cleaned) return '';

    // Uu tien dung KaTeX neu co mang de hien thi chuan sach giao khoa
    if (window.katex && typeof window.katex.renderToString === 'function') {
      try {
        return window.katex.renderToString(cleaned, {
          displayMode: Boolean(isBlock),
          throwOnError: true,
          strict: false
        });
      } catch (_) {
        // Neu cong thuc go tat khong phai LaTeX chuan thi chuyen sang bo dung du phong ben duoi
      }
    }

    let expr = cleaned;
    const M1 = String.fromCharCode(1);
    const fracTokens = [];
    const sqrtTokens = [];

    // 1. Xu ly \frac{tu}{mau}
    let fracIdx;
    while ((fracIdx = expr.indexOf('\\frac{')) !== -1) {
      const numGrp = extractBracedGroup(expr, fracIdx + 5);
      if (!numGrp || expr[numGrp.endIndex + 1] !== '{') break;
      const denGrp = extractBracedGroup(expr, numGrp.endIndex + 1);
      if (!denGrp) break;

      const tokenIdx = fracTokens.length;
      const numHtml = renderMathFormula(numGrp.content, false);
      const denHtml = renderMathFormula(denGrp.content, false);
      fracTokens.push(
        `<span class="math-frac"><span class="math-num">${numHtml}</span><span class="math-den">${denHtml}</span></span>`
      );
      expr = expr.slice(0, fracIdx) + `${M1}FRAC${tokenIdx}${M1}` + expr.slice(denGrp.endIndex + 1);
    }

    // 2. Xu ly \sqrt[n]{...} va \sqrt{...}
    expr = expr.replace(/\\sqrt\[([^\]]+)\]\{([^{}]+)\}/g, (_, deg, rad) => {
      const idx = sqrtTokens.length;
      const degHtml = renderMathFormula(deg, false);
      const radHtml = renderMathFormula(rad, false);
      sqrtTokens.push(
        `<sup>${degHtml}</sup><span class="math-sqrt"><span class="math-radic">√</span><span class="math-radicand">${radHtml}</span></span>`
      );
      return `${M1}SQRT${idx}${M1}`;
    });

    let sqrtIdx;
    while ((sqrtIdx = expr.indexOf('\\sqrt{')) !== -1) {
      const radGrp = extractBracedGroup(expr, sqrtIdx + 5);
      if (!radGrp) break;
      const idx = sqrtTokens.length;
      const radHtml = renderMathFormula(radGrp.content, false);
      sqrtTokens.push(
        `<span class="math-sqrt"><span class="math-radic">√</span><span class="math-radicand">${radHtml}</span></span>`
      );
      expr = expr.slice(0, sqrtIdx) + `${M1}SQRT${idx}${M1}` + expr.slice(radGrp.endIndex + 1);
    }

    let html = escapeHtml(expr);

    html = html.replace(/\\(?:Big|big|Bigg|bigg)?\\vert/g, '<span class="math-tall-bar">|</span>');
    html = html.replace(/\\(?:Big|big|Bigg|bigg)\|/g, '<span class="math-tall-bar">|</span>');
    html = html.replace(/\\vert/g, '|');
    html = html.replace(/\\[,;:]/g, '&thinsp;');
    html = html.replace(/\\q?quad/g, '&emsp;');
    html = html.replace(/\\!/g, '');

    const symbols = {
      '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\Gamma': 'Γ',
      '\\delta': 'δ', '\\Delta': 'Δ', '\\epsilon': 'ε', '\\varepsilon': 'ε',
      '\\zeta': 'ζ', '\\eta': 'η', '\\theta': 'θ', '\\Theta': 'Θ',
      '\\iota': 'ι', '\\kappa': 'κ', '\\lambda': 'λ', '\\Lambda': 'Λ',
      '\\mu': 'μ', '\\nu': 'ν', '\\xi': 'ξ', '\\pi': 'π', '\\Pi': 'Π',
      '\\rho': 'ρ', '\\sigma': 'σ', '\\Sigma': 'Σ', '\\tau': 'τ',
      '\\phi': 'φ', '\\varphi': 'φ', '\\Phi': 'Φ', '\\chi': 'χ',
      '\\psi': 'ψ', '\\Psi': 'Ψ', '\\omega': 'ω', '\\Omega': 'Ω',
      '\\infty': '∞', '\\partial': '∂', '\\nabla': '∇',
      '\\sum': '∑', '\\prod': '∏', '\\int': '∫', '\\oint': '∮',
      '\\leq': '≤', '\\le': '≤', '\\geq': '≥', '\\ge': '≥',
      '\\neq': '≠', '\\ne': '≠', '\\approx': '≈', '\\equiv': '≡', '\\sim': '∼', '\\propto': '∝',
      '\\times': '×', '\\cdot': '·', '\\div': '÷', '\\pm': '±', '\\mp': '∓',
      '\\to': '→', '\\rightarrow': '→', '\\leftarrow': '←', '\\leftrightarrow': '↔',
      '\\Rightarrow': '⇒', '\\Leftarrow': '⇐', '\\Leftrightarrow': '⇔',
      '\\forall': '∀', '\\exists': '∃', '\\in': '∈', '\\notin': '∉',
      '\\subset': '⊂', '\\subseteq': '⊆', '\\cup': '∪', '\\cap': '∩',
      '\\emptyset': '∅', '\\degree': '°', '\\circ': '°', '\\angle': '∠', '\\perp': '⊥', '\\parallel': '∥', '\\triangle': '△'
    };

    for (const [cmd, uni] of Object.entries(symbols)) {
      html = html.split(cmd).join(uni);
    }

    html = html.replace(/\\(sin|cos|tan|cot|sec|csc|log|ln|lim|max|min|det|gcd)\b/g, '$1');

    // Can tren va can duoi xep chong len nhau (_a^b hoac ^b_a)
    html = html.replace(
      /_(?:\{([^{}]+)\}|([0-9a-zA-Z+\-∞]))\^(?:\{([^{}]+)\}|([0-9a-zA-Z+\-∞]))/g,
      (_, sub1, sub2, sup1, sup2) =>
        `<span class="math-limits"><span class="math-sup">${sup1 || sup2}</span><span class="math-sub">${sub1 || sub2}</span></span>`
    );
    html = html.replace(
      /\^(?:\{([^{}]+)\}|([0-9a-zA-Z+\-∞]))_(?:\{([^{}]+)\}|([0-9a-zA-Z+\-∞]))/g,
      (_, sup1, sup2, sub1, sub2) =>
        `<span class="math-limits"><span class="math-sup">${sup1 || sup2}</span><span class="math-sub">${sub1 || sub2}</span></span>`
    );

    html = html.replace(/\^\{([^{}]+)\}/g, '<sup>$1</sup>');
    html = html.replace(/\^([0-9a-zA-Z+\-°∞])/g, '<sup>$1</sup>');
    html = html.replace(/_\{([^{}]+)\}/g, '<sub>$1</sub>');
    html = html.replace(/_([0-9a-zA-Z+\-∞])/g, '<sub>$1</sub>');

    html = html.replace(/\\(?:left|right|Big|big|Bigg|bigg)/g, '').replace(/[{}]/g, '');

    const fracRestoreRe = new RegExp(`${M1}FRAC(\\d+)${M1}`, 'g');
    const sqrtRestoreRe = new RegExp(`${M1}SQRT(\\d+)${M1}`, 'g');
    html = html.replace(fracRestoreRe, (_, idx) => fracTokens[Number(idx)] || '');
    html = html.replace(sqrtRestoreRe, (_, idx) => sqrtTokens[Number(idx)] || '');
    return html;
  }

function createMathElement(rawExpr, delim = '$$', isBlock = false) {
    const cleanExpr = String(rawExpr || '').trim();
    const el = document.createElement(isBlock ? 'div' : 'span');
    el.className = isBlock ? 'md-math-block' : 'md-math';
    el.setAttribute('contenteditable', 'false');
    el.dataset.delim = delim;
    el.dataset.math = cleanExpr;
    el.title = 'Nhấp đúp để sửa công thức';
    el.innerHTML = renderMathFormula(cleanExpr, isBlock);
    return el;
  }

  function formatInlineMarkdown(rawText) {
    const M0 = String.fromCharCode(0);
    const codeTokens = [];
    const mathTokens = [];

    // 1. Tach inline code `...`
    let working = String(rawText).replace(/`([^`\n]+)`/g, (_, code) => {
      const idx = codeTokens.length;
      codeTokens.push(`<code>${escapeHtml(code)}</code>`);
      return `${M0}CODE${idx}${M0}`;
    });

    // 2. Tach cong thuc $$...$$
    working = working.replace(/\$\$((?:(?!\$\$)[^\n])+?)\$\$/g, (full, expr) => {
      const trimmed = expr.trim();
      if (!trimmed) return full;
      const idx = mathTokens.length;
      const rendered = renderMathFormula(trimmed, false);
      mathTokens.push(
        `<span class="md-math" contenteditable="false" data-delim="$$" data-math="${escapeHtml(trimmed)}" title="Nhấp đúp để sửa công thức">${rendered}</span>`
      );
      return `${M0}MATH${idx}${M0}`;
    });

    // 3. Tach cong thuc //...// (bo qua http://, https://)
    working = working.replace(/(^|[^:/\\])\/\/((?:(?!\/\/)[^\n])+?)\/\//g, (full, prefix, expr) => {
      const trimmed = expr.trim();
      if (!trimmed) return full;
      const idx = mathTokens.length;
      const rendered = renderMathFormula(trimmed, false);
      mathTokens.push(
        `<span class="md-math" contenteditable="false" data-delim="//" data-math="${escapeHtml(trimmed)}" title="Nhấp đúp để sửa công thức">${rendered}</span>`
      );
      return `${prefix}${M0}MATH${idx}${M0}`;
    });

    // 4. Format Markdown con lai
    let text = escapeHtml(working);
    text = text.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
    text = text.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    text = text.replace(/==([^=]+)==/g, '<mark>$1</mark>');

    const mathRestoreRe = new RegExp(`${M0}MATH(\\d+)${M0}`, 'g');
    const codeRestoreRe = new RegExp(`${M0}CODE(\\d+)${M0}`, 'g');
    text = text.replace(mathRestoreRe, (_, idx) => mathTokens[Number(idx)] || '');
    text = text.replace(codeRestoreRe, (_, idx) => codeTokens[Number(idx)] || '');
    return text;
  }

  function markdownToEditorHtml(mdSource) {
    const src = (mdSource || '').replace(/\r\n/g, '\n');
    if (!src) return '';

    const lines = src.split('\n');
    const out = [];
    let inCode = false;
    let codeLines = [];
    let inMathBlock = false;
    let mathBlockLines = [];
    let listType = null;

    const closeList = () => {
      if (listType) {
        out.push(`</${listType}>`);
        listType = null;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (/^\s*```/.test(line) && !inMathBlock) {
        closeList();
        if (!inCode) {
          inCode = true;
          codeLines = [];
        } else {
          const codeBody = codeLines.length ? escapeHtml(codeLines.join('\n')) : '<br>';
          out.push(`<pre class="md-code-block"><code>${codeBody}</code></pre>`);
          inCode = false;
          codeLines = [];
        }
        continue;
      }

      if (inCode) {
        codeLines.push(line);
        continue;
      }

      if (/^\s*\$\$\s*$/.test(line)) {
        closeList();
        if (!inMathBlock) {
          inMathBlock = true;
          mathBlockLines = [];
        } else {
          const rawMath = mathBlockLines.join('\n').trim();
          const rendered = renderMathFormula(rawMath, true) || '<br>';
          out.push(
            `<div class="md-math-block" contenteditable="false" data-delim="$$" data-multiline="1" data-math="${escapeHtml(rawMath)}" title="Nhấp đúp để sửa công thức">${rendered}</div>`
          );
          inMathBlock = false;
          mathBlockLines = [];
        }
        continue;
      }

      if (inMathBlock) {
        mathBlockLines.push(line);
        continue;
      }

      const singleBlockMath = line.match(/^\s*\$\$((?:(?!\$\$).)+?)\$\$\s*$/);
      if (singleBlockMath) {
        closeList();
        const rawMath = singleBlockMath[1].trim();
        out.push(
          `<div class="md-math-block" contenteditable="false" data-delim="$$" data-math="${escapeHtml(rawMath)}" title="Nhấp đúp để sửa công thức">${renderMathFormula(rawMath, true)}</div>`
        );
        continue;
      }

      const singleSlashBlockMath = line.match(/^\s*\/\/((?:(?!\/\/).)+?)\/\/\s*$/);
      if (singleSlashBlockMath) {
        closeList();
        const rawMath = singleSlashBlockMath[1].trim();
        out.push(
          `<div class="md-math-block" contenteditable="false" data-delim="//" data-math="${escapeHtml(rawMath)}" title="Nhấp đúp để sửa công thức">${renderMathFormula(rawMath, true)}</div>`
        );
        continue;
      }

      if (/^\s*([-*_]){3,}\s*$/.test(line)) {
        closeList();
        out.push('<hr>');
        continue;
      }

      const hMatch = line.match(/^(#{1,3})\s+(.*)$/);
      if (hMatch) {
        closeList();
        const lvl = hMatch[1].length;
        const inner = hMatch[2] ? formatInlineMarkdown(hMatch[2]) : '<br>';
        out.push(`<h${lvl}>${inner}</h${lvl}>`);
        continue;
      }

      const qMatch = line.match(/^\s*>\s?(.*)$/);
      if (qMatch) {
        closeList();
        const inner = qMatch[1] ? formatInlineMarkdown(qMatch[1]) : '<br>';
        out.push(`<blockquote>${inner}</blockquote>`);
        continue;
      }

      const ulMatch = line.match(/^\s*[-*+]\s+(.*)$/);
      if (ulMatch) {
        if (listType !== 'ul') {
          closeList();
          listType = 'ul';
          out.push('<ul>');
        }
        out.push(`<li>${ulMatch[1] ? formatInlineMarkdown(ulMatch[1]) : '<br>'}</li>`);
        continue;
      }

      const olMatch = line.match(/^\s*\d+[.)]\s+(.*)$/);
      if (olMatch) {
        if (listType !== 'ol') {
          closeList();
          listType = 'ol';
          out.push('<ol>');
        }
        out.push(`<li>${olMatch[1] ? formatInlineMarkdown(olMatch[1]) : '<br>'}</li>`);
        continue;
      }

      closeList();
      if (line === '') {
        out.push('<div><br></div>');
      } else {
        out.push(`<div>${formatInlineMarkdown(line)}</div>`);
      }
    }

    if (inCode) {
      const codeBody = codeLines.length ? escapeHtml(codeLines.join('\n')) : '<br>';
      out.push(`<pre class="md-code-block"><code>${codeBody}</code></pre>`);
    }
    if (inMathBlock) {
      const rawMath = mathBlockLines.join('\n').trim();
      const rendered = renderMathFormula(rawMath, true) || '<br>';
      out.push(
        `<div class="md-math-block" contenteditable="false" data-delim="$$" data-multiline="1" data-math="${escapeHtml(rawMath)}">${rendered}</div>`
      );
    }
    closeList();
    return out.join('');
  }

  function inlineNodeToMarkdown(node) {
    if (!node) return '';
    if (node.nodeType === Node.TEXT_NODE) {
      return node.nodeValue.replace(/\u00A0/g, ' ');
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return '';

    const tag = node.tagName.toLowerCase();
    if (tag === 'br') return '';

    if (node.classList && node.classList.contains('md-math')) {
      const delim = node.dataset.delim || '$$';
      const rawMath = node.dataset.math || node.textContent || '';
      return rawMath ? `${delim}${rawMath}${delim}` : '';
    }

    let inner = '';
    node.childNodes.forEach(ch => {
      inner += inlineNodeToMarkdown(ch);
    });

    if (tag === 'strong' || tag === 'b') return inner ? `**${inner}**` : '';
    if (tag === 'em' || tag === 'i') return inner ? `*${inner}*` : '';
    if (tag === 'del' || tag === 's') return inner ? `~~${inner}~~` : '';
    if (tag === 'mark') return inner ? `==${inner}==` : '';
    if (tag === 'code') return inner ? `\`${inner}\`` : '';
    return inner;
  }

  function editorHtmlToMarkdown(editorEl) {
    if (!editorEl) return '';
    const lines = [];

    editorEl.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        const txt = node.nodeValue.replace(/\u00A0/g, ' ');
        if (txt !== '') lines.push(txt);
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;

      const tag = node.tagName.toLowerCase();
      if (node.classList && node.classList.contains('md-math-block')) {
        const delim = node.dataset.delim || '$$';
        const rawMath = (node.dataset.math || node.textContent || '').trim();
        if (node.dataset.multiline === '1' && delim === '$$') {
          lines.push('$$');
          if (rawMath) lines.push(rawMath);
          lines.push('$$');
        } else {
          lines.push(`${delim}${rawMath}${delim}`);
        }
      } else if (tag === 'h1') {
        lines.push(`# ${inlineNodeToMarkdown(node)}`);
      } else if (tag === 'h2') {
        lines.push(`## ${inlineNodeToMarkdown(node)}`);
      } else if (tag === 'h3') {
        lines.push(`### ${inlineNodeToMarkdown(node)}`);
      } else if (tag === 'blockquote') {
        lines.push(`> ${inlineNodeToMarkdown(node)}`);
      } else if (tag === 'hr') {
        lines.push('---');
      } else if (tag === 'pre') {
        const rawCode = (node.innerText || '').replace(/\r\n/g, '\n').replace(/\n$/, '');
        lines.push('```');
        if (rawCode !== '') lines.push(rawCode);
        lines.push('```');
      } else if (tag === 'ul') {
        node.querySelectorAll(':scope > li').forEach(li => {
          lines.push(`- ${inlineNodeToMarkdown(li)}`);
        });
      } else if (tag === 'ol') {
        let idx = 1;
        node.querySelectorAll(':scope > li').forEach(li => {
          lines.push(`${idx++}. ${inlineNodeToMarkdown(li)}`);
        });
      } else {
        lines.push(inlineNodeToMarkdown(node));
      }
    });

    return lines.join('\n');
  }

  function syncEditorToPage(side) {
    const refs = getSideRefs(side);
    const page = getPage(side);
    page.content = editorHtmlToMarkdown(refs.editor);
    markDirty(getPageIndex(side));
  }

  /* ================= SELECTION & CARET HELPERS ================= */
  function getCurrentBlock(editorEl) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return null;
    let node = sel.anchorNode;
    if (!node || !editorEl.contains(node)) return null;

    if (node === editorEl) {
      const idx = Math.min(sel.anchorOffset, editorEl.childNodes.length - 1);
      node = editorEl.childNodes[idx] || null;
    }

    while (node && node !== editorEl && node.parentNode !== editorEl) {
      node = node.parentNode;
    }
    return node && node !== editorEl ? node : null;
  }

  function placeCaretAtEnd(el) {
    if (!el) return;
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(el);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function placeCaretAtStart(el) {
    if (!el) return;
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(el);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function getCaretOffsetWithin(rootEl) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || !rootEl.contains(sel.anchorNode)) return 0;
    const range = sel.getRangeAt(0).cloneRange();
    range.selectNodeContents(rootEl);
    range.setEnd(sel.anchorNode, sel.anchorOffset);
    return range.toString().length;
  }

  function setCaretOffsetWithin(rootEl, charOffset) {
    if (!rootEl) return;
    const sel = window.getSelection();
    const range = document.createRange();
    let remaining = Math.max(0, charOffset);
    let placed = false;

    const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, null);
    let curr;
    while ((curr = walker.nextNode())) {
      const len = curr.nodeValue.length;
      if (remaining <= len) {
        range.setStart(curr, remaining);
        range.collapse(true);
        placed = true;
        break;
      }
      remaining -= len;
    }

    if (!placed) {
      range.selectNodeContents(rootEl);
      range.collapse(false);
    }
    sel.removeAllRanges();
    sel.addRange(range);
  }

  /* ================= ENFORCE MAX 71 CHARS PER LINE ================= */
  function enforceMaxCharsPerLine(side) {
    const refs = getSideRefs(side);
    const editor = refs.editor;
    let block = getCurrentBlock(editor);
    if (!block || block.nodeType !== Node.ELEMENT_NODE) return;

    const tag = block.tagName.toLowerCase();
    if (
      tag === 'pre' ||
      /^h[1-3]$/.test(tag) ||
      tag === 'ul' ||
      tag === 'ol' ||
      block.classList.contains('md-math-block') ||
      block.querySelector('.md-math, code, strong, em, mark')
    ) return;

    const plain = (block.textContent || '').replace(/\u00A0/g, ' ');
    if (plain.length <= MAX_CHARS_PER_LINE) return;

    let breakAt = plain.lastIndexOf(' ', MAX_CHARS_PER_LINE);
    if (breakAt <= 0) {
      breakAt = MAX_CHARS_PER_LINE;
    }

    const firstLine = plain.slice(0, breakAt).trimEnd();
    const secondLine = plain.slice(breakAt).replace(/^\s+/, '');
    const caretPos = getCaretOffsetWithin(block);

    block.textContent = firstLine;
    const nextDiv = document.createElement('div');
    nextDiv.textContent = secondLine || '';
    if (block.nextSibling) {
      editor.insertBefore(nextDiv, block.nextSibling);
    } else {
      editor.appendChild(nextDiv);
    }

    if (caretPos > breakAt) {
      setCaretOffsetWithin(nextDiv, Math.max(0, caretPos - breakAt - (plain[breakAt] === ' ' ? 1 : 0)));
    } else {
      setCaretOffsetWithin(block, Math.min(caretPos, firstLine.length));
    }
  }

  /* ================= LIVE HEADING (ALT + 1) & CODE BLOCK (ALT + 2) ================= */
  function toggleHeadingOnActiveSide() {
    setTool('text');
    const side = state.activeSide;
    const refs = getSideRefs(side);
    const editor = refs.editor;
    editor.focus();

    if (!editor.firstChild) {
      const div = document.createElement('div');
      div.innerHTML = '<br>';
      editor.appendChild(div);
      placeCaretAtStart(div);
    }

    let block = getCurrentBlock(editor);
    if (!block) {
      block = editor.lastElementChild || editor.firstChild;
    }

    if (block.nodeType === Node.TEXT_NODE) {
      const wrapper = document.createElement('div');
      wrapper.textContent = block.nodeValue;
      editor.replaceChild(wrapper, block);
      block = wrapper;
    }

    const savedOffset = getCaretOffsetWithin(block);
    const currentTag = block.tagName.toLowerCase();
    if (currentTag === 'pre') return;

    let nextTag = 'h1';
    if (currentTag === 'h1') nextTag = 'h2';
    else if (currentTag === 'h2') nextTag = 'h3';
    else if (currentTag === 'h3') nextTag = 'div';

    const replacement = document.createElement(nextTag);
    if (block.innerHTML.trim() === '' || block.innerHTML === '<br>') {
      replacement.innerHTML = '<br>';
    } else {
      replacement.innerHTML = block.innerHTML;
    }

    editor.replaceChild(replacement, block);
    setCaretOffsetWithin(replacement, savedOffset);
    syncEditorToPage(side);
    checkAndHandleOverflow(side);
  }

  function toggleCodeBlockOnActiveSide() {
    setTool('text');
    const side = state.activeSide;
    const refs = getSideRefs(side);
    const editor = refs.editor;
    editor.focus();

    let block = getCurrentBlock(editor);

    if (block && block.nodeType === Node.ELEMENT_NODE && block.tagName.toLowerCase() === 'pre') {
      const nextDiv = document.createElement('div');
      nextDiv.innerHTML = '<br>';
      if (block.nextSibling) {
        editor.insertBefore(nextDiv, block.nextSibling);
      } else {
        editor.appendChild(nextDiv);
      }
      placeCaretAtStart(nextDiv);
      syncEditorToPage(side);
      checkAndHandleOverflow(side);
      return;
    }

    const pre = document.createElement('pre');
    pre.className = 'md-code-block';
    const code = document.createElement('code');

    if (block) {
      if (block.nodeType === Node.TEXT_NODE) {
        const txt = block.nodeValue || '';
        code.innerHTML = txt.trim() ? escapeHtml(txt) : '<br>';
        pre.appendChild(code);
        editor.replaceChild(pre, block);
      } else {
        const existingText = (block.innerText || '').replace(/\n$/, '');
        code.innerHTML = existingText.trim() ? escapeHtml(existingText) : '<br>';
        pre.appendChild(code);
        editor.replaceChild(pre, block);
      }
    } else {
      code.innerHTML = '<br>';
      pre.appendChild(code);
      editor.appendChild(pre);
    }

    placeCaretAtEnd(code);
    syncEditorToPage(side);
    checkAndHandleOverflow(side);
  }

  /* ================= LIVE MARKDOWN AUTO-TRANSFORM ON SPACE / INPUT ================= */
const sel = window.getSelection();
    if (sel && sel.rangeCount && sel.anchorNode && sel.anchorNode.nodeType === Node.TEXT_NODE) {
      const tNode = sel.anchorNode;
      const val = tNode.nodeValue;
      const offset = sel.anchorOffset;
      const beforeCaret = val.slice(0, offset);

      const inlineRules = [
        { regex: /\$\$((?:(?!\$\$)[^\n])+?)\$\$([\s.,;:!?)])$/, isMath: true, delim: '$$' },
        { regex: /(?:^|[^:/\\])\/\/((?:(?!\/\/)[^\n])+?)\/\/([\s.,;:!?)])$/, isMath: true, delim: '//', keepSlashPrefix: true },
        { regex: /\*\*([^*\n]+)\*\*([\s.,;:!?)])$/, tag: 'strong' },
        { regex: /(?:^|[^*])\*([^*\n]+)\*([\s.,;:!?)])$/, tag: 'em', keepPrefix: true },
        { regex: /`([^`\n]+)`([\s.,;:!?)])$/, tag: 'code' },
        { regex: /==([^=\n]+)==([\s.,;:!?)])$/, tag: 'mark' }
      ];

      for (const rule of inlineRules) {
        const m = beforeCaret.match(rule.regex);
        if (m) {
          const fullMatch = m[0];
          const trailChar = m[2] === ' ' ? '\u00A0' : m[2];
          let prefixChar = '';
          if (rule.keepPrefix && fullMatch[0] !== '*') prefixChar = fullMatch[0];
          if (rule.keepSlashPrefix && !fullMatch.startsWith('//')) prefixChar = fullMatch[0];

          const matchedStart = beforeCaret.length - fullMatch.length + prefixChar.length;
          const afterCaret = val.slice(offset);

          const beforeText = val.slice(0, matchedStart);
          const formattedEl = rule.isMath
            ? createMathElement(m[1], rule.delim, false)
            : (() => {
                const el = document.createElement(rule.tag);
                el.textContent = m[1];
                return el;
              })();
          const trailingTextNode = document.createTextNode(trailChar + afterCaret);

          const parent = tNode.parentNode;
          if (beforeText) {
            parent.insertBefore(document.createTextNode(beforeText), tNode);
          }
          parent.insertBefore(formattedEl, tNode);
          parent.insertBefore(trailingTextNode, tNode);
          parent.removeChild(tNode);

          const newRange = document.createRange();
          newRange.setStart(trailingTextNode, 1);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
          return true;
        }
      }
    }

  /* ================= 32-LINE BOTTOM BOUNDARY & AUTO PAGE TURN ================= */
  function checkAndHandleOverflow(side) {
    if (state.isHandlingOverflow) return;
    const refs = getSideRefs(side);
    const editor = refs.editor;
    if (!editor) return;

    if (editor.scrollHeight <= editor.clientHeight + 1) return;

    state.isHandlingOverflow = true;
    try {
      const currentBlock = getCurrentBlock(editor);
      const overflowNodes = [];
      let cursorWasInOverflow = false;

      while (editor.scrollHeight > editor.clientHeight + 1 && editor.childNodes.length > 1) {
        const lastNode = editor.lastChild;
        if (!lastNode) break;
        if (currentBlock && (lastNode === currentBlock || lastNode.contains(currentBlock))) {
          cursorWasInOverflow = true;
        }
        overflowNodes.unshift(lastNode);
        editor.removeChild(lastNode);
      }

      if (editor.scrollHeight > editor.clientHeight + 1 && editor.childNodes.length === 1) {
        const single = editor.firstChild;
        const fullTxt = single.textContent || '';
        if (fullTxt.length > 10) {
          let cut = fullTxt.length - 1;
          while (cut > 5 && editor.scrollHeight > editor.clientHeight + 1) {
            cut = Math.max(5, cut - 10);
            single.textContent = fullTxt.slice(0, cut);
          }
          const remainder = fullTxt.slice(cut).trimStart();
          if (remainder) {
            const div = document.createElement('div');
            div.textContent = remainder;
            overflowNodes.unshift(div);
            cursorWasInOverflow = true;
          }
        }
      }

      if (!overflowNodes.length) return;

      syncEditorToPage(side);

      const tempContainer = document.createElement('div');
      overflowNodes.forEach(n => tempContainer.appendChild(n));
      const overflowMd = editorHtmlToMarkdown(tempContainer);

      const currPageIdx = getPageIndex(side);
      const nextPageIdx = currPageIdx + 1;

      while (state.pages.length <= nextPageIdx) {
        state.pages.push(createBlankPage(), createBlankPage());
      }
      ensureEvenPages();

      const nextPage = state.pages[nextPageIdx];
      nextPage.content = nextPage.content
        ? `${overflowMd}\n${nextPage.content}`
        : overflowMd;

      markDirty(currPageIdx);
      markDirty(nextPageIdx);

      if (cursorWasInOverflow) {
        if (side === 'left') {
          state.activeSide = 'right';
          if (state.zoomedMode) {
            toggleZoomMode(true);
          } else {
            renderSide('right');
          }
          const rightRefs = getSideRefs('right');
          rightRefs.editor.focus();
          const firstChild = rightRefs.editor.firstElementChild || rightRefs.editor.firstChild;
          if (firstChild) placeCaretAtEnd(firstChild);
        } else {
          state.spreadIndex += 2;
          state.activeSide = 'left';
          if (state.zoomedMode) {
            toggleZoomMode(true);
          } else {
            renderSpread();
          }
          const leftRefs = getSideRefs('left');
          leftRefs.editor.focus();
          const firstChild = leftRefs.editor.firstElementChild || leftRefs.editor.firstChild;
          if (firstChild) placeCaretAtEnd(firstChild);
        }
      } else if (side === 'left' && !state.zoomedMode) {
        renderSide('right');
      }
    } finally {
      state.isHandlingOverflow = false;
    }
  }

  /* ================= MATH PASTE CONVERTER ================= */
  function convertMathToUnicode(raw) {
    if (!raw || typeof raw !== 'string') return raw;
    return raw
      .replace(/\\\[([\s\S]+?)\\\]/g, (_, inner) => `$$${inner.trim()}$$`)
      .replace(/\\\(([\s\S]+?)\\\)/g, (_, inner) => `$$${inner.trim()}$$`)
      .replace(/(^|[^$])\$([^$\n]+?)\$(?!\$)/g, (_, pre, inner) => `${pre}$$${inner.trim()}$$`);
  }

  /* ================= SPREAD SCALING (2-PAGE FIT vs CTRL+Q SCROLLABLE ZOOM) ================= */
  function updateSpreadScale() {
    if (!dom.paperWorkspace || !dom.spreadScaleStage || !dom.paperSpread) return;

    const vw = dom.paperWorkspace.clientWidth;
    const vh = dom.paperWorkspace.clientHeight;

    if (state.zoomedMode) {
      const targetW = Math.min(920, Math.max(580, vw - 140));
      const scale = targetW / SHEET_W;
      const scaledW = Math.round(SHEET_W * scale);
      const scaledH = Math.round(SHEET_H * scale);

      dom.spreadScaleStage.style.width = `${scaledW}px`;
      dom.spreadScaleStage.style.height = `${scaledH}px`;
      dom.paperSpread.style.transform = `scale(${scale.toFixed(4)})`;
    } else {
      const rawW = SHEET_W * 2;
      const rawH = SHEET_H;
      const availW = Math.max(320, vw - 108);
      const availH = Math.max(240, vh - 18);
      const scale = Math.min(availW / rawW, availH / rawH);

      const scaledW = Math.round(rawW * scale);
      const scaledH = Math.round(rawH * scale);

      dom.spreadScaleStage.style.width = `${scaledW}px`;
      dom.spreadScaleStage.style.height = `${scaledH}px`;
      dom.paperSpread.style.transform = `scale(${scale.toFixed(4)})`;
    }
  }

  /* ================= SPREAD & PAGE RENDERING ================= */
  function renderSide(side) {
    const idx = getPageIndex(side);
    const page = getPage(side);
    const refs = getSideRefs(side);

    refs.titleEl.value = page.title || '';
    refs.dateEl.value = page.date || '';
    refs.badge.textContent = String(idx + 1);

    const targetHtml = markdownToEditorHtml(page.content || '');
    if (refs.editor.innerHTML !== targetHtml) {
      refs.editor.innerHTML = targetHtml;
    }

    renderPageOverlays(side, page, idx);
  }

  function renderSpread() {
    ensureEvenPages();
    if (state.spreadIndex < 0) state.spreadIndex = 0;
    if (state.spreadIndex >= state.pages.length) {
      state.spreadIndex = Math.max(0, state.pages.length - 2);
    }

    renderSide('left');
    renderSide('right');

    const total = state.pages.length;
    const p1 = state.spreadIndex + 1;
    const p2 = state.spreadIndex + 2;

    if (dom.pageCounterText) {
      dom.pageCounterText.textContent = state.zoomedMode
        ? `${state.activeSide === 'left' ? p1 : p2} / ${total} pages`
        : `${p1}–${p2} / ${total} pages`;
    }

    if (dom.btnPrevSpread) {
      dom.btnPrevSpread.classList.toggle('disabled', state.spreadIndex === 0 && (!state.zoomedMode || state.activeSide === 'left'));
    }

    updateSpreadScale();
  }

  /* ================= OVERLAY RENDERERS (SVG, IMAGES, TABLES, FREETEXT) ================= */
  function renderPageOverlays(side, page, pageIdx) {
    const refs = getSideRefs(side);

    // 1. SVG Shapes
    refs.svg.innerHTML = '';
    const ns = 'http://www.w3.org/2000/svg';
    const defs = document.createElementNS(ns, 'defs');
    const committedLayer = document.createElementNS(ns, 'g');
    committedLayer.setAttribute('class', 'committed-layer');
    const draftLayer = document.createElementNS(ns, 'g');
    draftLayer.setAttribute('class', 'draft-layer');
    refs.svg.append(defs, committedLayer, draftLayer);

    (page.shapes || []).forEach((shape, sIdx) => {
      const group = createSvgShapeGroup(ns, defs, shape, `${side}_${sIdx}`);
      if (!group) return;

      const eraseShape = (e) => {
        if (state.activeTool !== 'eraser') return;
        e.stopPropagation();
        page.shapes.splice(sIdx, 1);
        markDirty(pageIdx);
        renderPageOverlays(side, page, pageIdx);
      };

      group.addEventListener('pointerdown', eraseShape);
      group.addEventListener('pointerenter', (e) => {
        if (state.activeTool === 'eraser' && (state.isErasing || e.buttons === 1)) {
          eraseShape(e);
        }
      });

      committedLayer.appendChild(group);
    });

    // 2. Pasted Images
    refs.images.innerHTML = '';
    (page.images || []).forEach((imgObj, imgIdx) => {
      const card = document.createElement('div');
      card.className = 'pasted-image-card';
      card.style.left = `${imgObj.x ?? 80}px`;
      card.style.top = `${imgObj.y ?? 90}px`;
      card.style.width = `${imgObj.width ?? 220}px`;

      const img = document.createElement('img');
      img.src = imgObj.src;
      img.alt = 'Pasted image';

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'img-del-btn';
      delBtn.textContent = '✕';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        page.images.splice(imgIdx, 1);
        markDirty(pageIdx);
        renderPageOverlays(side, page, pageIdx);
      });

      const resizeHandle = document.createElement('div');
      resizeHandle.className = 'img-resize-handle';

      img.addEventListener('pointerdown', (e) => {
        if (state.activeTool === 'eraser') {
          e.stopPropagation();
          page.images.splice(imgIdx, 1);
          markDirty(pageIdx);
          renderPageOverlays(side, page, pageIdx);
          return;
        }
        e.stopPropagation();
        const startX = e.clientX;
        const startY = e.clientY;
        const origX = imgObj.x ?? 80;
        const origY = imgObj.y ?? 90;
        const rect = refs.pageEl.getBoundingClientRect();
        const scale = rect.width / SHEET_W;
        const onMove = (ev) => {
          imgObj.x = Math.max(10, origX + (ev.clientX - startX) / scale);
          imgObj.y = Math.max(45, origY + (ev.clientY - startY) / scale);
          card.style.left = `${imgObj.x}px`;
          card.style.top = `${imgObj.y}px`;
        };
        const onUp = () => {
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
          markDirty(pageIdx);
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
      });

      resizeHandle.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        const startX = e.clientX;
        const origW = imgObj.width ?? 220;
        const rect = refs.pageEl.getBoundingClientRect();
        const scale = rect.width / SHEET_W;
        const onMove = (ev) => {
          imgObj.width = Math.max(60, origW + (ev.clientX - startX) / scale);
          card.style.width = `${imgObj.width}px`;
        };
        const onUp = () => {
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
          markDirty(pageIdx);
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
      });

      card.append(img, delBtn, resizeHandle);
      refs.images.appendChild(card);
    });

    // 3. Tables
    refs.tables.innerHTML = '';
    (page.tables || []).forEach((tbl, tIdx) => {
      const card = document.createElement('div');
      card.className = 'notebook-table-card';
      card.style.left = `${tbl.x ?? 76}px`;
      card.style.top = `${tbl.y ?? 120}px`;

      card.addEventListener('pointerdown', (e) => {
        if (state.activeTool === 'eraser') {
          e.stopPropagation();
          page.tables.splice(tIdx, 1);
          markDirty(pageIdx);
          renderPageOverlays(side, page, pageIdx);
        }
      });

      const bar = document.createElement('div');
      bar.className = 'table-drag-bar';
      bar.innerHTML = `<span>⋮⋮ Bảng</span>`;
      const actions = document.createElement('div');
      actions.className = 'table-mini-actions';

      const btnAddRow = document.createElement('button');
      btnAddRow.type = 'button';
      btnAddRow.className = 'table-mini-btn';
      btnAddRow.textContent = '+Hàng';
      btnAddRow.onclick = (e) => {
        e.stopPropagation();
        const cols = (tbl.rows[0] || ['', '']).length;
        tbl.rows.push(Array(cols).fill(''));
        markDirty(pageIdx);
        renderPageOverlays(side, page, pageIdx);
      };

      const btnAddCol = document.createElement('button');
      btnAddCol.type = 'button';
      btnAddCol.className = 'table-mini-btn';
      btnAddCol.textContent = '+Cột';
      btnAddCol.onclick = (e) => {
        e.stopPropagation();
        tbl.rows.forEach(r => r.push(''));
        markDirty(pageIdx);
        renderPageOverlays(side, page, pageIdx);
      };

      const btnDelTbl = document.createElement('button');
      btnDelTbl.type = 'button';
      btnDelTbl.className = 'table-mini-btn';
      btnDelTbl.textContent = '✕';
      btnDelTbl.onclick = (e) => {
        e.stopPropagation();
        page.tables.splice(tIdx, 1);
        markDirty(pageIdx);
        renderPageOverlays(side, page, pageIdx);
      };

      actions.append(btnAddRow, btnAddCol, btnDelTbl);
      bar.appendChild(actions);

      bar.addEventListener('pointerdown', (e) => {
        if (e.target.closest('button') || state.activeTool === 'eraser') return;
        const startX = e.clientX;
        const startY = e.clientY;
        const origX = tbl.x ?? 76;
        const origY = tbl.y ?? 120;
        const rect = refs.pageEl.getBoundingClientRect();
        const scale = rect.width / SHEET_W;
        const onMove = (ev) => {
          tbl.x = Math.max(54, origX + (ev.clientX - startX) / scale);
          tbl.y = Math.max(50, origY + (ev.clientY - startY) / scale);
          card.style.left = `${tbl.x}px`;
          card.style.top = `${tbl.y}px`;
        };
        const onUp = () => {
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
          markDirty(pageIdx);
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
      });

      const tableEl = document.createElement('table');
      (tbl.rows || [['', ''], ['', '']]).forEach((rowArr, rIdx) => {
        const tr = document.createElement('tr');
        rowArr.forEach((cellVal, cIdx) => {
          const td = document.createElement('td');
          td.contentEditable = 'true';
          td.textContent = cellVal || '';
          td.addEventListener('input', () => {
            tbl.rows[rIdx][cIdx] = td.textContent;
            markDirty(pageIdx);
          });
          tr.appendChild(td);
        });
        tableEl.appendChild(tr);
      });

      card.append(bar, tableEl);
      refs.tables.appendChild(card);
    });

    // 4. Free-floating Text Boxes
    refs.freeTexts.innerHTML = '';
    (page.freeTexts || []).forEach((ft, fIdx) => {
      const card = document.createElement('div');
      card.className = 'free-text-card';
      card.style.left = `${ft.x ?? 120}px`;
      card.style.top = `${ft.y ?? 140}px`;
      if (ft.color) card.style.color = ft.color;

      card.addEventListener('pointerdown', (e) => {
        if (state.activeTool === 'eraser') {
          e.stopPropagation();
          page.freeTexts.splice(fIdx, 1);
          markDirty(pageIdx);
          renderPageOverlays(side, page, pageIdx);
        }
      });

      const bar = document.createElement('div');
      bar.className = 'free-text-bar';
      bar.innerHTML = `<span>⋮⋮</span>`;
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'free-text-del';
      delBtn.textContent = '✕';
      delBtn.onclick = (e) => {
        e.stopPropagation();
        page.freeTexts.splice(fIdx, 1);
        markDirty(pageIdx);
        renderPageOverlays(side, page, pageIdx);
      };
      bar.appendChild(delBtn);

      bar.addEventListener('pointerdown', (e) => {
        if (e.target.closest('button') || state.activeTool === 'eraser') return;
        const startX = e.clientX;
        const startY = e.clientY;
        const origX = ft.x ?? 120;
        const origY = ft.y ?? 140;
        const rect = refs.pageEl.getBoundingClientRect();
        const scale = rect.width / SHEET_W;
        const onMove = (ev) => {
          ft.x = Math.max(54, origX + (ev.clientX - startX) / scale);
          ft.y = Math.max(48, origY + (ev.clientY - startY) / scale);
          card.style.left = `${ft.x}px`;
          card.style.top = `${ft.y}px`;
        };
        const onUp = () => {
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
          markDirty(pageIdx);
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
      });

      const body = document.createElement('div');
      body.className = 'free-text-body';
      body.contentEditable = 'true';
      body.textContent = ft.text || '';
      if (ft.color) body.style.color = ft.color;
      body.addEventListener('input', () => {
        ft.text = body.textContent;
        markDirty(pageIdx);
      });

      card.append(bar, body);
      refs.freeTexts.appendChild(card);
    });
  }

  function createSvgShapeGroup(ns, defs, shape, uid) {
    const color = shape.color || '#1e1b18';
    const width = shape.width || 2.5;
    const opacity = shape.opacity ?? 1;

    const g = document.createElementNS(ns, 'g');
    g.setAttribute('class', 'drawn-shape-group');

    let visibleEl = null;
    let hitEl = null;

    if (shape.type === 'line' || shape.type === 'arrow') {
      visibleEl = document.createElementNS(ns, 'line');
      visibleEl.setAttribute('x1', shape.x1);
      visibleEl.setAttribute('y1', shape.y1);
      visibleEl.setAttribute('x2', shape.x2);
      visibleEl.setAttribute('y2', shape.y2);
      visibleEl.setAttribute('stroke', color);
      visibleEl.setAttribute('stroke-width', width);
      visibleEl.setAttribute('stroke-linecap', 'round');
      visibleEl.setAttribute('opacity', opacity);

      if (shape.type === 'arrow') {
        const markerId = `arrow_${uid}`;
        const marker = document.createElementNS(ns, 'marker');
        marker.setAttribute('id', markerId);
        marker.setAttribute('markerWidth', '10');
        marker.setAttribute('markerHeight', '10');
        marker.setAttribute('refX', '7');
        marker.setAttribute('refY', '3.5');
        marker.setAttribute('orient', 'auto');
        marker.setAttribute('markerUnits', 'strokeWidth');
        const poly = document.createElementNS(ns, 'polygon');
        poly.setAttribute('points', '0 0, 8 3.5, 0 7');
        poly.setAttribute('fill', color);
        marker.appendChild(poly);
        defs.appendChild(marker);
        visibleEl.setAttribute('marker-end', `url(#${markerId})`);
      }

      hitEl = document.createElementNS(ns, 'line');
      hitEl.setAttribute('x1', shape.x1);
      hitEl.setAttribute('y1', shape.y1);
      hitEl.setAttribute('x2', shape.x2);
      hitEl.setAttribute('y2', shape.y2);
      hitEl.setAttribute('stroke', 'transparent');
      hitEl.setAttribute('stroke-width', '20');
    } else if (shape.type === 'rect') {
      const rx = Math.min(shape.x1, shape.x2);
      const ry = Math.min(shape.y1, shape.y2);
      const rw = Math.abs(shape.x2 - shape.x1);
      const rh = Math.abs(shape.y2 - shape.y1);

      visibleEl = document.createElementNS(ns, 'rect');
      visibleEl.setAttribute('x', rx);
      visibleEl.setAttribute('y', ry);
      visibleEl.setAttribute('width', rw);
      visibleEl.setAttribute('height', rh);
      visibleEl.setAttribute('fill', 'transparent');
      visibleEl.setAttribute('stroke', color);
      visibleEl.setAttribute('stroke-width', width);
      visibleEl.setAttribute('opacity', opacity);

      hitEl = document.createElementNS(ns, 'rect');
      hitEl.setAttribute('x', rx);
      hitEl.setAttribute('y', ry);
      hitEl.setAttribute('width', rw);
      hitEl.setAttribute('height', rh);
      hitEl.setAttribute('fill', 'transparent');
      hitEl.setAttribute('stroke', 'transparent');
      hitEl.setAttribute('stroke-width', '20');
      hitEl.setAttribute('pointer-events', 'all');
    } else if (shape.type === 'oval') {
      const cx = (shape.x1 + shape.x2) / 2;
      const cy = (shape.y1 + shape.y2) / 2;
      const rx = Math.abs(shape.x2 - shape.x1) / 2;
      const ry = Math.abs(shape.y2 - shape.y1) / 2;

      visibleEl = document.createElementNS(ns, 'ellipse');
      visibleEl.setAttribute('cx', cx);
      visibleEl.setAttribute('cy', cy);
      visibleEl.setAttribute('rx', rx);
      visibleEl.setAttribute('ry', ry);
      visibleEl.setAttribute('fill', 'transparent');
      visibleEl.setAttribute('stroke', color);
      visibleEl.setAttribute('stroke-width', width);
      visibleEl.setAttribute('opacity', opacity);

      hitEl = document.createElementNS(ns, 'ellipse');
      hitEl.setAttribute('cx', cx);
      hitEl.setAttribute('cy', cy);
      hitEl.setAttribute('rx', rx);
      hitEl.setAttribute('ry', ry);
      hitEl.setAttribute('fill', 'transparent');
      hitEl.setAttribute('stroke', 'transparent');
      hitEl.setAttribute('stroke-width', '20');
      hitEl.setAttribute('pointer-events', 'all');
    }

    if (!visibleEl) return null;
    visibleEl.setAttribute('class', 'drawn-shape-visible');
    g.appendChild(visibleEl);
    if (hitEl) g.appendChild(hitEl);
    return g;
  }

  /* ================= SMOOTH DEDICATED-LAYER SVG DRAWING ================= */
  function setupSvgDrawing(side) {
    const refs = getSideRefs(side);
    const ns = 'http://www.w3.org/2000/svg';
    let draftShape = null;

    const getSvgPoint = (e) => {
      const rect = refs.svg.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / Math.max(1, rect.width)) * SHEET_W;
      const y = ((e.clientY - rect.top) / Math.max(1, rect.height)) * SHEET_H;
      return { x, y };
    };

    const renderDraft = () => {
      const draftLayer = refs.svg.querySelector('.draft-layer');
      const defs = refs.svg.querySelector('defs');
      if (!draftLayer || !defs) return;
      draftLayer.innerHTML = '';
      if (!draftShape) return;
      const previewGroup = createSvgShapeGroup(ns, defs, draftShape, `${side}_draft`);
      if (previewGroup) draftLayer.appendChild(previewGroup);
    };

    refs.svg.addEventListener('pointerdown', (e) => {
      if (state.activeTool === 'eraser') {
        state.isErasing = true;
        return;
      }
      if (!['line', 'oval', 'rect', 'arrow'].includes(state.activeTool)) return;
      e.preventDefault();
      e.stopPropagation();
      state.activeSide = side;
      const pt = getSvgPoint(e);

      draftShape = {
        type: state.activeTool,
        x1: pt.x,
        y1: pt.y,
        x2: pt.x,
        y2: pt.y,
        color: state.drawStyle.color,
        width: state.drawStyle.width,
        opacity: state.drawStyle.opacity
      };
      renderDraft();
      try {
        refs.svg.setPointerCapture(e.pointerId);
      } catch (_) {}
    });

    refs.svg.addEventListener('pointermove', (e) => {
      if (!draftShape) return;
      const pt = getSvgPoint(e);
      draftShape.x2 = pt.x;
      draftShape.y2 = pt.y;
      renderDraft();
    });

    const finishDraft = (e) => {
      if (!draftShape) return;
      if (e && e.pointerId !== undefined) {
        try {
          if (refs.svg.hasPointerCapture(e.pointerId)) {
            refs.svg.releasePointerCapture(e.pointerId);
          }
        } catch (_) {}
      }
      const dist = Math.hypot(draftShape.x2 - draftShape.x1, draftShape.y2 - draftShape.y1);
      if (dist > 5) {
        const page = getPage(side);
        const pageIdx = getPageIndex(side);
        page.shapes = page.shapes || [];
        page.shapes.push(draftShape);
        markDirty(pageIdx);
      }
      draftShape = null;
      renderPageOverlays(side, getPage(side), getPageIndex(side));
    };

    refs.svg.addEventListener('pointerup', finishDraft);
    refs.svg.addEventListener('pointercancel', finishDraft);
  }

  /* ================= LIVE PAGE EDITOR EVENTS ================= */
  function bindPageEvents(side) {
    const refs = getSideRefs(side);

    const setActive = () => {
      state.activeSide = side;
    };
    // 1. Khi click vao vung trong ben duoi cong thuc o cuoi trang -> tu tao dong moi de go tiep
    refs.editor.addEventListener('mousedown', (e) => {
      if (e.target === refs.editor) {
        const last = refs.editor.lastElementChild;
        if (!last || last.classList.contains('md-math-block') || last.tagName === 'PRE' || last.tagName === 'HR') {
          const newDiv = document.createElement('div');
          newDiv.innerHTML = '<br>';
          refs.editor.appendChild(newDiv);
          requestAnimationFrame(() => placeCaretAtStart(newDiv));
        }
      }
    });

    // 2. Khi roi chuot khoi khung soan thao (focusout) -> tu render lai tat ca cong thuc dang sua do
    refs.editor.addEventListener('focusout', () => {
      syncEditorToPage(side);
      const html = markdownToEditorHtml(getPage(side).content || '');
      if (refs.editor.innerHTML !== html) {
        refs.editor.innerHTML = html;
      }
    });

    refs.pageEl.addEventListener('pointerdown', setActive);

    refs.titleEl.addEventListener('input', () => {
      setActive();
      const page = getPage(side);
      page.title = refs.titleEl.value;
      markDirty(getPageIndex(side));
    });

    refs.dateEl.addEventListener('input', () => {
      setActive();
      const page = getPage(side);
      page.date = refs.dateEl.value;
      markDirty(getPageIndex(side));
    });

    refs.editor.addEventListener('focus', setActive);

    refs.editor.addEventListener('input', (e) => {
      setActive();
      if (e.isComposing) return;
      handleLiveMarkdownShortcuts(side);
      enforceMaxCharsPerLine(side);
      syncEditorToPage(side);
      checkAndHandleOverflow(side);
    });

    refs.editor.addEventListener('compositionend', () => {
      setActive();
      handleLiveMarkdownShortcuts(side);
      enforceMaxCharsPerLine(side);
      syncEditorToPage(side);
      checkAndHandleOverflow(side);
    });

    refs.editor.addEventListener('keydown', (e) => {
      const block = getCurrentBlock(refs.editor);
      const isCode = block && block.nodeType === Node.ELEMENT_NODE && block.tagName.toLowerCase() === 'pre';

      if (e.key === 'Tab') {
        e.preventDefault();
        document.execCommand('insertText', false, '  ');
        enforceMaxCharsPerLine(side);
        syncEditorToPage(side);
        checkAndHandleOverflow(side);
        return;
      }

      if (!isCode && e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
        if (block && block.nodeType === Node.ELEMENT_NODE) {
          const rawLine = (block.textContent || '').replace(/\u00A0/g, ' ').trim();
          const mBlock = rawLine.match(/^(\$\$|\/\/)((?:(?!\1).)+?)\1$/);
          if (mBlock) {
            e.preventDefault();
            const mathBlockEl = createMathElement(mBlock[2], mBlock[1], true);
            const nextDiv = document.createElement('div');
            nextDiv.innerHTML = '<br>';
            refs.editor.replaceChild(mathBlockEl, block);
            if (mathBlockEl.nextSibling) {
              refs.editor.insertBefore(nextDiv, mathBlockEl.nextSibling);
            } else {
              refs.editor.appendChild(nextDiv);
            }
            placeCaretAtStart(nextDiv);
            syncEditorToPage(side);
            checkAndHandleOverflow(side);
            return;
          }

          if (rawLine.includes('$$') || /\/\/.+?\/\//.test(rawLine)) {
            e.preventDefault();
            block.innerHTML = formatInlineMarkdown(rawLine);
            const nextDiv = document.createElement('div');
            nextDiv.innerHTML = '<br>';
            if (block.nextSibling) {
              refs.editor.insertBefore(nextDiv, block.nextSibling);
            } else {
              refs.editor.appendChild(nextDiv);
            }
            placeCaretAtStart(nextDiv);
            syncEditorToPage(side);
            checkAndHandleOverflow(side);
            return;
          }
        }
      }
    });

    refs.editor.addEventListener('dblclick', (e) => {
      const mathEl = e.target.closest('.md-math, .md-math-block');
      if (!mathEl || !refs.editor.contains(mathEl)) return;
      e.preventDefault();
      e.stopPropagation();

      const delim = mathEl.dataset.delim || '$$';
      const rawExpr = mathEl.dataset.math || '';
      const rawText = `${delim}${rawExpr}${delim}`;

      if (mathEl.classList.contains('md-math-block')) {
        const div = document.createElement('div');
        div.textContent = rawText;
        mathEl.replaceWith(div);
        placeCaretAtEnd(div);
      } else {
        const textNode = document.createTextNode(rawText);
        mathEl.replaceWith(textNode);
        const range = document.createRange();
        const sel = window.getSelection();
        range.setStart(textNode, rawText.length);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      syncEditorToPage(side);
    });

    refs.pageEl.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      state.activeSide = side;
      state.contextTargetSide = side;
      dom.pageContextMenu.style.left = `${Math.min(window.innerWidth - 250, e.clientX)}px`;
      dom.pageContextMenu.style.top = `${Math.min(window.innerHeight - 130, e.clientY)}px`;
      dom.pageContextMenu.classList.add('open');
    });
  }

  /* ================= INSERT OVERLAY ITEMS ================= */
  function insertImageToActivePage(dataUrl) {
    const page = getPage(state.activeSide);
    const pageIdx = getPageIndex(state.activeSide);
    page.images = page.images || [];
    page.images.push({
      src: dataUrl,
      x: 90 + (page.images.length % 4) * 18,
      y: 95 + (page.images.length % 4) * 18,
      width: 240
    });
    markDirty(pageIdx);
    renderSide(state.activeSide);
  }

  function insertTableToActivePage() {
    setTool('text');
    const page = getPage(state.activeSide);
    const pageIdx = getPageIndex(state.activeSide);
    page.tables = page.tables || [];
    page.tables.push({
      x: 76 + (page.tables.length % 3) * 16,
      y: 120 + (page.tables.length % 3) * 24,
      rows: [
        ['Cột 1', 'Cột 2', 'Cột 3'],
        ['', '', ''],
        ['', '', '']
      ]
    });
    markDirty(pageIdx);
    renderSide(state.activeSide);
  }

  function insertFreeTextToActivePage() {
    setTool('text');
    const page = getPage(state.activeSide);
    const pageIdx = getPageIndex(state.activeSide);
    page.freeTexts = page.freeTexts || [];
    page.freeTexts.push({
      x: 110 + (page.freeTexts.length % 4) * 20,
      y: 135 + (page.freeTexts.length % 4) * 24,
      text: '',
      color: state.inkColor
    });
    markDirty(pageIdx);
    renderSide(state.activeSide);

    const refs = getSideRefs(state.activeSide);
    const lastBody = refs.freeTexts.querySelector('.free-text-card:last-child .free-text-body');
    if (lastBody) lastBody.focus();
  }

  /* ================= TOOLS, INK, ZOOM, OVERVIEW ================= */
  function setTool(toolName) {
    state.activeTool = toolName;
    document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === toolName);
    });

    const isDraw = ['line', 'oval', 'rect', 'arrow'].includes(toolName);
    const isEraser = toolName === 'eraser';
    document.body.classList.toggle('drawing-mode', isDraw);
    document.body.classList.toggle('eraser-mode', isEraser);
    if (dom.drawStylePanel) {
      dom.drawStylePanel.classList.toggle('visible', isDraw);
    }

    if (isDraw || isEraser) {
      if (document.activeElement && document.activeElement.isContentEditable) {
        document.activeElement.blur();
      }
    }
  }

  function setInkColor(hex) {
    state.inkColor = hex;
    document.documentElement.style.setProperty('--ink-color', hex);
    document.querySelectorAll('.ink-dot').forEach(dot => {
      dot.classList.toggle('active', dot.dataset.ink === hex);
    });
    scheduleSave();
  }

  function toggleZoomMode(forceVal = null) {
    if (state.overviewMode) toggleOverviewMode(false);
    state.zoomedMode = forceVal !== null ? Boolean(forceVal) : !state.zoomedMode;

    dom.paperWorkspace.classList.toggle('is-zoomed', state.zoomedMode);
    dom.paperSpread.classList.toggle('zoomed-mode', state.zoomedMode);
    dom.paperSpread.classList.toggle('focus-left', state.zoomedMode && state.activeSide === 'left');
    dom.paperSpread.classList.toggle('focus-right', state.zoomedMode && state.activeSide === 'right');

    if (dom.zoomIconLabel) {
      dom.zoomIconLabel.textContent = state.zoomedMode ? '⤡' : '⤢';
    }
    if (dom.zoomStatusTag) {
      dom.zoomStatusTag.textContent = state.zoomedMode ? '1 Page (Zoom)' : '2 Pages';
    }
    if (state.zoomedMode && dom.paperWorkspace) {
      dom.paperWorkspace.scrollTop = 0;
    }
    renderSpread();
  }

  function renderOverviewGrid() {
    if (!dom.overviewGrid) return;
    dom.overviewGrid.innerHTML = '';

    state.pages.forEach((page, idx) => {
      const card = document.createElement('div');
      card.className = 'overview-card';
      if (idx === state.spreadIndex || idx === state.spreadIndex + 1) {
        card.classList.add('is-current-spread');
      }

      const stage = document.createElement('div');
      stage.className = 'overview-page-stage';

      const mini = document.createElement('div');
      mini.className = `paper-sheet overview-page-mini ${idx % 2 === 0 ? 'left-page' : 'right-page'}`;

      const header = document.createElement('div');
      header.className = 'page-header';
      header.innerHTML = `
        <span class="page-header-input page-title-input">${escapeHtml(page.title || '')}</span>
        <span class="page-header-input page-date-input">${escapeHtml(page.date || '')}</span>
      `;

      const ed = document.createElement('div');
      ed.className = 'page-editor';
      ed.innerHTML = markdownToEditorHtml(page.content || '');

      mini.append(header, ed);
      stage.appendChild(mini);

      const footer = document.createElement('div');
      footer.className = 'overview-card-footer';
      footer.innerHTML = `
        <span class="overview-card-title">${escapeHtml(page.title || `Trang ${idx + 1}`)}</span>
        <span class="overview-card-page-tag">#${idx + 1}</span>
      `;

      card.append(stage, footer);

      card.addEventListener('click', () => {
        state.spreadIndex = idx % 2 === 0 ? idx : idx - 1;
        state.activeSide = idx % 2 === 0 ? 'left' : 'right';
        toggleOverviewMode(false);
        renderSpread();
      });

      dom.overviewGrid.appendChild(card);

      requestAnimationFrame(() => {
        const w = stage.clientWidth;
        if (w > 0) {
          mini.style.setProperty('--ov-scale', (w / SHEET_W).toFixed(4));
        }
      });
    });
  }

  function toggleOverviewMode(forceVal = null) {
    state.overviewMode = forceVal !== null ? Boolean(forceVal) : !state.overviewMode;
    document.body.classList.toggle('overview-mode', state.overviewMode);
    if (dom.btnOverviewGrid) {
      dom.btnOverviewGrid.classList.toggle('active', state.overviewMode);
    }
    if (state.overviewMode) {
      renderOverviewGrid();
    } else {
      updateSpreadScale();
    }
  }

  /* ================= PAGE TURNING, ADD & DELETE ================= */
  function prevSpread() {
    if (state.zoomedMode && state.activeSide === 'right') {
      state.activeSide = 'left';
      toggleZoomMode(true);
      return;
    }
    if (state.spreadIndex >= 2) {
      state.spreadIndex -= 2;
      if (state.zoomedMode) state.activeSide = 'right';
      renderSpread();
      if (state.zoomedMode) toggleZoomMode(true);
    }
  }

  function nextSpread() {
    if (state.zoomedMode && state.activeSide === 'left') {
      state.activeSide = 'right';
      toggleZoomMode(true);
      return;
    }
    if (state.spreadIndex + 2 >= state.pages.length) {
      state.pages.push(createBlankPage(), createBlankPage());
      markDirty(state.pages.length - 2);
      markDirty(state.pages.length - 1);
    }
    state.spreadIndex += 2;
    if (state.zoomedMode) state.activeSide = 'left';
    renderSpread();
    if (state.zoomedMode) toggleZoomMode(true);
  }

  function insertPageRelative(side, offset) {
    const targetIdx = getPageIndex(side);
    const insertAt = offset <= 0 ? targetIdx : targetIdx + 1;
    state.pages.splice(insertAt, 0, createBlankPage(), createBlankPage());
    for (let i = insertAt; i < state.pages.length; i++) {
      state.dirtyPages.add(i);
    }
    scheduleSave();
    renderSpread();
  }

  function deleteTargetPage(side) {
    if (state.pages.length <= 2) {
      const page = getPage(side);
      Object.assign(page, createBlankPage());
      markDirty(getPageIndex(side));
      renderSpread();
      return;
    }
    const targetIdx = getPageIndex(side);
    state.pages.splice(targetIdx, 1);
    if (state.pages.length % 2 !== 0) {
      state.pages.push(createBlankPage());
    }
    for (let i = Math.max(0, targetIdx - 1); i < state.pages.length; i++) {
      state.dirtyPages.add(i);
    }
    scheduleSave();
    renderSpread();
  }

  /* ================= SEARCH & JUMP ================= */
  function runSearch(query) {
    state.searchQuery = query.trim();
    state.searchMatches = [];
    state.searchCursor = -1;

    if (!state.searchQuery) {
      if (dom.searchBadge) dom.searchBadge.textContent = '';
      return;
    }

    const q = state.searchQuery.toLowerCase();
    state.pages.forEach((p, idx) => {
      const blob = [
        p.title || '',
        p.date || '',
        p.content || '',
        ...(p.freeTexts || []).map(f => f.text || ''),
        ...(p.tables || []).flatMap(t => (t.rows || []).flat())
      ].join('\n').toLowerCase();

      if (blob.includes(q)) {
        state.searchMatches.push(idx);
      }
    });

    if (dom.searchBadge) {
      dom.searchBadge.textContent = state.searchMatches.length
        ? `${state.searchMatches.length} trang`
        : '0';
    }
  }

  function jumpToNextSearchMatch() {
    if (!state.searchMatches.length) return;
    state.searchCursor = (state.searchCursor + 1) % state.searchMatches.length;
    const pageIdx = state.searchMatches[state.searchCursor];
    state.spreadIndex = pageIdx % 2 === 0 ? pageIdx : pageIdx - 1;
    state.activeSide = pageIdx % 2 === 0 ? 'left' : 'right';

    if (dom.searchBadge) {
      dom.searchBadge.textContent = `${state.searchCursor + 1}/${state.searchMatches.length}`;
    }

    renderSpread();
    const refs = getSideRefs(state.activeSide);
    refs.editor.focus();
  }

  /* ================= FREEHAND SKETCHPAD MODAL (ALT + V) ================= */
  function setupSketchpad() {
    const backdrop = document.getElementById('sketchpadBackdrop');
    const wrap = document.getElementById('sketchpadCanvasWrap');
    const canvas = document.getElementById('freehandSketchCanvas');
    if (!backdrop || !canvas) return;

    const ctx = canvas.getContext('2d');
    let tool = 'pen';
    let color = '#153b75';
    let size = 3.5;
    let isDrawing = false;
    let startX = 0;
    let startY = 0;
    let snapshot = null;
    const undoStack = [];
    const redoStack = [];

    const resizeCanvas = () => {
      const rect = wrap.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const saved = canvas.width && canvas.height ? ctx.getImageData(0, 0, canvas.width, canvas.height) : null;
      canvas.width = rect.width;
      canvas.height = rect.height;
      if (saved) ctx.putImageData(saved, 0, 0);
    };

    const pushUndo = () => {
      if (!canvas.width || !canvas.height) return;
      undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
      if (undoStack.length > 30) undoStack.shift();
      redoStack.length = 0;
    };

    const openSketchpad = () => {
      backdrop.classList.add('open');
      requestAnimationFrame(resizeCanvas);
    };

    const closeSketchpad = () => {
      backdrop.classList.remove('open');
    };

    const importSketchToPage = () => {
      const w = canvas.width;
      const h = canvas.height;
      const imgData = ctx.getImageData(0, 0, w, h).data;
      let minX = w, minY = h, maxX = -1, maxY = -1;

      for (let y = 0; y < h; y++) {
        const rowOffset = y * w * 4;
        for (let x = 0; x < w; x++) {
          if (imgData[rowOffset + x * 4 + 3] > 0) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (maxX < minX || maxY < minY) {
        closeSketchpad();
        return;
      }

      const pad = 6;
      const sx = Math.max(0, minX - pad);
      const sy = Math.max(0, minY - pad);
      const sw = Math.min(w - sx, maxX - minX + 1 + pad * 2);
      const sh = Math.min(h - sy, maxY - minY + 1 + pad * 2);

      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = sw;
      cropCanvas.height = sh;
      cropCanvas.getContext('2d').drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);

      const dataUrl = cropCanvas.toDataURL('image/png');
      insertImageToActivePage(dataUrl);
      closeSketchpad();
    };

    document.querySelectorAll('[data-sketch-tool]').forEach(btn => {
      btn.addEventListener('click', () => {
        tool = btn.dataset.sketchTool;
        document.querySelectorAll('[data-sketch-tool]').forEach(b => b.classList.toggle('active', b === btn));
      });
    });

    document.querySelectorAll('[data-sketch-color]').forEach(dot => {
      dot.addEventListener('click', () => {
        color = dot.dataset.sketchColor;
        document.querySelectorAll('[data-sketch-color]').forEach(d => d.classList.toggle('active', d === dot));
      });
    });

    document.querySelectorAll('[data-sketch-size]').forEach(btn => {
      btn.addEventListener('click', () => {
        size = Number(btn.dataset.sketchSize);
        document.querySelectorAll('[data-sketch-size]').forEach(b => b.classList.toggle('active', b === btn));
      });
    });

    document.getElementById('btnSketchGrid')?.addEventListener('click', () => {
      wrap.classList.toggle('show-grid');
    });

    document.getElementById('btnSketchUndo')?.addEventListener('click', () => {
      if (!undoStack.length) return;
      redoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
      ctx.putImageData(undoStack.pop(), 0, 0);
    });

    document.getElementById('btnSketchRedo')?.addEventListener('click', () => {
      if (!redoStack.length) return;
      undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
      ctx.putImageData(redoStack.pop(), 0, 0);
    });

    document.getElementById('btnSketchClear')?.addEventListener('click', () => {
      pushUndo();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    document.getElementById('btnSketchCancel')?.addEventListener('click', closeSketchpad);
    document.getElementById('btnSketchImport')?.addEventListener('click', importSketchToPage);
    dom.btnOpenSketchpad?.addEventListener('click', openSketchpad);

    canvas.addEventListener('pointerdown', (e) => {
      const rect = canvas.getBoundingClientRect();
      startX = e.clientX - rect.left;
      startY = e.clientY - rect.top;
      isDrawing = true;
      pushUndo();
      snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
      canvas.setPointerCapture(e.pointerId);

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.globalAlpha = tool === 'highlighter' ? 0.34 : 1;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = tool === 'highlighter' ? size * 3.2 : (tool === 'eraser' ? size * 4 : size);

      if (['pen', 'highlighter', 'eraser'].includes(tool)) {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
      }
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!isDrawing) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (['pen', 'highlighter', 'eraser'].includes(tool)) {
        ctx.lineTo(x, y);
        ctx.stroke();
        return;
      }

      if (snapshot) ctx.putImageData(snapshot, 0, 0);
      ctx.beginPath();
      if (tool === 'line' || tool === 'arrow') {
        ctx.moveTo(startX, startY);
        ctx.lineTo(x, y);
        ctx.stroke();
        if (tool === 'arrow') {
          const angle = Math.atan2(y - startY, x - startX);
          const head = 12 + size;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - head * Math.cos(angle - Math.PI / 6), y - head * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(x - head * Math.cos(angle + Math.PI / 6), y - head * Math.sin(angle + Math.PI / 6));
          ctx.closePath();
          ctx.fill();
        }
      } else if (tool === 'rect') {
        ctx.strokeRect(startX, startY, x - startX, y - startY);
      } else if (tool === 'oval') {
        ctx.ellipse((startX + x) / 2, (startY + y) / 2, Math.abs(x - startX) / 2, Math.abs(y - startY) / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    canvas.addEventListener('pointerup', (e) => {
      if (!isDrawing) return;
      isDrawing = false;
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      canvas.releasePointerCapture(e.pointerId);
    });

    window.NotebookSketchpad = { open: openSketchpad, close: closeSketchpad, import: importSketchToPage };
  }

  /* ================= SMART PASTE FROM AI INTO PAGE (CTRL + V) ================= */
function wrapPlainLineProtectingMath(line, limit) {
    if (line.length <= limit) return [line];

    // Tach cac cum cong thuc $$...$$ va //...// thanh khoi nguyen ven khong bi cat ngang
    const tokens = [];
    const regex = /(\$\$(?:(?!\$\$).)+?\$\$|(?:^|[^:/\\])\/\/(?:(?!\/\/).)+?\/\/)/g;
    let lastIdx = 0;
    let match;

    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIdx) {
        const textPart = line.slice(lastIdx, match.index);
        textPart.split(/(\s+)/).forEach(w => { if (w) tokens.push(w); });
      }
      tokens.push(match[0]);
      lastIdx = match.index + match[0].length;
    }
    if (lastIdx < line.length) {
      line.slice(lastIdx).split(/(\s+)/).forEach(w => { if (w) tokens.push(w); });
    }

    const result = [];
    let current = '';

    for (const tok of tokens) {
      const isSpace = /^\s+$/.test(tok);
      if (isSpace && current === '') continue;

      if (current.length + tok.length <= limit) {
        current += tok;
      } else {
        if (current.trim()) {
          result.push(current.trimEnd());
          current = isSpace ? '' : tok;
        } else {
          // Neu ban than 1 cong thuc don le dai hon 71 ky tu -> giu nguyen tren 1 dong
          result.push(tok.trim());
          current = '';
        }
      }
    }
    if (current.trim()) result.push(current.trimEnd());
    return result.length ? result : [''];
  }

  function normalizeAiPastedMarkdown(rawText) {
    let text = String(rawText || '').replace(/\r\n/g, '\n');

    // 1. Chuan hoa cong thuc toan tu ChatGPT/Gemini ([...], \(...\), $...$) sang $$...$$
    text = text
      .replace(/\\\[([\s\S]+?)\\\]/g, (_, inner) => `$$${inner.trim()}$$`)
      .replace(/\\\(([\s\S]+?)\\\)/g, (_, inner) => `$$${inner.trim()}$$`)
      .replace(/(^|[^$\\])\$([^$\n]+?)\$(?!\$)/g, (_, pre, inner) => `${pre}$$${inner.trim()}$$`);

    const rawLines = text.split('\n');
    const wrapped = [];
    let inCode = false;
    let inMathBlock = false;

    for (let i = 0; i < rawLines.length; i++) {
      let line = rawLines[i];

      if (/^\s*```/.test(line) && !inMathBlock) {
        inCode = !inCode;
        wrapped.push(line);
        continue;
      }
      if (inCode) {
        wrapped.push(line);
        continue;
      }

      if (/^\s*\$\$\s*$/.test(line)) {
        inMathBlock = !inMathBlock;
        wrapped.push(line);
        continue;
      }
      if (inMathBlock) {
        wrapped.push(line);
        continue;
      }

      line = line.replace(/^#{4,6}\s+/, '### ');

      if (/^\s*\|[\s:-]+\|\s*$/.test(line)) continue;
      if (/^\s*\|.*\|\s*$/.test(line)) {
        line = '• ' + line.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim()).filter(Boolean).join(' — ');
      }

      if (
        /^(#{1,3}\s+|[-*+]\s+|\d+[.)]\s+|[-*_]{3,})/.test(line) ||
        /^\s*\$\$((?:(?!\$\$).)+?)\$\$\s*$/.test(line) ||
        /^\s*\/\/((?:(?!\/\/).)+?)\/\/\s*$/.test(line)
      ) {
        wrapped.push(line);
        continue;
      }

      const quoteMatch = line.match(/^\s*>\s?(.*)$/);
      if (quoteMatch) {
        const qLines = wrapPlainLineProtectingMath(quoteMatch[1], MAX_CHARS_PER_LINE - 2);
        qLines.forEach(ql => wrapped.push(`> ${ql}`));
        continue;
      }

      wrapPlainLineProtectingMath(line, MAX_CHARS_PER_LINE).forEach(wl => wrapped.push(wl));
    }

    return wrapped.join('\n');
  }

  function cascadeOverflowFrom(startPageIdx) {
    const measurer = document.createElement('div');
    measurer.className = 'page-editor';
    measurer.style.position = 'fixed';
    measurer.style.left = '-9999px';
    measurer.style.top = '0';
    measurer.style.visibility = 'hidden';
    document.body.appendChild(measurer);

    let lastTouchedPageIdx = startPageIdx;
    try {
      let idx = startPageIdx;
      while (idx < state.pages.length) {
        const page = state.pages[idx];
        measurer.innerHTML = markdownToEditorHtml(page.content || '');

        if (measurer.scrollHeight <= measurer.clientHeight + 1) {
          idx++;
          continue;
        }

        const overflowNodes = [];
        while (measurer.scrollHeight > measurer.clientHeight + 1 && measurer.childNodes.length > 1) {
          overflowNodes.unshift(measurer.lastChild);
          measurer.removeChild(measurer.lastChild);
        }

        page.content = editorHtmlToMarkdown(measurer);
        markDirty(idx);

        if (overflowNodes.length > 0) {
          const tempDiv = document.createElement('div');
          overflowNodes.forEach(n => tempDiv.appendChild(n));
          const overflowMd = editorHtmlToMarkdown(tempDiv);

          const nextIdx = idx + 1;
          while (state.pages.length <= nextIdx) {
            state.pages.push(createBlankPage(), createBlankPage());
          }
          ensureEvenPages();

          const nextPage = state.pages[nextIdx];
          nextPage.content = nextPage.content
            ? `${overflowMd}\n${nextPage.content}`
            : overflowMd;
          markDirty(nextIdx);
          lastTouchedPageIdx = nextIdx;
        }
        idx++;
      }
    } finally {
      document.body.removeChild(measurer);
    }
    return lastTouchedPageIdx;
  }

  function pasteAiTextIntoEditor(side, rawPlain) {
    const refs = getSideRefs(side);
    const editor = refs.editor;
    const pageIdx = getPageIndex(side);
    const targetPage = getPage(side);

    // Neu dang o trong khung Code (<pre>) thi dan nguyen van text vao khung Code
    const currentBlock = getCurrentBlock(editor);
    if (currentBlock && currentBlock.nodeType === Node.ELEMENT_NODE && currentBlock.tagName.toLowerCase() === 'pre') {
      document.execCommand('insertText', false, rawPlain.replace(/\r\n/g, '\n'));
      syncEditorToPage(side);
      checkAndHandleOverflow(side);
      return;
    }

    const pastedMd = normalizeAiPastedMarkdown(rawPlain);
    if (!pastedMd) return;

    const children = Array.from(editor.childNodes);
    const blockIdx = currentBlock ? children.indexOf(currentBlock) : -1;

    if (blockIdx < 0 || children.length === 0) {
      targetPage.content = targetPage.content
        ? `${targetPage.content}\n${pastedMd}`
        : pastedMd;
    } else {
      const offsetInBlock = getCaretOffsetWithin(currentBlock);
      const beforeContainer = document.createElement('div');
      const afterContainer = document.createElement('div');

      for (let i = 0; i < blockIdx; i++) {
        beforeContainer.appendChild(children[i].cloneNode(true));
      }

      const activeTag = currentBlock.nodeType === Node.ELEMENT_NODE ? currentBlock.tagName.toLowerCase() : 'div';
      const plainText = (currentBlock.textContent || '').replace(/\u00A0/g, ' ');

      if (activeTag === 'ul' || activeTag === 'ol' || offsetInBlock >= plainText.length) {
        beforeContainer.appendChild(currentBlock.cloneNode(true));
      } else if (offsetInBlock <= 0) {
        afterContainer.appendChild(currentBlock.cloneNode(true));
      } else {
        const leftPart = plainText.slice(0, offsetInBlock);
        const rightPart = plainText.slice(offsetInBlock);
        if (leftPart) {
          const d1 = document.createElement('div');
          d1.textContent = leftPart;
          beforeContainer.appendChild(d1);
        }
        if (rightPart) {
          const d2 = document.createElement('div');
          d2.textContent = rightPart;
          afterContainer.appendChild(d2);
        }
      }

      for (let i = blockIdx + 1; i < children.length; i++) {
        afterContainer.appendChild(children[i].cloneNode(true));
      }

      const beforeMd = editorHtmlToMarkdown(beforeContainer);
      const afterMd = editorHtmlToMarkdown(afterContainer);
      targetPage.content = [beforeMd, pastedMd, afterMd].filter(s => s !== '').join('\n');
    }

    markDirty(pageIdx);
    const endPageIdx = cascadeOverflowFrom(pageIdx);

    // Neu noi dung tran sang trang sau thi tu lat toi trang cuoi cung cua phan vua dan
    if (endPageIdx > pageIdx) {
      state.spreadIndex = endPageIdx % 2 === 0 ? endPageIdx : endPageIdx - 1;
      state.activeSide = endPageIdx % 2 === 0 ? 'left' : 'right';
    }

    renderSpread();
    scheduleSave();

    const destRefs = getSideRefs(state.activeSide);
    destRefs.editor.focus();
    const lastEl = destRefs.editor.lastElementChild || destRefs.editor.lastChild;
    if (lastEl) placeCaretAtEnd(lastEl);
  }

  /* ================= GLOBAL SHORTCUTS & EVENTS ================= */
  function bindGlobalEvents() {
    const goBack = () => {
      flushSave();
      window.location.href = 'lib.html';
    };
    dom.btnBackLibrary?.addEventListener('click', goBack);

    document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = btn.dataset.tool;
        setTool(t);
        if (t === 'text') {
          getSideRefs(state.activeSide).editor.focus();
        }
      });
    });

    document.querySelectorAll('.ink-dot').forEach(dot => {
      dot.addEventListener('click', () => setInkColor(dot.dataset.ink));
    });

    dom.btnInsertTable?.addEventListener('click', insertTableToActivePage);
    dom.btnInsertFreeText?.addEventListener('click', insertFreeTextToActivePage);
    dom.btnToggleHeading?.addEventListener('click', toggleHeadingOnActiveSide);
    dom.btnToggleCode?.addEventListener('click', toggleCodeBlockOnActiveSide);

    dom.btnOverviewGrid?.addEventListener('click', () => toggleOverviewMode());
    dom.btnToggleZoom?.addEventListener('click', () => toggleZoomMode());

    dom.btnPrevSpread?.addEventListener('click', prevSpread);
    dom.btnNextSpread?.addEventListener('click', nextSpread);

    dom.searchInput?.addEventListener('input', (e) => runSearch(e.target.value));
    dom.searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        jumpToNextSearchMatch();
      }
    });

    dom.jumpPageInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const num = parseInt(dom.jumpPageInput.value, 10);
        if (!Number.isNaN(num) && num >= 1) {
          const targetIdx = Math.min(state.pages.length - 1, num - 1);
          state.spreadIndex = targetIdx % 2 === 0 ? targetIdx : targetIdx - 1;
          state.activeSide = targetIdx % 2 === 0 ? 'left' : 'right';
          if (state.overviewMode) toggleOverviewMode(false);
          renderSpread();
          dom.jumpPageInput.blur();
        }
      }
    });

    dom.strokeSwatches?.querySelectorAll('.stroke-swatch').forEach(sw => {
      sw.addEventListener('click', () => {
        state.drawStyle.color = sw.dataset.stroke;
        dom.strokeSwatches.querySelectorAll('.stroke-swatch').forEach(s => s.classList.toggle('active', s === sw));
      });
    });

    dom.strokeWidthRow?.querySelectorAll('.size-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        state.drawStyle.width = Number(pill.dataset.width);
        dom.strokeWidthRow.querySelectorAll('.size-pill').forEach(p => p.classList.toggle('active', p === pill));
      });
    });

    dom.strokeOpacitySlider?.addEventListener('input', () => {
      const pct = Number(dom.strokeOpacitySlider.value);
      state.drawStyle.opacity = pct / 100;
      if (dom.opacityValLabel) dom.opacityValLabel.textContent = `${pct}%`;
    });

    dom.btnUndoDraw?.addEventListener('click', () => {
      const page = getPage(state.activeSide);
      if (page.shapes && page.shapes.length) {
        page.shapes.pop();
        markDirty(getPageIndex(state.activeSide));
        renderSide(state.activeSide);
      }
    });

    dom.btnClearDraw?.addEventListener('click', () => {
      const page = getPage(state.activeSide);
      page.shapes = [];
      markDirty(getPageIndex(state.activeSide));
      renderSide(state.activeSide);
    });

    dom.ctxAddLeft?.addEventListener('click', () => {
      dom.pageContextMenu.classList.remove('open');
      insertPageRelative(state.contextTargetSide, 0);
    });
    dom.ctxAddRight?.addEventListener('click', () => {
      dom.pageContextMenu.classList.remove('open');
      insertPageRelative(state.contextTargetSide, 1);
    });
    dom.ctxDeletePage?.addEventListener('click', () => {
      dom.pageContextMenu.classList.remove('open');
      deleteTargetPage(state.contextTargetSide);
    });

    window.addEventListener('pointerup', () => {
      state.isErasing = false;
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#pageContextMenu')) {
        dom.pageContextMenu?.classList.remove('open');
      }
    });

    document.addEventListener('paste', (e) => {
      const activeEl = document.activeElement;
      const isInInput = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.classList.contains('free-text-body') ||
        activeEl.tagName === 'TD'
      );
      if (isInInput || state.overviewMode) return;

      const items = e.clipboardData?.items;
      if (items) {
        for (const item of items) {
          if (item.type.startsWith('image/')) {
            e.preventDefault();
            const file = item.getAsFile();
            if (file) {
              const reader = new FileReader();
              reader.onload = () => insertImageToActivePage(reader.result);
              reader.readAsDataURL(file);
            }
            return;
          }
        }
      }

      const plain = e.clipboardData?.getData('text/plain');
      if (plain) {
        e.preventDefault();
        const side = (activeEl && activeEl.classList.contains('page-editor'))
          ? (activeEl.dataset.side || state.activeSide)
          : state.activeSide;
        pasteAiTextIntoEditor(side, plain);
      }
    });

    dom.btnOpenGuide?.addEventListener('click', () => dom.guideBackdrop?.classList.add('open'));
    dom.btnCloseGuide?.addEventListener('click', () => dom.guideBackdrop?.classList.remove('open'));
    dom.guideBackdrop?.addEventListener('click', (e) => {
      if (e.target === dom.guideBackdrop) dom.guideBackdrop.classList.remove('open');
    });

    window.addEventListener('keydown', (e) => {
      const sketchOpen = document.getElementById('sketchpadBackdrop')?.classList.contains('open');
      if (sketchOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          window.NotebookSketchpad?.close();
        } else if (e.ctrlKey && e.key === 'Enter') {
          e.preventDefault();
          window.NotebookSketchpad?.import();
        }
        return;
      }

      if (e.key === 'Escape') {
        if (dom.guideBackdrop?.classList.contains('open')) {
          dom.guideBackdrop.classList.remove('open');
          return;
        }
        if (dom.pageContextMenu?.classList.contains('open')) {
          dom.pageContextMenu.classList.remove('open');
          return;
        }
        if (state.overviewMode) {
          toggleOverviewMode(false);
          return;
        }
        goBack();
        return;
      }

      if (e.ctrlKey && !e.altKey) {
        const k = e.key.toLowerCase();
        const code = e.code;

        if (code === 'KeyA' || k === 'a') {
          const inTextField = e.target.matches && e.target.matches('input, textarea, [contenteditable="true"]');
          if (state.activeTool !== 'text' || !inTextField) {
            e.preventDefault();
            e.stopPropagation();
            setTool('text');
            getSideRefs(state.activeSide).editor.focus();
          }
        } else if (code === 'KeyS' || k === 's') {
          e.preventDefault();
          e.stopPropagation();
          setTool('line');
        } else if (code === 'KeyO' || k === 'o') {
          e.preventDefault();
          e.stopPropagation();
          setTool('oval');
        } else if (code === 'KeyR' || k === 'r') {
          e.preventDefault();
          e.stopPropagation();
          setTool('rect');
        } else if (code === 'KeyD' || k === 'd') {
          e.preventDefault();
          e.stopPropagation();
          setTool('arrow');
        } else if (code === 'KeyF' || k === 'f') {
          e.preventDefault();
          e.stopPropagation();
          setTool('eraser');
        } else if (code === 'KeyT' || k === 't') {
          e.preventDefault();
          e.stopPropagation();
          insertTableToActivePage();
        } else if (code === 'KeyB' || k === 'b') {
          e.preventDefault();
          e.stopPropagation();
          insertFreeTextToActivePage();
        } else if (code === 'KeyG' || k === 'g') {
          e.preventDefault();
          e.stopPropagation();
          toggleOverviewMode();
        } else if (code === 'KeyQ' || k === 'q') {
          e.preventDefault();
          e.stopPropagation();
          toggleZoomMode();
        }
      }

      if (e.altKey && !e.ctrlKey) {
        const k = e.key.toLowerCase();
        const code = e.code;

        if (code === 'Digit1' || k === '1') {
          e.preventDefault();
          e.stopPropagation();
          toggleHeadingOnActiveSide();
        } else if (code === 'Digit2' || k === '2') {
          e.preventDefault();
          e.stopPropagation();
          toggleCodeBlockOnActiveSide();
        } else if (code === 'KeyV' || k === 'v') {
          e.preventDefault();
          e.stopPropagation();
          window.NotebookSketchpad?.open();
        } else if (code === 'KeyT' || k === 't') {
          e.preventDefault();
          e.stopPropagation();
          dom.searchInput?.focus();
          dom.searchInput?.select();
        } else if (code === 'KeyO' || k === 'o') {
          e.preventDefault();
          e.stopPropagation();
          dom.jumpPageInput?.focus();
          dom.jumpPageInput?.select();
        } else if (code === 'KeyG' || k === 'g') {
          e.preventDefault();
          e.stopPropagation();
          insertPageRelative(state.activeSide, 0);
        } else if (code === 'KeyH' || k === 'h') {
          e.preventDefault();
          e.stopPropagation();
          insertPageRelative(state.activeSide, 1);
        } else if (code === 'KeyD' || k === 'd') {
          e.preventDefault();
          e.stopPropagation();
          deleteTargetPage(state.activeSide);
        } else if (code === 'KeyE' || k === 'e') {
          e.preventDefault();
          e.stopPropagation();
          dom.guideBackdrop?.classList.toggle('open');
        }
      }
    }, true);

    window.addEventListener('resize', () => {
      updateSpreadScale();
      if (state.overviewMode) renderOverviewGrid();
    });

    window.addEventListener('beforeunload', flushSave);
  }

  /* ================= INIT ================= */
  function init() {
    // Tu dong don sach khung JSON AI cu neu van con sot trong index.html
    document.getElementById('jsonImportBackdrop')?.remove();
    document.getElementById('btnOpenJsonImport')?.remove();

    cacheDom();

    const params = new URLSearchParams(window.location.search);
    let bookId = params.get('id') || localStorage.getItem('the_notebook_active_book_id');
    let book = bookId ? NotebookStore.loadNote(bookId) : null;

    if (!book) {
      const notes = NotebookStore.listNotes();
      if (notes.length > 0) {
        book = NotebookStore.loadNote(notes[0].id);
      } else {
        book = NotebookStore.createBook('Untitled Volume', 'Anonymous');
      }
    }

    state.bookId = book.id;
    state.book = book;
    localStorage.setItem('the_notebook_active_book_id', book.id);

    const rawPages = Array.isArray(book.pages) && book.pages.length > 0
      ? book.pages
      : [createBlankPage(book.title || '', book.date || ''), createBlankPage()];

    state.pages = rawPages.map(normalizePage);
    ensureEvenPages();

    if (rawPages.some(p => Array.isArray(p.lines) && typeof p.content !== 'string')) {
      state.pages.forEach((_, idx) => state.dirtyPages.add(idx));
      scheduleSave();
    }

    setInkColor(book.ink_color || '#153b75');

    bindPageEvents('left');
    bindPageEvents('right');
    setupSvgDrawing('left');
    setupSvgDrawing('right');
    setupSketchpad();
    bindGlobalEvents();

    window.NotebookEditor = {
      state,
      getPage,
      getPageIndex,
      markDirty,
      scheduleSave,
      flushSave,
      renderSpread,
      setTool,
      insertImageToActivePage,
      insertTableToActivePage,
      insertFreeTextToActivePage
    };

    renderSpread();
    dom.leftEditor?.focus();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();