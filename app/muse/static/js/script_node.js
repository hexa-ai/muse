var PI_2 = Math.PI * 2.0;
var BUFFER_SIZE = 8192;
var SAMPLE_RATE = 44100;

function Drone(Hz) {
    var nodes = [];
    var phase = 0;
    var freq = Hz || 110.0 + Math.random() * 440.0;
    var freqInc = freq / SAMPLE_RATE;
    return {
        process: function(channels, cycle) {
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
                nodes[node].process(channels, cycle);
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
        process : function(channels, cycle) {
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

function SampleBank(ctx) {
    var samples = {};
    return {
        samples : samples,
        // TODO: Handle all possible error cases
        load : function(url, name, success, error) {
            var req = new XMLHttpRequest();
            req.open('GET', url, true);
            req.responseType = 'arraybuffer';
            req.onload = function() {
                ctx.decodeAudioData(req.response, function(buffer) {
                    var id = samples.length;
                    samples[id] = {
                        id : id,
                        buffer : buffer,
                        name : name
                    }
                    if(success) success(samples[id]);
                }, error);
            }
            req.send();
        }
    }
}

function SequencerSource(startPosition, source) {
    var start = startPosition; 
    var source = audioBuffer; 
    var playhead = 0;
    return {
        process : function(channels, cycle) {
              
        }
    }
}

function SequencerVoice(id, buffer, name, toggles) {
    return {
        buffer : buffer,
        id : id,
        name : name, 
        toggles : toggles
    }
}

function StepSequencer() {
    var tempo = 60.0;
    var steps = 16;
    var step = 0;
    var voices = [];

    return {
        process : function(channels, cycle) {
            var stepInterval = Math.round(((SAMPLE_RATE * 60.0) / (tempo * steps)));
            if(channels.length) {
                var bufferSize = channels[0].length;
                var startSampleIndex = bufferSize * step;
                
                for(var i = 0; i < channels[0].length; i++) {
                    if((startSampleIndex + i) % stepInterval == 0) {
                        // This is where we should add a new source
                        //console.log(step);
                    }
                }
            }
        }, 
        setSteps : function(newSteps) {
            steps = newSteps;
            // resize the toggle arrays
        },
        setTempo : function (newTempo) { 
            tempo = Math.min(Math.max(1, newTempo), 480)
        },
        addVoice : function(buffer, name) {
            var toggles = [];
            var id = voices.length;
            for(var i = 0; i < steps; i++) toggles[i] = 0;
            voices.push(Voice(id, buffer, name, toggles));
            console.log(voices[id]);
        }
    }
}

function AudioEngine() {
    var cycle = 0;
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
                nodes[i].process(channels, cycle);
            }
        }
        
        cycle += 1;
        currentTime = (cycle * BUFFER_SIZE) / SAMPLE_RATE;
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
var sequencer = StepSequencer();
var sampleBank = SampleBank(engine.ctx);
var files = [ {
        path : './static/media/sound/Kick05-Longer.wav',
        name : 'Kick 1'
    }, {
        path : './static/media/sound/INTENTIONAL_ERROR.wav',
        name : 'Kick 2' 
    }
]

for (var i = 0; i < files.length; i++) {
    sampleBank.load(files[i].path, files[i].name, function(sample) {
       sequencer.addVoice(sample.buffer, sample.name);
    }, function(event) {
        console.error('Could not load file: ' + event);
    });
}

engine.connect(sequencer);
