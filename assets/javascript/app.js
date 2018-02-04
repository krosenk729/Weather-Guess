var gameLen = 4; // number of questions in a game 
var questMaxTime = 30;  // num seconds user has to answer question
var backgroundNo = 1;

$(document).ready(function(){
	var currentQ, currentAns, currentSet;
	var userPos = {
		pos: 1,
		wrong: 0,
		right: 0
	}

	/* start a series of questions */
	// when a new game is started, location group is set (usa/world)
	// user's history (right/wrong/position) is reset
	// a new location is set for guessing 
	$('button.play-new').on('click', function(){
		questMaxTime =  $('#newtime').val() || questMaxTime;
		newPlay( $(this).data('type') );
	});

	$('#user-q button').on('click', function(){
		nextAnswer( $(this).data('guess') );
	});

	/* start a series of questions */
	// when a new game is started, location group is set (usa/world)
	// user's history (right/wrong/position) is reset
	// a new location is set into the "current question" variable
	// function is invoked to show the first question
	function newPlay( locSet ){
		currentSet = locSet || 'usa';
		userPos.pos = 1;
		userPos.wrong = 0;
		userPos.right = 0;
		currentQ = gameLocs[currentSet].pop();
		console.log(currentQ);
		nextQuestion();
		setTimeout(()=> swapPanel('.game-wel, .game-over, #user-a', '.game-ques, #user-p, #user-q'), 500);
	}

	/* check and show answer */ 
	// if user guessed correctly, increment right answers
	// if not, show timeout/wrong and increment wrongs 
	// check if this is the last question in series 
	// auto-progress to either "game over" or next question
	function nextAnswer( guessed ){
		$('#sidenote').html('It is '+ currentQ.curr +'&deg; in '+ currentQ.city);
		swapPanel('#user-q, #user-p', '#user-a');
		currentT.stop();
		
		if(guessed === currentAns.correctAns){
			$('#userWas').text('correct');
			userPos.right++;
		}else{
			$('#userWas').text( (guessed ? 'incorrect' : 'too slow') );
			userPos.wrong++;
		}

		function checkEnd(){
			if(userPos.pos === gameLen ){
				$('#userCorrect').text(userPos.right);
				$('#userIncorrect').text(userPos.wrong);
				swapPanel('.game-ques', '.game-over');
			}else{
				userPos.pos++;
				currentQ = gameLocs[currentSet].pop();
				nextQuestion();
			}
		}
		setTimeout(checkEnd, 1500);
	}

	/* get and show a question to user */
	// based on current question, gets the weather 
	// determines if should show hotter/colder/exact temp
	// starts timing user
	function nextQuestion(){
		var baseurl = 'https://api.wunderground.com/api';
		var krKey = '7ad17aca98534b07';
		var finalurl = baseurl + '/' + krKey + '/geolookup/conditions' + currentQ.qSend ;
		console.log(finalurl);
		// using icon sets from https://www.wunderground.com/weather/api/d/docs?d=resources/icon-sets&MR=1
		// to change icon sets, change the url's last directory /i/ to /f/, /k/, ... etc	
		var iconurl = 'https://icons.wxug.com/i/c/i/';

		$.ajax({
			url: finalurl,
			complete: function(){	
				swapPanel('#user-a, #user-p, .game-wel','#user-q, #user-p');
				$('#pos').text(userPos.pos + ' in ' + gameLen);
				swapBG();
				currentT.start();
			},
			success: function( jP ){
				// currentQ.curr  = Math.round(jP.current_observation.temp_f);
				// currentQ.currIcon  = iconurl + jP.current_observation.icon + '.gif';
				// currentQ.updated = new Date(); 

				// currentAns = changeTemp(currentQ.curr); 
				// $('.weatherIn').text( currentQ.city + ', ' + currentQ.fullsc );
				// $('.weatherGuess').text( currentAns.showTemp );
			},
			error: function( jqXHR, textStatus, errorThrown ){
				console.log('error '+ errorThrown + ' : ' + textStatus);
			}
		}).then( function(jP){
			currentQ.curr  = Math.round(jP.current_observation.temp_f);
				currentQ.currIcon  = iconurl + jP.current_observation.icon + '.gif';
				currentQ.updated = new Date(); 

				currentAns = changeTemp(currentQ.curr); 
				$('.weatherIn').text( currentQ.city + ', ' + currentQ.fullsc );
				$('.weatherGuess').text( currentAns.showTemp );
		} );

	}

	/* decide on question display */
	// returns a temp to show to user and what the user should guess 
	// will return actual weather with a 50% probaility 
	// hotter/colder weather values will be 10 - 20 degrees offset 
	function changeTemp( actualTemp ){
		var r = Math.floor(Math.random()*10 + 10); 
		var s = new Object;
		if( r % 4 === 0 ){
			s.correctAns = 'cooler';
			s.showTemp = actualTemp + r;
		} else if( r % 4 === 1){
			s.correctAns = 'warmer';
			s.showTemp = actualTemp - r;
		}	else {
			s.correctAns = 'exactly';
			s.showTemp = actualTemp;
		}
		return s;
	}

	/* timer object */
	// timer keeps track of if it is running or not
	// timer can be started or stopped  
	// timer resets each time it is started 
	// if timer reaches zero, attempts to progress questions
	var currentT = {
		isRunning: false,
		time: 0,
		intID: {},
		start: function() {
			if (!this.isRunning) {
				var self = this;
				this.time = questMaxTime;
				this.intID = setInterval( function(){ count(self); }, 1000);
				this.isRunning = true;
				$('#time-left').text( this.time );

				// try using run method // setInterval( function(){ self.run() }, 1000 )

				function count( t ){
					t.time--;
					$('#time-left').text( t.time );
					if(t.time === 0){
						t.stop();
						nextAnswer();
					}
				}
			}
		},
		run: function(){
			this.time = Math.max(0, this.time - 1 );
			if( this.time === 0 ){
				this.stop();
				nextAnswer();
			}
		},
		stop: function() {
			clearInterval( this.intID );
			this.isRunning = false;
		}
	};


	/* change between panels */
	// hides one css selector and shows another
	function swapPanel(from, to){
		$(from).hide();
		$(to).show();
	}

	/* change background */
	// let's not get boring
	function swapBG(){
		backgroundNo === 20 ? backgroundNo = 1 : backgroundNo++;
		$('.page').css('background-image', 'url("assets/images/c' + backgroundNo + '.png")' );
	}


}); // end of doc.ready

