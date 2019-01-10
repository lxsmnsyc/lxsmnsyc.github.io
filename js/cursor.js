const CURSOR = {
	x: 0,
	y: 0,
	radius: 0
};


var Cursor = (function (window){
	const MIN_RADIUS = 16;
	const MAX_RADIUS = 64;
	const DETECTION_RADIUS = 32;
	
	let targets = 0,
		targetsL = [],
		targetsX = [],
		targetsY = [],
		targetsR = [];
	
	targets = 0;
	function loadTarget(id){
		let el = document.getElementById(id);
		
		let width = el.clientWidth, height = el.clientHeight;
		
		let rect = el.getBoundingClientRect();
		
		let top = rect.top,
			left = rect.left;
			
		let hw = width*0.5,
			hh = height*0.5;
			
		
		let x = left + hw, 
			y = top + hh;
			
		targetsX[targets] = x;
		targetsY[targets] = y;
		targetsR[targets] = DETECTION_RADIUS + ((width > height) ? hh : hw);
		targets++;
		
	}
	
	function loadTargets(){
		targets = 0;
		for(let target in targetsL){
			loadTarget(target);
		}
	}

	function addTarget(id){
		targetsL.push(id);
		loadTarget(id);
	}
	
	
	window.addEventListener("resize", loadTargets);
	
	let cursor = document.getElementById('cursor');
	
	let prevX = 0, prevY = 0;
	let targetX = 0, targetY = 0;
	
	const steps = 1/16;
	
	const GROWTH_TIME = 1./8.;
	const GROWTH_STEP = 1/64;
	
	let growing = false;
	let timer = 0.0;
	
	
	let lerp = (a, b, t) => a + (b-a)*t;

	window.addEventListener("mousemove", e =>{
		targetY = e.clientY;
		targetX = e.clientX;
	});

	let listeners = [];
	function update(){
		// get coordinate differences
		let dx = targetX - prevX, dy = targetY - prevY;
		
		// update coordinates
		prevX += dx*steps;
		prevY += dy*steps;
		
		CURSOR.x = prevX;
		CURSOR.y = prevY;
		
		// set coordinates to element 
		let transform = 'translate(' + (prevX - DETECTION_RADIUS) + 'px, ' + (prevY - DETECTION_RADIUS) + 'px)';

		// check for targets 
		let found = false;
		for(let i = 0; i < targets; i++){
			let tx = targetsX[i],
				ty = targetsY[i];
			
			dx = tx - prevX;
			dy = ty - prevY;
			
			let tr = targetsR[i];
			
			if(dx*dx + dy*dy <= tr*tr){
				growing = true;
				found = true;
				break;
			}
		}
		if(!found){
			growing = false;
		}
		let MIN_SCALE = MIN_RADIUS/MAX_RADIUS;
		if(growing){
			if(timer < GROWTH_TIME){
				let t = timer/GROWTH_TIME;
				let rad = MIN_SCALE + lerp(0, 1, t*t*t)*(1. - MIN_SCALE);

				CURSOR.radius = rad*MAX_RADIUS;

				transform += 'scale(' + rad + ')';
				
				timer += GROWTH_STEP;
			}
		} else {
			if(timer > 0.0){
				let t = timer/GROWTH_TIME;
				let rad = MIN_SCALE + lerp(0, 1, t*t*t)*(1. - MIN_SCALE);

				CURSOR.radius = rad*MAX_RADIUS;

				transform += 'scale(' + rad + ')';
				
				timer -= GROWTH_STEP;
			} else {
				CURSOR.radius = MIN_RADIUS;
				transform += 'scale(' + MIN_SCALE + ')';
			}
		}

		cursor.style.webkitTransform = transform;
		cursor.style.mozTransform = transform;
		cursor.style.msTransform = transform;
		cursor.style.oTransform = transform;
		cursor.style.transform = transform;

		for(let listener of listeners){
			listener(prevX, prevY);
		}

		requestAnimationFrame(update);
	}

	update();

	function addEventListener(fn){
		listeners.push(fn);
	}

	function removeEventListener(fn){
		listeners.filter(e => e != fn);
	}

	return {
		addEventListener: addEventListener,
		removeEventListener: removeEventListener,
		addTarget: addTarget
	};
})(window);

(_ => {
	Cursor.addTarget("nav-logo");
	Cursor.addTarget("nav-works");
	Cursor.addTarget("nav-about");
	Cursor.addTarget("nav-menu");
	Cursor.addTarget("nav-contacts");
})();