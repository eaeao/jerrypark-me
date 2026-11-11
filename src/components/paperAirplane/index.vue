<template>
  <!-- 장식용 오버레이라 보조기기에는 숨긴다 -->
  <div ref="container" class="paper-airplane-container" aria-hidden="true"></div>
</template>

<script>
/**
 * PaperAirplane 컴포넌트
 * 마우스를 따라다니며 공전하는 3D 종이비행기. 화면을 종이로 보고, 그 위를 나는 비행기를 위에서 내려다본다.
 *
 * 핵심 특성:
 * - 커서를 부드럽게 따라가는 점을 중심으로 공전한다(관성 기반: 힘 → 속도 → 위치).
 * - 윗면은 늘 화면 쪽을 향하고, 기수는 진행 방향을 따라 돌며, 선회할 때는 안쪽 날개가 내려간다(bank).
 * - 페이지에 떨어지는 부드러운 그림자로 떠 있는 높이를 보여 준다.
 * - 입력이 한동안 없으면 그 자리에 내려앉고 그리기를 멈춘다. 커서를 움직이면 다시 떠오른다.
 *
 * 시간:
 * - rAF 타임스탬프로 실제 경과 시간을 재서 계산하므로 60Hz와 120Hz 화면에서 같은 속도로 움직인다.
 * - 예전 코드는 한 프레임을 1/60초로 가정했다. 그때의 프레임당 값을 초 단위로 바꿔, 60Hz 화면의 움직임은 그대로 두었다.
 *
 * 성능·접근성:
 * - 페이지 load 이벤트 뒤 브라우저가 한가할 때 three.js를 불러온다(첫 화면 로드와 경쟁하지 않음).
 * - '동작 줄이기(prefers-reduced-motion)'를 켠 사용자에게는 띄우지 않는다. 보는 도중에 설정을 바꿔도 따른다.
 * - 탭이 숨겨지거나 비행기가 내려앉으면 루프를 멈춘다.
 * - 매 프레임 계산에 쓰는 벡터/쿼터니언은 미리 만들어 재사용한다.
 */

// 예전 코드가 가정한 초당 프레임 수. 아래 비율들은 이 값으로 프레임당 값을 초당 값으로 바꾼 것이다.
const BASE_FPS = 60

// ---- 카메라: 화면(z=0 평면)을 정면에서 내려다본다 ----
// z=0 평면에서 화면 높이의 절반(월드). 움직임과 크기는 모두 이 월드 단위로 정해진다.
// 보통은 화면 크기와 상관없이 이 값이고(viewHalfHeightFor 참고), 너비의 절반은 여기에 가로세로 비를 곱한다.
const VIEW_HALF_HEIGHT = 10 * Math.tan(60 * Math.PI / 360)
// 세로 시야각(도). 좁게 잡아 화면 어디서나 거의 수직으로 내려다보게 한다. 넓으면 화면 모서리에서는
// 비스듬히 보여, 비행기가 기울 때 아래 손잡이(keel)와 접힌 면이 날개 밖으로 비쳐 찌그러져 보인다.
const CAMERA_FOV = 10
// 시야각을 좁힌 만큼 멀리 둬서 z=0 평면에 보이는 크기(VIEW_HALF_HEIGHT)는 그대로 둔다.
const CAMERA_Z = VIEW_HALF_HEIGHT / Math.tan(CAMERA_FOV * Math.PI / 360)
// 비행기·그림자·궤적은 모두 z=0 근처에 있으므로 깊이 범위를 좁혀 깊이 정밀도를 지킨다.
const CAMERA_NEAR = CAMERA_Z - 20
const CAMERA_FAR = CAMERA_Z + 20

// ---- 움직임 (월드 좌표, 초 단위) ----
const TARGET_FOLLOW_RATE = -Math.log(1 - 0.08) * BASE_FPS // 커서를 따라가는 점의 추종 속도(1/s). 예전 lerp 0.08/프레임
const DAMPING_RATE = -Math.log(0.96) * BASE_FPS // 공기 저항(1/s). 예전 감쇠 0.96/프레임
const SPRING = 3.0 // 목표점으로 끄는 힘 계수(1/s²)
const MAX_SPEED = 8.0 // 최고 속도(월드/s)
const ORBIT_SPEED = 1.5 // 공전 각속도(rad/s)
const ORBIT_RADIUS = 0.8 // 공전 반경(월드)
const ORBIT_RADIUS_NOISE = 0.15 // 공전 반경이 늘었다 줄었다 하는 폭(월드)
const ORBIT_FLATTEN = 0.6 // 세로 공전 반경의 비율. 가로로 납작하게 돈다
const WIND_SLOW = 0.3 // 바람에 위아래로 흔들리는 폭(월드). 느린 흔들림
const WIND_DRIFT = 0.15 // 더 느린 흔들림
const WIND_JITTER = 0.08 // 빠른 미세 진동
// 공전과 바람 때문에 비행기가 커서에서 벗어나는 최대 거리(월드)
const ORBIT_REACH_X = ORBIT_RADIUS + ORBIT_RADIUS_NOISE
const ORBIT_REACH_Y = (ORBIT_RADIUS + ORBIT_RADIUS_NOISE) * ORBIT_FLATTEN + WIND_SLOW + WIND_DRIFT + WIND_JITTER
const MAX_STEP = 1 / BASE_FPS // 물리 계산 한 단계의 최대 길이(s). 프레임이 이보다 길면 나눠서 계산한다
const MAX_FRAME_TIME = 0.1 // 한 프레임에 진행할 최대 시간(s). 끊김이나 탭 복귀 뒤 순간 이동을 막는다

// ---- 자세 ----
const HEADING_RATE = 10 // 기수가 진행 방향을 따라가는 속도(1/s)
const TURN_SPEED_REF = 0.4 // 이보다 느리면 기수 회전과 기울기를 줄인다(월드/s). 거의 멈췄을 때 방향이 튀지 않게
const BANK_ACCEL_REF = 2.4 // 선회 가속도(월드/s²)를 기울기로 바꿀 때의 기준값. 작을수록 많이 기운다
const MAX_BANK = 0.7 // 최대 기울기(rad, 약 40°). 빠르게 쫓아갈 때도 이 값에 붙지 않고 부드럽게 다가간다
const BANK_RATE = 8 // 기울기가 목표를 따라가는 속도(1/s)

// ---- 쉬기 ----
const IDLE_DELAY = 4 // 입력이 없으면 이만큼(s) 뒤에 내려앉기 시작한다
const TAKEOFF_TIME = 0.6 // 다 떠오르는 데 걸리는 시간(s)
const LANDING_TIME = 1.4 // 공전을 멈추고 다 내려앉는 데 걸리는 시간(s)
const LANDING_SPRING = 12 // 다 내려앉을 때 자리로 끄는 힘(1/s²). 감쇠는 임계값이라 넘치지 않고 빨리 선다
const TOUCHDOWN_DISTANCE = 0.25 // 내려앉을 자리까지 이보다 멀면(월드) 아직 떠 있다. 도착하면서 닿게 한다
const REST_MARGIN = 1.6 // 내려앉을 자리를 화면 가장자리에서 이만큼(비행기 모델 단위) 안쪽에 둔다. 비행기가 화면 밖으로 이만큼 넘게 나가면 몸체가 보이지 않는다
const AIRBORNE_RATE = 5 // 떠 있는 정도가 목표를 따라가는 속도(1/s). 그림자가 순간 이동하지 않게
const REST_DISTANCE = 0.003 // 목표점과 이보다 가깝고(월드, 약 0.25px)
const REST_SPEED = 0.006 // 이보다 느리면(월드/s, 약 0.5px/s) 멈춘 것으로 보고 루프를 끝낸다