/* randomly sort an array */
// do the shuffle
function sortRand( arr ) {
	arr = arr || []; 
	return arr.sort( function(a,b){ return 0.5 - Math.random(); } );
}

/* arrays of US and World cities */
// note: fullsc is the friendly name for state or country 
// statecountry is wunderground code -- which is not the same as ISO
// for matching table between ISO and wunder, go to https://www.wunderground.com/weather/api/d/docs?d=resources/country-to-iso-matching
/* gamelocations for a new user to guess */
// these will be modified throughout the game so user does not have to re-guess
// same location more than once (each time a loc is used, it is popped)


var allUS, allWorld, gameLocs;
fetch('assets/javascript/locations.json')
	.then(function(blob){
		return blob.json();
	})
	.then(function(data){
		[allUS, allWorld] = data;
		gameLocs =  {
			usa : sortRand( allUS ),
			world : sortRand( allWorld )
	};
	});

/*********************************/
// if I had more time, I would do these things...

// write two function to cleanup html and get rid of swappanel function
	/* change to question & answer panel */
	// creates html for Q/A section
	// clears old html (either welcome / game over)
	// shows newly created Q/A section 


	/* change to game over panel */
	// creates html for game over section
	// clears old html (Q/A)
	// shows newly created game over section 

// write a check to make sure we ...
/* end game if out of cities */

