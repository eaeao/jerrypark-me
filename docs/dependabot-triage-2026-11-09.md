# Dependabot 알림 분류 (2026-11-09)

기준은 `master` `6c4c7cd`이고, 이때 열린 Dependabot 알림은 344건이었습니다(심각 10, 높음 171, 보통 118, 낮음 45).
같은 취약점이 `package-lock.json`과 `yarn.lock`에서 한 번씩 잡힙니다. axios는 `package.json`에서도 잡혀 세 번씩입니다.
그래서 실제 내용은 47개 패키지의 권고 143개입니다.

## 요약

- 이 브랜치의 lockfile로 바꾸면 344건 중 **281건이 닫힙니다**. 심각 10건은 모두 닫힙니다.
  이 숫자는 알림마다 취약 버전 범위를 새 lockfile의 모든 설치본과 semver로 대조해 계산한 것입니다. 실제로 닫히는 것은 master에 합친 뒤 Dependabot이 다시 스캔할 때입니다.
- **남는 63건**은 높음 18, 보통 27, 낮음 18입니다. 모두 Nuxt 2·Vue 2·webpack 4·ESLint 4에 묶여 있거나, 수정 버전이 아예 없습니다.
- 운영 경로에 남는 것은 18건입니다.
  - nuxt: Nuxt 3/4 전용 기능이 대상이라 2.x에는 해당 코드가 없습니다.
  - vue: 템플릿 컴파일러 쪽 문제인데, 운영은 런타임 빌드만 씁니다.
  - deepmerge, ip: 수정 버전이 없습니다.
  - serialize-javascript 6: 운영 서버가 불러오기는 하지만 호출은 빌드 때만 합니다. 수정 버전인 7.x는 Node 20 이상이 필요합니다.
- 화면과 SSR 결과는 그대로입니다(5장). 초기 로드 JS는 gzip 기준 5.5KB(4.3%) 늘었습니다. axios 0.34.0의 코드 자체가 커진 만큼입니다.
  - axios를 올리면 webpack 4가 Buffer 폴리필도 끌고 와서 원래는 12KB가 늘어납니다. 별도 커밋에서 클라이언트 빌드의 `node.Buffer`를 꺼서 이 폴리필은 뺐습니다.

## 분류 방법

Dependabot은 `nuxt`가 `dependencies`에 있다는 이유로 webpack·babel까지 전부 runtime으로 표시합니다(344건 중 327건). 그래서 그 표시는 쓰지 않고, 실제로 로드되는지로 나눴습니다.

- **SSR 서버**: `nuxt start`를 require 추적 훅(`node --require`)과 함께 띄웠습니다. 그 상태로 `/`, `/WEB`, `/ABOUT`, `/article/FLYERS`, `/articles/`와 없는 주소 2개를 요청했습니다. 그동안 프로세스가 불러온 `node_modules` 패키지를 기록했습니다(142개).
- **브라우저 번들**: 클라이언트 빌드의 webpack stats에서, 번들에 들어간 모듈이 속한 패키지를 모았습니다(24개).
- **빌드·개발 도구**: `nuxt build`, `nuxt dev`를 같은 훅으로 추적했고 lint는 devDependencies 기준입니다. 어디서도 로드되지 않고 설치만 되는 패키지도 이쪽으로 분류했습니다.

## 1. 운영 경로: SSR 서버 런타임·브라우저 번들