// ---- 빛과 그림자 ----
// 빛은 화면 왼쪽 위·앞쪽에서 온다. 그림자는 그 반대인 오른쪽 아래로 떨어진다.
const SHADOW_DIR_X = 0.6
const SHADOW_DIR_Y = -0.8
const LIGHT_AMBIENT = 1.1
const LIGHT_KEY = 2.5
// 아래 길이는 비행기 모델 단위다. 화면 크기에 따른 비행기 스케일을 곱해 쓴다.
const CRUISE_ALTITUDE = 0.9 // 날 때 페이지 위 높이
const ALTITUDE_BOB = 0.12 // 높이가 천천히 오르내리는 폭
const LIFT_SCALE = 0.06 // 다 떠올랐을 때 비행기가 가까워 보이는 비율
const SHADOW_SOFT_MIN = 0.06 // 내려앉았을 때 그림자 가장자리 흐림 폭
const SHADOW_SOFT_PER_ALTITUDE = 0.3 // 높이에 따라 늘어나는 흐림 폭
const SHADOW_OPACITY_LANDED = 0.3
const SHADOW_OPACITY_CRUISE = 0.16
// 위에서 본 비행기 윤곽(반시계 방향): 코, 왼쪽 날개 끝, 꼬리, 오른쪽 날개 끝. 모델의 (x, z)를 그림자 평면의 (x, y)로 쓴다
const SHADOW_OUTLINE = [[0, 1.1], [-0.62, -0.5], [0, -0.58], [0.62, -0.5]]

// ---- 트레일 ----
const TRAIL_INTERVAL = 1 / BASE_FPS // 이 간격(s)으로 꼬리 위치를 기록한다. 주사율과 상관없이 길이가 같다
const TRAIL_SAMPLES = 50 // 기록 개수(약 0.8초 분량)
const TRAIL_TAIL = 0.58 // 기체 중심에서 꼬리까지 거리(모델 단위)

// 각도를 -π~π로 접는다(가장 짧은 쪽으로 돌기 위해)
function wrapAngle (angle) {
  const twoPi = Math.PI * 2
  let a = angle % twoPi
  if (a > Math.PI) a -= twoPi
  else if (a < -Math.PI) a += twoPi
  return a
}

function clamp (value, min, max) {
  return value < min ? min : (value > max ? max : value)
}

// 화면(0~size) 가장자리에서 margin만큼 안쪽에 둔다. 화면이 여백 두 배보다 좁으면 가운데에 둔다
// (내려앉을 때 화면 안으로 끌어오는 기준과 같다).
function clampInside (value, size, margin) {
  const edge = Math.min(margin, size / 2)
  return clamp(value, edge, size - edge)
}

// 새 화면(0~size) 밖으로 나간 커서 좌표를 가까운 가장자리에서 margin만큼 안쪽으로 들인다. 줄어든 화면 너머에
// 남은 실제 커서와 가장 가까운 곳이다. 안에 있으면 그대로 둔다(데스크톱에서 커서는 그 자리에 있다).
// 이미 들인 좌표(pulled)는 실제 커서 자리가 아니므로 안에 있어도 다시 margin 안쪽에 둔다.
function bringInside (value, size, margin, pulled) {
  return pulled || !(value >= 0 && value <= size) ? clampInside(value, size, margin) : value
}

// 화면(0~size) 밖으로 나간 거리. 안에 있으면 0이다.
function distanceOutside (value, size) {
  return value < 0 ? -value : (value > size ? value - size : 0)
}

// 기기가 가로로 돌아간 상태인가(휴대폰 가로). 데스크톱에서 창 크기를 바꿔서는 달라지지 않는다.
function isQuarterTurned () {
  const orientation = window.screen && window.screen.orientation
  let angle = 0
  if (orientation && typeof orientation.angle === 'number') angle = orientation.angle
  else if (typeof window.orientation === 'number') angle = window.orientation
  return Math.abs(angle) % 180 === 90
}

// 터치가 주 입력인 기기(휴대폰·태블릿)인가
function isCoarsePointer () {
  return typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches
}

// 터치 기기를 가로로 들었는가. 이때는 화면 높이가 짧아 세로 기준으로 크기를 정하면 모든 것이 작게 보인다.
function isTouchLandscape (width, height) {
  return width > height && isCoarsePointer()
}

// z=0 평면에서 화면 높이의 절반(월드). 보통은 화면 높이가 늘 같은 월드 높이에 해당한다.
// 터치 기기를 가로로 들었으면 긴 변(너비)을 그 기준으로 삼아, 세로로 들었을 때와 같은 크기로 보이게 한다
// (비행기·공전·속도·그림자가 모두 월드 단위라 함께 맞춰진다).
function viewHalfHeightFor (width, height) {
  return isTouchLandscape(width, height) ? VIEW_HALF_HEIGHT * height / width : VIEW_HALF_HEIGHT
}

