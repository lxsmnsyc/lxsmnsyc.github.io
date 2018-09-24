(function (window){
	const glCanvas = document.getElementById('gl');
	
	const minWidth = 640;
	const minHeight = 360;
	
	const scaleScreen = 0.50;
	
	function getResolution(){
		let screenW = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
		let screenH = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
	
		/*
		if(screenW > screenH){
			screenW = (screenW > minWidth)? minWidth : screenW;
			screenH = (screenH > minHeight)? minHeight : screenH;
		} else {
			screenW = (screenW > minHeight)? minHeight : screenW;
			screenH = (screenH > minWidth)? minWidth : screenH;
		}
		*/
		
		screenW *= scaleScreen;
		screenH *= scaleScreen;
		
		return {w: screenW, h: screenH}
	}
	
	let reso = getResolution();
	
	glCanvas.width = reso.w;
	glCanvas.height = reso.h;
	
	let halfW = reso.w*0.5;
	let halfH = reso.h*0.5;
	
	const gl = glCanvas.getContext('webgl');
	if(!gl){
		return;
	}
	
	
	let fragSource = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
	precision highp float;
#else
	precision mediump float;
#endif
precision mediump int;
uniform vec2 u_resolution,u_mouse;uniform float u_time;const float PI=3.14159,CAMERA_FOV=25.,CAMERA_OFFSET=16.,RAY_T_MIN=.0001,RAY_T_MAX=1e+30;const vec3 EMPTY_VEC3=vec3(0,0,0);const int DEPTH=2,SPHERES=6,PLANES=6;const float TIME_SCALE=.25,SPHERE_RADIUS=6.,SPHERE_STEP=.25,SPHERE_RADIUS_GROWTH=1.5,SPHERE_SCALE_GROWTH=1.,SPHERE_DISP_GROWTH=1.,SPHERE_STEP_GROWTH=.25;const vec2 SPHERE_BNS=vec2(8,8),PLANE_BNS=vec2(.25,.25);const int LIGHTS=2;const float PLANE_OFFSET=8.,PLANE_STEP=.1,PLANE_OFFSET_GROWTH=1.05,PLANE_SCALE_GROWTH=1.,PLANE_STEP_GROWTH=1.5;const vec3 BRIGHTNESS=vec3(.5,.5,.5);struct Material{vec3 specular;float shininess;bool reflective;float reflectN;bool refractive;float refractN;};const Material EMPTY_MATERIAL=Material(EMPTY_VEC3,0.,false,0.,false,0.);struct Ray{vec3 point;vec3 direction;float tMax;};struct Plane{vec3 point;vec3 normal;vec3 forward,right;vec2 noiseScale;vec2 noiseDisp;float noiseStep;Material m;};struct Sphere{vec3 center;float radius;vec2 noiseScale;vec2 noiseDisp;float noiseStep;Material m;};struct Hit{bool hit;float tMax;vec3 point,normal;Material m;vec3 color;};struct Eye{vec3 point;vec3 forward;vec3 up;vec3 right;float h;float w;};struct Light{vec3 point,intensity;float ambient;float attn;};const Hit NO_HIT=Hit(false,RAY_T_MAX,EMPTY_VEC3,EMPTY_VEC3,EMPTY_MATERIAL,EMPTY_VEC3);vec3 refraction(vec3 I,vec3 N,float ior){float cosi=clamp(-1.,1.,dot(I,N)),etai=1.,etat=ior;vec3 n=N;if(cosi<0.)cosi=-cosi;else{float tmp=etai;etai=etat;etat=tmp;n=-N;}float eta=etai/etat,k=1.-eta*eta*(1.-cosi*cosi);if(k<0.)return EMPTY_VEC3;return eta*I+(eta*cosi-sqrt(k))*n;}vec3 getSurfaceColor(Plane p,vec3 pos){return vec3(0,0,0);}vec3 getSurfaceColor(Sphere s,vec3 pos){return vec3(1,1,1);}vec4 permute(vec4 x){return mod((x*34.+1.)*x,289.);}vec4 taylorInvSqrt(vec4 r){return 1.79284-.853735*r;}float snoise(vec3 v){const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);vec3 i=floor(v+dot(v,C.yyy)),x0=v-i+dot(i,C.xxx),g=step(x0.yzx,x0.xyz),l=1.-g,i1=min(g.xyz,l.zxy),i2=max(g.xyz,l.zxy),x1=x0-i1+C.xxx,x2=x0-i2+2.*C.xxx,x3=x0-1.+3.*C.xxx;i=mod(i,289.);vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));float n_=1./7.;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.*floor(p*ns.z*ns.z),x_=floor(j*ns.z),y_=floor(j-7.*x_),x=x_*ns.x+ns.yyyy,y=y_*ns.x+ns.yyyy,h=1.-abs(x)-abs(y),b0=vec4(x.xy,y.xy),b1=vec4(x.zw,y.zw),s0=floor(b0)*2.+1.,s1=floor(b1)*2.+1.,sh=-step(h,vec4(0.)),a0=b0.xzyw+s0.xzyw*sh.xxyy,a1=b1.xzyw+s1.xzyw*sh.zzww;vec3 p0=vec3(a0.xy,h.x),p1=vec3(a0.zw,h.y),p2=vec3(a1.xy,h.z),p3=vec3(a1.zw,h.w);vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}Hit intersect(Ray r,Plane p,float et){float dotN=dot(r.direction,p.normal);if(dotN==0.)return NO_HIT;float t=dot(p.point-r.point,p.normal)/dotN;if(t<=RAY_T_MIN||t>=et)return NO_HIT;vec3 phit=r.direction*t+r.point;vec2 result=phit.zy;float tmp=u_time*TIME_SCALE,noise=step(snoise(vec3(result*p.noiseScale+p.noiseDisp+vec2(tmp,tmp),tmp)),p.noiseStep);if(noise>0.)return Hit(true,t,phit,p.normal,p.m,getSurfaceColor(p,phit));return NO_HIT;}float getNoise(Sphere s,vec3 phit){vec3 diff=normalize(phit-s.center);float longi=diff.z,lati=diff.x;longi=(longi+PI)*180./PI;lati=(lati+PI)*180./PI;longi/=360.;lati/=360.;return step(snoise(vec3(vec2(longi,lati)*s.noiseScale+s.noiseDisp+vec2(u_time,u_time),u_time*TIME_SCALE)),s.noiseStep);}Hit intersect(Ray r,Sphere s,float et){Ray local=Ray(r.point,r.direction,r.tMax);local.point-=s.center;float dl=length(local.direction),a=dl*dl,b=2.*dot(local.direction,local.point),ol=length(local.point),sr=s.radius,c=ol*ol-sr,discriminant=b*b-4.*a*c;if(discriminant<0.)return NO_HIT;float t1=(-b-sqrt(discriminant))/(2.*a),t2=(-b+sqrt(discriminant))/(2.*a),t=-1.;if(t1>RAY_T_MIN&&t1<et){t=t1;vec3 phit=r.direction*t+r.point;float noise=getNoise(s,phit);if(noise>0.)return Hit(true,t,phit,normalize(phit-s.center),s.m,getSurfaceColor(s,phit));}if(t2>RAY_T_MIN&&t2<et){t=t2;vec3 phit=r.direction*t+r.point;float noise=getNoise(s,phit);if(noise>0.)return Hit(true,t,phit,normalize(phit-s.center),s.m,s.m.specular);}if(t==-1.)return NO_HIT;return NO_HIT;}Ray eyeMakeRay(Eye e,vec2 point){vec3 dir=e.forward+point.x*e.w*e.right+point.y*e.h*e.up;return Ray(e.point,normalize(dir),RAY_T_MAX);}Eye createEye(vec3 point,vec3 target,vec3 upguide,float fov,float aspectRatio){vec3 forward=normalize(target-point),right=normalize(cross(forward,upguide)),up=cross(right,forward);float h=tan(fov),w=h*aspectRatio;return Eye(point,forward,right,up,h,w);}vec3 ptColor(Hit h,Eye e,Light l,vec3 color){vec3 normal=h.normal,surfacePos=h.point,surfaceColor=color;Material m=h.m;vec3 surfaceToLight=normalize(l.point-surfacePos),surfaceToEye=normalize(e.point-surfacePos),ambient=l.ambient*surfaceColor*l.intensity;float dC=max(0.,dot(normal,surfaceToLight));vec3 diffuse=dC*surfaceColor*l.intensity;float sC=0.;if(dC>0.){float cosA=max(0.,dot(surfaceToEye,reflect(-surfaceToLight,normal)));sC=pow(cosA,m.shininess);}vec3 specular=sC*m.specular*l.intensity;float dist=length(l.point-surfacePos),attn=1./(1.+l.attn*dist*dist);vec3 linear=ambient+attn*(specular+diffuse),gamma=pow(linear,vec3(1./2.2,1./2.2,1./2.2));return gamma;}Sphere createSphere(float r,vec2 nsc,float nst,vec3 color){return Sphere(vec3(0,0,0),r,nsc,vec2(0,0),nst,Material(color,.5,true,.5,false,1.));}Plane createPlane(float poff,vec2 nsc,float nst,vec3 color){return Plane(vec3(-poff,0.,0.),vec3(1.,0.,0.),vec3(0.,0.,1.),vec3(0.,-1.,0.),nsc,vec2(0,0),nst,Material(color,.5,true,.5,false,1.));}void main(){vec2 ms=u_mouse.xy;float width=u_resolution.x,height=u_resolution.y;Material wood=Material(vec3(1,1,1),.5,true,.5,false,1.),glass=Material(vec3(1,1,1),1.,false,.5,true,1.52);Sphere s[6];float radius=SPHERE_RADIUS;vec2 scale=SPHERE_BNS;float nstep=SPHERE_STEP;s[0]=createSphere(radius,scale,nstep,vec3(.96,0,1));radius*=SPHERE_RADIUS_GROWTH;scale*=SPHERE_SCALE_GROWTH;nstep*=SPHERE_STEP_GROWTH;s[1]=createSphere(radius,scale,nstep,vec3(.85,0,1));radius*=SPHERE_RADIUS_GROWTH;scale*=SPHERE_SCALE_GROWTH;nstep*=SPHERE_STEP_GROWTH;s[2]=createSphere(radius,scale,nstep,vec3(.74,0,1));radius*=SPHERE_RADIUS_GROWTH;scale*=SPHERE_SCALE_GROWTH;nstep*=SPHERE_STEP_GROWTH;s[3]=createSphere(radius,scale,nstep,vec3(.62,0,1));radius*=SPHERE_RADIUS_GROWTH;scale*=SPHERE_SCALE_GROWTH;nstep*=SPHERE_STEP_GROWTH;s[4]=createSphere(radius,scale,nstep,vec3(.51,0,1));radius*=SPHERE_RADIUS_GROWTH;scale*=SPHERE_SCALE_GROWTH;nstep*=SPHERE_STEP_GROWTH;s[5]=createSphere(radius,scale,nstep,vec3(.4,0,1));Plane p[6];float poff=PLANE_OFFSET;scale=PLANE_BNS;nstep=PLANE_STEP;p[0]=createPlane(poff,scale,nstep,vec3(.4,0,1));poff*=PLANE_OFFSET_GROWTH;scale*=PLANE_SCALE_GROWTH;nstep*=PLANE_STEP_GROWTH;p[1]=createPlane(poff,scale,nstep,vec3(.51,0,1));poff*=PLANE_OFFSET_GROWTH;scale*=PLANE_SCALE_GROWTH;nstep*=PLANE_STEP_GROWTH;p[2]=createPlane(poff,scale,nstep,vec3(.62,0,1));poff*=PLANE_OFFSET_GROWTH;scale*=PLANE_SCALE_GROWTH;nstep*=PLANE_STEP_GROWTH;p[3]=createPlane(poff,scale,nstep,vec3(.74,0,1));poff*=PLANE_OFFSET_GROWTH;scale*=PLANE_SCALE_GROWTH;nstep*=PLANE_STEP_GROWTH;p[4]=createPlane(poff,scale,nstep,vec3(.85,0,1));poff*=PLANE_OFFSET_GROWTH;scale*=PLANE_SCALE_GROWTH;nstep*=PLANE_STEP_GROWTH;p[5]=createPlane(poff,scale,nstep,vec3(.4,0,1));Light l[4];l[0]=Light(vec3(9.5,-4.25,0),vec3(1,1,1),.05,.1);l[1]=Light(vec3(0,0,0),vec3(1,1,1),.05,.2);vec2 halfres=u_resolution.xy*.5;ms=halfres-ms;ms/=halfres;ms*=PI;vec3 eye_pos=vec3(CAMERA_OFFSET+CAMERA_OFFSET*.5*sin(ms.y*.5),CAMERA_OFFSET,CAMERA_OFFSET*.5*cos(ms.x*.5)),target=vec3(ms.y,0.,-ms.x),upguide=vec3(0.,0.,1.);float fov=CAMERA_FOV*PI/180.,aspectRatio=width/height;Eye e=createEye(eye_pos,target,upguide,fov,aspectRatio);float x=gl_FragCoord.x,y=gl_FragCoord.y,scx=2.*x/width-1.,scy=-2.*y/height+1.,t=RAY_T_MAX;Ray ray=eyeMakeRay(e,vec2(scx,scy));vec3 final=vec3(0,0,0);float ref=1.;for(int i=0;i<DEPTH;i++){Hit closest;for(int j=0;j<SPHERES;j++){Hit h=intersect(ray,s[j],t);if(h.hit)t=h.tMax,closest=h;}for(int j=0;j<PLANES;j++){Hit h=intersect(ray,p[j],t);if(h.hit)t=h.tMax,closest=h;}if(RAY_T_MAX>=t){vec3 mixture=vec3(0,0,0);for(int j=0;j<LIGHTS;j++)mixture+=ptColor(closest,e,l[j],closest.color);final+=mixture*ref;if(closest.m.reflective)ray=Ray(closest.point,reflect(ray.direction,closest.normal),RAY_T_MAX),ref*=closest.m.reflectN;else if(closest.m.refractive)ray=Ray(closest.point,refraction(ray.direction,closest.normal,closest.m.refractN),RAY_T_MAX);}t=RAY_T_MAX;}gl_FragColor=vec4(final*BRIGHTNESS,1);}