| 패키지 | 알림 (심각도) | 의존 경로 · 쓰이는 곳 | 고쳤나 | 이유 |
|---|---|---|---|---|
| axios | 69 (높음 31, 보통 35, 낮음 3) | 직접 의존성. SSR(Node 어댑터)과 브라우저 번들 양쪽 | ✅ 0.21.1 → 0.34.0 | 0.33.0부터 알려진 24개 권고가 모두 해결됩니다. 0.34.0(2026-09-16)은 보안 보강을 더 담았습니다. 이 사이트는 `axios.create({baseURL, timeout}).post('', {query, variables})`만 쓰는데, 0.22~0.34 릴리스 노트에 이 사용법에 걸리는 비호환 변경은 없습니다. 0.35.0은 11/3 배포라 넣지 않았습니다. |
| follow-redirects | 2 (보통 2) | axios > follow-redirects (SSR) | ✅ 1.15.9 → 1.16.2 | axios가 허용하는 범위 안의 업데이트입니다. |
| compression | 2 (높음 2) | nuxt > @nuxt/server > compression. 운영 모드에서만 켜지는 응답 압축입니다. | ✅ 1.8.0 → 1.8.2 | 범위(`^1.7.4`) 안의 패치입니다. |
| on-headers | 2 (낮음 2) | @nuxt/server, compression | ✅ 1.0.2 → 1.1.0 | 범위 안입니다. |
| lodash | 4 (높음 2, 보통 2) | @nuxt/vue-renderer(`cloneDeep`, `template`), @nuxt/cli, 빌드 도구들 | ✅ 4.17.21 → 4.18.1 | 범위 안입니다. 4.18.0에는 `template` ReferenceError 버그가 있어 이를 고친 4.18.1을 썼습니다. |
| lodash.template | 4 (높음 4) | @nuxt/vue-renderer > vue-server-renderer. `app.html` 템플릿을 컴파일합니다. | ✅ 4.5.0 → 4.18.1 | 범위(`^4.5.0`) 안입니다. |
| defu | 2 (높음 2) | @nuxt/config·@nuxt/cli 등의 설정 병합. 개발 서버의 @nuxt/loading-screen | ✅ 6.1.4 → 6.1.7. loading-screen이 쓰던 5.0.1은 override로 6.1.7을 씁니다. | loading-screen은 `defu(a, b)`만 호출하고, 6.x CJS도 `module.exports = defu`라 그대로 동작합니다. |
| launch-editor · shell-quote | 8 (높음 2, 보통 6) · 4 (심각 2, 높음 2) | @nuxt/server > launch-editor-middleware. 서버가 시작할 때 로드되지만, 미들웨어가 붙는 건 `dev && debug`일 때뿐입니다. | ✅ 2.10.0 → 2.14.2 · 1.8.2 → 1.12.0 | 범위 안입니다. |
| cookie | 2 (낮음 2) | @nuxt/server > @nuxtjs/youch. 시작할 때 로드되지만, youch 에러 화면은 debug 모드에서만 나옵니다. | ✅ 0.3.1 → 0.7.2 (override) | youch는 `cookie.parse`만 쓰고, 이 함수는 0.7에서도 같습니다. 취약점이 있던 쪽은 `serialize`입니다. |
| deepmerge | 2 (낮음 2) | vue-meta (SSR·브라우저 번들) | ❌ | 수정 버전이 없습니다(4.3.1이 최신). 병합하는 값은 우리 컴포넌트의 `head()`뿐입니다. |
| ip | 2 (높음 2) | @nuxt/server. 0.0.0.0으로 띄울 때 `ip.address()`만 호출합니다. | ❌ | 수정 버전이 없습니다. 취약한 `isPublic()`은 쓰지 않습니다. |
| serialize-javascript | 4 (높음 2, 보통 2) | 6.0.2: @nuxt/utils(시작할 때 로드, 호출은 빌드 때만) · 5.0.1: terser-webpack-plugin 4 · 4.0.0: webpack 4 안의 terser-webpack-plugin 1(로드 안 됨) | ❌ | 수정은 7.x에만 있는데 7.0.0부터 Node 20 이상이 필요합니다. 지금 Node 18 환경에서 override하면 깨질 수 있습니다. |
| vue | 2 (낮음 2) | SSR·브라우저 번들 | ❌ | Vue 2 전체가 대상이고 수정은 Vue 3에만 있습니다. 취약점은 템플릿 컴파일러(`parseHTML`)에 있고, 운영은 런타임 전용 빌드라 영향이 거의 없습니다. |
| nuxt | 8 (보통 2, 낮음 6) | 직접 의존성 | ❌ | 세 권고 모두 Nuxt 3/4 기능(`navigateTo`, `<NoScript>`, pages를 끈 `<NuxtLink>`)이 대상입니다. 버전 범위에 2.x가 걸렸을 뿐 2.x에는 해당 코드가 없습니다. 알림을 없애려면 Nuxt 3으로 옮겨야 합니다. |

브라우저 번들에 들어가는 취약 패키지는 axios, deepmerge, vue 세 개뿐입니다.

