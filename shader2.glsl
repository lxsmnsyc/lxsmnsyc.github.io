#ifdef GL_FRAGMENT_PRECISION_HIGH
		precision highp float;
	#else
		precision mediump float;
	#endif
	precision mediump int;

	uniform vec2 u_resolution;
	uniform vec2 u_mouse;
	uniform float u_time;

	#define PI 3.14159265358979323
	
	#define SPHERE_RADIUS 1.0
	
	
	const int MAX_MARCHING_STEPS = 255;
	const float MIN_DIST = 0.0;
	const float MAX_DIST = 100.0;
	const float EPSILON = 0.0001;
	
	//	Simplex 3D Noise 
	//	by Ian McEwan, Ashima Arts
	//
	vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
	vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
	float snoise(vec3 v){ 
	  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
	  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

	// First corner
	  vec3 i  = floor(v + dot(v, C.yyy) );
	  vec3 x0 =   v - i + dot(i, C.xxx) ;

	// Other corners
	  vec3 g = step(x0.yzx, x0.xyz);
	  vec3 l = 1.0 - g;
	  vec3 i1 = min( g.xyz, l.zxy );
	  vec3 i2 = max( g.xyz, l.zxy );

	  //  x0 = x0 - 0. + 0.0 * C 
	  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
	  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
	  vec3 x3 = x0 - 1. + 3.0 * C.xxx;

	// Permutations
	  i = mod(i, 289.0 ); 
	  vec4 p = permute( permute( permute( 
				 i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
			   + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
			   + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

	// Gradients
	// ( N*N points uniformly over a square, mapped onto an octahedron.)
	  float n_ = 1.0/7.0; // N=7
	  vec3  ns = n_ * D.wyz - D.xzx;

	  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

	  vec4 x_ = floor(j * ns.z);
	  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

	  vec4 x = x_ *ns.x + ns.yyyy;
	  vec4 y = y_ *ns.x + ns.yyyy;
	  vec4 h = 1.0 - abs(x) - abs(y);

	  vec4 b0 = vec4( x.xy, y.xy );
	  vec4 b1 = vec4( x.zw, y.zw );

	  vec4 s0 = floor(b0)*2.0 + 1.0;
	  vec4 s1 = floor(b1)*2.0 + 1.0;
	  vec4 sh = -step(h, vec4(0.0));

	  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
	  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

	  vec3 p0 = vec3(a0.xy,h.x);
	  vec3 p1 = vec3(a0.zw,h.y);
	  vec3 p2 = vec3(a1.xy,h.z);
	  vec3 p3 = vec3(a1.zw,h.w);

	//Normalise gradients
	  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
	  p0 *= norm.x;
	  p1 *= norm.y;
	  p2 *= norm.z;
	  p3 *= norm.w;

	// Mix final noise value
	  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
	  m = m * m;
	  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
									dot(p2,x2), dot(p3,x3) ) );
	}
	/*
	 * SDF
	 */
	
	float sdSphere( vec3 p, float s )
	{
		return length(p)-s;
	}
	float sdBox( vec3 p, vec3 b )
	{
		vec3 d = abs(p) - b;
		return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
	}
	float sdTorus( vec3 p, vec2 t )
	{
		vec2 q = vec2(length(p.xz)-t.x,p.y);
		return length(q)-t.y;
	}
	
	/**
	 *
	 *
	float repeat( in vec3 p, in vec3 c )
	{
		vec3 q = mod(p,c)-0.5*c;
		return sdSphere( q,  SPHERE_RADIUS);
	} */
	vec3 repeat(vec3 p, vec3 c)
	{
		return mod(p,c)-0.5*c;
	}
	
	float unionSDF( float d1, float d2 )
	{
		return min(d1,d2);
	}
	float opS( float d1, float d2 )
	{
		return max(-d1,d2);
	}
	/**
	 * Signed distance function describing the scene.
	 * 
	 * Absolute value of the return value indicates the distance to the surface.
	 * Sign indicates whether the point is inside or outside the surface,
	 * negative indicating inside.
	 */
	float sceneSDF(vec3 samplePoint) {  
		float t1 = sdSphere(repeat(samplePoint, vec3(10)), 1.);
		float t2 = sdBox(repeat(samplePoint, vec3(20)), vec3(1., 0.5, 2.));
		float t3 = sdTorus(repeat(samplePoint, vec3(30)), vec2(4, 1));
		return unionSDF(unionSDF(t1, t2), t3);
	}
	
	/**
	 * Return the shortest distance from the eyepoint to the scene surface along
	 * the marching direction. If no part of the surface is found between start and end,
	 * return end.
	 * 
	 * eye: the eye point, acting as the origin of the ray
	 * marchingDirection: the normalized direction to march in
	 * start: the starting distance away from the eye
	 * end: the max distance away from the ey to march before giving up
	 */
	float shortestDistanceToSurface(vec3 eye, vec3 marchingDirection, float start, float end) {
		float depth = start;
		for (int i = 0; i < MAX_MARCHING_STEPS; i++) {
			float dist = sceneSDF(eye + depth * marchingDirection);
			if (dist < EPSILON) {
				return depth;
			}
			depth += dist;
			if (depth >= end) {
				return end;
			}
		}
		return end;
	}
				

	/**
	 * Return the normalized direction to march in from the eye point for a single pixel.
	 * 
	 * fieldOfView: vertical field of view in degrees
	 * size: resolution of the output image
	 * fragCoord: the x,y coordinate of the pixel in the output image
	 */
	vec3 rayDirection(float fieldOfView, vec2 size, vec2 fragCoord) {
		vec2 xy = fragCoord - size / 2.0;
		float z = size.y / tan(radians(fieldOfView) / 2.0);
		return normalize(vec3(xy, -z));
	}

	/**
	 * Using the gradient of the SDF, estimate the normal on the surface at point p.
	 */
	vec3 estimateNormal(vec3 p) {
		return normalize(vec3(
			sceneSDF(vec3(p.x + EPSILON, p.y, p.z)) - sceneSDF(vec3(p.x - EPSILON, p.y, p.z)),
			sceneSDF(vec3(p.x, p.y + EPSILON, p.z)) - sceneSDF(vec3(p.x, p.y - EPSILON, p.z)),
			sceneSDF(vec3(p.x, p.y, p.z  + EPSILON)) - sceneSDF(vec3(p.x, p.y, p.z - EPSILON))
		));
	}
	
	/**
	 * Lighting contribution of a single point light source via Phong illumination.
	 * 
	 * The vec3 returned is the RGB color of the light's contribution.
	 *
	 * k_a: Ambient color
	 * k_d: Diffuse color
	 * k_s: Specular color
	 * alpha: Shininess coefficient
	 * p: position of point being lit
	 * eye: the position of the camera
	 * lightPos: the position of the light
	 * lightIntensity: color/intensity of the light
	 *
	 * See https://en.wikipedia.org/wiki/Phong_reflection_model#Description
	 */
	vec3 phongContribForLight(vec3 k_d, vec3 k_s, float alpha, vec3 p, vec3 eye,
							  vec3 lightPos, vec3 lightIntensity) {
		vec3 N = estimateNormal(p);
		vec3 L = normalize(lightPos - p);
		vec3 V = normalize(eye - p);
		vec3 R = normalize(reflect(-L, N));
		
		float dotLN = dot(L, N);
		float dotRV = dot(R, V);
		
		if (dotLN < 0.0) {
			// Light not visible from this point on the surface
			return vec3(0.0, 0.0, 0.0);
		} 
		
		if (dotRV < 0.0) {
			// Light reflection in opposite direction as viewer, apply only diffuse
			// component
			return lightIntensity * (k_d * dotLN);
		}
		return lightIntensity * (k_d * dotLN + k_s * pow(dotRV, alpha));
	}

	/**
	 * Lighting via Phong illumination.
	 * 
	 * The vec3 returned is the RGB color of that point after lighting is applied.
	 * k_a: Ambient color
	 * k_d: Diffuse color
	 * k_s: Specular color
	 * alpha: Shininess coefficient
	 * p: position of point being lit
	 * eye: the position of the camera
	 *
	 * See https://en.wikipedia.org/wiki/Phong_reflection_model#Description
	 */
	vec3 phongIllumination(vec3 k_a, vec3 k_d, vec3 k_s, float alpha, vec3 p, vec3 eye) {
		const vec3 ambientLight = 0.5 * vec3(1.0, 1.0, 1.0);
		vec3 color = ambientLight * k_a;
		
		vec3 light1Pos = vec3(4.0 * sin(u_time),
							  2.0,
							  4.0 * cos(u_time));
		vec3 light1Intensity = vec3(0.4, 0.4, 0.4);
		
		color += phongContribForLight(k_d, k_s, alpha, p, eye,
									  light1Pos,
									  light1Intensity);
		
		vec3 light2Pos = vec3(2.0 * sin(0.37 * u_time),
							  2.0 * cos(0.37 * u_time),
							  2.0);
		vec3 light2Intensity = vec3(0.4, 0.4, 0.4);
		
		color += phongContribForLight(k_d, k_s, alpha, p, eye,
									  light2Pos,
									  light2Intensity);    
		return color;
	}

	/**
	 * Return a transform matrix that will transform a ray from view space
	 * to world coordinates, given the eye point, the camera target, and an up vector.
	 *
	 * This assumes that the center of the camera is aligned with the negative z axis in
	 * view space when calculating the ray marching direction. See rayDirection.
	 */
	mat3 viewMatrix(vec3 eye, vec3 center, vec3 up) {
		// Based on gluLookAt man page
		vec3 f = normalize(center - eye);
		vec3 s = normalize(cross(f, up));
		vec3 u = cross(s, f);
		return mat3(s, u, -f);
	}
	
	vec3 render(vec2 coord){
		vec3 viewDir = rayDirection(45.0, u_resolution.xy, coord.xy);
		vec3 eye = vec3(0.0, 2.5, u_time);
		vec2 halfr = u_resolution*0.5;
		vec2 mouse = (halfr - u_mouse)/halfr;
		float pi = 2.*3.14159265358979;
		float mx = mouse.x;
		float my = mouse.y;
		mat3 viewToWorld = viewMatrix(eye, eye + vec3(5.0*mx, 5.0*my, 5.0), vec3(0.0, 1.0, 0.0));
		
		vec3 worldDir = viewToWorld * viewDir;
		
		float dist = shortestDistanceToSurface(eye, worldDir, MIN_DIST, MAX_DIST);
		
		if (dist > MAX_DIST - EPSILON) {
			// Didn't hit anything
			return vec3(0.0);
		}
		else {
			// The closest point on the surface to the eyepoint along the view ray
			vec3 p = eye + dist * worldDir;
			
			// Use the surface normal as the ambient color of the material
			vec3 K_a = vec3(0.2667, 0.3472, 0.3861);
			vec3 K_d = K_a;
			vec3 K_s = vec3(1.0, 1.0, 1.0);
			float shininess = 10.0;
			
			vec3 color = phongIllumination(K_a, K_d, K_s, shininess, p, eye);
			
			return color;
		}
	
	}
	
	/**
	 *	for crt
	 */
	vec3 scanline(vec2 coord, vec3 screen)
	{
		screen.xyz -= sin((coord.y + (u_time * 29.0))) * 0.02;
		return screen;
	}
	
	vec2 crt(vec2 coord, float bend)
	{
		// put in symmetrical coords
		coord = (coord - 0.5) * 2.0;

		coord *= 1.1;	

		// deform coords
		coord.x *= 1.0 + pow((abs(coord.y) / bend), 2.0);
		coord.y *= 1.0 + pow((abs(coord.x) / bend), 2.0);

		// transform back to 0.0 - 1.0 space
		coord  = (coord / 2.0) + 0.5;

		return coord;
	}
	
	vec3 sampleSplit(vec2 coord)
	{
		vec3 frag;
		vec2 ratio = coord/u_resolution;
		frag.x = render(vec2(ratio.x - 0.005 * sin(u_time), ratio.y)*u_resolution).x;
		frag.y = render(coord).y;
		frag.z = render(vec2(ratio.x + 0.005 * sin(u_time), ratio.y)*u_resolution).z;
		return frag;
	}
	
	void main(){
		vec2 uv = gl_FragCoord.xy / u_resolution.xy;
		uv.y = 1.0 - uv.y; // flip tex
		vec2 crtCoords = crt(uv, 3.2);

		// shadertoy has tiling textures. wouldn't be needed
		// if you set up your tex params properly
		if (crtCoords.x < 0.0 || crtCoords.x > 1.0 || crtCoords.y < 0.0 || crtCoords.y > 1.0){
			gl_FragColor = vec4(0.0);
		} else {
			// Split the color channels
			vec3 v = sampleSplit(gl_FragCoord.xy);

			// HACK: this bend produces a shitty moire pattern.
			// Up the bend for the scanline
			vec2 screenSpace = crtCoords * u_resolution.xy;
			//vec3 currentJulia = getJulia(gl_FragCoord.xy);
			gl_FragColor = vec4(scanline(screenSpace, v), 1.0);
		}
	}