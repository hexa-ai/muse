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
    var source = source; 
    var index = 0;
    return {
        process : function(channels, cycle) {
            var indexStart = index;
            var sampleStartIndex = BUFFER_SIZE * cycle;
            for(var i = 0; i < channels.length; i++) {
                var buffer = source.getChannelData(i);
                index = indexStart;
                for(var j = 0; j < BUFFER_SIZE; j++) {
                    if(sampleStartIndex + j >= start) {
                        if(index < source.length) {
                            // TODO: Look at copyToChannel methods
                            channels[i][j] += buffer[index];
                            index++;
                        }
                    }
                }
            }
        },
        isComplete : function() {
            return index >= source.getChannelData(0).length;
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
    var tempo = 30.0;
    var steps = 16;
    var step = 0;
    var voices = [];
    var sources = [];
    return {
        process : function(channels, cycle) {
            var stepInterval = Math.round(((SAMPLE_RATE * 60.0) / (tempo * steps)));
            if(channels.length) {
                var bufferSize = channels[0].length;
                var startSampleIndex = bufferSize * cycle;
                for(var i = 0; i < bufferSize; i++) {
                    if((startSampleIndex + i) % stepInterval == 0) {
                        var currentStep = step % steps;
                        for(var j = 0; j < voices.length; j++) {
                            var voice = voices[j];
                            if(voice.toggles.length >= currentStep) {
                                if(voice.toggles[currentStep]) {
                                    var source = SequencerSource(startSampleIndex + i, voice.buffer);
                                    sources.push(source);
                                }
                            }
                        }
                        step++; 
                    }
                }
            }

            var completeIndices = [];
            for(var i = 0; i < sources.length; i++) {
                if(!sources[i].isComplete()) {
                    sources[i].process(channels, cycle);
                }else{
                    completeIndices.push(i);
                }
            }

            for(var i = 0; i < completeIndices.length; i++) {
                sources.splice(completeIndices[i], 1);
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
            // TODO: Remove next line
            toggles[0] = true;
            toggles[2] = true;
            toggles[4] = true;
            toggles[5] = true;
            toggles[6] = true;
            toggles[9] = true;
            toggles[11] = true;
            toggles[14] = true;
            voices.push(SequencerVoice(id, buffer, name, toggles));
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
    }
]

for (var i = 0; i < files.length; i++) {
    sampleBank.load(files[i].path, files[i].name, 
    function(sample) {
        sequencer.addVoice(sample.buffer, sample.name);
    }, 
    function(event) {
        console.error('Could not load file: ' + event);
    });
}
engine.connect(sequencer);
