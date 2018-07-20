
let ARRAY_TYPE = typeof Float32Array !== undefined ? Float32Array : Array;
let isScalar = n => typeof n === "number";
let isArray = a => (!!a) && (a.constructor === Array);

/**
 * Creates a new vector
 * @param {Number} x 
 * @param {Number} y
 * @returns {vec2} 
 */
//const create = (x, y) => isScalar(x) && isScalar(y) ? new ARRAY_TYPE([x, y]) : undefined; 
const create = (x, y) => [x, y];

/**
 * Returns a zero vector
 * @returns {vec2} 
 */
const zero = ()=> create(0, 0);

/**
 * Clones a vector
 * @param {vec2} a 
 * @returns {vec2} 
 */
const clone = a => isArray(a) ? create(a[0], a[1]) : zero();

/**
 * Converts polar coordinates to vector
 * @param {Number} r - radius (or length)
 * @param {Number} a - angles in radians 
 * @returns {vec2} 
 */
const fromPolar = (r, a) => isScalar(a) && isScalar(r) ? create(r*Math.cos(a), r*Math.sin(a)) : zero();

/**
 * Converts an angle (radians) to a unit vector
 * @param {number} a - angle in radians 
 * @returns {vec2} 
 */
const fromAngle = (a) => fromPolar(1, a);

/**
 * Generates a random unit vector
 * @returns {vec2} 
 */
const random = () => fromAngle(-Math.PI + Math.random()*Math.PI*2);

/**
 * Checks if a vector is a zero vector
 * @param {vec2} a 
 * @returns {Boolean} 
 */
const isZero = a => isArray(a) ? a[0] === 0 && a[1] === 0 : false;

/**
 * Calculates the squared length of a vector
 * @param {vec2} a 
 * @returns {number} 
 */
const length2 = a => !isZero(a) ? (a[0]*a[0] + a[1]*a[1]) : 0;

/**
 * Calculates the length of a vector
 * @param {vec2} a 
 * @returns {number} 
 */
const length = a => !isZero(a) ? Math.sqrt(length2(a)) : 0;

/**
 * Calculates the angle (radians) of a vector
 * @param {vec2} a 
 * @returns {number} 
 */
const angle = a => !isZero(a) ? Math.atan2(a[1], a[0]) : undefined;

/**
 * Sets the length of a vector
 * @param {vec2} a 
 * @param {(vec2 | number)} b - if a vector is passed, the length of the vector is applied. 
 */
const setLength = (a, b) => {
    if(isArray(a)){
        if(!isZero(a)){
            let len = (isArray(b) ? length(b) : isScalar(b) ? b : 0) / length(a);
            a[0] *= len;
            a[1] *= len;
        }
        return a;
    }
};

/**
 * Sets the length of a vector into 1 (unit vector).
 * @param {vec2} a 
 */
const normalize = a => setLength(a, 1);

/**
 * Scales a vector's length
 * @param {vec2} a 
 */
const scale = a => setLength(a, length(a));

/**
 * Gets the unit vector from a vector
 * @param {vec2} a
 * @returns {vec2} 
 */
const unit = a => normalize(clone(a));

/**
 * Rotates a vector to a given angle(radians) or another vector's angle.
 * @param {vec2} a 
 * @param {(vec2 | number)} b 
 */
const rotate = (a, b) =>{
    if(isArray(a)){
        if(isArray(b)){
            let n = unit(b);
            let len = length(a);
            a[0] = len*n[0];
            a[1] = len*n[1];
        }
        else if(isScalar(b)){
            let len = length(a);
            a[0] = len*Math.cos(b);
            a[1] = len*Math.sin(b);
        }
        return a;
    }
};


/**
 * Compares two vectors component-wise by applying a function that declares the first vector's values 
 * @param {vec2} a 
 * @param {(vec2 | number)}  b 
 * @param {Function} fn - a function that compares two values from two vectors. Must return a value.
 */
const compare = (a, b, fn) => {
    if(isArray(a)){
        if(isArray(b)){
            a[0] = fn(a[0], b[0]);
            a[1] = fn(a[1], b[1]);
        }
        else if(isScalar(b)){
            a[0] = fn(a[0], b);
            a[1] = fn(a[1], b);
        }
    }
    return a;
};

/**
 * Compares two vectors component-wise by applying a function. Returns a resultant vector.
 * @param {vec2} a 
 * @param {(vec2 | number)} b 
 * @param {Function} fn - a function that compares two values from two vectors. Must return a value.
 * @returns {vec2}
 */
const comparison = (a, b, fn) => {
    let c = zero();
    if(isArray(a)){
        if(isArray(b)){
            c[0] = fn(a[0], b[0]);
            c[1] = fn(a[1], b[1]);
        }
        else if(isScalar(b)){
            c[0] = fn(a[0], b);
            c[1] = fn(a[1], b);
        }
    }
    else if(isArray(b) && isScalar(a)){
        c[0] = fn(a, b[0]);
        c[1] = fn(a, b[1]);
    }
    return c;
};

const vAssign = (a, b) => b;

