const { getSupabase } = require('../_lib/supabase');
const { success, error, notAllowed } = require('../_lib/response');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return notAllowed(res);
  }

  try {
    const supabase = getSupabase();
    const { fileName, headers, rows } = req.body;

    if (!headers || !rows) {
      return error(res, 'headers와 rows가 필요합니다.', 400);
    }

    const record = {
      file_name: fileName || 'export.xlsx',
      headers: headers,
      rows: rows,
      saved_at: new Date().toISOString()
    };

    const { data, error: dbError } = await supabase
      .from('saved_excel_files')
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
};
