"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { toDisplay } from "../lib/blob";
import type { CloudData, Seam, Vec3 } from "../lib/types";
export interface TcpPose {
  position: Vec3;
  wpr: Vec3;
  distance: number;
  hold: boolean;
  index: number;
}
interface Props {
  cloud: CloudData;
  seams: Seam[];
  selected: number | null;
  light: boolean;
  mode: "语义" | "实例";
  size: number;
  reset: number;
  grid?: boolean;
  interactive?: boolean;
  tcp?: TcpPose | null;
  tcpPath?: Vec3[];
}
interface Controls {
  update: (props: Props) => void;
  fit: () => void;
}
export default function PointCloud(props: Props) {
  const host = useRef<HTMLDivElement>(null),
    controller = useRef<Controls | null>(null);
  const [failed, setFailed] = useState(false);
  const { cloud, seams, interactive = true, reset } = props;
  useEffect(() => {
    const el = host.current!;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      queueMicrotask(() => setFailed(true));
      return;
    }
    const scene = new THREE.Scene(),
      root = new THREE.Group();
    root.scale.set(1, -1, 1);
    scene.add(root);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100000);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    el.appendChild(renderer.domElement);
    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableDamping = true;
    orbit.enabled = interactive;
    orbit.enablePan = interactive;
    orbit.enableZoom = interactive;
    const center = new THREE.Vector3(...toDisplay(cloud.header.center));
    const extent = cloud.header.extent;
    const radius = Math.max(
      1,
      Math.hypot(
        extent[3] - extent[0],
        extent[4] - extent[1],
        extent[5] - extent[2],
      ) / 2,
    );
    const fit = () => {
      const fov = THREE.MathUtils.degToRad(camera.fov);
      const distance =
        (radius /
          Math.sin(
            Math.min(fov, 2 * Math.atan(Math.tan(fov / 2) * camera.aspect)) / 2,
          )) *
        0.92;
      camera.position
        .copy(center)
        .add(
          new THREE.Vector3(0.64, 0.5, 0.67)
            .normalize()
            .multiplyScalar(distance),
        );
      orbit.target.copy(center);
      camera.near = Math.max(0.1, radius / 10000);
      camera.far = radius * 100;
      camera.updateProjectionMatrix();
      orbit.minDistance = radius * 0.25;
      orbit.maxDistance = radius * 8;
      orbit.update();
    };
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(cloud.xyz, 3));
    const semantic = new THREE.BufferAttribute(cloud.rgb, 3, true),
      instances = new THREE.BufferAttribute(cloud.instanceColors, 3, true);
    geometry.setAttribute("color", semantic);
    const material = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.84,
    });
    // The protocol RGB bytes are sRGB. Decode in the shader without copying the payload.
    material.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        diffuseColor.rgb = mix(pow((diffuseColor.rgb + vec3(0.055)) / 1.055, vec3(2.4)), diffuseColor.rgb / 12.92, lessThanEqual(diffuseColor.rgb, vec3(0.04045)));
      `,
      );
    };
    root.add(new THREE.Points(geometry, material));
    const gridSize = Math.ceil((radius * 2.3) / 10) * 10;
    const grid = new THREE.GridHelper(
      gridSize,
      gridSize / 10,
      0x43556a,
      0x2d4053,
    );
    grid.position.set(center.x, -extent[4] - 10, center.z);
    grid.material.transparent = true;
    grid.material.opacity = 0.35;
    scene.add(grid);
    const lines = new Map<number, Line2>(),
      dots = new Map<number, THREE.InstancedMesh>();
    for (const seam of seams) {
      if (seam.trajectory_mm.length < 2) continue;
      const g = new LineGeometry();
      g.setPositions(seam.trajectory_mm.flat());
      const m = new LineMaterial({
        color: 0x2bd9cf,
        side: THREE.DoubleSide,
        linewidth: 1.5,
        worldUnits: false,
        depthTest: false,
        transparent: true,
        opacity: 0.85,
      });
      const line = new Line2(g, m);
      line.renderOrder = 2;
      root.add(line);
      lines.set(seam.id, line);
      const marker = new THREE.InstancedMesh(
        new THREE.SphereGeometry(4, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false }),
        seam.trajectory_mm.length,
      );
      const transform = new THREE.Matrix4();
      seam.trajectory_mm.forEach((p, i) => {
        transform.makeTranslation(...p);
        marker.setMatrixAt(i, transform);
      });
      marker.renderOrder = 3;
      marker.instanceMatrix.needsUpdate = true;
      root.add(marker);
      dots.set(seam.id, marker);
    }
    const tool = new THREE.Group();
    const tip = new THREE.Mesh(
      new THREE.ConeGeometry(6, 26, 16),
      new THREE.MeshBasicMaterial({ color: 0xe7ac5c }),
    );
    tip.rotation.x = Math.PI / 2;
    tip.position.z = -13;
    tool.add(tip);
    const grip = new THREE.Mesh(
      new THREE.CylinderGeometry(8, 8, 40, 16),
      new THREE.MeshBasicMaterial({ color: 0xa8bbcc }),
    );
    grip.rotation.x = Math.PI / 2;
    grip.position.z = -42;
    tool.add(grip);
    tool.add(new THREE.AxesHelper(35));
    tool.visible = false;
    tool.traverse((object) => {
      object.renderOrder = 5;
      if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];
        materials.forEach((material) => {
          material.depthTest = false;
          material.depthWrite = false;
        });
      }
    });
    root.add(tool);
    let travelledGeometry = new LineGeometry();
    let travelledCapacity = 1;
    travelledGeometry.setPositions([0, 0, 0, 0, 0, 0]);
    const travelled = new Line2(
      travelledGeometry,
      new LineMaterial({
        color: 0xf39a42,
        side: THREE.DoubleSide,
        linewidth: 4,
        worldUnits: false,
        depthTest: false,
      }),
    );
    travelled.visible = false;
    travelled.renderOrder = 4;
    root.add(travelled);
    let lastMode = "语义",
      lastSelected: number | null = null;
    const update = (p: Props) => {
      if (p.mode !== lastMode) {
        geometry.setAttribute(
          "color",
          p.mode === "实例" ? instances : semantic,
        );
        lastMode = p.mode;
      }
      material.size = p.size;
      grid.visible = p.grid ?? true;
      grid.material.opacity = p.light ? 0.4 : 0.28;
      if (lastSelected !== p.selected) {
        for (const [id, line] of lines) {
          const chosen = id === p.selected;
          line.material.color.set(chosen ? 0xffc449 : 0x28d9d4);
          line.material.linewidth = chosen ? 5 : 1.5;
          dots.get(id)!.visible = chosen;
        }
        lastSelected = p.selected;
      }
      tool.visible = Boolean(p.tcp);
      travelled.visible = false;
      if (p.tcp) {
        tool.position.set(...p.tcp.position);
        const [w, pi, r] = p.tcp.wpr.map(THREE.MathUtils.degToRad);
        tool.rotation.set(w, pi, r, "ZYX");
        const path = p.tcpPath ?? [];
        if (path.length > 1 && p.tcp.distance > 0) {
          if (path.length > travelledCapacity) {
            travelledGeometry.dispose();
            travelledGeometry = new LineGeometry();
            travelledGeometry.setPositions(
              new Float32Array((path.length + 1) * 3),
            );
            travelled.geometry = travelledGeometry;
            travelledCapacity = path.length;
          }
          const attribute = travelledGeometry.attributes
            .instanceStart as THREE.InterleavedBufferAttribute;
          const values = attribute.data.array as Float32Array;
          let count = 0;
          for (let i = 0; i <= p.tcp.index && i < path.length; i++) {
            const from = path[i],
              to = i === p.tcp.index ? p.tcp.position : path[i + 1];
            if (!to || from.every((v, j) => v === to[j])) continue;
            values.set(from, count * 6);
            values.set(to, count * 6 + 3);
            count++;
          }
          attribute.data.needsUpdate = true;
          travelledGeometry.instanceCount = count;
          travelled.frustumCulled = false;
          travelled.visible = count > 0;
        }
      }
    };
    const resize = () => {
      const width = el.clientWidth,
        height = el.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      for (const l of lines.values()) l.material.resolution.set(width, height);
      travelled.material.resolution.set(width, height);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();
    fit();
    controller.current = { update, fit };
    let raf = 0;
    function render() {
      raf = requestAnimationFrame(render);
      if (document.hidden) return;
      orbit.update();
      renderer.render(scene, camera);
    }
    render();
    const contextLost = (e: Event) => {
      e.preventDefault();
      setFailed(true);
    };
    renderer.domElement.addEventListener("webglcontextlost", contextLost);
    return () => {
      cancelAnimationFrame(raf);
      controller.current = null;
      observer.disconnect();
      orbit.dispose();
      renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      scene.traverse((object) => {
        if (
          object instanceof THREE.Mesh ||
          object instanceof THREE.Points ||
          object instanceof THREE.Line ||
          object instanceof Line2
        ) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach((m) => m.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [cloud, seams, interactive]);
  useEffect(() => {
    controller.current?.update(props);
  }, [props]);
  useEffect(() => {
    controller.current?.fit();
  }, [reset]);
  return (
    <div
      className={`cloud-canvas ${interactive ? "" : "static-cloud"}`}
      ref={host}
      aria-label={
        interactive ? "三维点云视图，拖动旋转，滚轮缩放" : "焊缝三维点云展示"
      }
    >
      {failed && (
        <div className="cloud-loading" role="alert">
          WebGL 不可用或显卡上下文丢失，请启用硬件加速并刷新页面。
        </div>
      )}
    </div>
  );
}
