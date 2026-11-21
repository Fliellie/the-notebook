const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  readAllBooks: () => ipcRenderer.sendSync('books:read-all'),
  saveBook: (bookObj) => ipcRenderer.sendSync('books:save-one', bookObj),
  deleteBook: (bookId) => ipcRenderer.sendSync('books:delete-one', bookId),
  getBooksDir: () => ipcRenderer.invoke('books:get-dir'),

  savePastedImage: (arrayBuffer, ext) =>
    ipcRenderer.invoke('save-pasted-image', { buffer: arrayBuffer, ext }),
  readClipboardImage: () =>
    ipcRenderer.invoke('save-pasted-image', { fromClipboard: true }),
  deletePastedImage: (fileUrl) =>
    ipcRenderer.invoke('delete-pasted-image', fileUrl)
});