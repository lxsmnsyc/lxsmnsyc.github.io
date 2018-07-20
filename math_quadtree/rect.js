import  * as vec2  from "./vec2.extra.js";

export class Rect{
    /**
     * 
     * @param {vec2} min 
     * @param {vec2} max 
     */
    constructor(min, max){
        this.min = vec2.clone(min);
        this.max = vec2.clone(max);
    }
    static create(minX, minY, maxX, maxY){
        return new Rect(vec2.create(minX, minY), vec2.create(maxX, maxY));
    }
    hasX(x){
        return this.min[0] <= x && x < this.max[0]; 
    }
    hasY(y){
        return this.min[1] <= y && y < this.max[1];
    }
    hasXY(x, y){
        return this.hasX(x) && this.hasY(y);
    }
    hasPoint(v){
        if(vec2.isVector(v))
            return this.hasXY(v[0], v[1]);
        return false;
    }
    boundX(x){
        if(this.min[0] > x)
            return this.min[0];
        else if(this.max[0] < x)
            return this.max[0];
        return x;
    }
    boundY(y){
        if(this.min[1] > y)
            return this.min[1];
        else if(this.max[1] < y)
            return this.max[1];
        return y;
    }
    boundPoint(v){
        v[0] = this.boundX(v[0]);
        v[1] = this.boundY(v[1]);
        return v;
    }

    intersects(other){
        return this.hasPoint(other.min) || 
               this.hasPoint(other.max) || 
               this.hasXY(other.min[0], other.max[1]) || 
               this.hasXY(other.max[0], other.min[1]);
    }

    clone(){
        return new Rect(this.min, this.max);
    }

    moveCenter(x, y){
        let minx = this.min[0],
            miny = this.min[1],
            maxx = this.max[0],
            maxy = this.max[1];
        let dx = maxx - minx, dy = maxy - miny;
        dx /= 2;
        dy /= 2;

        this.min[0] = x - dx;
        this.min[1] = y - dx;
        this.max[0] = x + dx;
        this.max[1] = y + dx;
    }

    move(pt){
        this.moveCenter(pt[0], pt[1]);
    }
}