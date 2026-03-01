const { getSupabase } = require('../_lib/supabase');
const { success, error, notAllowed } = require('../_lib/response');

module.exports = async function handler(req, res) {
  const method = req.method;

  if (method === 'GET') {
    return handleGet(req, res);
  }
  if (method === 'POST') {
    return handlePost(req, res);
  }
  if (method === 'DELETE') {
    return handleDelete(req, res);
  }
  return notAllowed(res);
};

async function handleGet(req, res) {
  try {
    const supabase = getSupabase();
    const { data, error: dbError } = await supabase
      .from('temp_files')
      .select('*')
      .order('created_at', { ascending: false });

    if (dbError) {
      return error(res, dbError.message);
    }
    return success(res, data, { total: data.length });
  } catch (err) {
    return error(res, err.message);
  }
}

async function handlePost(req, res) {
  try {
    const supabase = getSupabase();
    const body = req.body;

    const record = {
      file_name: body.name,
      file_size: body.size,
      headers: body.headers,
      rows: body.rows
    };

    const { data, error: dbError } = await supabase
      .from('temp_files')
      .insert(record)
      .select()
      .single();

    if (dbError) {
      return error(res, dbError.message);
    }
    return success(res, data);
  } catch (err) {
    return error(res, err.message);
  }
}

async function handleDelete(req, res) {
  try {
    const supabase = getSupabase();
    const fileId = req.query.id;

    if (!fileId) {
      return error(res, 'id 파라미터가 필요합니다.', 400);
    }

    const { error: dbError } = await supabase
      .from('temp_files')
      .delete()
      .eq('id', fileId);

    if (dbError) {
      return error(res, dbError.message);
    }
    return success(res, { deleted: fileId });
  } catch (err) {
    return error(res, err.message);
  }
}
