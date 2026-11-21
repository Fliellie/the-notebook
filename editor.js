/* =========================================================================
   MATH PASTE FORMATTER (AUTO-CONVERT LATEX / KATEX / WIKIPEDIA ON CTRL+V)
   ========================================================================= */
const MathPasteFormatter = {
  GREEK_MAP: {
    alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ',
    epsilon: 'ε', varepsilon: 'ε', zeta: 'ζ', eta: 'η',
    theta: 'θ', vartheta: 'ϑ', iota: 'ι', kappa: 'κ',
    lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ',
    omicron: 'ο', pi: 'π', varpi: 'ϖ', rho: 'ρ',
    varrho: 'ϱ', sigma: 'σ', varsigma: 'ς', tau: 'τ',
    upsilon: 'υ', phi: 'φ', varphi: 'ϕ', chi: 'χ',
    psi: 'ψ', omega: 'ω',
    Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ',
    Xi: 'Ξ', Pi: 'Π', Sigma: 'Σ', Upsilon: 'Υ',
    Phi: 'Φ', Psi: 'Ψ', Omega: 'Ω'
  },

  SYMBOL_MAP: {
    sum: '∑', prod: '∏', coprod: '∐',
    int: '∫', iint: '∬', iiint: '∭', oint: '∮',
    infty: '∞', partial: '∂', nabla: '∇',
    pm: '±', mp: '∓', times: '×', div: '÷',
    cdot: '·', ast: '∗', star: '⋆', circ: '∘',
    bullet: '•', oplus: '⊕', otimes: '⊗',
    neq: '≠', ne: '≠', le: '≤', leq: '≤',
    ge: '≥', geq: '≥', ll: '≪', gg: '≫',
    approx: '≈', equiv: '≡', propto: '∝', doteq: '≐',
    cong: '≅', sim: '∼', simeq: '≃',
    in: '∈', notin: '∉', ni: '∋',
    subset: '⊂', supset: '⊃', subseteq: '⊆', supseteq: '⊇', nsubseteq: '⊈',
    cup: '∪', cap: '∩', setminus: '∖',
    emptyset: '∅', varnothing: '∅',
    forall: '∀', exists: '∃', nexists: '∄',
    neg: '¬', lnot: '¬', land: '∧', wedge: '∧', lor: '∨', vee: '∨',
    therefore: '∴', because: '∵', vdash: '⊢', models: '⊨',
    angle: '∠', measuredangle: '∡', triangle: '△',
    perp: '⊥', parallel: '∥', degree: '°',
    rightarrow: '→', to: '→', leftarrow: '←', gets: '←',
    leftrightarrow: '↔', Rightarrow: '⇒', implies: '⇒',
    Leftarrow: '⇐', Leftrightarrow: '⇔', iff: '⇔',
    mapsto: '↦', uparrow: '↑', downarrow: '↓',
    nearrow: '↗', searrow: '↘',
    cdots: '⋯', ldots: '…', vdots: '⋮', ddots: '⋱',
    aleph: 'ℵ', hbar: 'ℏ', ell: 'ℓ', wp: '℘', Re: 'ℜ', Im: 'ℑ'
  },

  BLACKBOARD_MAP: {
    R: 'ℝ', N: 'ℕ', Z: 'ℤ', Q: 'ℚ', C: 'ℂ', P: 'ℙ', H: 'ℍ'
  },

  CALLIGRAPHIC_MAP: {
    L: 'ℒ', F: 'ℱ', H: 'ℋ', O: '𝒪', B: 'ℬ', E: 'ℰ', M: 'ℳ', R: 'ℛ'
  },

  FUNC_NAMES: new Set([
    'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
    'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh',
    'log', 'ln', 'lg', 'exp', 'lim', 'limsup', 'liminf',
    'sup', 'inf', 'max', 'min', 'arg', 'det', 'dim',
    'gcd', 'hom', 'ker', 'Pr', 'deg', 'mod', 'bmod'
  ]),

  SUPERSCRIPT_MAP: {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
    'n': 'ⁿ', 'i': 'ⁱ', 'x': 'ˣ', 'y': 'ʸ',
    'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ', 'd': 'ᵈ', 'e': 'ᵉ',
    'k': 'ᵏ', 'm': 'ᵐ', 'o': 'ᵒ', 'p': 'ᵖ', 'r': 'ʳ',
    's': 'ˢ', 't': 'ᵗ'
  },

  SUBSCRIPT_MAP: {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
    '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
    'a': 'ₐ', 'e': 'ₑ', 'h': 'ₕ', 'i': 'ᵢ', 'j': 'ⱼ',
    'k': 'ₖ', 'l': 'ₗ', 'm': 'ₘ', 'n': 'ₙ', 'o': 'ₒ',
    'p': 'ₚ', 'r': 'ᵣ', 's': 'ₛ', 't': 'ₜ', 'u': 'ᵤ',
    'v': 'ᵥ', 'x': 'ₓ'
  },

  SIMPLE_FRACTIONS: {
    '1/2': '½', '1/3': '⅓', '2/3': '⅔', '1/4': '¼', '3/4': '¾',
    '1/5': '⅕', '2/5': '⅖', '3/5': '⅗', '4/5': '⅘',
    '1/6': '⅙', '5/6': '⅚', '1/8': '⅛', '3/8': '⅜', '5/8': '⅝', '7/8': '⅞'
  },

  formatClipboard(html, plain) {
    let sourceText = plain || '';
    let fromMathHtml = false;

    if (html && /(katex|MathJax|mwe-math|<math|application\/x-tex)/i.test(html)) {
      const extracted = this._extractFromMathHtml(html);
      if (extracted && extracted.trim()) {
        sourceText = extracted;
        fromMathHtml = true;
      }
    }

    if (!sourceText) {
      return { converted: false, text: '' };
    }

    if (!fromMathHtml && !this._looksLikeMath(sourceText)) {
      return { converted: false, text: sourceText };
    }

    const formatted = this.convertLatexText(sourceText);
    return {
      converted: fromMathHtml || formatted !== sourceText,
      text: formatted
    };
  },

  _extractFromMathHtml(html) {
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html');

      doc.querySelectorAll('.katex-display, .katex, math').forEach(el => {
        if (!el.isConnected) return;
        const ann = el.querySelector('annotation[encoding="application/x-tex"]');
        if (ann && ann.textContent) {
          const span = doc.createElement('span');
          span.textContent = ` ${this.convertLatexText(ann.textContent)} `;
          el.replaceWith(span);
        }
      });

      doc.querySelectorAll('img.mwe-math-fallback-image-inline, img.mwe-math-fallback-image-display').forEach(img => {
        const alt = img.getAttribute('alt') || '';
        const cleaned = alt.replace(/^\{\\displaystyle\s*|\}$/g, '');
        const span = doc.createElement('span');
        span.textContent = ` ${this.convertLatexText(cleaned)} `;
        img.replaceWith(span);
      });

      doc.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
      doc.querySelectorAll('p, div, li, tr').forEach(block => {
        block.append('\n');
      });

      return (doc.body.textContent || '')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/ {2,}/g, ' ')
        .trim();
    } catch {
      return '';
    }
  },

  _looksLikeMath(text) {
    if (/\$\$[\s\S]+?\$\$/.test(text)) return true;
    if (/\\\([\s\S]+?\\\)/.test(text)) return true;
    if (/\\\[[\s\S]+?\\\]/.test(text)) return true;
    if (/(^|[^\\])\$(?!\d+(?:[.,]\d+)?(?:\s|$|[.,;:!?)]))[^$\n]{1,140}\$/.test(text)) return true;
    if (/\\(frac|dfrac|tfrac|sqrt|sum|prod|int|iint|oint|infty|partial|nabla|alpha|beta|gamma|delta|theta|lambda|mu|pi|sigma|omega|Delta|Sigma|Omega|Pi|leq|geq|neq|approx|equiv|times|div|pm|cdot|in|notin|subset|cup|cap|forall|exists|rightarrow|Rightarrow|Leftrightarrow|to|vec|hat|bar|overline|mathbb|mathcal|text|mathrm|mathbf|lim|sin|cos|tan|log|ln)\b/.test(text)) {
      return true;
    }
    if (/[a-zA-Z0-9)\]}]\s*(\^\{[^}]+\}|_[{\w]+|\^[0-9+-])/.test(text)) {
      return true;
    }
    return false;
  },

  _readBraceArg(str, startIdx) {
    while (startIdx < str.length && /\s/.test(str[startIdx])) startIdx++;
    if (startIdx >= str.length) return null;

    if (str[startIdx] !== '{') {
      return { content: str[startIdx], nextIdx: startIdx + 1 };
    }

    let depth = 0;
    let i = startIdx;
    for (; i < str.length; i++) {
      if (str[i] === '{' && str[i - 1] !== '\\') depth++;
      else if (str[i] === '}' && str[i - 1] !== '\\') {
        depth--;
        if (depth === 0) {
          return {
            content: str.slice(startIdx + 1, i),
            nextIdx: i + 1
          };
        }
      }
    }
    return null;
  },

  _replaceCommandWithArgs(str, cmdRegex, handler) {
    let out = '';
    let idx = 0;
    while (idx < str.length) {
      cmdRegex.lastIndex = idx;
      const match = cmdRegex.exec(str);
      if (!match) {
        out += str.slice(idx);
        break;
      }
      out += str.slice(idx, match.index);
      const res = handler(str, match.index + match[0].length, match);
      if (res) {
        out += res.replacement;
        idx = res.nextIdx;
      } else {
        out += match[0];
        idx = match.index + match[0].length;
      }
    }
    return out;
  },

  _toSuperOrSub(raw, map, openChar, closeChar) {
    const converted = this.convertLatexText(raw).trim();
    if (!converted) return '';
    let allMapped = true;
    let mappedStr = '';
    for (const ch of converted) {
      if (ch === ' ') continue;
      if (map[ch]) {
        mappedStr += map[ch];
      } else {
        allMapped = false;
        break;
      }
    }
    if (allMapped && mappedStr.length > 0) {
      return mappedStr;
    }
    return `${openChar}(${converted})${closeChar}`;
  },

  convertLatexText(input) {
    let s = String(input);

    s = s.replace(/\$\$([\s\S]*?)\$\$/g, (_, inner) => inner.trim());
    s = s.replace(/\\\[([\s\S]*?)\\\]/g, (_, inner) => inner.trim());
    s = s.replace(/\\\(([\s\S]*?)\\\)/g, (_, inner) => inner.trim());
    s = s.replace(/(^|[^\\])\$(?!\d+(?:[.,]\d+)?(?:\s|$|[.,;:!?)]))([^\s$][^$\n]*?[^\s$]|[^\s$\d])\$/g, '$1$2');

    s = s.replace(/\\(left|right|big|Big|bigg|Bigg)\s*([()[\]|.])/g, (_, __, d) => (d === '.' ? '' : d));
    s = s.replace(/\\(left|right|big|Big|bigg|Bigg)\s*\\([{}])/g, '$2');
    s = s.replace(/\\([{}%&$#_])/g, '$1');
    s = s.replace(/\\(,|;|!|:|quad|qquad|\s)/g, ' ');

    s = this._replaceCommandWithArgs(s, /\\mathbb\b/g, (str, pos) => {
      const arg = this._readBraceArg(str, pos);
      if (!arg) return null;
      const mapped = arg.content.trim().split('').map(c => this.BLACKBOARD_MAP[c] || c).join('');
      return { replacement: mapped, nextIdx: arg.nextIdx };
    });

    s = this._replaceCommandWithArgs(s, /\\mathcal\b/g, (str, pos) => {
      const arg = this._readBraceArg(str, pos);
      if (!arg) return null;
      const mapped = arg.content.trim().split('').map(c => this.CALLIGRAPHIC_MAP[c] || c).join('');
      return { replacement: mapped, nextIdx: arg.nextIdx };
    });

    s = this._replaceCommandWithArgs(s, /\\(text|mathrm|mathbf|mathit|mathsf|mathtt|operatorname|boldsymbol)\b/g, (str, pos) => {
      const arg = this._readBraceArg(str, pos);
      if (!arg) return null;
      return { replacement: this.convertLatexText(arg.content), nextIdx: arg.nextIdx };
    });

    s = this._replaceCommandWithArgs(s, /\\(d|t)?frac\b/g, (str, pos) => {
      const numArg = this._readBraceArg(str, pos);
      if (!numArg) return null;
      const denArg = this._readBraceArg(str, numArg.nextIdx);
      if (!denArg) return null;

      const num = this.convertLatexText(numArg.content).trim();
      const den = this.convertLatexText(denArg.content).trim();
      const key = `${num}/${den}`;
      if (this.SIMPLE_FRACTIONS[key]) {
        return { replacement: this.SIMPLE_FRACTIONS[key], nextIdx: denArg.nextIdx };
      }

      const wrapNum = /[+\-*/= ]/.test(num) && !/^\(.*\)$/.test(num) ? `(${num})` : num;
      const wrapDen = /[+\-*/= ]/.test(den) && !/^\(.*\)$/.test(den) ? `(${den})` : den;
      return { replacement: `${wrapNum}/${wrapDen}`, nextIdx: denArg.nextIdx };
    });

    s = this._replaceCommandWithArgs(s, /\\sqrt\b/g, (str, pos) => {
      let cur = pos;
      while (cur < str.length && /\s/.test(str[cur])) cur++;
      let rootDegree = '';
      if (str[cur] === '[') {
        const closeBracket = str.indexOf(']', cur + 1);
        if (closeBracket !== -1) {
          rootDegree = str.slice(cur + 1, closeBracket).trim();
          cur = closeBracket + 1;
        }
      }
      const bodyArg = this._readBraceArg(str, cur);
      if (!bodyArg) return null;
      const inner = this.convertLatexText(bodyArg.content).trim();
      const needsParens = inner.length > 1 && !/^\(.*\)$/.test(inner);
      const formattedBody = needsParens ? `(${inner})` : inner;

      let radical = '√';
      if (rootDegree === '3') radical = '∛';
      else if (rootDegree === '4') radical = '∜';
      else if (rootDegree) radical = `${this._toSuperOrSub(rootDegree, this.SUPERSCRIPT_MAP, '^', '')}√`;

      return { replacement: `${radical}${formattedBody}`, nextIdx: bodyArg.nextIdx };
    });

    s = this._replaceCommandWithArgs(s, /\\(vec|hat|widehat|bar|overline|tilde|widetilde|dot|ddot)\b/g, (str, pos, match) => {
      const arg = this._readBraceArg(str, pos);
      if (!arg) return null;
      const cmd = match[1];
      const inner = this.convertLatexText(arg.content).trim();
      const combMap = {
        vec: '\u20D7',
        hat: '\u0302',
        widehat: '\u0302',
        bar: '\u0304',
        overline: '\u0304',
        tilde: '\u0303',
        widetilde: '\u0303',
        dot: '\u0307',
        ddot: '\u0308'
      };
      const mark = combMap[cmd] || '';
      return { replacement: `${inner}${mark}`, nextIdx: arg.nextIdx };
    });

    s = s.replace(/\\([a-zA-Z]+)\b/g, (full, name) => {
      if (this.GREEK_MAP[name]) return this.GREEK_MAP[name];
      if (this.SYMBOL_MAP[name]) return this.SYMBOL_MAP[name];
      if (this.FUNC_NAMES.has(name)) return name;
      return full;
    });

    s = s.replace(/\^\s*\{?\s*°\s*\}?/g, '°');

    s = this._replaceCommandWithArgs(s, /\^/g, (str, pos) => {
      const arg = this._readBraceArg(str, pos);
      if (!arg) return null;
      return {
        replacement: this._toSuperOrSub(arg.content, this.SUPERSCRIPT_MAP, '^', ''),
        nextIdx: arg.nextIdx
      };
    });

    s = this._replaceCommandWithArgs(s, /_/g, (str, pos) => {
      const arg = this._readBraceArg(str, pos);
      if (!arg) return null;
      return {
        replacement: this._toSuperOrSub(arg.content, this.SUBSCRIPT_MAP, '_', ''),
        nextIdx: arg.nextIdx
      };
    });

    s = s.replace(/\{([^{}]+)\}/g, '$1');
    s = s.replace(/[ \t]{2,}/g, ' ');

    return s;
  }
};

const NotebookEditor = {
  LINES_PER_PAGE: 23,
  TAB_SPACES: '    ',
  MAX_HYDRATED_OVERVIEW: 48,
  FONTS: [
    "'Mali', 'Patrick Hand', cursive",
    "'Patrick Hand', 'Mali', cursive",
    "'Caveat', 'Mali', cursive"
  ],

  book: null,
  pages: [],
  spreadIndex: 0,
  activeSide: 'left',
  activeLineIdx: 0,
  activeFocusEl: null,
  contextTargetSide: 'left',
  lastClickPoint: null,

  isZoomed: false,
  isOverview: false,
  currentScale: 1,
  fontIndex: 0,
  inkColor: '#153b75',
  saveTimer: null,
  isComposing: false,
  isWrapping: false,

  // Dirty-tracking state
  dirtyPageIndices: new Set(),
  metaDirty: false,

  // Overview lazy-rendering state
  _overviewObserver: null,
  _hydratedOverviewQueue: [],

  searchMatches: [],
  searchCursor: -1,

  init() {
    this.ruler = document.getElementById('textRuler');
    this.viewport = document.getElementById('bookViewport');
    this.zoomStage = document.getElementById('zoomStage');
    this.coverFrame = document.getElementById('bookCoverFrame');
    this.spreadEl = document.getElementById('bookSpread');
    this.overviewViewport = document.getElementById('overviewViewport');
    this.overviewGrid = document.getElementById('overviewGrid');

    NotebookCanvas.init(() => this.scheduleSave());
    this._loadBookFromUrl();
    this._bindToolbarAndEvents();
    this._bindContextMenu();
    this._bindPageSmartClick('left');
    this._bindPageSmartClick('right');
    this._bindLinesEditor('left');
    this._bindLinesEditor('right');
    this._bindGlobalShortcuts();
    this._bindPasteHandler();
    this.renderSpread();

    if (window.ResizeObserver) {
      if (this.viewport) {
        new ResizeObserver(() => this._updateScaleLayout()).observe(this.viewport);
      }
      if (this.overviewGrid) {
        new ResizeObserver(() => this._rescaleOverviewCards()).observe(this.overviewGrid);
      }
    } else {
      window.addEventListener('resize', () => {
        this._updateScaleLayout();
        this._rescaleOverviewCards();
      });
    }
  },

  getZoomScale() {
    return this.currentScale || 1;
  },

  _createBlankPage(title = '', date = '') {
    return {
      title,
      date,
      lines: Array(this.LINES_PER_PAGE).fill(''),
      richLines: Array(this.LINES_PER_PAGE).fill(''),
      lineTypes: Array(this.LINES_PER_PAGE).fill('normal'),
      colonIndents: Array(this.LINES_PER_PAGE).fill(''),
      softWraps: Array(this.LINES_PER_PAGE).fill(false),
      shapes: [],
      images: [],
      tables: [],
      freeTexts: []
    };
  },

  _loadBookFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const bookId = params.get('id');
    let loaded = bookId ? NotebookStore.loadNote(bookId) : null;

    if (!loaded) {
      const list = NotebookStore.listNotes();
      loaded = list.length > 0 ? NotebookStore.loadNote(list[0].id) : NotebookStore.createBook();
    }

    this.book = loaded;
    this.inkColor = loaded.ink_color || '#153b75';
    this.fontIndex = loaded.font_index || 0;

    document.documentElement.style.setProperty('--ink-color', this.inkColor);
    document.documentElement.style.setProperty('--font-hand', this.FONTS[this.fontIndex % this.FONTS.length]);

    document.querySelectorAll('.ink-dot').forEach(dot => {
      dot.classList.toggle('active', dot.dataset.ink === this.inkColor);
    });

    if (Array.isArray(loaded.pages) && loaded.pages.length >= 2) {
      this.pages = loaded.pages.map(p => ({
        title: p.title || '',
        date: p.date || '',
        lines: this._normalizeLines(p.lines),
        richLines: this._normalizeLines(p.richLines),
        lineTypes: this._normalizeLineTypes(p.lineTypes),
        colonIndents: this._normalizeColonIndents(p.colonIndents),
        softWraps: this._normalizeBoolArray(p.softWraps),
        shapes: Array.isArray(p.shapes) ? p.shapes : [],
        images: Array.isArray(p.images) ? p.images : [],
        tables: Array.isArray(p.tables) ? p.tables : [],
        freeTexts: Array.isArray(p.freeTexts) ? p.freeTexts : []
      }));
    } else {
      const p1 = this._createBlankPage(loaded.title || '', loaded.date || '');
      if (Array.isArray(loaded.lines) && loaded.lines.length > 0) {
        for (let i = 0; i < Math.min(this.LINES_PER_PAGE, loaded.lines.length); i++) {
          p1.lines[i] = loaded.lines[i] || '';
        }
      }
      const p2 = this._createBlankPage('', '');
      this.pages = [p1, p2];
    }

    this._ensureEvenPageCount();
  },

  _normalizeLines(lines) {
    const out = Array(this.LINES_PER_PAGE).fill('');
    if (Array.isArray(lines)) {
      for (let i = 0; i < Math.min(this.LINES_PER_PAGE, lines.length); i++) {
        out[i] = lines[i] || '';
      }
    }
    return out;
  },

  _normalizeLineTypes(types) {
    const out = Array(this.LINES_PER_PAGE).fill('normal');
    if (Array.isArray(types)) {
      for (let i = 0; i < Math.min(this.LINES_PER_PAGE, types.length); i++) {
        out[i] = types[i] || 'normal';
      }
    }
    return out;
  },

  _normalizeColonIndents(indents) {
    const out = Array(this.LINES_PER_PAGE).fill('');
    if (Array.isArray(indents)) {
      for (let i = 0; i < Math.min(this.LINES_PER_PAGE, indents.length); i++) {
        out[i] = indents[i] || '';
      }
    }
    return out;
  },

  _normalizeBoolArray(arr) {
    const out = Array(this.LINES_PER_PAGE).fill(false);
    if (Array.isArray(arr)) {
      for (let i = 0; i < Math.min(this.LINES_PER_PAGE, arr.length); i++) {
        out[i] = Boolean(arr[i]);
      }
    }
    return out;
  },

  _ensureEvenPageCount() {
    let added = false;
    while (this.pages.length < 2 || this.pages.length % 2 !== 0) {
      this.pages.push(this._createBlankPage());
      this.dirtyPageIndices.add(this.pages.length - 1);
      added = true;
    }
    if (added) this.metaDirty = true;
    if (this.spreadIndex >= this.pages.length) {
      this.spreadIndex = Math.max(0, this.pages.length - 2);
    }
  },

  getPageIndex(side = this.activeSide) {
    return side === 'right' ? this.spreadIndex + 1 : this.spreadIndex;
  },

  setActiveSide(side) {
    this.activeSide = side;
    if (this.isZoomed) {
      this._applyZoomClasses();
    }
    this._syncToolbarLineTypeState();
  },

  /* ================= DIRTY PAGE & DELTA SERIALIZATION ================= */
  markPageDirty(pageIdx) {
    if (typeof pageIdx === 'number' && pageIdx >= 0 && pageIdx < this.pages.length) {
      this.dirtyPageIndices.add(pageIdx);
    }
  },

  markSideDirty(side) {
    this.markPageDirty(this.getPageIndex(side));
  },

  markAllPagesDirty() {
    for (let i = 0; i < this.pages.length; i++) {
      this.dirtyPageIndices.add(i);
    }
    this.metaDirty = true;
  },

  _compactPageForStorage(page) {
    const compact = {
      title: page.title || '',
      date: page.date || '',
      lines: this._normalizeLines(page.lines),
      shapes: Array.isArray(page.shapes) ? page.shapes : [],
      images: Array.isArray(page.images) ? page.images : [],
      tables: Array.isArray(page.tables) ? page.tables : [],
      freeTexts: Array.isArray(page.freeTexts) ? page.freeTexts : []
    };

    if (Array.isArray(page.richLines) && page.richLines.some(r => r && r.trim() !== '')) {
      compact.richLines = this._normalizeLines(page.richLines);
    }
    if (Array.isArray(page.lineTypes) && page.lineTypes.some(t => t && t !== 'normal')) {
      compact.lineTypes = this._normalizeLineTypes(page.lineTypes);
    }
    if (Array.isArray(page.colonIndents) && page.colonIndents.some(c => c && c !== '')) {
      compact.colonIndents = this._normalizeColonIndents(page.colonIndents);
    }
    if (Array.isArray(page.softWraps) && page.softWraps.some(Boolean)) {
      compact.softWraps = this._normalizeBoolArray(page.softWraps);
    }
    return compact;
  },

  scheduleSave(side = null) {
    if (side === 'left' || side === 'right') {
      this.markSideDirty(side);
    } else {
      this.markPageDirty(this.spreadIndex);
      this.markPageDirty(this.spreadIndex + 1);
    }

    const dot = document.getElementById('saveDot');
    if (dot) dot.classList.add('saving');

    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.saveNow(), 350);
  },

  saveNow() {
    clearTimeout(this.saveTimer);
    if (!this.book) return;

    if (!this.metaDirty && this.dirtyPageIndices.size === 0) {
      const dot = document.getElementById('saveDot');
      if (dot) dot.classList.remove('saving');
      return;
    }

    const firstTitle = this.pages[0]?.title?.trim() || this.book.title || 'Untitled Volume';
    const compactPages = this.pages.map((p, idx) =>
      this.dirtyPageIndices.has(idx) ? this._compactPageForStorage(p) : p
    );

    NotebookStore.saveNoteDelta(
      this.book.id,
      {
        title: firstTitle,
        date: this.pages[0]?.date || this.book.date || '',
        ink_color: this.inkColor,
        font_index: this.fontIndex
      },
      compactPages,
      new Set(this.dirtyPageIndices)
    );

    this.dirtyPageIndices.clear();
    this.metaDirty = false;

    const dot = document.getElementById('saveDot');
    if (dot) dot.classList.remove('saving');
  },

  /* ================= HTML SANITIZER & RICH TEXT HELPERS ================= */
  _sanitizeLineHtml(html) {
    if (!html) return '';
    const temp = document.createElement('div');
    temp.innerHTML = html;

    const cleanNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return document.createTextNode(node.textContent);
      }
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return document.createTextNode('');
      }
      const tag = node.tagName.toLowerCase();
      if (tag === 'br') return document.createTextNode('');

      const tagMap = { strong: 'b', em: 'i' };
      const allowed = new Set(['b', 'i', 'u', 'mark']);
      const targetTag = tagMap[tag] || (allowed.has(tag) ? tag : null);

      const container = targetTag ? document.createElement(targetTag) : document.createDocumentFragment();
      Array.from(node.childNodes).forEach(child => {
        container.appendChild(cleanNode(child));
      });
      return container;
    };

    const out = document.createElement('div');
    Array.from(temp.childNodes).forEach(child => out.appendChild(cleanNode(child)));
    return out.innerHTML;
  },

  _escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  },

  _hasRichFormatting(html) {
    return /<(b|i|u|mark)\b/i.test(html || '');
  },

  _sliceHtmlByTextRange(html, startChar, endChar) {
    if (!html || !this._hasRichFormatting(html)) {
      const plain = html || '';
      return plain.slice(startChar, endChar);
    }
    const root = document.createElement('div');
    root.innerHTML = html;
    let pos = 0;

    const walk = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || '';
        const nodeStart = pos;
        const nodeEnd = pos + text.length;
        pos = nodeEnd;

        const overlapStart = Math.max(startChar, nodeStart);
        const overlapEnd = Math.min(endChar, nodeEnd);
        if (overlapStart >= overlapEnd) return null;
        return document.createTextNode(text.slice(overlapStart - nodeStart, overlapEnd - nodeStart));
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        const clone = document.createElement(node.tagName.toLowerCase());
        let hasContent = false;
        Array.from(node.childNodes).forEach(ch => {
          const sub = walk(ch);
          if (sub) {
            clone.appendChild(sub);
            hasContent = true;
          }
        });
        return hasContent ? clone : null;
      }
      return null;
    };

    const out = document.createElement('div');
    Array.from(root.childNodes).forEach(ch => {
      const sub = walk(ch);
      if (sub) out.appendChild(sub);
    });
    return out.innerHTML;
  },

  _setLineRowContent(row, plainText, richHtml = '') {
    const cleanRich = richHtml && this._hasRichFormatting(richHtml)
      ? this._sanitizeLineHtml(richHtml)
      : '';
    if (cleanRich) {
      row.innerHTML = cleanRich;
    } else {
      row.textContent = plainText || '';
    }
  },

  _getActiveLineElement(side) {
    const linesEl = document.getElementById(`${side}Lines`);
    if (!linesEl) return null;
    const sel = window.getSelection();
    if (!sel || !sel.anchorNode) return null;
    const base = sel.anchorNode.nodeType === Node.TEXT_NODE
      ? sel.anchorNode.parentElement
      : sel.anchorNode;
    const row = base?.closest?.('.paper-line');
    return row && linesEl.contains(row) ? row : null;
  },

  _getSelectedLineIndices(side) {
    const linesEl = document.getElementById(`${side}Lines`);
    if (!linesEl) return [this.activeLineIdx];

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !linesEl.contains(sel.anchorNode)) {
      return [this.activeLineIdx];
    }

    const range = sel.getRangeAt(0);
    const startBase = range.startContainer.nodeType === Node.TEXT_NODE
      ? range.startContainer.parentElement
      : range.startContainer;
    const endBase = range.endContainer.nodeType === Node.TEXT_NODE
      ? range.endContainer.parentElement
      : range.endContainer;

    const startRow = startBase?.closest?.('.paper-line');
    const endRow = endBase?.closest?.('.paper-line');

    if (startRow && endRow && linesEl.contains(startRow) && linesEl.contains(endRow)) {
      const sIdx = parseInt(startRow.dataset.lineIdx || '0', 10);
      const eIdx = parseInt(endRow.dataset.lineIdx || '0', 10);
      const lo = Math.min(sIdx, eIdx);
      const hi = Math.max(sIdx, eIdx);
      const indices = [];
      for (let i = lo; i <= hi; i++) indices.push(i);
      return indices;
    }

    return [this.activeLineIdx];
  },

  _getCaretOffsetInLine(lineEl) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return (lineEl.textContent || '').length;
    const range = sel.getRangeAt(0);
    if (!lineEl.contains(range.startContainer)) return (lineEl.textContent || '').length;

    const preRange = document.createRange();
    preRange.selectNodeContents(lineEl);
    preRange.setEnd(range.startContainer, range.startOffset);
    return preRange.toString().length;
  },

  _setCaretOffsetInLine(lineEl, targetOffset) {
    if (!lineEl) return;
    const sel = window.getSelection();
    if (!sel) return;

    const totalLen = (lineEl.textContent || '').length;
    const clamped = Math.max(0, Math.min(targetOffset, totalLen));
    const range = document.createRange();

    if (totalLen === 0) {
      range.setStart(lineEl, 0);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      return;
    }

    const walker = document.createTreeWalker(lineEl, NodeFilter.SHOW_TEXT, null);
    let traversed = 0;
    let node = walker.nextNode();
    while (node) {
      const len = node.textContent.length;
      if (traversed + len >= clamped) {
        range.setStart(node, clamped - traversed);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        return;
      }
      traversed += len;
      node = walker.nextNode();
    }

    range.selectNodeContents(lineEl);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  },

  applyInlineFormat(command) {
    const side = this.activeSide;
    const linesEl = document.getElementById(`${side}Lines`);
    if (!linesEl) return;

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !linesEl.contains(sel.anchorNode)) return;

    if (command === 'highlight') {
      if (sel.isCollapsed) return;
      const range = sel.getRangeAt(0);
      const ancestor = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
        ? range.commonAncestorContainer.parentElement
        : range.commonAncestorContainer;
      const existingMark = ancestor?.closest?.('mark');
      if (existingMark && linesEl.contains(existingMark)) {
        const textNode = document.createTextNode(existingMark.textContent);
        existingMark.replaceWith(textNode);
      } else {
        const mark = document.createElement('mark');
        try {
          range.surroundContents(mark);
        } catch {
          const frag = range.extractContents();
          mark.appendChild(frag);
          range.insertNode(mark);
        }
      }
    } else {
      document.execCommand(command, false, null);
    }

    this._reconcilePageLines(side);
  },

  _applyMarkdownInlineShortcuts(lineEl) {
    const html = lineEl.innerHTML;
    if (!html || !html.includes('*')) return false;

    const caretOffset = this._getCaretOffsetInLine(lineEl);
    const textBefore = (lineEl.textContent || '').slice(0, caretOffset);

    const boldMatch = textBefore.match(/(^|\s)\*\*([^*]+)\*\*\s$/);
    const italicMatch = !boldMatch && textBefore.match(/(^|\s)\*([^*]+)\*\s$/);
    if (!boldMatch && !italicMatch) return false;

    const replaced = html
      .replace(/(^|\s)\*\*([^*<>]+)\*\*(\s)/g, '$1<b>$2</b>$3')
      .replace(/(^|\s)\*([^*<>]+)\*(\s)/g, '$1<i>$2</i>$3');

    if (replaced === html) return false;

    const diff = (lineEl.textContent || '').length;
    lineEl.innerHTML = this._sanitizeLineHtml(replaced);
    const newLen = (lineEl.textContent || '').length;
    const removedMarkers = diff - newLen;
    this._setCaretOffsetInLine(lineEl, Math.max(0, caretOffset - removedMarkers));
    return true;
  },

  /* ================= RENDER SPREAD & UNIFIED LINES EDITOR ================= */
  renderSpread() {
    this._ensureEvenPageCount();
    this._renderSide('left', this.spreadIndex);
    this._renderSide('right', this.spreadIndex + 1);
    this._updateNavigationUI();
    this._applyZoomClasses();
    this._syncToolbarLineTypeState();
  },

  _renderSide(side, pageIdx) {
    const pageData = this.pages[pageIdx];
    if (!Array.isArray(pageData.lineTypes)) pageData.lineTypes = this._normalizeLineTypes();
    if (!Array.isArray(pageData.colonIndents)) pageData.colonIndents = this._normalizeColonIndents();
    if (!Array.isArray(pageData.richLines)) pageData.richLines = this._normalizeLines();
    if (!Array.isArray(pageData.softWraps)) pageData.softWraps = this._normalizeBoolArray();

    const titleEl = document.getElementById(`${side}Title`);
    const dateEl = document.getElementById(`${side}Date`);
    const linesEl = document.getElementById(`${side}Lines`);
    const svgEl = document.getElementById(`${side}Svg`);
    const imagesEl = document.getElementById(`${side}Images`);
    const tablesEl = document.getElementById(`${side}Tables`);
    const freeTextsEl = document.getElementById(`${side}FreeTexts`);
    const numEl = document.getElementById(`${side}PageNum`);

    titleEl.value = pageData.title || '';
    dateEl.value = pageData.date || '';
    numEl.textContent = String(pageIdx + 1);

    titleEl.oninput = () => {
      pageData.title = titleEl.value;
      if (pageIdx === 0) this.metaDirty = true;
      this.scheduleSave(side);
    };
    titleEl.onfocus = () => {
      this.setActiveSide(side);
      this.activeFocusEl = titleEl;
      this.ensureCursorInComfortZone();
    };

    dateEl.oninput = () => {
      pageData.date = dateEl.value;
      if (pageIdx === 0) this.metaDirty = true;
      this.scheduleSave(side);
    };
    dateEl.onfocus = () => {
      this.setActiveSide(side);
      this.activeFocusEl = dateEl;
      this.ensureCursorInComfortZone();
    };

    linesEl.setAttribute('contenteditable', 'true');
    linesEl.setAttribute('spellcheck', 'false');
    linesEl.innerHTML = '';

    for (let i = 0; i < this.LINES_PER_PAGE; i++) {
      const row = this._createPaperLineElement(side, i, pageData);
      linesEl.appendChild(row);
    }

    this._updateCodeBlockClasses(side);

    NotebookCanvas.renderShapes(svgEl, pageData.shapes, side);
    if (typeof NotebookCanvas.renderImages === 'function') {
      NotebookCanvas.renderImages(imagesEl, pageData.images, side);
    }
    NotebookCanvas.renderTables(tablesEl, pageData.tables, side);
    if (typeof NotebookCanvas.renderFreeTexts === 'function') {
      NotebookCanvas.renderFreeTexts(freeTextsEl, pageData.freeTexts, side);
    }
  },

  _createPaperLineElement(side, idx, pageData) {
    const row = document.createElement('div');
    const curType = pageData.lineTypes?.[idx] || 'normal';
    const prevType = idx > 0 ? (pageData.lineTypes?.[idx - 1] || 'normal') : 'normal';
    const nextType = idx < this.LINES_PER_PAGE - 1 ? (pageData.lineTypes?.[idx + 1] || 'normal') : 'normal';

    row.className =
      'paper-line' +
      (curType === 'heading' ? ' is-heading' : '') +
      (curType === 'code'
        ? ' is-code' +
          (prevType !== 'code' ? ' code-start' : '') +
          (nextType !== 'code' ? ' code-end' : '')
        : '');
    row.dataset.side = side;
    row.dataset.lineIdx = String(idx);

    const text = pageData.lines?.[idx] || '';
    const rich = pageData.richLines?.[idx] || '';
    if (pageData.colonIndents?.[idx] && text.startsWith(pageData.colonIndents[idx])) {
      row.dataset.colonIndent = pageData.colonIndents[idx];
    }

    this._setLineRowContent(row, text, rich);
    return row;
  },

  _updateCodeBlockClasses(side) {
    const linesEl = document.getElementById(`${side}Lines`);
    const pageData = this.pages[this.getPageIndex(side)];
    if (!linesEl || !pageData) return;

    const types = pageData.lineTypes || [];
    const rows = linesEl.querySelectorAll('.paper-line');
    for (let i = 0; i < rows.length; i++) {
      const isCode = types[i] === 'code';
      const prevIsCode = i > 0 && types[i - 1] === 'code';
      const nextIsCode = i < this.LINES_PER_PAGE - 1 && types[i + 1] === 'code';
      rows[i].classList.toggle('code-start', isCode && !prevIsCode);
      rows[i].classList.toggle('code-end', isCode && !nextIsCode);
    }
  },

  _syncToolbarLineTypeState() {
    const pageData = this.pages[this.getPageIndex(this.activeSide)];
    const curType = pageData?.lineTypes?.[this.activeLineIdx] || 'normal';
    document.getElementById('btnToggleHeading')?.classList.toggle('active', curType === 'heading');
    document.getElementById('btnToggleCode')?.classList.toggle('active', curType === 'code');
  },

  _bindLinesEditor(side) {
    const linesEl = document.getElementById(`${side}Lines`);
    if (!linesEl) return;

    const syncCursorMeta = () => {
      this.activeSide = side;
      if (this.isZoomed) {
        this._applyZoomClasses();
      }
      const row = this._getActiveLineElement(side);
      if (row) {
        const idx = parseInt(row.dataset.lineIdx || '0', 10);
        this.activeLineIdx = idx;
        this.activeFocusEl = row;
      }
      this._syncToolbarLineTypeState();
    };

    linesEl.addEventListener('focus', () => {
      syncCursorMeta();
      const rows = linesEl.querySelectorAll('.paper-line');
      const targetRow = rows[this.activeLineIdx] || rows[0];
      if (targetRow && !this._getActiveLineElement(side)) {
        this._setCaretOffsetInLine(targetRow, 0);
      }
      this.ensureCursorInComfortZone();
    });

    linesEl.addEventListener('mouseup', () => {
      syncCursorMeta();
      this.ensureCursorInComfortZone();
    });

    linesEl.addEventListener('keyup', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
        syncCursorMeta();
        this.ensureCursorInComfortZone();
      }
    });

    linesEl.addEventListener('compositionstart', () => {
      this.isComposing = true;
    });

    linesEl.addEventListener('compositionend', () => {
      this.isComposing = false;
      this._onLinesEdited(side, false);
    });

    linesEl.addEventListener('input', (e) => {
      if (this.isWrapping || this.isComposing) return;
      const isDelete = (e.inputType || '').startsWith('delete');
      this._onLinesEdited(side, isDelete);
    });

    linesEl.addEventListener('keydown', (e) => this._handleUnifiedLinesKeydown(e, side));
  },

  _onLinesEdited(side, isDelete = false) {
    const linesEl = document.getElementById(`${side}Lines`);
    const pageData = this.pages[this.getPageIndex(side)];
    if (!linesEl || !pageData) return;

    const activeRow = this._getActiveLineElement(side);
    const activeIdx = activeRow ? parseInt(activeRow.dataset.lineIdx || '0', 10) : this.activeLineIdx;
    this.activeLineIdx = activeIdx;
    this.activeFocusEl = activeRow;

    const lineType = pageData.lineTypes?.[activeIdx] || 'normal';

    // Chỉ áp dụng tự động thụt đầu dòng & markdown in đậm/nghiêng cho văn bản thường (không can thiệp vào khung code)
    if (activeRow && lineType !== 'code') {
      this._syncColonIndentState(pageData, activeIdx, activeRow);
      this._applyAutoPrefixIndent(activeRow, isDelete);
      this._applyMarkdownInlineShortcuts(activeRow);
    }

    this._reconcilePageLines(side, activeIdx);
    this._syncToolbarLineTypeState();
  },

  _findWrapSplitIndex(text, sampleLine, lineType) {
    let searchFrom = text.length;
    while (searchFrom > 0) {
      const sp = text.lastIndexOf(' ', searchFrom - 1);
      if (sp <= 0) break;
      if (!this._exceedsLineLimit(text.slice(0, sp), sampleLine, lineType)) {
        return sp;
      }
      searchFrom = sp;
    }
    return -1;
  },

  _findHardCutIndex(text, sampleLine, lineType) {
    let lo = 1;
    let hi = Math.max(1, text.length - 1);
    let best = 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (!this._exceedsLineLimit(text.slice(0, mid), sampleLine, lineType)) {
        best = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return best;
  },

  _reconcilePageLines(side, focusHintIdx = null) {
    const linesEl = document.getElementById(`${side}Lines`);
    const pageData = this.pages[this.getPageIndex(side)];
    if (!linesEl || !pageData) return;

    this.isWrapping = true;
    try {
      const domChildren = Array.from(linesEl.childNodes);
      const isDomStructureIntact =
        domChildren.length === this.LINES_PER_PAGE &&
        domChildren.every(n => n.nodeType === Node.ELEMENT_NODE && n.classList.contains('paper-line'));

      const sampleLine = linesEl.querySelector('.paper-line');

      // FAST PATH: Nếu cấu trúc 23 dòng còn nguyên và không dòng nào vượt chiều rộng lề,
      // cập nhật dữ liệu tại chỗ mà KHÔNG xóa DOM hay reset con trỏ (loại bỏ hoàn toàn giật cục khi gõ, đặc biệt trong khung code)
      if (isDomStructureIntact) {
        let needsReflow = false;
        for (let i = 0; i < this.LINES_PER_PAGE; i++) {
          const row = domChildren[i];
          const text = (row.textContent || '').replace(/\r?\n/g, '');
          const type = row.classList.contains('is-heading')
            ? 'heading'
            : (row.classList.contains('is-code') ? 'code' : 'normal');
          if (this._exceedsLineLimit(text, sampleLine, type)) {
            needsReflow = true;
            break;
          }
        }

        if (!needsReflow) {
          for (let i = 0; i < this.LINES_PER_PAGE; i++) {
            const row = domChildren[i];
            row.dataset.side = side;
            row.dataset.lineIdx = String(i);
            const text = (row.textContent || '').replace(/\r?\n/g, '');
            const cleanHtml = this._sanitizeLineHtml(row.innerHTML);
            const type = row.classList.contains('is-heading')
              ? 'heading'
              : (row.classList.contains('is-code') ? 'code' : 'normal');

            pageData.lines[i] = text;
            pageData.richLines[i] = this._hasRichFormatting(cleanHtml) ? cleanHtml : '';
            pageData.lineTypes[i] = type;
            pageData.colonIndents[i] = row.dataset.colonIndent || '';
            if (!text) {
              pageData.softWraps[i] = false;
            }
          }
          this._updateCodeBlockClasses(side);
          return;
        }
      }

      // FULL RECONCILE PATH: Chỉ chạy khi có dòng vượt quá mép phải cần tự động xuống dòng hoặc khi bôi đen xóa nhiều dòng
      const activeRowBefore = this._getActiveLineElement(side);
      let targetLineIdx = activeRowBefore
        ? parseInt(activeRowBefore.dataset.lineIdx || '0', 10)
        : (focusHintIdx ?? this.activeLineIdx);
      let targetCursor = activeRowBefore ? this._getCaretOffsetInLine(activeRowBefore) : 0;

      const rawBlocks = [];
      let domRowIdx = 0;
      domChildren.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('paper-line')) {
          const origIdx = parseInt(node.dataset.lineIdx ?? String(domRowIdx), 10);
          rawBlocks.push({
            text: (node.textContent || '').replace(/\r?\n/g, ''),
            html: this._sanitizeLineHtml(node.innerHTML),
            type: node.classList.contains('is-heading')
              ? 'heading'
              : (node.classList.contains('is-code') ? 'code' : 'normal'),
            colonIndent: node.dataset.colonIndent || '',
            isSoftWrap: Boolean(pageData.softWraps?.[origIdx]),
            justAutoIndented: node.dataset.justAutoIndented || '',
            autoIndentedNum: node.dataset.autoIndentedNum || '',
            autoIndentedDash: node.dataset.autoIndentedDash || ''
          });
          domRowIdx++;
        } else if (node.nodeType === Node.TEXT_NODE) {
          const txt = node.textContent.replace(/\r?\n/g, '');
          if (txt) {
            rawBlocks.push({
              text: txt,
              html: this._escapeHtml(txt),
              type: 'normal',
              colonIndent: '',
              isSoftWrap: false
            });
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const txt = (node.textContent || '').replace(/\r?\n/g, '');
          rawBlocks.push({
            text: txt,
            html: this._sanitizeLineHtml(node.innerHTML),
            type: 'normal',
            colonIndent: '',
            isSoftWrap: false
          });
        }
      });

      while (rawBlocks.length < this.LINES_PER_PAGE) {
        rawBlocks.push({ text: '', html: '', type: 'normal', colonIndent: '', isSoftWrap: false });
      }

      const wrappedBlocks = [];
      const softWrapFlags = [];

      for (let i = 0; i < rawBlocks.length; i++) {
        let blk = { ...rawBlocks[i] };
        const prevEmitted = wrappedBlocks[wrappedBlocks.length - 1];
        let currentIsSoft =
          Boolean(blk.isSoftWrap) &&
          wrappedBlocks.length > 0 &&
          prevEmitted &&
          prevEmitted.type === blk.type &&
          prevEmitted.text.trim() !== '' &&
          blk.text.trim() !== '';

        while (this._exceedsLineLimit(blk.text, sampleLine, blk.type)) {
          const text = blk.text;
          const splitIdx = this._findWrapSplitIndex(text, sampleLine, blk.type);

          let keepText = '';
          let overflowText = '';
          let keepHtml = '';
          let overflowHtml = '';
          let consumeGap = 0;

          if (splitIdx > 0) {
            keepText = text.slice(0, splitIdx);
            overflowText = text.slice(splitIdx + 1);
            keepHtml = this._sliceHtmlByTextRange(blk.html || this._escapeHtml(text), 0, splitIdx);
            overflowHtml = this._sliceHtmlByTextRange(blk.html || this._escapeHtml(text), splitIdx + 1, text.length);
            consumeGap = 1;
          } else {
            const cut = this._findHardCutIndex(text, sampleLine, blk.type);
            keepText = text.slice(0, cut);
            overflowText = text.slice(cut);
            keepHtml = this._sliceHtmlByTextRange(blk.html || this._escapeHtml(text), 0, cut);
            overflowHtml = this._sliceHtmlByTextRange(blk.html || this._escapeHtml(text), cut, text.length);
          }

          const curOutIdx = wrappedBlocks.length;
          wrappedBlocks.push({
            text: keepText,
            html: keepHtml,
            type: blk.type,
            colonIndent: blk.colonIndent,
            justAutoIndented: blk.justAutoIndented,
            autoIndentedNum: blk.autoIndentedNum,
            autoIndentedDash: blk.autoIndentedDash
          });
          softWrapFlags.push(currentIsSoft);

          const inheritedIndent = blk.type === 'code'
            ? (keepText.match(/^ */)?.[0] || '')
            : this._getNextLineColonIndent(keepText, sampleLine, blk.colonIndent);

          if (curOutIdx === targetLineIdx && targetCursor >= splitIdx && splitIdx > 0) {
            targetLineIdx = curOutIdx + 1;
            targetCursor = Math.max(0, targetCursor - (splitIdx + consumeGap)) + inheritedIndent.length;
          } else if (curOutIdx === targetLineIdx && splitIdx <= 0 && targetCursor >= keepText.length) {
            targetLineIdx = curOutIdx + 1;
            targetCursor = Math.max(0, targetCursor - keepText.length) + inheritedIndent.length;
          }

          blk = {
            text: inheritedIndent + overflowText,
            html: (inheritedIndent ? this._escapeHtml(inheritedIndent) : '') + overflowHtml,
            type: blk.type,
            colonIndent: blk.type === 'code' ? '' : inheritedIndent
          };
          currentIsSoft = true;
        }

        wrappedBlocks.push(blk);
        softWrapFlags.push(blk.text ? currentIsSoft : false);
      }

      const pageBlocks = wrappedBlocks.slice(0, this.LINES_PER_PAGE);
      const overflowBlocks = wrappedBlocks.slice(this.LINES_PER_PAGE).filter(b => b.text.length > 0);

      linesEl.innerHTML = '';
      for (let i = 0; i < this.LINES_PER_PAGE; i++) {
        const b = pageBlocks[i] || { text: '', html: '', type: 'normal', colonIndent: '' };
        pageData.lines[i] = b.text;
        pageData.richLines[i] = this._hasRichFormatting(b.html) ? b.html : '';
        pageData.lineTypes[i] = b.type;
        pageData.colonIndents[i] = b.colonIndent || '';
        pageData.softWraps[i] = Boolean(softWrapFlags[i]);

        const row = this._createPaperLineElement(side, i, pageData);
        if (b.justAutoIndented) row.dataset.justAutoIndented = b.justAutoIndented;
        if (b.autoIndentedNum) row.dataset.autoIndentedNum = b.autoIndentedNum;
        if (b.autoIndentedDash) row.dataset.autoIndentedDash = b.autoIndentedDash;
        linesEl.appendChild(row);
      }
      this._updateCodeBlockClasses(side);

      if (overflowBlocks.length > 0) {
        const spill = overflowBlocks[0];
        if (side === 'left') {
          const rightIdx = this.spreadIndex + 1;
          const rightPage = this.pages[rightIdx];
          rightPage.lines[0] = spill.text + (rightPage.lines[0] ? ' ' + rightPage.lines[0] : '');
          rightPage.lineTypes[0] = spill.type;
          rightPage.softWraps[0] = false;
          if (spill.html && this._hasRichFormatting(spill.html)) {
            rightPage.richLines[0] = spill.html;
          }
          this.markPageDirty(rightIdx);
          this._renderSide('right', rightIdx);
          const rightFirst = document.querySelector('#rightLines .paper-line');
          if (rightFirst) {
            this.setActiveSide('right');
            this.activeLineIdx = 0;
            this._setCaretOffsetInLine(rightFirst, Math.min(targetCursor, spill.text.length));
          }
        } else {
          if (this.spreadIndex + 2 >= this.pages.length) {
            this.pages.push(this._createBlankPage(), this._createBlankPage());
            this.markPageDirty(this.pages.length - 2);
            this.markPageDirty(this.pages.length - 1);
          }
          this.spreadIndex += 2;
          this.activeSide = 'left';
          const nextLeft = this.pages[this.spreadIndex];
          nextLeft.lines[0] = spill.text + (nextLeft.lines[0] ? ' ' + nextLeft.lines[0] : '');
          nextLeft.lineTypes[0] = spill.type;
          nextLeft.softWraps[0] = false;
          if (spill.html && this._hasRichFormatting(spill.html)) {
            nextLeft.richLines[0] = spill.html;
          }
          this.markPageDirty(this.spreadIndex);
          this.renderSpread();
          const firstRow = document.querySelector('#leftLines .paper-line');
          if (firstRow) {
            this._setCaretOffsetInLine(firstRow, Math.min(targetCursor, spill.text.length));
          }
        }
      } else {
        const rows = linesEl.querySelectorAll('.paper-line');
        const safeIdx = Math.max(0, Math.min(this.LINES_PER_PAGE - 1, targetLineIdx));
        const targetRow = rows[safeIdx];
        if (targetRow) {
          this.activeLineIdx = safeIdx;
          this.activeFocusEl = targetRow;
          this._setCaretOffsetInLine(targetRow, targetCursor);
        }
      }
    } finally {
      this.isWrapping = false;
      this.scheduleSave(side);
      this.ensureCursorInComfortZone();
    }
  },

  /* ================= DYNAMIC REFLOW ON FONT SWITCH ================= */
  _reflowPagesForCurrentFont() {
    const sampleLine = document.querySelector('#leftLines .paper-line') || document.querySelector('.paper-line');

    [this.spreadIndex, this.spreadIndex + 1].forEach(pIdx => {
      const pageData = this.pages[pIdx];
      if (!pageData) return;

      const paragraphs = [];
      let curPara = null;

      for (let i = 0; i < this.LINES_PER_PAGE; i++) {
        const text = pageData.lines[i] || '';
        const rich = pageData.richLines?.[i] || '';
        const type = pageData.lineTypes?.[i] || 'normal';
        const isSoft = Boolean(pageData.softWraps?.[i]);

        // Chỉ nối lại các dòng thực sự là phần ngắt mềm của CÙNG MỘT đoạn và CÙNG KIỂU (không bao giờ gộp dòng thường vào Heading)
        if (
          isSoft &&
          curPara &&
          curPara.type === type &&
          curPara.text.trim() !== '' &&
          text.trim() !== ''
        ) {
          const indent = pageData.colonIndents?.[i] || '';
          const strippedText = indent && text.startsWith(indent) ? text.slice(indent.length) : text;
          curPara.text += ' ' + strippedText.trimStart();
          curPara.rich = '';
        } else {
          if (curPara) paragraphs.push(curPara);
          curPara = {
            text,
            rich,
            type,
            colonIndent: pageData.colonIndents?.[i] || ''
          };
        }
      }
      if (curPara) paragraphs.push(curPara);

      const nextLines = Array(this.LINES_PER_PAGE).fill('');
      const nextRich = Array(this.LINES_PER_PAGE).fill('');
      const nextTypes = Array(this.LINES_PER_PAGE).fill('normal');
      const nextIndents = Array(this.LINES_PER_PAGE).fill('');
      const nextSoft = Array(this.LINES_PER_PAGE).fill(false);

      let outIdx = 0;
      for (const para of paragraphs) {
        if (outIdx >= this.LINES_PER_PAGE) break;
        if (!para.text) {
          nextTypes[outIdx] = para.type;
          nextSoft[outIdx] = false;
          outIdx++;
          continue;
        }

        let rem = para.text;
        let firstChunk = true;
        const colonIndent = para.type === 'code'
          ? (para.text.match(/^ */)?.[0] || '')
          : this._getNextLineColonIndent(para.text, sampleLine, para.colonIndent);

        while (rem.length > 0 && outIdx < this.LINES_PER_PAGE) {
          if (!this._exceedsLineLimit(rem, sampleLine, para.type)) {
            nextLines[outIdx] = rem;
            if (firstChunk && para.rich) nextRich[outIdx] = para.rich;
            nextTypes[outIdx] = para.type;
            nextIndents[outIdx] = firstChunk ? para.colonIndent : (para.type === 'code' ? '' : colonIndent);
            nextSoft[outIdx] = !firstChunk;
            outIdx++;
            break;
          }

          const splitIdx = this._findWrapSplitIndex(rem, sampleLine, para.type);
          let keep = '';
          if (splitIdx > 0) {
            keep = rem.slice(0, splitIdx);
            rem = colonIndent + rem.slice(splitIdx + 1);
          } else {
            const cut = this._findHardCutIndex(rem, sampleLine, para.type);
            keep = rem.slice(0, cut);
            rem = colonIndent + rem.slice(cut);
          }

          nextLines[outIdx] = keep;
          nextTypes[outIdx] = para.type;
          nextIndents[outIdx] = firstChunk ? para.colonIndent : (para.type === 'code' ? '' : colonIndent);
          nextSoft[outIdx] = !firstChunk;
          outIdx++;
          firstChunk = false;
        }
      }

      pageData.lines = nextLines;
      pageData.richLines = nextRich;
      pageData.lineTypes = nextTypes;
      pageData.colonIndents = nextIndents;
      pageData.softWraps = nextSoft;
      this.markPageDirty(pIdx);
    });
  },

  /* ================= LAZY RENDERING FOR OVERVIEW GRID (CTRL + G) ================= */
  toggleOverview(forceState = null) {
    const next = forceState !== null ? forceState : !this.isOverview;
    if (next === this.isOverview) return;

    if (next) {
      this.saveNow();
      document.activeElement?.blur();
      this.isOverview = true;
      document.body.classList.add('overview-mode');
      document.getElementById('btnOverviewGrid')?.classList.add('active');
      this.renderOverviewGrid();
    } else {
      if (this._overviewObserver) {
        this._overviewObserver.disconnect();
        this._overviewObserver = null;
      }
      this._hydratedOverviewQueue = [];
      this.isOverview = false;
      document.body.classList.remove('overview-mode');
      document.getElementById('btnOverviewGrid')?.classList.remove('active');
      this.renderSpread();
    }
    this._updateNavigationUI();
  },

  renderOverviewGrid() {
    if (!this.overviewGrid) return;
    this._ensureEvenPageCount();

    if (this._overviewObserver) {
      this._overviewObserver.disconnect();
      this._overviewObserver = null;
    }
    this._hydratedOverviewQueue = [];
    this.overviewGrid.innerHTML = '';

    this.pages.forEach((pageData, pageIdx) => {
      const card = document.createElement('article');
      const isCurrentSpread = pageIdx === this.spreadIndex || pageIdx === this.spreadIndex + 1;
      card.className = 'overview-card' + (isCurrentSpread ? ' is-current-spread' : '');
      card.dataset.pageIdx = String(pageIdx);
      card.dataset.hydrated = '0';
      card.title = `Bấm để mở Trang ${pageIdx + 1}`;

      card.addEventListener('click', () => {
        this.spreadIndex = Math.floor(pageIdx / 2) * 2;
        this.activeSide = pageIdx % 2 === 0 ? 'left' : 'right';
        this.activeLineIdx = 0;
        this.toggleOverview(false);
        setTimeout(() => {
          const firstLine = document.querySelector(`#${this.activeSide}Lines .paper-line`);
          if (firstLine) this._setCaretOffsetInLine(firstLine, 0);
        }, 25);
      });

      const stage = document.createElement('div');
      stage.className = 'overview-page-stage';
      stage.innerHTML = `<div class="overview-skeleton-placeholder">Trang ${pageIdx + 1}</div>`;

      const footer = document.createElement('div');
      footer.className = 'overview-card-footer';
      const firstNonEmpty = pageData.lines.find(l => l && l.trim()) || '';
      const displayLabel = (pageData.title || '').trim() || firstNonEmpty || 'Trang trống';
      footer.innerHTML = `
        <span class="overview-card-title"></span>
        <span class="overview-card-page-tag">Page ${pageIdx + 1}</span>
      `;
      footer.querySelector('.overview-card-title').textContent = displayLabel;

      card.appendChild(stage);
      card.appendChild(footer);
      this.overviewGrid.appendChild(card);
    });

    this._setupOverviewLazyObserver();
    requestAnimationFrame(() => this._rescaleOverviewCards());
  },

  _setupOverviewLazyObserver() {
    if (!this.overviewViewport || !this.overviewGrid) return;

    if (!('IntersectionObserver' in window)) {
      this.overviewGrid.querySelectorAll('.overview-card').forEach(card => {
        this._hydrateOverviewCard(card, parseInt(card.dataset.pageIdx, 10));
      });
      return;
    }

    this._overviewObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const card = entry.target;
          const pageIdx = parseInt(card.dataset.pageIdx, 10);
          if (card.dataset.hydrated !== '1') {
            this._hydrateOverviewCard(card, pageIdx);
          }
        });
      },
      {
        root: this.overviewViewport,
        rootMargin: '400px 0px',
        threshold: 0.01
      }
    );

    this.overviewGrid.querySelectorAll('.overview-card').forEach(card => {
      this._overviewObserver.observe(card);
    });
  },

  _hydrateOverviewCard(card, pageIdx) {
    if (!card || card.dataset.hydrated === '1') return;
    const pageData = this.pages[pageIdx];
    const stage = card.querySelector('.overview-page-stage');
    if (!pageData || !stage) return;

    const activeQuery = (document.getElementById('searchInput')?.value || '').trim().toLowerCase();

    const miniPage = document.createElement('div');
    miniPage.className = 'notebook-page overview-page-mini';

    const header = document.createElement('div');
    header.className = 'page-header';

    const titleSpan = document.createElement('div');
    titleSpan.className = 'page-header-input page-title-input';
    titleSpan.textContent = pageData.title || '';

    const dateSpan = document.createElement('div');
    dateSpan.className = 'page-header-input page-date-input';
    dateSpan.textContent = pageData.date || '';

    header.appendChild(titleSpan);
    header.appendChild(dateSpan);

    const linesWrap = document.createElement('div');
    linesWrap.className = 'page-lines';
    const types = Array.isArray(pageData.lineTypes) ? pageData.lineTypes : [];

    for (let i = 0; i < this.LINES_PER_PAGE; i++) {
      const lineText = pageData.lines[i] || '';
      const richHtml = pageData.richLines?.[i] || '';
      const curType = types[i] || 'normal';
      const prevType = i > 0 ? (types[i - 1] || 'normal') : 'normal';
      const nextType = i < this.LINES_PER_PAGE - 1 ? (types[i + 1] || 'normal') : 'normal';
      const isHit = activeQuery && lineText.toLowerCase().includes(activeQuery);

      const row = document.createElement('div');
      row.className =
        'paper-line' +
        (curType === 'heading' ? ' is-heading' : '') +
        (curType === 'code'
          ? ' is-code' +
            (prevType !== 'code' ? ' code-start' : '') +
            (nextType !== 'code' ? ' code-end' : '')
          : '') +
        (isHit ? ' search-hit' : '');

      const textDiv = document.createElement('div');
      textDiv.className = 'overview-mini-text';
      if (richHtml && this._hasRichFormatting(richHtml)) {
        textDiv.innerHTML = this._sanitizeLineHtml(richHtml);
      } else {
        textDiv.textContent = lineText;
      }

      row.appendChild(textDiv);
      linesWrap.appendChild(row);
    }

    const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgEl.setAttribute('class', 'page-svg-layer');

    const imagesEl = document.createElement('div');
    imagesEl.className = 'page-images-layer';

    const tablesEl = document.createElement('div');
    tablesEl.className = 'page-tables-layer';

    const freeTextsEl = document.createElement('div');
    freeTextsEl.className = 'page-freetext-layer';

    const badgeNum = document.createElement('span');
    badgeNum.className = 'page-badge-num';
    badgeNum.style.left = pageIdx % 2 === 0 ? '18px' : 'auto';
    badgeNum.style.right = pageIdx % 2 === 1 ? '18px' : 'auto';
    badgeNum.textContent = String(pageIdx + 1);

    miniPage.appendChild(header);
    miniPage.appendChild(linesWrap);
    miniPage.appendChild(svgEl);
    miniPage.appendChild(imagesEl);
    miniPage.appendChild(tablesEl);
    miniPage.appendChild(freeTextsEl);
    miniPage.appendChild(badgeNum);

    stage.innerHTML = '';
    stage.appendChild(miniPage);
    card.dataset.hydrated = '1';

    const ovSideId = `ov_${pageIdx}`;
    NotebookCanvas.renderShapes(svgEl, pageData.shapes || [], ovSideId);
    if (typeof NotebookCanvas.renderImages === 'function') {
      NotebookCanvas.renderImages(imagesEl, pageData.images || [], ovSideId);
    }
    NotebookCanvas.renderTables(tablesEl, pageData.tables || [], ovSideId);
    if (typeof NotebookCanvas.renderFreeTexts === 'function') {
      NotebookCanvas.renderFreeTexts(freeTextsEl, pageData.freeTexts || [], ovSideId);
    }

    this._hydratedOverviewQueue.push(card);
    if (this._hydratedOverviewQueue.length > this.MAX_HYDRATED_OVERVIEW) {
      const oldestCard = this._hydratedOverviewQueue.shift();
      if (oldestCard && oldestCard !== card && oldestCard.dataset.hydrated === '1') {
        const oldStage = oldestCard.querySelector('.overview-page-stage');
        const oldIdx = parseInt(oldestCard.dataset.pageIdx || '0', 10);
        if (oldStage) {
          oldStage.innerHTML = `<div class="overview-skeleton-placeholder">Trang ${oldIdx + 1}</div>`;
          oldestCard.dataset.hydrated = '0';
        }
      }
    }
  },

  _rescaleOverviewCards() {
    if (!this.isOverview || !this.overviewGrid) return;
    const firstStage = this.overviewGrid.querySelector('.overview-page-stage');
    if (!firstStage) return;
    const w = firstStage.clientWidth;
    if (w > 0) {
      this.overviewGrid.style.setProperty('--ov-scale', String(w / 560));
    }
  },

  /* ================= AUTO INDENT HELPERS (1., - , :) ================= */
  _syncColonIndentState(pageData, lineIdx, rowEl) {
    const text = rowEl.textContent || '';
    if (text.trim().length > 0) {
      delete rowEl.dataset.justAutoIndented;
    }

    const savedIndent = rowEl.dataset.colonIndent || pageData?.colonIndents?.[lineIdx] || '';
    if (savedIndent && !text.startsWith(savedIndent)) {
      delete rowEl.dataset.colonIndent;
      delete rowEl.dataset.justAutoIndented;
      if (pageData?.colonIndents) {
        pageData.colonIndents[lineIdx] = '';
      }
    }
  },

  _applyAutoPrefixIndent(rowEl, isDelete = false) {
    const val = rowEl.textContent || '';
    if (!val.trim()) {
      delete rowEl.dataset.autoIndentedNum;
      delete rowEl.dataset.autoIndentedDash;
      return;
    }
    if (isDelete) return;

    const cursor = this._getCaretOffsetInLine(rowEl);
    if (cursor !== val.length) return;

    const numMatch = val.match(/^(\s*)(\d+\.)$/);
    if (numMatch && !rowEl.dataset.autoIndentedNum) {
      rowEl.dataset.autoIndentedNum = '1';
      const twoTabs = this.TAB_SPACES + this.TAB_SPACES;
      rowEl.textContent = twoTabs + val;
      this._setCaretOffsetInLine(rowEl, rowEl.textContent.length);
      return;
    }

    const dashMatch = val.match(/^(\s*)(-\s)$/);
    if (dashMatch && !rowEl.dataset.autoIndentedDash && dashMatch[1].length !== this.TAB_SPACES.length) {
      rowEl.dataset.autoIndentedDash = '1';
      rowEl.textContent = this.TAB_SPACES + val;
      this._setCaretOffsetInLine(rowEl, rowEl.textContent.length);
    }
  },

  _getColonIndentSpaces(lineText, refLineEl) {
    if (!lineText) return '';
    const colonIdx = lineText.indexOf(':');
    if (colonIdx === -1) return '';
    if (lineText.slice(colonIdx, colonIdx + 3) === '://') return '';

    const prefixWithColonAndSpace = lineText.slice(0, colonIdx + 1) + ' ';
    const targetWidth = this._getTextWidth(prefixWithColonAndSpace, refLineEl);
    const spaceWidth = Math.max(1, this._getTextWidth(' ', refLineEl));
    const maxIndentW = Math.max(80, ((refLineEl?.clientWidth || 560) - 80) * 0.72);

    const count = Math.max(1, Math.round(Math.min(targetWidth, maxIndentW) / spaceWidth));
    return ' '.repeat(count);
  },

  _getNextLineColonIndent(lineText, refLineEl, inheritedIndent = '') {
    const directColonIndent = this._getColonIndentSpaces(lineText, refLineEl);
    if (directColonIndent) return directColonIndent;

    if (inheritedIndent && lineText.startsWith(inheritedIndent)) {
      return inheritedIndent;
    }
    return '';
  },

  _applyIndentToLine(pageData, lineIdx, rowEl, indentStr) {
    if (!rowEl || !indentStr) return;
    if (!Array.isArray(pageData.colonIndents)) {
      pageData.colonIndents = this._normalizeColonIndents();
    }
    rowEl.textContent = indentStr;
    pageData.lines[lineIdx] = indentStr;
    pageData.colonIndents[lineIdx] = indentStr;
    rowEl.dataset.colonIndent = indentStr;
    rowEl.dataset.justAutoIndented = '1';
    this._setCaretOffsetInLine(rowEl, indentStr.length);
  },

  _bindPageSmartClick(side) {
    const pageEl = document.getElementById(`${side}Page`);
    if (!pageEl) return;

    pageEl.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      const pageRect = pageEl.getBoundingClientRect();
      const scale = this.getZoomScale();
      this.lastClickPoint = {
        side,
        x: Math.round((e.clientX - pageRect.left) / scale),
        y: Math.round((e.clientY - pageRect.top) / scale)
      };
    });
  },

  _getTextWidth(text, refEl = null, forceType = null) {
    const handFont =
      getComputedStyle(document.documentElement).getPropertyValue('--font-hand').trim() ||
      "'Mali', 'Patrick Hand', cursive";

    if (forceType === 'code') {
      this.ruler.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
      this.ruler.style.fontSize = '13.5px';
      this.ruler.style.fontWeight = '500';
      this.ruler.style.fontStyle = 'normal';
      this.ruler.style.letterSpacing = '0px';
    } else if (forceType === 'heading') {
      this.ruler.style.fontFamily = handFont;
      this.ruler.style.fontSize = '19px';
      this.ruler.style.fontWeight = '800';
      this.ruler.style.fontStyle = 'normal';
      this.ruler.style.letterSpacing = '0.25px';
    } else if (refEl && !refEl.classList.contains('is-heading') && !refEl.classList.contains('is-code')) {
      const cs = window.getComputedStyle(refEl);
      this.ruler.style.fontFamily = cs.fontFamily;
      this.ruler.style.fontSize = cs.fontSize;
      this.ruler.style.fontWeight = cs.fontWeight;
      this.ruler.style.fontStyle = cs.fontStyle;
      this.ruler.style.letterSpacing = cs.letterSpacing;
    } else {
      this.ruler.style.fontFamily = handFont;
      this.ruler.style.fontSize = '15.5px';
      this.ruler.style.fontWeight = '400';
      this.ruler.style.fontStyle = 'normal';
      this.ruler.style.letterSpacing = '0.15px';
    }
    this.ruler.textContent = text;
    return this.ruler.getBoundingClientRect().width;
  },

  _getAvailableLineWidth(refEl, lineType = 'normal') {
    const pageW = refEl?.closest?.('.notebook-page')?.clientWidth || 560;
    // Normal/Heading: padding-left 58px + padding-right 22px = 80px
    // Code: margin-left 49px + margin-right 18px + padding-left 10px + padding-right 12px = 89px
    const horizontalInset = lineType === 'code' ? 89 : 80;
    return Math.max(160, pageW - horizontalInset - 4);
  },

  _exceedsLineLimit(text, refEl, lineType = 'normal') {
    if (!text) return false;
    const maxW = this._getAvailableLineWidth(refEl, lineType);
    return this._getTextWidth(text, refEl, lineType) > maxW;
  },

  _handleUnifiedLinesKeydown(e, side) {
    const linesEl = document.getElementById(`${side}Lines`);
    const pageData = this.pages[this.getPageIndex(side)];
    if (!linesEl || !pageData) return;

    const rows = Array.from(linesEl.querySelectorAll('.paper-line'));
    const activeRow = this._getActiveLineElement(side);
    const lineIdx = activeRow ? parseInt(activeRow.dataset.lineIdx || '0', 10) : this.activeLineIdx;
    const curType = pageData.lineTypes?.[lineIdx] || 'normal';
    const sel = window.getSelection();

    // Định dạng cục bộ trong dòng: Ctrl+I (nghiêng), Ctrl+U (gạch chân), Ctrl+Shift+B (đậm), Ctrl+M (tô sáng)
    if (e.ctrlKey && !e.altKey && !e.metaKey) {
      const k = e.key.toLowerCase();
      if (k === 'i') {
        e.preventDefault();
        this.applyInlineFormat('italic');
        return;
      }
      if (k === 'u') {
        e.preventDefault();
        this.applyInlineFormat('underline');
        return;
      }
      if (k === 'b' && e.shiftKey) {
        e.preventDefault();
        this.applyInlineFormat('bold');
        return;
      }
      if (k === 'm') {
        e.preventDefault();
        this.applyInlineFormat('highlight');
        return;
      }
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      if (!activeRow) return;
      const caret = this._getCaretOffsetInLine(activeRow);
      const text = activeRow.textContent || '';

      if (e.shiftKey) {
        const leadingMatch = text.match(/^ {1,4}/);
        if (leadingMatch) {
          const removeLen = leadingMatch[0].length;
          activeRow.innerHTML = this._sliceHtmlByTextRange(
            this._sanitizeLineHtml(activeRow.innerHTML) || this._escapeHtml(text),
            removeLen,
            text.length
          );
          this._syncColonIndentState(pageData, lineIdx, activeRow);
          this._setCaretOffsetInLine(activeRow, Math.max(0, caret - removeLen));
          this._reconcilePageLines(side, lineIdx);
        }
      } else {
        document.execCommand('insertText', false, this.TAB_SPACES);
        this._reconcilePageLines(side, lineIdx);
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (!activeRow) return;

      if (sel && !sel.isCollapsed) {
        sel.deleteFromDocument();
      }

      const fullText = activeRow.textContent || '';
      const fullHtml = this._sanitizeLineHtml(activeRow.innerHTML) || this._escapeHtml(fullText);
      const caret = this._getCaretOffsetInLine(activeRow);

      // Nếu đang ở dòng Code hoàn toàn trống và ấn Enter -> thoát khỏi khung Code về dòng thường ngay tại dòng đó
      if (curType === 'code' && fullText.trim() === '') {
        this.applyLineType(side, lineIdx, 'normal');
        activeRow.textContent = '';
        pageData.lines[lineIdx] = '';
        pageData.richLines[lineIdx] = '';
        pageData.softWraps[lineIdx] = false;
        this._setCaretOffsetInLine(activeRow, 0);
        this._syncToolbarLineTypeState();
        this.scheduleSave(side);
        return;
      }

      const leftText = fullText.slice(0, caret);
      const rightText = fullText.slice(caret);
      const leftHtml = this._sliceHtmlByTextRange(fullHtml, 0, caret);
      const rightHtml = this._sliceHtmlByTextRange(fullHtml, caret, fullText.length);

      const codeLeadingSpaces = curType === 'code' ? (leftText.match(/^ */)?.[0] || '') : '';
      const inheritedIndent = curType === 'code'
        ? codeLeadingSpaces
        : this._getNextLineColonIndent(
            leftText,
            activeRow,
            activeRow.dataset.colonIndent || pageData.colonIndents?.[lineIdx] || ''
          );

      this._setLineRowContent(activeRow, leftText, leftHtml);
      pageData.lines[lineIdx] = leftText;
      pageData.richLines[lineIdx] = this._hasRichFormatting(leftHtml) ? leftHtml : '';
      // Giữ nguyên định dạng dòng hiện tại (nếu là Heading thì dòng A vẫn đậm nguyên vẹn)
      pageData.lineTypes[lineIdx] = curType;

      if (lineIdx + 1 < this.LINES_PER_PAGE) {
        for (let r = this.LINES_PER_PAGE - 1; r > lineIdx + 1; r--) {
          pageData.lines[r] = pageData.lines[r - 1];
          pageData.richLines[r] = pageData.richLines[r - 1];
          pageData.lineTypes[r] = pageData.lineTypes[r - 1];
          pageData.colonIndents[r] = pageData.colonIndents[r - 1];
          pageData.softWraps[r] = pageData.softWraps[r - 1];
        }

        const applyIndentOnNext = curType === 'code' ? true : (rightText.length === 0);
        const nextIndentStr = applyIndentOnNext ? inheritedIndent : '';
        const nextLineText = nextIndentStr + rightText;
        const nextLineHtml = (nextIndentStr ? this._escapeHtml(nextIndentStr) : '') + rightHtml;

        pageData.lines[lineIdx + 1] = nextLineText;
        pageData.richLines[lineIdx + 1] = this._hasRichFormatting(nextLineHtml) ? nextLineHtml : '';
        pageData.colonIndents[lineIdx + 1] = curType !== 'code' && rightText.length === 0 ? inheritedIndent : '';
        pageData.softWraps[lineIdx + 1] = false;

        // Heading chỉ áp dụng cho dòng được bấm, xuống dòng mới luôn là normal; riêng Code nối tiếp khối code
        pageData.lineTypes[lineIdx + 1] = curType === 'code' ? 'code' : 'normal';

        this._renderSide(side, this.getPageIndex(side));
        const nextRow = document.querySelectorAll(`#${side}Lines .paper-line`)[lineIdx + 1];
        if (nextRow) {
          if (curType !== 'code' && rightText.length === 0 && inheritedIndent) {
            nextRow.dataset.colonIndent = inheritedIndent;
            nextRow.dataset.justAutoIndented = '1';
          }
          this.activeLineIdx = lineIdx + 1;
          this.activeFocusEl = nextRow;
          this._setCaretOffsetInLine(nextRow, nextIndentStr.length);
        }
        this._syncToolbarLineTypeState();
        this.scheduleSave(side);
        this.ensureCursorInComfortZone();
      } else if (side === 'left') {
        const rightPage = this.pages[this.spreadIndex + 1];
        const nextText = (rightText.length === 0 ? inheritedIndent : '') + rightText;
        if (nextText) {
          rightPage.lines[0] = nextText + (rightPage.lines[0] ? ' ' + rightPage.lines[0] : '');
          rightPage.softWraps[0] = false;
          if (curType !== 'code' && rightText.length === 0 && inheritedIndent) {
            rightPage.colonIndents[0] = inheritedIndent;
          }
          this.markPageDirty(this.spreadIndex + 1);
          this._renderSide('right', this.spreadIndex + 1);
        }
        const rightFirst = document.querySelector('#rightLines .paper-line');
        if (rightFirst) {
          this.setActiveSide('right');
          this.activeLineIdx = 0;
          this._setCaretOffsetInLine(rightFirst, rightText.length === 0 ? inheritedIndent.length : 0);
        }
        this._syncToolbarLineTypeState();
        this.scheduleSave(side);
      } else {
        this.turnNextSpread();
        setTimeout(() => {
          const nextFirst = document.querySelector('#leftLines .paper-line');
          const nextLeftPage = this.pages[this.spreadIndex];
          if (nextFirst && nextLeftPage) {
            if (rightText) {
              nextLeftPage.lines[0] = rightText;
              nextFirst.textContent = rightText;
              this.markPageDirty(this.spreadIndex);
            } else if (curType !== 'code' && inheritedIndent && !nextLeftPage.lines[0]) {
              this._applyIndentToLine(nextLeftPage, 0, nextFirst, inheritedIndent);
            }
            this._setCaretOffsetInLine(nextFirst, rightText ? 0 : inheritedIndent.length);
            this._syncToolbarLineTypeState();
            this.scheduleSave('left');
          }
        }, 30);
      }
      return;
    }

    if (e.key === 'Backspace' && sel && sel.isCollapsed && activeRow) {
      const caret = this._getCaretOffsetInLine(activeRow);
      const text = activeRow.textContent || '';

      if (caret > 0) {
        const beforeCursor = text.slice(0, caret);
        const savedIndent = activeRow.dataset.colonIndent || pageData.colonIndents?.[lineIdx] || '';
        const isJustAutoIndented = activeRow.dataset.justAutoIndented === '1';
        const isAtColonIndentEnd = savedIndent && beforeCursor === savedIndent;

        if ((isJustAutoIndented || isAtColonIndentEnd) && beforeCursor.trim() === '') {
          e.preventDefault();
          const restText = text.slice(caret);
          const restHtml = this._sliceHtmlByTextRange(
            this._sanitizeLineHtml(activeRow.innerHTML) || this._escapeHtml(text),
            caret,
            text.length
          );
          this._setLineRowContent(activeRow, restText, restHtml);
          pageData.lines[lineIdx] = restText;
          pageData.richLines[lineIdx] = this._hasRichFormatting(restHtml) ? restHtml : '';
          pageData.colonIndents[lineIdx] = '';
          delete activeRow.dataset.colonIndent;
          delete activeRow.dataset.justAutoIndented;
          this._setCaretOffsetInLine(activeRow, 0);
          this.scheduleSave(side);
          return;
        }
      }

      if (caret === 0 && lineIdx > 0) {
        e.preventDefault();
        const prevRow = rows[lineIdx - 1];
        const prevText = prevRow.textContent || '';
        const prevHtml = this._sanitizeLineHtml(prevRow.innerHTML) || this._escapeHtml(prevText);
        const curHtml = this._sanitizeLineHtml(activeRow.innerHTML) || this._escapeHtml(text);
        const joinCursor = prevText.length;

        this._setLineRowContent(prevRow, prevText + text, prevHtml + curHtml);
        activeRow.innerHTML = '';

        for (let r = lineIdx; r < this.LINES_PER_PAGE - 1; r++) {
          rows[r].innerHTML = rows[r + 1].innerHTML;
          rows[r].className = rows[r + 1].className;
          rows[r].dataset.colonIndent = rows[r + 1].dataset.colonIndent || '';
          pageData.lineTypes[r] = pageData.lineTypes[r + 1];
          pageData.colonIndents[r] = pageData.colonIndents[r + 1];
          pageData.softWraps[r] = pageData.softWraps[r + 1];
        }
        rows[this.LINES_PER_PAGE - 1].innerHTML = '';
        rows[this.LINES_PER_PAGE - 1].className = 'paper-line';
        delete rows[this.LINES_PER_PAGE - 1].dataset.colonIndent;
        pageData.lineTypes[this.LINES_PER_PAGE - 1] = 'normal';
        pageData.colonIndents[this.LINES_PER_PAGE - 1] = '';
        pageData.softWraps[this.LINES_PER_PAGE - 1] = false;

        this._setCaretOffsetInLine(prevRow, joinCursor);
        this._reconcilePageLines(side, lineIdx - 1);
        this._syncToolbarLineTypeState();
      }
    }
  },

  insertBulletAtCursor() {
    if (this.isOverview) this.toggleOverview(false);
    NotebookCanvas.setTool('text');
    const side = this.activeSide;
    const rows = Array.from(document.querySelectorAll(`#${side}Lines .paper-line`));
    const target = rows[this.activeLineIdx] || rows[0];
    if (!target) return;

    const val = target.textContent || '';
    const html = this._sanitizeLineHtml(target.innerHTML) || this._escapeHtml(val);
    if (val.startsWith('• ')) {
      const nextHtml = this._sliceHtmlByTextRange(html, 2, val.length);
      this._setLineRowContent(target, val.slice(2), nextHtml);
      this._setCaretOffsetInLine(target, (target.textContent || '').length);
    } else {
      this._setLineRowContent(target, '• ' + val, '• ' + html);
      this._setCaretOffsetInLine(target, (target.textContent || '').length);
    }

    this._reconcilePageLines(side, this.activeLineIdx);
  },

  setLineMode(mode) {
    this.toggleLineType(mode);
  },

  toggleLineType(mode) {
    if (this.isOverview) this.toggleOverview(false);
    NotebookCanvas.setTool('text');

    const side = this.activeSide;
    const pageData = this.pages[this.getPageIndex(side)];
    if (!pageData) return;

    const targetIndices = this._getSelectedLineIndices(side);
    const allAlreadyMode = targetIndices.every(idx => (pageData.lineTypes?.[idx] || 'normal') === mode);
    const nextType = allAlreadyMode ? 'normal' : mode;

    const rows = Array.from(document.querySelectorAll(`#${side}Lines .paper-line`));
    const activeRow = rows[this.activeLineIdx];
    const savedCaret = activeRow ? this._getCaretOffsetInLine(activeRow) : 0;

    targetIndices.forEach(idx => {
      this.applyLineType(side, idx, nextType, false);
      if (pageData.softWraps) {
        pageData.softWraps[idx] = false;
      }
    });

    this._updateCodeBlockClasses(side);
    this._syncToolbarLineTypeState();

    // Nếu chuyển sang Heading (chữ to hơn 19px) làm dòng dài vượt lề phải, tự động ngắt dòng gọn gàng
    const needsWrap = targetIndices.some(idx => {
      const r = rows[idx];
      return r && this._exceedsLineLimit(r.textContent || '', r, nextType);
    });

    if (needsWrap) {
      this._reconcilePageLines(side, this.activeLineIdx);
    } else {
      if (activeRow) {
        this._setCaretOffsetInLine(activeRow, savedCaret);
      }
      this.scheduleSave(side);
    }
  },

  applyLineType(side, lineIdx, type, updateBlockClasses = true) {
    const pageData = this.pages[this.getPageIndex(side)];
    if (!pageData) return;
    if (!Array.isArray(pageData.lineTypes)) {
      pageData.lineTypes = this._normalizeLineTypes();
    }
    pageData.lineTypes[lineIdx] = type;

    const row = document.querySelector(`#${side}Lines .paper-line[data-line-idx="${lineIdx}"]`);
    if (row) {
      row.classList.toggle('is-heading', type === 'heading');
      row.classList.toggle('is-code', type === 'code');
      if (type !== 'code') {
        row.classList.remove('code-start', 'code-end');
      }
    }
    if (updateBlockClasses) {
      this._updateCodeBlockClasses(side);
      this.scheduleSave(side);
    }
  },

  insertQuickTable() {
    if (this.isOverview) this.toggleOverview(false);
    const side = this.activeSide;
    const pageData = this.pages[this.getPageIndex(side)];
    const yOffset = Math.min(640, 62 + this.activeLineIdx * 22);

    pageData.tables.push({
      id: 'tbl_' + Date.now().toString(36),
      x: 64,
      y: yOffset,
      rows: [
        ['Cột 1', 'Cột 2', 'Cột 3'],
        ['', '', ''],
        ['', '', '']
      ]
    });

    const tablesEl = document.getElementById(`${side}Tables`);
    NotebookCanvas.renderTables(tablesEl, pageData.tables, side);
    this.scheduleSave(side);
  },

  insertFreeText() {
    if (this.isOverview) this.toggleOverview(false);
    NotebookCanvas.setTool('text');
    const side = this.lastClickPoint?.side || this.activeSide;
    const pageData = this.pages[this.getPageIndex(side)];
    if (!Array.isArray(pageData.freeTexts)) pageData.freeTexts = [];

    const x = this.lastClickPoint?.side === side ? Math.min(410, Math.max(56, this.lastClickPoint.x)) : 90;
    const y = this.lastClickPoint?.side === side ? Math.min(760, Math.max(54, this.lastClickPoint.y)) : 140;
    const id = 'ft_' + Date.now().toString(36);

    pageData.freeTexts.push({ id, x, y, text: '' });
    const container = document.getElementById(`${side}FreeTexts`);
    if (typeof NotebookCanvas.renderFreeTexts === 'function') {
      NotebookCanvas.renderFreeTexts(container, pageData.freeTexts, side);
    }
    this.scheduleSave(side);

    const newEl = container?.querySelector(`[data-ft-id="${id}"]`);
    newEl?.focus();
  },

  removeFreeTextById(side, ftId) {
    const pageData = this.pages[this.getPageIndex(side)];
    pageData.freeTexts = (pageData.freeTexts || []).filter(item => item.id !== ftId);
    const container = document.getElementById(`${side}FreeTexts`);
    if (typeof NotebookCanvas.renderFreeTexts === 'function') {
      NotebookCanvas.renderFreeTexts(container, pageData.freeTexts, side);
    }
    this.scheduleSave(side);
  },

  /* ================= PASTE HANDLER (IMAGES + AUTO MATH FORMATTING) ================= */
  _blobToDataURL(blob) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  },

  async _processImageBlob(blob) {
    if (!blob) return null;
    if (window.electronAPI?.savePastedImage) {
      try {
        const arrayBuffer = await blob.arrayBuffer();
        const ext = blob.type === 'image/jpeg' ? 'jpg' : 'png';
        const fileUrl = await window.electronAPI.savePastedImage(arrayBuffer, ext);
        if (fileUrl) return fileUrl;
      } catch (err) {
        console.warn('savePastedImage lỗi, chuyển sang DataURL:', err);
      }
    }
    return await this._blobToDataURL(blob);
  },

  async pasteImageFromClipboard() {
    let fileUrl = null;

    if (window.electronAPI?.readClipboardImage) {
      try {
        fileUrl = await window.electronAPI.readClipboardImage();
      } catch (err) {
        console.warn('readClipboardImage lỗi:', err);
      }
    }

    if (!fileUrl && navigator.clipboard?.read) {
      try {
        const clipItems = await navigator.clipboard.read();
        for (const clipItem of clipItems) {
          const imgType = clipItem.types.find(t => t.startsWith('image/'));
          if (imgType) {
            const blob = await clipItem.getType(imgType);
            fileUrl = await this._processImageBlob(blob);
            break;
          }
        }
      } catch (err) {
        console.warn('navigator.clipboard.read bị chặn:', err);
      }
    }

    if (fileUrl) {
      this.addImageToPage(fileUrl);
    }
  },

  _insertFormattedMathIntoTarget(targetEl, text) {
    if (!targetEl || !text) return false;

    const lineRow = targetEl.closest?.('.paper-line') || (targetEl.classList?.contains('page-lines') ? this._getActiveLineElement(this.activeSide) : null);
    if (lineRow) {
      const side = lineRow.dataset.side || this.activeSide;
      const startLineIdx = parseInt(lineRow.dataset.lineIdx ?? this.activeLineIdx, 10);
      const rawLines = text.split(/\r?\n/).map(l => l.trimEnd());
      while (rawLines.length > 1 && rawLines[rawLines.length - 1] === '') rawLines.pop();

      const fullText = lineRow.textContent || '';
      const caret = this._getCaretOffsetInLine(lineRow);
      const before = fullText.slice(0, caret);
      const after = fullText.slice(caret);

      if (rawLines.length <= 1) {
        const single = rawLines[0] || '';
        lineRow.textContent = before + single + after;
        this._setCaretOffsetInLine(lineRow, before.length + single.length);
        this._reconcilePageLines(side, startLineIdx);
        return true;
      }

      const rows = Array.from(document.querySelectorAll(`#${side}Lines .paper-line`));
      const pageData = this.pages[this.getPageIndex(side)];
      const baseType = pageData.lineTypes?.[startLineIdx] || 'normal';

      lineRow.textContent = before + rawLines[0];
      pageData.lines[startLineIdx] = lineRow.textContent;

      let lastIdx = startLineIdx;
      for (let k = 1; k < rawLines.length; k++) {
        const nextIdx = startLineIdx + k;
        if (nextIdx >= this.LINES_PER_PAGE) break;
        const isLastChunk = k === rawLines.length - 1;
        const chunk = rawLines[k] + (isLastChunk ? after : '');
        if (rows[nextIdx]) {
          rows[nextIdx].textContent = chunk;
          if (baseType === 'code') {
            rows[nextIdx].classList.add('is-code');
          }
        }
        pageData.lines[nextIdx] = chunk;
        if (baseType === 'code') {
          pageData.lineTypes[nextIdx] = 'code';
        }
        pageData.softWraps[nextIdx] = false;
        lastIdx = nextIdx;
      }
      this._updateCodeBlockClasses(side);

      if (rows[lastIdx]) {
        const pos = rows[lastIdx].textContent.length - after.length;
        this._setCaretOffsetInLine(rows[lastIdx], Math.max(0, pos));
        this._reconcilePageLines(side, lastIdx);
      } else {
        this.scheduleSave(side);
      }
      return true;
    }

    if (targetEl.matches('input[type="text"], textarea')) {
      const singleLine = text.replace(/\r?\n+/g, ' ');
      const start = targetEl.selectionStart ?? targetEl.value.length;
      const end = targetEl.selectionEnd ?? start;
      targetEl.value = targetEl.value.slice(0, start) + singleLine + targetEl.value.slice(end);
      const pos = start + singleLine.length;
      targetEl.setSelectionRange(pos, pos);
      targetEl.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    }

    if (targetEl.isContentEditable) {
      document.execCommand('insertText', false, text);
      return true;
    }

    return false;
  },

  _bindPasteHandler() {
    window.addEventListener('paste', async (e) => {
      if (NotebookSketchModal.isOpen()) return;

      let fileUrl = null;
      const items = e.clipboardData?.items;

      if (items) {
        for (const item of items) {
          if (item.type.startsWith('image/')) {
            e.preventDefault();
            fileUrl = await this._processImageBlob(item.getAsFile());
            break;
          }
        }
      }

      if (!fileUrl && window.electronAPI?.readClipboardImage) {
        const fallbackUrl = await window.electronAPI.readClipboardImage();
        if (fallbackUrl) {
          e.preventDefault();
          fileUrl = fallbackUrl;
        }
      }

      if (fileUrl) {
        this.addImageToPage(fileUrl);
        return;
      }

      const activeEl = document.activeElement;
      const isEditableTarget =
        activeEl &&
        (activeEl.matches('input[type="text"], textarea') || activeEl.isContentEditable) &&
        activeEl.id !== 'searchInput';

      if (isEditableTarget && e.clipboardData) {
        const html = e.clipboardData.getData('text/html');
        const plain = e.clipboardData.getData('text/plain');
        const activeRow = this._getActiveLineElement(this.activeSide);
        const curLineIdx = activeRow ? parseInt(activeRow.dataset.lineIdx || '0', 10) : this.activeLineIdx;
        const isCodeLine = (this.pages[this.getPageIndex(this.activeSide)]?.lineTypes?.[curLineIdx] || 'normal') === 'code';

        if (!isCodeLine) {
          const res = MathPasteFormatter.formatClipboard(html, plain);
          if (res.converted) {
            e.preventDefault();
            this._insertFormattedMathIntoTarget(activeEl, res.text);
            return;
          }
        }

        if (activeEl.classList.contains('page-lines') && plain) {
          e.preventDefault();
          this._insertFormattedMathIntoTarget(activeEl, plain);
        }
      }
    });
  },

  addImageToPage(fileUrl, preferredWidth = null) {
    if (this.isOverview) this.toggleOverview(false);
    NotebookCanvas.setTool('text');
    const side = this.lastClickPoint?.side || this.activeSide;
    const pageData = this.pages[this.getPageIndex(side)];
    if (!Array.isArray(pageData.images)) pageData.images = [];

    const defaultW = preferredWidth ? Math.max(90, Math.min(340, preferredWidth)) : 240;
    const x = this.lastClickPoint?.side === side
      ? Math.min(560 - defaultW - 18, Math.max(58, this.lastClickPoint.x))
      : 84;
    const y = this.lastClickPoint?.side === side
      ? Math.min(600, Math.max(54, this.lastClickPoint.y))
      : 110;

    pageData.images.push({
      id: 'img_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      x,
      y,
      width: defaultW,
      src: fileUrl
    });

    const container = document.getElementById(`${side}Images`);
    if (typeof NotebookCanvas.renderImages === 'function') {
      NotebookCanvas.renderImages(container, pageData.images, side);
    }
    this.scheduleSave(side);
  },

  async removeImageById(side, imgId) {
    const pageData = this.pages[this.getPageIndex(side)];
    const target = (pageData.images || []).find(item => item.id === imgId);

    pageData.images = (pageData.images || []).filter(item => item.id !== imgId);
    const container = document.getElementById(`${side}Images`);
    if (typeof NotebookCanvas.renderImages === 'function') {
      NotebookCanvas.renderImages(container, pageData.images, side);
    }
    this.scheduleSave(side);

    if (target?.src && window.electronAPI?.deletePastedImage) {
      await window.electronAPI.deletePastedImage(target.src);
    }
  },

  addShapeToPage(side, shapeObj) {
    const pageData = this.pages[this.getPageIndex(side)];
    pageData.shapes.push(shapeObj);
    const svgEl = document.getElementById(`${side}Svg`);
    NotebookCanvas.renderShapes(svgEl, pageData.shapes, side);
    this.scheduleSave(side);
  },

  removeShapeById(side, shapeId) {
    const pageData = this.pages[this.getPageIndex(side)];
    pageData.shapes = pageData.shapes.filter(s => s.id !== shapeId);
    const svgEl = document.getElementById(`${side}Svg`);
    NotebookCanvas.renderShapes(svgEl, pageData.shapes, side);
    this.scheduleSave(side);
  },

  removeTableById(side, tableId) {
    const pageData = this.pages[this.getPageIndex(side)];
    pageData.tables = pageData.tables.filter(t => t.id !== tableId);
    const tablesEl = document.getElementById(`${side}Tables`);
    NotebookCanvas.renderTables(tablesEl, pageData.tables, side);
    this.scheduleSave(side);
  },

  undoLastShape() {
    const side = this.activeSide;
    const pageData = this.pages[this.getPageIndex(side)];
    if (pageData.shapes.length > 0) {
      pageData.shapes.pop();
      const svgEl = document.getElementById(`${side}Svg`);
      NotebookCanvas.renderShapes(svgEl, pageData.shapes, side);
      this.scheduleSave(side);
    }
  },

  clearActivePageShapes() {
    const side = this.activeSide;
    const pageData = this.pages[this.getPageIndex(side)];
    pageData.shapes = [];
    const svgEl = document.getElementById(`${side}Svg`);
    NotebookCanvas.renderShapes(svgEl, pageData.shapes, side);
    this.scheduleSave(side);
  },

  turnPrevSpread() {
    if (this.spreadIndex >= 2) {
      this.saveNow();
      this.spreadIndex -= 2;
      this.activeSide = 'left';
      this.activeLineIdx = 0;
      this.renderSpread();
    }
  },

  turnNextSpread() {
    this.saveNow();
    if (this.spreadIndex + 2 >= this.pages.length) {
      this.pages.push(this._createBlankPage(), this._createBlankPage());
      this.markPageDirty(this.pages.length - 2);
      this.markPageDirty(this.pages.length - 1);
      this.metaDirty = true;
    }
    this.spreadIndex += 2;
    this.activeSide = 'left';
    this.activeLineIdx = 0;
    this.renderSpread();
  },

  insertPageLeft(side = this.activeSide) {
    const targetIdx = this.getPageIndex(side);
    this.pages.splice(targetIdx, 0, this._createBlankPage());
    this._ensureEvenPageCount();
    this.spreadIndex = Math.floor(targetIdx / 2) * 2;
    this.activeSide = targetIdx % 2 === 0 ? 'left' : 'right';
    this.markAllPagesDirty();
    this.renderSpread();
    this.scheduleSave();
  },

  insertPageRight(side = this.activeSide) {
    const targetIdx = this.getPageIndex(side) + 1;
    this.pages.splice(targetIdx, 0, this._createBlankPage());
    this._ensureEvenPageCount();
    this.spreadIndex = Math.floor(targetIdx / 2) * 2;
    this.activeSide = targetIdx % 2 === 0 ? 'left' : 'right';
    this.markAllPagesDirty();
    this.renderSpread();
    this.scheduleSave();
  },

  deleteCurrentPage(side = this.activeSide) {
    if (this.pages.length <= 2) {
      const idx = this.getPageIndex(side);
      this.pages[idx] = this._createBlankPage();
      this.markPageDirty(idx);
    } else {
      const idx = this.getPageIndex(side);
      this.pages.splice(idx, 1);
      this._ensureEvenPageCount();
      this.markAllPagesDirty();
    }
    this.renderSpread();
    this.scheduleSave();
  },

  jumpToPageNumber(pageNumber) {
    const num = parseInt(pageNumber, 10);
    if (isNaN(num) || num < 1) return;
    if (this.isOverview) this.toggleOverview(false);
    const clamped = Math.min(this.pages.length, num);
    const zeroIdx = clamped - 1;
    this.spreadIndex = Math.floor(zeroIdx / 2) * 2;
    this.activeSide = zeroIdx % 2 === 0 ? 'left' : 'right';
    this.activeLineIdx = 0;
    this.renderSpread();
    setTimeout(() => {
      const firstLine = document.querySelector(`#${this.activeSide}Lines .paper-line`);
      if (firstLine) this._setCaretOffsetInLine(firstLine, 0);
    }, 30);
  },

  /* ================= PROPORTIONAL ZOOM & CENTERED ALIGNMENT ================= */
  toggleZoom() {
    if (this.isOverview) this.toggleOverview(false);
    this.isZoomed = !this.isZoomed;
    this._applyZoomClasses();

    requestAnimationFrame(() => {
      if (this.isZoomed) {
        const target = this.activeFocusEl || document.querySelector(`#${this.activeSide}Lines .paper-line`);
        if (target?.classList?.contains('paper-line')) {
          this._setCaretOffsetInLine(target, this._getCaretOffsetInLine(target));
        } else if (target && document.activeElement !== target) {
          target.focus();
        }
        this.ensureCursorInComfortZone(true);
      } else {
        this.viewport.scrollTop = 0;
      }
    });
  },

  _applyZoomClasses() {
    const zoomTag = document.getElementById('zoomStatusTag');
    const zoomIcon = document.getElementById('zoomIconLabel');
    const zoomBtn = document.getElementById('btnToggleZoom');

    this.viewport?.classList.toggle('is-zoomed', this.isZoomed);

    if (this.isZoomed) {
      this.spreadEl.classList.add('zoomed-mode');
      this.spreadEl.classList.toggle('focus-left', this.activeSide === 'left');
      this.spreadEl.classList.toggle('focus-right', this.activeSide === 'right');
      if (zoomTag && !this.isOverview) zoomTag.textContent = `Zoom (${this.activeSide === 'left' ? 'Trang trái' : 'Trang phải'})`;
      if (zoomIcon) zoomIcon.textContent = '⤡';
      zoomBtn?.classList.add('active');
    } else {
      this.spreadEl.classList.remove('zoomed-mode', 'focus-left', 'focus-right');
      if (zoomTag && !this.isOverview) zoomTag.textContent = '2 Pages';
      if (zoomIcon) zoomIcon.textContent = '⤢';
      zoomBtn?.classList.remove('active');
    }

    this._updateScaleLayout();
  },

  _updateScaleLayout() {
    if (!this.coverFrame || !this.zoomStage || !this.viewport) return;

    this.coverFrame.style.transform = 'none';
    const baseW = this.coverFrame.offsetWidth;
    const baseH = this.coverFrame.offsetHeight;

    const cs = window.getComputedStyle(this.viewport);
    const padX = parseFloat(cs.paddingLeft || '0') + parseFloat(cs.paddingRight || '0');
    const padY = parseFloat(cs.paddingTop || '0') + parseFloat(cs.paddingBottom || '0');

    const innerW = Math.max(320, this.viewport.clientWidth - padX);
    const innerH = Math.max(240, this.viewport.clientHeight - padY);
    if (!baseW || !baseH) return;

    const scaleW = innerW / baseW;
    const scaleH = innerH / baseH;

    const scale = this.isZoomed
      ? Math.min(2.1, scaleW)
      : Math.min(scaleW, scaleH);

    const scaledW = Math.round(baseW * scale);
    const scaledH = Math.round(baseH * scale);

    this.currentScale = scale;
    this.coverFrame.style.transform = `scale(${scale})`;
    this.zoomStage.style.width = `${scaledW}px`;
    this.zoomStage.style.height = `${scaledH}px`;
  },

  ensureCursorInComfortZone(forceCenter = false) {
    if (!this.isZoomed || !this.viewport) return;

    const focusEl = this.activeFocusEl || this._getActiveLineElement(this.activeSide) || document.activeElement;
    if (!focusEl || !this.spreadEl.contains(focusEl)) return;

    const rect = focusEl.getBoundingClientRect();
    const vh = window.innerHeight;
    const topBound = vh * 0.35;
    const bottomBound = vh * 0.85;
    const cursorY = rect.top + rect.height / 2;

    if (forceCenter || cursorY < topBound || cursorY > bottomBound) {
      const desiredY = vh * 0.55;
      const delta = cursorY - desiredY;
      this.viewport.scrollTo({
        top: Math.max(0, this.viewport.scrollTop + delta),
        behavior: 'smooth'
      });
    }
  },

  runSearch(query, advance = false) {
    document.querySelectorAll('.paper-line.search-hit').forEach(el => el.classList.remove('search-hit'));
    const badge = document.getElementById('searchBadge');
    const q = query.trim().toLowerCase();

    if (!q) {
      this.searchMatches = [];
      this.searchCursor = -1;
      if (badge) badge.textContent = '';
      if (this.isOverview) this.renderOverviewGrid();
      return;
    }

    if (!advance || this.searchMatches.length === 0) {
      this.searchMatches = [];
      this.pages.forEach((p, pIdx) => {
        p.lines.forEach((lineText, lIdx) => {
          if ((lineText || '').toLowerCase().includes(q)) {
            this.searchMatches.push({ pageIdx: pIdx, lineIdx: lIdx });
          }
        });
      });
      this.searchCursor = this.searchMatches.length > 0 ? 0 : -1;
    } else {
      this.searchCursor = (this.searchCursor + 1) % this.searchMatches.length;
    }

    if (this.searchMatches.length === 0) {
      if (badge) badge.textContent = '0';
      if (this.isOverview) this.renderOverviewGrid();
      return;
    }

    if (badge) badge.textContent = `${this.searchCursor + 1}/${this.searchMatches.length}`;
    const hit = this.searchMatches[this.searchCursor];
    this.spreadIndex = Math.floor(hit.pageIdx / 2) * 2;
    this.activeSide = hit.pageIdx % 2 === 0 ? 'left' : 'right';
    this.activeLineIdx = hit.lineIdx;

    if (this.isOverview) {
      this.renderOverviewGrid();
      const hitCard = this.overviewGrid?.children[hit.pageIdx];
      if (hitCard) {
        this._hydrateOverviewCard(hitCard, hit.pageIdx);
        hitCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    this.renderSpread();

    const targetRow = document.querySelector(`#${this.activeSide}Lines .paper-line[data-line-idx="${hit.lineIdx}"]`);
    if (targetRow) {
      targetRow.classList.add('search-hit');
      this.activeFocusEl = targetRow;

      if (advance) {
        this._setCaretOffsetInLine(targetRow, 0);
        this.ensureCursorInComfortZone(true);
      } else if (this.isZoomed) {
        this.ensureCursorInComfortZone(true);
      }
    }
  },

  _updateNavigationUI() {
    const prevBtn = document.getElementById('btnPrevSpread');
    const counter = document.getElementById('pageCounterText');
    const zoomTag = document.getElementById('zoomStatusTag');
    if (prevBtn) prevBtn.classList.toggle('disabled', this.spreadIndex === 0);

    if (this.isOverview) {
      if (zoomTag) zoomTag.textContent = 'All Pages';
      if (counter) counter.textContent = `${this.pages.length} pages`;
      return;
    }

    if (zoomTag) {
      zoomTag.textContent = this.isZoomed
        ? `Zoom (${this.activeSide === 'left' ? 'Trang trái' : 'Trang phải'})`
        : '2 Pages';
    }

    const leftNum = this.spreadIndex + 1;
    const rightNum = this.spreadIndex + 2;
    if (counter) {
      counter.textContent = `${leftNum}–${rightNum} / ${this.pages.length} pages`;
    }
  },

  _bindToolbarAndEvents() {
    document.getElementById('btnBackLibrary')?.addEventListener('click', () => this.exitToLibrary());
    document.getElementById('btnPrevSpread')?.addEventListener('click', () => this.turnPrevSpread());
    document.getElementById('btnNextSpread')?.addEventListener('click', () => this.turnNextSpread());
    document.getElementById('btnToggleZoom')?.addEventListener('click', () => this.toggleZoom());
    document.getElementById('btnOverviewGrid')?.addEventListener('click', () => this.toggleOverview());
    document.getElementById('btnInsertTable')?.addEventListener('click', () => this.insertQuickTable());
    document.getElementById('btnInsertBullet')?.addEventListener('click', () => this.insertBulletAtCursor());
    document.getElementById('btnInsertFreeText')?.addEventListener('click', () => this.insertFreeText());
    document.getElementById('btnToggleHeading')?.addEventListener('click', () => this.toggleLineType('heading'));
    document.getElementById('btnToggleCode')?.addEventListener('click', () => this.toggleLineType('code'));
    document.getElementById('btnOpenSketchpad')?.addEventListener('click', () => NotebookSketchModal.open());

    document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.isOverview) this.toggleOverview(false);
        const tool = btn.dataset.tool;
        NotebookCanvas.setTool(tool);
        if (tool === 'text') {
          const row = document.querySelectorAll(`#${this.activeSide}Lines .paper-line`)[this.activeLineIdx];
          if (row) this._setCaretOffsetInLine(row, (row.textContent || '').length);
        }
      });
    });

    document.querySelectorAll('.ink-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        this.inkColor = dot.dataset.ink;
        document.documentElement.style.setProperty('--ink-color', this.inkColor);
        document.querySelectorAll('.ink-dot').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        this.metaDirty = true;
        this.scheduleSave();
      });
    });

    document.getElementById('btnSwitchFont')?.addEventListener('click', () => {
      this.fontIndex = (this.fontIndex + 1) % this.FONTS.length;
      document.documentElement.style.setProperty('--font-hand', this.FONTS[this.fontIndex]);
      this.metaDirty = true;
      this._reflowPagesForCurrentFont();
      if (this.isOverview) {
        this.renderOverviewGrid();
      } else {
        this.renderSpread();
      }
      this.scheduleSave();
    });

    const searchInput = document.getElementById('searchInput');
    searchInput?.addEventListener('input', () => this.runSearch(searchInput.value, false));
    searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (this.isOverview) {
          this.runSearch(searchInput.value, true);
          return;
        }
        const activeHit = document.querySelector('.paper-line.search-hit');
        if (activeHit) {
          this._setCaretOffsetInLine(activeHit, 0);
          this.ensureCursorInComfortZone(true);
        } else {
          this.runSearch(searchInput.value, true);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (this.isOverview) {
          searchInput.blur();
          return;
        }
        const activeHit = document.querySelector('.paper-line.search-hit');
        const fallback = document.querySelectorAll(`#${this.activeSide}Lines .paper-line`)[this.activeLineIdx];
        const target = activeHit || fallback;
        if (target) this._setCaretOffsetInLine(target, 0);
      }
    });

    const jumpInput = document.getElementById('jumpPageInput');
    jumpInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.jumpToPageNumber(jumpInput.value);
        jumpInput.value = '';
      }
    });

    document.getElementById('btnOpenGuide')?.addEventListener('click', () => this.toggleGuideModal(true));
    document.getElementById('btnCloseGuide')?.addEventListener('click', () => this.toggleGuideModal(false));
    document.getElementById('guideBackdrop')?.addEventListener('click', (e) => {
      if (e.target.id === 'guideBackdrop') this.toggleGuideModal(false);
    });
  },

  _bindContextMenu() {
    const menu = document.getElementById('pageContextMenu');

    ['leftPage', 'rightPage'].forEach(pageElId => {
      const el = document.getElementById(pageElId);
      el?.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.contextTargetSide = el.dataset.side;
        this.setActiveSide(this.contextTargetSide);

        const menuW = 240;
        const menuH = 130;
        const x = Math.min(window.innerWidth - menuW - 10, e.clientX);
        const y = Math.min(window.innerHeight - menuH - 10, e.clientY);
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
        menu.classList.add('open');
      });
    });

    document.addEventListener('click', () => menu?.classList.remove('open'));

    document.getElementById('ctxAddLeft')?.addEventListener('click', () => {
      this.insertPageLeft(this.contextTargetSide);
    });
    document.getElementById('ctxAddRight')?.addEventListener('click', () => {
      this.insertPageRight(this.contextTargetSide);
    });
    document.getElementById('ctxDeletePage')?.addEventListener('click', () => {
      this.deleteCurrentPage(this.contextTargetSide);
    });
  },

  toggleGuideModal(forceState = null) {
    const modal = document.getElementById('guideBackdrop');
    if (!modal) return;
    const next = forceState !== null ? forceState : !modal.classList.contains('open');
    modal.classList.toggle('open', next);
  },

  exitToLibrary() {
    this.saveNow();
    window.location.href = 'lib.html';
  },

  _bindGlobalShortcuts() {
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();

      if (NotebookSketchModal.isOpen()) {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          NotebookSketchModal.close();
        } else if (e.ctrlKey && !e.altKey && key === 'z') {
          e.preventDefault();
          e.stopPropagation();
          if (e.shiftKey) NotebookSketchModal.redo();
          else NotebookSketchModal.undo();
        } else if (e.ctrlKey && !e.altKey && key === 'y') {
          e.preventDefault();
          e.stopPropagation();
          NotebookSketchModal.redo();
        } else if (e.ctrlKey && e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          NotebookSketchModal.importToPage();
        }
        return;
      }

      if (e.key === 'Escape') {
        const guideOpen = document.getElementById('guideBackdrop')?.classList.contains('open');
        const ctxOpen = document.getElementById('pageContextMenu')?.classList.contains('open');
        if (guideOpen || ctxOpen) {
          this.toggleGuideModal(false);
          document.getElementById('pageContextMenu')?.classList.remove('open');
          return;
        }
        if (this.isOverview) {
          e.preventDefault();
          this.toggleOverview(false);
          return;
        }
        e.preventDefault();
        this.exitToLibrary();
        return;
      }

      const isTyping =
        e.target.matches('input, textarea') || e.target.isContentEditable;

      if (!isTyping && !this.isOverview && !e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.turnPrevSpread();
          return;
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          this.turnNextSpread();
          return;
        }
      }

      if (e.ctrlKey && !e.altKey && !e.metaKey) {
        if (key === 'g') {
          e.preventDefault();
          this.toggleOverview();
          return;
        }
        if (key === 'a' && !isTyping) {
          e.preventDefault();
          if (this.isOverview) this.toggleOverview(false);
          NotebookCanvas.setTool('text');
          const row = document.querySelectorAll(`#${this.activeSide}Lines .paper-line`)[this.activeLineIdx];
          if (row) this._setCaretOffsetInLine(row, (row.textContent || '').length);
        } else if (key === 's') {
          e.preventDefault();
          if (this.isOverview) this.toggleOverview(false);
          NotebookCanvas.setTool('line');
        } else if (key === 'o') {
          e.preventDefault();
          if (this.isOverview) this.toggleOverview(false);
          NotebookCanvas.setTool('oval');
        } else if (key === 'r') {
          e.preventDefault();
          if (this.isOverview) this.toggleOverview(false);
          NotebookCanvas.setTool('rect');
        } else if (key === 'd') {
          e.preventDefault();
          if (this.isOverview) this.toggleOverview(false);
          NotebookCanvas.setTool('arrow');
        } else if (key === 'f') {
          e.preventDefault();
          if (this.isOverview) this.toggleOverview(false);
          NotebookCanvas.setTool('eraser');
        } else if (key === 't') {
          e.preventDefault();
          this.insertQuickTable();
        } else if (key === 'p') {
          e.preventDefault();
          this.insertBulletAtCursor();
        } else if (key === 'b' && !e.shiftKey) {
          e.preventDefault();
          this.insertFreeText();
        } else if (key === 'q') {
          e.preventDefault();
          this.toggleZoom();
        } else if (key === 'v' && !isTyping) {
          e.preventDefault();
          this.pasteImageFromClipboard();
        }
        return;
      }

      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        if (key === 'v') {
          e.preventDefault();
          NotebookSketchModal.open();
        } else if (key === 't') {
          e.preventDefault();
          const s = document.getElementById('searchInput');
          s?.focus();
          s?.select();
        } else if (key === 'o') {
          e.preventDefault();
          const j = document.getElementById('jumpPageInput');
          j?.focus();
          j?.select();
        } else if (key === 'e') {
          e.preventDefault();
          this.toggleGuideModal();
        } else if (key === 'd') {
          e.preventDefault();
          if (!this.isOverview) this.deleteCurrentPage(this.activeSide);
        } else if (key === 'g') {
          e.preventDefault();
          if (!this.isOverview) this.insertPageLeft(this.activeSide);
        } else if (key === 'h') {
          e.preventDefault();
          if (!this.isOverview) this.insertPageRight(this.activeSide);
        } else if (key === '1') {
          e.preventDefault();
          this.toggleLineType('heading');
        } else if (key === '2') {
          e.preventDefault();
          this.toggleLineType('code');
        }
      }
    }, { capture: true });
  }
};

window.addEventListener('DOMContentLoaded', () => {
  NotebookEditor.init();
});