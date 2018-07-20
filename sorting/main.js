import * as DataGen from "./util/generator.js";
import {FRAME} from "./util/sleep.js";

import * as QuickSort from "./sorts/quick.js";
import * as MergeSort from "./sorts/merge.js";
import * as HeapSort from "./sorts/heap.js";
import * as SelectionSort from "./sorts/selection.js";
import * as BubbleSort from "./sorts/bubble.js";
import * as InsertionSort from "./sorts/insertion.js";
import * as CountingSort from "./sorts/counting.js";
import * as CycleSort from "./sorts/cycle.js";
import * as PermutationSort from "./sorts/permutation.js";
import * as StoogeSort from "./sorts/stooge.js";
import * as CircleSort from "./sorts/circle.js";
import * as IntroSort from "./sorts/intro.js";
import * as TimSort from "./sorts/tim.js";

import {Task} from "./util/task.js";
import {Counter} from "./util/counter.js";

const DEFAULT_FRAMES = FRAME;
const DEFAULT_FPS = 1000/FRAME;

const DEFAULT_LEN = 32;
const DEFAULT_MODULUS = 4;

const ACCESS_COLOR = "#0ff";
const SWAP_COLOR = "#ff0";
const NORMAL_COLOR = "#f0f";

const SORTS = [
    QuickSort.LomutoNRQS,
    QuickSort.LomutoRQS,
    QuickSort.HoareRQS,
    QuickSort.HoareNRQS,
    MergeSort.RTD,
    MergeSort.BottomUp,
    HeapSort.SDHS,
    HeapSort.SUHS,
    SelectionSort.Basic,
    SelectionSort.Bingo,
    BubbleSort.BBS,
    BubbleSort.OBS,
    BubbleSort.Cocktail,
    BubbleSort.SPOE,
    BubbleSort.PPOE,
    BubbleSort.Comb,
    InsertionSort.Basic,
    InsertionSort.Gnome,
    InsertionSort.Shell,
    InsertionSort.RBIS,
    InsertionSort.IBIS,
    CountingSort.CS,
    CycleSort.CS,
    PermutationSort.PS,
    StoogeSort.RSS,
    StoogeSort.NRSS,
    CircleSort.RCS,
    CircleSort.NRCS,
    IntroSort.RBLPISSDHS,
    IntroSort.NRBLPISSDHS,
    IntroSort.RBHPISSDHS,
    IntroSort.NRBHPISSDHS,
    TimSort.BTISBUM,
    TimSort.BTRBISBUM,
    TimSort.BTIBISBUM
];

const ARRAY_TYPES = [
    Array,
    Int8Array,
    Int16Array,
    Int32Array,
    Uint8Array,
    Uint8ClampedArray,
    Uint16Array,
    Uint32Array,
    Float32Array,
    Float64Array
];

const ascending = (a, b) => a - b;
const descending = (a, b) => b - a;

function getCanvas(id){
    return document.getElementById(id);
}

function getCanvasContext(cv){
    return cv.getContext("2d");
}


function DrawArrayToCanvas(cv, ctx, arr, len, s1, s2){
    let w = cv.width;
    let h = cv.height;
    //let normW = w/tw;
    //let normH = h/th;
    ctx.clearRect(0, 0, w, h);

    let normX = w/len;
    let normY = h/len;
    for(let i = 0; i < len; i++){
        if(s1 == i){
            ctx.fillStyle = ACCESS_COLOR;
        } else if(s2 == i){
            ctx.fillStyle = SWAP_COLOR;
        } else{
            ctx.fillStyle = NORMAL_COLOR;
        }

        let x = i*normX;
        let y = arr[i]*normY;
        ctx.fillRect(x, h - y, w/len, y);
    }
}

class Timer{
    constructor(){
        this.now = performance.now();
    }
    
    end(){
        let now = performance.now() - this.now;
        now = now/1000;
        document.getElementById("time").innerHTML = "Time: " + now + " seconds";
    }
}
let task = new Task();

function kill(t){
    t.killTask();
}

function restart(){
    return new Task();
}

