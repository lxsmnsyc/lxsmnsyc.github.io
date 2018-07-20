/**
 * Clamping function
 */
let clamp = (a, b, c) => Math.min(Math.max(a, b), c);
/**
 * Calculate whether x is within min and max
 */
let inRange = (min, x, max) => clamp(min, x, max) === x;

/**
 * Checks if point is inside bounds
 */
let hasPoint = (px, py, ax, ay, bx, by) => inRange(ax, px, bx) && inRange(ay, py, by);

/**
 * Checks if two boundaries intersects
 */
let intersects = (ax, ay, bx, by, cx, cy, dx, dy) => {
    return hasPoint(cx, cy, ax, ay, bx, by) ||
    hasPoint(cx, dy, ax, ay, bx, by) ||
    hasPoint(dx, cy, ax, ay, bx, by) ||
    hasPoint(dx, dy, ax, ay, bx, by);
};

/**
 * Checks if point is within radius
 */
let inRadius = (ax, ay, bx, by, r) => (bx - ax)*(bx - ax) + (by - ay)*(by - ay) <= r*r;

/**
 * The default amount of points a Q43 instance can store 
 * if there is no capacity value passed when using the Q43 constructor
 */
export const Q43_CAP = 4;


export class Q43{
    /**
     * Create a Q43 instance
     * @param {Number} ax - minimum X of the Q43 boundary
     * @param {Number} ay - minimum Y of the Q43 boundary
     * @param {Number} bx - maximum X of the Q43 boundary
     * @param {Number} by - maximum Y of the Q43 boundary
     * @param {Number} cap - The amount of points a Q43 instance can store.
     * @returns {Q43}
     */
    constructor(ax, ay, bx, by, cap = Q43_CAP){
        this.minX = ax;
        this.minY = ay;
        this.maxX = bx;
        this.maxY = by;

        this.capacity = cap;
        this.points = [];

        this.subdivided = false;
    }

    /**
     * Check if x is within the Q43's x-axis
     * @param {Number} px 
     * @returns {Boolean}
     */
    containsX(px){
        return inRange(this.minX, px, this.maxX);
    }

    /**
     * Check if y is within the Q43's x-axis
     * @param {Number} py 
     * @returns {Boolean}
     */
    containsY(py){
        return inRange(this.minY, py, this.maxY);
    }

    
    /**
     * Check if point is within the Q43's x-axis
     * @param {Number} px 
     * @param {Number} py 
     * @returns {Boolean}
     */
    containsPoint(px, py){
        return hasPoint(px, py, this.minX, this.minY, this.maxX, this.maxY);
    }

    /**
     * Subdivide the Q43 into four equal parts.
     */
    subdivide(){
        /**
         * Check if the Q43 instance
         * has subdivided before
         */
        if(!this.subdivided){
            /**
             * Prevent from subdividing again
             */
            this.subdivided = true;

            /**
             * Calculate the midpoint of a the quadtree
             */
            let ax = this.minX, ay = this.minY, bx = this.maxX, by = this.maxY;
            let cx = ax + (bx - ax)*0.5, cy = ay + (by - ay)*0.5;

            /**
             * Create child Q43s from the equally divided boundaries
             */
            this.SW = new Q43(ax, ay, cx, cy, this.capacity);
            this.SE = new Q43(cx, ay, bx, cy, this.capacity);
            this.NW = new Q43(ax, cy, cx, by, this.capacity);
            this.NE = new Q43(cx, cy, bx, by, this.capacity);
        }
    }

    /**
     * Insert a point to the Q43
     * @param {Array} pt 
     * @returns {Boolean}
     */
    insert(pt){
        if(typeof pt !== "undefined"){
            /**
             * Check if the coordinates are within the boundaries of the Q43
             */
            if(this.containsPoint(pt[0], pt[1])){
                /**
                 * Check if there is still space available
                 * for the Q43 to store points
                 */
                if(this.points.length < this.capacity){
                    /**
                     * store the points
                     */
                    this.points.push(pt);
                    return true;
                }
                /**
                 * Because the Q43 has hit the limit,
                 * we need to subdivide the Q43
                 */
                this.subdivide();
                /**
                 * Insert the point to all child (only one will be succesful)
                 */
                if(this.SW.insert(pt)) {return true;}
                if(this.SE.insert(pt)) {return true;}
                if(this.NW.insert(pt)) {return true;}
                if(this.NE.insert(pt)) {return true;}
            }
        }
        return undefined;
    }

    /**
     * Remove a point from the Q43
     * @param {Array} pt 
     * @returns {Boolean}
     */
    remove(pt){
        if(typeof pt !== "undefined"){
            /**
             * Iterate all points from this instance
             */
            for(let i = 0; i < this.points.length; i++){
                /**
                 * Compare point reference
                 */
                if(this.points[i] === pt){
                    /**
                     * Remove the point from the array
                     */
                    this.points.splice(i, 1);
                    return true;
                }
            }
            /**
             * If the Q43 has subdivided, try removing from the child nodes.
             */
            if(this.subdivided){
                if(this.SW.remove(pt)){return true;} 
                if(this.SE.remove(pt)){return true;} 
                if(this.NW.remove(pt)){return true;} 
                if(this.NE.remove(pt)){return true;} 
            } 
        }
        return false;
    }

