const STEP_WIDTH  = 75,
	  STEP_HEIGHT = 300;

/*--------Sequencer Object---------*/

/* @param steps: Number of steps the sequencer should have
 * @param canvasId: Name of the Id given to the canvas element
 */ 

function Sequencer(steps, canvasId) {
	this.numSteps 	 		= steps || 12; //
	this.steps 	  	 		= []; // Array containing each of the step objects in the sequencer
	this.context	 		= []; //Eventually this will hold the steps to use in the suggestion algorithm
	this.currentStep 		= null; //Current step in the sequence
	this.sequencerInterface = new SequencerInterface(canvasId, this);
	this.stepTime			= 500; //More appropriate name
	this.isStarted 			= false; //Identifies if the sequencer has been started
	this.buildSteps(); //Initializes each of the steps in the sequencer, and populates steps array
}

/**
 * Builds each Step object, and populates the 
 * sequencer's step array with each step
 */
Sequencer.prototype.buildSteps = function() {
	var i,
		l  = this.numSteps; //Number of steps in the sequencer

	for(i = 0; i < l; i++) {
		this.steps.push(this.buildStep(i)); // i becomes the index in the sequence of the step
		if(!i) { //If first step, step becomes the current step. Only happens during intitial build
			this.currentStep   = this.steps[i];
			this.isCurrentStep = true; 
		}
	}
}

/**
 * Builds each individual Step object using the Step prototype
 * initializes the Step's indexInSequence property. Passes sequencer
 * object (this) to the step to so the step object can reference it. 
 * @param indexInSequence: Index in array containing steps
 * @return step: Step object
 */
Sequencer.prototype.buildStep = function(indexInSequence) {
	return (new Step(indexInSequence, this)); //Returns a step object, passing in it's index in sequence,
}											  //and sequencer object

/**
 * Starts the sequencer. Method is called by the 'click' event attached to 
 * an element with an Id of 'start'. This occurs in the SequencerInterface object
 * instantiation. Once started, incrementStep is called in intervals determined by 'stepTime' 
 * property.
 */
Sequencer.prototype.startSequence = function() {
	this.isStarted = true;
	setInterval(this.incrementStep.bind(this), this.stepTime); 
}													

/**
 * Changes currentStep property of Sequencer to point to the 
 * next step in the sequence. If it is pointed at the last step
 * in the sequence, currentStep is set to the first step
 */
Sequencer.prototype.incrementStep = function() {
	if(this.currentStep.indexInSequence == this.numSteps - 1) {
		this.currentStep = this.steps[0];
	} else {
		this.currentStep = this.steps[this.currentStep.indexInSequence + 1];
	}
}

/*--------Step Object-----------*/

/**
 *@param indexInSequence: Where the step is in the sequence
 *@param sequence: Step object composed of Sequencer object
 */
function Step(indexInSequence, sequencer) {
	this.sequencer 		 = sequencer;
	this.width  		 = STEP_WIDTH;  //75px
	this.height 		 = STEP_HEIGHT; //300px
	this.xOffset		 = 0; //Offset from left side of canvas
	this.indexInSequence = indexInSequence;
	this.toneCoordinates = []; //Contains the x, and y offsets in canvas for the tone locations
	this.isCurrentStep   = false;
	this.tones = [ // Tones either selected (true) or not (false)
		false,
		false,
		false,
		false,
		false,
	];
	//Increments x offset of current step being built by step width, if not first step
	if(this.indexInSequence !== 0) {
		this.xOffset = this.indexInSequence * this.width;
	}
}

/**
 * UP FOR REFACTORING
 * I really don't like how isCurrentStep is set up. Should be a property 
 * of the step being changed, not a SequencerInterface
 */
Step.prototype.draw = function(ctx, isCurrentStep) { //remove isCurrentStep parameter here
	var l = this.tones.length,      
		i,
		x = this.xOffset + (this.width/2),
		y,
		radius 		  	= 25,
		startAngle 	  	= 0,
		endAngle	  	= Math.PI * 2,
		anticlockwise 	= false;

	ctx.fillStyle = '#2ecc71';

	if(this.sequencer.sequencerInterface.isCurrentStep&&this.sequencer.isStarted) { //Change first isCurrentStep Parameter here
		ctx.fillRect(this.xOffset, 0, this.width, this.height);
	} else {
		ctx.clearRect(this.xOffset, 0, this.width, this.height);
	}
	
	for(i = 0; i < l; i++) {
		y = (i * this.height / l) + (this.height / 5 / 2);
		this.toneCoordinates[i] = {x: this.xOffset, y: y - (this.height / 5 / 2)}; 

		ctx.beginPath();
		ctx.arc(x, y, radius, startAngle, endAngle, anticlockwise);
		if(this.tones[i]) {
			ctx.fill();
		} else {
			ctx.stroke();
		}
	}

	this.sequencer.sequencerInterface.isCurrentStep = false; //Change current step parameter here
}

