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


async function copyArray(a, s, e, b, accesses, task){
    for(let i = s; i <= e; i++){
        if(task.killed()) return;
        b[i] = a[i];

        accesses.inc(2);
    } 
}

async function Merge(a, l, m, h, b, c, listener, task, comparison, accesses, swaps){
    let i = l, j = m;
    for(let k = l; k < h; k++){
        if(task.killed()) return;
        comparison.inc();
        accesses.inc(2);
        if(i < m && (j >= h || c(a[i], a[j]) < 0)){
            await listen(k, i, b, listener, task);
            b[k] = a[i];
            accesses.inc(2);
            swaps.inc();
            i++;
        }
        else{

            await listen(k, j, b, listener, task);
            b[k] = a[j];

            accesses.inc(2);
            swaps.inc();
            j++;
        }
    }
}

async function RTDSplitMerge(b, l, h, a, c, listener, task, comparison, accesses, swaps){
    if(task.killed()) return;
    if(h - l < 2) return;

    let m = (l + h) >>> 1;

    await RTDSplitMerge(a, l, m, b, c, listener, task, comparison, accesses, swaps);
    await RTDSplitMerge(a, m, h, b, c, listener, task, comparison, accesses, swaps);

    await Merge(b, l, m, h, a, c, listener, task, comparison, accesses, swaps);
}

async function RTD(a, lo, hi, c, l, task, comparison, accesses, swaps){
    if(lo < hi){
        let b = [];
        await copyArray(a, lo, hi, b, accesses, task);
        await RTDSplitMerge(b, lo, hi + 1, a, c, l, task, comparison, accesses, swaps);
    }
}

async function BottomUp(a, lo, hi, c, l, task, comparison, accesses, swaps){
    let b = [];
    for(let w = 1; w <= (hi - lo); w *= 2){
        if(task.killed()) return;
        for(let i = lo; i <= hi; i += w*2){
            if(task.killed()) return;
            await Merge(a, i, Math.min(i + w, hi + 1), Math.min(i + w*2, hi + 1), b, c, l, task, comparison, accesses, swaps);
        }
        await copyArray(b, lo, hi, a, accesses, task);
    }
}


export {
    RTD,
    BottomUp,
    Merge,
    copyArray,
    setFrames
};