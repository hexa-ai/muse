var PI_2 = Math.PI * 2.0;
var BUFFER_SIZE = 8192;
var SAMPLE_RATE = 44100;

function Drone(Hz) {
    var nodes = [];
    var phase = 0;
    var freq = Hz || 110.0 + Math.random() * 440.0;
    var freqInc = freq / SAMPLE_RATE;
    return {
        process: function(channels, step) {
            for(var i = 0; i < channels.length; i++) {
                var output = channels[i];
                for(var j = 0; j < output.length; j++) {
                    phase += freqInc;
                    output[j] += Math.sin(phase * PI_2) * 0.025;
                    output[j] += Math.sin(phase * .75 * PI_2) * 0.025;
                    output[j] += Math.sin(phase * .65 * Math.PI) * 0.025;
                    output[j] = output[j] > 1.0 ? 0.999 : output[j];
                }
            }

            for(var node in nodes) {
                nodes[node].process(channels, step);
            }
        },
        connect: function(node) {
           nodes.push(node);
           return this;
        }
    }
}

function Tremelo() {
    var freq = 3.5;
    var phase = 0.0;
    var freqInc = freq / SAMPLE_RATE;
    return {
        process : function(channels, step) {
            for(var i = 0; i < channels.length; i++) {
                var output = channels[i];
                for(var j = 0; j < output.length; j++) {
                    phase += freqInc;
                    output[j] *= Math.abs(Math.sin(phase * PI_2));
                }
            }     
        }
    }
}

function Sequencer() {
    var tempo = 94.0;
    var steps = 16;
    return {
        process : function(channels, step) {
            var stepInterval = ((SAMPLE_RATE * 60.0) / (steps * 4));
            if(channels.length) {
                var bufferSize = channels[0].length;
                var startSampleIndex = bufferSize * step;
                for(var i = 0; i < channels[0].length; i++) {
                    
                }
            }
        }, 
        setSteps : function(newSteps) {
            steps = newSteps;
        },
        setTempo : function (newTempo) { 
            tempo = Math.min(Math.max(1, newTempo), 480)
        },

        loadSample : function(path) {

        }
    }
}

function AudioEngine() {
    var step = 0;
    var nodes = [];
    var currentTime = 0;
    var ctx = new AudioContext();   
    var processor = ctx.createScriptProcessor(BUFFER_SIZE, 1, 1);
    processor.connect(ctx.destination);

    processor.onaudioprocess = function(event) {
        var channels = [];
        for(var i = 0; i < event.outputBuffer.numberOfChannels; i++) {
            var output = event.outputBuffer.getChannelData(i);
            for(var j = 0; j < output.length; j++) output[j] = 0;
                channels.push(output);
        }
        
        if(channels.length >= 1) {            
            for(var i = 0; i < nodes.length; i++) {
                nodes[i].process(channels, step);
            }
        }
        
        step += 1;
        currentTime = (step * BUFFER_SIZE) / SAMPLE_RATE;
        //The calculated time should be the same as ctx.currentTime
        //console.log('Calculated: ' + currentTime + ' Context: ' + ctx.currentTime);
    };

    return {
        ctx : ctx,
        engine : engine,
        getCurrentTime : function() { 
            return currentTime; 
        },
        connect : function(node) {
            nodes.push(node);
        },
        shutdown : function() {
            ctx.close();
        }
    };
}

var engine = AudioEngine();
engine.connect(
    Drone().connect(
        Tremelo()));
engine.connect(
    Drone(500));
engine.connect(Sequencer());
