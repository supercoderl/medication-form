'use strict';

/* ============================================================
 * Trạng thái chung
 * ========================================================== */
const state = {
  doc: null,          // DOM đã parse của XML
  keyValues: {},      // { key: giá trị xem trước }
  keyLabels: {},      // { key: nhãn thân thiện (từ displayName) }
  checkboxKeys: {},   // { key: true } nếu là kiểu checkbox (value BL)
  keyFormats: {},     // { key: 'double' | 'single' } — format gốc trong code
  entries: [],        // danh sách observation cho tab SQL
  activeSrc: 'xml',   // tab nguồn đang xem: xml | xsl
};

const CHECK_TRUE = ['x', 'true', '1', 'yes', 'co', 'có', 'checked', '✓', '☑'];
const KEY_RE = '#([A-Za-z][A-Za-z0-9_]*)(?:(#)|(?=[^A-Za-z0-9_]|$))';

function makeKeyRe() { return new RegExp(KEY_RE, 'g'); }
 
// Trả về { key, isDouble } từ một lần match
function parseKeyMatch(m) {
  return { key: m[1], isDouble: m[2] === '#' };
}
/* ============================================================
 * Tiện ích
 * ========================================================== */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { t.hidden = true; }, 1800);
}
function isChecked(val) {
  return CHECK_TRUE.includes(String(val || '').trim().toLowerCase());
}

/* ============================================================
 * Parse XML + bóc key (từ cả XML & XSL) + đọc entries
 * ========================================================== */
function renderFromXml() {
  const xml = $('#xmlInput').value.trim();
  const xsl = $('#xslInput').value.trim();
  const errBox = $('#xmlError');
  errBox.hidden = true;

  if (!xml) {
    errBox.textContent = 'Chưa có nội dung XML.';
    errBox.hidden = false;
    return;
  }

  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const parseErr = doc.querySelector('parsererror');
  if (parseErr) {
    errBox.textContent = 'XML không hợp lệ: ' + parseErr.textContent.replace(/\s+/g, ' ').trim();
    errBox.hidden = false;
    return;
  }

  state.doc = doc;
  scanLabelsAndCheckboxes(doc);

  // Bóc key từ CẢ xml lẫn xsl (giữ lại giá trị cũ nếu trùng)
  const found = [];
  const seen = new Set();
  [xml, xsl].forEach((text) => {
    let m;
    const re = makeKeyRe();
    while ((m = re.exec(text)) !== null) {
      const { key, isDouble } = parseKeyMatch(m);
      if (!seen.has(key)) {
        seen.add(key);
        found.push(key);
        // Ghi format lần đầu gặp (ưu tiên double nếu đã từng thấy double)
        state.keyFormats[key] = isDouble ? 'double' : 'single';
      } else if (isDouble && state.keyFormats[key] === 'single') {
        // Nâng lên double nếu tìm thấy dạng #key# ở đâu đó
        state.keyFormats[key] = 'double';
      }
    }
  });

  const newValues = {};
  const newFormats = {};
  found.forEach((k) => {
    newValues[k] = state.keyValues[k] || '';
    newFormats[k] = state.keyFormats[k] || 'single';
  });
  state.keyValues = newValues;
  state.keyFormats = newFormats;

  buildEntries(doc);
  buildKeyPanel(found);
  renderPreview();
  buildEntryList();
  toast(`Đã bóc ${found.length} key`);
}

// key -> displayName, đánh dấu key checkbox (value BL)
function scanLabelsAndCheckboxes(doc) {
  state.keyLabels = {};
  state.checkboxKeys = {};
  getByLocal(doc, 'observation').forEach((o) => {
    const code = firstByLocal(o, 'code');
    const value = firstByLocal(o, 'value');
    if (!value) return;
    const display = code ? code.getAttribute('displayName') : null;
    const type = value.getAttribute('xsi:type')
      || value.getAttributeNS('http://www.w3.org/2001/XMLSchema-instance', 'type');
    const raw = value.getAttribute('value') != null ? value.getAttribute('value') : value.textContent;
    const km = String(raw).match(makeKeyRe());
    if (km) {
      const re = makeKeyRe();
      const first = re.exec(String(raw));
      if (first) {
        const key = first[1];
        if (display) state.keyLabels[key] = display;
        if (type && /BL/i.test(type)) state.checkboxKeys[key] = true;
      }
    }
  });
}

