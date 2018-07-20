export let FRAME = 1000/64;
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}