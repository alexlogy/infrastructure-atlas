'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

import { markerKey, type MarkerStyle, markerStyleFor } from '@/lib/atlas-markers'
import { angularDistance, latLngToVector } from '@/lib/geo'
import type { AtlasArcView, AtlasNodeView, LatLng } from '@/types/view-models'

// Midnight Atlas tokens (mirrors styles.css; WebGL cannot read CSS variables cheaply).
const COLORS = {
  surface: '#122639',
  line: '#2c4a5f',
  accent: '#65d6df',
  ice: '#b5f4f4',
  gold: '#e5b96d',
}
/** Idle spin: one revolution in about 120 s (OrbitControls: 2π/60 rad per unit per second). */
const SPIN_SPEED = 0.5
const CAMERA_DISTANCE = 2.8
const MARKER_RADIUS = 0.022

export type GlobeProps = {
  nodes: AtlasNodeView[]
  arcs: AtlasArcView[]
  center: LatLng
  selectedId: string | null
  onSelect: (id: string) => void
  reducedMotion: boolean
  lowDetail: boolean
  /** Slow rotation while nothing is selected; stops on hover, drag or selection. */
  idleSpin?: boolean
}

/**
 * Restrained globe: one sphere, one graticule draw call, one arc draw call and
 * one small mesh per node. Renders on demand only (no idle frames, nothing
 * while hidden), caps pixel ratio and never captures the scroll wheel.
 */
export default function Globe({
  nodes,
  arcs,
  center,
  selectedId,
  onSelect,
  reducedMotion,
  lowDetail,
  idleSpin = false,
}: GlobeProps) {
  const selected = nodes.find((n) => n.id === selectedId) ?? null

  return (
    <Canvas
      frameloop="demand"
      dpr={[1, lowDetail ? 1.25 : 1.75]}
      camera={{
        position: latLngToVector(center.latitude, center.longitude, CAMERA_DISTANCE),
        fov: 45,
        near: 0.1,
        far: 20,
      }}
      gl={{ antialias: !lowDetail, powerPreference: 'low-power' }}
    >
      <mesh>
        <sphereGeometry args={[1, lowDetail ? 32 : 64, lowDetail ? 24 : 48]} />
        {/* Unlit: the graticule carries the shape, and no lights means cheaper frames. */}
        <meshBasicMaterial color={COLORS.surface} />
      </mesh>
      <Graticule />
      <Coastlines />
      <Arcs nodes={nodes} arcs={arcs} />
      <Markers nodes={nodes} selectedId={selectedId} onSelect={onSelect} />
      {/* No spin on low-detail devices: a still globe beats a continuous render loop on a phone. */}
      <Controls spin={idleSpin && !reducedMotion && !lowDetail && !selected} />
      <CameraRig target={selected} reducedMotion={reducedMotion} />
    </Canvas>
  )
}

/** Frees GPU buffers when a memoised geometry/material is replaced or unmounted. */
function useDispose(...items: { dispose: () => void }[]) {
  useEffect(() => () => items.forEach((item) => item.dispose()), items) // eslint-disable-line react-hooks/exhaustive-deps
}

/** Latitude/longitude lines every 15°, as a single LineSegments geometry. */
function Graticule() {
  const geometry = useMemo(() => {
    const points: number[] = []
    const push = (a: number[], b: number[]) => points.push(...a, ...b)
    for (let lat = -75; lat <= 75; lat += 15) {
      for (let lng = -180; lng < 180; lng += 4) {
        push(latLngToVector(lat, lng, 1.001), latLngToVector(lat, lng + 4, 1.001))
      }
    }
    for (let lng = -180; lng < 180; lng += 15) {
      for (let lat = -88; lat < 88; lat += 4) {
        push(latLngToVector(lat, lng, 1.001), latLngToVector(Math.min(lat + 4, 88), lng, 1.001))
      }
    }
    return new THREE.BufferGeometry().setAttribute(
      'position',
      new THREE.Float32BufferAttribute(points, 3),
    )
  }, [])
  useDispose(geometry)

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={COLORS.line} transparent opacity={0.45} />
    </lineSegments>
  )
}

