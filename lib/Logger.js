class Logger {
    constructor(verbose) {
        this.verbose = verbose;
    }
    log() {
        if (this.verbose) {
            for (let i = 0, l = arguments.length; i < l; ++i) {
                if (i > 0) console.log(" ");
                console.log(arguments[i]);
            }
        }
    }
}

module.exports = Logger;