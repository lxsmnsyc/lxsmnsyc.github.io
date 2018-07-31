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

#define DEPTH_BUFFER 4

#define MATERIAL_TYPE 1

#define REFLECT_AND_REFRACT 1
#define REFLECT_ONLY 2
#define REFRAFT_ONLY 3

/**
 *
 *  Ray Struct
 *
 */
struct Ray{
    vec3 origin;
    vec3 direction;
    float tMax;
};

vec3 calculatePointFromRay(Ray r, float t){
    return r.origin + r.direction*t;
}

/**
 *
 *  Intersection Struct
 *
 */

struct Intersection{
    Ray ray;
    float t;

    vec3 color;
};

vec3 interesectionPoint(Intersection i){
    return calculatePointFromRay(i.ray, i.t);
}

/**
 *
 *  Plane Struct
 *
 */

struct Plane{
    vec3 position;
    vec3 normal;
    vec3 color;
};

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

/**
 *
 *  Sphere Struct
 *
 */

struct Sphere{
    vec3 center;
    float radius;
    vec3 color;
};

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


/**
 *
 *  Eye Struct
 *
 */

struct Eye{
    vec3 origin;
    vec3 forward;
    vec3 up;
    vec3 right;

    float h;
    float w;
};
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

Ray getReflectionRay(Ray r, vec3 normal){
    return Ray(r.origin, reflect(r.direction, normal), r.tMax);
}

Ray getRefractionRay(Ray r, vec3 normal, float index){
    return Ray(r.origin, refract(r.direction, normal, index), r.tMax);
}

vec3 getIntersectionPoint(Intersection i, float ts){
    return i.ray.origin + i.ray.direction*ts;
}


void main() {
    float width = u_resolution.x;
    float height = u_resolution.y;

    float cosine = cos(u_time);
    float sine = sin(u_time);
    // create eye
    vec3 eye_pos = vec3(10.*cosine, 10.*sine, 0.0);
    vec3 target = vec3(0, 0, 0.0); 
    vec3 upguide = vec3(0.0, 0.0, 1.0);
    float fov = CAMERA_FOV * DEG2RAD;
    float aspectRatio = width / height;
    Eye e = createEye(eye_pos, target, upguide, fov, aspectRatio);

    Plane planes[6];
    planes[0] = Plane(
        vec3(0, -10, 0),
        vec3(0, 1, 0),
        vec3(0.5, 1, 0.5)
    ); // bottom
    planes[1] = Plane(
        vec3(0, 10, 0),
        vec3(0, -1, 0),
        vec3(1., 0.5, 1)
    ); // top
    planes[2] = Plane(
        vec3(-10, 0, 0),
        vec3(1, 0, 0),
        vec3(1, 1, 0.5)
    ); // left
    planes[3] = Plane(
        vec3(10, 0, 0),
        vec3(-1, 0, 0),
        vec3(0.5, 0.5, 1)
    ); // right
    planes[4] = Plane(
        vec3(0, 0, 10),
        vec3(0, 0, -1),
        vec3(1, 1, 1)
    ); // back
    planes[5] = Plane(
        vec3(0, 0, -10),
        vec3(0, 0, 1),
        vec3(0.25, 0.25, 0.25)
    ); // back
    Sphere spheres[4];

    spheres[0] = Sphere(
        vec3(0. + cosine*sine, -2.5 + sine*sine, 3. - cosine),
        2.0,
        vec3(0, 0.5, 1)
    );
    spheres[1] = Sphere(
        vec3(0. + cosine*sine, -2.5 + sine*sine, -3. + cosine),
        2.0,
        vec3(1, 0.5, 0)
    );
    spheres[2] = Sphere(
        vec3(cosine*sine, 2.5 + sine*sine, 3. - cosine),
        2.0,
        vec3(1, 0., 0.5)
    );
    spheres[3] = Sphere(
        vec3(cosine*sine, 2.5 + sine*sine, -3. + cosine),
        2.0,
        vec3(0.5, 0., 1)
    );

    float x = gl_FragCoord.x;
    float y = gl_FragCoord.y;
    float scx = 2.0*x / width - 1.0;
    float scy = -2.0*y / height + 1.0;
    Ray ray = eyeMakeRay(e, vec2(scx, scy));
    Intersection i;
    vec3 final = vec3(0, 0, 0);
    int b = 0;
    float prevdist = RAY_T_MAX;
    for(int ref = 0; ref < DEPTH_BUFFER; ref++){
        Intersection is[4];
        float tps[4];
        for(int x = 4; x >= 0; x--){
            is[x] = Intersection(ray, RAY_T_MAX, vec3(0.0, 0.0, 1.0));
            tps[x] = intersectSphere(spheres[x], is[x]);
        }

        Intersection is2[6];
        float tps2[6];

        for(int x = 0; x < 6; x++){
            is2[x] = Intersection(ray, RAY_T_MAX, vec3(0.0, 0.0, 1.0));
            tps2[x] = intersectPlane(planes[x], is2[x]);
        }

        float smallest = RAY_T_MAX;
        Intersection si;
        Sphere s;
        bool found = false;
        int f = 0;
        for(int x = 0; x < 4; x++){
            if(tps[x] > 0. && tps[x] < smallest){
                smallest = tps[x];
                si = is[x];
                found = true;
                s = spheres[x];
            }
        }

        float smallest2 = RAY_T_MAX;
        bool found2 = false;
        Intersection si2;
        Plane sp;
        for(int x = 0; x < 6; x++){
            if(tps2[x] > 0. && tps2[x] < smallest2){
                smallest2 = tps2[x];
                si2 = is2[x];
                found2 = true;
                sp = planes[x];
            }
        }

        if(found && found2){
            if(smallest2 < smallest){
                vec3 phit = getIntersectionPoint(si2, smallest2);
                vec3 normal = sp.normal;
                vec3 v = normalize(ray.origin - phit);
                float ratio = max(0., dot(normal, v));
                ray = getReflectionRay(ray, normal);
                //final += spheres[x].color*ratio;
                final = mix(final, sp.color, ratio);
            } else {
                vec3 phit = getIntersectionPoint(si, smallest);
                vec3 normal = normalize(phit - s.center);
                vec3 v = normalize(ray.origin - phit);
                float ratio = max(0., dot(normal, v));
                ray = getReflectionRay(ray, normal);
                //final += spheres[x].color*ratio;
                final = mix(final, s.color, ratio);
            }
        } else if(found2){
            vec3 phit = getIntersectionPoint(si2, smallest2);
            vec3 normal = sp.normal;
            vec3 v = normalize(ray.origin - phit);
            float ratio = max(0., dot(normal, v));
            ray = getReflectionRay(ray, normal);
            //final += spheres[x].color*ratio;
            final = mix(final, sp.color, ratio);
        } else if(found){
            vec3 phit = getIntersectionPoint(si, smallest);
            vec3 normal = normalize(phit - s.center);
            vec3 v = normalize(ray.origin - phit);
            float ratio = max(0., dot(normal, v));
            ray = getReflectionRay(ray, normal);
            //final += spheres[x].color*ratio;
            final = mix(final, s.color, ratio);
        }
    }

    gl_FragColor = vec4(final, 1.0);
}