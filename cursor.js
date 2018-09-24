


(function (window){
	const MIN_RADIUS = 16;
	const MAX_RADIUS = 64;
	const DETECTION_RADIUS = 32;
	
	let targets = 0;
	let targetsX = [];
	let targetsY = [];
	let targetsR = [];
	
	function loadTargets(){
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
		
		loadTarget("logo-1");
		loadTarget("nav-works");
		loadTarget("nav-about");
		loadTarget("nav-menu");
		loadTarget("nav-contacts");
	}
	loadTargets();
	
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
	
	function update(){
		// get coordinate differences
		let dx = targetX - prevX, dy = targetY - prevY;
		
		// update coordinates
		prevX = prevX + dx*steps;
		prevY = prevY + dy*steps;
		
		// set coordinates to element 
		cursor.style.top = prevY + "px";
		cursor.style.left = prevX + "px";
		
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
		if(growing){
			if(timer < GROWTH_TIME){
				let rad = lerp(MIN_RADIUS, MAX_RADIUS, timer/GROWTH_TIME);
				cursor.style.width =  rad + "px";
				cursor.style.height = rad + "px";
				
				timer += GROWTH_STEP;
			}
		} else {
			if(timer > 0.0){
				let rad = lerp(MIN_RADIUS, MAX_RADIUS, timer/GROWTH_TIME);
				cursor.style.width =  rad + "px";
				cursor.style.height = rad + "px";
				
				timer -= GROWTH_STEP;
			}
		}
		requestAnimationFrame(update);
	}

	update();
})(window);