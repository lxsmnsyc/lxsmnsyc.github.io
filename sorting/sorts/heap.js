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

let pNode = i => (i - 1) >>> 1;
let lNode = i => 2*i + 1;
let rNode = i => 2*i + 2;

async function SiftDown(a, start, end, lo, hi, c, l, task, comparison, accesses, swaps){
    let root = start;
    while(lNode(root) <= end){
        if(task.killed()) return;

        let left = lNode(root);
        let right = rNode(root);

        let large = left;

        comparison.inc();
        accesses.inc(2);

        if(right <= end && c(a[lo + left], a[lo + right]) <= 0){
            large = right;
        }

        comparison.inc();
        accesses.inc(2);
        if(c(a[lo + root], a[lo + large]) <= 0){

            await swapValues(a, lo + root, lo + large, l, task, accesses, swaps);
            root = large;
        } else {
            return;
        }
    }
}

async function SDHeapify(a, lo, hi, c, l, task, comparison, accesses, swaps){
    let n = hi - lo;
    let start = pNode(n);
    while(start >= 0){
        if(task.killed()) return;
        await SiftDown(a, start, n, lo, hi, c, l, task, comparison, accesses, swaps);
        start--;
    }
}

async function SDHS(a, lo, hi, c, l, task, comparison, accesses, swaps){
    await SDHeapify(a, lo, hi, c, l, task, comparison, accesses, swaps);
    let end = hi - lo;
    while(end > 0){
        if(task.killed()) return;
        await swapValues(a, lo, lo + end, l, task, accesses, swaps);

        end--;

        await SiftDown(a, 0, end, lo, hi, c, l, task, comparison, accesses, swaps);
    }
}

async function SiftUp(a, start, end, lo, hi, c, l, task, comparison, accesses, swaps){
    let child = end;
    let parent = pNode(child);
    while(child > start && c(a[lo + child], a[lo + parent]) < 0){
        comparison.inc(1);
        accesses.inc(2);
        if(task.killed()) return;

        await swapValues(a, lo + parent, lo + child, l, task, accesses, swaps);

        child = parent;
        parent = pNode(child);
    }
}

async function SUHeapify(a, lo, hi, c, l, task, comparison, accesses, swaps){
    let end = 1;

    while(end < (hi - lo)){
        if(task.killed()) return;
        await SiftUp(a, 0, end, lo, hi, c, l, task, comparison, accesses, swaps);
        end++;
    }
}

async function SUHS(a, lo, hi, c, l, task, comparison, accesses, swaps){
    await SUHeapify(a, lo, hi, c, l, task, comparison, accesses, swaps);
    let end = hi - lo;
    while(end > 0){
        if(task.killed()) return;
        await swapValues(a, lo, lo + end, l, task, accesses, swaps);

        end--;

        await SiftUp(a, 0, end, lo, hi, c, l, task, comparison, accesses, swaps);
    }
}

export {
    SDHS,
    SUHS,
    setFrames
};