## 2. 빌드·개발 도구 (운영 서버·브라우저에서 로드되지 않음)

| 패키지 | 알림 (심각도) | 의존 경로 · 쓰이는 곳 | 고쳤나 | 이유 |
|---|---|---|---|---|
| tar | 24 (심각 2, 높음 16, 보통 6) | @nuxt/webpack > terser-webpack-plugin 4 > cacache 15 > tar | ✅ 6.2.1 → 7.5.22 (override) | cacache 15 코드는 tar를 require하지 않습니다. 쓰이지 않는 의존성이라 동작이 바뀌지 않습니다. |
| pbkdf2 | 6 (심각 4, 보통 2) | webpack 4 > node-libs-browser > crypto-browserify | ✅ 3.1.2 → 3.1.7 | 범위 안입니다. 클라이언트 코드가 `crypto`를 import하지 않아 번들에 들어가지 않습니다(stats로 확인). |
| sha.js | 2 (심각 2) | 위와 같음 | ✅ 2.4.11 → 2.4.12 | 범위 안입니다. |
| bn.js | 4 (보통 4) | 위와 같음 | ✅ 4.12.1 → 4.12.5, 5.2.1 → 5.2.5 | 범위 안입니다. |
| elliptic | 2 (낮음 2) | 위와 같음 | ❌ | 수정 버전이 없습니다. 번들에도 들어가지 않습니다. |
| qs | 8 (보통 6, 낮음 2) | webpack 4 > node-libs-browser > url | ✅ 6.14.0 → 6.16.1 | 범위 안입니다. 번들에 들어가지 않습니다. |
| min-document | 2 (낮음 2) | vue-carousel > global | ✅ 2.19.0 → 2.19.2 | 범위 안입니다. vue-carousel의 dist 빌드는 이 패키지를 쓰지 않아 번들에 들어가지 않습니다. |
| brace-expansion | 30 (높음 20, 보통 6, 낮음 4) | @nuxt/builder·@nuxt/webpack > glob 8 > minimatch 5, eslint > minimatch 3 | ✅ 2.0.1 → 2.1.7, 1.1.11 → 1.1.21 | 범위 안입니다. |
| minimatch | 12 (높음 12) | 위와 같고, @nuxt/webpack > postcss-url도 씁니다. | ✅ 5.1.6 → 5.1.9, 3.1.2 → 3.1.5. postcss-url이 쓰던 3.0.8도 override로 3.1.5를 씁니다. | postcss-url이 `~3.0.4`로 묶어 두었는데 3.0.x에는 수정본이 없습니다. 3.1.x는 API가 같습니다. |
| picomatch | 4 (높음 2, 보통 2) | chokidar, @parcel/watcher | ✅ 2.3.1 → 2.3.2 | 범위 안입니다. |
| fast-uri | 24 (높음 16, 보통 4, 낮음 4) | @nuxt/webpack > webpack-dev-middleware > schema-utils 4 > ajv 8. `nuxt dev`에서만 로드됩니다. | ✅ 3.0.6 → 3.1.9 (ajv 8.17.1 → 8.20.0) | 범위 안입니다. |
| ajv | 5 (보통 5) | 6.12.6: webpack 4·schema-utils · 5.5.2: eslint 4 (lint) | 일부. ✅ 6.12.6 → 6.15.0 / ❌ 5.5.2 (3건 남음) | ESLint 4가 쓰는 ajv API가 6에서 바뀌었습니다. ESLint를 올려야 합니다. |
| js-yaml | 10 (높음 6, 보통 4) | eslint 4 (lint) | ✅ 3.14.1 → 3.15.2 | 범위 안입니다. |
| tmp | 4 (높음 2, 낮음 2) | eslint 4 > inquirer > external-editor, @nuxt/telemetry > inquirer > external-editor | ✅ 0.0.33 → 0.2.7 (override) | external-editor는 `tmpNameSync`만 쓰고, 0.2에서도 같습니다. 대화형 편집기 프롬프트에서만 호출됩니다. |
| immutable | 6 (높음 6) | sass (devDependency) | ✅ 5.1.1 → 5.1.9 | 범위 안입니다. |
| svgo | 16 (높음 12, 보통 4) | cssnano 5·7 > postcss-svgo | ✅ 2.8.0 → 2.8.4, 3.3.2 → 3.3.5 | 범위 안입니다. |
| postcss | 10 (높음 4, 보통 6) | 8.5.3: @nuxt/webpack 등 · 7.0.39: vue-loader 15 > @vue/component-compiler-utils | 일부. ✅ 8.5.3 → 8.5.31 / ❌ 7.0.39 | 알림은 패키지 단위라 7.0.39가 남아 있는 한 10건 모두 열려 있습니다. postcss 8로 가려면 vue-loader 15(Nuxt 2)를 벗어나야 합니다. |
| postcss-selector-parser | 6 (보통 2, 낮음 4) | cssnano, css-loader, postcss-preset-env | ✅ 7.1.0 → 7.1.7, 6.1.2 → 6.1.5 | 범위 안입니다. |
| nanoid | 6 (높음 6) | postcss 8, @nuxt/telemetry | ✅ 3.3.11 → 3.3.20 | 범위 안입니다. |
| source-map-js | 2 (높음 2) | postcss 8, sass | ✅ 1.2.1 → 1.2.2 | 범위 안입니다. |
| colord | 2 (보통 2) | cssnano | ✅ 2.9.3 → 2.10.0 | 범위 안입니다. |
| browserslist | 4 (높음 4) | babel preset-env, postcss-preset-env | ✅ 4.24.4 → 4.29.4 (caniuse-lite 갱신 포함) | 범위 안입니다. CSS 결과는 아래 확인 결과에 적었습니다. |
| @babel/core | 2 (낮음 2) | @nuxt/babel-preset-app, @nuxt/webpack | ✅ 7.26.10 → 7.29.7 | 범위 안의 마이너 업데이트이고, babel 계열이 함께 올라갔습니다. |
| @babel/plugin-transform-modules-systemjs | 2 (높음 2) | @babel/preset-env | ✅ 7.25.9 → 7.29.8 | 범위 안입니다. SystemJS 출력은 쓰지 않습니다. |
| ws | 2 (높음 2) | @nuxt/webpack > webpack-bundle-analyzer. @nuxt/webpack이 빌드 때 항상 require하지만, 실제로 쓰는 건 `nuxt build --analyze`일 때뿐입니다. | ✅ 7.5.10 → 7.5.13 | 범위 안입니다. |
| yaml | 2 (보통 2) | postcss-loader > cosmiconfig | ✅ 1.10.2 → 1.10.3 | 범위 안입니다. |
| devalue | 20 (높음 6, 보통 8, 낮음 6) | nuxt > @nuxt/generator. `nuxt generate`에서만 로드됩니다. | ❌ | SSR 상태 직렬화(`window.__NUXT__`)는 포크인 `@nuxt/devalue`가 맡습니다. devalue 2.0.1은 `nuxt generate` 때만 로드됩니다. 수정본(5.9.3 이상)은 ESM 전용이고 API도 달라서, @nuxt/generator의 `require('devalue')`가 실패합니다. |
| parse-git-config | 2 (높음 2) | @nuxt/telemetry (`nuxt.config.js`에 `telemetry: false`) | ❌ | 수정 버전이 없고 로드되지도 않습니다. |
| micromatch · braces · decode-uri-component | 2 (보통 2) · 2 (높음 2) · 2 (보통 2) | webpack 4 > micromatch 3 > braces 2 / snapdragon > source-map-resolve | ❌ | 메이저 업그레이드가 필요합니다. micromatch는 4로 올려야 하고, decode-uri-component 0.3 이상은 ESM 전용입니다. webpack 5로 옮길 때(= Nuxt 3) 해소됩니다. |
| vue-template-compiler | 2 (보통 2) | @nuxt/vue-app, @nuxt/webpack | ❌ | Vue 2 전체가 대상입니다. vue-loader 15.11은 Vue 2.7에서 `vue/compiler-sfc`를 쓰므로 빌드 중에도 이 패키지는 로드되지 않습니다. |

