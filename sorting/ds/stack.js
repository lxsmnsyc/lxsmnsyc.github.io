import {List} from "./list.js";

export class Stack{
    constructor(index){
        this.list = new List(index);
    }

    push(index){
        this.list.pushHead(index);
        return this;
    }

    pop(){
        this.list.popHead();
        return this;
    }

    peek(){
        return this.list.head;
    }

    isEmpty(){
        return this.list.isEmpty();
    }

    swap(){
        let n = this.list.head;
        this.list.swap(n, this.list.next[n]);
        return this;
    }

    rotate(){
        this.list.rotate(true);
        return this;
    }

    every(hn){
        return this.list.every(hn);
    }

    some(hn){
        return this.list.some(hn);
    }
    
    forEach(hn){
        this.list.forEach(hn, true);
        return this;
    }

    
}