
const SAFE_SENTINEL = 0;

export class List{
    /**
     * Creates a new List instance
     * @param {Number} sentinel - the sentinel node for the list
     */
    constructor(sentinel = SAFE_SENTINEL){
        this.sentinel = sentinel;

        this.next = [];
        this.prev = [];

        this.next[sentinel] = sentinel;
        this.prev[sentinel] = sentinel;
    }

    /**
     * Gets the head index
     * @returns {Number}
     */
    get head(){
        return this.next[this.sentinel];
    }

    /**
     * Gets the tail index
     * @returns {Number}
     */
    get tail(){
        return this.prev[this.sentinel];
    }
    
    /**
     * Checks if list is empty
     * @returns {Boolean}
     */
    isEmpty(){
        return this.head === this.sentinel && this.prev === this.sentinel;
    }

    /**
     * Checks if the index exists in the List
     * @param {Number} index 
     */
    has(index){
        if(this.isEmpty()) return false;
        return typeof this.prev[index] !== "undefined" && typeof this.next[index] !== "undefined";
    }

    /**
     * Insert an index to the list in between to indices
     * @param {Number} prev 
     * @param {Number} index 
     * @param {Number} next 
     */
    insert(prev, index, next){
        if(this.has(index) && 
            (this.has(prev) || prev === this.sentinel) && 
            (this.has(next) || next === this.sentinel) &&
            index !== this.sentinel){

            this.prev[next] = index;
            this.next[prev] = index;

            this.next[index] = next;
            this.prev[index] = prev;
        }
        return this;
    }

    /**
     * Removes an index from the list
     */
    remove(index){
        if(!this.isEmpty() && this.has(index)){
            this.prev[this.next[index]] = this.prev[index];
            this.next[this.prev[index]] = this.next[index];
        }
        return this;
    }

    /**
     * Push an index to the head of the list
     * @param {Number} index 
     */
    pushHead(index){
        return this.insert(this.head, index, this.sentinel);
    }

    /**
     * Push an index to the tail of the list
     * @param {Number} index
     */
    pushTail(index){
        return this.insert(this.sentinel, index, this.tail);
    }

    /**
     * Removes the head of the list (this shifts a new head.)
     */
    popHead(){
        if(this.isEmpty()) return this;
        return this.remove(this.head);
    }

    /**
     * Removes the tail of the list (this shifts a new tail.)
     */
    popTail(){
        if(this.isEmpty()) return this;
        return this.remove(this.tail);
    }

    /**
     * Iterates the list
     * @param {Function} e - the handler function where indices will be passed.
     * @param {Boolean} h2t - Optional. if true, the list iterates from head to tail, else tail to head. (default: true) 
     */
    forEach(e, h2t = true){
        if(!this.isEmpty()){
            let n = h2t ? this.head : this.tail;
            while(n !== this.sentinel){
                e(n);
                n = h2t ? this.next[n] : this.prev[n];
            }
        }
        return this;
    }

    /**
     * Empty the list
     */
    empty(){
        if(this.isEmpty()) return this;
        return this.forEach(e => this.remove(e));
    }

    /**
     * Swaps the position of two indices
     * @param {Number} index1 
     * @param {Number} index2 
     */
    swap(index1, index2){
        if(!this.isEmpty() && this.has(index1) && this.has(index2)){
            let next1 = this.next[index1];
            let next2 = this.next[index2];
            let prev1 = this.prev[index1];
            let prev2 = this.prev[index2];

            this.next[index1] = next2;
            this.next[index2] = next1;

            this.prev[index1] = prev2;
            this.prev[index2] = prev1;
        }
        return this;
    }

    /**
     * Rotates the indeces in the list
     * @param {*} goNext - if true, puts the head index to the tail, else puts the tail to the head.
     */
    rotate(goNext){
        if(goNext){
            let head = this.head;
            return this.popHead().pushTail(head);
        }
        let tail = this.tail;
        return this.popTail().pushHead(tail);
    }

    /**
     * Copy the list indeces to another list
     * @param {List} list 
     * @param {Boolean} reverse - if true, the elements are added from head to tail, else tail to head
     */
    copyTo(list, reverse = false){
        if(!this.isEmpty()){
            this.forEach(e => {
                list.pushHead(e);
            }, !reverse);
        }
        return this;
    }

    /**
     * Copies the list
     * @param {Boolean} reverse - if true, the copied list is reversed
     */
    copy(reverse = false){
        let n = new List(this.sentinel);
        if(!this.isEmpty()){
            this.copyTo(n, reverse);
        }
        return n;
    }

    /**
     * Concats two lists to form a new list.
     * @param {List} list 
     * @param {Number} sentinel - the sentinel of the new list
     * @param {Boolean} reverse - if true, the new list is reversed. 
     */
    concat(list, sentinel = this.sentinel, reverse = false){
        let n = new List(sentinel);
        if(reverse){
            list.copyTo(n, reverse);
            this.copyTo(n, reverse);
        } else {
            this.copyTo(n);
            list.copyTo(n);
        }
        return n;
    }


    /**
     * Checks if every indices passes a check
     * @param {Function} hn - a Boolean function that checks each index 
     */
    every(hn){
        if(this.isEmpty()) return false;

        let b = true;
        this.forEach(e =>{
            b = b && hn(e);
        });
        return b;
    }

    /**
     * Checks if some indices passes a check
     * @param {Function} hn - a Boolean function that checks each index 
     */
    some(hn){
        if(this.isEmpty()) return false;

        let b = false;
        this.forEach(e =>{
            b = b || hn(e);
        });
        return b;
    }

    /**
     * Filters the list's indices
     * @param {Function} hn 
     * @param {Boolean} reverse 
     */
    filter(hn, reverse = false){
        let n = new List(this.sentinel);
        if(!this.isEmpty()){
            this.forEach(e =>{
                if(hn){
                    n.pushHead(e);
                }
            }, !reverse);
        } return n;
    }

    /**
     * Finds the first instance of the index that passes the check and returns it.
     * @param {Function} hn 
     * @param {Boolean} reverse 
     */
    find(hn, reverse = false){
        if(!this.isEmpty()){
            this.forEach(e => {
                if(hn(e)){
                    return e;
                }
            }, !reverse);
        }
        return undefined;
    }
}