/* ============================================================
 * Helper duyệt DOM theo localName (an toàn với namespace)
 * ========================================================== */
function getByLocal(root, name) {
  const out = [];
  const walk = (node) => {
    for (const ch of node.childNodes) {
      if (ch.nodeType === 1) {
        if (ch.localName === name) out.push(ch);
        walk(ch);
      }
    }
  };
  walk(root);
  return out;
}
function firstByLocal(root, name) { return getByLocal(root, name)[0] || null; }

/* ============================================================
 * Panel key (bên trái) — đổi TÊN key = sửa thẳng vào code
 * ========================================================== */
function buildKeyPanel(keys) {
  const list = $('#keyList');
  $('#keyCount').textContent = keys.length;
  if (!keys.length) {
    list.innerHTML = '<div class="empty-hint">Chưa có key nào. Dán XML và bấm “Render &amp; Bóc key”.</div>';
    return;
  }

  list.innerHTML = '<div class="panel-hint">Sửa ô <b>tên key</b> để đổi luôn trong code XML/XSL (copy lại được). Ô dưới là giá trị để xem trước.</div>';

  keys.forEach((key) => {
    const label = state.keyLabels[key] || '';
    const fmt = state.keyFormats[key] || 'single';
    const wrap = document.createElement('div');
    wrap.className = 'key-item';
    wrap.dataset.key = key;

    if (label) {
      const lab = document.createElement('div');
      lab.className = 'key-label';
      lab.innerHTML = `<span class="name">${escapeHtml(label)}</span>`;
      wrap.appendChild(lab);
    }

    // Hàng đổi tên key
    const renameRow = document.createElement('div');
    renameRow.className = 'key-rename';
    const nameInput = document.createElement('input');
    nameInput.className = 'key-name';
    nameInput.value = key;
    nameInput.title = 'Đổi tên key trong code';
    nameInput.addEventListener('change', () => {
      const newKey = nameInput.value.trim();
      if (!renameKey(key, newKey)) nameInput.value = key; // hoàn tác nếu không hợp lệ
    });
    nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') nameInput.blur(); });
    renameRow.innerHTML = '<span class="hash">#</span>';
    renameRow.appendChild(nameInput);
    if (fmt === 'double') {
      renameRow.insertAdjacentHTML('beforeend', '<span class="hash">#</span>');
    }
    wrap.appendChild(renameRow);

    // Hàng giá trị xem trước
    const valInput = document.createElement('input');
    valInput.className = 'key-input' + (state.checkboxKeys[key] ? ' checkbox-kind' : '');
    valInput.value = state.keyValues[key] || '';
    valInput.placeholder = state.checkboxKeys[key] ? 'X = tích chọn / để trống = bỏ' : 'Giá trị xem trước...';
    valInput.addEventListener('input', () => {
      state.keyValues[key] = valInput.value;
      renderPreview();
    });
    wrap.appendChild(valInput);

    list.appendChild(wrap);
  });
}

// Đổi tên key trong CẢ XML lẫn XSL, rồi render lại
function renameKey(oldKey, newKey) {
  if (!newKey || newKey === oldKey) return false;
  if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(newKey)) {
    toast('Tên key không hợp lệ (không chứa # khoảng trắng < >)');
    return false;
  }

  const reDouble = new RegExp('#' + escapeRegex(oldKey) + '#', 'g');
  const reSingle = new RegExp('#' + escapeRegex(oldKey) + '(?![A-Za-z0-9_#])', 'g');
  const replaceInText = (text) => {
    text = text.replace(reDouble, '#' + newKey + '#');
    text = text.replace(reSingle, '#' + newKey);
    return text;
  };

  $('#xmlInput').value = replaceInText($('#xmlInput').value);
  $('#xslInput').value = replaceInText($('#xslInput').value);

  // chuyển giá trị đã nhập sang tên mới
  if (state.keyValues[oldKey] && !state.keyValues[newKey]) {
    state.keyValues[newKey] = state.keyValues[oldKey];
  }
  if (state.keyFormats[oldKey]) {
    state.keyFormats[newKey] = state.keyFormats[oldKey];
  }
  delete state.keyValues[oldKey];
  delete state.keyFormats[oldKey];

  renderFromXml();
  toast(`#${oldKey}# → #${newKey}#`);
  return true;
}

