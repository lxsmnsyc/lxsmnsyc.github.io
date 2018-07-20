import * as vec2 from "./vec2.extra.js";
import {Q43} from "./Q43.js";

let canvas = document.getElementById("c");
let ctx = canvas.getContext("2d");

let w = canvas.width;
let h = canvas.height;

/**
 * calculate midpoint
 */
let hw = w/2;
let hh = h/2;

/**
 * Create the world
 */
let world = new Q43(0, 0, w, h, 4);

/**
 * This creates a radius boundary that follows the mouse in the canvas.
 * It logs the amount of points within its range.
 */
let m = vec2.zero();
canvas.addEventListener("mousemove", e =>{
    let rect = e.target.getBoundingClientRect();
    m[0] = e.clientX - rect.left; //x position within the element.
    m[1] = e.clientY - rect.top;  //y position within the element.

    console.log(world.queryRange(m[0], m[1], 32, ()=>true).length);
});

let showQT = false;

canvas.addEventListener("mousedown", _ => showQT = !showQT);

/**
 * This is for the Flocking algorithm
 */
const INFLUENCE = 128;
const COLLISION = 4;
const WEIGHTS = {
    center: 0.5,
    displacement: 1,
    steering: 0.5
};
const MAXIMUM_VELOCITY = 2;
const FOV = 45*Math.PI/180;
const PARTICLES = 200;

/**
 * The clockwise test 
 */
const areClockWise = (v1, v2) => -v1[0]*v2[1] + v1[1]*v2[0] > 0;

class Particle{
    constructor(){
        this.point = vec2.random();
        this.point[0] = hw + this.point[0]*hw;
        this.point[1] = hh + this.point[1]*hh;
        this.ref = [this.point[0], this.point[1], this];

        this.velocity = vec2.random();
        this.up = _=> {
            this.update();
            requestAnimationFrame(this.up);
        }

        requestAnimationFrame(this.up.bind(this));
    }

    update(){
        /**
         * Steer towards the center
         */
        let c = vec2.zero();
        /**
         * Prevents collision
         */
        let d = vec2.zero();
        
        /**
         * Average steering
         */
        let s = vec2.zero();

        let cn = 0;
        let dn = 0;

        /**
         * Calculate the FOV vectors
         */
        let start = vec2.clone(this.velocity);
        let end = vec2.clone(this.velocity);
        let a = vec2.angle(this.velocity);
        vec2.rotate(start, a - FOV);
        vec2.rotate(end, a + FOV);

        let px = this.point[0], py = this.point[1];
        /**
         * Iterate neighbors
         */
        world.forRange(px, py, INFLUENCE, e =>{
            if(e !== this.ref){
                let xy = e[2];
                let ang = vec2.diff(xy.point, this.point);
                /**
                 * Check if neighbor is within vision and influence
                 */
                if((!areClockWise(start, ang) && areClockWise(end, ang))){
                    vec2.add(c, xy.point);
                    if(vec2.length2(ang) <= COLLISION*COLLISION){
                        vec2.sub(d, vec2.diff(xy.point, this.point));
                    }
                    vec2.add(s, xy.velocity);
                    cn++;
                }
            }
        });
        if(cn > 0){
            vec2.div(c, cn);
            vec2.sub(c, this.point);
            vec2.mul(c, WEIGHTS.center);
            vec2.div(s, cn);
            vec2.sub(s, this.velocity);
            vec2.mul(s, WEIGHTS.steering);
        }
        

        vec2.mul(d, WEIGHTS.displacement);
        
        vec2.add(this.velocity, c);
        vec2.add(this.velocity, d);
        vec2.add(this.velocity, s);
        

        /**
         * Bouncing method, this steers the boids away from the boundaries.
         */
        let collision = vec2.clone(this.velocity);
        vec2.setLength(collision, COLLISION);
        let future = vec2.sum(this.point, collision);
        if(!world.containsPoint(future[0], future[1])){ 
            let future2 = vec2.clone(collision);
            if(!world.containsX(future[0])){
                future2[0] = -future2[0];
            }
            if(!world.containsY(future[1])){
                future2[1] = -future2[1];
            }
            vec2.add(this.velocity, future2);
        }
        vec2.setLength(this.velocity, MAXIMUM_VELOCITY);
        vec2.add(this.point, this.velocity); 

        /**
         * Update reference points
         */
        this.ref[0] = this.point[0];
        this.ref[1] = this.point[1];
    }
}
/**
 * Create all particles
 */
for(let i = 0; i < PARTICLES; i++){
    world.insert(new Particle().ref);
}

console.log("size: " + world.size());

let update = _ => {
    ctx.clearRect(0, 0, w, h);
    world = world.rebuild();
    world.draw(ctx, showQT, 1);
    ctx.strokeRect(m[0] - 32, m[1] - 32, 64, 64);
    requestAnimationFrame(update);
}

update();