`;
	let vertSource = "attribute vec2 a_position; void main() { gl_Position = vec4(a_position, 0, 1); }";
	function loadShader(gl, type, source) {
		const shader = gl.createShader(type);

		// Send the source to the shader object

		gl.shaderSource(shader, source);

		// Compile the shader program

		gl.compileShader(shader);

		// See if it compiled successfully

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
			gl.deleteShader(shader);
			return null;
		}

		return shader;
	}
	
	function initShaderProgram(gl, vsSource, fsSource) {
		const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
		const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

		// Create the shader program

		const shaderProgram = gl.createProgram();
		gl.attachShader(shaderProgram, vertexShader);
		gl.attachShader(shaderProgram, fragmentShader);
		gl.linkProgram(shaderProgram);
	
		// If creating the shader program failed, alert

		if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
			alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
			return null;
		}

		return shaderProgram;
	}

	let program = initShaderProgram(gl, vertSource, fragSource);
	
	
	let ploc = gl.getAttribLocation(program, "a_position");
	let pbuff = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, pbuff);
	
	gl.bufferData(
		gl.ARRAY_BUFFER, 
		new Float32Array([
		  -1.0, -1.0, 
		   1.0, -1.0, 
		  -1.0,  1.0, 
		  -1.0,  1.0, 
		   1.0, -1.0, 
		   1.0,  1.0]), 
		gl.STATIC_DRAW
	);
	
	
	let u_time = gl.getUniformLocation(program, "u_time");
	let u_mouse = gl.getUniformLocation(program, "u_mouse");
	let u_resolution = gl.getUniformLocation(program, "u_resolution");
	
	let c = {
		time: 0.0,
		delta: 0.0,
		stamp: 0,
		delta_stamp: 0,
		mouse: {
			x: 0,
			y: 0
		},
		resolution: reso
	}
	
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	function render(ev){
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.useProgram(program);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, pbuff);
		gl.enableVertexAttribArray(ploc);
		gl.vertexAttribPointer(ploc, 2, gl.FLOAT, false, 0, 0);
		gl.uniform1f(u_time, c.time);
		gl.uniform2f(u_mouse, c.mouse.x, c.mouse.y);
		gl.uniform2f(u_resolution, c.resolution.w, c.resolution.h);
		var primitiveType = gl.TRIANGLES;
		var offset = 0;
		var count = 4;
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}
	
	const steps = 1/16.;
	let prevX = 0, prevY = 0;
	let targetX = 0, targetY = 0;
	
	function updateM(){
		// get coordinate differences
		let dx = targetX - prevX, dy = targetY - prevY;
		
		// update coordinates
		prevX = prevX + dx*steps;
		prevY = prevY + dy*steps;
		
		c.mouse.x = prevX;
		c.mouse.y = prevY;
		
		requestAnimationFrame(updateM);
	}
	
	updateM();
	
	function updateMouse(ev){
		targetX = ev.clientX;
		targetY = ev.clientY;
	}
	
	function updateReso(ev){
		
		let reso = getResolution();
		
		c.resolution.w = reso.w;
		c.resolution.h = reso.h;
		
		glCanvas.width = reso.w;
		glCanvas.height = reso.h;
		
	
	
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	}
	
	let start = 0;
	function updateTime(ev){
		if(!start) start = ev;
		c.delta_stamp = ev - c.stamp;
		c.stamp = ev - start;
		
		c.delta = c.delta_stamp/1000.0;
		c.time = c.stamp/1000.0;
		
		requestAnimationFrame(updateTime);
		
		
	}
	updateTime(0);
	
	window.addEventListener("mousemove", updateMouse);
	
  	window.addEventListener('resize', updateReso);

	
	function update(){ render(); requestAnimationFrame(update); }
	update();
	
})(window);