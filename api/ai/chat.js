const { success, error, notAllowed } = require('../_lib/response');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return notAllowed(res);
  }

  try {
    const { message, context } = req.body;

    if (!message) {
      return error(res, 'message가 필요합니다.', 400);
    }

    var responseData = generateResponse(message, context);
    return success(res, responseData);
  } catch (err) {
    return error(res, err.message);
  }
};

function generateResponse(message, context) {
  var lower = message.toLowerCase();

  if (lower.includes('샘플') || lower.includes('생성')) {
    return {
      message: '샘플 데이터를 생성했습니다.',
      excelData: {
        headers: ['이름', '부서', '직급', '입사일', '급여'],
        rows: [
          ['김철수', '개발팀', '과장', '2020-03-15', '5500000'],
          ['이영희', '기획팀', '대리', '2021-07-01', '4200000'],
          ['박민수', '영업팀', '차장', '2018-11-20', '6800000'],
          ['정수진', '인사팀', '사원', '2023-01-10', '3500000'],
          ['최동현', '개발팀', '부장', '2015-05-08', '8000000']
        ]
      }
    };
  }

  if (lower.includes('분석') || lower.includes('요약')) {
    if (context && context.headers && context.headers.length > 0) {
      return {
        message: '데이터 분석 결과:\n' +
          '- 총 ' + context.rowCount + '개의 행\n' +
          '- ' + context.headers.length + '개의 열 (' +
          context.headers.join(', ') + ')'
      };
    }
    return {
      message: '분석할 데이터가 없습니다. 파일을 업로드해주세요.'
    };
  }

  return {
    message: '요청을 확인했습니다. ' +
      '"샘플 데이터 생성", "데이터 분석" 명령을 사용해보세요.'
  };
}
