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
  var data = instrument_data[0];
  var sampleBank = new SampleBank(engine.ctx);
  sampleBank.loadAll(data['voices'], function success() {
    var voices = data['voices'];
    var sequenceName = data['name'];
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
    var ui = new SequencerUI(document.getElementById('sequencer'), sequencer, sequenceName, voices);
  });

  // ---------------------------------------------------------------- 
  /*
  // SocketIO Handlers
  var socket = io.connect('http://' + document.domain + ':' + location.port);
  socket.on('connect', function() {
      console.log('Connected');
  });

  socket.on('composition_init', function(data) {
      compositionId = compositionId || data['composition_id']; 
  });

  setInterval(function() {
      for(var i = 0; i < sequencerUIs.length; i++) {
          if(sequencerUIs[i].aiToggle.checked) {
              console.log(compositionId);
              socket.emit('request_ai_sequence', {composition_id: compositionId});
          }
      } 
  }, 1000);

  socket.on('response_new_sequence', function(data) {
    // Create a new sample bank
      var sampleBank = new SampleBank(engine.ctx);

    // Load the set of samples
    // Add a callback to handle the successful loading of all samples
      sampleBank.loadAll(data['voices'], 
          function success() {
              var voices = data['voices'];
              var sequenceId = data['_id']['$oid'];
              var sequenceName = data['name'];

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
              var ui = new SequencerUI(document.getElementById('sequencer'), sequencer, sequenceName, voices);

  // Add listeners for save
              ui.saveButton.addEventListener('click', function(event) {
                  var toggleData = "";
                  var voices = sequencer.getVoices(voiceIds);
                  for(var i in voices) {
                      var toggles = voices[i]['toggles']
                      if(toggles) {
                          for(var j in toggles) {
                              toggleData += toggles[j];
                          }
                      }
                  }

                  socket.emit('sequence_data_update', {sequence_id : sequenceId, data : toggleData})
              });

              ui.aiToggle.addEventListener('click', function(event) {
                  socket.emit('sequence_ai_update', {sequence_id : sequenceId, ai : ui.aiToggle.checked});
              });

  // Add listeners for name change
              ui.nameInput.addEventListener('blur', function(event) {
                  var name = event.target.value;
                  if(name != '') {
                      socket.emit('sequence_name_update', {sequence_id : sequenceId, name : event.target.value})
                  }
              });

  // Add to list of sequencer uis
              sequencerUIs.push(ui);
          }, 
          function error() {
              console.log('Error loading sample bank');                         
          }
      ); 
  });
  */

  // ---------------------------------------------------------------- 
  // UI Handlers
  var instrumentSelect = document.getElementById('instrument-select');
  var createInstrumentButton = document.getElementById('create-instrument-btn');

  createInstrumentButton.addEventListener('click', function(event) {
    /*
        socket.emit('request_new_sequence', {
            'composition_id' : compositionId, 
            'instrument' : instrumentSelect.value
        });
        */
  });

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

  var updateButton = document.getElementById('update-models-btn');
  updateButton.addEventListener('click', function(event) {
    //socket.emit('update_models');
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
var instrument_data = [
    {
      "name" : "beatbox",
      "type" : "percussion",
      "voices" : [
        {"name" : "Kick", "file" : "./sound/Kick05-Longer.wav"}, 
        {"name" : "Snare", "file" : "./sound/Snare04-Hi-Simmons1.wav"}, 
        {"name" : "Hi-hat", "file" : "./sound/CH.WAV"}, 
        {"name" : "Clap", "file" : "./sound/CP.WAV"}
      ]
    }, {
    "name" : "saw-bass", 
    "type" : "bass", 
    "voices" : [
        {"name" : "C", "file" : "./sound/saw-bass-c.wav"},
        {"name" : "C#","file" : "./sound/saw-bass-c-sharp.wav"},
        {"name" : "D", "file" : "./sound/saw-bass-d.wav"},
        {"name" : "D#","file" : "./sound/saw-bass-d-sharp.wav"},
        {"name" : "E","file" : "./sound/saw-bass-e.wav"},{
        "name" : "F","file" : "./sound/saw-bass-f.wav"},
        {"name" : "F#","file" : "./sound/saw-bass-f-sharp.wav"},
        {"name" : "G", "file" : "./sound/saw-bass-g.wav"},
        {"name" : "G#", "file" : "./sound/saw-bass-g-sharp.wav"},
        {"name" : "A", "file" : "./sound/saw-bass-a.wav"},
        {"name" : "A#", "file" : "./sound/saw-bass-a-sharp.wav"},
        {"name" : "B", "file" : "./sound/saw-bass-B.wav"}
      ]
    },{
      "name" : "synth-flute", 
      "type" : "flute", 
      "voices" : [
        {"name" : "C", "file" : "./sound/synth-flute-c.wav"},
        {"name" : "C#", "file" : "./sound/synth-flute-c-sharp.wav"},
        {"name" : "D", "file" : "./sound/synth-flute-d.wav"},
        {"name" : "D#", "file" : "./sound/synth-flute-d-sharp.wav"},
        {"name" : "E", "file" : "./sound/synth-flute-e.wav"},
        {"name" : "F", "file" : "./sound/synth-flute-f.wav"},
        {"name" : "F#", "file" : "./sound/synth-flute-f-sharp.wav"},
        {"name" : "G","file" : "./sound/synth-flute-g.wav"},
        {"name" : "G#","file" : "./sound/synth-flute-g-sharp.wav"},
        {"name" : "A","file" : "./sound/synth-flute-a.wav"},
        {"name" : "A#","file" : "./sound/synth-flute-a-sharp.wav"},
        {"name" : "B", "file" : "./sound/synth-flute-B.wav"}
      ]
    }
  ];
