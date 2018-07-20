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

async function swapValues(arr, a, b, l, task, accesses, swaps){
    let tmp = arr[a];
    accesses.inc(1);
    await listen(a, b, arr, l, task);
    arr[a] = arr[b];
    accesses.inc(2);
    
    await listen(b, a, arr, l, task);
    arr[b] = tmp;
    accesses.inc(1);

    swaps.inc(1);
}

async function RSS(a, lo, hi, c, l, task, comparison, accesses, swaps){
    if(task.killed()) return;
    if(c(a[lo], a[hi]) > 0){
        comparison.inc(1);
        accesses.inc(2);
        await swapValues(a, lo, hi, l, task, accesses,swaps);
    }
    if(hi - lo + 1 > 2){
        let t = Math.floor((hi - lo + 1)/3);
        await RSS(a, lo, hi - t, c, l, task, comparison, accesses, swaps);
        await RSS(a, lo + t, hi, c, l, task, comparison, accesses, swaps);
        await RSS(a, lo, hi - t, c, l, task, comparison, accesses, swaps);
    }
}

async function NRSS(a, lo, hi, c, l, task, comparison, accesses, swaps){
    let istack = [];
    let jstack = [];
    istack.push(lo);
    jstack.push(hi);

    while(istack.length > 0 && jstack.length > 0){
        if(task.killed()) return;
        let i = istack.pop();
        let j = jstack.pop();

        if(c(a[i], a[j]) > 0){
            comparison.inc(1);
            accesses.inc(2);
            await swapValues(a, i, j, l, task, accesses,swaps);
        }
        if(j - i + 1 > 2){
            let t = Math.floor((j - i + 1)/3);

            istack.push(i);
            istack.push(i + t);
            istack.push(i);

            jstack.push(j - t);
            jstack.push(j);
            jstack.push(j - t);
        }
    }
}

export{
    RSS,
    NRSS,
    setFrames
};