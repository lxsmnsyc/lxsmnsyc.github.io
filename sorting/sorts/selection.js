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

async function Basic(a, lo, hi, c, l, task, comparison, accesses, swaps){
    hi++;
    for(let i = lo; i < hi - 1; i++){
        if(task.killed()) return;
        let min = i;

        for(let j = i + 1; j < hi; j++){
            if(task.killed()) return;
            await listen(j, min, a, l, task);
            if(c(a[j], a[min]) < 0){
                comparison.inc(2);
                accesses.inc(2);
                min = j;
            }
        }

        if(min != i){
            await swapValues(a, i, min, l, task, accesses, swaps);
        }
    }
}

async function Bingo(a, lo, hi, c, l, task, comparison, accesses, swaps){
    let max = hi;
    let nextValue = a[max];
    accesses.inc(1);

    for(let i = max - 1; i >= lo; i--){
        if(task.killed()) return;
        await listen(i, null, a, l, task);

        comparison.inc(1);
        if(c(a[i], nextValue) > 0){
            accesses.inc(1);
            nextValue = a[i];
            accesses.inc(1);
        }
    }

    while(max > lo && a[max] == nextValue){
        if(task.killed()) return;
        await listen(max, null, a, l, task);
        accesses.inc(1);
        max--;
    }
    while(max > lo){
        if(task.killed()) return;
        let val = nextValue;
        nextValue = a[max];
        accesses.inc(1);
        for(let i = max - 1; i >= lo; i--){
            if(task.killed()) return;
            await listen(i, null, a, l, task);
            let tmp = a[i];
            accesses.inc(1);

            if(tmp == val){
                await swapValues(a, i, max, l, task, accesses, swaps);

                max--;
            } else if(c(tmp, nextValue) > 0){
                await listen(i, null, a, l, task);
                comparison.inc(1);
                nextValue = tmp;
            }
        }
        while(max > lo && a[max] == nextValue){
            if(task.killed()) return;
            await listen(max, null, a, l, task);
            accesses.inc(1);
            max--;
        }
    }
}

export{
    Basic,
    Bingo,

    setFrames
};