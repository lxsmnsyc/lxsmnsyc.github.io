

const HoverInterpolator = (function (window){
	const increments = 1./64.;
	const detectionRadius = 32;
	
	return (element, startWord, endWord, duration, mode) => {
		let timer = 0.0;
		let reversed = false;
		let update = e => {
			if(reversed){
				if(timer > 0.0){
					timer -= increments;
					requestAnimationFrame(update);
				}
			} else {
				if(timer < duration){
					timer += increments;
					requestAnimationFrame(update);
				}
			}
			element.innerHTML = string_lerp(startWord, endWord, timer/duration, mode);

		};
		window.addEventListener("mousemove", e =>{
			let y = e.clientY,
				x = e.clientX;
				
			
			let width = element.clientWidth, height = element.clientHeight;
			
			let rect = element.getBoundingClientRect();
			
			let top = rect.top,
				left = rect.left;
			
			let hw = width*0.5,
				hh = height*0.5;
				
			
		
			let ex = left + hw, 
				ey = top + hh;
			
			let dx = x - ex, dy = y - ey;
			
			if(dx*dx + dy*dy <= detectionRadius*detectionRadius){
				if(reversed){
					reversed = false;
					update();
				}
			} else if(!reversed){
				reversed = true;
				update();
			}
		});
	}
})(window);


(_ => {
	const DURATION = 0.5;
	const LERP_MODE = 2;
	
	let works = document.getElementById("nav-works");
	let about = document.getElementById("nav-about");
	let menu = document.getElementById("nav-menu");
	let contacts = document.getElementById("nav-contacts");
	
	HoverInterpolator(works, "works", "WORKS", DURATION, LERP_MODE);
	HoverInterpolator(about, "about", "ABOUT", DURATION, LERP_MODE);
	HoverInterpolator(menu, "menu", "MENU", DURATION, LERP_MODE);
	HoverInterpolator(contacts, "contacts", "CONTACTS", DURATION, LERP_MODE);
})();