const rec = document.getElementById('receiver');
const icon = document.getElementById('icon');
var states = 0;

function toggle(){
	states = (states + 1) % 7;
	
	switch(states){
		case 0: 
			icon.classList.remove('icon-show');
			break;
		case 1:
			icon.classList.add('icon-stack');
			break;
		case 2: 
			icon.classList.remove('icon-stack');
			icon.classList.add('icon-convey');
			break;
		case 3: 
			icon.classList.remove('icon-convey');
			icon.classList.add('icon-cont');
			break;
		case 4: 
			icon.classList.remove('icon-cont');
			icon.classList.add('icon-rows');
			break;
		case 5: 
			icon.classList.remove('icon-rows');
			icon.classList.add('icon-cols');
			break;
		case 6: 
			icon.classList.remove('icon-cols');
			icon.classList.add('icon-show');
			break;
	}
}
// cubic-bezier(0.645, 0.045, 0.355, 1)
rec.addEventListener('click', toggle);