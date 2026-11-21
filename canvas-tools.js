const NotebookCanvas = {
  activeTool: 'text',
  strokeColor: '#1e1b18',
  strokeWidth: 2.5,
  strokeOpacity: 1,
  isDrawing: false,
  startPoint: null,
  tempShapeEl: null,
  activeSide: null,
  onChangeCallback: null,

  _getEditor() {
    if (typeof NotebookEditor !== 'undefined') return NotebookEditor;
    return window.NotebookEditor || null;
  },

  init(onChange) {
    this.onChangeCallback = onChange;
    this._bindStylePanel();
    this._bindSvgLayer('left');
    this._bindSvgLayer('right');
    this.setTool(this.activeTool);
    NotebookSketchModal.init(() => this._getEditor());
  },

  setTool(tool) {
    this.activeTool = tool;

    document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === tool);
    });

    const isDrawShape = ['line', 'oval', 'rect', 'arrow'].includes(tool);
    const isInteractive = isDrawShape || tool === 'eraser';

    document.body.classList.toggle('drawing-mode', isDrawShape);
    document.body.classList.toggle('eraser-mode', tool === 'eraser');

    ['leftSvg', 'rightSvg'].forEach(id => {
      const svg = document.getElementById(id);
      if (svg) {
        svg.style.pointerEvents = isInteractive ? 'auto' : 'none';
        svg.style.cursor = tool === 'eraser' ? 'cell' : (isDrawShape ? 'crosshair' : 'default');
      }
    });

    if (isInteractive) {
      document.activeElement?.blur();
    }

    const panel = document.getElementById('drawStylePanel');
    if (panel) {
      panel.classList.toggle('visible', isInteractive);
    }
  },

  _bindStylePanel() {
    document.querySelectorAll('.stroke-swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        this.strokeColor = swatch.dataset.stroke;
        document.querySelectorAll('.stroke-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
      });
    });

    document.querySelectorAll('#strokeWidthRow .size-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        this.strokeWidth = parseFloat(pill.dataset.width);
        document.querySelectorAll('#strokeWidthRow .size-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
      });
    });

    const slider = document.getElementById('strokeOpacitySlider');
    const label = document.getElementById('opacityValLabel');
    if (slider) {
      slider.addEventListener('input', () => {
        this.strokeOpacity = parseInt(slider.value, 10) / 100;
        if (label) label.textContent = `${slider.value}%`;
      });
    }

    document.getElementById('btnUndoDraw')?.addEventListener('click', () => {
      this._getEditor()?.undoLastShape();
    });

    document.getElementById('btnClearDraw')?.addEventListener('click', () => {
      this._getEditor()?.clearActivePageShapes();
    });
  },

  _getNormalizedCoords(svgEl, clientX, clientY) {
    const rect = svgEl.getBoundingClientRect();
    if (!rect.width || !rect.height) return { x: 0, y: 0 };
    const x = Math.max(0, Math.min(1000, ((clientX - rect.left) / rect.width) * 1000));
    const y = Math.max(0, Math.min(1000, ((clientY - rect.top) / rect.height) * 1000));
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  },

  _eraseAtPoint(side, clientX, clientY) {
    const elUnder = document.elementFromPoint(clientX, clientY);
    const targetShape = elUnder?.closest('[data-shape-id]');
    const editor = this._getEditor();
    if (targetShape && editor) {
      editor.removeShapeById(side, targetShape.dataset.shapeId);
    }
  },

  _bindSvgLayer(side) {
    const svg = document.getElementById(`${side}Svg`);
    if (!svg) return;
    svg.style.touchAction = 'none';
    svg.setAttribute('viewBox', '0 0 1000 1000');
    svg.setAttribute('preserveAspectRatio', 'none');

    svg.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;

      const editor = this._getEditor();
      editor?.setActiveSide(side);

      if (this.activeTool === 'eraser') {
        e.preventDefault();
        this._eraseAtPoint(side, e.clientX, e.clientY);
        return;
      }

      if (!['line', 'oval', 'rect', 'arrow'].includes(this.activeTool)) return;

      e.preventDefault();
      this.isDrawing = true;
      this.activeSide = side;
      this.startPoint = this._getNormalizedCoords(svg, e.clientX, e.clientY);

      const previewData = {
        id: 'tmp',
        type: this.activeTool,
        x1: this.startPoint.x,
        y1: this.startPoint.y,
        x2: this.startPoint.x,
        y2: this.startPoint.y,
        color: this.strokeColor,
        width: this.strokeWidth,
        opacity: this.strokeOpacity
      };

      this.tempShapeEl = this.createSvgElement(previewData, side);
      if (this.tempShapeEl) {
        svg.appendChild(this.tempShapeEl);
      }

      const onWindowMove = (mv) => {
        if (!this.isDrawing || this.activeSide !== side || !this.tempShapeEl) return;
        const cur = this._getNormalizedCoords(svg, mv.clientX, mv.clientY);
        this.updateSvgElement(this.tempShapeEl, {
          type: this.activeTool,
          x1: this.startPoint.x,
          y1: this.startPoint.y,
          x2: cur.x,
          y2: cur.y
        });
      };

      const onWindowUp = (up) => {
        window.removeEventListener('pointermove', onWindowMove);
        window.removeEventListener('pointerup', onWindowUp);
        window.removeEventListener('pointercancel', onWindowUp);

        if (!this.isDrawing || this.activeSide !== side) return;
        const cur = this._getNormalizedCoords(svg, up.clientX, up.clientY);

        if (this.tempShapeEl) {
          this.tempShapeEl.remove();
          this.tempShapeEl = null;
        }

        this.isDrawing = false;
        this.activeSide = null;

        const dist = Math.hypot(cur.x - this.startPoint.x, cur.y - this.startPoint.y);
        if (dist < 4) return;

        const shapeObj = {
          id: 'shp_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
          type: this.activeTool,
          x1: this.startPoint.x,
          y1: this.startPoint.y,
          x2: cur.x,
          y2: cur.y,
          color: this.strokeColor,
          width: this.strokeWidth,
          opacity: this.strokeOpacity
        };

        this._getEditor()?.addShapeToPage(side, shapeObj);
      };

      window.addEventListener('pointermove', onWindowMove);
      window.addEventListener('pointerup', onWindowUp);
      window.addEventListener('pointercancel', onWindowUp);
    });

    svg.addEventListener('pointermove', (e) => {
      if (this.activeTool === 'eraser' && e.buttons === 1) {
        this._eraseAtPoint(side, e.clientX, e.clientY);
      }
    });
  },

  renderShapes(svgEl, shapes = [], side = 'left') {
    svgEl.setAttribute('viewBox', '0 0 1000 1000');
    svgEl.setAttribute('preserveAspectRatio', 'none');
    svgEl.innerHTML = '';

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svgEl.appendChild(defs);

    shapes.forEach(shape => {
      const group = this.createShapeGroup(shape, side, defs);
      if (group) svgEl.appendChild(group);
    });
  },

  createShapeGroup(shape, side, defsEl = null) {
    const ns = 'http://www.w3.org/2000/svg';
    const g = document.createElementNS(ns, 'g');
    g.classList.add('drawn-shape');
    g.dataset.shapeId = shape.id;

    const hitEl = this.createSvgElement(shape, side, null, true);
    const visibleEl = this.createSvgElement(shape, side, defsEl, false);

    if (hitEl) g.appendChild(hitEl);
    if (visibleEl) g.appendChild(visibleEl);
    return g;
  },

  createSvgElement(shape, side, defsEl = null, isHitBox = false) {
    const ns = 'http://www.w3.org/2000/svg';
    let el = null;

    if (shape.type === 'line' || shape.type === 'arrow') {
      el = document.createElementNS(ns, 'line');
      el.setAttribute('x1', shape.x1);
      el.setAttribute('y1', shape.y1);
      el.setAttribute('x2', shape.x2);
      el.setAttribute('y2', shape.y2);

      if (shape.type === 'arrow' && !isHitBox) {
        const svgRoot = document.getElementById(`${side}Svg`);
        let defs = defsEl || svgRoot?.querySelector('defs');
        if (!defs && svgRoot) {
          defs = document.createElementNS(ns, 'defs');
          svgRoot.prepend(defs);
        }
        const markerId = `arrow_${side}_${shape.color.replace('#', '')}`;
        if (defs && !defs.querySelector(`#${markerId}`)) {
          const marker = document.createElementNS(ns, 'marker');
          marker.setAttribute('id', markerId);
          marker.setAttribute('markerWidth', '12');
          marker.setAttribute('markerHeight', '12');
          marker.setAttribute('refX', '9');
          marker.setAttribute('refY', '6');
          marker.setAttribute('orient', 'auto');
          marker.setAttribute('markerUnits', 'userSpaceOnUse');

          const path = document.createElementNS(ns, 'path');
          path.setAttribute('d', 'M1,1 L11,6 L1,11 L3.5,6 z');
          path.setAttribute('fill', shape.color);
          marker.appendChild(path);
          defs.appendChild(marker);
        }
        el.setAttribute('marker-end', `url(#${markerId})`);
      }
    } else if (shape.type === 'rect') {
      el = document.createElementNS(ns, 'rect');
      el.setAttribute('x', Math.min(shape.x1, shape.x2));
      el.setAttribute('y', Math.min(shape.y1, shape.y2));
      el.setAttribute('width', Math.abs(shape.x2 - shape.x1));
      el.setAttribute('height', Math.abs(shape.y2 - shape.y1));
      el.setAttribute('rx', '6');
      el.setAttribute('fill', 'none');
    } else if (shape.type === 'oval') {
      el = document.createElementNS(ns, 'ellipse');
      el.setAttribute('cx', (shape.x1 + shape.x2) / 2);
      el.setAttribute('cy', (shape.y1 + shape.y2) / 2);
      el.setAttribute('rx', Math.abs(shape.x2 - shape.x1) / 2);
      el.setAttribute('ry', Math.abs(shape.y2 - shape.y1) / 2);
      el.setAttribute('fill', 'none');
    }

    if (!el) return null;

    el.setAttribute('vector-effect', 'non-scaling-stroke');
    el.setAttribute('stroke-linecap', 'round');

    if (isHitBox) {
      el.setAttribute('stroke', 'transparent');
      el.setAttribute('stroke-width', '18');
      el.setAttribute('pointer-events', 'stroke');
    } else {
      el.setAttribute('stroke', shape.color);
      el.setAttribute('stroke-width', shape.width || 2.5);
      el.setAttribute('opacity', shape.opacity ?? 1);
    }

    return el;
  },

  updateSvgElement(el, coords) {
    if (coords.type === 'line' || coords.type === 'arrow') {
      el.setAttribute('x1', coords.x1);
      el.setAttribute('y1', coords.y1);
      el.setAttribute('x2', coords.x2);
      el.setAttribute('y2', coords.y2);
    } else if (coords.type === 'rect') {
      el.setAttribute('x', Math.min(coords.x1, coords.x2));
      el.setAttribute('y', Math.min(coords.y1, coords.y2));
      el.setAttribute('width', Math.abs(coords.x2 - coords.x1));
      el.setAttribute('height', Math.abs(coords.y2 - coords.y1));
    } else if (coords.type === 'oval') {
      el.setAttribute('cx', (coords.x1 + coords.x2) / 2);
      el.setAttribute('cy', (coords.y1 + coords.y2) / 2);
      el.setAttribute('rx', Math.abs(coords.x2 - coords.x1) / 2);
      el.setAttribute('ry', Math.abs(coords.y2 - coords.y1) / 2);
    }
  },

  renderImages(containerEl, images = [], side = 'left') {
    if (!containerEl) return;
    containerEl.innerHTML = '';

    images.forEach(imgItem => {
      const pageW = containerEl.offsetWidth || 560;
      const curW = Math.min(imgItem.width ?? 240, pageW - 28);
      const curX = Math.max(14, Math.min(pageW - curW - 14, imgItem.x ?? 80));
      imgItem.x = curX;
      imgItem.width = curW;

      const card = document.createElement('div');
      card.className = 'pasted-image-card';
      card.style.left = `${curX}px`;
      card.style.top = `${imgItem.y ?? 100}px`;
      card.style.width = `${curW}px`;

      card.addEventListener('click', (e) => {
        if (this.activeTool === 'eraser') {
          e.stopPropagation();
          this._getEditor()?.removeImageById(side, imgItem.id);
        }
      });

      const img = document.createElement('img');
      img.src = imgItem.src;
      img.draggable = false;

      img.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 || this.activeTool === 'eraser') return;
        e.preventDefault();
        const startX = e.clientX;
        const startY = e.clientY;
        const origX = imgItem.x ?? 80;
        const origY = imgItem.y ?? 100;

        const onMove = (mv) => {
          const scale = this._getEditor()?.getZoomScale() || 1;
          const maxW = containerEl.offsetWidth || 560;
          const maxH = containerEl.offsetHeight || 860;
          const wNow = imgItem.width ?? 240;
          imgItem.x = Math.round(Math.max(14, Math.min(maxW - wNow - 14, origX + (mv.clientX - startX) / scale)));
          imgItem.y = Math.round(Math.max(14, Math.min(maxH - 60, origY + (mv.clientY - startY) / scale)));
          card.style.left = `${imgItem.x}px`;
          card.style.top = `${imgItem.y}px`;
        };

        const onUp = () => {
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
          if (this.onChangeCallback) this.onChangeCallback();
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
      });

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'img-del-btn';
      delBtn.textContent = '✕';
      delBtn.title = 'Xóa ảnh';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._getEditor()?.removeImageById(side, imgItem.id);
      });

      const resizeHandle = document.createElement('div');
      resizeHandle.className = 'img-resize-handle';
      resizeHandle.title = 'Kéo để đổi kích thước';
      resizeHandle.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const startX = e.clientX;
        const origW = imgItem.width ?? 240;

        const onResizeMove = (mv) => {
          const scale = this._getEditor()?.getZoomScale() || 1;
          const maxW = (containerEl.offsetWidth || 560) - (imgItem.x ?? 80) - 14;
          const nextW = Math.round(Math.max(60, Math.min(maxW, origW + (mv.clientX - startX) / scale)));
          imgItem.width = nextW;
          card.style.width = `${nextW}px`;
        };

        const onResizeUp = () => {
          window.removeEventListener('pointermove', onResizeMove);
          window.removeEventListener('pointerup', onResizeUp);
          if (this.onChangeCallback) this.onChangeCallback();
        };

        window.addEventListener('pointermove', onResizeMove);
        window.addEventListener('pointerup', onResizeUp);
      });

      card.appendChild(img);
      card.appendChild(delBtn);
      card.appendChild(resizeHandle);
      containerEl.appendChild(card);
    });
  },

  renderTables(containerEl, tables = [], side = 'left') {
    containerEl.innerHTML = '';

    tables.forEach(tbl => {
      const card = document.createElement('div');
      card.className = 'notebook-table-card';
      card.style.left = `${tbl.x ?? 66}px`;
      card.style.top = `${tbl.y ?? 140}px`;

      card.addEventListener('click', (e) => {
        if (this.activeTool === 'eraser') {
          e.stopPropagation();
          this._getEditor()?.removeTableById(side, tbl.id);
        }
      });

      const bar = document.createElement('div');
      bar.className = 'table-drag-bar';
      bar.innerHTML = `
        <span>⠿ Table</span>
        <div class="table-mini-actions">
          <button type="button" class="table-mini-btn" data-act="add-row" title="Thêm hàng">+Row</button>
          <button type="button" class="table-mini-btn" data-act="add-col" title="Thêm cột">+Col</button>
          <button type="button" class="table-mini-btn" data-act="del-tbl" title="Xóa bảng">✕</button>
        </div>
      `;

      bar.addEventListener('pointerdown', (e) => {
        if (e.target.closest('button')) return;
        e.preventDefault();
        const startX = e.clientX;
        const startY = e.clientY;
        const origX = tbl.x ?? 66;
        const origY = tbl.y ?? 140;

        const onMove = (mv) => {
          const scale = this._getEditor()?.getZoomScale() || 1;
          const maxW = containerEl.offsetWidth || 560;
          const maxH = containerEl.offsetHeight || 860;
          const nextX = Math.max(52, Math.min(maxW - 180, origX + (mv.clientX - startX) / scale));
          const nextY = Math.max(46, Math.min(maxH - 80, origY + (mv.clientY - startY) / scale));
          tbl.x = Math.round(nextX);
          tbl.y = Math.round(nextY);
          card.style.left = `${tbl.x}px`;
          card.style.top = `${tbl.y}px`;
        };

        const onUp = () => {
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
          if (this.onChangeCallback) this.onChangeCallback();
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
      });

      bar.querySelector('[data-act="add-row"]').addEventListener('click', () => {
        const cols = tbl.rows[0]?.length || 3;
        tbl.rows.push(Array(cols).fill(''));
        this.renderTables(containerEl, tables, side);
        if (this.onChangeCallback) this.onChangeCallback();
      });

      bar.querySelector('[data-act="add-col"]').addEventListener('click', () => {
        tbl.rows.forEach(r => r.push(''));
        this.renderTables(containerEl, tables, side);
        if (this.onChangeCallback) this.onChangeCallback();
      });

      bar.querySelector('[data-act="del-tbl"]').addEventListener('click', () => {
        this._getEditor()?.removeTableById(side, tbl.id);
      });

      const tableEl = document.createElement('table');
      tbl.rows.forEach((rowArr, rIdx) => {
        const tr = document.createElement('tr');
        rowArr.forEach((cellText, cIdx) => {
          const td = document.createElement('td');
          td.contentEditable = 'true';
          td.spellcheck = false;
          td.textContent = cellText;

          td.addEventListener('focus', () => {
            const editor = this._getEditor();
            if (editor) {
              editor.setActiveSide(side);
              editor.activeFocusEl = td;
              editor.ensureCursorInComfortZone();
            }
          });

          td.addEventListener('input', () => {
            tbl.rows[rIdx][cIdx] = td.textContent;
            if (this.onChangeCallback) this.onChangeCallback();
          });

          tr.appendChild(td);
        });
        tableEl.appendChild(tr);
      });

      card.appendChild(bar);
      card.appendChild(tableEl);
      containerEl.appendChild(card);
    });
  },

  renderFreeTexts(containerEl, freeTexts = [], side = 'left') {
    if (!containerEl) return;
    containerEl.innerHTML = '';

    freeTexts.forEach(ft => {
      const pageW = containerEl.offsetWidth || 560;
      const safeX = Math.max(14, Math.min(pageW - 115, ft.x ?? 80));
      ft.x = safeX;

      const card = document.createElement('div');
      card.className = 'free-text-card';
      card.style.left = `${safeX}px`;
      card.style.top = `${ft.y ?? 120}px`;
      card.style.maxWidth = `${Math.max(100, pageW - safeX - 18)}px`;

      card.addEventListener('click', (e) => {
        if (this.activeTool === 'eraser') {
          e.stopPropagation();
          this._getEditor()?.removeFreeTextById(side, ft.id);
        }
      });

      const bar = document.createElement('div');
      bar.className = 'free-text-bar';
      bar.innerHTML = `<span>⠿ kéo</span><button type="button" class="free-text-del" title="Xóa">✕</button>`;

      bar.addEventListener('pointerdown', (e) => {
        if (e.target.closest('button')) return;
        e.preventDefault();
        const startX = e.clientX;
        const startY = e.clientY;
        const origX = ft.x ?? 80;
        const origY = ft.y ?? 120;

        const onMove = (mv) => {
          const scale = this._getEditor()?.getZoomScale() || 1;
          const maxW = containerEl.offsetWidth || 560;
          const maxH = containerEl.offsetHeight || 860;
          ft.x = Math.round(Math.max(14, Math.min(maxW - 115, origX + (mv.clientX - startX) / scale)));
          ft.y = Math.round(Math.max(14, Math.min(maxH - 36, origY + (mv.clientY - startY) / scale)));
          card.style.left = `${ft.x}px`;
          card.style.top = `${ft.y}px`;
          card.style.maxWidth = `${Math.max(100, maxW - ft.x - 18)}px`;
        };

        const onUp = () => {
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
          if (this.onChangeCallback) this.onChangeCallback();
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
      });

      bar.querySelector('.free-text-del').addEventListener('click', (e) => {
        e.stopPropagation();
        this._getEditor()?.removeFreeTextById(side, ft.id);
      });

      const body = document.createElement('div');
      body.className = 'free-text-body';
      body.contentEditable = 'true';
      body.spellcheck = false;
      body.dataset.ftId = ft.id;
      body.textContent = ft.text || '';

      body.addEventListener('focus', () => {
        const editor = this._getEditor();
        if (editor) {
          editor.setActiveSide(side);
          editor.activeFocusEl = body;
          editor.ensureCursorInComfortZone();
        }
      });

      body.addEventListener('input', () => {
        ft.text = body.textContent;
        if (this.onChangeCallback) this.onChangeCallback();
      });

      body.addEventListener('blur', () => {
        if (!body.textContent.trim()) {
          this._getEditor()?.removeFreeTextById(side, ft.id);
        }
      });

      card.appendChild(bar);
      card.appendChild(body);
      containerEl.appendChild(card);
    });
  }
};

/* =========================================================================
   FREEHAND SKETCHPAD MODAL (ALT + V -> DRAW -> IMPORT AS IMAGE)
   ========================================================================= */
const NotebookSketchModal = {
  backdrop: null,
  canvas: null,
  ctx: null,
  wrap: null,
  getEditor: null,

  tool: 'pen',
  color: '#153b75',
  size: 3.5,
  logicalW: 0,
  logicalH: 0,
  isDrawing: false,
  points: [],
  startPt: null,
  baseSnapshot: null,
  undoStack: [],
  redoStack: [],
  MAX_HISTORY: 30,

  init(getEditorFn) {
    this.getEditor = getEditorFn;
    this.backdrop = document.getElementById('sketchpadBackdrop');
    this.canvas = document.getElementById('freehandSketchCanvas');
    this.wrap = document.getElementById('sketchpadCanvasWrap');
    if (!this.backdrop || !this.canvas) return;

    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    this._bindControls();
    this._bindCanvasEvents();

    if (window.ResizeObserver && this.wrap) {
      new ResizeObserver(() => {
        if (this.isOpen()) this._resizeCanvas(false);
      }).observe(this.wrap);
    }
  },

  isOpen() {
    return Boolean(this.backdrop && this.backdrop.classList.contains('open'));
  },

  open() {
    if (!this.backdrop || !this.canvas) return;
    document.activeElement?.blur();
    this.backdrop.classList.add('open');

    requestAnimationFrame(() => {
      this._resizeCanvas(true);
    });
  },

  close() {
    if (!this.backdrop) return;
    this.isDrawing = false;
    this.backdrop.classList.remove('open');
  },

  _resizeCanvas(resetContent = false) {
    if (!this.canvas || !this.wrap || !this.ctx) return;
    const w = this.wrap.clientWidth;
    const h = this.wrap.clientHeight;
    if (!w || !h) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let tempCanvas = null;
    const prevW = this.logicalW;
    const prevH = this.logicalH;

    if (!resetContent && this.canvas.width > 0 && this.canvas.height > 0 && prevW > 0 && prevH > 0) {
      if (w === prevW && h === prevH) return;
      tempCanvas = document.createElement('canvas');
      tempCanvas.width = this.canvas.width;
      tempCanvas.height = this.canvas.height;
      tempCanvas.getContext('2d').drawImage(this.canvas, 0, 0);
    }

    this.logicalW = w;
    this.logicalH = h;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    if (resetContent) {
      this.ctx.clearRect(0, 0, w, h);
      this.undoStack = [];
      this.redoStack = [];
      this._pushHistory();
    } else if (tempCanvas) {
      this.ctx.drawImage(tempCanvas, 0, 0, prevW, prevH);
    }
  },

  _pushHistory() {
    if (!this.canvas || !this.ctx) return;
    try {
      const snap = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      this.undoStack.push(snap);
      if (this.undoStack.length > this.MAX_HISTORY) {
        this.undoStack.shift();
      }
      this.redoStack = [];
    } catch (err) {
      console.warn('Sketch history error:', err);
    }
  },

  undo() {
    if (this.undoStack.length <= 1 || !this.ctx) return;
    const current = this.undoStack.pop();
    this.redoStack.push(current);
    const prev = this.undoStack[this.undoStack.length - 1];
    if (prev) {
      this.ctx.putImageData(prev, 0, 0);
    }
  },

  redo() {
    if (this.redoStack.length === 0 || !this.ctx) return;
    const next = this.redoStack.pop();
    this.undoStack.push(next);
    this.ctx.putImageData(next, 0, 0);
  },

  clear() {
    if (!this.canvas || !this.ctx) return;
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.clearRect(0, 0, this.logicalW, this.logicalH);
    this.ctx.restore();
    this._pushHistory();
  },

  _bindControls() {
    document.querySelectorAll('[data-sketch-tool]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.tool = btn.dataset.sketchTool;
        document.querySelectorAll('[data-sketch-tool]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (this.canvas) {
          this.canvas.style.cursor = this.tool === 'eraser' ? 'cell' : 'crosshair';
        }
      });
    });

    document.querySelectorAll('[data-sketch-color]').forEach(dot => {
      dot.addEventListener('click', () => {
        this.color = dot.dataset.sketchColor;
        document.querySelectorAll('[data-sketch-color]').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        if (this.tool === 'eraser') {
          this.tool = 'pen';
          document.querySelectorAll('[data-sketch-tool]').forEach(b => {
            b.classList.toggle('active', b.dataset.sketchTool === 'pen');
          });
        }
      });
    });

    document.querySelectorAll('[data-sketch-size]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.size = parseFloat(btn.dataset.sketchSize);
        document.querySelectorAll('[data-sketch-size]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    document.getElementById('btnSketchGrid')?.addEventListener('click', (e) => {
      this.wrap?.classList.toggle('show-grid');
      e.currentTarget.classList.toggle('active');
    });

    document.getElementById('btnSketchUndo')?.addEventListener('click', () => this.undo());
    document.getElementById('btnSketchRedo')?.addEventListener('click', () => this.redo());
    document.getElementById('btnSketchClear')?.addEventListener('click', () => this.clear());
    document.getElementById('btnSketchCancel')?.addEventListener('click', () => this.close());
    document.getElementById('btnSketchImport')?.addEventListener('click', () => this.importToPage());

    this.backdrop.addEventListener('click', (e) => {
      if (e.target === this.backdrop) this.close();
    });
  },

  _getCanvasPoint(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = rect.width ? (this.logicalW / rect.width) : 1;
    const scaleY = rect.height ? (this.logicalH / rect.height) : 1;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  },

  _applyStrokeStyle(ctx) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (this.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = Math.max(14, this.size * 4.5);
    } else if (this.tool === 'highlighter') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.34;
      ctx.strokeStyle = this.color;
      ctx.lineWidth = Math.max(12, this.size * 3.6);
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.strokeStyle = this.color;
      ctx.fillStyle = this.color;
      ctx.lineWidth = this.size;
    }
  },

  _drawGeometricPreview(ctx, tool, p1, p2) {
    ctx.save();
    this._applyStrokeStyle(ctx);
    ctx.beginPath();

    if (tool === 'line') {
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    } else if (tool === 'rect') {
      ctx.strokeRect(
        Math.min(p1.x, p2.x),
        Math.min(p1.y, p2.y),
        Math.abs(p2.x - p1.x),
        Math.abs(p2.y - p1.y)
      );
    } else if (tool === 'oval') {
      const cx = (p1.x + p2.x) / 2;
      const cy = (p1.y + p2.y) / 2;
      const rx = Math.abs(p2.x - p1.x) / 2;
      const ry = Math.abs(p2.y - p1.y) / 2;
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (tool === 'arrow') {
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      const headLen = Math.max(12, this.size * 3.5);
      ctx.beginPath();
      ctx.moveTo(p2.x, p2.y);
      ctx.lineTo(
        p2.x - headLen * Math.cos(angle - Math.PI / 6),
        p2.y - headLen * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        p2.x - headLen * Math.cos(angle + Math.PI / 6),
        p2.y - headLen * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  },

  _bindCanvasEvents() {
    this.canvas.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      this.canvas.setPointerCapture(e.pointerId);
      this.isDrawing = true;
      const pt = this._getCanvasPoint(e);
      this.startPt = pt;
      this.points = [pt];

      if (['line', 'arrow', 'rect', 'oval'].includes(this.tool)) {
        this.baseSnapshot = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      } else {
        this.ctx.save();
        this._applyStrokeStyle(this.ctx);
        this.ctx.beginPath();
        this.ctx.arc(pt.x, pt.y, this.ctx.lineWidth / 2, 0, Math.PI * 2);
        this.ctx.fillStyle = this.tool === 'eraser' ? 'rgba(0,0,0,1)' : this.color;
        this.ctx.fill();
        this.ctx.restore();
      }
    });

    this.canvas.addEventListener('pointermove', (e) => {
      if (!this.isDrawing) return;
      const pt = this._getCanvasPoint(e);

      if (['line', 'arrow', 'rect', 'oval'].includes(this.tool)) {
        if (this.baseSnapshot) {
          this.ctx.putImageData(this.baseSnapshot, 0, 0);
        }
        this._drawGeometricPreview(this.ctx, this.tool, this.startPt, pt);
        return;
      }

      this.points.push(pt);
      const len = this.points.length;
      if (len < 2) return;

      this.ctx.save();
      this._applyStrokeStyle(this.ctx);
      this.ctx.beginPath();

      if (len === 2) {
        this.ctx.moveTo(this.points[0].x, this.points[0].y);
        this.ctx.lineTo(this.points[1].x, this.points[1].y);
      } else {
        const prev = this.points[len - 2];
        const curr = this.points[len - 1];
        const prevMid = {
          x: (this.points[len - 3].x + prev.x) / 2,
          y: (this.points[len - 3].y + prev.y) / 2
        };
        const currMid = {
          x: (prev.x + curr.x) / 2,
          y: (prev.y + curr.y) / 2
        };
        this.ctx.moveTo(prevMid.x, prevMid.y);
        this.ctx.quadraticCurveTo(prev.x, prev.y, currMid.x, currMid.y);
      }

      this.ctx.stroke();
      this.ctx.restore();
    });

    const finishStroke = (e) => {
      if (!this.isDrawing) return;
      this.isDrawing = false;
      try {
        if (e.pointerId !== undefined && this.canvas.hasPointerCapture(e.pointerId)) {
          this.canvas.releasePointerCapture(e.pointerId);
        }
      } catch {}
      this.baseSnapshot = null;
      this.points = [];
      this._pushHistory();
    };

    this.canvas.addEventListener('pointerup', finishStroke);
    this.canvas.addEventListener('pointercancel', finishStroke);
  },

  async importToPage() {
    if (!this.canvas || !this.ctx) return;

    const w = this.canvas.width;
    const h = this.canvas.height;
    const imgData = this.ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    let minX = w, minY = h, maxX = -1, maxY = -1;
    for (let y = 0; y < h; y++) {
      const rowOffset = y * w * 4;
      for (let x = 0; x < w; x++) {
        if (data[rowOffset + x * 4 + 3] > 0) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX < minX || maxY < minY) {
      this.close();
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pad = Math.round(14 * dpr);
    const sx = Math.max(0, minX - pad);
    const sy = Math.max(0, minY - pad);
    const sw = Math.min(w - sx, (maxX - minX + 1) + pad * 2);
    const sh = Math.min(h - sy, (maxY - minY + 1) + pad * 2);

    const outCanvas = document.createElement('canvas');
    outCanvas.width = sw;
    outCanvas.height = sh;
    const outCtx = outCanvas.getContext('2d');
    outCtx.drawImage(this.canvas, sx, sy, sw, sh, 0, 0, sw, sh);

    const logicalW = Math.round(sw / dpr);
    const targetPageWidth = Math.max(110, Math.min(320, Math.round(logicalW * 0.65)));

    outCanvas.toBlob(async (blob) => {
      const editor = this.getEditor ? this.getEditor() : null;
      if (blob && editor) {
        const fileUrl = await editor._processImageBlob(blob);
        if (fileUrl) {
          editor.addImageToPage(fileUrl, targetPageWidth);
        }
      }
      this.close();
    }, 'image/png');
  }
};