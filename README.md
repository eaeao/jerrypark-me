# jerrypark-me

> 개인 웹사이트 프로젝트

## 프로젝트 소개
이 프로젝트는 Nuxt.js를 기반으로 한 개인 웹사이트입니다.

## 사용 기술 및 라이브러리
- **프레임워크**: Nuxt.js (v2.15.8)
- **언어**: JavaScript, HTML, CSS/SCSS
- **주요 라이브러리**:
  - axios (0.21.1): HTTP 클라이언트
  - vue-carousel (0.18.0): 이미지 슬라이더 컴포넌트
  - nuxt-material-design-icons: 머티리얼 디자인 아이콘
  - striptags: HTML 태그 제거 유틸리티

## 개발 환경 설정
- Node.js (버전은 .nvmrc 참조)
- Yarn 패키지 매니저

## 설치 및 실행 방법
1. 프로젝트 클론
```bash
git clone [repository-url]
cd jerrypark-me
```

2. 의존성 설치
```bash
yarn install
```

3. 개발 서버 실행
```bash
yarn dev
```

4. 프로덕션 빌드
```bash
yarn build
yarn start
```

5. 정적 사이트 생성
```bash
yarn generate
```

## 프로젝트 구조
```
jerrypark-me/
├── src/
│   ├── assets/      # 이미지, 스타일시트 등 정적 자원
│   ├── components/  # 재사용 가능한 Vue 컴포넌트
│   ├── layouts/     # 페이지 레이아웃 템플릿
│   ├── middleware/  # 라우트 미들웨어
│   ├── pages/       # 페이지 컴포넌트
│   ├── plugins/     # Vue 플러그인
│   ├── static/      # 정적 파일
│   └── store/       # Vuex 스토어
├── .nuxt/           # Nuxt 빌드 결과물
├── node_modules/    # 의존성 패키지
├── .eslintrc.js     # ESLint 설정
├── .gitignore       # Git 무시 파일 목록
├── nuxt.config.js   # Nuxt 설정
├── package.json     # 프로젝트 메타데이터 및 의존성
└── yarn.lock        # Yarn 의존성 잠금 파일
```

## 스크립트 명령어
- `yarn dev`: 개발 서버 실행
- `yarn build`: 프로덕션 빌드
- `yarn start`: 프로덕션 서버 실행
- `yarn generate`: 정적 사이트 생성
- `yarn lint`: 코드 린트 실행

## 개발 환경 설정
- ESLint를 사용한 코드 스타일 검사
- EditorConfig를 사용한 에디터 설정 통일
- SASS/SCSS 지원
