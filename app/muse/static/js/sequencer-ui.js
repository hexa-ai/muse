function SequencerUI(container, sequencer, sequenceName, voices) {
    var toggles = {};
    var div = document.createElement('div');
    container.appendChild(div);
    for(var voice in voices) {
        var voiceName = voices[voice]['name'];
        var voiceId = voices[voice]['voiceId'];
        var toggleDiv = document.createElement('div');
        toggles[voiceName] = Array(sequencer.getSteps()).fill(0);
        var labelContainer = document.createElement("div");
        var label = document.createElement("p");
        var toggleDiv = document.createElement("div");
        label.innerHTML = voiceName;
        labelContainer.appendChild(label);
        labelContainer.appendChild(toggleDiv);
        container.appendChild(labelContainer);
        for(var i = 0; i < toggles[voiceName].length; i++) {
            var toggle = document.createElement("input");
            toggle.type = "checkbox";
            toggle.voiceId = voiceId;
            toggle.index = i;
            toggle.addEventListener('change', function(event) {
                var toggle = event.target;
                sequencer.enableVoiceAtStep(
                    toggle.voiceId, toggle.index, toggle.checked);
            });               
            toggleDiv.appendChild(toggle);
        }
    }
}
