const NotebookStore = {
  LEGACY_STORAGE_KEY: 'the_notebook_books_v1',
  INDEX_KEY: 'the_notebook_index_v2',
  BOOK_CHUNK_PREFIX: 'the_notebook_chunk_',
  CHUNK_SIZE: 10,
  DESK_WIDGETS_KEY: 'the_notebook_desk_widgets_v1',

  _cache: null,
  _migrated: false,
  _deskMigrated: false,

  _isDesktop() {
    return Boolean(window.electronAPI && typeof window.electronAPI.readAllBooks === 'function');
  },

  _extractSummaryFields(bookObj) {
    const pages = Array.isArray(bookObj.pages) ? bookObj.pages : [];
    let writtenCount = 0;
    const previewLines = [];

    if (pages.length > 0) {
      for (const p of pages) {
        if (!Array.isArray(p?.lines)) continue;
        for (const line of p.lines) {
          if (line && line.trim() !== '') {
            writtenCount++;
            if (previewLines.length < 5) {
              previewLines.push(line);
            }
          }
        }
      }
    } else if (Array.isArray(bookObj.lines)) {
      for (const line of bookObj.lines) {
        if (line && line.trim() !== '') {
          writtenCount++;
          if (previewLines.length < 5) {
            previewLines.push(line);
          }
        }
      }
    }

    return {
      writtenCount: typeof bookObj.writtenCount === 'number' ? bookObj.writtenCount : writtenCount,
      previewLines: Array.isArray(bookObj.previewLines) ? bookObj.previewLines : previewLines,
      pageCount: pages.length || bookObj.pageCount || 2
    };
  },

  _readWebIndex() {
    this._migrateWebStorageIfNeeded();
    try {
      const raw = localStorage.getItem(this.INDEX_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  },

  _writeWebIndex(indexList) {
    localStorage.setItem(this.INDEX_KEY, JSON.stringify(indexList));
  },

  _chunkKey(bookId, chunkIdx) {
    return `${this.BOOK_CHUNK_PREFIX}${bookId}_${chunkIdx}`;
  },

  _writeWebBookChunks(bookId, pages, dirtyIndices = null, prevPageCount = 0) {
    const totalPages = Array.isArray(pages) ? pages.length : 0;
    const totalChunks = Math.ceil(totalPages / this.CHUNK_SIZE);
    const prevChunks = Math.ceil(prevPageCount / this.CHUNK_SIZE);

    if (!dirtyIndices) {
      for (let c = 0; c < totalChunks; c++) {
        const slice = pages.slice(c * this.CHUNK_SIZE, (c + 1) * this.CHUNK_SIZE);
        localStorage.setItem(this._chunkKey(bookId, c), JSON.stringify(slice));
      }
    } else {
      const dirtyChunkSet = new Set();
      dirtyIndices.forEach(pIdx => {
        if (pIdx >= 0 && pIdx < totalPages) {
          dirtyChunkSet.add(Math.floor(pIdx / this.CHUNK_SIZE));
        }
      });
      dirtyChunkSet.forEach(c => {
        const slice = pages.slice(c * this.CHUNK_SIZE, (c + 1) * this.CHUNK_SIZE);
        localStorage.setItem(this._chunkKey(bookId, c), JSON.stringify(slice));
      });
    }

    for (let c = totalChunks; c < prevChunks; c++) {
      localStorage.removeItem(this._chunkKey(bookId, c));
    }
  },

  _readWebBookPages(bookId, pageCount) {
    const totalChunks = Math.max(1, Math.ceil((pageCount || 2) / this.CHUNK_SIZE));
    const pages = [];
    for (let c = 0; c < totalChunks; c++) {
      try {
        const raw = localStorage.getItem(this._chunkKey(bookId, c));
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            pages.push(...parsed);
          }
        }
      } catch (err) {
        console.warn(`Lỗi đọc chunk ${c} của sổ ${bookId}:`, err);
      }
    }
    return pages;
  },

  _deleteWebBookChunks(bookId, pageCount = 20) {
    const maxChunks = Math.max(4, Math.ceil(pageCount / this.CHUNK_SIZE) + 2);
    for (let c = 0; c < maxChunks; c++) {
      localStorage.removeItem(this._chunkKey(bookId, c));
    }
  },

  _migrateWebStorageIfNeeded() {
    if (this._migrated || this._isDesktop()) return;
    this._migrated = true;

    try {
      const rawLegacy = localStorage.getItem(this.LEGACY_STORAGE_KEY);
      if (!rawLegacy) return;

      const legacyBooks = JSON.parse(rawLegacy);
      if (Array.isArray(legacyBooks) && legacyBooks.length > 0) {
        const rawIdx = localStorage.getItem(this.INDEX_KEY);
        const indexList = rawIdx ? JSON.parse(rawIdx) : [];
        const existingIds = new Set(indexList.map(b => b.id));

        legacyBooks.forEach(b => {
          if (!b || !b.id || existingIds.has(b.id)) return;
          const pages = Array.isArray(b.pages) && b.pages.length >= 2
            ? b.pages
            : [
                { title: b.title || '', date: b.date || '', lines: b.lines || Array(23).fill(''), shapes: [], tables: [] },
                { title: '', date: '', lines: Array(23).fill(''), shapes: [], tables: [] }
              ];
          const summary = this._extractSummaryFields({ ...b, pages });
          indexList.push({
            id: b.id,
            title: b.title || 'Untitled Volume',
            author: b.author || 'Anonymous',
            date: b.date || '',
            design: b.design || null,
            ink_color: b.ink_color || '#153b75',
            font_index: b.font_index || 0,
            writtenCount: summary.writtenCount,
            previewLines: summary.previewLines,
            pageCount: pages.length,
            created_at: b.created_at || new Date().toISOString(),
            updated_at: b.updated_at || new Date().toISOString()
          });
          this._writeWebBookChunks(b.id, pages, null, 0);
        });

        this._writeWebIndex(indexList);
      }

      localStorage.removeItem(this.LEGACY_STORAGE_KEY);
    } catch (err) {
      console.warn('Lỗi di chuyển dữ liệu web sang phân mảnh v2:', err);
    }
  },

  _readAllDesktop() {
    if (!this._cache) {
      const diskBooks = window.electronAPI.readAllBooks() || [];
      this._cache = Array.isArray(diskBooks) ? diskBooks : [];
    }

    if (!this._migrated) {
      this._migrated = true;
      try {
        const rawLegacy = localStorage.getItem(this.LEGACY_STORAGE_KEY);
        if (rawLegacy) {
          const legacyBooks = JSON.parse(rawLegacy);
          if (Array.isArray(legacyBooks) && legacyBooks.length > 0) {
            const existingIds = new Set(this._cache.map(b => b.id));
            const baseTime = Date.now();
            legacyBooks.forEach((b, idx) => {
              if (b && b.id && !existingIds.has(b.id)) {
                const migratedBook = {
                  ...b,
                  created_at: b.created_at || new Date(baseTime - idx * 1000).toISOString()
                };
                window.electronAPI.saveBook(migratedBook);
                this._cache.push(migratedBook);
              }
            });
          }
          localStorage.removeItem(this.LEGACY_STORAGE_KEY);
        }
      } catch (err) {
        console.warn('Lỗi di chuyển dữ liệu cũ sang JSON:', err);
      }
    }

    return this._cache;
  },

  /* ================= DESK WIDGETS (CALENDAR & TODO) STORAGE ================= */
  loadDeskWidgets(defaultTodosFactory) {
    const fallbackTodos = typeof defaultTodosFactory === 'function' ? defaultTodosFactory() : [[], []];
    const normalize = (parsed) => ({
      events: parsed && typeof parsed.events === 'object' && parsed.events !== null ? parsed.events : {},
      todos: Array.isArray(parsed?.todos) && parsed.todos.length === 2 ? parsed.todos : fallbackTodos
    });

    if (this._isDesktop() && typeof window.electronAPI.readDeskWidgets === 'function') {
      let diskData = window.electronAPI.readDeskWidgets();

      if (!this._deskMigrated) {
        this._deskMigrated = true;
        try {
          const rawLegacy = localStorage.getItem(this.DESK_WIDGETS_KEY);
          if (rawLegacy) {
            const legacyParsed = JSON.parse(rawLegacy);
            if (!diskData && legacyParsed) {
              diskData = normalize(legacyParsed);
              window.electronAPI.saveDeskWidgets(diskData);
            }
            localStorage.removeItem(this.DESK_WIDGETS_KEY);
          }
        } catch (err) {
          console.warn('Lỗi di chuyển dữ liệu lịch/todo sang JSON:', err);
        }
      }

      if (diskData) {
        return normalize(diskData);
      }

      const initial = normalize(null);
      window.electronAPI.saveDeskWidgets(initial);
      return initial;
    }

    try {
      const raw = localStorage.getItem(this.DESK_WIDGETS_KEY);
      if (raw) {
        return normalize(JSON.parse(raw));
      }
    } catch {}
    return normalize(null);
  },

  saveDeskWidgets(deskData) {
    if (this._isDesktop() && typeof window.electronAPI.saveDeskWidgets === 'function') {
      window.electronAPI.saveDeskWidgets(deskData);
      return;
    }
    localStorage.setItem(this.DESK_WIDGETS_KEY, JSON.stringify(deskData));
  },

  generateRandomDesign(existingBooks = [], tiltMode = 'none') {
    const lastDesign = existingBooks[0]?.design;
    let paletteIdx, patternIdx, fontIdx, height;

    do {
      paletteIdx = Math.floor(Math.random() * 15);
      patternIdx = Math.floor(Math.random() * 7);
      fontIdx = Math.floor(Math.random() * 5);
    } while (
      lastDesign &&
      lastDesign.paletteIdx === paletteIdx &&
      lastDesign.patternIdx === patternIdx &&
      lastDesign.fontIdx === fontIdx
    );

    do {
      height = Math.floor(Math.random() * (390 - 255 + 1)) + 255;
    } while (lastDesign && Math.abs((lastDesign.height || 336) - height) < 26);

    const deg = +(5.8 + Math.random() * 2.7).toFixed(1);
    const tilt = tiltMode === 'left' ? -deg : (tiltMode === 'right' ? deg : 0);
    const widths = [42, 48, 54, 60, 68];

    return {
      paletteIdx,
      patternIdx,
      fontIdx,
      height,
      width: widths[Math.floor(Math.random() * widths.length)],
      tilt
    };
  },

  listNotes() {
    if (this._isDesktop()) {
      return this._readAllDesktop().map(b => {
        const summary = this._extractSummaryFields(b);
        return {
          id: b.id,
          title: b.title || 'Untitled Volume',
          author: b.author || 'Unknown Author',
          date: b.date || '',
          design: b.design || null,
          writtenCount: summary.writtenCount,
          previewLines: summary.previewLines,
          pageCount: summary.pageCount,
          updated_at: b.updated_at || ''
        };
      });
    }

    return this._readWebIndex().map(meta => ({
      id: meta.id,
      title: meta.title || 'Untitled Volume',
      author: meta.author || 'Unknown Author',
      date: meta.date || '',
      design: meta.design || null,
      writtenCount: meta.writtenCount || 0,
      previewLines: Array.isArray(meta.previewLines) ? meta.previewLines : [],
      pageCount: meta.pageCount || 2,
      updated_at: meta.updated_at || ''
    }));
  },

  loadNote(noteId) {
    if (this._isDesktop()) {
      const found = this._readAllDesktop().find(b => b.id === noteId);
      if (!found) return null;
      if (!Array.isArray(found.lines) && Array.isArray(found.pages)) {
        const allLines = found.pages.flatMap(p => (p.lines || []).filter(l => l && l.trim() !== ''));
        return { ...found, lines: allLines };
      }
      return found;
    }

    const indexList = this._readWebIndex();
    const meta = indexList.find(b => b.id === noteId);
    if (!meta) return null;

    const pages = this._readWebBookPages(noteId, meta.pageCount || 2);
    const allLines = pages.flatMap(p => (p.lines || []).filter(l => l && l.trim() !== ''));

    return {
      ...meta,
      pages: pages.length >= 2 ? pages : [
        { title: meta.title || '', date: meta.date || '', lines: Array(23).fill(''), shapes: [], tables: [] },
        { title: '', date: '', lines: Array(23).fill(''), shapes: [], tables: [] }
      ],
      lines: allLines
    };
  },

  createBook(title = 'Untitled Volume', author = 'Anonymous', tiltMode = 'none') {
    const now = new Date();
    const isoNow = now.toISOString();
    const id = 'book_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const defaultDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const existing = this.listNotes();
    const initialPages = [
      { title, date: defaultDate, lines: Array(23).fill(''), shapes: [], tables: [] },
      { title: '', date: '', lines: Array(23).fill(''), shapes: [], tables: [] }
    ];

    const newBook = {
      id,
      title,
      author,
      date: defaultDate,
      design: this.generateRandomDesign(existing, tiltMode),
      ink_color: '#153b75',
      font_index: 0,
      writtenCount: 0,
      previewLines: [],
      pageCount: 2,
      pages: initialPages,
      created_at: isoNow,
      updated_at: isoNow
    };

    if (this._isDesktop()) {
      window.electronAPI.saveBook(newBook);
      const list = this._readAllDesktop();
      list.unshift(newBook);
      return newBook;
    }

    const indexList = this._readWebIndex();
    const { pages, ...metaOnly } = newBook;
    indexList.unshift(metaOnly);
    this._writeWebIndex(indexList);
    this._writeWebBookChunks(id, initialPages, null, 0);
    return newBook;
  },

  updateBookMeta(noteId, newTitle, newAuthor, newDesign = null) {
    const nowIso = new Date().toISOString();

    if (this._isDesktop()) {
      const books = this._readAllDesktop();
      const idx = books.findIndex(b => b.id === noteId);
      if (idx === -1) return;
      const updated = {
        ...books[idx],
        title: newTitle,
        author: newAuthor,
        design: newDesign ? newDesign : books[idx].design,
        updated_at: nowIso
      };
      books[idx] = updated;
      window.electronAPI.saveBook(updated);
      return;
    }

    const indexList = this._readWebIndex();
    const idx = indexList.findIndex(b => b.id === noteId);
    if (idx === -1) return;
    indexList[idx] = {
      ...indexList[idx],
      title: newTitle,
      author: newAuthor,
      design: newDesign ? newDesign : indexList[idx].design,
      updated_at: nowIso
    };
    this._writeWebIndex(indexList);
  },

  saveNoteDelta(noteId, metaPatch, allPages, dirtyIndicesSet) {
    const nowIso = new Date().toISOString();
    const summary = this._extractSummaryFields({ pages: allPages });

    if (this._isDesktop()) {
      const books = this._readAllDesktop();
      const idx = books.findIndex(b => b.id === noteId);
      if (idx !== -1) {
        const existing = books[idx];
        const nextPages = Array.isArray(existing.pages) && existing.pages.length === allPages.length
          ? existing.pages.slice()
          : allPages.slice();

        dirtyIndicesSet.forEach(pIdx => {
          if (pIdx >= 0 && pIdx < allPages.length) {
            nextPages[pIdx] = allPages[pIdx];
          }
        });

        const bookToSave = {
          ...existing,
          ...metaPatch,
          writtenCount: summary.writtenCount,
          previewLines: summary.previewLines,
          pageCount: allPages.length,
          pages: nextPages,
          updated_at: nowIso
        };
        delete bookToSave.lines; // Tránh trùng lặp toàn bộ văn bản ở cấp gốc
        books[idx] = bookToSave;
        window.electronAPI.saveBook(bookToSave);
      } else {
        this.saveNote({ id: noteId, ...metaPatch, pages: allPages });
      }
      return;
    }

    const indexList = this._readWebIndex();
    const idx = indexList.findIndex(b => b.id === noteId);
    const prevPageCount = idx !== -1 ? (indexList[idx].pageCount || 2) : 0;

    const updatedMeta = idx !== -1
      ? {
          ...indexList[idx],
          ...metaPatch,
          writtenCount: summary.writtenCount,
          previewLines: summary.previewLines,
          pageCount: allPages.length,
          updated_at: nowIso
        }
      : {
          id: noteId,
          title: metaPatch.title || 'Untitled Volume',
          author: 'Anonymous',
          date: metaPatch.date || '',
          design: this.generateRandomDesign(indexList),
          ink_color: metaPatch.ink_color || '#153b75',
          font_index: metaPatch.font_index || 0,
          writtenCount: summary.writtenCount,
          previewLines: summary.previewLines,
          pageCount: allPages.length,
          created_at: nowIso,
          updated_at: nowIso
        };

    if (idx !== -1) indexList[idx] = updatedMeta;
    else indexList.unshift(updatedMeta);

    this._writeWebIndex(indexList);
    this._writeWebBookChunks(
      noteId,
      allPages,
      idx !== -1 ? dirtyIndicesSet : null,
      prevPageCount
    );
  },

  saveNote(noteData) {
    const pages = Array.isArray(noteData.pages) ? noteData.pages : [];
    const allIndices = new Set(pages.map((_, i) => i));
    const { pages: _p, lines: _l, ...metaPatch } = noteData;
    this.saveNoteDelta(noteData.id, metaPatch, pages, allIndices);
  },

  deleteNote(noteId) {
    if (this._isDesktop()) {
      window.electronAPI.deleteBook(noteId);
      this._cache = this._readAllDesktop().filter(b => b.id !== noteId);
      return;
    }

    const indexList = this._readWebIndex();
    const target = indexList.find(b => b.id === noteId);
    this._deleteWebBookChunks(noteId, target?.pageCount || 20);
    this._writeWebIndex(indexList.filter(b => b.id !== noteId));
  },

  exportTxt(noteData) {
    const full = noteData.pages ? noteData : (this.loadNote(noteData.id) || noteData);
    const title = full.title || 'Untitled Volume';
    const author = full.author ? `By ${full.author}` : '';
    const date = full.date || '';
    const lines = Array.isArray(full.pages)
      ? full.pages.flatMap(p => p.lines || [])
      : [...(full.lines || [])];

    while (lines.length && lines[lines.length - 1].trim() === '') {
      lines.pop();
    }
    const header = [title, author, date].filter(Boolean).join('\n');
    const content = `${header}\n${'-'.repeat(40)}\n` + lines.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.trim() || 'note'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }
};