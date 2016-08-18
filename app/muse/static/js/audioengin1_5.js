//Just making some minor adjustments for "best practices"

var PI_2 = Math.PI * 2.0,
	BUFFER_SIZE = 1024,
	SAMPLE_RATE = 44100;

function AudioEngine () {
	var cycle = 0, //Represents every iteration of "onaudioprocess"
		nodes = [],
		currentTime = 0,
		// isRunning = false; A boolean feels more appropriate for setting state
		state = 'stopped',
		ctx = new AudioContext(),
		gainNode = ctx.createGain(),
		processor = ctx.createScriptProcessor(BUFFER_SIZE, 1, 1);

	processor.connect(gain);
	gainNode.gain.value = .4;

	processor.onaudioprocess = function (e) {
		var output;

		for (var i = 0; i < e.outputBuffer.numberOfChannels; i++) {
			output = e.outputBuffer.getChannelData(i);

			for (var i = 0; i < nodes.length; i++) {
				nodes[i].process(e.outputBuffer, cycle);
			}
		}

		currentTime = (cycle * BUFFER_SIZE) / SAMPLE_RATE;
		cycle++;
	};

	return {
		ctx: ctx,

		processor: processor, 

		getAmplitude: function () {
			return gainNode.gain.value;
		},

		getCurrentTime: function () {
			return state;
		},

		getState: function () {
			return state;
		},

		connect: function (node) {
			nodes.push(node);
		},

		pause: function () {
			switch (state) {
				case "started":
					state = "paused";
					gainNode.disconnect(ctx.destination);
					break;
			}
		}, 

		setAmplitude: function (value) {
			gainNode.gain.value = Math.min(Math.max(0, value), 1.0);
		},

		shutdown: function () {
			ctx.close();
		}

		start: function () {
			switch (state) {
				case 'started':
				case 'paused':
					cycle = 0;
					currentTime = 0;
					state = 'stopped';
					gainNode.disconnect(ctx.destination);
					nodes.map(function (node){ node.reset(); });
				break;
			}
		}
	};
}