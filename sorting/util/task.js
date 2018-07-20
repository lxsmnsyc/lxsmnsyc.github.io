export class Task{
    constructor(){
        this.kill = false;
    }

    killTask(){
        this.kill = true;
    }

    killed(){
        return this.kill;
    }
}