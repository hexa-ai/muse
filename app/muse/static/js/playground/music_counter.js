var PI_2 = Math.PI * 2.0;
var BUFFER_SIZE = 8192;
var SAMPLE_RATE = 44100;

function StepSequencer() {
	var ctx;
    var tempo = 30.0;
    // var tempo = 90.0;

    var steps = 16;
    var step = 0;
    // var stepCounter = 0;
    var sources = {};
    var loader = new AudioSampleLoader();
    var sampleBuffers;
    // var playHead = 0;
    var toggles = [
    	[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    	[1,0,0,1,1,0,0,1,1,0,0,1,1,0,0,1] //kickdrum
    ];
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
		// console.log(sampleBuffers);
	}

loader.send();

    return {

    	ctx: '',
    	name : 'Step Sequencer',
        process : function(channels, cycle) {
        	var testBuffer = this.ctx.createBufferSource();
        	var testBuffer2 = this.ctx.createBufferSource();
            var stepInterval = Math.round(((SAMPLE_RATE * 60.0) / (tempo * steps))); //5513
            


            if(channels.length) {
                var bufferSize = channels[0].length;
                var startSampleIndex = bufferSize * cycle;
                var tempBuffer;
                var output = channels[0];
                var tempBuffer = sampleBuffers[0].getChannelData(0);
                for(var i = 0; i < channels[0].length; i++) {
                    if((startSampleIndex + i) % stepInterval == 0) {
                    	console.log(step);
                    	if(step == 15) {
                    		step = 0;
                    	} else {
                    		step++;
                    	}
                    }
                 //    if((startSampleIndex+i)==tempBuffer.length - 1) {
                 //    	startSampleIndex = 0;
                 //    	continue;
                 //    } else {
                 //    	output[i] = tempBuffer[startSampleIndex+i];
                	// }
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
                nodes[i].process(channels, cycle, ctx);
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
        			console.log(node);
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