export default {
  name: 'PaperAirplane',
  data() {
    return {
      // Three.js 객체들은 data에서 선언하지 않음 (반응성 불필요)
      isInitialized: false
    }
  },
  mounted() {
    // SSR 환경 체크 - 클라이언트에서만 실행
    if (!process.client) {
      return
    }
    this.watchReducedMotion()
    if (!this.prefersReducedMotion()) {
      this.scheduleInit()
    }
  },
  beforeDestroy() {
    // 컴포넌트 파괴 시 정리
    this.isDestroyed = true
    if (process.client) {
      this.unwatchReducedMotion()
      this.cancelScheduledInit()
      this.cleanup()
    }
  },
  methods: {
    // '동작 줄이기' 설정을 지켜보다가, 켜면 바로 치우고 끄면 다시 띄운다.
    watchReducedMotion() {
      if (typeof window.matchMedia !== 'function') return
      const query = window.matchMedia('(prefers-reduced-motion: reduce)')
      this.reducedMotionQuery = query
      this.onReducedMotionChange = () => {
        if (query.matches) {
          this.cancelScheduledInit()
          this.cleanup()
        } else if (!this.isDestroyed) {
          this.scheduleInit()
        }
      }
      // Safari 13 이하는 MediaQueryList에 addEventListener가 없다.
      if (typeof query.addEventListener === 'function') {
        query.addEventListener('change', this.onReducedMotionChange)
      } else if (typeof query.addListener === 'function') {
        query.addListener(this.onReducedMotionChange)
      }
    },

    unwatchReducedMotion() {
      const query = this.reducedMotionQuery
      if (!query || !this.onReducedMotionChange) return
      if (typeof query.removeEventListener === 'function') {
        query.removeEventListener('change', this.onReducedMotionChange)
      } else if (typeof query.removeListener === 'function') {
        query.removeListener(this.onReducedMotionChange)
      }
      this.reducedMotionQuery = null
      this.onReducedMotionChange = null
    },

    prefersReducedMotion() {
      return !!(this.reducedMotionQuery && this.reducedMotionQuery.matches)
    },

    // 첫 화면의 이미지·스크립트 로드와 경쟁하지 않도록 load 이벤트 뒤, 브라우저가 한가할 때 초기화한다.
    scheduleInit() {
      this.cancelScheduledInit()
      if (this.isInitialized) return

      const runWhenIdle = () => {
        this.onWindowLoad = null
        if (typeof window.requestIdleCallback === 'function') {
          this.idleCallbackId = window.requestIdleCallback(() => {
            this.idleCallbackId = null
            this.initThree()
          }, { timeout: 2000 })
        } else {
          this.idleTimeoutId = window.setTimeout(() => {
            this.idleTimeoutId = null
            this.initThree()
          }, 200)
        }
      }

      if (document.readyState === 'complete') {
        runWhenIdle()
      } else {
        this.onWindowLoad = runWhenIdle
        window.addEventListener('load', this.onWindowLoad, { once: true })
      }
    },

    cancelScheduledInit() {
      if (this.onWindowLoad) {
        window.removeEventListener('load', this.onWindowLoad)
        this.onWindowLoad = null
      }
      if (this.idleCallbackId && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(this.idleCallbackId)
        this.idleCallbackId = null
      }
      if (this.idleTimeoutId) {
        window.clearTimeout(this.idleTimeoutId)
        this.idleTimeoutId = null
      }
    },

    // 화면 크기에 따라 비행기 크기(스케일)를 조정 (모바일에서 너무 작아 보이는 문제 대응)
    // - 데스크탑: 0.20
    // - 모바일: 0.36 (더 크게)
    updateAirplaneScale() {
      if (!process.client || !this.airplane) return
      const width = window.innerWidth
      const height = window.innerHeight
      // 터치 기기를 가로로 들었으면 짧은 변(높이)으로 정해 세로로 들었을 때와 같은 크기가 되게 한다.
      const size = isTouchLandscape(width, height) ? height : width
      const isMobile = size <= 768

      // 모바일은 화면이 작을수록 더 작게 느껴지므로 약하게 보간해서 추가로 키움
      // size=768 -> 0.36, size=360 -> 약 0.40
      let scale = 0.20
      if (isMobile) {
        const t = Math.max(0, Math.min(1, (768 - size) / (768 - 360)))
        scale = 0.36 + t * 0.04
      }

      this.planeScale = Math.max(0.15, Math.min(0.45, scale))
      this.updateLift()
    },

    async initThree() {
      if (this.isDestroyed || this.isInitialized || this.prefersReducedMotion()) return
      // 기다리는 사이 정리(cleanup)되거나 새 초기화가 시작되면 이 초기화는 버린다.
      const token = this.initToken = (this.initToken || 0) + 1

      let THREE
      try {
        // 필요한 클래스만 다시 내보내는 모듈을 동적 임포트 (SSR 호환 + 트리 셰이킹)
        THREE = await import('./three')
      } catch (error) {
        // 청크를 받지 못하면 장식만 생략한다.
        return
      }
      // 기다리는 사이 컴포넌트가 사라졌거나 동작 줄이기를 켰으면 렌더러를 만들지 않는다.
      if (this.isDestroyed || token !== this.initToken || this.isInitialized || this.prefersReducedMotion()) return

      // 인스턴스 변수로 Three.js 객체 저장 (반응성 불필요)
      this.THREE = THREE
      this.scene = null
      this.camera = null
      this.renderer = null
      this.airplane = null
      this.shadow = null
      this.trailLine = null
      this.planeScale = 0.2
      // 화면 크기(px)와 z=0 평면에서 보이는 너비·높이의 절반(월드). setupScene/onResize에서 정한다
      this.viewWidth = 0
      this.viewHeight = 0
      this.viewHalfWidth = 0
      this.viewHalfHeight = VIEW_HALF_HEIGHT

      // 마우스 추적 변수
      this.mouse = new THREE.Vector2(0, 0) // NDC 좌표
      this.pointerX = null // 마지막 커서 위치(px). 창 크기가 바뀌면 이 값으로 목표를 다시 계산한다
      this.pointerY = null
      this.pointerPulledX = false // 창이 줄어 커서 좌표를 화면 안으로 들였는가(다음 입력 전까지는 실제 커서 자리가 아니다)
      this.pointerPulledY = false
      this.targetPosition = new THREE.Vector3(0, 0, 0) // 월드 좌표 타겟
      this.smoothTarget = new THREE.Vector3(0, 0, 0) // 부드러운 타겟

      // 비행기 물리 변수 (force → velocity → position)
      this.velocity = new THREE.Vector3(0, 0, 0)
      this.acceleration = new THREE.Vector3(0, 0, 0)
      this.targetDistance = 0

      // 공전·바람 변수
      this.orbitAngle = 0
      this.orbitPhase = Math.random() * Math.PI * 2
      this.windPhase1 = Math.random() * Math.PI * 2
      this.windPhase2 = Math.random() * Math.PI * 2
      // 날고 있는 동안만 흐르는 시간. 내려앉을 때는 느려지다 멈춰서 공전·바람도 그 자리에 멈춘다
      this.flightTime = 0

      // 자세: 기수 방향(화면 x축에서 반시계 방향 rad)과 기울기(rad, 음수면 진행 방향 왼쪽 날개가 내려간다)
      this.heading = 0
      this.bank = 0

      // 쉬기: flightLevel은 0(내려앉음)~1(다 떠오름)로 선형으로 움직이고, flight는 그 값을 부드럽게 바꾼 것이다
      this.idleTime = 0
      this.flightLevel = 0
      this.flight = 0
      this.airborne = 0 // 실제로 떠 있는 정도(0~1). 그림자 거리와 비행기 크기에 쓴다
      this.altitude = 0
      this.isResting = false

      // 루프
      this.running = false
      this.animationId = null
      this.lastFrameTime = null
      this.animateFrame = (time) => this.animate(time)

      // Trail (궤적) 관련
      this.trailSamples = []
      this.trailClock = 0

      // Raycaster for mouse → world 변환
      this.raycaster = new THREE.Raycaster()
      this.targetPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0) // z=0 평면

      // 매 프레임 계산에 쓰는 임시 객체 (프레임마다 new 하지 않도록 재사용)
      this.tmp = {
        orbitTarget: new THREE.Vector3(),
        toTarget: new THREE.Vector3(),
        lookAtTarget: new THREE.Vector3(),
        intersectPoint: new THREE.Vector3(),
        axisZ: new THREE.Vector3(0, 0, 1),
        bankQuat: new THREE.Quaternion(),
        lookObject: new THREE.Object3D()
      }
      // 윗면(모델 +y)이 늘 화면(카메라, 월드 +z) 쪽을 보게 한다. 진행 방향이 화면 평면 안에 있으니 뒤집힐 일이 없다.
      this.tmp.lookObject.up.set(0, 0, 1)

      try {
        this.setupScene()
        this.createAirplane()
        this.createShadow()
        this.createTrail()
        this.setupLights()
      } catch (error) {
        // WebGL을 쓸 수 없는 환경이면 장식 없이 넘어간다.
        this.cleanup()
        return
      }
      this.bindEvents()
      this.updateAirplaneScale()

      this.isInitialized = true
      this.startLoop()
    },

    setupScene() {
      const THREE = this.THREE
      const container = this.$refs.container
      const width = window.innerWidth
      const height = window.innerHeight

      // Scene 생성 - 투명 배경 (기존 UI가 보이도록)
      this.scene = new THREE.Scene()
      this.scene.background = null // 투명 배경

      // 카메라 설정 - 화면(종이)을 정면에서 내려다본다
      this.camera = new THREE.PerspectiveCamera(CAMERA_FOV, width / height, CAMERA_NEAR, CAMERA_FAR)
      this.camera.position.set(0, 0, CAMERA_Z)
      this.camera.lookAt(0, 0, 0)
      this.setViewSize(width, height)

      // 렌더러 설정 - 투명 배경
      // 그림자는 납작한 메시로 직접 그리므로 shadow map은 켜지 않는다.
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
      })
      this.renderer.setClearColor(0x000000, 0) // 완전 투명
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      this.renderer.setSize(width, height)

      container.appendChild(this.renderer.domElement)
    },

    createAirplane() {
      const THREE = this.THREE

      // 비행기 그룹 생성
      this.airplane = new THREE.Group()

      // 종이 재질 - 흰 종이. 접힌 면마다 빛을 받는 각도가 달라 밝기가 갈린다(flatShading).
      // 그림자보다 나중에 그려지도록 투명 목록에 넣는다(불투명도는 1이라 보이는 것은 같다).
      // 실제로는 불투명하므로 양면을 두 번에 나눠 그리지 않는다(forceSinglePass).
      // polygonOffset으로 면을 살짝 뒤로 밀어 윤곽선이 면에 묻히지 않게 한다.
      const paperMaterial = new THREE.MeshLambertMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        flatShading: true,
        transparent: true,
        forceSinglePass: true,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1
      })

      // 종이비행기 형태를 BufferGeometry로 직접 생성
      // 클래식 종이비행기 실루엣 (뾰족한 코, V자 날개)

      // 메인 몸체/날개 - 클래식 종이비행기 형태
      const bodyGeometry = new THREE.BufferGeometry()

      // 정점 정의 - 이미지 참고한 클래식 종이비행기
      // 형태가 “딱 종이비행기”로 읽히도록 핵심 면을 명확하게 분리
      // - 윗날개: 슬림한 삼각/사각 면(접힘선이 보이도록 분할)
      // - 아래 손잡이(keel): 중앙에서 아래로 내려오는 ‘핀’(세로 면)
      // - 아래 플랩: keel 양옆으로 접힌 면(좌/우)
      // 위에서 내려다보므로 날개는 코에서 뒤 끝까지 뻗은 길쭉한 다트 모양으로 둔다(날개 끝이 뒤쪽에 있다).
      const nose = [0, 0.02, 1.10]               // 코 끝
      const tail = [0, 0.0, -0.58]               // 꼬리 끝
      // 날개 끝을 올려 V자(상반각)를 만든다. 좌우 날개가 빛을 다르게 받아 접힌 모양이 읽힌다.
      const leftWingTip = [-0.62, 0.22, -0.50]   // 왼쪽 날개 끝
      const rightWingTip = [0.62, 0.22, -0.50]   // 오른쪽 날개 끝
      const centerFront = [0, 0.07, 0.38]        // 중앙 접힘선 - 앞쪽
      const centerBack = [0, 0.05, -0.18]        // 중앙 접힘선 - 뒤쪽

      // 아래 손잡이(keel) - 중앙에서 아래로 내려오는 세로 핀(이미지의 ‘손잡이’)
      const keelFrontTop = [0, 0.02, 0.38]       // keel 윗점(앞)
      const keelBackTop = [0, 0.02, -0.18]       // keel 윗점(뒤)
      const keelFrontDown = [0, -0.18, 0.26]     // keel 아랫점(앞)
      const keelBackDown = [0, -0.16, -0.36]     // keel 아랫점(뒤)

      // 아래 플랩(좌/우) - keel 옆으로 접힌 면. 화면 가장자리에서 비스듬히 볼 때도 날개 밑에 숨도록 안쪽에 둔다.
      const leftFlapFront = [-0.16, -0.06, 0.22]
      const leftFlapBack = [-0.22, -0.07, -0.34]
      const rightFlapFront = [0.16, -0.06, 0.22]
      const rightFlapBack = [0.22, -0.07, -0.34]

      // bodyGeometry는 “윗날개/윗면”만 담당 (실루엣 + 중앙 접힘선이 보이게 분할)
      // 좌우 날개가 상반각으로 만나므로 중앙 접힘선은 두 날개 사이의 엣지로 읽힌다(따로 얇은 면을 두지 않는다).
      // 정점 배열은 Float32BufferAttribute에 일반 배열로 넘긴다. 여기서 Float32Array를 직접 쓰면
      // Babel(IE9 대상)이 형식화 배열 폴리필을 통째로 끌어온다.
      const vertices = [
        // === 상단 날개(윗면) ===
        // 왼쪽 날개(앞)
        ...nose, ...leftWingTip, ...centerFront,
        // 왼쪽 날개(중앙~뒤)
        ...centerFront, ...leftWingTip, ...centerBack,
        ...centerBack, ...leftWingTip, ...tail,

        // 오른쪽 날개(앞)
        ...nose, ...centerFront, ...rightWingTip,
        // 오른쪽 날개(중앙~뒤)
        ...centerFront, ...centerBack, ...rightWingTip,
        ...centerBack, ...tail, ...rightWingTip
      ]

      bodyGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
      bodyGeometry.computeVertexNormals()

      const body = new THREE.Mesh(bodyGeometry, paperMaterial)

      this.airplane.add(body)

      // === 아래 손잡이(keel) + 아래 플랩은 별도 메시로 추가 (형태가 확실히 읽히도록) ===
      const keelGeometry = new THREE.BufferGeometry()
      const keelVerts = [
        // 중앙 keel(세로 핀) - 사각형(2삼각형)
        ...keelFrontTop, ...keelFrontDown, ...keelBackDown,
        ...keelFrontTop, ...keelBackDown, ...keelBackTop
      ]
      keelGeometry.setAttribute('position', new THREE.Float32BufferAttribute(keelVerts, 3))
      keelGeometry.computeVertexNormals()
      const keelMesh = new THREE.Mesh(keelGeometry, paperMaterial)
      this.airplane.add(keelMesh)

      // 좌측 아래 플랩(접힌 면)
      const leftFlapGeometry = new THREE.BufferGeometry()
      const leftFlapVerts = [
        ...keelFrontDown, ...leftFlapFront, ...leftFlapBack,
        ...keelFrontDown, ...leftFlapBack, ...keelBackDown
      ]
      leftFlapGeometry.setAttribute('position', new THREE.Float32BufferAttribute(leftFlapVerts, 3))
      leftFlapGeometry.computeVertexNormals()
      const leftFlapMesh = new THREE.Mesh(leftFlapGeometry, paperMaterial)
      this.airplane.add(leftFlapMesh)

      // 우측 아래 플랩(접힌 면)
      const rightFlapGeometry = new THREE.BufferGeometry()
      const rightFlapVerts = [
        ...keelFrontDown, ...rightFlapBack, ...rightFlapFront,
        ...keelFrontDown, ...keelBackDown, ...rightFlapBack
      ]
      rightFlapGeometry.setAttribute('position', new THREE.Float32BufferAttribute(rightFlapVerts, 3))
      rightFlapGeometry.computeVertexNormals()
      const rightFlapMesh = new THREE.Mesh(rightFlapGeometry, paperMaterial)
      this.airplane.add(rightFlapMesh)

      // 윤곽선 추가 (EdgesGeometry 사용) - 밝은 배경에서도 종이 가장자리가 보이도록
      // 12도 이상 꺾인 엣지만: 윤곽과 중앙 접힘선(16~37도)은 그리고, 날개 면을 나눈 이음매(5~10도)는 뺀다
      const edgesGeometry = new THREE.EdgesGeometry(bodyGeometry, 12)
      const edgesMaterial = new THREE.LineBasicMaterial({
        color: 0x2b3038,
        transparent: true,
        opacity: 0.42,
        linewidth: 1
      })
      const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial)
      this.airplane.add(edges)

      // keel / flap 윤곽선도 추가 (아래 접힌 구조가 읽히도록)
      const keelEdges = new THREE.LineSegments(new THREE.EdgesGeometry(keelGeometry, 10), edgesMaterial)
      const leftFlapEdges = new THREE.LineSegments(new THREE.EdgesGeometry(leftFlapGeometry, 10), edgesMaterial)
      const rightFlapEdges = new THREE.LineSegments(new THREE.EdgesGeometry(rightFlapGeometry, 10), edgesMaterial)
      this.airplane.add(keelEdges)
      this.airplane.add(leftFlapEdges)
      this.airplane.add(rightFlapEdges)

      // 비행기 스케일은 updateAirplaneScale()에서 화면 크기에 따라 설정

      // 초기 위치
      this.airplane.position.set(0, 0, 0)

      this.scene.add(this.airplane)
    },

    // 페이지(화면)에 떨어지는 그림자. 위에서 본 비행기 윤곽을 납작한 메시로 그리고,
    // 가장자리 띠의 정점 알파를 0으로 두어 흐리게 만든다(텍스처 없이).
    createShadow() {
      const THREE = this.THREE
      const count = SHADOW_OUTLINE.length

      const geometry = new THREE.BufferGeometry()
      // 정점: 안쪽 윤곽(불투명) count개 + 바깥 윤곽(투명) count개. 위치는 setShadowSoftness가 채운다
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(count * 2 * 3, 3))
      const colors = [] // RGB는 0(검정), 알파만 다르다
      for (let i = 0; i < count * 2; i++) {
        colors.push(0, 0, 0, i < count ? 1 : 0)
      }
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4))
      // 안쪽 윤곽은 볼록하므로 부채꼴로 채우고, 안쪽-바깥 사이 띠를 사각형으로 잇는다.
      const index = []
      for (let i = 1; i < count - 1; i++) {
        index.push(0, i, i + 1)
      }
      for (let i = 0; i < count; i++) {
        const j = (i + 1) % count
        index.push(i, count + i, count + j, i, count + j, j)
      }
      geometry.setIndex(index)

      // 비행기보다 먼저 그리고(renderOrder) 깊이 검사를 하지 않아, 기울어 내려간 날개를 가리지 않는다.
      const material = new THREE.MeshBasicMaterial({
        color: 0x000000,
        vertexColors: true,
        transparent: true,
        opacity: SHADOW_OPACITY_LANDED,
        depthTest: false,
        depthWrite: false
      })
      this.shadow = new THREE.Mesh(geometry, material)
      this.shadow.renderOrder = -1
      this.shadowSoftness = -1
      this.setShadowSoftness(SHADOW_SOFT_MIN)
      this.scene.add(this.shadow)
    },

    // 그림자 가장자리 흐림 폭을 바꾼다. 윤곽을 안팎으로 soft/2씩 밀어 띠를 만든다.
    setShadowSoftness(soft) {
      if (!this.shadow || Math.abs(soft - this.shadowSoftness) < 0.002) return
      this.shadowSoftness = soft
      const attribute = this.shadow.geometry.attributes.position
      const array = attribute.array
      const count = SHADOW_OUTLINE.length
      const half = soft / 2
      for (let i = 0; i < count; i++) {
        const prev = SHADOW_OUTLINE[(i + count - 1) % count]
        const cur = SHADOW_OUTLINE[i]
        const next = SHADOW_OUTLINE[(i + 1) % count]
        // 반시계 방향 다각형에서 변 (dx, dy)의 바깥쪽 법선은 (dy, -dx)
        let ax = cur[1] - prev[1]
        let ay = prev[0] - cur[0]
        let bx = next[1] - cur[1]
        let by = cur[0] - next[0]
        const al = Math.sqrt(ax * ax + ay * ay)
        const bl = Math.sqrt(bx * bx + by * by)
        ax /= al
        ay /= al
        bx /= bl
        by /= bl
        // 두 법선의 중간 방향으로, 변까지 거리가 half가 되도록 민다(마이터)
        let mx = ax + bx
        let my = ay + by
        const ml = Math.sqrt(mx * mx + my * my)
        mx /= ml
        my /= ml
        const miter = half / (mx * ax + my * ay)
        array[i * 3] = cur[0] - mx * miter
        array[i * 3 + 1] = cur[1] - my * miter
        array[i * 3 + 2] = 0
        array[(count + i) * 3] = cur[0] + mx * miter
        array[(count + i) * 3 + 1] = cur[1] + my * miter
        array[(count + i) * 3 + 2] = 0
      }
      attribute.needsUpdate = true
    },

    createTrail() {
      const THREE = this.THREE

      // 궤적을 위한 라인 지오메트리 (동적 업데이트). 맨 앞은 지금 꼬리 위치, 뒤로는 일정 간격의 기록
      const trailGeometry = new THREE.BufferGeometry()
      const vertexCount = TRAIL_SAMPLES + 1

      trailGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertexCount * 3, 3))
      // 꼬리에서 멀어질수록 옅어진다
      const colors = []
      for (let i = 0; i < vertexCount; i++) {
        const fade = 1 - i / (vertexCount - 1)
        colors.push(1, 1, 1, fade * fade)
      }
      trailGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4))
      trailGeometry.setDrawRange(0, 0)

      // 은은한 회색 트레일
      const trailMaterial = new THREE.LineBasicMaterial({
        color: 0x8a919c,
        vertexColors: true,
        transparent: true,
        opacity: 0.45,
        depthWrite: false
      })

      this.trailLine = new THREE.Line(trailGeometry, trailMaterial)
      this.trailLine.renderOrder = -1
      this.scene.add(this.trailLine)
    },

    updateTrail(dt) {
      const position = this.airplane.position
      const tailDistance = TRAIL_TAIL * this.airplane.scale.x
      const tailX = position.x - Math.cos(this.heading) * tailDistance
      const tailY = position.y - Math.sin(this.heading) * tailDistance
      const samples = this.trailSamples

      // 일정 간격으로 꼬리 위치를 맨 앞에 기록한다 (가득 찼으면 가장 오래된 벡터를 재사용)
      this.trailClock += dt
      while (this.trailClock >= TRAIL_INTERVAL) {
        this.trailClock -= TRAIL_INTERVAL
        const sample = samples.length >= TRAIL_SAMPLES ? samples.pop() : new this.THREE.Vector3()
        sample.set(tailX, tailY, position.z)
        samples.unshift(sample)
      }

      // 지오메트리 업데이트
      const attribute = this.trailLine.geometry.attributes.position
      const array = attribute.array
      array[0] = tailX
      array[1] = tailY
      array[2] = position.z
      for (let i = 0; i < samples.length; i++) {
        array[(i + 1) * 3] = samples[i].x
        array[(i + 1) * 3 + 1] = samples[i].y
        array[(i + 1) * 3 + 2] = samples[i].z
      }
      attribute.needsUpdate = true
      this.trailLine.geometry.setDrawRange(0, samples.length + 1)
    },

    setupLights() {
      const THREE = this.THREE

      // 앰비언트 라이트 - 빛을 등진 면도 너무 어둡지 않게
      const ambientLight = new THREE.AmbientLight(0xffffff, LIGHT_AMBIENT)
      this.scene.add(ambientLight)

      // 메인 디렉셔널 라이트 - 왼쪽 위·앞쪽에서 비춰 그림자 방향(오른쪽 아래)과 맞춘다
      const keyLight = new THREE.DirectionalLight(0xffffff, LIGHT_KEY)
      keyLight.position.set(-SHADOW_DIR_X * 4, -SHADOW_DIR_Y * 4, 5)
      this.scene.add(keyLight)
    },

    bindEvents() {
      this.quarterTurned = isQuarterTurned()

      // 마우스 이동 이벤트
      this.onMouseMove = (event) => {
        this.setPointer(event.clientX, event.clientY)
      }

      // 터치 이벤트 지원
      this.onTouchMove = (event) => {
        if (event.touches.length > 0) {
          const touch = event.touches[0]
          this.setPointer(touch.clientX, touch.clientY)
        }
      }

      // 리사이즈 이벤트 (창 크기가 바뀌거나 휴대폰을 돌리면 온다. 크기는 그대로이고 배율만 바뀌는 경우,
      // 예컨대 다른 배율의 모니터로 창을 옮기면 브라우저에 따라 오지 않을 수 있다)
      this.onResize = () => {
        const width = window.innerWidth
        const height = window.innerHeight
        // 크기가 0이면(창 최소화 등) 계산할 수 없으니 다음 리사이즈를 기다린다.
        if (!(width > 0 && height > 0)) return
        const oldWidth = this.viewWidth
        const oldHeight = this.viewHeight
        const oldHalfHeight = this.viewHalfHeight
        // 리사이즈 직전 크기로 그려진 몸체가 중심에서 닿던 거리(px)
        const oldMargin = REST_MARGIN * this.planeScale * oldHeight / (2 * oldHalfHeight)
        // 기기를 돌렸는가(휴대폰 회전). 창 크기만 바뀐 리사이즈와 구별한다. 회전 각도가 아직 바뀌지 않았어도
        // 터치 기기에서 가로세로가 함께 뒤바뀌었으면 돌린 것으로 본다.
        const quarterTurned = isQuarterTurned()
        const rotated = quarterTurned !== this.quarterTurned || (isCoarsePointer() && oldWidth !== width &&
          oldHeight !== height && (oldWidth > oldHeight) !== (width > height))
        this.quarterTurned = quarterTurned

        this.setViewSize(width, height)

        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
        this.renderer.setSize(width, height)
        this.updateAirplaneScale()

        // 화면 가장자리 여백(px). 내려앉을 자리를 화면 안에 둘 때와 같은 기준이다.
        const pixelsPerWorld = height / (2 * this.viewHalfHeight)
        const margin = REST_MARGIN * this.planeScale * pixelsPerWorld

        // 공전과 바람 때문에 비행기가 목표점에서 벗어나는 최대 거리(px)
        const reachX = Math.max(margin, ORBIT_REACH_X * pixelsPerWorld)
        const reachY = Math.max(margin, ORBIT_REACH_Y * pixelsPerWorld)

        // 비행기가 따라가는 목표점(커서, 커서가 아직 없으면 화면 가운데)의 옛 자리와 새 자리(px)
        let fromX = oldWidth / 2
        let fromY = oldHeight / 2
        let toX = width / 2
        let toY = height / 2
        if (this.pointerX !== null) {
          // 커서가 새 화면 밖으로 밀려났으면(창이 커서 아래에서 줄었거나 휴대폰을 돌린 경우) 화면 안으로 들인다.
          // 가장자리에서 공전 범위만큼 안쪽에 둔다. 가장자리에 붙이면 비행기가 반쯤 화면 밖에서 돈다.
          fromX = this.pointerX
          fromY = this.pointerY
          toX = bringInside(fromX, width, reachX, this.pointerPulledX)
          toY = bringInside(fromY, height, reachY, this.pointerPulledY)
          if (toX !== fromX) this.pointerPulledX = true
          if (toY !== fromY) this.pointerPulledY = true
          this.pointerX = toX
          this.pointerY = toY
        }
        const shiftX = toX - fromX
        const shiftY = toY - fromY

        // 카메라가 화면 가운데를 보므로 창 크기가 바뀌면 같은 월드 좌표가 화면의 다른 곳에 그려진다.
        // 비행기·커서를 따라가는 점·궤적이 보이던 자리(px)에 그대로 있도록 월드 좌표를 옮긴다.
        // 커서를 따라가는 점(화면에 보이지 않는다)은 목표점을 옮긴 만큼 같이 옮겨 목표점과의 거리를 지킨다.
        // 비행기는 새 화면 영역에서 리사이즈 직전에도(옛 크기) 직후에도(새 크기) 보이지 않을 때만 목표점 곁으로
        // 옮긴다. 보이던 비행기를 옮기면 순간 이동처럼 보이고, 보이지 않는 비행기를 그대로 두면 한참 뒤에야
        // 날아 들어온다. 목표점과의 상대 위치는 지키되 공전 범위를 넘으면 줄인다(멀리서 쫓아오던 비행기나
        // 목표점 반대쪽 화면 밖에 있던 비행기도 바로 보이게).
        let planeShiftX = 0
        let planeShiftY = 0
        if (oldWidth > 0 && oldHeight > 0) {
          const plane = this.toScreen(this.airplane.position, oldWidth, oldHeight, oldHalfHeight)
          // 기기를 돌렸으면(휴대폰 회전) 화면이 통째로 다시 그려져 이어서 볼 자리가 없으므로, 새 화면 밖으로
          // 조금이라도 나간 비행기는 바로 들인다.
          const hiddenBeyond = rotated ? 0 : Math.max(margin, oldMargin)
          if (distanceOutside(plane.x, width) > hiddenBeyond || distanceOutside(plane.y, height) > hiddenBeyond) {
            const relX = plane.x - fromX
            const relY = plane.y - fromY
            planeShiftX = shiftX + clamp(relX, -reachX, reachX) - relX
            planeShiftY = shiftY + clamp(relY, -reachY, reachY) - relY
          }
        }
        const planeMoved = planeShiftX !== 0 || planeShiftY !== 0
        if (planeMoved) {
          // 보이지 않던 자리에서 옮겼으니 쫓던 속도는 버린다(그대로 두면 곧장 다시 화면 밖으로 날아간다).
          this.velocity.set(0, 0, 0)
        }
        // 내려앉은 비행기와 옮긴 비행기는 여백 안에 둔다.
        this.keepScreenPosition(this.airplane.position, oldWidth, oldHeight, oldHalfHeight, planeShiftX, planeShiftY, this.isResting || planeMoved ? margin : null)
        this.keepScreenPosition(this.smoothTarget, oldWidth, oldHeight, oldHalfHeight, shiftX, shiftY, null)
        if (this.isResting || planeMoved) {
          // 쉬는 중이거나 비행기를 옮겼으면 궤적을 비운다(옛 자리와 새 자리 사이에 선이 그어지지 않게).
          // 비행기는 새 자리에서 궤적을 새로 그린다.
          this.trailSamples.length = 0
        } else {
          for (let i = 0; i < this.trailSamples.length; i++) {
            this.keepScreenPosition(this.trailSamples[i], oldWidth, oldHeight, oldHalfHeight, 0, 0, null)
          }
        }
        this.updateTargetPosition()
        if (this.isResting) {
          // 쉬는 동안 커서를 따라가는 점은 목표점에 붙어 있었다. 다음 입력 때 다른 자리에서 출발하지 않게 맞춘다.
          this.smoothTarget.copy(this.targetPosition)
        }
        this.updateLift()
        this.updateTrail(0)

        // setSize는 캔버스를 지운다. 내려앉아 루프가 멈춰 있으면 한 번 다시 그린다.
        if (!this.running) {
          this.renderOnce()
        }
      }

      // 탭이 숨겨지면 멈추고, 다시 보이면 이어서 그린다. 내려앉아 있으면 한 번만 다시 그린다.
      this.onVisibilityChange = () => {
        if (document.hidden) {
          this.stopLoop()
        } else if (this.isResting) {
          this.renderOnce()
        } else {
          this.startLoop()
        }
      }

      // GPU가 초기화되는 등으로 WebGL 컨텍스트가 복구되면 캔버스가 비어 있다(three는 다시 그리지 않는다).
      // 루프가 멈춰 있으면 한 번 다시 그린다.
      this.onContextRestored = () => {
        if (!this.running) {
          this.renderOnce()
        }
      }

      window.addEventListener('mousemove', this.onMouseMove, { passive: true })
      window.addEventListener('touchmove', this.onTouchMove, { passive: true })
      window.addEventListener('resize', this.onResize, { passive: true })
      document.addEventListener('visibilitychange', this.onVisibilityChange)
      this.renderer.domElement.addEventListener('webglcontextrestored', this.onContextRestored)
    },

    // 화면 크기를 정하고 카메라를 맞춘다. 보이는 월드 높이가 바뀌면 시야각을 바꿔 카메라 거리는 그대로 둔다.
    setViewSize(width, height) {
      this.viewWidth = width
      this.viewHeight = height
      this.viewHalfHeight = viewHalfHeightFor(width, height)
      this.viewHalfWidth = this.viewHalfHeight * width / height
      this.camera.aspect = width / height
      this.camera.fov = this.viewHalfHeight === VIEW_HALF_HEIGHT
        ? CAMERA_FOV
        : Math.atan(this.viewHalfHeight / CAMERA_Z) * 360 / Math.PI
      this.camera.updateProjectionMatrix()
    },

    // z=0 평면 위의 점 v가 width x height 화면(보이는 높이의 절반 halfHeight)에서 그려지는 자리(px)
    toScreen(v, width, height, halfHeight) {
      return {
        x: (v.x / (halfHeight * width / height) + 1) / 2 * width,
        y: (1 - v.y / halfHeight) / 2 * height
      }
    },

    // 옛 화면(oldWidth x oldHeight, 보이는 높이의 절반 oldHalfHeight)에서 v가 그려지던 자리(px)에서
    // (shiftX, shiftY)만큼 옮긴 곳에 새 화면에서 그려지도록 월드 좌표를 바꾼다. margin(px)이 있으면
    // 가장자리에서 그만큼 안쪽에 둔다. 모든 점은 z=0 평면 위에 있다.
    keepScreenPosition(v, oldWidth, oldHeight, oldHalfHeight, shiftX, shiftY, margin) {
      if (!(oldWidth > 0 && oldHeight > 0)) return
      const old = this.toScreen(v, oldWidth, oldHeight, oldHalfHeight)
      let x = old.x + shiftX
      let y = old.y + shiftY
      if (margin !== null) {
        x = clampInside(x, this.viewWidth, margin)
        y = clampInside(y, this.viewHeight, margin)
      }
      v.x = (x / this.viewWidth * 2 - 1) * this.viewHalfWidth
      v.y = (1 - y / this.viewHeight * 2) * this.viewHalfHeight
    },

    renderOnce() {
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera)
      }
    },

    setPointer(clientX, clientY) {
      this.pointerX = clientX
      this.pointerY = clientY
      this.pointerPulledX = false
      this.pointerPulledY = false
      this.updateTargetPosition()
      this.wake()
    },

    updateTargetPosition() {
      if (this.pointerX === null) return

      // NDC 좌표로 변환 (-1 ~ 1)
      this.mouse.x = (this.pointerX / window.innerWidth) * 2 - 1
      this.mouse.y = -(this.pointerY / window.innerHeight) * 2 + 1

      // Raycaster를 사용해 마우스 → 월드 좌표 변환
      // z=0 평면과의 교차점 계산
      this.raycaster.setFromCamera(this.mouse, this.camera)

      const hit = this.raycaster.ray.intersectPlane(this.targetPlane, this.tmp.intersectPoint)

      if (hit) {
        this.targetPosition.copy(hit)
      }
    },

    // 입력이 오면 쉬는 시간을 처음부터 다시 세고, 내려앉아 멈춰 있었으면 다시 띄운다.
    wake() {
      this.idleTime = 0
      if (this.isResting) {
        this.isResting = false
        this.startLoop()
      }
    },

    startLoop() {
      if (this.running || !this.renderer || this.isResting || document.hidden) return
      this.running = true
      this.lastFrameTime = null
      this.animationId = requestAnimationFrame(this.animateFrame)
    },

    stopLoop() {
      this.running = false
      if (this.animationId) {
        cancelAnimationFrame(this.animationId)
        this.animationId = null
      }
    },

    animate(time) {
      this.animationId = null
      if (!this.running) return

      // 실제 경과 시간(초). 루프를 막 시작한 프레임은 0으로 두고, 너무 긴 프레임은 잘라 낸다.
      const now = typeof time === 'number' ? time : Date.now()
      let deltaTime = this.lastFrameTime === null ? 0 : (now - this.lastFrameTime) / 1000
      this.lastFrameTime = now
      if (!(deltaTime > 0)) {
        deltaTime = 0
      } else if (deltaTime > MAX_FRAME_TIME) {
        deltaTime = MAX_FRAME_TIME
      }

      this.update(deltaTime)
      this.renderer.render(this.scene, this.camera)

      if (this.canRest()) {
        // 다 내려앉았으면 마지막 모습을 남겨 두고 루프를 멈춘다. 입력이 오면 wake()가 다시 시작한다.
        this.isResting = true
        this.running = false
        return
      }
      this.animationId = requestAnimationFrame(this.animateFrame)
    },

    update(dt) {
      // === 1. 쉬기/날기 상태 ===
      this.idleTime += dt
      if (this.idleTime < IDLE_DELAY) {
        this.flightLevel = Math.min(1, this.flightLevel + dt / TAKEOFF_TIME)
      } else {
        this.flightLevel = Math.max(0, this.flightLevel - dt / LANDING_TIME)
      }
      const level = this.flightLevel
      this.flight = level * level * (3 - 2 * level)

      // === 2. 물리: 프레임이 길면 여러 단계로 나눠 주사율과 상관없이 같은 궤적을 만든다 ===
      if (dt > 0) {
        // 60Hz의 프레임 간격 흔들림(약 16~17.5ms)은 한 단계로 처리한다.
        const steps = Math.max(1, Math.ceil(dt / MAX_STEP - 0.05))
        const step = dt / steps
        for (let i = 0; i < steps; i++) {
          this.updatePhysics(step, this.flight)
        }
      }

      // === 3. 떠 있는 정도: 갈 자리까지 아직 멀면 떠 있다가, 도착하면서 닿는다 ===
      // 내려앉을 때는 땅에 닿은 채 끌려가지 않게, 이륙할 때는 땅에 붙은 채 미끄러지지 않게 한다.
      // 입력이 있는 동안에는 줄어들지 않는다(착륙하다 다시 떠오를 때 내려앉았다 오르는 출렁임이 없게).
      const remaining = clamp(this.targetDistance / TOUCHDOWN_DISTANCE, 0, 1)
      let airborneTarget = Math.max(this.flight, remaining * remaining * (3 - 2 * remaining))
      if (this.idleTime < IDLE_DELAY) {
        airborneTarget = Math.max(airborneTarget, this.airborne)
      }
      this.airborne += (airborneTarget - this.airborne) * (1 - Math.exp(-AIRBORNE_RATE * dt))

      // === 4. 자세, 높이·그림자, 궤적 ===
      this.updateRotation(dt)
      this.updateLift()
      this.updateTrail(dt)
    },

    updatePhysics(dt, flight) {
      const tmp = this.tmp
      // 날고 있는 정도만큼만 시간이 흐른다. 내려앉으면 공전과 바람이 그 자리에 멈춘다.
      this.flightTime += dt * flight
      const time = this.flightTime

      // === 1. 타겟 위치 부드럽게 보간 (급격한 변화 방지) ===
      this.smoothTarget.lerp(this.targetPosition, 1 - Math.exp(-TARGET_FOLLOW_RATE * dt))

      // === 2. 공전 계산 ===
      this.orbitAngle += ORBIT_SPEED * flight * dt

      // 공전 반경 - sin/cos + 노이즈로 자연스러운 변화
      const radiusNoise = Math.sin(time * 0.7 + this.orbitPhase) * ORBIT_RADIUS_NOISE
      const orbitRadius = ORBIT_RADIUS + radiusNoise

      // 공전 오프셋 계산
      const orbitX = Math.cos(this.orbitAngle) * orbitRadius
      const orbitY = Math.sin(this.orbitAngle) * orbitRadius * ORBIT_FLATTEN // Y축은 더 납작하게

      // === 3. 바람에 흔들리는 움직임 (다중 사인파 합성으로 단조롭지 않게) ===
      const wind1 = Math.sin(time * 1.2 + this.windPhase1) * WIND_SLOW
      const wind2 = Math.sin(time * 0.5 + this.windPhase2) * WIND_DRIFT
      const wind3 = Math.sin(time * 2.1) * WIND_JITTER // 빠른 미세 진동
      const windOffset = wind1 + wind2 + wind3

      // 최종 목표 위치 = 부드러운 타겟 + 공전 오프셋 + 바람
      const orbitTarget = tmp.orbitTarget.set(
        this.smoothTarget.x + orbitX,
        this.smoothTarget.y + orbitY + windOffset,
        this.smoothTarget.z
      )

      // 내려앉는 동안은 내려앉을 자리를 화면 가장자리 안쪽으로 끌어온다(화면 밖에 멈춰 안 보이는 일이 없게).
      const landing = 1 - flight
      if (landing > 0) {
        const margin = REST_MARGIN * this.planeScale
        const limitX = Math.max(0, this.viewHalfWidth - margin)
        const limitY = Math.max(0, this.viewHalfHeight - margin)
        orbitTarget.x += (clamp(orbitTarget.x, -limitX, limitX) - orbitTarget.x) * landing
        orbitTarget.y += (clamp(orbitTarget.y, -limitY, limitY) - orbitTarget.y) * landing
      }

      // === 4. 관성 기반 이동 (force → velocity → position) ===
      // 내려앉는 동안은 스프링을 단단하게, 감쇠를 임계값까지 올려 오래 미끄러지지 않고 멈추게 한다.
      // 날고 있을 때(landing = 0)는 예전 값 그대로다.
      const spring = SPRING + (LANDING_SPRING - SPRING) * landing
      const damping = DAMPING_RATE + (2 * Math.sqrt(spring) - DAMPING_RATE) * landing

      // 거리에 비례한 힘, 가속도 = 힘 / 질량 (질량 = 1 가정)
      const toTarget = tmp.toTarget.copy(orbitTarget).sub(this.airplane.position)
      this.targetDistance = toTarget.length()
      this.acceleration.copy(toTarget).multiplyScalar(spring)

      // 속도 업데이트: v = v + a * dt, 감쇠(공기 저항)
      this.velocity.addScaledVector(this.acceleration, dt)
      this.velocity.multiplyScalar(Math.exp(-damping * dt))

      // 최대 속도 제한
      const speed = this.velocity.length()
      if (speed > MAX_SPEED) {
        this.velocity.multiplyScalar(MAX_SPEED / speed)
      }

      // 위치 업데이트: p = p + v * dt
      this.airplane.position.addScaledVector(this.velocity, dt)
    },

    updateRotation(dt) {
      const tmp = this.tmp
      const vx = this.velocity.x
      const vy = this.velocity.y
      const speed = Math.sqrt(vx * vx + vy * vy)
      // 거의 멈췄을 때는 진행 방향이 의미가 없으므로 기수 회전과 기울기를 줄인다.
      const turnWeight = Math.min(1, speed / TURN_SPEED_REF)

      let bankTarget = 0
      if (speed > 1e-6) {
        // === 1. 기수(heading): 진행 방향을 부드럽게 따라간다 ===
        const course = Math.atan2(vy, vx)
        const follow = 1 - Math.exp(-HEADING_RATE * turnWeight * dt)
        this.heading = wrapAngle(this.heading + wrapAngle(course - this.heading) * follow)

        // === 2. 기울기(bank): 선회 가속도(진행 방향에 수직인 성분)에 맞춰 안쪽으로 기운다 ===
        // 왼쪽(반시계)으로 돌면 lateral > 0. 모델 +x 날개가 진행 방향 왼쪽이고,
        // 기수 축(+z) 기준 음의 회전이 그 날개를 화면 안쪽으로 내리므로 부호를 뒤집는다.
        const lateral = (vx * this.acceleration.y - vy * this.acceleration.x) / speed
        // x / √(1 + x²): 작은 선회에서는 비례하고, 큰 선회에서는 MAX_BANK에 부드럽게 다가간다
        const turn = lateral / BANK_ACCEL_REF
        bankTarget = -MAX_BANK * turn / Math.sqrt(1 + turn * turn) * turnWeight
      }
      this.bank += (bankTarget - this.bank) * (1 - Math.exp(-BANK_RATE * dt))

      // === 3. 자세 = 기수 방향으로 lookAt(윗면은 화면 쪽) × 기수 축 기울기 ===
      const position = this.airplane.position
      const lookObject = tmp.lookObject
      lookObject.position.copy(position)
      lookObject.lookAt(tmp.lookAtTarget.set(
        position.x + Math.cos(this.heading),
        position.y + Math.sin(this.heading),
        position.z
      ))
      tmp.bankQuat.setFromAxisAngle(tmp.axisZ, this.bank)
      this.airplane.quaternion.copy(lookObject.quaternion).multiply(tmp.bankQuat)
    },

    // 떠 있는 높이에 맞춰 비행기 크기와 그림자(위치·흐림·진하기)를 정한다.
    updateLift() {
      if (!this.airplane || !this.shadow) return
      const bob = ALTITUDE_BOB * Math.sin(this.flightTime * 0.9 + this.orbitPhase)
      this.altitude = this.airborne * (CRUISE_ALTITUDE + bob)
      const lift = Math.min(1, this.altitude / CRUISE_ALTITUDE)

      const scale = this.planeScale * (1 + LIFT_SCALE * lift)
      this.airplane.scale.set(scale, scale, scale)

      // 그림자는 비행기 바로 아래 페이지에서, 빛 반대쪽으로 높이만큼 밀려난다.
      const shadow = this.shadow
      const position = this.airplane.position
      const offset = this.altitude * this.planeScale
      shadow.position.set(
        position.x + SHADOW_DIR_X * offset,
        position.y + SHADOW_DIR_Y * offset,
        position.z
      )
      shadow.rotation.z = this.heading - Math.PI / 2
      // 기울어지면 날개가 페이지에 짧게 비친다.
      shadow.scale.set(this.planeScale * Math.cos(this.bank), this.planeScale, 1)
      shadow.material.opacity = SHADOW_OPACITY_LANDED + (SHADOW_OPACITY_CRUISE - SHADOW_OPACITY_LANDED) * lift
      this.setShadowSoftness(SHADOW_SOFT_MIN + SHADOW_SOFT_PER_ALTITUDE * this.altitude)
    },

    // 다 내려앉아 더 움직일 것이 없는지
    canRest() {
      return this.idleTime >= IDLE_DELAY &&
        this.flightLevel === 0 &&
        this.airborne < 0.01 &&
        this.targetDistance < REST_DISTANCE &&
        this.velocity.length() < REST_SPEED &&
        Math.abs(this.bank) < 0.002
    },

    cleanup() {
      // 진행 중인 초기화가 있으면 무효로 만든다
      this.initToken = (this.initToken || 0) + 1

      // 애니메이션 중지
      this.running = false
      if (this.animationId) {
        cancelAnimationFrame(this.animationId)
        this.animationId = null
      }

      // 이벤트 리스너 제거
      if (this.onMouseMove) {
        window.removeEventListener('mousemove', this.onMouseMove)
        this.onMouseMove = null
      }
      if (this.onTouchMove) {
        window.removeEventListener('touchmove', this.onTouchMove)
        this.onTouchMove = null
      }
      if (this.onResize) {
        window.removeEventListener('resize', this.onResize)
        this.onResize = null
      }
      if (this.onVisibilityChange) {
        document.removeEventListener('visibilitychange', this.onVisibilityChange)
        this.onVisibilityChange = null
      }

      // Three.js 리소스 정리
      if (this.scene) {
        this.scene.traverse((object) => {
          if (object.geometry) {
            object.geometry.dispose()
          }
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose())
            } else {
              object.material.dispose()
            }
          }
        })
      }

      // 렌더러 정리
      if (this.renderer) {
        const canvas = this.renderer.domElement
        if (this.onContextRestored) {
          canvas.removeEventListener('webglcontextrestored', this.onContextRestored)
          this.onContextRestored = null
        }
        this.renderer.dispose()
        // dispose()는 버퍼만 풀고 WebGL 컨텍스트는 가비지 컬렉션 때까지 남긴다. 동작 줄이기를 껐다 켤 때마다
        // 새 렌더러를 만들므로 바로 놓아준다(dispose 뒤라 three의 'Context Lost' 로그도 남지 않는다).
        // 이미 잃은 컨텍스트는 놓을 것이 없고, 그때 부르면 three가 확장이 없다는 경고를 남긴다.
        const gl = this.renderer.getContext()
        if (gl && !gl.isContextLost()) {
          this.renderer.forceContextLoss()
        }
        if (this.$refs.container && canvas && canvas.parentNode === this.$refs.container) {
          this.$refs.container.removeChild(canvas)
        }
      }

      // 참조 정리
      this.scene = null
      this.camera = null
      this.renderer = null
      this.airplane = null
      this.shadow = null
      this.trailLine = null
      this.isResting = false
      this.isInitialized = false
    }
  }
}
</script>

<style lang="scss" scoped>
.paper-airplane-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  pointer-events: none; // 기존 UI 조작 방해하지 않음
  overflow: hidden;

  canvas {
    display: block;
  }
}

// 인쇄할 때는 장식용 오버레이를 찍지 않는다(고정 요소라 모든 페이지에 반복될 수 있다).
@media print {
  .paper-airplane-container {
    display: none;
  }
}
</style>
