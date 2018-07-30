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

#define DEG2RAD PI/180.

#define CAMERA_FOV 25.

#define RAY_T_MIN 0.0001
#define RAY_T_MAX 1.0e30

#define RIPPLE_FACTOR 0.5
#define RIPPLE_SPEED 1.

#define J_S_C vec3(0, 0, 0)
#define J_E_C vec3(1, 1, 1)

#define J_GRADIENT(t) mix(mix(J_S_C, J_E_C, t), mix(J_E_C, J_S_C, t), t)

#define S_S_C vec3(0.0, 0.0, 0.0)
#define S_E_C vec3(1, 1, 1)

#define S_GRADIENT(t) mix(mix(S_S_C, S_E_C, t), mix(S_E_C, S_S_C, t), t)

vec3 applyGammaCorrection(vec3 color, float exposure, float gamma){
    vec3 new = color.rgb;
    new.r = pow(color.r * exposure, gamma);
    new.g = pow(color.g * exposure, gamma);
    new.b = pow(color.b * exposure, gamma);
    return new;
}

struct Ray{
    vec3 origin;
    vec3 direction;
    float tMax;
};

struct Plane{
    vec3 position;
    vec3 normal;
    vec3 color;
};

struct Sphere{
    vec3 center;
    float radius;
    vec3 color;
};

struct Intersection{
    Ray ray;
    float t;

    vec3 color;
};

struct Eye{
    vec3 origin;
    vec3 forward;
    vec3 up;
    vec3 right;

    float h;
    float w;
};


vec3 calculatePointFromRay(Ray r, float t){
    return r.origin + r.direction*t;
}


vec3 interesectionPoint(Intersection i){
    return calculatePointFromRay(i.ray, i.t);
}

bool planeDoesIntersect(Plane p, Ray r){
    // First, check if we intersect
	float dDotN = dot(r.direction, p.normal);

	if (dDotN == 0.0)
	{
		// We just assume the ray is not embedded in the plane
		return false;
	}

	// Find point of intersection
	float t = dot(p.position - r.origin, p.normal) / dDotN;

	if (t <= RAY_T_MIN || t >= r.tMax)
	{
		// Outside relevant range
		return false;
	}

	return true;
}

float intersectPlane(Plane p, Intersection i){
    float dDotN = dot(i.ray.direction, p.normal);
    if(dDotN == 0.0){
        return 0.0;
    }
    float t = dot(p.position - i.ray.origin, p.normal) / dDotN;
    if(t <= RAY_T_MIN || t >= i.t){
        return -1.;
    }
    return t;
}

float intersectSphere(Sphere s, Intersection i){
    Ray local = Ray(i.ray.origin, i.ray.direction, i.ray.tMax);
    local.origin -= s.center;

    // Calculate quadratic coefficients
    float dl = length(local.direction);
	float a = dl*dl;
	float b = 2. * dot(local.direction, local.origin);
    float ol = length(local.origin);
	float c = ol*ol  - s.radius*s.radius;

	// Check whether we intersect
	float discriminant = b*b - 4. * a * c;

	if (discriminant < 0.0)
	{
		return -1.0;
	}

	// Find two points of intersection, t1 close and t2 far
	float t1 = (-b - sqrt(discriminant)) / (2. * a);
	float t2 = (-b + sqrt(discriminant)) / (2. * a);
    float t = -1.0;
	// First check if close intersection is valid
	if (t1 > RAY_T_MIN && t1 < i.t)
	{
		t = t1;
	}
	else if (t2 > RAY_T_MIN && t2 < i.t)
	{
		t = t2;
	}
	else
	{
		// Neither is valid
		return -1.0;
	}

	return t;
}

bool sphereDoesIntersect(Sphere s, Ray r){
    Ray local = r;
    r.origin -= s.center;
    
    // Calculate quadratic coefficients
    float dl = length(local.direction);
	float a = dl*dl;
	float b = 2. * dot(local.direction, local.origin);
    float ol = length(local.origin);
	float c = ol*ol  - s.radius*s.radius;

	// Check whether we intersect
	float discriminant = b*b - 4. * a * c;

	if (discriminant < 0.0)
	{
		return false;
	}

	// Find two points of intersection, t1 close and t2 far
	float t1 = (-b - sqrt(discriminant)) / (2. * a);

	// First check if close intersection is valid
	if (t1 > RAY_T_MIN && t1 < r.tMax)
	{
		return true;
	}

	float t2 = (-b + sqrt(discriminant)) / (2. * a);
	if (t2 > RAY_T_MIN && t2 < r.tMax)
	{
		return true;
	}

    return false;
}

Eye createEye(vec3 origin, vec3 target, vec3 upguide, float fov, float aspectRatio){
    vec3 forward = normalize(target - origin);
    vec3 right = normalize(cross(forward, upguide));
    vec3 up = cross(right, forward);

    float h = tan(fov);
    float w = h * aspectRatio;

    return Eye(origin, forward, right, up, h, w);
}

