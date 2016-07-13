var PI_2 = Math.PI * 2.0;
var BUFFER_SIZE = 8192;
var SAMPLE_RATE = 44100;

function StepSequencer() {
    var tempo = 30.0;
    var steps = 16;
    var step = 0;
    var sources = {};
    var loader = new AudioSampleLoader();
    var sampleBuffers;
    var kickDrumBuffer;
    var kickDrumBufferLength;
    var toggles = [
    	[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    	[1,0,0,1,1,0,0,1,1,0,0,1,1,0,0,1] //kickdrum
    ];

    var getBufferIndex = function(sampleBufferLength, cycle) {
        var sampleBufferLength = sampleBufferLength; //31311 for testing purposes

        remainder = (cycle * BUFFER_SIZE) % sampleBufferLength;
        chunkToPlay = Math.floor(remainder / BUFFER_SIZE);
        console.log("Remainder: "+remainder, "Chunk: "+chunkToPlay, "Cycle: "+cycle, chunkToPlay * BUFFER_SIZE);
        return chunkToPlay * BUFFER_SIZE;
            //really strange skip from chunk 2 straight to 0 every so often. Can't figure out why....Driving me crazy. 
            //Happens when remainder is in increments of 550, so 550 1100 etc. 
    }

    loader.ctx = engine.ctx;

	loader.src = [
		'audio/brum1.wav',
		'audio/snare1.wav'
	];

	loader.onerror = function() {
		alert("There was a problem");
	}

	loader.onload = function() {
		sampleBuffers = loader.response;
		kickDrumBuffer = sampleBuffers[0].getChannelData(0); // Needs to be more generic, works for testing. 
        kickDrumBufferLength = kickDrumBuffer.length; //Same as line above

	}

loader.send();

    return {

    	ctx: '',
    	name : 'Step Sequencer',
        process : function(channels, cycle) {
            var stepInterval = Math.round(((SAMPLE_RATE * 60.0) / (tempo * steps))); //5513
            if(channels.length) {
                var startSampleIndex = getBufferIndex(kickDrumBufferLength, cycle);
                var output = channels[0];
                for(var i = 0; i < channels[0].length; i++) {
                    if((startSampleIndex + i) % stepInterval == 0) {
                    	if(step == 15) {
                    		step = 0;
                    	} else {
                    		step++;
                    	}
                    }
                    if((startSampleIndex+i)<=kickDrumBufferLength-1) {
                        output[i] = kickDrumBuffer[startSampleIndex + i];
                    } else {
                        continue;
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
        addSource : function(path) {
            var id = sources.length;
            sources[id] = {
                toggles : []
            }
            for(var i = 0; i < steps; i++) sources[id].toggles[i] = 0;
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
        // console.log('Calculated: ' + currentTime + ' Context: ' + ctx.currentTime);
    };

    return {
        ctx : ctx,
        engine : engine,
        getCurrentTime : function() { 
            return currentTime; 
        },
        connect : function(node) {
        	// nodes.push(node);
        	if(node.hasOwnProperty('name')) {
        		if(node.name == 'Step Sequencer') {
        			node.ctx = ctx;
        			nodes.push(node);
        		}
        	} else {
        		nodes.push(node);
        	}
        },
        shutdown : function() {
            ctx.close();
        }
    };
}

var engine = new AudioEngine();
engine.connect(StepSequencer());

