function SequencerUI(container, sequencer, sequenceName, voices) {
    var toggles = [];
    var div = document.createElement('div');
    container.appendChild(div);
    for(var voice in voices) {
        toggles.push([]);
        var voiceName = voices[voice]['name'];
        var voiceId = voices[voice]['voiceId'];
        var toggleDiv = document.createElement('div');
        var labelContainer = document.createElement("div");
        var label = document.createElement("p");
        var toggleDiv = document.createElement("div");
        label.innerHTML = voiceName;
        labelContainer.appendChild(label);
        labelContainer.appendChild(toggleDiv);
        container.appendChild(labelContainer);
        for(var i = 0; i < sequencer.getSteps(); i++) {
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
            toggles[toggles.length-1].push(toggle);
        }
    } 

    return {
        setStep : function(step) {
            for(var i = 0; i < toggles.length; i++) {
                for(var j = 0; j < toggles[i].length; j++) {
                   toggles[i][j].style.boxShadow = (j == step) ? "0px 1px 0px blue" : "0px 0px 0px";
                }
            }
        }
    }
}
