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
    for(let i = lo + 1; i <= hi; i++){
        if(task.killed()) return;
        let val = a[i],
            j = i - 1;
        accesses.inc(1);
        
        while(j >= lo && c(a[j], val) > 0){
            if(task.killed()) return;
            comparison.inc(1);
            accesses.inc(1);
            a[j + 1] = a[j];
            accesses.inc(2);
            await listen(j, j + 1, a, l, task);
            j = j - 1;
        }
        a[j + 1] = val;
        await listen(i, j + 1, a, l, task);
        accesses.inc(1);
        swaps.inc();
    }
}

async function Gnome(a, lo, hi, c, l, task, comparison, accesses, swaps){
    let i = lo + 1,
        j = lo + 2;
    while(i <= hi){
        if(task.killed()) return;
        comparison.inc(1);
        accesses.inc(2);
        if(c(a[i - 1], a[i]) <= 0){
            i = j++;
        } else {
            await swapValues(a, i - 1, i, l, task, accesses, swaps);

            if(--i === lo){
                i = j++;
            }
        }
    }
}

async function Shell(a, lo, hi, c, l, task, comparison, accesses, swaps){
    for(let inc = hi - lo + 1; inc > 0; inc = Math.floor(0.5 + inc/2.2)){
        for(let i = lo + inc; i <= hi; i++){
            if(task.killed()) return;
            let tmp = a[i], j = i;
            accesses.inc(1);
            for(;j >= lo + inc && c(a[j - inc], tmp) > 0; j -= inc){
                comparison.inc(1);
                accesses.inc(1);
                a[j] = a[j - inc];
                swaps.inc(1);
                accesses.inc(2);

                await listen(j, j - inc, a, l, task);
            }
            a[j] = tmp;
            await listen(j, i, a, l, task);
            accesses.inc(1);
            swaps.inc(1);
        }
    }
}

async function RBS(a, lo, hi, k, item, c, l, task, comparison, accesses, swaps){
    if(task.killed()) return lo;

    
    if (hi <= lo)
        return c(item, a[lo]) > 0?  (lo + 1): lo;

    let mid =(lo + hi) >>> 1;
    
    comparison.inc(1);
    accesses.inc(2);

    await listen(mid, k, a, l, task);

    if(a[mid] == item){
        return mid + 1;
    }

    comparison.inc(1);
    accesses.inc(2);

    await listen(mid, k, a, l, task);
    if(c(a[mid], item) < 0){
        return await RBS(a,  mid + 1, hi, k, item, c, l, task, comparison, accesses, swaps);
    } 
    return await RBS(a, lo, mid - 1, k, item, c, l, task, comparison, accesses, swaps);
}

async function RBIS(a, lo, hi, c, l, task, comparison, accesses, swaps){
    for(let i = lo + 1; i <= hi; i++){
        if(task.killed()) return;
        let j = i - 1;
        let value = a[i];
        accesses.inc(1);
        let pos = await RBS(a, lo, j, i, value, c, l, task, comparison, accesses, swaps);

        while (j >= pos)
        {
            await listen(j + 1, j, a, l, task);
            a[j+1] = a[j];
            swaps.inc(1);
            accesses.inc(2);
            j--;
        }
        a[j+1] = value;
        swaps.inc(1);
        accesses.inc(1);
    }
}

async function IBS(a, lo, hi, k, item, c, l, task, comparison, accesses){
    if(task.killed()) return lo;

    while(lo <= hi){
        if(task.killed()) return;
        let mid = (lo + hi) >>> 1;

        comparison.inc(2);
        accesses.inc(3);
        await listen(mid, k, a, l, task);
        if(c(a[mid], item) > 0){
            hi = mid - 1;
        } 
        if(c(a[mid], item) < 0){
            lo = mid + 1;
        }
        if(a[mid] == item){
            return mid;
        }

    }
    return lo;
    
}

async function IBIS(a, lo, hi, c, l, task, comparison, accesses, swaps){
    for(let i = lo + 1; i <= hi; i++){
        if(task.killed()) return;
        let j = i - 1;
        let value = a[i];
        accesses.inc(1);
        let pos = await IBS(a, lo, j, i, value, c, l, task, comparison, accesses, swaps);

        while (j >= pos)
        {
            await listen(j + 1, j, a, l, task);
            a[j+1] = a[j];
            swaps.inc(1);
            accesses.inc(2);
            j--;
        }
        a[j+1] = value;
        swaps.inc(1);
        accesses.inc(1);
    }
}

export{
    Basic,
    Gnome,
    Shell,
    RBIS,
    IBIS,
    setFrames
};