Step.prototype.contains = function(x, y) {
	var coord,
		i,
		l = this.tones.length;

	for(i = 0; i < l; i++) {
		coord = this.toneCoordinates[i];

		if(coord.x <= x && (coord.x + this.width >= x) &&
		  (coord.y <= y) && (coord.y + (this.height/5) >= y)) {
			return {isTone: true, tone: i};
		} 
	}
	return {isTone: false};
}

/*----Interface-----*/

function SequencerInterface(canvasId, inSequencer) {
		this.sequencer   = inSequencer;
		this.canvas	= document.getElementById(canvasId);
		this.ctx 	= this.canvas.getContext('2d');
		this.width	= this.canvas.width;
		this.height	= this.canvas.height;
		this.ctx 	= this.canvas.getContext('2d');
		this.isCurrentStep = false;

	var stylePaddingLeft, 
		stylePaddingTop, 
		styleBorderLeft, 
		styleBorderTop;

  	if (document.defaultView && document.defaultView.getComputedStyle) {
	    this.stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(this.canvas, null)['paddingLeft'], 10)      || 0;
	    this.stylePaddingTop  = parseInt(document.defaultView.getComputedStyle(this.canvas, null)['paddingTop'], 10)       || 0;
	    this.styleBorderLeft  = parseInt(document.defaultView.getComputedStyle(this.canvas, null)['borderLeftWidth'], 10)  || 0;
	    this.styleBorderTop   = parseInt(document.defaultView.getComputedStyle(this.canvas, null)['borderTopWidth'], 10)   || 0;
  	}

  	var html 		  = document.body.parentNode;
  		this.htmlTop  = html.offsetTop;
  		this.htmlLeft = html.offsetLeft;

  	var myState    	  = this;
  		this.valid 	  = false;
  		this.interval = 30;

  	this.canvas.addEventListener('selectstart', function(e) { e.preventDefault(); return false; }, false);
  	this.canvas.addEventListener('mousedown', this.toggleTone.bind(this), false);
  	start.addEventListener('click', this.sequencer.startSequence.bind(this.sequencer), false);

  	setInterval(function() { myState.draw(); }, myState.interval);
}

SequencerInterface.prototype.toggleTone = function(e) {
	var mouse 	  = this.getMouse(e),
		mx	   	  = mouse.x,
		my    	  = mouse.y,
		l 	  	  = this.sequencer.numSteps,
		contains,
		i;

	for(i = 0; i < l; i++) {
		contains = this.sequencer.steps[i].contains(mx,my);
		if(contains.isTone) {
			if(this.sequencer.steps[i].tones[contains.tone]) {
				this.sequencer.steps[i].tones[contains.tone] = false;
			} else if(!this.sequencer.steps[i].tones[contains.tone]) {
				this.sequencer.steps[i].tones[contains.tone] = true;
			}		
		}
	}
}

SequencerInterface.prototype.getMouse = function(e) {
	var element = this.canvas,
	    offsetX = 0,
	    offsetY = 0,
	    mx,
	    my;

	if (element.offsetParent !== undefined) {
	    do {
	      offsetX += element.offsetLeft;
	      offsetY += element.offsetTop;
	    } while ((element = element.offsetParent));
  	}

  	offsetX += this.stylePaddingLeft + this.styleBorderLeft + this.htmlLeft;
  	offsetY += this.stylePaddingTop + this.styleBorderTop + this.htmlTop;

  	mx = e.pageX - offsetX;
  	my = e.pageY - offsetY;

  	return {x: mx, y: my};
}

SequencerInterface.prototype.draw = function() {
	if(!this.valid) {
		this.clear();

		var l = this.sequencer.numSteps,
			i;

		for(i = 0; i < l; i++) {
			if(this.sequencer.currentStep.indexInSequence == i) {
				this.isCurrentStep = true; //Set individual step boolean here
			}
			this.sequencer.steps[i].draw(this.ctx, this.isCurrentStep); //remove second argument here
		}
	}
}

SequencerInterface.prototype.clear = function() {
	this.ctx.clearRect(0, 0, this.width, this.height);
}


var sequencer = new Sequencer(12,"sequencer");


