import {sleep, FRAME} from "../util/sleep.js";

let frames = FRAME;

/**
 * This allows you to customized frame rates
 * @param {Number} v 
 */
function setFrames(v){
    frames = v;
}

/**
 * Fires listener if task has not yet been killed
 */
async function listen(a, b, arr, l, task){
    if(!task.killed()){
        l(a, b, arr);
        await sleep(frames);
    }
}

async function CS(a, lo, hi, c, l, task, comparison, accesses, swaps){
    let min = Math.min(...a);
    let max = Math.max(...a);
    let count = [];

    for(let i = min; i <= max; i++){
        count[i] = 0;
    }

    for(let i = lo; i <= hi; i++){
        count[a[i]]++;
        accesses.inc(1);
    }

    let z = (c(0, 1) < 0) ? lo : hi;
    for(let i = min; i <= max; i++){
        for(;count[i] > 0; count[i]--){
            a[z] = i;
            accesses.inc(1);
            swaps.inc(1);
            await listen(z, i, a, l, task);
            z -= c(0, 1);
        }
    }
}

export{
    CS,
    setFrames
};