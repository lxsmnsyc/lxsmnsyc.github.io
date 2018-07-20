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

async function copyArray(a, s, e, b, accesses, task){
    for(let i = s; i <= e; i++){
        if(task.killed()) return;
        b[i] = a[i];

        accesses.inc(2);
    } 
}

async function inOrder(a, lo, hi, c, l, task, comparison, accesses){
    for(let i = lo; i < hi; i++){
        comparison.inc(1);
        accesses.inc(2);

        await listen(a, i, i + 1, l, task);
        if(c(a[i], a[i + 1]) > 0){
            return false;
        }
    }
    return true;
}

async function permute(a, lo, hi, c, l, task, comparison, accesses, swaps, stack){
    if(task.killed()) return;
    if(hi - lo == 0){
        stack.push(a.slice(0));
    } else {
        for(let i = lo; i <= hi; i++){
            if(task.killed()) return;
            await swapValues(a, i, hi, l, task, accesses, swaps);
            await permute(a, lo, hi - 1, c, l, task, comparison, accesses, swaps, stack);
            await swapValues(a, i, hi, l, task, accesses, swaps);
        }
    }
}

async function PS(a, lo, hi, c, l, task, comparison, accesses, swaps,){
    let stack = [];
    let top = a;
    stack.push(a);
    await permute(a, lo, hi, c, l, task, comparison, accesses, swaps, stack);
    for(let i = 0; i < stack.length; i++){
        if(task.killed()) return;
        top = stack[i];
        await listen(lo, hi, top, l, task);
        if(await inOrder(top, lo, hi, c, l, task, comparison, accesses)){
            await copyArray(top, lo, hi, a, accesses, task);
            task.killTask();
            return;
        }
    }
}

export{
    PS, 
    setFrames
};