/**
 * Assigns a vector's value from another vector
 * @param {vec2} a 
 * @param {(vec2 | number)} b 
 */
const assign = (a, b) => compare(a, b, vAssign);

const vAdd = (a, b) => a + b;
const vSub = (a, b) => a - b;
const vMul = (a, b) => a * b;
const vDiv = (a, b) => a / b;

/**
 * Adds two vectors
 * @param {vec2} a 
 * @param {vec2 | number} b 
 */
const add = (a, b) => compare(a, b, vAdd);

/**
 * Subtracts two vectors
 * @param {vec2} a 
 * @param {vec2 | number} b 
 */
const sub = (a, b) => compare(a, b, vSub);

/**
 * Multiplies two vectors
 * @param {vec2} a 
 * @param {vec2 | number} b - can be a vector or a scalar.
 */
const mul = (a, b) => compare(a, b, vMul);

/**
 * Divides two vectors
 * @param {vec2} a 
 * @param {vec2 | number} b - can be a vector or a scalar.
 */
const div = (a, b) => compare(a, b, vDiv);

/**
 * Produces sum of two vectors
 * @param {vec2} a 
 * @param {vec2 | number} b - can be a vector or a scalar. 
 * @returns {vec2}
 */
const sum = (a, b) => comparison(a, b, vAdd);

/**
 * Produces difference of two vectors
 * @param {vec2} a 
 * @param {vec2 | number} b  - can be a vector or a scalar.
 * @returns {vec2}
 */
const diff = (a, b) => comparison(a, b, vSub);

/**
 * Produces product of two vectors
 * @param {vec2} a 
 * @param {vec2 | number} b - can be a vector or a scalar.
 * @returns {vec2}
 */
const prod = (a, b) => comparison(a, b, vMul);

/**
 * Produces quotient of two vectors
 * @param {vec2} a 
 * @param {vec2 | number} b 
 * @returns {vec2}
 */
const quot = (a, b) => comparison(a, b, vDiv);

/**
 * Negates a vector
 * @param {vec2} a 
 */
const negate = (a) => {
    if(isArray(a)){
        a[0] = -a[0];
        a[1] = -a[1];
    }
    return a;
};

/**
 * Calculates dot product of two vectors
 * @param {vec2} a 
 * @param {vec2} b
 * @returns {Number}
 */
const dot = (a, b) => isArray(a) && isArray(b) ? a[0]*b[0] + a[1]*b[1] : 0;

/**
 * Applies Math.min component-wise
 * @param {vec2} a 
 * @param {(vec2|Number)} b 
 * @returns {vec2}
 */
const min = (a, b) => comparison(a, b, Math.min);

/**
 * Applies Math.max component-wise
 * @param {vec2} a 
 * @param {(vec2|Number)} b  
 * @returns {vec2}
 */
const max = (a, b) => comparison(a, b, Math.max);

/**
 * Clamps value component-wise between 3 vectors
 * @param {vec2} a 
 * @param {(vec2|Number)} b 
 * @param {(vec2|Number)} c  
 * @returns {vec2}
 */
const clamp = (a, b, c) => min(max(a, b), c);

/**
 * Applies linear interpolation component-wise
 * @param {vec2} a 
 * @param {(vec2|Number)} b 
 * @param {(vec2|Number)} t  
 * @returns {vec2}
 */
const mix = (a, b, t) => sum(a, mul(diff(b, a), t));

/**
 * Calculates the vector projection
 * @param {vec2} a 
 * @param {vec2} b  
 * @returns {vec2}
 */
const projection = (a, b) => mul(unit(b), dot(a, unit(b)));

/**
 * Calculates the vector rejection
 * @param {vec2} a 
 * @param {vec2} b 
 * @returns {vec2}
 */
const rejection = (a, b) => diff(a, projection(a, b));

/**
 * Calculates the angle (in radians) between two vectors
 * @param {vec2} a 
 * @param {vec2} b  
 * @returns {Number}
 */
const angleBetween = (a, b) => isArray(a) && isArray(b) ? Math.atan2(b[1] - a[1], b[0] - a[0]) : undefined;

/**
 * Calculates the squared distance between two vectors
 * @param {vec2} a 
 * @param {vec2} b  
 * @returns {Number}
 */
const distance2 = (a, b) => isArray(a) && isArray(b) ? (b[0] - a[0])*(b[0] - a[0]) + (b[1] - a[1])*(b[1] - a[1]) : 0;

/**
 * Calculates the distance between two vectors
 * @param {vec2} a 
 * @param {vec2} b  
 * @returns {Number}
 */
const distance = (a, b) => Math.sqrt(distance2(a, b));

const isVector = isArray;

export {
    create,
    clone,
    zero,
    fromPolar,
    fromAngle,
    random,
    isZero,
    length,
    length2,
    angle,
    setLength,
    normalize,
    scale,
    unit,
    rotate,
    compare,
    assign,
    negate,
    add,
    sub,
    mul,
    div,
    dot,
    sum,
    diff,
    prod,
    quot,
    min,
    max,
    clamp,
    mix,
    projection,
    rejection,
    angleBetween,
    distance2,
    distance,
    isVector
};


