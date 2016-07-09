var BUFFER_SIZE = 256;
var SAMPLE_RATE = 44100;

var step = 0;
var sources = []
var currentTime = 0;
var ctx = new AudioContext();
var source = ctx.createBufferSource();
var engine = ctx.createScriptProcessor(BUFFER_SIZE, 1, 1);

function Drone() {
    var phase = 0;
    var freq = 110.0 + Math.random() * 440.0;
    var freqInc = freq / SAMPLE_RATE;
    
    return {
        process: function(channels) {
            for(var i = 0; i < channels.length; i++) {
                var output = channels[i];
                for(var j = 0; j < output.length; j++) {
                    phase += freqInc;
                    output[j] += Math.sin(phase * Math.PI * 2.0) * 0.01;
                    output[j] += Math.sin(phase * .75 * Math.PI * 2.0) * 0.01;
                    output[j] += Math.sin(phase * .65 * Math.PI * 2.0) * 0.01;
                    output[j] = output[j] > 1.0 ? 0.999 : output[j];
                }
            }
            return channels;
        }
    }
}

engine.onaudioprocess = function(event) {
    var channels = [];
    for(var i = 0; i < event.outputBuffer.numberOfChannels; i++) {
        var output = event.outputBuffer.getChannelData(i);
        for(var j = 0; j < output.length; j++) {
            output[j] = 0;
        }
        channels.push(output);
    }

    for(var i = 0; i < sources.length; i++) {
        channels = sources[i].process(channels);
    }

    step += 1;
    currentTime = (step * BUFFER_SIZE) / SAMPLE_RATE;
    //The calculated time should be the same as ctx.currentTime
    //console.log('Calculated: ' + currentTime + ' Context: ' + ctx.currentTime);
};

sources.push(Drone());
source.connect(engine);
engine.connect(ctx.destination);
source.start(ctx.currentTime);
