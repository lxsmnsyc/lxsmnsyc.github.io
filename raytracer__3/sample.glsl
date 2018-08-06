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

#define EMPTY_VEC3 vec3(0, 0, 0)
#define EMPTY_MATERIAL Material(EMPTY_VEC3, 0.)

#define LIGHTS 4
#define SPHERES 4
#define PLANES 6

#define LIGHTSF 4.

#define SPHERE_RADIUS 2.
#define PLANE_OFFSET 10.
#define CAMERA_OFFSET 10.

struct Material{
    vec3 specular;
    float shininess;
};

struct Ray{
    vec3 point;
    vec3 direction;
    float t;
};

struct Plane{
    vec3 point;
    vec3 normal;
    vec3 forward, right;
    Material m;
};

struct Sphere{
    vec3 center;
    float radius;
    Material m;
};

struct Hit{
    bool hit;
    float t;
    vec3 point, normal;
    Material m;
    vec3 color;
};

struct Eye{
    vec3 point;
    vec3 forward;
    vec3 up;
    vec3 right;

    float h;
    float w;
};

struct Light{
    vec3 point, intensity;
    float ambient;
    float  attn;
};

#define NO_HIT Hit(false, RAY_T_MAX, EMPTY_VEC3, EMPTY_VEC3, EMPTY_MATERIAL, EMPTY_VEC3)


#define J_S_C vec3(0, 0, 0)
#define J_E_C vec3(1, 1, 1)

#define J_GRADIENT(t) mix(mix(J_S_C, J_E_C, t), mix(J_E_C, J_S_C, t), t)

#define J_I 50.
#define J_S 1.

