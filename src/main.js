import './style.css';

// These are SAMPLE records for StackBlitz preview only, not real company inventory.
const previewItems = [
  { item_id: 9, item_name: 'Printer Head Epson T81 (ii)', category: 'POS', quantity_available: 6 },
  { item_id: 10, item_name: 'Nippon Printer', category: 'TVM', quantity_available: 4 },
  { item_id: 11, item_name: 'TP-Link 4G Router', category: 'Server Rack', quantity_available: 7 },
  { item_id: 12, item_name: 'Controller Board', category: 'ACG', quantity_available: 3 },
  { item_id: 13, item_name: 'IPC KITS', category: 'TVM', quantity_available: 5 },
  { item_id: 14, item_name: 'Terminal 9A20Pro (Replacement)', category: 'Handheld', quantity_available: 4 },
  { item_id: 15, item_name: 'SSD 128GB', category: 'TVM', quantity_available: 10 },
  { item_id: 16, item_name: 'LED Light Bar (Top)', category: 'ACG', quantity_available: 8 }
];
let items = [];
let isPreview = false;
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const root = document.querySelector('#app');
root.innerHTML = `
  <header class="topbar"><div class="brand"><span class="logo">go<span>HUB</span></span><div><strong>Go Hub Capital</strong><small>SPARE PART REQUEST MANAGEMENT</small></div></div><span class="tag">Technician Portal</span></header>
  <main>
    <section class="hero"><span class="eyebrow">STAFF PORTAL · ASSIGNMENT PROTOTYPE</span><h1>Find a spare part.<br><em>Submit a request.</em></h1><p>Search available parts and record your request in a few simple steps.</p></section>
    <section class="panel"><div class="heading"><div><h2>Available Spare Parts</h2><p>Sample items for demonstration</p></div><span class="count" id="count"></span></div>
      <div class="filters"><label class="search"><span>⌕</span><input id="search" placeholder="Search part name or category..." autocomplete="off"></label><select id="category"><option value="">All categories</option></select></div>
      <p id="notice" class="notice" hidden></p><div id="items" class="item-list"><p>Loading...</p></div></section>
    <section class="panel" id="request-panel" hidden><div class="heading"><div><h2>Spare Part Request Form</h2><p>Complete the details below to request a part.</p></div><button id="close" type="button" class="close" aria-label="Close request form">✕</button></div>
      <form id="request-form">
        <input type="hidden" name="item_id" id="item-id">
        <h3>Technician Information</h3>
        <div class="two"><label>Your Name *<input name="requester_name" required minlength="2" maxlength="100" placeholder="Technician full name"></label><label>Phone Number *<input name="phone_number" required maxlength="25" pattern="[0-9+() -]{7,25}" placeholder="0123456789"></label></div>
        <div class="two"><label>Email Address *<input name="requester_email" type="email" required maxlength="200" placeholder="staff@example.com"></label><label>Incident Ticket Number *<input name="incident_ticket_number" required maxlength="80" placeholder="SF / Jira / SpiceWork reference"></label></div>
        <label>Region *<select name="region" required><option value="">Select region</option><option>Northern</option><option>Central</option><option>Southern</option><option>Eastern</option></select></label>
        <h3>Spare Part Details</h3>
        <div class="two"><label>Selected Item<input id="selected-item" readonly></label><label>Quantity Required *<input name="quantity_requested" type="number" required min="1" max="10000" step="1" value="1"></label></div>
        <label>Problem Description *<textarea name="problem_description" rows="4" required minlength="10" maxlength="1500" placeholder="Include incident location, complainant (if relevant) and faulty device serial number if available."></textarea></label>
        <label>Remark / Comment (optional)<textarea name="remark" rows="3" maxlength="1000" placeholder="Additional comments"></textarea></label>
        <label>Staff Access Code (demo) *<input name="access_code" type="password" required autocomplete="off" placeholder="Access code provided for demonstration"></label>
        <label class="honeypot" aria-hidden="true">Leave this field empty<input name="website" tabindex="-1" autocomplete="off"></label>
        <p class="helper">All requests are recorded with Pending status. Stock is not automatically deducted. No file upload in this assignment prototype.</p>
        <button class="primary" id="submit" type="submit">Submit Request</button><p id="feedback" role="status"></p>
      </form></section>
  </main><footer>© Go Hub Capital · Student assignment prototype · Sample stock data</footer>`;

