var PI_2 = Math.PI * 2.0;
var BUFFER_SIZE = 1024;
var SAMPLE_RATE = 44100;

// The main audio engine
// Our wrapper around the WebAudio API
function AudioEngine() {
    var cycle = 0;
    var nodes = [];
    var currentTime = 0;
    var state = 'stopped';
    var ctx = new AudioContext();   
    var gain = ctx.createGain();
    var processor = ctx.createScriptProcessor(BUFFER_SIZE, 1, 1);
    processor.connect(gain);
    gain.gain.value = 0.4;
    processor.onaudioprocess = function(event) {
        for(var i = 0; i < event.outputBuffer.numberOfChannels; i++) {
            var output = event.outputBuffer.getChannelData(i);
            for(var j = 0; j < output.length; j++) output[j] = 0;
        }
        
        if(event.outputBuffer.numberOfChannels > 0) {            
            for(var i = 0; i < nodes.length; i++) {
                nodes[i].process(event.outputBuffer, cycle);
            }
        }
        
        currentTime = (cycle * BUFFER_SIZE) / SAMPLE_RATE;
        cycle += 1;
    };

    return {
        ctx : ctx,
        processor : processor,
        getAmplitude : function() {
            return gain.gain.value;
        },
        getCurrentTime : function() { 
            return currentTime; 
        },
        getState : function() {
            return state;
        },
        connect : function(node) {
            nodes.push(node);
        },
        pause : function() {
            switch(state) {
                case "started":
                    state = "paused";
                    gain.disconnect(ctx.destination);
                    break;
            }
        }, 
        setAmplitude : function(value) {
            gain.gain.value = Math.min(Math.max(0, value), 1.0);
        },
        shutdown : function() {
            ctx.close();
        }, 
        start : function() {
            switch(state) {
                case 'stopped':
                case 'paused':
                    state = 'started';
                    gain.connect(ctx.destination);
                break;
            }
        },
        stop : function() {
            switch(state) {
                case 'started':
                case 'paused':
                    cycle = 0;
                    currentTime = 0;
                    state = 'stopped';
                    gain.disconnect(ctx.destination);
                    for(var i in nodes) { nodes[i].reset() }
                break;
            }
        }
    };
}

// An (n) step, sequencer capable of playing sample accurate audio
function StepSequencer() {
    var tempo = 80.0;
    var steps = 32;
    var step = 0;
    var voices = {};
    var voiceId = 0;
    var sourceId = 0;
    var sources = {};
    return {
        addVoice : function(buffer, name) {
            var toggles = [];
            voices[voiceId] = SequencerVoice(voiceId, buffer, name, steps);
            voiceId++;
        },
        enableVoiceAtStep : function(id, step, enable) {
            if(voices[id]) {
                voices[id].toggles[step] = enable ? 1 : 0;
            }
        },
        enableVoice : function(id, enable) {
            if(voices[id]) {
                voices[id].enabled = enable;
            }
        },
        enableVoiceAtSteps : function(id, values) {
            if(voices[id]) {
                for(var i = 0; i < values.length; i++) {
                    if(i <= voices[id].toggles.length) {
                        voices[id].toggles[i] = values[i];
                    }
                } 
            }    
        },
        getCurrentStep : function() {
            return step - 1;
        },
        getSteps : function() {
            return steps;
        },
        getTempo : function() {
            return tempo;
        },
        getVoices : function() {
            return voices;
        },
        process : function(outputBuffer, cycle) {
            // check the current step and add sources if we are on a 16th note
            var stepInterval = Math.round(SAMPLE_RATE * 60.0 / tempo / 4);
            if(outputBuffer.numberOfChannels) {
                var bufferSize = outputBuffer.getChannelData(0).length;
                var startSampleIndex = bufferSize * cycle;
                for(var i = 0; i < bufferSize; i++) {
                    if((startSampleIndex + i) % stepInterval == 0) {
                        var currentStep = step++ % steps;
                        for(var j in voices) {
                            var voice = voices[j];
                            if(voice.enabled && currentStep < voice.toggles.length) {
                                if(voice.toggles[currentStep]) {
                                    var source = SequencerSource(sourceId, startSampleIndex + i, voice.buffer);
                                    sources[sourceId] = source;
                                    sourceId++;
                                }
                            }
                        }
                    }
                }
            }
            
            for(var i in sources) {
                if(sources[i].isComplete()) {
                    delete sources[i];
                }else{
                    sources[i].process(outputBuffer, cycle);
                }
            }
        }, 
        reset : function() {
            step = 0;
            sourceId = 0;
            for(var i in sources) delete sources[i]; 
        },
        setSteps : function(newSteps) {
            steps = newSteps;
        },
        setTempo : function (newTempo) { 
            tempo = Math.min(Math.max(30, newTempo), 480)
        }
    }
}

// Container for loaded audio files
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

// An object used breifly as a playhead over a buffer
// These objects are created on the fly and destroyed as soon as their playback is complete
// TODO: Currently a sequencer source is only capable of playing back samples from an audio buffer
// Would be cool if this object represented a more generic sound source so that it could 
// provide audio data from a custom algorithmic source
function SequencerSource(id, startPosition, buffer) {
    var id = id;
    var index = 0;
    var buffer = buffer; 
    var start = startPosition; 

    return {
        id : id,
        process : function(outputBuffer, cycle) {
            var indexStart = index;
            var sampleStartIndex = BUFFER_SIZE * cycle;
            for(var i = 0; i < outputBuffer.numberOfChannels; i++) {
                var input = buffer.getChannelData(i);
                var output = outputBuffer.getChannelData(i);
                index = indexStart;
                for(var j = 0; j < BUFFER_SIZE; j++) {
                    if(sampleStartIndex + j >= start) {
                        if(index < buffer.length) {
                            output[j] += input[index]
                            index++;
                        }
                    }
                }
            }
        },
        isComplete : function() {
            return index >= buffer.length;
        }
    }
} 

// Represents a row in the step sequencer 
function SequencerVoice(id, buffer, name, steps) {
    var toggles = Array(steps).fill(0); 
    return {
        buffer : buffer,
        enabled : true,
        id : id,
        name : name, 
        toggles : toggles
    }
}

// Test class, creates droning oscillations
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

// Test class can be used as trem effect on drone
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






