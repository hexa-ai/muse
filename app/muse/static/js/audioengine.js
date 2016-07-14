var PI_2 = Math.PI * 2.0;
var BUFFER_SIZE = 1024;
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
    var samples = [];
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
                    samples.push({
                        id : id,
                        buffer : buffer,
                        name : name
                    })
                    if(success) success(samples[id]);
                }, error);
            }
            req.send();
        }
    }
}

// TODO: Currently a sequencer source is only capable of playing back samples from an audio buffer
// Would be cool if this object represented a more generic sound source so that it could 
// provide audio data from a custom algorithmic source
function SequencerSource(startPosition, source) {
    var start = startPosition; 
    var source = source; 
    var index = 0;
    return {
        process : function(channels, cycle) {
            var indexStart = index;
            var sampleStartIndex = BUFFER_SIZE * cycle;
            for(var i = 0; i < channels.length; i++) {
                // TODO: Thre is no certainty here about whether or not the 
                // source and the channels will contain the same number of buffers
                var buffer = source.getChannelData(i);
                index = indexStart;
                for(var j = 0; j < BUFFER_SIZE; j++) {
                    if(sampleStartIndex + j >= start) {
                        if(index < source.length) {
                            // TODO: Look at copyToChannel methods
                            channels[i][j] += buffer[index]
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
                            if(currentStep < voice.toggles.length) {
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
        enableVoiceAtStep : function(id, step, enable) {
            if(id < voices.length && voices[id]) {
                voices[id].toggles[step] = enable ? 1 : 0;
            }
        },
        enableVoiceAtSteps : function(id, values) {
            if(id < voices.length && voices[id]) {
                for(var i = 0; i < values.length; i++) {
                    if(i <= voices[id].toggles.length) {
                        voices[id].toggles[i] = values[i];
                    }
                } 
            }    
        },
        addVoice : function(buffer, name) {
            var toggles = [];
            var id = voices.length;
            for(var i = 0; i < steps; i++) toggles[i] = 0;
            var voice = SequencerVoice(id, buffer, name, toggles);
            voices.push(voice);
        }
    }
}

function AudioEngine() {
    var cycle = 0;
    var nodes = [];
    var currentTime = 0;
    var ctx = new AudioContext();   
    var gain = ctx.createGain();
    var processor = ctx.createScriptProcessor(BUFFER_SIZE, 1, 1);
    processor.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.value = 0.5;
    processor.onaudioprocess = function(event) {
        // CONSIDERATION: Zero out the data and then pass event.outputBuffer to each node
        // rather than the arrays in channels. This could allow for faster copies from buffer to buffer
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
        processor : processor,
        gain : gain,
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
        name : 'Kick 1',
        toggles : [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0]
    }, {
        path: './static/media/sound/Hats04-TickyHi3.wav',
        name : 'Hi-hat',
        toggles : [1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0]
    }, {
        path : './static/media/sound/Snare04-Hi-Simmons1.wav',
        name : 'Snare',
        toggles : [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0]
    }
]

var loadCount = 0;
function onSampleLoadSuccess(sample) {
    loadCount++;
    sequencer.addVoice(sample.buffer, sample.name);
    sequencer.enableVoiceAtSteps(sample.id, files[sample.id].toggles);

    if(loadCount >= files.length) {
        engine.connect(sequencer);
    } else {
        var file = files[loadCount];
        sampleBank.load(file.path, file.name, onSampleLoadSuccess);
    }
}

function onSampleLoadError(error) {
    console.error(error);
} 

sampleBank.load(files[0].path, files[0].name, onSampleLoadSuccess, onSampleLoadError);
