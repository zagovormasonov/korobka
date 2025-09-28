import { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Color, Triangle } from 'ogl';

import './Silk.css';

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform float uSpeed;
uniform float uScale;
uniform float uNoiseIntensity;
uniform float uRotation;
uniform vec3 uColor;

out vec4 fragColor;

// Simplex noise functions
vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v) {
  const vec4 C = vec4(
    0.211324865405187, 0.366025403784439,
    -0.577350269189626, 0.024390243902439
  );
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);

  vec3 p = permute(
    permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0)
  );

  vec3 m = max(
    0.5 - vec3(
      dot(x0, x0),
      dot(x12.xy, x12.xy),
      dot(x12.zw, x12.zw)
    ), 
    0.0
  );
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);

  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// Rotation matrix
mat2 rotate(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat2(c, -s, s, c);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  vec2 center = vec2(0.5, 0.5);
  
  // Apply rotation
  vec2 rotatedUV = uv - center;
  rotatedUV = rotate(uRotation) * rotatedUV;
  rotatedUV += center;
  
  // Scale the coordinates
  vec2 scaledUV = rotatedUV * uScale;
  
  // Time-based animation
  float time = uTime * uSpeed;
  
  // Create multiple layers of noise for silk effect
  float noise1 = snoise(scaledUV * 4.0 + vec2(time * 0.1, time * 0.15));
  float noise2 = snoise(scaledUV * 8.0 + vec2(time * 0.08, -time * 0.12)) * 0.5;
  float noise3 = snoise(scaledUV * 16.0 + vec2(-time * 0.06, time * 0.1)) * 0.25;
  float noise4 = snoise(scaledUV * 32.0 + vec2(time * 0.04, -time * 0.08)) * 0.125;
  
  // Combine noise layers
  float combinedNoise = noise1 + noise2 + noise3 + noise4;
  
  // Apply noise intensity
  combinedNoise *= uNoiseIntensity;
  
  // Create silk-like flowing patterns
  vec2 flowUV = scaledUV + vec2(
    snoise(scaledUV * 2.0 + time * 0.1) * 0.1,
    snoise(scaledUV * 2.0 + time * 0.1 + 100.0) * 0.1
  );
  
  float silkPattern = snoise(flowUV * 6.0 + time * 0.05);
  silkPattern += snoise(flowUV * 12.0 + time * 0.03) * 0.5;
  silkPattern += snoise(flowUV * 24.0 + time * 0.02) * 0.25;
  
  // Combine patterns
  float finalPattern = (combinedNoise + silkPattern) * 0.5;
  
  // Create smooth gradients
  float gradient1 = smoothstep(-0.5, 0.5, finalPattern);
  float gradient2 = smoothstep(-0.3, 0.3, sin(finalPattern * 3.14159 + time * 0.1));
  
  // Mix gradients for silk effect
  float silkIntensity = mix(gradient1, gradient2, 0.6);
  
  // Add subtle color variations
  vec3 color1 = uColor;
  vec3 color2 = uColor * 1.2; // Slightly brighter
  vec3 color3 = uColor * 0.8; // Slightly darker
  
  vec3 finalColor = mix(color1, color2, silkIntensity);
  finalColor = mix(finalColor, color3, sin(finalPattern * 2.0 + time * 0.05) * 0.1 + 0.1);
  
  // Apply smooth alpha for blending
  float alpha = smoothstep(0.0, 1.0, silkIntensity) * 0.7;
  
  fragColor = vec4(finalColor, alpha);
}
`;

interface SilkProps {
  speed?: number;
  scale?: number;
  noiseIntensity?: number;
  rotation?: number;
  color?: string;
}

export default function Silk(props: SilkProps) {
  const {
    speed = 1.9,
    scale = 0.5,
    noiseIntensity = 0.4,
    rotation = 0,
    color = '#00695c'
  } = props;

  const propsRef = useRef<SilkProps>(props);
  propsRef.current = props;

  const ctnDom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctn = ctnDom.current;
    if (!ctn) return;

    const renderer = new Renderer({
      alpha: true,
      premultipliedAlpha: true,
      antialias: true
    });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.canvas.style.backgroundColor = 'transparent';

    let program: Program | undefined;

    function resize() {
      if (!ctn) return;
      const width = ctn.offsetWidth;
      const height = ctn.offsetHeight;
      renderer.setSize(width, height);
      if (program) {
        program.uniforms.uResolution.value = [width, height];
      }
    }
    window.addEventListener('resize', resize);

    const geometry = new Triangle(gl);
    if (geometry.attributes.uv) {
      delete geometry.attributes.uv;
    }

    const silkColor = new Color(color);

    program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [ctn.offsetWidth, ctn.offsetHeight] },
        uSpeed: { value: speed },
        uScale: { value: scale },
        uNoiseIntensity: { value: noiseIntensity },
        uRotation: { value: rotation * Math.PI / 180 }, // Convert to radians
        uColor: { value: [silkColor.r, silkColor.g, silkColor.b] }
      }
    });

    const mesh = new Mesh(gl, { geometry, program });
    ctn.appendChild(gl.canvas);

    let animateId = 0;
    const update = (t: number) => {
      animateId = requestAnimationFrame(update);
      if (program) {
        const currentProps = propsRef.current;
        program.uniforms.uTime.value = t * 0.001;
        
        // Update parameters from props
        program.uniforms.uSpeed.value = currentProps.speed ?? speed;
        program.uniforms.uScale.value = currentProps.scale ?? scale;
        program.uniforms.uNoiseIntensity.value = currentProps.noiseIntensity ?? noiseIntensity;
        program.uniforms.uRotation.value = (currentProps.rotation ?? rotation) * Math.PI / 180;
        
        if (currentProps.color !== color) {
          const newColor = new Color(currentProps.color ?? color);
          program.uniforms.uColor.value = [newColor.r, newColor.g, newColor.b];
        }
        
        renderer.render({ scene: mesh });
      }
    };
    animateId = requestAnimationFrame(update);

    resize();

    return () => {
      cancelAnimationFrame(animateId);
      window.removeEventListener('resize', resize);
      if (ctn && gl.canvas.parentNode === ctn) {
        ctn.removeChild(gl.canvas);
      }
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);

  return <div ref={ctnDom} className="silk-container" />;
}
