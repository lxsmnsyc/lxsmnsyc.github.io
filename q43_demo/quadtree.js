import  * as vec2  from "./vec2.extra.js";
import {Rect} from "./rect.js";

/**
 * Declares the amount of positions that can be stored in a single QuadTree node
 */
const NODE_CAP = 16;
let looking = false;
export var COUNT = 0;
export class QuadTree{
    
    constructor(bounds){
        this.bounds = bounds.clone();
        this.points = [];

        this.subdivided = false;
    }
    subdivide(){
        if(!this.subdivided){
            let minX = this.bounds.min[0],
                minY = this.bounds.min[1],
                maxX = this.bounds.max[0],
                maxY = this.bounds.max[1],
                cx = minX + (maxX - minX)/2,
                cy = minY + (maxY - minY)/2;
                
            this.SW = new QuadTree(Rect.create(minX, minY,  cx,     cy));
            this.SE = new QuadTree(Rect.create(cx,   minY,  maxX,   cy));
            this.NW = new QuadTree(Rect.create(minX, cy,    cx,     maxY));
            this.NE = new QuadTree(Rect.create(cx,   cy,    maxX,   maxY));

            this.SE.parent = this;
            this.SW.parent = this;
            this.NW.parent = this;
            this.NE.parent = this;
            this.subdivided = true;
        }
    }
    insert(pt){
        if(this.bounds.hasPoint(pt)){
            if(this.points.length < NODE_CAP){
                this.points.push(pt);
                return true;
            }
            if(!this.subdivided){
                this.subdivide();
            }
            if(this.NW.insert(pt)) return true;
            if(this.NE.insert(pt)) return true;
            if(this.SW.insert(pt)) return true;
            if(this.SE.insert(pt)) return true;
        }
        return false;
    }
    query(bound){
        if(!looking){
            looking = true;
            COUNT = 0;
        }
        COUNT++;
        let points = [];
        if(this.bounds.intersects(bound)){
            for(let i = 0; i < this.points.length; i++){
                if(bound.hasPoint(this.points[i])) {
                    points.push(this.points[i]);
                }
            }
            if(!this.subdivided){
                return points;
            }
            points = points.concat(this.NW.query(bound))
                           .concat(this.NE.query(bound))
                           .concat(this.SW.query(bound))
                           .concat(this.SE.query(bound));
        }
        return points;
    }
    all(){
        let p = [].concat(this.points);
        if(this.subdivided){
            return p.concat(this.NW.all())
                    .concat(this.NE.all())
                    .concat(this.SW.all())
                    .concat(this.SE.all());
        }
        return p;
    }
    remove(pt){
        if(this.bounds.hasPoint(pt)){
            for(let i = 0; i < this.points.length; i++){
                if(pt === this.points[i]) 
                    points.splice(i, 1);
            }
        }
    }

    rebuild(){
        let q = new QuadTree(this.bounds);
        this.all().forEach(e => {
            q.insert(e);
        });
        return q;
    }


    draw(ctx, tree, point){
        let mx = this.bounds.min[0],
            my = this.bounds.min[1];
        let dx = this.bounds.max[0] - mx,
            dy = this.bounds.max[1] - my;
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
}