vec3 julia(vec2 pos, vec2 res){
    float w = res.x;
    float h = res.y;
    float re = cos(u_time/8.);
    float im = -sin(u_time/8.);
    
    float newRe = 1.5*(pos.x - w/2.0)/(0.5*w*J_S) + 0.5;
    float newIm = (pos.y - h/2.0)/(0.5*h*J_S) + 0.5;
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

vec3 getSurfaceColor(Plane p, vec3 pos){
    vec2 result = vec2(1, 1);
    result.x = dot(p.right, p.point - pos);
    result.y = dot(p.forward, p.point - pos);

    return EMPTY_VEC3;//return julia(result.xy, vec2(1, 1)*20.);
}

vec3 getSurfaceColor(Sphere s, vec3 pos){
    vec3 diff = normalize(pos - s.center);

    float longi = acos(diff.y/SPHERE_RADIUS);
    float lati = acos(diff.z/SPHERE_RADIUS);

    return julia(vec2(longi, lati), vec2(1, 1)*SPHERE_RADIUS);
}

Hit intersect(Ray r, Plane p, float et){
    float dotN = dot(r.direction, p.normal);
    if(dotN == 0.0){
        return NO_HIT;
    }
    float t = dot(p.point - r.point, p.normal) / dotN;
    if(t <= RAY_T_MIN || t >= et){
        return NO_HIT;
    }
    vec3 phit = r.direction*t + r.point;
    return Hit(true, t, phit, p.normal, p.m, getSurfaceColor(p, phit));
}

Hit intersect(Ray r, Sphere s, float et){
    Ray local = Ray(r.point, r.direction, r.t);
    local.point -= s.center;

    // Calculate quadratic coefficients
    float dl = length(local.direction);
	float a = dl*dl;
	float b = 2. * dot(local.direction, local.point);
    float ol = length(local.point);
    float sr = s.radius;
	float c = ol*ol  - sr;

    float discriminant = b*b - 4. * a * c;

	if (discriminant < 0.0)
	{
		return NO_HIT;
	}

	// Find two points of intersection, t1 close and t2 far
	float t1 = (-b - sqrt(discriminant)) / (2. * a);
	float t2 = (-b + sqrt(discriminant)) / (2. * a);
    float t = -1.0;
	// First check if close intersection is valid
	if (t1 > RAY_T_MIN && t1 < et)
	{
		t = t1;
	}
	else if (t2 > RAY_T_MIN && t2 < et)
	{
		t = t2;
	}
	else
	{
		// Neither is valid
		return NO_HIT;
	}

    vec3 phit = r.direction*t + r.point;
	return Hit(true, t, phit, normalize(phit - s.center), s.m, phit);
}

Ray eyeMakeRay(Eye e, vec2 point){
    vec3 dir = e.forward + point.x * e.w * e.right + point.y * e.h * e.up;
    return Ray(e.point, normalize(dir), RAY_T_MAX);
}

Eye createEye(vec3 point, vec3 target, vec3 upguide, float fov, float aspectRatio){
    vec3 forward = normalize(target - point);
    vec3 right = normalize(cross(forward, upguide));
    vec3 up = cross(right, forward);

    float h = tan(fov);
    float w = h * aspectRatio;

    return Eye(point, forward, right, up, h, w);
}

vec3 ptColor(Hit h, Eye e, Light l, vec3 color){
    vec3 normal = h.normal;
    vec3 surfacePos = h.point;
    vec3 surfaceColor = color;

    Material m = h.m;

    vec3 surfaceToLight  = normalize(l.point - surfacePos);
    vec3 surfaceToEye = normalize(e.point - surfacePos);

    vec3 ambient = l.ambient * surfaceColor * l.intensity;

    float dC = max(0.0, dot(normal, surfaceToLight));
    vec3 diffuse = dC * surfaceColor * l.intensity;


    float sC = 0.0;
    if(dC > 0.0){
        float cosA = max(0.0, dot(surfaceToEye, reflect(-surfaceToLight, normal)));
        sC = pow(cosA, m.shininess);
    }
    vec3 specular = sC * m.specular * l.intensity;

    float dist = length(l.point - surfacePos);
    float attn = 1.0 / (1.0 + l.attn * dist*dist);

    vec3 linear = ambient + attn*(specular + diffuse);
    vec3 gamma = pow(linear, vec3(1./2.2, 1./2.2, 1./2.2));
    return gamma;
}

void main(){
    float width = u_resolution.x;
    float height = u_resolution.y;

    float cosine = cos(u_time);
    float sine = sin(u_time);

    float cx = cosine*cosine;
    float cy = cosine*sine;
    float cz = sine;

    float poff = PLANE_OFFSET;

    Material wood = Material(vec3(1, 1, 1), 1.);
    Material glass = Material(vec3(1, 1, 1), 1.);
    // plane for the scene
    Plane p[6];
    p[0] = Plane(vec3(0.0, -poff, 0.0), vec3(0.0, 1.0, 0.0), vec3(-1.0, 0.0, 0.0), vec3(0.0, 0.0, 1.0), wood);
    p[1] = Plane(vec3(0.0, poff, 0.0), vec3(0.0, -1.0, 0.0), vec3(1.0, 0.0, 0.0), vec3(0.0, 0.0, -1.0), wood);
    p[2] = Plane(vec3(poff, 0.0, 0.0), vec3(-1.0, 0.0, 0.0), vec3(0.0, -1.0, 0.0), vec3(0.0, 0.0, 1.0), wood);
    p[3] = Plane(vec3(-poff, 0.0, 0.0), vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), vec3(0.0, 0.0, -1.0), wood);
    p[4] = Plane(vec3(0.0, 0.0, poff), vec3(0.0, 0.0, -1.0), vec3(1.0, 0.0, 0.0), vec3(0.0, 0.0, -1.0), wood);
    p[5] = Plane(vec3(0.0, 0.0, -poff), vec3(0.0, 0.0, 1.0), vec3(-1.0, 0.0, 0.0), vec3(0.0, 0.0, 1.0), wood);

    float sphere_radius = SPHERE_RADIUS;
    float sphere_offset = SPHERE_RADIUS;
    Sphere s[4];
    s[0] = Sphere(vec3(cx, cz, cy)*sphere_offset, sphere_radius, glass);

    s[1] = Sphere(vec3(-cx, -cz, -cy)*sphere_offset*1.5, sphere_radius, glass);

    s[2] = Sphere(vec3(cx, cy, cz)*sphere_offset*2.0, sphere_radius, glass);

    s[3] = Sphere(vec3(-cx, -cy, -cz)*sphere_offset*2.5, sphere_radius, glass);

    vec2 halfres = u_resolution*0.5;
    vec2 ms = normalize(u_mouse - halfres);
    
    vec3 eye_pos = vec3(-CAMERA_OFFSET, -CAMERA_OFFSET*ms.y, -CAMERA_OFFSET*ms.x);
    vec3 target = vec3(0, 0, 0); // 
    vec3 upguide = vec3(0.0, 0.0, 1.0);
    float fov = CAMERA_FOV * DEG2RAD;
    float aspectRatio = width / height;
    Eye e = createEye(eye_pos, target, upguide, fov, aspectRatio);

    Light l[4];

    float light_offset = 15.0;
    
    l[0] = Light(
        vec3(cx, cz, cy)*light_offset,
        vec3(0, 1, 1),
        0.05,
        0.2
    );
    l[1] = Light(
        vec3(-cx, -cz, -cy)*light_offset,
        vec3(1, 1, 0),
        0.05,
        0.2
    );
    l[2] = Light(
        vec3(-cx, -cy, -cz)*light_offset,
        vec3(0, 1, 1),
        0.05,
        0.2
    );
    l[3] = Light(
        vec3(-cx, -cy, -cz)*light_offset,
        vec3(1, 1, 1),
        0.05,
        0.2
    );

    float x = gl_FragCoord.x;
    float y = gl_FragCoord.y;
    float scx = 2.0*x / width - 1.0;
    float scy = -2.0*y / height + 1.0;

    float t = RAY_T_MAX;
    Ray ray = eyeMakeRay(e, vec2(scx, scy));

    vec3 final = vec3(0, 0, 0);
    
    float ref = 1.0;
    for(int i = 0; i < 4; i++){
        Hit closest;
        for(int j = 0; j < SPHERES; j++){
            Hit h = intersect(ray, s[j], t);
            if(h.hit){
                t = h.t;
                closest = h;
            }
        }
        for(int j = 0; j < PLANES; j++){
            Hit h = intersect(ray, p[j], t);
            if(h.hit){
                t = h.t;
                closest = h;
            }
        }
        if(RAY_T_MAX >= t){
            vec3 mixture = vec3(0, 0, 0);
            for(int j = 0; j < LIGHTS; j++){
                mixture += ptColor(closest, e, l[j], closest.color)*(1./LIGHTSF);
            }
            final += mixture * ref;
            ref *= 0.5;
            ray = Ray(closest.point, reflect(ray.direction, closest.normal), t);
        }
        t = RAY_T_MAX;
    }

    gl_FragColor = vec4(final, 1);

}