var BUFFER_SIZE = 8192;
var step = 0;
var sources = []
var currentTime = 0;
var samplesPerSecond = 44100;
var ctx = new AudioContext();
var source = ctx.createBufferSource();
var engine = ctx.createScriptProcessor(BUFFER_SIZE, 1, 1);

function Drone() {
    var phase = 0;
    var freq = 110.0 + Math.random() * 440.0;
    var freqInc = freq / samplesPerSecond;
    
    return {
        process: function(output) {
            for(var i = 0; i < output.numberOfChannels; i++) {
                var input = event.inputBuffer.getChannelData(i);
                var output = event.outputBuffer.getChannelData(i);
                for(var j = 0; j < output.length; j++) {
                    phase += freqInc;
                    output[j] = Math.sin(phase * Math.PI * 2.0) * 0.1;
                    //output[j] += Math.sin(phase * .75 * Math.PI * 2.0) * 0.1;
                    //output[j] += Math.sin(phase * .65 * Math.PI * 2.0) * 0.1;
                }
            } 
            return output;
        }
    }
}

engine.onaudioprocess = function(event) {
    var input = event.inputBuffer;
    var output = event.outputBuffer;
    for(var i = 0; i < sources.length; i++) {
        output = sources[i].process(output);
    }
    step += 1;
    currentTime = (step * BUFFER_SIZE) / samplesPerSecond;
    //The calculated time should be the same as ctx.currentTime
    //console.log('Calculated: ' + currentTime + ' Context: ' + ctx.currentTime);
};

sources.push(Drone());
source.connect(engine);
engine.connect(ctx.destination);
source.start(ctx.currentTime);
