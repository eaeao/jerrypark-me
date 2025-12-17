<template>
  <div ref="container" class="paper-airplane-container"></div>
</template>

<script>
/**
 * PaperAirplane 컴포넌트
 * 마우스를 따라다니며 공전하는 3D 종이비행기 애니메이션
 * 
 * 핵심 특성:
 * - 마우스 타겟을 중심으로 공전
 * - 관성 기반 이동 (force → velocity → position)
 * - slerp 기반 부드러운 회전
 * - 바람을 타는 상승/하강 효과
 */
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
    if (process.client) {
      this.initThree()
    }
  },
  beforeDestroy() {
    // 컴포넌트 파괴 시 정리
    if (process.client) {
      this.cleanup()
    }
  },
  methods: {
    async initThree() {
      // Three.js 동적 임포트 (SSR 호환)
      const THREE = await import('three')
      
      // 인스턴스 변수로 Three.js 객체 저장 (반응성 불필요)
      this.THREE = THREE
      this.scene = null
      this.camera = null
      this.renderer = null
      this.airplane = null
      this.animationId = null
      
      // 마우스 추적 변수
      this.mouse = new THREE.Vector2(0, 0) // NDC 좌표
      this.targetPosition = new THREE.Vector3(0, 0, 0) // 월드 좌표 타겟
      this.smoothTarget = new THREE.Vector3(0, 0, 0) // 부드러운 타겟
      
      // 비행기 물리 변수 (force → velocity → position)
      this.velocity = new THREE.Vector3(0, 0, 0)
      this.acceleration = new THREE.Vector3(0, 0, 0)
      
      // 공전 변수
      this.orbitAngle = 0
      this.orbitPhase = Math.random() * Math.PI * 2
      
      // 회전 관련
      this.currentQuaternion = new THREE.Quaternion()
      this.targetQuaternion = new THREE.Quaternion()
      this.previousPosition = new THREE.Vector3(0, 0, 0)
      this.lastMoveDirection = null // 이전 이동 방향 (roll 계산용)
      
      // 바람/진동 변수
      this.time = 0
      this.windPhase1 = Math.random() * Math.PI * 2
      this.windPhase2 = Math.random() * Math.PI * 2
      
      // Trail (궤적) 관련
      this.trailPositions = []
      this.trailLine = null
      this.maxTrailLength = 50
      
      // Raycaster for mouse → world 변환
      this.raycaster = new THREE.Raycaster()
      this.targetPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0) // z=0 평면
      
      this.setupScene()
      this.createAirplane()
      this.createTrail()
      this.setupLights()
      this.bindEvents()
      this.animate()
      
      this.isInitialized = true
    },
    
    setupScene() {
      const THREE = this.THREE
      const container = this.$refs.container
      const width = window.innerWidth
      const height = window.innerHeight
      
      // Scene 생성 - 투명 배경 (기존 UI가 보이도록)
      this.scene = new THREE.Scene()
      this.scene.background = null // 투명 배경
      
      // 카메라 설정 - 정면 뷰
      this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
      this.camera.position.set(0, 0, 10)
      this.camera.lookAt(0, 0, 0)
      
      // 렌더러 설정 - 투명 배경
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
      })
      this.renderer.setClearColor(0x000000, 0) // 완전 투명
      this.renderer.setSize(width, height)
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      this.renderer.shadowMap.enabled = true
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
      
      container.appendChild(this.renderer.domElement)
    },
    
    createAirplane() {
      const THREE = this.THREE
      
      // 비행기 그룹 생성
      this.airplane = new THREE.Group()
      
      // 종이 재질 - 흰색, 매트한 단색 (조명 영향 없음)
      const paperMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide
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
      const nose = [0, 0.02, 1.05]               // 코 끝
      const tail = [0, 0.0, -0.55]               // 꼬리 끝
      const leftWingTip = [-0.92, 0.12, -0.20]   // 왼쪽 날개 끝 (위로 살짝)
      const rightWingTip = [0.92, 0.12, -0.20]   // 오른쪽 날개 끝 (위로 살짝)
      const centerFront = [0, 0.07, 0.38]        // 중앙 접힘선 - 앞쪽
      const centerBack = [0, 0.05, -0.18]        // 중앙 접힘선 - 뒤쪽

      // 아래 손잡이(keel) - 중앙에서 아래로 내려오는 세로 핀(이미지의 ‘손잡이’)
      const keelFrontTop = [0, 0.02, 0.38]       // keel 윗점(앞)
      const keelBackTop = [0, 0.02, -0.18]       // keel 윗점(뒤)
      const keelFrontDown = [0, -0.18, 0.26]     // keel 아랫점(앞)
      const keelBackDown = [0, -0.16, -0.36]     // keel 아랫점(뒤)

      // 아래 플랩(좌/우) - keel 옆으로 접힌 면
      const leftFlapFront = [-0.24, -0.07, 0.26]
      const leftFlapBack = [-0.32, -0.08, -0.34]
      const rightFlapFront = [0.24, -0.07, 0.26]
      const rightFlapBack = [0.32, -0.08, -0.34]

      // bodyGeometry는 “윗날개/윗면”만 담당 (실루엣 + 중앙 접힘선이 보이게 분할)
      const vertices = new Float32Array([
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
        ...centerBack, ...tail, ...rightWingTip,

        // 중앙 접힘선(윗면) - 라인이 엣지로 읽히게 얇은 면 추가
        ...nose, ...centerFront, ...centerBack,
        ...centerBack, ...centerFront, ...tail
      ])
      
      bodyGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
      bodyGeometry.computeVertexNormals()
      
      const body = new THREE.Mesh(bodyGeometry, paperMaterial)
      body.castShadow = true
      body.receiveShadow = true
      
      this.airplane.add(body)

      // === 아래 손잡이(keel) + 아래 플랩은 별도 메시로 추가 (형태가 확실히 읽히도록) ===
      const keelGeometry = new THREE.BufferGeometry()
      const keelVerts = new Float32Array([
        // 중앙 keel(세로 핀) - 사각형(2삼각형)
        ...keelFrontTop, ...keelFrontDown, ...keelBackDown,
        ...keelFrontTop, ...keelBackDown, ...keelBackTop
      ])
      keelGeometry.setAttribute('position', new THREE.BufferAttribute(keelVerts, 3))
      keelGeometry.computeVertexNormals()
      const keelMesh = new THREE.Mesh(keelGeometry, paperMaterial)
      this.airplane.add(keelMesh)

      // 좌측 아래 플랩(접힌 면)
      const leftFlapGeometry = new THREE.BufferGeometry()
      const leftFlapVerts = new Float32Array([
        ...keelFrontDown, ...leftFlapFront, ...leftFlapBack,
        ...keelFrontDown, ...leftFlapBack, ...keelBackDown
      ])
      leftFlapGeometry.setAttribute('position', new THREE.BufferAttribute(leftFlapVerts, 3))
      leftFlapGeometry.computeVertexNormals()
      const leftFlapMesh = new THREE.Mesh(leftFlapGeometry, paperMaterial)
      this.airplane.add(leftFlapMesh)

      // 우측 아래 플랩(접힌 면)
      const rightFlapGeometry = new THREE.BufferGeometry()
      const rightFlapVerts = new Float32Array([
        ...keelFrontDown, ...rightFlapBack, ...rightFlapFront,
        ...keelFrontDown, ...keelBackDown, ...rightFlapBack
      ])
      rightFlapGeometry.setAttribute('position', new THREE.BufferAttribute(rightFlapVerts, 3))
      rightFlapGeometry.computeVertexNormals()
      const rightFlapMesh = new THREE.Mesh(rightFlapGeometry, paperMaterial)
      this.airplane.add(rightFlapMesh)
      
      // 윤곽선 추가 (EdgesGeometry 사용)
      const edgesGeometry = new THREE.EdgesGeometry(bodyGeometry, 15) // 15도 이상 각도 차이나는 엣지만
      const edgesMaterial = new THREE.LineBasicMaterial({
        color: 0x111111, // 아주 약한 윤곽선 (실루엣만 살짝)
        transparent: true,
        opacity: 0.16,
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
      
      // Fake shadow (바닥에 원형 그림자)
      const shadowGeometry = new THREE.CircleGeometry(0.3, 16)
      const shadowMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.15,
        depthWrite: false
      })
      const fakeShadow = new THREE.Mesh(shadowGeometry, shadowMaterial)
      fakeShadow.rotation.x = -Math.PI / 2
      fakeShadow.position.y = -0.5
      this.airplane.add(fakeShadow)
      this.fakeShadow = fakeShadow
      
      // 비행기 스케일 - 매우 작게 (0.2)
      this.airplane.scale.set(0.2, 0.2, 0.2)
      
      // 초기 위치
      this.airplane.position.set(0, 0, 0)
      
      this.scene.add(this.airplane)
    },
    
    createTrail() {
      const THREE = this.THREE
      
      // 궤적을 위한 라인 지오메트리 (동적 업데이트)
      const trailGeometry = new THREE.BufferGeometry()
      
      // 초기 빈 포지션 배열
      const positions = new Float32Array(this.maxTrailLength * 3)
      trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      trailGeometry.setDrawRange(0, 0)
      
      // 은은한 회색 트레일
      const trailMaterial = new THREE.LineBasicMaterial({
        color: 0xcccccc,
        transparent: true,
        opacity: 0.2,
        linewidth: 1
      })
      
      this.trailLine = new THREE.Line(trailGeometry, trailMaterial)
      this.scene.add(this.trailLine)
    },
    
    updateTrail() {
      // 현재 비행기 위치를 트레일에 추가
      const pos = this.airplane.position.clone()
      this.trailPositions.unshift(pos)
      
      // 최대 길이 유지
      if (this.trailPositions.length > this.maxTrailLength) {
        this.trailPositions.pop()
      }
      
      // 지오메트리 업데이트
      const positions = this.trailLine.geometry.attributes.position.array
      for (let i = 0; i < this.trailPositions.length; i++) {
        positions[i * 3] = this.trailPositions[i].x
        positions[i * 3 + 1] = this.trailPositions[i].y
        positions[i * 3 + 2] = this.trailPositions[i].z
      }
      
      this.trailLine.geometry.attributes.position.needsUpdate = true
      this.trailLine.geometry.setDrawRange(0, this.trailPositions.length)
    },
    
    setupLights() {
      const THREE = this.THREE
      
      // 앰비언트 라이트 - 전체적인 밝기 (강하게)
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.5)
      this.scene.add(ambientLight)
      
      // 메인 디렉셔널 라이트 - 위에서 비추는 느낌
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2)
      directionalLight.position.set(5, 10, 7)
      directionalLight.castShadow = true
      directionalLight.shadow.mapSize.width = 512
      directionalLight.shadow.mapSize.height = 512
      directionalLight.shadow.camera.near = 0.5
      directionalLight.shadow.camera.far = 50
      this.scene.add(directionalLight)
      
      // 보조 라이트 - 반대편에서 부드럽게
      const fillLight = new THREE.DirectionalLight(0xffffff, 0.8)
      fillLight.position.set(-3, 2, -5)
      this.scene.add(fillLight)
    },
    
    bindEvents() {
      // 마우스 이동 이벤트
      this.onMouseMove = (event) => {
        // NDC 좌표로 변환 (-1 ~ 1)
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
        
        this.updateTargetPosition()
      }
      
      // 터치 이벤트 지원
      this.onTouchMove = (event) => {
        if (event.touches.length > 0) {
          const touch = event.touches[0]
          this.mouse.x = (touch.clientX / window.innerWidth) * 2 - 1
          this.mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1
          
          this.updateTargetPosition()
        }
      }
      
      // 리사이즈 이벤트
      this.onResize = () => {
        const width = window.innerWidth
        const height = window.innerHeight
        
        this.camera.aspect = width / height
        this.camera.updateProjectionMatrix()
        
        this.renderer.setSize(width, height)
      }
      
      window.addEventListener('mousemove', this.onMouseMove, { passive: true })
      window.addEventListener('touchmove', this.onTouchMove, { passive: true })
      window.addEventListener('resize', this.onResize, { passive: true })
    },
    
    updateTargetPosition() {
      const THREE = this.THREE
      
      // Raycaster를 사용해 마우스 → 월드 좌표 변환
      // z=0 평면과의 교차점 계산
      this.raycaster.setFromCamera(this.mouse, this.camera)
      
      const intersectPoint = new THREE.Vector3()
      this.raycaster.ray.intersectPlane(this.targetPlane, intersectPoint)
      
      if (intersectPoint) {
        this.targetPosition.copy(intersectPoint)
      }
    },
    
    animate() {
      this.animationId = requestAnimationFrame(() => this.animate())
      
      const deltaTime = 1 / 60 // 고정 델타타임 (60fps 가정)
      this.time += deltaTime
      
      this.updatePhysics(deltaTime)
      this.updateRotation(deltaTime)
      this.updateTrail()
      
      // fake shadow 위치 업데이트
      if (this.fakeShadow) {
        // 그림자는 비행기 아래 고정 y 위치에
        this.fakeShadow.position.y = -this.airplane.position.y - 0.3
        // 고도에 따른 그림자 크기/투명도 변화
        const altitude = Math.max(0.1, this.airplane.position.y + 1)
        const shadowScale = 1 + altitude * 0.3
        this.fakeShadow.scale.set(shadowScale, shadowScale, 1)
        this.fakeShadow.material.opacity = 0.15 / (1 + altitude * 0.5)
      }
      
      this.renderer.render(this.scene, this.camera)
    },
    
    updatePhysics(dt) {
      const THREE = this.THREE
      
      // === 1. 타겟 위치 부드럽게 보간 (급격한 변화 방지) ===
      const targetLerpFactor = 0.08
      this.smoothTarget.lerp(this.targetPosition, targetLerpFactor)
      
      // === 2. 공전 계산 ===
      // 시간 기반 공전 각도 증가
      const orbitSpeed = 1.5 // 초당 라디안
      this.orbitAngle += orbitSpeed * dt
      
      // 공전 반경 - sin/cos + 노이즈로 자연스러운 변화
      const baseRadius = 0.8 // 작은 공전 반경
      const radiusNoise = Math.sin(this.time * 0.7 + this.orbitPhase) * 0.15
      const orbitRadius = baseRadius + radiusNoise
      
      // 공전 오프셋 계산
      const orbitX = Math.cos(this.orbitAngle) * orbitRadius
      const orbitY = Math.sin(this.orbitAngle) * orbitRadius * 0.6 // Y축은 더 납작하게
      
      // 최종 목표 위치 = 부드러운 타겟 + 공전 오프셋
      const orbitTarget = new THREE.Vector3(
        this.smoothTarget.x + orbitX,
        this.smoothTarget.y + orbitY,
        this.smoothTarget.z
      )
      
      // === 3. 바람을 타는 상승/하강 (sin 진동) ===
      // 다중 사인파 합성으로 단조롭지 않은 움직임
      const wind1 = Math.sin(this.time * 1.2 + this.windPhase1) * 0.3
      const wind2 = Math.sin(this.time * 0.5 + this.windPhase2) * 0.15
      const wind3 = Math.sin(this.time * 2.1) * 0.08 // 빠른 미세 진동
      const verticalOffset = wind1 + wind2 + wind3
      
      orbitTarget.y += verticalOffset
      
      // === 4. 관성 기반 이동 (force → velocity → position) ===
      // 목표 방향으로의 힘 계산
      const toTarget = orbitTarget.clone().sub(this.airplane.position)
      const distance = toTarget.length()
      
      // 거리에 비례한 힘 (멀수록 강한 힘)
      const forceMagnitude = distance * 3.0 // 힘 계수
      const force = toTarget.normalize().multiplyScalar(forceMagnitude)
      
      // 가속도 = 힘 / 질량 (질량 = 1 가정)
      this.acceleration.copy(force)
      
      // 속도 업데이트: v = v + a * dt
      this.velocity.add(this.acceleration.clone().multiplyScalar(dt))
      
      // 감쇠 (공기 저항) - 속도에 비례한 저항
      const damping = 0.96
      this.velocity.multiplyScalar(damping)
      
      // 최대 속도 제한
      const maxSpeed = 8.0
      if (this.velocity.length() > maxSpeed) {
        this.velocity.normalize().multiplyScalar(maxSpeed)
      }
      
      // 이전 위치 저장 (회전 계산용)
      this.previousPosition.copy(this.airplane.position)
      
      // 위치 업데이트: p = p + v * dt
      this.airplane.position.add(this.velocity.clone().multiplyScalar(dt))
    },
    
    updateRotation(dt) {
      const THREE = this.THREE
      
      // === 1. 진행 방향 계산 ===
      const moveDirection = this.airplane.position.clone().sub(this.previousPosition)
      const speed = moveDirection.length()
      
      if (speed < 0.0001) {
        // 거의 정지 상태면 현재 방향 유지
        return
      }
      
      // 현재 이동 방향 정규화
      const currentDir = moveDirection.clone().normalize()
      
      // === 2. 목표 쿼터니언 계산 ===
      // 비행기가 바라볼 방향 (진행 방향 쪽)
      const lookAtTarget = this.airplane.position.clone().add(currentDir.clone().multiplyScalar(2))
      
      // 임시 객체로 lookAt 계산
      const tempObject = new THREE.Object3D()
      tempObject.position.copy(this.airplane.position)
      tempObject.up.set(0, 1, 0)
      tempObject.lookAt(lookAtTarget)
      
      // lookAt은 -z 방향을 타겟으로 향하게 하므로
      // 비행기 모델(코가 z+ 방향)에 맞게 보정 불필요 - 이미 진행 방향으로 lookAt 중
      // 목표 쿼터니언 직접 사용
      this.targetQuaternion.copy(tempObject.quaternion)
      
      // === 3. Pitch 조정 (상승/하강에 따른 기수 각도) ===
      const verticalVelocity = this.velocity.y
      // 상승하면 기수가 들림 (X축 음의 방향 회전)
      const pitchAngle = -verticalVelocity * 0.2
      const pitchQuat = new THREE.Quaternion()
      pitchQuat.setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitchAngle)
      this.targetQuaternion.multiply(pitchQuat)
      
      // === 4. Roll 조정 (선회 시 기울기) ===
      // 이전 이동 방향과 현재 이동 방향의 변화로 선회 계산
      if (this.lastMoveDirection) {
        // 이전 방향과 현재 방향의 외적으로 선회 방향 계산
        const cross = new THREE.Vector3()
        cross.crossVectors(this.lastMoveDirection, currentDir)
        
        // cross.y > 0이면 오른쪽으로 선회, < 0이면 왼쪽으로 선회
        // 선회 방향의 반대로 기울어짐 (비행기가 안쪽으로 기울어지는 효과)
        const turnRate = cross.y
        const rollAngle = turnRate * 15 // 선회에 비례한 roll
        
        // roll 각도 제한
        const clampedRoll = Math.max(-0.6, Math.min(0.6, rollAngle))
        const rollQuat = new THREE.Quaternion()
        rollQuat.setFromAxisAngle(new THREE.Vector3(0, 0, 1), clampedRoll)
        this.targetQuaternion.multiply(rollQuat)
      }
      
      // 현재 방향 저장 (다음 프레임에서 사용)
      this.lastMoveDirection = currentDir.clone()
      
      // === 5. Slerp 보간으로 부드러운 회전 ===
      const rotationLerpFactor = 0.08
      this.airplane.quaternion.slerp(this.targetQuaternion, rotationLerpFactor)
    },
    
    cleanup() {
      // 애니메이션 중지
      if (this.animationId) {
        cancelAnimationFrame(this.animationId)
        this.animationId = null
      }
      
      // 이벤트 리스너 제거
      if (this.onMouseMove) {
        window.removeEventListener('mousemove', this.onMouseMove)
      }
      if (this.onTouchMove) {
        window.removeEventListener('touchmove', this.onTouchMove)
      }
      if (this.onResize) {
        window.removeEventListener('resize', this.onResize)
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
        this.renderer.dispose()
        if (this.$refs.container && this.renderer.domElement) {
          this.$refs.container.removeChild(this.renderer.domElement)
        }
      }
      
      // 참조 정리
      this.scene = null
      this.camera = null
      this.renderer = null
      this.airplane = null
      this.trailLine = null
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
</style>