## 3. 남은 63건을 없애려면

- **Nuxt 3(+ Vue 3, webpack 5 또는 Vite)으로 이전**: 60건이 사라집니다. 모두 Nuxt 2·webpack 4·Vue 2가 끌고 오는 패키지입니다.
  - nuxt 8, vue 2, vue-template-compiler 2, devalue 20
  - postcss 7 10, micromatch·braces·decode-uri-component 6, serialize-javascript 4
  - ip 2, parse-git-config 2, deepmerge 2(vue-meta), elliptic 2(webpack 4의 Node 폴리필)
- **ESLint 4를 최신으로**: ajv 5 3건입니다. `.eslintrc.js`와 `eslint-plugin-vue`, `babel-eslint`도 함께 바꿔야 합니다.
- **Nuxt 2를 유지한다면**: serialize-javascript 4건은 Node 20 이상으로 올린 뒤 7.x override로 없앨 수 있습니다. 다만 Nuxt 2 빌드와 같이 동작하는지는 따로 확인해야 합니다. 참고로 Node 18은 2025-04에 지원이 끝났습니다.
- **수정 버전이 아예 없음**: deepmerge, elliptic, ip, parse-git-config입니다. 위 이전 작업으로 상위 패키지가 바뀌어야만 사라집니다.

## 4. 바꾼 것

