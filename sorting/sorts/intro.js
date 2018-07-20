import {FRAME} from "../util/sleep.js";
import * as HeapSort from "./heap.js";
import * as QuickSort from "./quick.js";

let frames = FRAME;

/**
 * This allows you to customized frame rates
 * @param {Number} v 
 */
function setFrames(v){
    frames = v;
}

/**
 * Recursive Basic Lomuto Partition Intro Sort with Sift Down HeapSort
 */
async function RBLPISSDHSS(a, lo, hi, c, l, task, comparison, accesses, swaps, depth){
    if(lo < hi && !task.killed()){
        if (depth == 0) {
            await HeapSort.SDHS(a, lo, hi, c, l, task, comparison, accesses, swaps);
        } else {
            let p = await QuickSort.LomutoPartition(a, lo, hi, c, l, task, comparison, accesses, swaps);
            await RBLPISSDHSS(a, lo, p - 1, c, l, task, comparison, accesses, swaps, depth - 1);
            await RBLPISSDHSS(a, p + 1, hi, c, l, task, comparison, accesses, swaps, depth - 1);
        }
    }
}

async function RBLPISSDHS(a, lo, hi, c, l, task, comparison, accesses, swaps){
    let depth = Math.floor(Math.log(hi - lo + 1))*2;
    await RBLPISSDHSS(a, lo, hi, c, l, task, comparison, accesses, swaps, depth, depth);
}

async function NRBLPISSDHSS(a, lo, hi, c, l, task, comparison, accesses, swaps, depth){
    let lstack = [],
        hstack = [];

    lstack.push(lo);
    hstack.push(hi);

    while(lstack.length > 0 && hstack.length > 0){
        let lo = lstack.pop();
        let hi = hstack.pop();
        if(lo < hi && !task.killed()){
            if (depth == 0) {
                await HeapSort.SDHS(a, lo, hi, c, l, task, comparison, accesses, swaps);
            } else {
                let p = await QuickSort.LomutoPartition(a, lo, hi, c, l, task, comparison, accesses, swaps);
                
                lstack.push(lo);
                lstack.push(p + 1);

                hstack.push(p - 1);
                hstack.push(hi);
            }
        }
    }
}

async function NRBLPISSDHS(a, lo, hi, c, l, task, comparison, accesses, swaps){
    let depth = Math.floor(Math.log(hi - lo + 1))*2;
    await NRBLPISSDHSS(a, lo, hi, c, l, task, comparison, accesses, swaps, depth, depth);
}


/**
 * Recursive Basic Lomuto Partition Intro Sort with Sift Down HeapSort
 */
async function RBHPISSDHSS(a, lo, hi, c, l, task, comparison, accesses, swaps, depth){
    if(lo < hi && !task.killed()){
        if (depth == 0) {
            await HeapSort.SDHS(a, lo, hi, c, l, task, comparison, accesses, swaps);
        } else {
            let p = await QuickSort.HoarePartition(a, lo, hi, c, l, task, comparison, accesses, swaps);
            await RBHPISSDHSS(a, lo, p, c, l, task, comparison, accesses, swaps, depth - 1);
            await RBHPISSDHSS(a, p + 1, hi, c, l, task, comparison, accesses, swaps, depth - 1);
        }
    }
}

async function RBHPISSDHS(a, lo, hi, c, l, task, comparison, accesses, swaps){
    let depth = Math.floor(Math.log(hi - lo + 1))*2;
    await RBHPISSDHSS(a, lo, hi, c, l, task, comparison, accesses, swaps, depth, depth);
}


async function NRBHPISSDHSS(a, lo, hi, c, l, task, comparison, accesses, swaps, depth){
    let lstack = [],
        hstack = [];

    lstack.push(lo);
    hstack.push(hi);

    while(lstack.length > 0 && hstack.length > 0){
        let lo = lstack.pop();
        let hi = hstack.pop();
        if(lo < hi && !task.killed()){
            if (depth == 0) {
                await HeapSort.SDHS(a, lo, hi, c, l, task, comparison, accesses, swaps);
            } else {
                let p = await QuickSort.HoarePartition(a, lo, hi, c, l, task, comparison, accesses, swaps);
                
                lstack.push(lo);
                lstack.push(p + 1);

                hstack.push(p);
                hstack.push(hi);
            }
        }
    }
}

async function NRBHPISSDHS(a, lo, hi, c, l, task, comparison, accesses, swaps){
    let depth = Math.floor(Math.log(hi - lo + 1))*2;
    await NRBHPISSDHSS(a, lo, hi, c, l, task, comparison, accesses, swaps, depth, depth);
}

export{
    RBLPISSDHS,
    NRBLPISSDHS,
    RBHPISSDHS,
    NRBHPISSDHS,
    setFrames
};