/**
 * Natural Earth coastlines (public/generic/coastlines.json, ~26 KB gzipped), fetched only once a
 * globe mounts. Until it arrives, or if it fails, the graticule alone shapes the globe.
 */
function Coastlines() {
  const { invalidate } = useThree()
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null)

  useEffect(() => {
    let cancelled = false
    let built: THREE.BufferGeometry | null = null
    fetch('/generic/coastlines.json')
      .then((res) => (res.ok ? (res.json() as Promise<{ lines: number[][] }>) : null))
      .then((data) => {
        if (cancelled || !data) return
        const points: number[] = []
        for (const line of data.lines) {
          for (let i = 2; i < line.length; i += 2) {
            points.push(
              ...latLngToVector(line[i - 1], line[i - 2], 1.002),
              ...latLngToVector(line[i + 1], line[i], 1.002),
            )
          }
        }
        built = new THREE.BufferGeometry().setAttribute(
          'position',
          new THREE.Float32BufferAttribute(points, 3),
        )
        setGeometry(built)
        invalidate()
      })
      .catch(() => {})
    return () => {
      cancelled = true
      built?.dispose()
    }
  }, [invalidate])

  if (!geometry) return null
  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={COLORS.accent} transparent opacity={0.6} />
    </lineSegments>
  )
}

/** All arcs in one LineSegments geometry; height grows with distance. */
function Arcs({ nodes, arcs }: { nodes: AtlasNodeView[]; arcs: AtlasArcView[] }) {
  const geometry = useMemo(() => {
    const byId = new Map(nodes.map((n) => [n.id, n]))
    const points: number[] = []
    for (const arc of arcs) {
      const a = byId.get(arc.from)
      const b = byId.get(arc.to)
      if (!a || !b) continue
      const start = new THREE.Vector3(...latLngToVector(a.latitude, a.longitude, 1.005))
      const end = new THREE.Vector3(...latLngToVector(b.latitude, b.longitude, 1.005))
      const mid = start.clone().add(end)
      // Antipodal points have no unique midpoint; lift over the pole instead.
      if (mid.lengthSq() < 1e-6) mid.set(0, 1, 0)
      mid.normalize().multiplyScalar(1.05 + 0.35 * (angularDistance(a, b) / Math.PI))
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end).getPoints(32)
      for (let i = 1; i < curve.length; i++)
        points.push(...curve[i - 1].toArray(), ...curve[i].toArray())
    }
    return new THREE.BufferGeometry().setAttribute(
      'position',
      new THREE.Float32BufferAttribute(points, 3),
    )
  }, [nodes, arcs])
  useDispose(geometry)

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={COLORS.accent} transparent opacity={0.55} />
    </lineSegments>
  )
}

