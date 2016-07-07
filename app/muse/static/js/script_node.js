var ctx = new AudioContext();
var source = ctx.createBufferSource();
var node = ctx.createScriptProcessor(1024, 1, 1);
node.phase = 0;
node.onaudioprocess = function(event) {
    for(var i = 0; i < event.outputBuffer.numberOfChannels; i++) {
        var input = event.inputBuffer.getChannelData(i);
        var output = event.outputBuffer.getChannelData(i);
        for(var j = 0; j < output.length; j++) {
            node.phase += 440.0 / 44100.0;
            output[j] = Math.sin(node.phase * Math.PI * 2.0) * 0.3;
            output[j] += Math.sin(node.phase * .75 * Math.PI * 2.0) * 0.2;
            output[j] += Math.sin(node.phase * .65 * Math.PI * 2.0) * 0.1;
        }
    }
};

node.connect(node);
node.connect(ctx.destination);
source.start(ctx.currentTime);
source.stop();
