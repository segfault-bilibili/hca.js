class pcmPlayer extends AudioWorkletProcessor {
    lastRequestFlushTime = new Date().getTime();
    requestFlushInterval = 200; // in milliseconds
    flushThreshold = 100; // in milliseconds
    streamAudioParam = {
        channelCount: 0,
        sampleRate: 0,
        streamBitDepth: 0,
        sampleSize: 0,
    }
    // array of snippets, a snippet consists of multiple (generally two) channels, a channel consists of 128 samples
    snippets = [];
    constructor (options) {
        super();
        for (let key in options.processorOptions.streamAudioParam) {
            this.streamAudioParam[key] = options.processorOptions.streamAudioParam[key];
        }
        this.port.onmessage = (e) => {
            e.data.forEach((snippet) => this.snippets.push(snippet));
        }
    }
    process(inputs, outputs, parameters) {
        const output = outputs[0];
        let snippet = this.snippets.shift();
        if (snippet != null) {
            for (let c = 0; c < output.length && c < snippet.length; c++) {
                output[c].set(snippet[c]);
            }
        }
        if (this.snippets.length * 128 <= this.flushThreshold / 1000 * this.streamAudioParam.sampleRate) {
            let time = new Date().getTime();
            if (time - this.lastRequestFlushTime > this.requestFlushInterval) {
                this.port.postMessage({cmd: "flush"});
                this.lastRequestFlushTime = time;
            }
        }
        return true;
    }
}
registerProcessor('pcm-player', pcmPlayer);