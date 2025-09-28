import { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Color, Triangle } from 'ogl';

import './LightRays.css';

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
uniform vec3 uRaysColor;
uniform vec2 uRaysOrigin;
uniform float uRaysSpeed;
uniform float uLightSpread;
uniform float uRayLength;
uniform float uFadeDistance;
uniform float uSaturation;
uniform float uMouseInfluence;
uniform float uNoiseAmount;
uniform float uDistortion;
uniform bool uPulsating;
uniform vec2 uMouse;

out vec4 fragColor;

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    vec2 center = uRaysOrigin;
    
    // Влияние мыши
    vec2 mouseInfluence = uMouse * uMouseInfluence;
    center += mouseInfluence;
    
    vec2 dir = uv - center;
    float dist = length(dir);
    dir = normalize(dir);
    
    // Угол для лучей
    float angle = atan(dir.y, dir.x);
    
    // Создаем лучи
    float rayPattern = sin(angle * uLightSpread + uTime * uRaysSpeed) * 0.5 + 0.5;
    
    // Добавляем шум если нужно
    if (uNoiseAmount > 0.0) {
        float noiseValue = noise(uv * 10.0 + uTime * 0.5) * uNoiseAmount;
        rayPattern += noiseValue;
    }
    
    // Добавляем искажение если нужно
    if (uDistortion > 0.0) {
        vec2 distortedUV = uv + sin(uv * 10.0 + uTime) * uDistortion * 0.01;
        rayPattern *= noise(distortedUV * 5.0);
    }
    
    // Пульсация если включена
    float pulseFactor = 1.0;
    if (uPulsating) {
        pulseFactor = sin(uTime * 2.0) * 0.3 + 0.7;
    }
    
    // Длина луча
    float rayIntensity = 1.0 - smoothstep(0.0, uRayLength, dist);
    
    // Затухание по расстоянию
    float fadeOut = 1.0 - smoothstep(0.0, uFadeDistance, dist);
    
    // Комбинируем все эффекты
    float intensity = rayPattern * rayIntensity * fadeOut * pulseFactor;
    intensity = clamp(intensity, 0.0, 1.0);
    
    // Применяем насыщенность
    vec3 color = uRaysColor * intensity;
    color = mix(vec3(dot(color, vec3(0.299, 0.587, 0.114))), color, uSaturation);
    
    fragColor = vec4(color, intensity * 0.8);
}
`;

interface LightRaysProps {
  raysColor?: string;
  raysOrigin?: 'top' | 'center' | 'bottom';
  raysSpeed?: number;
  lightSpread?: number;
  rayLength?: number;
  fadeDistance?: number;
  saturation?: number;
  mouseInfluence?: number;
  noiseAmount?: number;
  distortion?: number;
  pulsating?: boolean;
}

export default function LightRays(props: LightRaysProps) {
  const {
    raysColor = '#FFCDB8',
    raysOrigin = 'top',
    raysSpeed = 1,
    lightSpread = 1.7,
    rayLength = 3,
    fadeDistance = 1,
    saturation = 1,
    mouseInfluence = 0.1,
    noiseAmount = 0,
    distortion = 0,
    pulsating = false
  } = props;

  const propsRef = useRef<LightRaysProps>(props);
  propsRef.current = props;

  const ctnDom = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

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

    // Обработчик мыши
    function handleMouseMove(e: MouseEvent) {
      if (!ctn) return;
      const rect = ctn.getBoundingClientRect();
      mouseRef.current.x = (e.clientX - rect.left) / rect.width;
      mouseRef.current.y = 1.0 - (e.clientY - rect.top) / rect.height;
    }
    window.addEventListener('mousemove', handleMouseMove);

    const geometry = new Triangle(gl);
    if (geometry.attributes.uv) {
      delete geometry.attributes.uv;
    }

    // Определяем позицию источника лучей
    const getOriginPosition = (origin: string): [number, number] => {
      switch (origin) {
        case 'top': return [0.5, 1.0];
        case 'bottom': return [0.5, 0.0];
        case 'center':
        default: return [0.5, 0.5];
      }
    };

    const originPos = getOriginPosition(raysOrigin);
    const color = new Color(raysColor);

    program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [ctn.offsetWidth, ctn.offsetHeight] },
        uRaysColor: { value: [color.r, color.g, color.b] },
        uRaysOrigin: { value: originPos },
        uRaysSpeed: { value: raysSpeed },
        uLightSpread: { value: lightSpread },
        uRayLength: { value: rayLength },
        uFadeDistance: { value: fadeDistance },
        uSaturation: { value: saturation },
        uMouseInfluence: { value: mouseInfluence },
        uNoiseAmount: { value: noiseAmount },
        uDistortion: { value: distortion },
        uPulsating: { value: pulsating },
        uMouse: { value: [0, 0] }
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
        program.uniforms.uMouse.value = [mouseRef.current.x, mouseRef.current.y];
        
        // Обновляем параметры из props
        program.uniforms.uRaysSpeed.value = currentProps.raysSpeed ?? raysSpeed;
        program.uniforms.uLightSpread.value = currentProps.lightSpread ?? lightSpread;
        program.uniforms.uRayLength.value = currentProps.rayLength ?? rayLength;
        program.uniforms.uFadeDistance.value = currentProps.fadeDistance ?? fadeDistance;
        program.uniforms.uSaturation.value = currentProps.saturation ?? saturation;
        program.uniforms.uMouseInfluence.value = currentProps.mouseInfluence ?? mouseInfluence;
        program.uniforms.uNoiseAmount.value = currentProps.noiseAmount ?? noiseAmount;
        program.uniforms.uDistortion.value = currentProps.distortion ?? distortion;
        program.uniforms.uPulsating.value = currentProps.pulsating ?? pulsating;
        
        if (currentProps.raysColor !== raysColor) {
          const newColor = new Color(currentProps.raysColor ?? raysColor);
          program.uniforms.uRaysColor.value = [newColor.r, newColor.g, newColor.b];
        }
        
        if (currentProps.raysOrigin !== raysOrigin) {
          const newOrigin = getOriginPosition(currentProps.raysOrigin ?? raysOrigin);
          program.uniforms.uRaysOrigin.value = newOrigin;
        }
        
        renderer.render({ scene: mesh });
      }
    };
    animateId = requestAnimationFrame(update);

    resize();

    return () => {
      cancelAnimationFrame(animateId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (ctn && gl.canvas.parentNode === ctn) {
        ctn.removeChild(gl.canvas);
      }
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);

  return <div ref={ctnDom} className="light-rays-container" />;
}
