#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif
precision mediump int;

uniform float time;
uniform float delta;
uniform int stamp;
uniform int delta_stamp;
uniform vec2 mouse;
uniform vec2 resolution;
uniform vec2 half_res;
uniform int mouse_hold;

#define PI 3.14159265358979

#define PLANE_WIDTH 1024.
#define PLANE_HEIGHT 1024.
#define PLANE_X 512.
#define PLANE_Y 512.
#define PLANE_Z 0.

#define PLANE_ROLL 0.
#define PLANE_PITCH 0.
#define PLANE_YAW 0.

#define SPHERE_RADIUS 256.
#define SPHERE_X 512.
#define SPHERE_Y 512.
#define SPHERE_Z 512.

#define CAMERA_FOV_MIN 32.
#define CAMERA_FOV_MAX 256.
#define CAMERA_FOV_F 1024.
#define CAMERA_FOV_N 32.

#define CAMERA_X 512.
#define CAMERA_Y 1024.
#define CAMERA_Z 512.

#define CAMERA_ROLL 1.
#define CAMERA_PITCH 0.
#define CAMERA_YAW 0.

#define RIPPLE_FACTOR 24.
#define RIPPLE_SPEED 1.


float quadratic(float a, float b, float c, float t){
    return mix(mix(a, b, t), mix(b, c, t), t);
}
// get intersection point from sphere
vec3 gipfs(vec3 C, float R, vec3 O, vec3 D){
    vec3 pt = vec3(0., 0., 0.);
    vec3 L = O - C;
    float tca = dot(L, D);
    if(tca < 0. ){
        return pt;
    } 
    float d = sqrt(dot(L, L) - tca*tca);
    if(d < 0. ){
        return pt;
    }
    float thc = sqrt(R*R - d*d);
    float t0 = tca - thc;
    float t1 = tca + thc;

    if(t0 > t1){
        float tmp = t0;
        t0 = t1;
        t1 = t0;
    }

    if(t0 < 0.){
        t0 = t1;
        if(t0 < 0.) return pt;
    }

    pt = O + normalize(D) * t0;

    return pt;
}   

// get surface normal from sphere interection point
vec3 gnfip(vec3 C, float R, vec3 O, vec3 D){
    return normalize(gipfs(C, R, O, D) - C);
}

// get intersection point from plane 
vec3 gipfp(vec3 N, vec3 P, vec3 O, vec3 D){
    float denom = dot(N, normalize(D));
    if(denom > 1e-6){
        vec3 po = P - O;
        float t = dot(po, N) / denom;
        if(t >= 0.){
            return O + D*t;
        }
    }
    return vec3(0., 0., 0.);
}


vec3 apply_rotation(vec3 direction, float r, float p, float y){
    // transform back the 3d coords to relative space
    mat3 roll = mat3(
        1., 0., 0.,
        0., cos(r), -sin(r),
        0., cos(r), sin(r)
    );
    mat3 pitch = mat3(
        cos(p), 0., -sin(p),
        0., 1., 0.,
        sin(p), 0., cos(p)
    );
    mat3 yaw = mat3(
        cos(y), -sin(y), 0.,
        sin(y), cos(y), 0.,
        0., 0., 1
    );  

    return yaw*pitch*roll*direction;

}

// get projected pixel point
vec3 gppp(vec2 coord){
    vec3 camera_normal = apply_rotation(vec3(0., 0., 1.));

    //get near plane
    vec3 near_plane = camera_normal*CAMERA_FOV_N;

    //get normalized resolution coords
    vec2 norm = coord/resolution;

    //convert to plane coords
    vec3 plane_coords = vec3(mix(-CAMERA_FOV_MAX, CAMERA_FOV_MAX, norm.x), 0., mix(-CAMERA_FOV_MIN, CAMERA_FOV_MIN, norm.y));

    return camera_n + screen_point;
}

vec3 render_plane(vec3 coords){
    vec3 plane = vec3(PLANE_X, PLANE_Y, PLANE_Z);

    vec3 diff = coords - plane;

    float len = length(diff / RIPPLE_FACTOR);
    float t = fract(time);
    float offset = quadratic(0.0, 1.0, 0.0, t);
    float grade = sin(len - time / RIPPLE_SPEED);

    float c = grade;

    return vec3(c, c, c);
}


// main
void main(){
    vec2 pos = vec2(gl_FragCoord);

    vec3 camera = vec3(CAMERA_X, CAMERA_Y, CAMERA_Z);

    vec3 cam = gppp(pos) * CAMERA_FOV_F.;

    vec3 sphere = vec3(SPHERE_X, SPHERE_Y, SPHERE_Z);

    vec3 ip = gipfs(sphere, SPHERE_RADIUS, camera, cam);

    if(notEqual(ip, vec3(0, 0, 0))){
        vec3 norm = gnfip(sphere, SPHERE_RADIUS, camera, cam);

        vec3 reflected = reflect(cam, norm);

        cam = reflected;
    }
    vec3 plane_norm = vec3(PLANE_ROLL, PLANE_PITCH, PLANE_YAW);
    vec3 plane = vec3(PLANE_X, PLANE_Y, PLANE_Z);

    vec3 pip = gipfp(plane_norm, plane, camera, cam);

    if(notEqual(pip, vec3(0, 0, 0))){
        vec3 color = render_plane(pip);
        gl_FragColor = vec4(color, 1.0);
    }

    gl_FragColor = vec4(0, 0, 0, 1.0);


}