function filterKeys(term) {
  term = term.trim().toLowerCase();
  $$('.key-item').forEach((el) => {
    const key = el.dataset.key.toLowerCase();
    const label = (state.keyLabels[el.dataset.key] || '').toLowerCase();
    el.classList.toggle('hidden', term && !key.includes(term) && !label.includes(term));
  });
}

/* ============================================================
 * Thay key bằng giá trị
 * ========================================================== */
// Cho chuỗi HTML (dùng sau khi transform bằng XSL)
function substituteInHtml(html) {
  return html.replace(makeKeyRe(), (full, key) => keyToHtml(key));
}
// Quy tắc render 1 key
function keyToHtml(key) {
  if (state.checkboxKeys[key]) {
    return `<span class="cbox">${isChecked(state.keyValues[key]) ? '☑' : '☐'}</span>`;
  }
  const v = state.keyValues[key];
  if (v !== undefined && v !== '') return `<span class="val">${escapeHtml(v)}</span>`;
  return `<span class="unfilled">#${escapeHtml(key)}${state.keyFormats[key] === 'double' ? '#' : ''}</span>`;
}
// Cho text thuần (dùng trong bộ render mặc định)
function substitute(text) {
  let out = '', last = 0, m;
  const re = makeKeyRe();
  while ((m = re.exec(text)) !== null) {
    out += escapeHtml(text.slice(last, m.index));
    out += keyToHtml(m[1]);
    last = re.lastIndex;
  }
  out += escapeHtml(text.slice(last));
  return out;
}
function resolveRawKeyValue(text) {
  const re = makeKeyRe();
  const m = re.exec(String(text));
  return m ? (state.keyValues[m[1]] || '') : text;
}

/* ============================================================
 * Render preview (khung giữa)
 *  - Có XSL hợp lệ -> transform bằng XSLTProcessor
 *  - Không -> bộ render CDA mặc định
 * ========================================================== */
function renderPreview() {
  const paper = $('#paper');
  if (!state.doc) {
    paper.innerHTML = '<div class="empty-hint">Bản xem trước sẽ hiển thị tại đây sau khi render XML.</div>';
    return;
  }

  const xsl = $('#xslInput').value.trim();
  if (xsl) {
    if (renderWithXsl(paper, xsl)) return; // thành công
    // nếu lỗi -> rơi xuống bộ mặc định bên dưới (đã hiện cảnh báo)
  }
  renderWithDefault(paper);
}

function renderWithXsl(paper, xsl) {
  try {
    const xslDoc = new DOMParser().parseFromString(xsl, 'application/xml');
    if (xslDoc.querySelector('parsererror')) throw new Error('Code XSL không hợp lệ');
    const proc = new XSLTProcessor();
    proc.importStylesheet(xslDoc);
    const frag = proc.transformToFragment(state.doc, document);
    if (!frag) throw new Error('Transform thất bại (kiểm tra namespace/template trong XSL)');
    const tmp = document.createElement('div');
    tmp.appendChild(frag);
    paper.innerHTML = substituteInHtml(tmp.innerHTML);
    return true;
  } catch (e) {
    const err = $('#xmlError');
    err.textContent = 'XSL: ' + e.message + ' — đang dùng bộ render mặc định.';
    err.hidden = false;
    return false;
  }
}

function renderWithDefault(paper) {
  const textNode = firstByLocal(state.doc, 'text');
  if (!textNode) {
    paper.innerHTML = '<div class="empty-hint">Không tìm thấy phần &lt;text&gt; trong XML.</div>';
    return;
  }
  paper.innerHTML = convertChildren(textNode);
}