- `package.json`
  - `axios`를 `0.21.1`에서 `0.34.0`으로 바꿨습니다(정확한 버전 고정은 그대로).
  - `overrides` 5개를 넣었습니다. 모두 특정 상위 패키지 아래로만 범위를 한정했습니다.
    - `@nuxtjs/youch` > `cookie ^0.7.0`
    - `postcss-url` > `minimatch ^3.1.4`
    - `@nuxt/loading-screen` > `defu ^6.1.5`
    - `external-editor` > `tmp ^0.2.6`
    - `cacache` > `tar ^7.5.21`
- `package-lock.json`, `yarn.lock`: 74개 패키지의 버전이 바뀌고 16개가 추가되고 8개가 빠졌습니다. 두 파일의 이름·버전 목록은 서로 정확히 일치합니다.
- `nuxt.config.js`(별도 커밋): `build.extend`에서 클라이언트 빌드만 `config.node.Buffer = false`로 설정했습니다(5장 번들 크기 참고). 이 커밋만 빼도 나머지는 그대로 동작합니다.
- 설치할 때 npm이 `lodash.template@4.18.1`에 deprecated 경고를 한 줄 냅니다. vue-server-renderer가 쓰는 버전이라 그대로 두었습니다.
- **lockfile을 만든 도구**: npm 8.19.2를 썼습니다(Node 18.12.1에 딸린 것을 Node 18.18.0으로 실행).
  - npm 9 이상은 `yarn.lock`을 다른 형식으로 통째로 다시 쓰고, Windows 전용 항목(`@parcel/watcher-win32-x64`)도 뺍니다.
  - 그래서 기존 파일을 만든 형식(npm 7/8)을 그대로 썼습니다. 그 결과 `yarn.lock` 차이에는 바뀐 패키지 항목만 담겼고, Windows 항목도 남아 있습니다.
- **버전 고르기**: `--before=2026-10-26`(2주 전)을 줬습니다. 최근 2주 안에 배포된 버전은 고르지 않게 하려는 것입니다.
  - 그래서 빠진 버전의 예: follow-redirects 1.16.3(11/8), colord 2.10.1(11/8), postcss-selector-parser 7.2.0(11/8), @babel/core 7.29.13(11/4)
  - axios 0.35.0(11/3)은 같은 이유로 직접 고르지 않았습니다.
- **npm 8의 override 적용 문제**: npm 8은 lock에 이미 있는 중첩 항목에 override를 바로 적용하지 않습니다. 그래서 `@nuxt/loading-screen/node_modules/defu` 항목을 lock에서 지운 뒤 다시 해석시켰습니다.

## 5. 확인 결과

Node 18.18.0에서 새 lockfile로 `npm ci`(npm 8.19.2)를 해서 1,369개를 깨끗하게 설치하고 확인했습니다.

