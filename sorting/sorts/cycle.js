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

async function CS(a, lo, hi, c, l, task, comparison, accesses, swaps){
    for(let cs = lo; cs < hi; cs++){
        let val = a[cs];
        accesses.inc(1);

        let pos = cs;
        for(let i = cs + 1; i < hi + 1; i++){
            await listen(cs, i, a, l, task);
            comparison.inc(1);
            accesses.inc(1);
            if(c(a[i], val) < 0){
                pos++;
            }
        }

        if(pos == cs){
            continue;
        }

        while(val == a[pos]){
            await listen(cs, pos, a, l, task);
            accesses.inc(1);

            pos++;
        }
        let tmp = a[pos];
        accesses.inc(1);
        a[pos] = val;
        accesses.inc(1);
        val = tmp;
        swaps.inc(1);
        while(pos != cs){
            pos = cs;
            if(task.killed()) return;

            for(let i = cs + 1; i < hi + 1; i++){
                comparison.inc(1);
                accesses.inc(1);
                await listen(cs, i, a, l, task);

                if(c(a[i], val) < 0){
                    pos++;
                }
                if(task.killed()) return;
            }
            while(val === a[pos]){
                await listen(cs, pos, a, l, task);
                accesses.inc(1);
                pos++;
            }
            
            tmp = a[pos];
            accesses.inc(1);
            a[pos] = val;
            accesses.inc(1);
            val = tmp;
            swaps.inc(1);

        }
    }
}

export{
    CS,
    setFrames
};