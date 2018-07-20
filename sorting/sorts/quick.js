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
/**
 * 
 */
async function LomutoPartition(a, lo, hi, c, listener, task, comparison, accesses, swaps){
    let pivot = a[hi],
        i = lo - 1;
    listen(null, hi, a, listener, task);
    accesses.inc();

    for(let j = lo; j < hi; j++){
        if(task.killed()) return;
        let cmp = c(a[j], pivot);
        comparison.inc();
        accesses.inc(2);
        listen(null, j, a, listener, task);
        if(cmp < 0){
            i++;

            await swapValues(a, i, j, listener, task, accesses, swaps);
        }
    }
    await swapValues(a, i + 1, hi, listener, task, accesses, swaps);
    return i + 1;
}

async function LomutoRQS(a, lo, hi, c, listener, task, comparison, accesses, swaps){
    if (lo < hi && !task.killed()){
        let p = await LomutoPartition(a, lo, hi, c, listener, task, comparison, accesses, swaps);
        await LomutoRQS(a, lo, p - 1, c, listener, task, comparison, accesses, swaps);
        await LomutoRQS(a, p + 1, hi, c, listener, task, comparison, accesses, swaps);
    }
}

async function LomutoNRQS(a, lo, hi, c, listener, task, comparison, accesses, swaps){
    let stack = [];
    if(lo < hi && !task.killed()){
        stack.push(lo);
        stack.push(hi);
        while(stack.length > 0){
            if(task.killed()) return;
            let e = stack.pop(),
                s = stack.pop(),
                p = await LomutoPartition(a, s, e, c, listener, task, comparison, accesses, swaps);

            if(p - 1 > s){
                stack.push(s);
                stack.push(p - 1);
            }
            if(p + 1 < e){
                stack.push(p + 1);
                stack.push(e);
            }
        }
    }
    
}

async function HoarePartition(a, lo, hi, c, listener, task, comparison, accesses, swaps){
    let mid = lo + ((hi - lo) >>> 1);
    let pivot = a[mid],
        i = lo - 1,
        j = hi + 1;
    
    listen(null, mid, a, listener, task);
    accesses.inc();
    for(;;){
        if(task.killed()) return;
        do{
            await listen(null, i, a,  listener, task);
            i++;
            accesses.inc();
            comparison.inc();
        } while (c(a[i], pivot) < 0);
        do{
            await listen(null, j, a, listener, task);
            j--;
            accesses.inc();
            comparison.inc();
        } while (c(a[j], pivot) > 0);
        if (i >= j){
            return j;
        }

        await swapValues(a, i, j, listener, task, accesses, swaps);
    }
}

async function HoareRQS(a, lo, hi, c, listener, task, comparison, accesses, swaps){
    if (lo < hi){
        if(task.killed()) return;
        let p = await HoarePartition(a, lo, hi, c, listener, task, comparison, accesses, swaps);
        await HoareRQS(a, lo, p, c, listener, task, comparison, accesses, swaps);
        await HoareRQS(a, p + 1, hi, c, listener, task, comparison, accesses, swaps);
    }
}

async function HoareNRQS(a, lo, hi, c, listener, task, comparison, accesses, swaps){
    let stack = [];
    if(lo < hi){
        stack.push(lo);
        stack.push(hi);
        while(stack.length > 0){
            if(task.killed()) return;
            let e = stack.pop(),
                s = stack.pop(),
                p = await HoarePartition(a, s, e, c, listener, task, comparison, accesses, swaps);

            if(p > s){
                stack.push(s);
                stack.push(p);
            }
            if(p + 1 < e){
                stack.push(p + 1);
                stack.push(e);
            }
        }
    }
    
}
export {
    LomutoRQS,
    LomutoNRQS,
    HoareRQS,
    HoareNRQS,
    setFrames,

    LomutoPartition,
    HoarePartition
};