    /**
     * Get all points from the Q43 given a condition
     * @param {Function} cond - the filter function
     * @returns {Array} - array of points
     */
    query(cond){
        if(typeof cond === "function"){
            let pt = [];
            /**
             * Iterate all points from this node
             */
            for(let i = 0; i < this.points.length; i++){
                let p = this.points[i];
                /**
                 * Pass the point to the handler
                 */
                if(cond(p)){
                    /**
                     * if it passes the custom condition,
                     * add to the array of points
                     */
                    pt.push(p);
                }
            }
            /**
             * Iterate to the children Q43s
             */
            if(this.subdivided){
                pt = pt.concat(this.SW.query(cond));
                pt = pt.concat(this.SE.query(cond));
                pt = pt.concat(this.NW.query(cond));
                pt = pt.concat(this.NE.query(cond));
            }
        }
        return pt;
    }

    /**
     * Get all points from the Q43
     * @returns {Array} - array of points
     */
    all(){
        let pt = [];
        /**
         * Push all points of this Q43
         */
        for(let i = 0; i < this.points.length; i++){
            pt.push(this.points[i]);
        }
        /**
         * Push all points from the children Q43s
         */
        if(this.subdivided){
            pt = pt.concat(this.SW.all());
            pt = pt.concat(this.SE.all());
            pt = pt.concat(this.NW.all());
            pt = pt.concat(this.NE.all());
        }
        return pt;
    }

    /**
     * Get all points from a Q43 that is within a given boundary and passes the condition
     * @param {Number} ax - minimum x of the given boundary
     * @param {Number} ay - minimum y of the given boundary 
     * @param {Number} bx - maximum x of the given boundary
     * @param {Number} by - maximum y of the given boundary
     * @param {Function} cond - a filter function, optional
     * @returns {Array} - array of points
     */
    queryBounds(ax, ay, bx, by, cond){
        if(typeof ax === "number" && typeof ay === "number" && typeof bx === "number" && typeof by === "number"){
            let c = typeof cond === "function";
            let pt = [];
            /**
             * Check if boundaries are within or intersecting the Q43
             */
            if(intersects(this.minX, this.minY, this.maxX, this.maxY, ax, ay, bx, by)){
                /**
                 * Iterate all points from this Q43
                 */
                for(let i = 0; i < this.points.length; i++){
                    let p = this.points[i]; 
                    let b = true;
                    /**
                     * if ever the user didn't pass a filter,
                     * just let this other compared value to true
                     */
                    if(c){
                        /**
                         * Pass the point for filter
                         */
                        b = cond(p);
                    }
                    if(containsPoint(p[0], p[1], ax, ay, bx, by) && b){
                        /**
                         * Push point if it is within bounds and passes the filter
                         */
                        pt.push(p);
                    }
                }
                /**
                 * Iterate all points from the children Q43s
                 */
                if(this.subdivided){
                    pt = pt.concat(this.SW.queryBounds(ax, ay, bx, by, cond));
                    pt = pt.concat(this.SE.queryBounds(ax, ay, bx, by, cond));
                    pt = pt.concat(this.NW.queryBounds(ax, ay, bx, by, cond));
                    pt = pt.concat(this.NE.queryBounds(ax, ay, bx, by, cond));
                }
            }
            return pt;
        }
        return [];
    }

    /**
     * Gets all points within the radius of another point from the Q43
     * @param {Number} px
     * @param {Number} py 
     * @param {Number} radius 
     * @param {Function} cond - filter function, optional
     * @returns {Array}
     */
    queryRange(px, py, radius, cond){
        if(typeof px === "number" && typeof py === "number" && typeof radius === "number"){
            let c = typeof cond === "function";
            let pt = [];
            /**
             * Calculate the Axis-align bounding box of the radius
             * This is so that it can still get the points even if the source point
             * of the radius is outside the boundaries as long as it intersects the
             * Q43's boundary
             */
            let ax = px - radius, ay = py - radius, bx = px + radius, by = py + radius;
            if(intersects(this.minX, this.minY, this.maxX, this.maxY, ax, ay, bx, by)){
                for(let i = 0; i < this.points.length; i++){
                    let p = this.points[i]; 
                    let b = true;
                    if(c){
                        b = cond(p);
                    }
                    if(inRadius(p[0], p[1], px, py, radius) && b){
                        pt.push(p);
                    }
                }
                if(this.subdivided){
                    pt = pt.concat(this.SW.queryRange(px, py, radius, cond));
                    pt = pt.concat(this.SE.queryRange(px, py, radius, cond));
                    pt = pt.concat(this.NW.queryRange(px, py, radius, cond));
                    pt = pt.concat(this.NE.queryRange(px, py, radius, cond));
                }
            }
            return pt;
        }
        return [];
    }

