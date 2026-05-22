'use strict'

const {
  app, BrowserWindow, Tray, Menu,
  globalShortcut, ipcMain, screen, nativeImage,
} = require('electron')
const path = require('path')
const fs = require('fs')
const { deflateSync } = require('zlib')

const isDev = process.env.NODE_ENV === 'development'
const COMPACT  = { width: 300, height: 72 }
const EXPANDED = { width: 320, height: 500 }
const MARGIN   = 16
const SHORTCUT = 'CommandOrControl+Shift+A'

let win        = null
let tray       = null
let configPath = null
let config     = {}
let compactPos = null  // position saved before expanding, restored on collapse

// ── Persistent config (plain JSON, no extra dep) ──────────────────────────────

function loadConfig() {
  try { config = JSON.parse(fs.readFileSync(configPath, 'utf8')) } catch { config = {} }
}

function saveConfig(key, value) {
  config[key] = value
  try { fs.writeFileSync(configPath, JSON.stringify(config)) } catch {}
}

// ── Tray icon: purple circle PNG built at runtime ─────────────────────────────

const CRC_TBL = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
    t[i] = c
  }
  return t
})()

function crc32(buf) {
  let c = -1
  for (const b of buf) c = (c >>> 8) ^ CRC_TBL[(c ^ b) & 255]
  return (c ^ -1) >>> 0
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const tb  = Buffer.from(type)
  const crcVal = crc32(Buffer.concat([tb, data]))
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crcVal)
  return Buffer.concat([len, tb, data, crcBuf])
}

function makePurpleCirclePng(size = 16) {
  const rows = []
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4)
    row[0] = 0  // filter: None
    for (let x = 0; x < size; x++) {
      const dx = x - size / 2 + 0.5
      const dy = y - size / 2 + 0.5
      const alpha = (dx * dx + dy * dy) <= ((size / 2 - 0.5) ** 2) ? 255 : 0
      const o = 1 + x * 4
      row[o] = 0x8B; row[o + 1] = 0x5C; row[o + 2] = 0xF6; row[o + 3] = alpha
    }
    rows.push(row)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 6  // 8-bit RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(Buffer.concat(rows))),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

// ── Window ────────────────────────────────────────────────────────────────────

function getDefaultPos(size) {
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize
  return { x: sw - size.width - MARGIN, y: sh - size.height - MARGIN }
}

function createWindow() {
  const pos = config.windowPos || getDefaultPos(COMPACT)

  win = new BrowserWindow({
    width:       COMPACT.width,
    height:      COMPACT.height,
    x:           pos.x,
    y:           pos.y,
    alwaysOnTop: true,
    frame:       false,
    transparent: true,
    resizable:   false,
    skipTaskbar: true,
    hasShadow:   false,
    webPreferences: {
      preload:          path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration:  false,
      webSecurity:      false, // allow fetch to localhost:3000 without CORS issues
    },
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  win.on('moved', () => {
    if (!win) return
    const [x, y] = win.getPosition()
    saveConfig('windowPos', { x, y })
  })
}

// ── Tray ──────────────────────────────────────────────────────────────────────

function createTray() {
  try {
    const icon = nativeImage.createFromBuffer(makePurpleCirclePng(16))
    tray = new Tray(icon)
    tray.setToolTip('ARIA – Assistente Pessoal')
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: 'Mostrar / Ocultar', click: toggleWindow },
      { type: 'separator' },
      { label: 'Sair', click: () => app.quit() },
    ]))
    tray.on('click', toggleWindow)
  } catch (err) {
    console.warn('[aria] tray failed:', err.message)
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toggleWindow() {
  if (!win) return
  if (win.isVisible()) { win.hide() } else { win.show(); win.focus() }
}

// ── IPC ───────────────────────────────────────────────────────────────────────

ipcMain.on('set-expanded', (_, expanded) => {
  if (!win) return
  // On Windows, resizable:false blocks programmatic shrink — unlock briefly
  win.setResizable(true)
  if (expanded) {
    const [x, y] = win.getPosition()
    compactPos   = { x, y }
    const newY   = Math.max(0, y + COMPACT.height - EXPANDED.height)
    win.setBounds({ x, y: newY, width: EXPANDED.width, height: EXPANDED.height })
  } else {
    const pos = compactPos || getDefaultPos(COMPACT)
    win.setBounds({ x: pos.x, y: pos.y, width: COMPACT.width, height: COMPACT.height })
  }
  win.setResizable(false)
})

ipcMain.handle('get-config', (_, key) => config[key])
ipcMain.on('set-config', (_, key, value) => saveConfig(key, value))

// ── Lifecycle ─────────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  configPath = path.join(app.getPath('userData'), 'aria-config.json')
  loadConfig()
  createWindow()
  createTray()
  globalShortcut.register(SHORTCUT, toggleWindow)
})

app.on('will-quit', () => globalShortcut.unregisterAll())
app.on('window-all-closed', () => { /* stay in tray */ })
