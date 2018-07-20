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

async function BBS(a, lo, hi, c, l, task, comparison, accesses, swaps){
    let n = hi + 1;
    let swapped = false;
    do{
        swapped = false;
        n--;
        for(let i = lo + 1; i <= n; i++){
            comparison.inc(1);
            accesses.inc(2);
            if(c(a[i - 1], a[i]) > 0){
                await swapValues(a, i - 1, i, l, task, accesses, swaps);
                swapped = true;
            }
        }
    } while (swapped);
}

async function OBS(a, lo, hi, c, l, task, comparison, accesses, swaps){
    let n = hi + 1;
    do{
        let newn = 0;
        for(let i = lo + 1; i <= n; i++){
            comparison.inc(1);
            accesses.inc(2);
            if(c(a[i - 1], a[i]) > 0){
                await swapValues(a, i - 1, i, l, task, accesses, swaps);
                newn = i;
            }
        }
        n = newn;
    } while (n !== 0);
}

async function Cocktail(a, lo, hi, c, l, task, comparison, accesses, swaps){
    let swapped = false;
    do{
        swapped = false;
        for(let i = lo; i < hi; i++){
            comparison.inc(1);
            accesses.inc(2);
            if(c(a[i], a[i + 1]) > 0){
                await swapValues(a, i, i + 1, l, task, accesses, swaps);
                swapped = true;
            }
        }
        if(!swapped){
            break;
        }
        swapped = false;
        for(let i = hi - 1; i >= lo; i--){
            comparison.inc(1);
            accesses.inc(2);
            if(c(a[i], a[i + 1]) > 0){
                await swapValues(a, i, i + 1, l, task, accesses, swaps);
                swapped = true;
            }
        }
    } while (swapped);
}
async function OESorter(a, lo, hi, c, l, task, comparison, accesses, swaps, isOdd){
    let sorted = true;
    for(let i = lo + isOdd; i < hi; i += 2){
        if(task.killed()) return;
        comparison.inc(1);
        accesses.inc(2);
        if(c(a[i], a[i + 1]) > 0){
            await swapValues(a, i, i + 1, l, task, accesses, swaps);
            sorted = false;
        }
    }
    return sorted;
}

async function SPOE(a, lo, hi, c, l, task, comparison, accesses, swaps){
    let sorted = false;
    while(!sorted){
        if(task.killed()) return;
        sorted = true;

        sorted = sorted && await OESorter(a, lo, hi, c, l, task, comparison, accesses, swaps, 1);
        sorted = sorted && await OESorter(a, lo, hi, c, l, task, comparison, accesses, swaps, 0);
    }
}

async function PPOE(a, lo, hi, c, l, task, comparison, accesses, swaps){
    let sorted = false;
    while(!sorted){
        if(task.killed()) return;
        sorted = true;

        let result = await Promise.all([
            OESorter(a, lo, hi, c, l, task, comparison, accesses, swaps, 1),
            OESorter(a, lo, hi, c, l, task, comparison, accesses, swaps, 0)
        ]);

        sorted = sorted && result[0] && result[1];
    }
}

const GAP_FACTOR = 1.25;

async function Comb(a, lo, hi, c, l, task, comparison, accesses, swaps){
    let gap = hi + 1,
        swapc = 0;
    while(!(gap == 1 && swapc == 0)){
        gap = Math.floor(gap/GAP_FACTOR);
        if(gap < 1){
            gap = 1;
        }
        swapc = 0;
        for(let i = lo; i + gap < hi + 1; i++){
            accesses.inc(2);
            comparison.inc(1);
            if(c(a[i], a[i + gap]) > 0){
                await swapValues(a, i, i + gap, l, task, accesses, swaps);
                swapc = 1;
            }
        }
    }
}

export{
    BBS,
    OBS,
    Cocktail,
    SPOE,
    PPOE,
    Comb,
    setFrames
};