const string_lerp = (function (){
	let lerp = (a, b, t) => a + (b - a)*t;
	let charLerp = (a, b, t) => String.fromCharCode(lerp(a.charCodeAt(0), b.charCodeAt(0), t));

	return function (str1, str2, t, mode){
		if(t >= 1){
			return str2;
		} else if(t <= 0){
			return str1;
		}
		// two modes
		// 1. char-by-char interpolation
		// 2. full string interpolation
		
		// get string lengths 
		let len1 = str1.length,
			len2 = str2.length;
				
		// pick the longer string length 
		let longer = Math.max(len1, len2);
				
		// add whitespace padding
		if(len1 < len2){
			for(let i = len2 - len1; i > 0; i--){
				str1 += " ";
			}
		}
		else if(len2 < len1){
			for(let i = len1 - len2; i > 0; i--){
				str2 += " ";
			}
		}
		if(mode == 1){
			
			
			// get the actual value of each index 
			let indexValue = 1/longer;
			
			// get the character position (nearest)
			let pos = Math.max(1, Math.floor(longer*t) + 1);
			
			// pick all characters that aren't needed for interpolation
			let result = "";
			for(let i = 0; i < pos - 1; i++){
				result += str2.charAt(i);
			}
			
			// interpolate character
			let char1 = str1.charAt(pos - 1);
			let char2 = str2.charAt(pos - 1);
			let grad = (t - pos*indexValue)/indexValue;
			let interpolated = charLerp(char1, char2, grad);
			
			result += interpolated;
			// get the strings after the pos
			for(let i = pos; i < longer; i++){
				result += str1.charAt(i);
			}
			
			return result;
		} else if(mode == 2){
			let result = ""
			for(let i = 0; i < longer; i++){
				let char1 = str1.charAt(i);
				let char2 = str2.charAt(i);
				result += charLerp(char1, char2, t);
			}
			
			return result;
		}
	}
})();