(function (window){
	const glCanvas = document.getElementById('gl');
	
	let screenW = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
	let screenH = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
	
	glCanvas.width = screenW;
	glCanvas.height = screenH;
	
	let halfW = screenW*0.5;
	let halfH = screenH*0.5;
	
	const gl = glCanvas.getContext('webgl');
	if(!gl){
		return;
	}
	
	
	let fragSource = document.getElementById('gl-frag').text;
	let vertSource = document.getElementById('gl-vert').text;
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
		resolution:{
			w: screenW,
			h: screenH
		}
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
	
	function updateMouse(ev){
		c.mouse.x = ev.clientX;
		c.mouse.y = ev.clientY;
	}
	
	function updateReso(ev){
		c.resolution.w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
		c.resolution.h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
		
		glCanvas.width = screenW;
		glCanvas.height = screenH;
		
		c.half_res.w = c.resolution.w*0.5;
		c.half_res.h = c.resolution.h*0.5;
	
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	}
	
	let start = 0
	function updateTime(ev){
		if(!start) start = ev;
		c.delta_stamp = ev - c.stamp;
		c.stamp = ev - start;
		
		c.delta = c.delta_stamp/1000.0;
		c.time = c.stamp/1000.0;
		
		requestAnimationFrame(updateTime);
		
		
	}
	updateTime(0);
	
	glCanvas.addEventListener("mousemove", updateMouse);
	var optimizedResize = (function() {

		var callbacks = [],
			running = false;

		// fired on resize event
		function resize() {

			if (!running) {
				running = true;

				if (window.requestAnimationFrame) {
					window.requestAnimationFrame(runCallbacks);
				} else {
					setTimeout(runCallbacks, 66);
				}
			}

		}

		// run the actual callbacks
		function runCallbacks() {

			callbacks.forEach(function(callback) {
				callback();
			});

			running = false;
		}

		// adds callback to loop
		function addCallback(callback) {

			if (callback) {
				callbacks.push(callback);
			}

		}

		return {
			// public method to add additional callback
			add: function(callback) {
				if (!callbacks.length) {
					window.addEventListener('resize', resize);
				}
				addCallback(callback);
			}
		}
	}());

	// start process
	optimizedResize.add(updateReso);
	
	function update(){ render(); requestAnimationFrame(update); }
	update();
	
})(window);