function Markers({
  nodes,
  selectedId,
  onSelect,
}: {
  nodes: AtlasNodeView[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  // Shared by every marker: one geometry per shape, one material per colour.
  const r = MARKER_RADIUS
  const circle = useMemo(() => new THREE.SphereGeometry(r, 12, 8), [r])
  const diamond = useMemo(() => new THREE.OctahedronGeometry(r * 1.35), [r])
  const square = useMemo(() => new THREE.BoxGeometry(r * 1.7, r * 1.7, r * 1.7), [r])
  const triangle = useMemo(() => new THREE.TetrahedronGeometry(r * 1.6), [r])
  const accent = useMemo(() => new THREE.MeshBasicMaterial({ color: COLORS.accent }), [])
  const ice = useMemo(() => new THREE.MeshBasicMaterial({ color: COLORS.ice }), [])
  // Gold is reserved for the selected place (cyan leads, gold marks significance).
  const active = useMemo(() => new THREE.MeshBasicMaterial({ color: COLORS.gold }), [])
  useDispose(circle, diamond, square, triangle, accent, ice, active)

  const geometries = { circle, diamond, square, triangle }
  const materials = { accent, ice }
  const key = useMemo(() => markerKey(nodes.map((n) => n.category)), [nodes])
  const styleOf = (node: AtlasNodeView): MarkerStyle => markerStyleFor(key, node.category)

  useEffect(() => () => void (document.body.style.cursor = ''), [])

  return nodes.map((node) => {
    const isSelected = node.id === selectedId
    const style = styleOf(node)
    return (
      <mesh
        key={node.id}
        geometry={geometries[style.shape]}
        material={isSelected ? active : materials[style.color]}
        position={latLngToVector(node.latitude, node.longitude, 1.01)}
        scale={isSelected ? 1.7 : 1}
        onClick={(event) => {
          event.stopPropagation()
          onSelect(node.id)
        }}
        onPointerOver={(event) => {
          event.stopPropagation()
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = ''
        }}
      />
    )
  })
}

/**
 * Drag to rotate. Zoom is off so the wheel keeps scrolling the page. With `spin`, the globe turns
 * slowly until the pointer rests on it or the visitor drags it; frames are only requested while
 * spinning, so an idle, paused globe costs nothing.
 */
function Controls({ spin }: { spin: boolean }) {
  const { camera, gl, invalidate } = useThree()
  const controls = useRef<OrbitControls | null>(null)
  const paused = useRef(false)

  useEffect(() => {
    const c = new OrbitControls(camera, gl.domElement)
    c.enablePan = false
    c.enableZoom = false
    c.rotateSpeed = 0.5
    c.autoRotateSpeed = SPIN_SPEED
    // OrbitControls sets touch-action: none; let vertical swipes scroll the page instead.
    if (c.domElement) c.domElement.style.touchAction = 'pan-y'
    const onChange = () => invalidate()
    const pause = () => void (paused.current = true)
    const resume = () => {
      paused.current = false
      invalidate()
    }
    c.addEventListener('change', onChange)
    c.addEventListener('start', pause)
    gl.domElement.addEventListener('pointerenter', pause)
    gl.domElement.addEventListener('pointerleave', resume)
    controls.current = c
    return () => {
      c.removeEventListener('change', onChange)
      c.removeEventListener('start', pause)
      gl.domElement.removeEventListener('pointerenter', pause)
      gl.domElement.removeEventListener('pointerleave', resume)
      c.dispose()
      controls.current = null
    }
  }, [camera, gl, invalidate])

  useEffect(() => {
    if (spin) invalidate()
  }, [spin, invalidate])

  useFrame((_, delta) => {
    const c = controls.current
    if (!c || !spin || paused.current) return
    c.autoRotate = true
    c.update(Math.min(delta, 1 / 30))
    c.autoRotate = false
    invalidate()
  })

  return null
}

/** Turns the camera to face the selected node; instant when motion is reduced. */
function CameraRig({
  target,
  reducedMotion,
}: {
  target: AtlasNodeView | null
  reducedMotion: boolean
}) {
  const { camera, invalidate } = useThree()
  const goal = useRef<THREE.Vector3 | null>(null)

  useEffect(() => {
    if (!target) return
    const direction = new THREE.Vector3(...latLngToVector(target.latitude, target.longitude))
    if (reducedMotion) {
      camera.position.copy(direction.multiplyScalar(camera.position.length()))
      camera.lookAt(0, 0, 0)
      goal.current = null
    } else {
      goal.current = direction
    }
    invalidate()
  }, [target, reducedMotion, camera, invalidate])

  useFrame((_, delta) => {
    if (!goal.current) return
    const distance = camera.position.length()
    const current = camera.position.clone().normalize()
    // Frame-rate independent easing. In on-demand mode the first delta includes idle
    // time, so clamp it or the camera would jump straight to the goal.
    current.lerp(goal.current, 1 - Math.exp(-Math.min(delta, 1 / 30) * 5))
    if (current.lengthSq() < 1e-6) current.set(0, 1, 0)
    camera.position.copy(current.normalize().multiplyScalar(distance))
    camera.lookAt(0, 0, 0)
    if (current.angleTo(goal.current) < 0.002) goal.current = null
    else invalidate()
  })

  return null
}