const list = document.querySelector('#items');
const search = document.querySelector('#search');
const category = document.querySelector('#category');
const count = document.querySelector('#count');
const panel = document.querySelector('#request-panel');
const form = document.querySelector('#request-form');
const feedback = document.querySelector('#feedback');
function render() {
  const query = search.value.toLowerCase().trim();
  const filtered = items.filter(item => (item.item_name + ' ' + (item.category || '')).toLowerCase().includes(query) && (!category.value || item.category === category.value));
  count.textContent = `${filtered.length} items`;
  list.innerHTML = filtered.length ? filtered.map(item => `
    <article class="item"><div class="symbol">▣</div><div class="details"><strong>${escapeHtml(item.item_name)}</strong><span>${escapeHtml(item.category || 'Other')}</span></div><div class="quantity"><b>${Number(item.quantity_available)}</b><small>available</small></div><button class="request" data-id="${Number(item.item_id)}" ${item.quantity_available < 1 ? 'disabled' : ''}>Request</button></article>`).join('') : '<p class="empty">No matching spare parts.</p>';
}
function populateCategories() {
  for (const value of [...new Set(items.map(item => item.category).filter(Boolean))].sort()) {
    const option = document.createElement('option'); option.value = value; option.textContent = value; category.append(option);
  }
}
list.addEventListener('click', event => {
  const button = event.target.closest('button[data-id]'); if (!button) return;
  const item = items.find(part => part.item_id === Number(button.dataset.id)); if (!item) return;
  form.reset(); feedback.textContent = ''; feedback.className = '';
  document.querySelector('#item-id').value = item.item_id;
  document.querySelector('#selected-item').value = item.item_name;
  form.elements.quantity_requested.max = item.quantity_available;
  panel.hidden = false; panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
document.querySelector('#close').addEventListener('click', () => { panel.hidden = true; });
search.addEventListener('input', render);
category.addEventListener('change', render);
async function loadItems() {
  try {
    const response = await fetch('/api/items');
    if (!response.ok) throw new Error('API unavailable');
    const data = await response.json();
    if (!Array.isArray(data.items)) throw new Error('Invalid response');
    items = data.items; isPreview = false;
  } catch {
    items = previewItems; isPreview = true;
    const note = document.querySelector('#notice'); note.hidden = false;
    note.textContent = 'PREVIEW MODE: These 8 sample parts are not live Supabase data. Deploy to Vercel and configure the API to save requests.';
  }
  populateCategories(); render();
}
form.addEventListener('submit', async event => {
  event.preventDefault(); feedback.className = '';
  if (isPreview) { feedback.textContent = 'Preview only: request was not saved. Deploy the site to Vercel and configure Supabase.'; feedback.className = 'error'; return; }
  const payload = Object.fromEntries(new FormData(form));
  payload.item_id = Number(payload.item_id);
  payload.quantity_requested = Number(payload.quantity_requested);
  const button = document.querySelector('#submit'); button.disabled = true; button.textContent = 'Submitting...';
  try {
    const response = await fetch('/api/requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Unable to submit request');
    feedback.textContent = `Request #${result.request_id} submitted successfully. Status: Pending.`;
    feedback.className = 'success'; form.reset();
  } catch (error) { feedback.textContent = error.message; feedback.className = 'error'; }
  finally { button.disabled = false; button.textContent = 'Submit Request'; }
});
loadItems();