function styleAttr(el) {
  const sc = el.getAttribute('styleCode') || '';
  const cls = [];
  if (/\bBold\b/i.test(sc)) cls.push('bold');
  if (/\bItalics?\b/i.test(sc)) cls.push('italic');
  if (/\bUnderline\b/i.test(sc)) cls.push('underline');
  if (/\bCenter\b/i.test(sc)) cls.push('center');
  return cls;
}
function convertChildren(node) {
  let html = '';
  for (const ch of node.childNodes) html += convertNode(ch);
  return html;
}
function convertNode(node) {
  if (node.nodeType === 3) return substitute(node.nodeValue);
  if (node.nodeType !== 1) return '';

  const name = node.localName;
  const cls = styleAttr(node);
  const clsAttr = cls.length ? ` class="${cls.join(' ')}"` : '';

  switch (name) {
    case 'paragraph':
      return `<p class="cda-p${cls.length ? ' ' + cls.join(' ') : ''}">${convertChildren(node)}</p>`;
    case 'content': {
      const sc = node.getAttribute('styleCode') || '';
      if (/checkbox/i.test(sc)) {
        return `<span class="cbox">${isChecked(resolveRawKeyValue(node.textContent)) ? '☑' : '☐'}</span>`;
      }
      return `<span${clsAttr}>${convertChildren(node)}</span>`;
    }
    case 'list': return `<ul>${convertChildren(node)}</ul>`;
    case 'item': return `<li>${convertChildren(node)}</li>`;
    case 'table': return `<table${clsAttr}>${convertChildren(node)}</table>`;
    case 'thead': return `<thead>${convertChildren(node)}</thead>`;
    case 'tbody': return `<tbody>${convertChildren(node)}</tbody>`;
    case 'tr': return `<tr>${convertChildren(node)}</tr>`;
    case 'th': return `<th${clsAttr}>${convertChildren(node)}</th>`;
    case 'td': return `<td${clsAttr}>${convertChildren(node)}</td>`;
    case 'caption': return `<caption>${convertChildren(node)}</caption>`;
    case 'br': return '<br/>';
    case 'linkHtml': return `<a href="${escapeHtml(node.getAttribute('href') || '#')}">${convertChildren(node)}</a>`;
    case 'renderMultiMedia': return '';
    default: return convertChildren(node);
  }
}

/* ============================================================
 * Tab SQL
 * ========================================================== */
