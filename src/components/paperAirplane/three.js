// 종이비행기에 필요한 three.js 클래스만 다시 내보낸다.
// import('three')로 네임스페이스 전체를 받으면 트리 셰이킹이 되지 않아 청크가 훨씬 커진다.
export {
  AmbientLight,
  BufferGeometry,
  DirectionalLight,
  DoubleSide,
  EdgesGeometry,
  Float32BufferAttribute,
  Group,
  Line,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Object3D,
  PerspectiveCamera,
  Plane,
  Quaternion,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer
} from 'three'