Ray eyeMakeRay(Eye e, vec2 point){
    vec3 dir = e.forward + point.x * e.w * e.right + point.y * e.h * e.up;
    return Ray(e.origin, normalize(dir), RAY_T_MAX);
}

float quadratic(float a, float b, float c, float t){
    return mix(mix(a, b, t), mix(b, c, t), t);
}


float modI(float a,float b) {
    float m=a-floor((a+0.5)/b)*b;
    return floor(m+0.5);
}
#define J_I 50.
#define J_S 1.

vec3 julia(vec2 pos, vec2 res){
    float w = res.x;
    float h = res.y;
    float re = cos(u_time/8.);
    float im = -sin(u_time/8.);
    
    float newRe = 1.5*(pos.x - w/2.0)/(0.5*w*J_S);
    float newIm = (pos.y - h/2.0)/(0.5*h*J_S);
    float oldRe, oldIm;
    
    float steps;
    
    for(float i = 0.; i < J_I; i++){
        steps = i;
        oldRe = newRe;
        oldIm = newIm;
        
        newRe = oldRe*oldRe - oldIm*oldIm + re;
        newIm = 2.0*oldRe * oldIm + im;
        
        if((newRe*newRe + newIm*newIm) > 4.) break;
    }
    
    float s_f = steps;
    return J_GRADIENT(s_f/J_I);
}

vec3 render_plane(Plane p, vec3 coords, float w, float h){

    vec3 diff = coords - p.position;
/*
    float len = length(diff / RIPPLE_FACTOR);
    float grade = sin(len - u_time / RIPPLE_SPEED);

    float c = grade;
    */

    float len = length(diff);

    return julia(diff.xz, u_resolution.xy);
}



void main() {
    float width = u_resolution.x;
    float height = u_resolution.y;

    // plane for the scene
    vec3 plane_pos = vec3(0.0, 0.0, 0.0);
    vec3 plane_norm = vec3(0.0, 1.0, 0.0);
    vec3 plane_color = vec3(0.5, 1.0, 0.5);
    Plane p = Plane(plane_pos, plane_norm, plane_color);

    float cosine = cos(u_time);
    float sine = sin(u_time);

    float max_v = max(u_resolution.x, u_resolution.y);
    float fix_h = max_v*0.15;

    vec3 sphere_pos = vec3(u_resolution.x/2., fix_h*2. + fix_h*sine, u_resolution.y/2.);
    float sphere_radius = fix_h + fix_h*0.5*sine;
    vec3 sphere_color = vec3(0.5, 0.5, 1.0);
    Sphere s = Sphere(sphere_pos, sphere_radius, sphere_color);

    vec3 eye_pos = vec3(u_resolution.x/2. - fix_h*4., fix_h, u_resolution.y/2.);
    vec3 target = sphere_pos.xyz; // vec3(0.0, 1.0, 0.0); // 
    vec3 upguide = vec3(0.0, 0.0, 1.0);
    float fov = CAMERA_FOV * DEG2RAD;
    float aspectRatio = width / height;
    Eye e = createEye(eye_pos, target, upguide, fov, aspectRatio);


    float x = gl_FragCoord.x;
    float y = gl_FragCoord.y;
    float scx = 2.0*x / width - 1.0;
    float scy = -2.0*y / height + 1.0;
    Ray ray = eyeMakeRay(e, vec2(scx, scy));

    Intersection i = Intersection(ray, RAY_T_MAX, vec3(0.0, 0.0, 1.0));

    float ts = intersectSphere(s, i);
    float tp = intersectPlane(p, i);
    if(ts > 0.0){
        // get intersection point
        vec3 phit = i.ray.origin + i.ray.direction*ts;
        

        //use gradient as default color
        float flo = sphere_pos.y - sphere_radius;
        float cei = sphere_pos.y + sphere_radius*0.5;
        float range = cei - flo;
        float t = (phit.y - flo) / range;
        vec4 def_color = vec4(S_GRADIENT(t), 1.0);
        
        // get normal of the intersection
        vec3 normal = normalize(phit - sphere_pos);

        // get reflect vector
        Ray r = Ray(phit, reflect(ray.direction, normal), RAY_T_MAX);
        Intersection ir = Intersection(r, RAY_T_MAX, vec3(0., 0., 0.));
        
        //check if reflect vector hits plane
        float tps = intersectPlane(p, ir);
        if(tps > 0.0) {
            // if it hits, render plane
            vec3 phits = ir.ray.origin + ir.ray.direction*tps;
            def_color *= vec4(render_plane(p, phits, e.w, e.h), 1.0);
        }
        gl_FragColor = def_color;
    } else if(tp > 0.0) {
        vec3 phit = i.ray.origin + i.ray.direction*tp;
        gl_FragColor = vec4(render_plane(p, phit, e.w, e.h), 1.0);
    } else {
        gl_FragColor = vec4(0., 0., 0., 1.0);   
    }
}