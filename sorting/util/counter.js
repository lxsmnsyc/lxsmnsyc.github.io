export class Counter{
    constructor(){
        this.count = 0;
    }
    inc(i = 1){
        this.count += i;
    }
}