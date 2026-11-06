import { db, json } from './_db.js';
const validText = (value, min, max) => typeof value === 'string' && value.trim().length >= min && value.trim().length <= max;
const validRegions = ['Northern', 'Central', 'Southern', 'Eastern'];
export async function POST(request) {
  try {
    if (!process.env.STAFF_ACCESS_CODE) return json({ error: 'Staff access code not configured' }, 503);
    if (Number(request.headers.get('content-length') || 0) > 12000) return json({ error: 'Request too large' }, 413);
    if (!(request.headers.get('content-type') || '').includes('application/json')) return json({ error: 'JSON required' }, 415);
    const body = await request.json();
    if (body.website) return json({ error: 'Invalid request' }, 400);
    if (typeof body.access_code !== 'string' || body.access_code !== process.env.STAFF_ACCESS_CODE) return json({ error: 'Invalid access code' }, 403);
    const { item_id, requester_name, requester_email, phone_number, incident_ticket_number, region, quantity_requested, problem_description, remark } = body;
    if (!Number.isSafeInteger(item_id) || item_id < 1 || !Number.isSafeInteger(quantity_requested) || quantity_requested < 1 || quantity_requested > 10000) return json({ error: 'Invalid item or quantity' }, 400);
    if (!validText(requester_name, 2, 100)) return json({ error: 'Enter a valid technician name' }, 400);
    if (!validText(requester_email, 5, 200) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requester_email)) return json({ error: 'Invalid email address' }, 400);
    if (!validText(phone_number, 7, 25) || !/^[0-9+() -]{7,25}$/.test(phone_number)) return json({ error: 'Invalid phone number' }, 400);
    if (!validText(incident_ticket_number, 1, 80)) return json({ error: 'Incident ticket number is required' }, 400);
    if (!validRegions.includes(region)) return json({ error: 'Select a valid region' }, 400);
    if (!validText(problem_description, 10, 1500)) return json({ error: 'Problem description must have at least 10 characters' }, 400);
    if (remark != null && (typeof remark !== 'string' || remark.length > 1000)) return json({ error: 'Remark is too long' }, 400);
    const client = db();
    const { data: item, error: lookupError } = await client.from('item').select('quantity_available').eq('item_id', item_id).maybeSingle();
    if (lookupError) throw lookupError;
    if (!item) return json({ error: 'Item not found' }, 404);
    if (quantity_requested > item.quantity_available) return json({ error: 'Quantity exceeds available stock' }, 400);
    const record = {
      item_id, requester_name: requester_name.trim(), requester_email: requester_email.trim(),
      phone_number: phone_number.trim(), incident_ticket_number: incident_ticket_number.trim(),
      region, quantity_requested, problem_description: problem_description.trim(),
      remark: (remark || '').trim() || null, request_status: 'Pending'
    };
    const { data, error } = await client.from('stock_request').insert(record).select('request_id').single();
    if (error) throw error;
    return json({ request_id: data.request_id, status: 'Pending' }, 201);
  } catch (error) {
    console.error('Request save failed:', error.message);
    return json({ error: 'Unable to save request' }, 500);
  }
}
