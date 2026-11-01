"use client";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { CloudData, Vec3 } from "../../lib/types";
export interface Measurement {
  first: Vec3;
  second?: Vec3;
  distance?: number;
  reference: boolean;
}
export interface CloudHandle {
  reset: () => void;
  zoomIn: () => void;
  toggleProjection: () => void;
  clearMeasurement: () => void;
}
interface Props {
  cloud: CloudData;
  mode: "semantic" | "instance";
  size: number;
  hidden: boolean;
  bounds: boolean;
  tool: "rotate" | "pan" | "measure";
  onMeasure: (measurement: Measurement | null) => void;
  onError: (message: string) => void;
}
interface Runtime extends CloudHandle {
  update: (props: Props) => void;
}
const vertex = `precision highp float;attribute vec3 position;attribute vec3 color;uniform mat4 modelViewMatrix;uniform mat4 projectionMatrix;uniform float pointSize;varying vec3 vColor;void main(){vColor=color;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_PointSize=pointSize;}`;
const fragment = `precision highp float;uniform float density;varying vec3 vColor;void main(){if(density<1.0&&fract(gl_FragCoord.x*.371+gl_FragCoord.y*.173)>density)discard;gl_FragColor=vec4(vColor,1.0);}`;
const CloudViewport = forwardRef<CloudHandle, Props>(
  function CloudViewport(props, ref) {
    const host = useRef<HTMLDivElement>(null),
      runtime = useRef<Runtime | null>(null),
      latest = useRef(props);
    const [failed, setFailed] = useState(false);
    useEffect(() => {
      latest.current = props;
      runtime.current?.update(props);
    }, [props]);
    useImperativeHandle(
      ref,
      () => ({
        reset: () => runtime.current?.reset(),
        zoomIn: () => runtime.current?.zoomIn(),
        toggleProjection: () => runtime.current?.toggleProjection(),
        clearMeasurement: () => runtime.current?.clearMeasurement(),
      }),
      [],
    );
    const { cloud } = props;
    useEffect(() => {
      const element = host.current!,
        isReference = cloud.header.source === "reference-image";
      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: false,
          premultipliedAlpha: false,
          powerPreference: "high-performance",
        });
      } catch {
        queueMicrotask(() => {
          setFailed(true);
          latest.current.onError("WebGL 不可用，请启用浏览器硬件加速");
        });
        return;
      }
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      renderer.setClearColor(0, 0);
      element.appendChild(renderer.domElement);
      const scene = new THREE.Scene(),
        root = new THREE.Group();
      root.scale.set(1, -1, 1);
      scene.add(root);
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(cloud.xyz, 3),
      );
      const semantic = new THREE.BufferAttribute(cloud.rgb, 3, true),
        instance = new THREE.BufferAttribute(cloud.instanceColors, 3, true);
      geometry.setAttribute("color", semantic);
      const material = new THREE.RawShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        uniforms: { pointSize: { value: 1 }, density: { value: 1 } },
        depthTest: !isReference,
        depthWrite: !isReference,
        transparent: false,
      });
      const points = new THREE.Points(geometry, material);
      points.frustumCulled = false;
      root.add(points);
      // Preserve the reference illustration's grid as a separate ground surface.
      // Material pixels are excluded: the workpiece itself is the point geometry above.
      let ground:
        THREE.Mesh<THREE.PlaneGeometry, THREE.RawShaderMaterial> | undefined;
      let groundTexture: THREE.Texture | undefined;
      if (isReference) {
        groundTexture = new THREE.TextureLoader().load(
          "/acquisition/reference.jpg",
        );
        groundTexture.colorSpace = THREE.NoColorSpace;
        groundTexture.minFilter = THREE.NearestFilter;
        groundTexture.magFilter = THREE.NearestFilter;
        ground = new THREE.Mesh(
          new THREE.PlaneGeometry(806, 646),
          new THREE.RawShaderMaterial({
            vertexShader: `precision highp float;attribute vec3 position;attribute vec2 uv;uniform mat4 modelViewMatrix;uniform mat4 projectionMatrix;varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
            fragmentShader: `precision highp float;uniform sampler2D atlas;varying vec2 vUv;void main(){vec2 pixel=vec2(404.0+vUv.x*806.0,194.0+vUv.y*646.0);if((pixel.x<514.0&&pixel.y>690.0)||(pixel.x>642.0&&pixel.x<953.0&&pixel.y>769.0&&pixel.y<822.0))discard;vec3 c=texture2D(atlas,vec2(pixel.x/1680.0,1.0-pixel.y/944.0)).rgb;float hi=max(c.r,max(c.g,c.b));float lo=min(c.r,min(c.g,c.b));if((hi-lo>38.0/255.0&&hi>90.0/255.0)||(c.r+c.g+c.b<620.0/255.0))discard;gl_FragColor=vec4(c,1.0);}`,
            uniforms: { atlas: { value: groundTexture } },
            side: THREE.DoubleSide,
            depthTest: false,
            depthWrite: false,
          }),
        );
        ground.position.set(403, 323, -200);
        ground.renderOrder = -1;
        root.add(ground);
      }
      const box = new THREE.BoxHelper(points, 0x637587);
      box.visible = false;
      scene.add(box);
      const perspective = new THREE.PerspectiveCamera(38, 1, 0.01, 1000000),
        orthographic = new THREE.OrthographicCamera(
          -403,
          403,
          323,
          -323,
          -100000,
          100000,
        );
      let camera: THREE.Camera = orthographic,
        controls: OrbitControls,
        projection: "orthographic" | "perspective" = "orthographic";
      const center = new THREE.Vector3(
          cloud.header.center[0],
          -cloud.header.center[1],
          cloud.header.center[2],
        ),
        extent = cloud.header.extent,
        span = Math.max(
          1,
          extent[3] - extent[0],
          extent[4] - extent[1],
          extent[5] - extent[2],
        ),
        radius = Math.max(
          1,
          Math.hypot(
            extent[3] - extent[0],
            extent[4] - extent[1],
            extent[5] - extent[2],
          ) / 2,
        );
      let width = 806,
        height = 646,
        fitScale = 1;
      function connect() {
        controls?.dispose();
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.12;
        controls.target.copy(center);
        controls.minDistance = span * 0.08;
        controls.maxDistance = span * 30;
        controls.minZoom = 0.1;
        controls.maxZoom = 25;
        controls.update();
      }
      function setProjection(
        next: "orthographic" | "perspective",
        reset = true,
      ) {
        projection = next;
        camera = projection === "orthographic" ? orthographic : perspective;
        connect();
        if (reset) fit();
        else resize();
      }
      function fit() {
        orthographic.zoom = 1;
        perspective.zoom = 1;
        const distance =
          (radius / Math.sin(THREE.MathUtils.degToRad(19))) * 1.12;
        const direction =
          isReference && projection === "orthographic"
            ? new THREE.Vector3(0, 0, 1)
            : new THREE.Vector3(0.68, 0.56, 0.86).normalize();
        camera.position.copy(center).addScaledVector(direction, distance);
        camera.up.set(0, 1, 0);
        controls.target.copy(center);
        camera.lookAt(center);
        resize();
        controls.update();
      }
      function resize() {
        width = element.clientWidth;
        height = element.clientHeight;
        if (!width || !height) return;
        fitScale = isReference
          ? Math.min(width / 806, height / 646)
          : Math.min(width, height) / (radius * 2.15);
        orthographic.left = -width / (2 * fitScale);
        orthographic.right = width / (2 * fitScale);
        orthographic.top = height / (2 * fitScale);
        orthographic.bottom = -height / (2 * fitScale);
        orthographic.updateProjectionMatrix();
        perspective.aspect = width / height;
        perspective.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
      connect();
      resize();
      fit();
      const annotations = new THREE.Group();
      root.add(annotations);
      let first: Vec3 | null = null;
      const clearMeasurement = () => {
        first = null;
        annotations.traverse((object) => {
          if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
            object.geometry.dispose();
            const list = Array.isArray(object.material)
              ? object.material
              : [object.material];
            list.forEach((m) => m.dispose());
          }
        });
        annotations.clear();
        latest.current.onMeasure(null);
      };
      function mark(point: Vec3) {
        const sphere = new THREE.Mesh(
          new THREE.SphereGeometry(span * 0.004, 10, 10),
          new THREE.MeshBasicMaterial({ color: 0xf05a16, depthTest: false }),
        );
        sphere.position.set(...point);
        sphere.renderOrder = 4;
        annotations.add(sphere);
      }
      const pointerStart = { x: 0, y: 0 };
      const down = (event: PointerEvent) => {
        pointerStart.x = event.clientX;
        pointerStart.y = event.clientY;
      };
      const click = (event: MouseEvent) => {
        if (
          latest.current.tool !== "measure" ||
          latest.current.hidden ||
          Math.hypot(
            event.clientX - pointerStart.x,
            event.clientY - pointerStart.y,
          ) > 5
        )
          return;
        const rect = renderer.domElement.getBoundingClientRect(),
          mouse = new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            (-(event.clientY - rect.top) / rect.height) * 2 + 1,
          ),
          ray = new THREE.Raycaster();
        ray.params.Points.threshold = span * 0.009;
        ray.setFromCamera(mouse, camera as THREE.PerspectiveCamera);
        const hits = ray.intersectObject(points, false);
        if (!hits.length) {
          latest.current.onError("未选中点云，请点击工件上的点");
          return;
        }
        const index = hits[0].index!;
        const point = Array.from(
          cloud.xyz.subarray(index * 3, index * 3 + 3),
        ) as Vec3;
        if (!first) {
          clearMeasurement();
          first = point;
          mark(point);
          latest.current.onMeasure({ first: point, reference: isReference });
        } else {
          mark(point);
          const line = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
              new THREE.Vector3(...first),
              new THREE.Vector3(...point),
            ]),
            new THREE.LineBasicMaterial({ color: 0xf05a16, depthTest: false }),
          );
          line.renderOrder = 5;
          annotations.add(line);
          latest.current.onMeasure({
            first,
            second: point,
            distance: new THREE.Vector3(...first).distanceTo(
              new THREE.Vector3(...point),
            ),
            reference: isReference,
          });
          first = null;
        }
      };
      renderer.domElement.addEventListener("pointerdown", down);
      renderer.domElement.addEventListener("click", click);
      function update(p: Props) {
        geometry.setAttribute(
          "color",
          p.mode === "semantic" ? semantic : instance,
        );
        points.visible = !p.hidden;
        box.visible = p.bounds && !p.hidden;
        material.uniforms.pointSize.value =
          (isReference ? p.size / 4 : p.size) *
          Math.min(devicePixelRatio, 2) *
          (isReference ? fitScale : 1);
        material.uniforms.density.value = isReference
          ? Math.min(1, p.size / 4)
          : 1;
        controls.enabled = p.tool !== "measure";
        controls.mouseButtons.LEFT =
          p.tool === "pan" ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE;
        renderer.domElement.style.cursor =
          p.tool === "measure"
            ? "crosshair"
            : p.tool === "pan"
              ? "grab"
              : "move";
      }
      runtime.current = {
        update,
        reset: () => {
          projection = "orthographic";
          camera = orthographic;
          connect();
          fit();
          update(latest.current);
        },
        zoomIn: () => {
          if (projection === "orthographic") {
            orthographic.zoom = Math.min(25, orthographic.zoom * 1.25);
            orthographic.updateProjectionMatrix();
          } else {
            camera.position
              .sub(controls.target)
              .multiplyScalar(0.8)
              .add(controls.target);
          }
          controls.update();
        },
        toggleProjection: () => {
          setProjection(
            projection === "orthographic" ? "perspective" : "orthographic",
          );
          update(latest.current);
        },
        clearMeasurement,
      };
      update(latest.current);
      const observer = new ResizeObserver(() => {
        resize();
        update(latest.current);
      });
      observer.observe(element);
      let frame = 0;
      function render() {
        frame = requestAnimationFrame(render);
        if (!document.hidden) {
          controls.update();
          box.update();
          renderer.render(scene, camera);
        }
      }
      render();
      const lost = (event: Event) => {
        event.preventDefault();
        setFailed(true);
        latest.current.onError("显卡上下文丢失，请刷新页面");
      };
      renderer.domElement.addEventListener("webglcontextlost", lost);
      return () => {
        cancelAnimationFrame(frame);
        runtime.current = null;
        observer.disconnect();
        controls.dispose();
        renderer.domElement.removeEventListener("pointerdown", down);
        renderer.domElement.removeEventListener("click", click);
        renderer.domElement.removeEventListener("webglcontextlost", lost);
        annotations.traverse((object) => {
          if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
            object.geometry.dispose();
            const list = Array.isArray(object.material)
              ? object.material
              : [object.material];
            list.forEach((m) => m.dispose());
          }
        });
        ground?.geometry.dispose();
        ground?.material.dispose();
        groundTexture?.dispose();
        geometry.dispose();
        material.dispose();
        box.geometry.dispose();
        (box.material as THREE.Material).dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    }, [cloud]);
    return (
      <div
        ref={host}
        style={{ position: "absolute", inset: 0 }}
        aria-label={
          cloud.header.source === "reference-image"
            ? "参考图可见点重建示例，可旋转平移；非原始 PCD"
            : "真实 PCD 三维点云，可旋转、平移、缩放和测距"
        }
      >
        {failed && (
          <div role="alert" style={{ padding: 30, color: "#8e4e37" }}>
            WebGL 无法显示，点云文件和任务数据仍保留，请启用硬件加速后刷新。
          </div>
        )}
      </div>
    );
  },
);
export default CloudViewport;
