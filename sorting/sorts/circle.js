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

async function RICCS(a, lo, hi, c, l, task, comparison, accesses, swaps, s){
    if(lo == hi || task.killed()) return s;
    let high = hi,
        low = lo,
        mid = (hi + lo) >>> 1;

    while(lo < hi){
        if(task.killed()) return s;
        accesses.inc(2);
        comparison.inc(1);
        if(c(a[lo], a[hi]) > 0){

            await swapValues(a, lo, hi, l, task, accesses, swaps);
            s++;
        }
        lo++;
        hi--;
    }

    accesses.inc(2);
    comparison.inc(1);

    if(lo == hi && c(a[lo], a[hi + 1]) > 0){
        await swapValues(a, lo, hi + 1, l, task, accesses, swaps);
        s++;
    }


    s = await RICCS(a, low, mid, c, l, task, comparison, accesses, swaps, s);
    s = await RICCS(a, mid + 1, high, c, l, task, comparison, accesses, swaps, s);
    return s;
}


async function RCS(a, lo, hi, c, l, task, comparison, accesses, swaps){
    while((await RICCS(a, lo, hi, c, l, task, comparison, accesses, swaps, 0)) != 0 ){
        if(task.killed()) return;
    }
}

async function NRICCS(a, lo, hi, c, l, task, comparison, accesses, swaps, s){
    let lstack = [];
    let hstack = [];
    lstack.push(lo);
    hstack.push(hi);

    while(lstack.length > 0 && hstack.length > 0){
        if(task.killed()) return s;
        let lo = lstack.pop();
        let hi = hstack.pop();
        if(lo != hi && !task.killed()){
            let high = hi,
                low = lo,
                mid = (hi - lo) >>> 1;
        
            while(lo < hi){
                if(task.killed()) return s;
                accesses.inc(2);
                comparison.inc(1);
                if(c(a[lo], a[hi]) > 0){
        
                    await swapValues(a, lo, hi, l, task, accesses, swaps);
                    s++;
                }
                lo++;
                hi--;
            }
        
            accesses.inc(2);
            comparison.inc(1);
            if(lo == hi && c(a[lo], a[hi + 1]) > 0){
                await swapValues(a, lo, hi + 1, l, task, accesses, swaps);
                s++;
            }
        
            lstack.push(low);
            lstack.push(low + mid + 1);

            hstack.push(low + mid);
            hstack.push(high);
        }
    }
    return s;
    
}

async function NRCS(a, lo, hi, c, l, task, comparison, accesses, swaps){
    while((await NRICCS(a, lo, hi, c, l, task, comparison, accesses, swaps, 0)) != 0 ){
        if(task.killed()) return;
    }
}

export{
    RCS,
    NRCS,
    setFrames
};