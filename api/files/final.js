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
      .from('final_files')
      .select('id, file_name, file_size, created_at')
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
    const { fileId } = req.body;

    if (!fileId) {
      return error(res, 'fileId가 필요합니다.', 400);
    }

    const { data: tempFile, error: fetchErr } = await supabase
      .from('temp_files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (fetchErr) {
      return error(res, '임시 파일을 찾을 수 없습니다.', 404);
    }

    const finalRecord = {
      file_name: tempFile.file_name,
      file_size: tempFile.file_size,
      headers: tempFile.headers,
      rows: tempFile.rows
    };

    const { data, error: insertErr } = await supabase
      .from('final_files')
      .insert(finalRecord)
      .select()
      .single();

    if (insertErr) {
      return error(res, insertErr.message);
    }

    const contentRecord = {
      final_file_id: data.id,
      headers: tempFile.headers,
      rows: tempFile.rows
    };

    await supabase
      .from('file_contents')
      .insert(contentRecord);

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

    await supabase
      .from('file_contents')
      .delete()
      .eq('final_file_id', fileId);

    const { error: dbError } = await supabase
      .from('final_files')
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
