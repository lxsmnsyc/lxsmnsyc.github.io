

const HoverInterpolator = (function (window){
	const increments = 1./64.;
	const detectionRadius = 32;
	
	class Interpolator{
		constructor(element, startWord, endWord, duration, mode){
			this.sw = startWord;
			this.ew = endWord;

			this.timer = 0.0;
			this.duration = duration;

			this.reversed = false;

			this.el = element;


			this.mode = mode;

			let update = e => {
				if(this.reversed){
					if(this.timer > 0.0){
						this.timer -= increments;
						requestAnimationFrame(update);
					}
				} else {
					if(this.timer < this.duration){
						this.timer += increments;
						requestAnimationFrame(update);
					}
				}
				this.el.innerHTML = string_lerp(this.sw, this.ew, this.timer/this.duration, this.mode);

			};

			/*
			element.addEventListener("mouseenter", e => {
				this.reversed = false;

				update();
			});
			element.addEventListener("mouseleave", e => {
				this.reversed = true;

				update();
			});
			*/
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
					if(this.reversed){
					this.reversed = false;
						update();
					}
				} else if(!this.reversed){
					this.reversed = true;
					update();
				}
			});
		}
	}
	
	return Interpolator
})(window);

const DURATION = 0.5;
const LERP_MODE = 2;

let works = document.getElementById("nav-works");
let about = document.getElementById("nav-about");
let menu = document.getElementById("nav-menu");
let contacts = document.getElementById("nav-contacts");

new HoverInterpolator(works, "works", "WORKS", DURATION, LERP_MODE);
new HoverInterpolator(about, "about", "ABOUT", DURATION, LERP_MODE);
new HoverInterpolator(menu, "menu", "MENU", DURATION, LERP_MODE);
new HoverInterpolator(contacts, "contacts", "CONTACTS", DURATION, LERP_MODE);