function buildEntries(doc) {
  state.entries = [];
  getByLocal(doc, 'observation').forEach((o) => {
    const code = firstByLocal(o, 'code');
    const value = firstByLocal(o, 'value');
    if (!code || !value) return;
    const type = value.getAttribute('xsi:type')
      || value.getAttributeNS('http://www.w3.org/2001/XMLSchema-instance', 'type') || 'ST';
    const raw = value.getAttribute('value') != null ? value.getAttribute('value') : value.textContent.trim();
    const km = String(raw).match(/#([A-Za-z][A-Za-z0-9_]*)/);
    state.entries.push({
      code: code.getAttribute('code') || '',
      codeSystem: code.getAttribute('codeSystem') || '',
      displayName: code.getAttribute('displayName') || '',
      valueType: type.replace(/^.*:/, ''),
      rawValue: raw,
      key: km ? km[1] : null,
      include: true,
    });
  });
}

function buildEntryList() {
  const box = $('#entryList');
  $('#entryCount').textContent = state.entries.length;
  if (!state.entries.length) {
    box.innerHTML = '<div class="empty-hint">Chưa có cột nào (cần các thẻ &lt;observation&gt;).</div>';
    return;
  }
  box.innerHTML = '';
  state.entries.forEach((e, i) => {
    const row = document.createElement('label');
    row.className = 'entry-row';
    row.innerHTML = `
      <input type="checkbox" data-idx="${i}" ${e.include ? 'checked' : ''} />
      <span class="ename">${escapeHtml(e.displayName || e.code)}</span>
      <span class="ecode">${escapeHtml(e.code)}</span>`;
    row.querySelector('input').addEventListener('change', (ev) => {
      state.entries[i].include = ev.target.checked;
      syncCheckAll();
    });
    box.appendChild(row);
  });
  syncCheckAll();
}
function syncCheckAll() {
  $('#checkAll').checked = state.entries.length > 0 && state.entries.every((e) => e.include);
}
function sqlEscape(s, unicode) {
  return (unicode ? "N'" : "'") + String(s).replace(/'/g, "''") + "'";
}
function generateSql() {
  const table = $('#sqlTable').value.trim() || 'OBSERVATION';
  const valSource = $('input[name="valSource"]:checked').value;
  const sqlMode = $('input[name="sqlMode"]:checked').value;
  const unicode = $('#sqlUnicode').checked;

  const rows = state.entries.filter((e) => e.include);
  if (!rows.length) { $('#sqlOut').value = '-- Không có cột nào được chọn.'; return; }

  const cols = ['CODE', 'CODE_SYSTEM', 'DISPLAY_NAME', 'VALUE_TYPE', 'VALUE'];
  const valueFor = (e) => valSource === 'key'
    ? e.rawValue
    : (e.key ? (state.keyValues[e.key] || '') : e.rawValue);
  const rowSql = (e) => [
    sqlEscape(e.code, false),
    sqlEscape(e.codeSystem, false),
    sqlEscape(e.displayName, unicode),
    sqlEscape(e.valueType, false),
    sqlEscape(valueFor(e), unicode),
  ].join(', ');

  let out;
  if (sqlMode === 'multi') {
    out = `INSERT INTO ${table} (${cols.join(', ')})\nVALUES\n`
      + rows.map((e) => `  (${rowSql(e)})`).join(',\n') + ';';
  } else {
    out = rows.map((e) => `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${rowSql(e)});`).join('\n');
  }
  $('#sqlOut').value = out;
  toast('Đã sinh SQL');
}

/* ============================================================
 * Sự kiện UI
 * ========================================================== */
function switchSrc(src) {
  state.activeSrc = src;
  $$('.src-tab').forEach((t) => t.classList.toggle('active', t.dataset.src === src));
  $$('.src-area').forEach((a) => { a.hidden = a.dataset.src !== src; });
}

function initEvents() {
  // Tabs chính
  $$('.tab').forEach((t) => t.addEventListener('click', () => {
    $$('.tab').forEach((x) => x.classList.remove('active'));
    t.classList.add('active');
    $$('.tab-panel').forEach((p) => p.classList.remove('active'));
    $('#tab-' + t.dataset.tab).classList.add('active');
  }));

  // Sub-tab nguồn XML/XSL
  $$('.src-tab').forEach((t) => t.addEventListener('click', () => switchSrc(t.dataset.src)));

  // Thu gọn ô nhập
  $('#toggleXml').addEventListener('click', () => {
    const wrap = $('#xmlWrap');
    wrap.classList.toggle('collapsed');
    const open = !wrap.classList.contains('collapsed');
    $('#toggleXml').textContent = (open ? '▾' : '▸') + ' Mã nguồn';
  });

  $('#renderBtn').addEventListener('click', renderFromXml);
  $('#loadSample').addEventListener('click', () => {
    $('#xmlInput').value = window.SAMPLE_XML || '';
    $('#xslInput').value = window.SAMPLE_XSL || '';
    renderFromXml();
  });
  $('#copySrc').addEventListener('click', async () => {
    const ta = state.activeSrc === 'xsl' ? $('#xslInput') : $('#xmlInput');
    if (!ta.value) return;
    try { await navigator.clipboard.writeText(ta.value); }
    catch { ta.select(); document.execCommand('copy'); }
    toast('Đã sao chép code ' + state.activeSrc.toUpperCase());
  });

  $('#keySearch').addEventListener('input', (e) => filterKeys(e.target.value));
  $('#clearValues').addEventListener('click', () => {
    Object.keys(state.keyValues).forEach((k) => { state.keyValues[k] = ''; });
    $$('.key-input').forEach((i) => { i.value = ''; });
    renderPreview();
    toast('Đã xoá toàn bộ giá trị');
  });
  $('#printBtn').addEventListener('click', () => window.print());

  // SQL
  $('#genSql').addEventListener('click', generateSql);
  $('#copySql').addEventListener('click', async () => {
    const txt = $('#sqlOut').value;
    if (!txt) return;
    try { await navigator.clipboard.writeText(txt); }
    catch { $('#sqlOut').select(); document.execCommand('copy'); }
    toast('Đã sao chép SQL');
  });
  $('#checkAll').addEventListener('change', (e) => {
    state.entries.forEach((en) => { en.include = e.target.checked; });
    buildEntryList();
  });
  ['#sqlTable', '#sqlUnicode'].forEach((s) => $(s).addEventListener('change', generateSql));
  $$('input[name="valSource"], input[name="sqlMode"]').forEach((r) => r.addEventListener('change', generateSql));
}

/* ============================================================
 * Khởi động
 * ========================================================== */
window.addEventListener('DOMContentLoaded', () => {
  initEvents();
  if (window.SAMPLE_XML) {
    $('#xmlInput').value = window.SAMPLE_XML;
    if (window.SAMPLE_XSL) $('#xslInput').value = window.SAMPLE_XSL;
    renderFromXml();
  }
});
