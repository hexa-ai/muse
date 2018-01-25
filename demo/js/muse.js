window.addEventListener('load', function() {
  // ---------------------------------------------------------------- 
  // Setup the Audio Engine
  var engine = AudioEngine();
  var sequencer = StepSequencer();
  var sequencerUIs = [];
  var compositionId = 0;
  var sequenceId = 0;
  engine.connect(sequencer);

  // Create a new sample bank
  var sampleBank = new SampleBank(engine.ctx);
  sampleBank.loadAll(beatbox['voices'], function success() {
    var voices = beatbox['voices'];
    var sequenceName = beatbox['name'];
    sequenceId++;

  // Add voices to the sequencer
  // Use a special voice-id property as a key for the voice
  // This id is a the name of the voice + the sequence id
    var voiceIds = [];
    for (var voice in voices) {
      var voiceName = voices[voice]['name'];
      var voiceId = voiceName + '-' + sequenceId;
      voices[voice]['voiceId'] = voiceId;
      voiceIds.push(voiceId);
      sequencer.addVoice(voiceId, voiceName, sampleBank.samples[voiceName])
    }

    // Create the new sequencer UI 
    sequencerUIs.push(
      new SequencerUI(
        document.getElementById('sequencer'), 
        sequencer, sequenceName, voices)
    );
  });

  // ---------------------------------------------------------------- 
  // UI Handlers
  var playButton = document.getElementById("play-stop-btn");
  playButton.addEventListener("click", function(event) {
    switch(engine.getState()) {
      case 'started':
        engine.stop();
        playButton.value = 'Play';
        break;
      case 'stopped':
        engine.start();
        playButton.value = 'Stop';
        break;
    }
  });

  var tempoSlider = document.getElementById("tempo-slider");
  tempoSlider.addEventListener("input", function(event) {
    sequencer.setTempo(tempoSlider.value);
  });

  var volumeSlider = document.getElementById("volume-slider");
  volumeSlider.addEventListener("input", function(event) {
    engine.setAmplitude(volumeSlider.value);
  });

  function updateInfo() {
    requestAnimationFrame(updateInfo);
    var t = engine.getCurrentTime();
    var currentStep = sequencer.getCurrentStep();
    var totalSteps = sequencer.getSteps();
    var div = document.getElementById('info');
    var quaterNote =  1 + Math.floor(currentStep / 4) % 4;
    var measure = 1 + Math.floor(currentStep / 16);
    div.innerHTML = "Current Time: " + 
      parseFloat(t).toFixed(2) + 
      "<br/>Tempo: " + sequencer.getTempo() + 
      "<br/>Steps: " + sequencer.getSteps() +
      "<br/>" + quaterNote +":" +  measure;

    for(var i = 0; i < sequencerUIs.length; i++) {
      sequencerUIs[i].setStep(currentStep % totalSteps);
    }
  }
  updateInfo();
});
// -----------------------------------------------------------
// Data
var beatbox = {
  "name" : "beatbox",
  "type" : "percussion",
  "voices" : [
    {"name" : "Kick", "file" : "./sound/Kick05-Longer.wav"}, 
    {"name" : "Snare", "file" : "./sound/Snare04-Hi-Simmons1.wav"}, 
    {"name" : "Hi-hat", "file" : "./sound/CH.WAV"}, 
    {"name" : "Clap", "file" : "./sound/CP.WAV"}
  ]
};
