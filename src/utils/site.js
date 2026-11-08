// 사이트 공통 상수와 head(SEO)·라우트 헬퍼

export const SITE_URL = 'https://jerrypark.me'
export const SITE_NAME = 'JERRYPARK.ME'
export const SITE_AUTHOR = 'JerryPark, eaeao, 박동혁'
export const DEFAULT_OG_IMAGE = `${SITE_URL}/static/img/jerrypark_cap.png`

// JSON-LD <script>의 vmid. head()에서 __dangerouslyDisableSanitizersByTagID와 같이 쓴다.
export const LD_JSON_HID = 'ldjson'

const NAMED_ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: '\'',
  nbsp: ' ',
  middot: '·',
  hellip: '…',
  ndash: '–',
  mdash: '—',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”'
}

// 클라이언트 빌드 타깃이 IE9라 String.fromCodePoint를 쓰면 core-js 폴리필이 붙는다. 서로게이트 쌍을 직접 만든다.
function fromCodePoint (code) {
  if (code <= 0xFFFF) {
    return String.fromCharCode(code)
  }
  const offset = code - 0x10000
  return String.fromCharCode(0xD800 + (offset >> 10), 0xDC00 + (offset & 0x3FF))
}

// HTML 엔티티를 한 번만 디코딩한다.
// vue-meta가 출력할 때 다시 이스케이프하므로, 여기서 풀지 않으면 &amp;#39; 같은 이중 이스케이프가 생긴다.
export function decodeEntities (text) {
  return `${text}`.replace(/&(#[xX][0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (match, entity) => {
    if (entity.charAt(0) === '#') {
      const isHex = entity.charAt(1) === 'x' || entity.charAt(1) === 'X'
      const code = isHex ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10)
      return code > 0 && code <= 0x10FFFF ? fromCodePoint(code) : match
    }
    const key = entity.toLowerCase()
    // hasOwnProperty로 확인해 &constructor; 같은 Object.prototype 키를 엔티티로 오인하지 않는다.
    return Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, key) ? NAMED_ENTITIES[key] : match
  })
}

// 마크다운에서 만든 HTML을 meta description용 평문으로 바꾼다.
// 블록 태그와 <br>은 공백으로 바꿔 줄이 바뀌던 자리의 단어가 붙지 않게 하고, 인라인 태그는 그냥 지운다.
export function htmlToText (html) {
  const text = `${html || ''}`
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/?(p|div|li|ul|ol|h[1-6]|tr|td|th|table|blockquote|pre|hr)\b[^>]*>/gi, ' ')
    .replace(/<[^>]*>/g, '')
  return decodeEntities(text).replace(/\s+/g, ' ').trim()
}

// max 글자 안으로 자르고, 가능하면 단어 경계에서 끊는다. 이모지 같은 서로게이트 쌍은 반쪽으로 남기지 않는다.
export function truncateText (text, max = 160) {
  const value = `${text || ''}`
  if (value.length <= max) {
    return value
  }
  let cut = value.slice(0, max - 1)
  if (/[\uD800-\uDBFF]$/.test(cut)) {
    cut = cut.slice(0, -1)
  }
  const lastSpace = cut.lastIndexOf(' ')
  const trimmed = lastSpace > cut.length * 0.6 ? cut.slice(0, lastSpace) : cut
  return `${trimmed.trim()}…`
}

export function absoluteUrl (path = '/') {
  return `${SITE_URL}${path.charAt(0) === '/' ? '' : '/'}${path}`
}

// JSON-LD 스크립트 태그. JSON 안의 '<' 문자를 유니코드 이스케이프로 바꿔, 내용에 </script>가 있어도 태그가 끝나지 않게 한다.
export function ldJsonScript (data) {
  return {
    hid: LD_JSON_HID,
    type: 'application/ld+json',
    innerHTML: JSON.stringify(data).replace(/</g, '\\u003c')
  }
}

// 홈·카테고리 같은 목록 페이지의 head. 페이지마다 다른 title/description과 canonical·OG를 넣는다.
export function listPageHead ({ title, ogTitle, description, path }) {
  const url = absoluteUrl(path)
  return {
    title,
    meta: [
      { hid: 'description', name: 'description', content: description },
      { hid: 'og:type', property: 'og:type', content: 'website' },
      { hid: 'og:site_name', property: 'og:site_name', content: SITE_NAME },
      { hid: 'og:title', property: 'og:title', content: ogTitle || title },
      { hid: 'og:description', property: 'og:description', content: description },
      { hid: 'og:url', property: 'og:url', content: url },
      { hid: 'og:image', property: 'og:image', content: DEFAULT_OG_IMAGE }
    ],
    link: [
      { hid: 'canonical', rel: 'canonical', href: url }
    ]
  }
}

// 라우트 파라미터(/web/의 'web')를 API의 카테고리 제목('WEB')으로 바꾼다.
// 목록에 없거나 카테고리 목록 자체를 못 불러왔으면 null.
// (목록이 없을 때 아무 값이나 받아 주면 /wp-login.php 같은 주소가 검색에 잡히는 200 페이지가 된다.
//  그 경우는 pages/_category.vue의 validate()가 503으로 처리한다.)
export function resolveCategoryTitle (categories, param) {
  const wanted = `${param || ''}`.replace(/\//g, '').toUpperCase()
  if (!wanted) {
    return null
  }
  const list = Array.isArray(categories) ? categories : []
  const match = list.filter(item => item && typeof item.title === 'string' && item.title.toUpperCase() === wanted)[0]
  return match ? match.title : null
}

export function hasCategories (categories) {
  return Array.isArray(categories) && categories.length > 0
}

// /article/:title 파라미터를 포트폴리오 제목으로 되돌린다.
// vue-router가 이미 한 번 디코딩하므로, 잘못된 % 시퀀스가 와도 URIError로 500이 나지 않게 한다.
export function titleFromRouteParam (param) {
  let value = `${param || ''}`
  try {
    value = decodeURIComponent(value)
  } catch (e) {
    // 이미 디코딩된 값이거나 잘못된 인코딩이면 받은 그대로 쓴다.
  }
  return value.replace(/―/g, ' ')
}
