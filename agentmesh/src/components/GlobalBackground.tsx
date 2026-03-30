"use client";

import { useEffect, useRef } from "react";

// ── Vertex shader ─────────────────────────────────────────────────────────────
const VERT = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

// ── Fragment shader — very dark oblique abstract, black + deep green ──────────
const FRAG = `
precision mediump float;
uniform vec2  u_res;
uniform float u_time;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i),               hash(i + vec2(1.0,0.0)), f.x),
    mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), f.x),
    f.y
  );
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p  = p * 2.1 + vec2(0.31, 0.71);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 st = uv * 2.0 - 1.0;
  float t = u_time * 0.10;

  /* domain-warped fbm */
  vec2 q = vec2(fbm(uv * 2.2 + t),         fbm(uv * 2.2 + vec2(1.7, 9.2) + t));
  vec2 r = vec2(fbm(uv * 1.9 + 4.0*q + vec2(1.7,9.2) + t * 0.7),
                fbm(uv * 1.9 + 4.0*q + vec2(8.3,2.8) + t * 0.5));
  float n = fbm(uv * 1.6 + 4.0 * r);

  /* oblique line sets */
  float proj1 = uv.x * 0.829 + uv.y * 0.559;   /* ~34 deg */
  float proj2 = uv.x * 0.629 - uv.y * 0.777;   /* ~-51 deg */
  float lines1 = pow(abs(sin(proj1 * 32.0 + t * 2.2)), 18.0);
  float lines2 = pow(abs(sin(proj2 * 22.0 - t * 1.6)), 16.0);
  float lines3 = pow(abs(sin(proj1 * 12.0 - t * 0.9)), 10.0) * 0.5;

  /* radial ring pulse */
  float rad  = length(st);
  float ring = pow(abs(sin(rad * 7.0 - t * 2.5)), 12.0) * (1.0 - smoothstep(0.3, 1.4, rad));

  /* combine — keep very dim */
  float glow = n * 0.40 + lines1 * 0.18 + lines2 * 0.14 + lines3 * 0.10 + ring * 0.18;
  glow = clamp(glow, 0.0, 1.0);

  /* heavy vignette so edges go pure black */
  float vig = 1.0 - smoothstep(0.20, 1.30, length(uv - 0.5) * 2.4);

  /* colour ramp — extremely dim, peak green barely visible */
  vec3 c0 = vec3(0.002, 0.003, 0.002);   /* pure black          */
  vec3 c1 = vec3(0.003, 0.018, 0.006);   /* near-black green    */
  vec3 c2 = vec3(0.004, 0.050, 0.014);   /* very dark forest    */
  vec3 c3 = vec3(0.006, 0.090, 0.024);   /* peak — still dark   */

  vec3 col = c0;
  col = mix(col, c1, smoothstep(0.00, 0.35, glow));
  col = mix(col, c2, smoothstep(0.30, 0.62, glow));
  col = mix(col, c3, smoothstep(0.58, 0.85, glow));

  /* apply vignette then a global darkness multiplier */
  col *= mix(0.0, 1.0, vig) * 0.75;

  gl_FragColor = vec4(col, 1.0);
}
`;

function createShader(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
}

export default function GlobalBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { alpha: false, antialias: false });
    if (!gl) return;

    // Compile shaders
    const vs = createShader(gl, gl.VERTEX_SHADER, VERT);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAG);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs!);
    gl.attachShader(prog, fs!);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    // Full-screen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uRes  = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");

    let raf = 0;
    const startMs = performance.now();
    const FRAME_MS = 1000 / 20; // cap at 20fps
    let lastFrame = 0;

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width  = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    };

    const render = (now: number) => {
      raf = requestAnimationFrame(render);
      if (now - lastFrame < FRAME_MS) return;
      lastFrame = now;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, (now - startMs) / 1000);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      gl.deleteProgram(prog);
      gl.deleteBuffer(buf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        pointerEvents: "none",
        display: "block",
      }}
    />
  );
}