| 항목 | 결과 |
|---|---|
| `npm run build` | 성공했습니다. Sass `legacy-js-api` 경고 68줄은 수정 전에도 같은 수입니다. |
| `npm run lint` | 통과했습니다(오류 0). |
| SSR 비교 (`nuxt start`, 7개 주소, 수정 전과 비교) | 상태 코드가 같습니다(5개는 200, 없는 주소 2개는 404). 인라인 CSS(인쇄 CSS 포함)는 바이트 단위로 같습니다. 자산 파일 이름만 빼면 HTML도 같고, 여기에는 `window.__NUXT__` 데이터도 포함됩니다. browserslist·postcss·cssnano·svgo·babel을 올렸지만 CSS 결과는 바뀌지 않았습니다. |
| 브라우저 확인 (헤드리스 Chrome, `nuxt start`와 `nuxt dev` 각각) | 아래 모두 정상이고, 콘솔 오류와 Vue 경고는 없습니다. |
| 인쇄 결과 (Chrome `printToPDF`) | 상세 페이지와 `/articles/` 모두 첫 페이지부터 본문이 나옵니다. 목록과 헤더는 인쇄에서 빠집니다. |
| 브라우저 번들 구성 (webpack stats) | 바뀐 것은 axios뿐입니다(`Buffer: false` 적용 후). 0.34.0의 `lib`는 ES5이고, `browser` 필드 덕분에 Node 어댑터 대신 xhr을 씁니다. |

브라우저 확인에서 본 항목은 다음과 같습니다.
- 홈 직접 진입
- 카테고리(`/web/`)와 상세(`/article/FLYERS`)로 클라이언트 이동. 브라우저의 axios가 API를 호출해 200을 받습니다.
- 상세 직접 진입
- `/articles/`: 직접 진입과 클라이언트 이동 모두에서, 이미지가 다 로드된 뒤 자동 인쇄를 호출합니다.
- 404 화면

### 번들 크기 (초기 로드 JS = runtime + commons + vendors + app, gzip -9, 바이트)

같은 빌드 도구에서 axios 버전과 설정만 바꿔 비교했습니다.

| 상태 | commons/app | vendors/app | 합계 |
|---|---|---|---|
| axios 0.21.1 (기준) | 90,233 | 6,182 | 127,883 |
| axios 0.34.0 (폴리필 포함) | 95,703 | 12,857 | 약 140,100 (+12.2KB) |
| axios 0.34.0 + `node.Buffer: false` (이 브랜치) | 95,663 | 6,209 | 133,363 (+5.5KB, +4.3%) |

- **폴리필이 들어오는 이유**: axios 0.34.0은 `toFormData`의 Node 전용 분기에서 `Buffer.from`을 씁니다. 이 때문에 webpack 4가 Buffer 폴리필(buffer, base64-js, ieee754, isarray)을 클라이언트 번들에 자동으로 넣습니다.
- **빼도 되는 이유**:
  - 브라우저에는 `FormData`와 `Blob`이 있어 그 분기를 타지 않고, 이 사이트는 JSON만 보냅니다.
  - 수정 전 번들에 폴리필이 없었으니, 원래 `Buffer`를 참조하는 클라이언트 모듈은 없었습니다.
- **남는 증가분**: +5.5KB는 axios 0.28 이후 커진 코드(AxiosHeaders, formSerializer 등) 자체입니다. 이것까지 줄이려면 API 함수 4개(`src/store/api.js`)를 `fetch`로 바꾸는 방법이 있습니다. 이건 별도 작업입니다.

## 6. 운영에 반영할 때

- 운영 배포는 직접 하셔야 합니다. 서버에서 lockfile대로 `npm ci`(npm 8.3 이상)를 하고 `npm run build`를 한 뒤 다시 시작하면 됩니다.
  - 2026-11-08 점검 때 운영 번들의 core-js는 3.35.0으로 lockfile의 3.41.0과 달랐습니다. 운영 node_modules가 lockfile대로 설치되지 않았다는 뜻입니다. 이번 수정은 lockfile대로 설치해야 반영됩니다.
- `overrides`는 npm에서만 동작합니다. yarn v1로 설치하면 위 5개 override는 무시되고, 해당 패키지는 원래 버전으로 돌아갑니다. yarn에서 같은 효과를 내려면 `resolutions`가 따로 필요합니다.
- 로컬에서 `npm ci`나 `npm install`을 하면 npm 8·10 모두 `yarn.lock`에서 Windows 전용 항목을 뺍니다. 의도한 변경이 아니면 `git checkout -- yarn.lock`으로 되돌리면 됩니다.
