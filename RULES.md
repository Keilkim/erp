# ERP 프로젝트 코딩 룰

## 룰 1: 파일 분리 원칙 (인라인 금지)

### HTML 파일
- `<script>` 태그 사용 금지 (외부 .js 파일을 `<script src="...">`로 로드)
- `<style>` 태그 사용 금지 (외부 .css 파일을 `<link rel="stylesheet">`로 로드)
- 인라인 이벤트 핸들러 금지 (`onclick`, `onchange` 등 사용 금지)
- 인라인 style 속성 금지 (`style="..."` 사용 금지)

### JS 파일
- HTML 문자열 직접 작성 최소화
- UI 렌더링은 `public/assets/templates/` 폴더의 HTML 템플릿을 fetch하여 사용
- DOM 조작은 `document.createElement()` 또는 템플릿 기반으로 수행
- CSS 클래스 토글은 `classList` API 사용 (인라인 style 직접 조작 금지)

### CSS 파일
- JS 로직 포함 금지
- CSS 변수(`--var`)는 `global.css`에서 정의
- 모듈별 CSS는 `modules/` 폴더에 분리

### Python 파일
- HTML/JS/CSS 문자열 포함 금지
- 순수 데이터 처리 및 리포트 생성 로직만 작성
- 응답은 JSON 형태로만 반환

## 룰 2: 파일 500줄 제한

- 모든 소스 파일(.html, .css, .js, .py, .sql)은 **500줄 이하**로 유지
- 초과 시 기능 단위로 파일 분리
  - 예: `hr.js` → `hr.js` + `hr-attendance.js` + `hr-leave.js`
- SQL 마이그레이션은 테이블 단위로 분리

## 룰 3: 모듈별 폴더 격리

- 각 ERP 모듈(HR, Sales 등)은 프론트/백/DB 모두 독립 파일로 관리
- 모듈 간 의존성은 `shared/` 또는 `_lib/` 폴더를 통해서만 허용
- 직접 import 금지: 모듈 A의 JS가 모듈 B의 JS를 직접 참조하지 않음

## 룰 4: 네이밍 컨벤션

### 파일명
- 소문자 + 하이픈(kebab-case): `hr-attendance.js`, `sales-orders.css`
- 모듈 접두사: `hr-`, `sales-`, `finance-`, `crm-`, `project-`

### CSS 클래스
- BEM 기반: `.module__element--modifier`
- 예: `.hr__employee-card--active`, `.sales__order-table`

### JS 함수/변수
- camelCase: `fetchEmployees()`, `orderTotal`
- 모듈 네임스페이스 객체: `HR.init()`, `Sales.loadOrders()`

### API 엔드포인트
- REST 규칙: `GET /api/hr/employees`, `POST /api/sales/orders`
- 복수형 명사 사용

### SQL 테이블
- 복수형 snake_case: `employees`, `inventory_items`, `sales_orders`

## 룰 5: API 응답 형식

모든 API는 통일된 JSON 형식을 반환한다:

```json
{
  "success": true,
  "data": [],
  "error": null,
  "meta": {
    "total": 0,
    "page": 1,
    "limit": 20
  }
}
```

## 룰 6: 폴더 구조

```
public/assets/css/          → 전역 + 모듈별 CSS
public/assets/js/           → 전역 + 모듈별 JS
public/assets/templates/    → HTML 템플릿 (레이아웃 + 모듈별)
api/{module}/               → Vercel Serverless Functions
api/_lib/                   → API 공통 유틸리티
supabase/migrations/        → DB 마이그레이션 SQL
```

## 룰 7: Git 커밋 메시지

```
[모듈명] 동작: 설명

예:
[HR] feat: 직원 목록 조회 API 추가
[Sales] fix: 주문 금액 계산 오류 수정
[Common] refactor: 테이블 렌더링 컴포넌트 분리
```
