export function createUnsorted(len, arrayType, type, asc, modulo){
    let a = new arrayType(len);
    if(type === "unique" || type === "semiunique"){  
        let b = [];

        /**
         * Generate the data
         */
        for(let i = 0; i < len; i++){
            b[i] = i + 1;
        }

        let c = 0;
        /**
         * Shuffles the unique data
         */
        while(b.length > 0){
            let rand = Math.floor(Math.random()*b.length);
            a[c++] = b[rand] - (type === "semiunique" ? (b[rand] % modulo) : 0) ;
            b.splice(rand, 1);
        }
    } else if (type === "almost"){

        /**
         * Generate the data
         */
        if(asc){
            for(let i = 0; i < len; i++){
                a[i] = i + 1;
            }
        } else {
            for(let i = len; i > 0; i--){
                a[len - i] = i;
            }
        }
        let rand = Math.floor(Math.random()*len);
        let rand2 = Math.floor(Math.random()*len);
        let tmp = a[rand];
        a[rand] = a[rand2];
        a[rand2] = tmp;
    } else if (type === "reversed"){

        if(asc){
            for(let i = len; i > 0; i--){
                a[len - i] = i;
            }
        } else {
            for(let i = 0; i < len; i++){
                a[i] = i + 1;
            }
        }
    }
    return a;
}
