import {sleep, FRAME} from "../util/sleep.js";
import * as InsertionSort from "./insertion.js";
import * as MergeSort from "./merge.js";
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

const RUN = 32;

/**
 * Basic TimSort with Insertion Sort and Bottom-UP Merge
 */
async function BTISBUM(a, lo, hi, c, l, task, comparison, accesses, swaps){
    for(let i = lo; i <= hi; i += RUN){
        await InsertionSort.Basic(a, i, Math.min(i + RUN - 1, hi), c, l, task, comparison, accesses, swaps);
    }
    let b = [];
    let n = hi - lo;
    for(let w = RUN; w <= n; w *= 2){
        if(task.killed()) return;
        for(let i = lo; i <= hi; i += w*2){
            if(task.killed()) return;
            await MergeSort.Merge(a, i, Math.min(i + w, hi + 1), Math.min(i + w*2, hi + 1), b, c, l, task, comparison, accesses, swaps);
        }
        await MergeSort.copyArray(b, lo, hi, a, accesses, task);
    }
}

/**
 * Basic TimSort with Insertion Sort and Bottom-UP Merge
 */
async function BTRBISBUM(a, lo, hi, c, l, task, comparison, accesses, swaps){
    for(let i = lo; i <= hi; i += RUN){
        await InsertionSort.RBIS(a, i, Math.min(i + RUN - 1, hi), c, l, task, comparison, accesses, swaps);
    }
    let b = [];
    let n = hi - lo;
    for(let w = RUN; w <= n; w *= 2){
        if(task.killed()) return;
        for(let i = lo; i <= hi; i += w*2){
            if(task.killed()) return;
            await MergeSort.Merge(a, i, Math.min(i + w, hi + 1), Math.min(i + w*2, hi + 1), b, c, l, task, comparison, accesses, swaps);
        }
        await MergeSort.copyArray(b, lo, hi, a, accesses, task);
    }
}
/**
 * Basic TimSort with Insertion Sort and Bottom-UP Merge
 */
async function BTIBISBUM(a, lo, hi, c, l, task, comparison, accesses, swaps){
    for(let i = lo; i <= hi; i += RUN){
        await InsertionSort.IBIS(a, i, Math.min(i + RUN - 1, hi), c, l, task, comparison, accesses, swaps);
    }
    let b = [];
    let n = hi - lo;
    for(let w = RUN; w <= n; w *= 2){
        if(task.killed()) return;
        for(let i = lo; i <= hi; i += w*2){
            if(task.killed()) return;
            await MergeSort.Merge(a, i, Math.min(i + w, hi + 1), Math.min(i + w*2, hi + 1), b, c, l, task, comparison, accesses, swaps);
        }
        await MergeSort.copyArray(b, lo, hi, a, accesses, task);
    }
}
export{
    BTISBUM,
    BTRBISBUM,
    BTIBISBUM,
    setFrames
};