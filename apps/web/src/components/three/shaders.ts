/** Bruit simplex 3D (Ashima Arts, licence MIT). */
export const SIMPLEX_NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;

export const ORB_VERTEX = /* glsl */ `
uniform float uTime;
uniform float uEnergy;
uniform vec3 uPointer;
uniform float uPointerStrength;
varying vec3 vWorldPos;
varying vec2 vUv;
varying float vDisp;
${SIMPLEX_NOISE}
void main() {
  vec3 p = position;
  float t = uTime * 0.32;
  float n = snoise(p * 1.1 + vec3(t)) * 0.085 + snoise(p * 2.6 - vec3(t * 1.4)) * 0.022;
  float facing = dot(normalize(p), normalize(uPointer));
  float pull = smoothstep(0.55, 1.0, facing) * 0.1 * uPointerStrength;
  float d = n * (1.0 + uEnergy * 2.2) + pull;
  p += normal * d;
  vDisp = d;
  vUv = uv;
  vec4 worldPos = modelMatrix * vec4(p, 1.0);
  vWorldPos = worldPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

export const ORB_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform float uEnergy;
uniform vec3 uDeep;
uniform vec3 uMid;
uniform vec3 uGold;
uniform vec3 uClay;
uniform vec3 uGreen;
varying vec3 vWorldPos;
varying vec2 vUv;
varying float vDisp;

// Ndop : treillis de losanges, losange intérieur et point central
float ndop(vec2 p) {
  vec2 g = fract(p) - 0.5;
  float d = abs(g.x) + abs(g.y);
  float outer = smoothstep(0.045, 0.0, abs(d - 0.44));
  float inner = smoothstep(0.04, 0.0, abs(d - 0.2));
  float center = smoothstep(0.08, 0.045, length(g));
  return clamp(outer + inner + center, 0.0, 1.0);
}

// Bogolan : zigzag et rangée de points
float bogolan(vec2 p) {
  vec2 g = fract(p);
  float zig = abs(fract(p.x * 2.0) - 0.5) * 0.5 + 0.25;
  float line = smoothstep(0.05, 0.0, abs(g.y - zig));
  vec2 dp = fract(vec2(p.x * 3.0, p.y) ) - vec2(0.5, 0.82);
  float dots = smoothstep(0.1, 0.05, length(dp * vec2(1.0, 1.6)));
  return clamp(line + dots, 0.0, 1.0);
}

void main() {
  vec3 N = normalize(cross(dFdx(vWorldPos), dFdy(vWorldPos)));
  vec3 V = normalize(cameraPosition - vWorldPos);
  vec3 L = normalize(vec3(-0.5, 0.8, 0.9));
  float fres = pow(1.0 - max(dot(N, V), 0.0), 2.3);
  float diff = max(dot(N, L), 0.0);
  float spec = pow(max(dot(reflect(-L, N), V), 0.0), 90.0);

  // Bandes de latitude alternant ndop et bogolan, défilement lent
  vec2 uv = vec2(vUv.x + uTime * 0.012, vUv.y);
  vec2 cell = vec2(uv.x * 28.0, uv.y * 14.0);
  float band = floor(uv.y * 7.0);
  float isNdop = mod(band, 2.0);
  float motif = mix(bogolan(cell), ndop(cell), isNdop);
  float seam = smoothstep(0.03, 0.0, abs(fract(uv.y * 7.0) - 0.0)) + smoothstep(0.03, 0.0, abs(fract(uv.y * 7.0) - 1.0));
  float poleFade = smoothstep(0.04, 0.16, vUv.y) * smoothstep(0.96, 0.84, vUv.y);
  motif = clamp(motif + seam, 0.0, 1.0) * poleFade;

  // Onde lumineuse qui parcourt les motifs (accélère quand Sonah réfléchit)
  float wave = 0.5 + 0.5 * sin(vUv.y * 26.0 - uTime * (1.6 + uEnergy * 4.0) + vUv.x * 6.2831);
  float heat = smoothstep(-0.05, 0.2, vDisp);

  vec3 base = mix(uDeep, uMid, diff * 0.85 + heat * 0.35);
  vec3 thread = mix(uGold, uClay, isNdop * 0.35 + (1.0 - wave) * 0.25);
  vec3 col = base;
  col += thread * motif * (0.28 + 0.9 * wave) * (0.75 + uEnergy * 0.8);
  col += mix(uClay, uGold, fres) * fres * 1.1;
  col += uGreen * smoothstep(0.6, 1.0, fres) * 0.25;
  col += vec3(1.0, 0.82, 0.5) * spec * 0.1;

  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export const RING_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/** Anneau kente : blocs de couleurs tissés le long du tore. */
export const RING_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform vec3 uGold;
uniform vec3 uGreen;
uniform vec3 uRed;
uniform vec3 uBlack;
varying vec2 vUv;
void main() {
  float x = fract(vUv.x * 90.0 + uTime * 0.04);
  float block = mod(floor(vUv.x * 90.0 + uTime * 0.04), 4.0);
  vec3 col = uGold;
  if (block == 1.0) col = uGreen;
  else if (block == 2.0) col = uRed;
  else if (block == 3.0) col = uGold * 0.9;
  float stripe = step(0.82, x);
  col = mix(col, uBlack, stripe);
  float shade = 0.65 + 0.35 * sin(vUv.y * 6.2831);
  gl_FragColor = vec4(col * shade * 1.15, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export const DUST_VERTEX = /* glsl */ `
uniform float uTime;
uniform float uPixelRatio;
uniform float uEnergy;
attribute float aAngle;
attribute float aRadius;
attribute float aHeight;
attribute float aScale;
varying float vScale;
varying float vFade;
void main() {
  float speed = 0.06 + 0.22 / aRadius;
  float a = aAngle + uTime * speed * (1.0 + uEnergy * 2.5);
  vec3 p = vec3(cos(a) * aRadius, aHeight + sin(uTime * 0.6 + aAngle * 3.0) * 0.04, sin(a) * aRadius);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aScale * uPixelRatio * 26.0 / -mv.z;
  vScale = aScale;
  vFade = 1.0 - smoothstep(2.1, 2.9, aRadius);
}
`;

export const DUST_FRAGMENT = /* glsl */ `
uniform vec3 uGold;
uniform vec3 uClay;
varying float vScale;
varying float vFade;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float alpha = smoothstep(0.5, 0.0, d);
  vec3 col = mix(uClay, uGold, smoothstep(0.4, 1.2, vScale));
  gl_FragColor = vec4(col, alpha * 0.85 * vFade);
  #include <colorspace_fragment>
}
`;