    /**
     * Iterates all points in the Q43 and passes them to a handler function
     * @param {Function} handler 
     */
    for(handler){
        if(typeof handler === "function"){
            /**
             * Pass all points of this Q43 to the handler
             */
            for(let i = 0; i < this.points.length; i++){
                let p = this.points[i];
                handler(p);
            }
            /**
             * Pass all points of the children Q43s to the handler
             */
            if(this.subdivided){
                this.SW.for(handler);
                this.SE.for(handler);
                this.NW.for(handler);
                this.NE.for(handler);
            }
        }
    }

    /**
     * Iterates all points in the Q43 that are within the bounds
     * and passes them to a handler function
     * @param {Number} ax 
     * @param {Number} ay 
     * @param {Number} bx 
     * @param {Number} by 
     * @param {Function} handler 
     */
    forBounds(ax, ay, bx, by, handler){
        if(typeof ax === "number" && typeof ay === "number" && typeof bx === "number" && typeof by === "number" && typeof handler === "function"){
            if(intersects(this.minX, this.minY, this.maxX, this.maxY, ax, ay, bx, by)){
                for(let i = 0; i < this.points.length; i++){
                    let p = this.points[i]; 
                    if(containsPoint(p[0], p[1], ax, ay, bx, by)){
                        handler(p);
                    }
                }
                if(this.subdivided){
                    this.SW.forBounds(ax, ay, bx, by, handler);
                    this.SE.forBounds(ax, ay, bx, by, handler);
                    this.NW.forBounds(ax, ay, bx, by, handler);
                    this.NE.forBounds(ax, ay, bx, by, handler);
                }
            }
        }
    }

    /**
     * Iterates all points within the radius of another point in the Q43 
     * and passes them to a handler.
     * @param {Number} px 
     * @param {Number} py 
     * @param {Number} radius 
     * @param {Function} handler 
     */
    forRange(px, py, radius, handler){
        if(typeof px === "number" && typeof py === "number" && typeof radius === "number" && typeof handler === "function"){
            let ax = px - radius, ay = py - radius, bx = px + radius, by = py + radius;
            if(intersects(this.minX, this.minY, this.maxX, this.maxY, ax, ay, bx, by)){
                for(let i = 0; i < this.points.length; i++){
                    let p = this.points[i]; 
                    if(inRadius(p[0], p[1], px, py, radius)){
                        handler(p);
                    }
                }
                if(this.subdivided){
                    this.SW.forRange(px, py, radius, handler);
                    this.SE.forRange(px, py, radius, handler);
                    this.NW.forRange(px, py, radius, handler);
                    this.NE.forRange(px, py, radius, handler);
                }
            }
        }
    }

    /**
     * Creates a new Q43 with the points from another Q43.
     * This is useful for rebuilding a quadtree whose points have updated coordinates.
     * @returns {Q43}
     */
    rebuild(){
        /**
         * Create an empty copy of the Q43
         */
        let q = new Q43(this.minX, this.minY, this.maxX, this.maxY, this.capacity);
        /**
         * Start passing points from this Q43 to the copy
         */
        this.for(p => q.insert(p));
        /**
         * return the copy
         */
        return q;
    }

    /**
     * Updates the points of the Q43.
     * Unlike the rebuild method, the update method does not restore subdivided empty Q43s.
     */
    update(){
        /**
         * To update the Q43, the Q43 must remove first all of
         * the points it has then insert it again.
         * 
         * This will not restore empty subidivided Q43s
         */
        this.for(p => this.remove(p) && this.insert(p));
    }


    /**
     * Calculates the amount of points a Q43 has.
     * @returns {Number}
     */
    size(){
        let size = this.points.length;
        if(this.subdivided){
            size += this.NW.size();
            size += this.NE.size();
            size += this.SW.size();
            size += this.SE.size();
        }
        return size;
    }

    /**
     * For debugging purposes
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Boolean} tree 
     * @param {Boolean} point 
     */
    draw(ctx, tree, point){
        let mx = this.minX,
            my = this.minY;
        let dx = this.maxX - mx,
            dy = this.maxY - my;
        if(tree){
            ctx.strokeStyle = "#0ff";
            ctx.strokeRect(mx, my, dx, dy);
        }
        if(this.subdivided){
            this.NW.draw(ctx, tree, point);
            this.NE.draw(ctx, tree, point);
            this.SW.draw(ctx, tree, point);
            this.SE.draw(ctx, tree, point);
        }
        if(point){
            for(let i = 0; i < this.points.length; i++){
                ctx.strokeStyle = "#f00";
                ctx.strokeRect(this.points[i][0], this.points[i][1], 1, 1);
            }
        }
    }
}