function setFrames(v){
    QuickSort.setFrames(v);
    MergeSort.setFrames(v);
    HeapSort.setFrames(v);
    SelectionSort.setFrames(v);
    BubbleSort.setFrames(v);
    InsertionSort.setFrames(v);
    CountingSort.setFrames(v);
    CycleSort.setFrames(v);
    PermutationSort.setFrames(v);
    StoogeSort.setFrames(v);
    CircleSort.setFrames(v);
    IntroSort.setFrames(v);
    TimSort.setFrames(v);
}


async function startSort(type, sorter, len, modulus, arrayType, asc, task){
    let data = DataGen.createUnsorted(len, arrayType, type, asc, modulus);
    let cv = getCanvas("cv");
    let ctx = getCanvasContext(cv);


    let c = asc ? ascending : descending;
    
    let timer = new Timer();
    let comparison = new Counter();
    let accesses = new Counter();
    let swaps = new Counter();

    let timeDisplay = document.getElementById("time");
    let compDisplay = document.getElementById("compare");
    let accessDisplay = document.getElementById("access");
    let swapDisplay = document.getElementById("swap");

    let drawData = (a, b, arr=data) => { 
        DrawArrayToCanvas(cv, ctx, arr, len, a, b);

        timeDisplay.innerHTML = "Time: " + ((performance.now() - timer.now)/1000) + " seconds";
        compDisplay.innerHTML = "Accesses: " + accesses.count;
        accessDisplay.innerHTML = "Comparisons: " + comparison.count;
        swapDisplay.innerHTML = "Swaps: " + swaps.count;
    };
        
    drawData();
    await SORTS[sorter](data, 0, len - 1, c, drawData, task, comparison, accesses, swaps);
    drawData();

    timer.end();
}

async function startProgram(
    sorter = 1, 
    len = DEFAULT_LEN, 
    modulus = DEFAULT_MODULUS, 
    arrayType = Array,  
    asc = true,
    frames = DEFAULT_FRAMES,
    dataSet = "unique" 
){
    task = restart();

    setFrames(frames);

    startSort(dataSet, sorter, len, modulus, arrayType, asc, task);
}


document.getElementById("start").addEventListener("click", () =>{
    let s = document.getElementById("input-algo");
    let sorter = s.options[s.selectedIndex].value;

    let data = document.getElementById("input-len").value;

    let modulus = document.getElementById("input-mod").value;

    let asc = document.getElementById("input-asc");

    let a = document.getElementById("input-arr");
    let arr = a.options[a.selectedIndex].value;

    let fps = document.getElementById("input-fps").value;

    
    let dt= document.getElementById("input-dataset");
    let dataType = dt.options[dt.selectedIndex].value;

    fps = 1000/fps;

    kill(task);
    startProgram(
        sorter, 
        data, 
        modulus, 
        ARRAY_TYPES[arr], 
        asc.checked, 
        fps, 
        dataType
    );
});


document.getElementById("input-len").value = DEFAULT_LEN;

document.getElementById("input-mod").value = DEFAULT_MODULUS;

document.getElementById("input-fps").value = DEFAULT_FPS;

{
    function swap(a, i, j){
        let tmp = a[i];
        a[i] = a[j];
        a[j] = tmp;
    }
    function siftup(a, start, end){
        let child = end;
        while(child > start){
            let parent = (child - 1) >>> 1;
            if(a[parent] < a[child]){
                swap(a, parent, child);

                child = parent;
            }
            else {return;}
        }
    }

    function heapify(a){
        let end = 1;
        while(end < a.length){
            siftup(a, 0, end++);
            console.log("heapify: " + a);
        }
    }

    function heapsort(a){
        let count = a.length;
        heapify(a);

        let end = count - 1;
        while(end > 0){
            swap(a, 0, end--);
            siftup(a, 0, end);
            console.log("siftup: " + a);
        }
        return a;
    }
    let a = [5,4,2,1,6,8,3,7];
    console.log("unsort: " + a);
    console.log("result: " + heapsort(a));
}