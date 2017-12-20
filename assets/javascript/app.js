var gameLen = 4; // number of questions in a game 
var questMaxTime = 90;  // num seconds user has to answer question
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
		swapPanel('.game-wel, .game-over, #user-a', '.game-ques, #user-p, #user-q');
		nextQuestion();
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
		setTimeout(checkEnd, 2500);
	}

	/* get and show a question to user */
	// based on current question, gets the weather 
	// determines if should show hotter/colder/exact temp
	// starts timing user
	function nextQuestion(){
		getWeather( currentQ );

		//start timer & show question
		$('#pos').text(userPos.pos + ' in ' + gameLen);
		swapBG();
		swapPanel('#user-a, #user-p, .game-wel','#user-q, #user-p');
		currentT.start();
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


	/* update object with current weather */
	// queries wunderground api for curren weather 
	// for documentation, go to https://www.wunderground.com/weather/api/d/docs
	// this will modify the global object

	function getWeather( whereWeather ){
		var baseurl = 'https://api.wunderground.com/api';
		var krKey = '7ad17aca98534b07';
		var finalurl = baseurl + '/' + krKey + '/geolookup/conditions' + whereWeather.qSend ;
		console.log(finalurl);
		// using icon sets from https://www.wunderground.com/weather/api/d/docs?d=resources/icon-sets&MR=1
		// to change icon sets, change the url's last directory /i/ to /f/, /k/, ... etc	
		var iconurl = 'https://icons.wxug.com/i/c/i/';

		$.ajax({
			url: finalurl,
			success: function( jP ){
				whereWeather.curr  = Math.round(jP.current_observation.temp_f);
				whereWeather.currIcon  = iconurl + jP.current_observation.icon + '.gif';
				whereWeather.updated = new Date(); 

				currentAns = changeTemp(whereWeather.curr); 
				$('.weatherIn').text( whereWeather.city + ', ' + whereWeather.fullsc );
				$('.weatherGuess').text( currentAns.showTemp );
			},
			error: function(){console.log('error');}
		});

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
var allUS = [
{city: 'Birmingham', statecountry: 'AL', fullsc: 'Alabama', qSend: '/q/AL/Birmingham.json'},
{city: 'Montgomery', statecountry: 'AL', fullsc: 'Alabama', qSend: '/q/AL/Montgomery.json'},
{city: 'Huntsville', statecountry: 'AL', fullsc: 'Alabama', qSend: '/q/AL/Huntsville.json'},
{city: 'Mobile', statecountry: 'AL', fullsc: 'Alabama', qSend: '/q/AL/Mobile.json'},
{city: 'Anchorage', statecountry: 'AK', fullsc: 'Alaska', qSend: '/q/AK/Anchorage.json'},
{city: 'Phoenix', statecountry: 'AZ', fullsc: 'Arizona', qSend: '/q/AZ/Phoenix.json'},
{city: 'Tucson', statecountry: 'AZ', fullsc: 'Arizona', qSend: '/q/AZ/Tucson.json'},
{city: 'Mesa', statecountry: 'AZ', fullsc: 'Arizona', qSend: '/q/AZ/Mesa.json'},
{city: 'Chandler', statecountry: 'AZ', fullsc: 'Arizona', qSend: '/q/AZ/Chandler.json'},
{city: 'Scottsdale', statecountry: 'AZ', fullsc: 'Arizona', qSend: '/q/AZ/Scottsdale.json'},
{city: 'Glendale', statecountry: 'AZ', fullsc: 'Arizona', qSend: '/q/AZ/Glendale.json'},
{city: 'Gilbert', statecountry: 'AZ', fullsc: 'Arizona', qSend: '/q/AZ/Gilbert.json'},
{city: 'Tempe', statecountry: 'AZ', fullsc: 'Arizona', qSend: '/q/AZ/Tempe.json'},
{city: 'Peoria', statecountry: 'AZ', fullsc: 'Arizona', qSend: '/q/AZ/Peoria.json'},
{city: 'Surprise', statecountry: 'AZ', fullsc: 'Arizona', qSend: '/q/AZ/Surprise.json'},
{city: 'Little Rock', statecountry: 'AR', fullsc: 'Arkansas', qSend: '/q/AR/Little Rock.json'},
{city: 'Los Angeles', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Los Angeles.json'},
{city: 'San Diego', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/San Diego.json'},
{city: 'San Jose', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/San Jose.json'},
{city: 'San Francisco', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/San Francisco.json'},
{city: 'Fresno', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Fresno.json'},
{city: 'Sacramento', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Sacramento.json'},
{city: 'Long Beach', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Long Beach.json'},
{city: 'Oakland', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Oakland.json'},
{city: 'Bakersfield', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Bakersfield.json'},
{city: 'Anaheim', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Anaheim.json'},
{city: 'Santa Ana', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Santa Ana.json'},
{city: 'Riverside', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Riverside.json'},
{city: 'Stockton', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Stockton.json'},
{city: 'Chula Vista', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Chula Vista.json'},
{city: 'Irvine', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Irvine.json'},
{city: 'Fremont', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Fremont.json'},
{city: 'San Bernardino', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/San Bernardino.json'},
{city: 'Modesto', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Modesto.json'},
{city: 'Fontana', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Fontana.json'},
{city: 'Oxnard', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Oxnard.json'},
{city: 'Moreno Valley', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Moreno Valley.json'},
{city: 'Glendale', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Glendale.json'},
{city: 'Huntington Beach', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Huntington Beach.json'},
{city: 'Santa Clarita', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Santa Clarita.json'},
{city: 'Rancho Cucamonga', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Rancho Cucamonga.json'},
{city: 'Oceanside', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Oceanside.json'},
{city: 'Santa Rosa', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Santa Rosa.json'},
{city: 'Garden Grove', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Garden Grove.json'},
{city: 'Ontario', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Ontario.json'},
{city: 'Elk Grove', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Elk Grove.json'},
{city: 'Corona', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Corona.json'},
{city: 'Lancaster', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Lancaster.json'},
{city: 'Hayward', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Hayward.json'},
{city: 'Palmdale', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Palmdale.json'},
{city: 'Salinas', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Salinas.json'},
{city: 'Sunnyvale', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Sunnyvale.json'},
{city: 'Pomona', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Pomona.json'},
{city: 'Escondido', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Escondido.json'},
{city: 'Torrance', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Torrance.json'},
{city: 'Pasadena', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Pasadena.json'},
{city: 'Fullerton', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Fullerton.json'},
{city: 'Orange', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Orange.json'},
{city: 'Roseville', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Roseville.json'},
{city: 'Visalia', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Visalia.json'},
{city: 'Thousand Oaks', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Thousand Oaks.json'},
{city: 'Concord', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Concord.json'},
{city: 'Simi Valley', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Simi Valley.json'},
{city: 'Santa Clara', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Santa Clara.json'},
{city: 'Victorville', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Victorville.json'},
{city: 'Vallejo', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Vallejo.json'},
{city: 'Berkeley', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Berkeley.json'},
{city: 'El Monte', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/El Monte.json'},
{city: 'Fairfield', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Fairfield.json'},
{city: 'Carlsbad', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Carlsbad.json'},
{city: 'Downey', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Downey.json'},
{city: 'Temecula', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Temecula.json'},
{city: 'Costa Mesa', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Costa Mesa.json'},
{city: 'Murrieta', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Murrieta.json'},
{city: 'Antioch', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Antioch.json'},
{city: 'Inglewood', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Inglewood.json'},
{city: 'Richmond', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Richmond.json'},
{city: 'Ventura', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Ventura.json'},
{city: 'West Covina', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/West Covina.json'},
{city: 'Clovis', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Clovis.json'},
{city: 'Daly City', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Daly City.json'},
{city: 'Santa Maria', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Santa Maria.json'},
{city: 'Norwalk', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Norwalk.json'},
{city: 'Burbank', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Burbank.json'},
{city: 'San Mateo', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/San Mateo.json'},
{city: 'El Cajon', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/El Cajon.json'},
{city: 'Jurupa Valley', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Jurupa Valley.json'},
{city: 'Rialto', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Rialto.json'},
{city: 'Vista', statecountry: 'CA', fullsc: 'California', qSend: '/q/CA/Vista.json'},
{city: 'Denver', statecountry: 'CO', fullsc: 'Colorado', qSend: '/q/CO/Denver.json'},
{city: 'Colorado Springs', statecountry: 'CO', fullsc: 'Colorado', qSend: '/q/CO/Colorado Springs.json'},
{city: 'Aurora', statecountry: 'CO', fullsc: 'Colorado', qSend: '/q/CO/Aurora.json'},
{city: 'Fort Collins', statecountry: 'CO', fullsc: 'Colorado', qSend: '/q/CO/Fort Collins.json'},
{city: 'Lakewood', statecountry: 'CO', fullsc: 'Colorado', qSend: '/q/CO/Lakewood.json'},
{city: 'Thornton', statecountry: 'CO', fullsc: 'Colorado', qSend: '/q/CO/Thornton.json'},
{city: 'Arvada', statecountry: 'CO', fullsc: 'Colorado', qSend: '/q/CO/Arvada.json'},
{city: 'Westminster', statecountry: 'CO', fullsc: 'Colorado', qSend: '/q/CO/Westminster.json'},
{city: 'Pueblo', statecountry: 'CO', fullsc: 'Colorado', qSend: '/q/CO/Pueblo.json'},
{city: 'Centennial', statecountry: 'CO', fullsc: 'Colorado', qSend: '/q/CO/Centennial.json'},
{city: 'Boulder', statecountry: 'CO', fullsc: 'Colorado', qSend: '/q/CO/Boulder.json'},
{city: 'Greeley', statecountry: 'CO', fullsc: 'Colorado', qSend: '/q/CO/Greeley.json'},
{city: 'Bridgeport', statecountry: 'CT', fullsc: 'Connecticut', qSend: '/q/CT/Bridgeport.json'},
{city: 'New Haven', statecountry: 'CT', fullsc: 'Connecticut', qSend: '/q/CT/New Haven.json'},
{city: 'Stamford', statecountry: 'CT', fullsc: 'Connecticut', qSend: '/q/CT/Stamford.json'},
{city: 'Hartford', statecountry: 'CT', fullsc: 'Connecticut', qSend: '/q/CT/Hartford.json'},
{city: 'Waterbury', statecountry: 'CT', fullsc: 'Connecticut', qSend: '/q/CT/Waterbury.json'},
{city: 'Jacksonville', statecountry: 'FL', fullsc: 'Florida', qSend: '/q/FL/Jacksonville.json'},
{city: 'Miami', statecountry: 'FL', fullsc: 'Florida', qSend: '/q/FL/Miami.json'},
{city: 'Tampa', statecountry: 'FL', fullsc: 'Florida', qSend: '/q/FL/Tampa.json'},
{city: 'Orlando', statecountry: 'FL', fullsc: 'Florida', qSend: '/q/FL/Orlando.json'},
{city: 'St. Petersburg', statecountry: 'FL', fullsc: 'Florida', qSend: '/q/FL/St. Petersburg.json'},
{city: 'Hialeah', statecountry: 'FL', fullsc: 'Florida', qSend: '/q/FL/Hialeah.json'},
{city: 'Tallahassee', statecountry: 'FL', fullsc: 'Florida', qSend: '/q/FL/Tallahassee.json'},
{city: 'Port St. Lucie', statecountry: 'FL', fullsc: 'Florida', qSend: '/q/FL/Port St. Lucie.json'},
{city: 'Cape Coral', statecountry: 'FL', fullsc: 'Florida', qSend: '/q/FL/Cape Coral.json'},
{city: 'Fort Lauderdale', statecountry: 'FL', fullsc: 'Florida', qSend: '/q/FL/Fort Lauderdale.json'},
{city: 'Pembroke Pines', statecountry: 'FL', fullsc: 'Florida', qSend: '/q/FL/Pembroke Pines.json'},
{city: 'Hollywood', statecountry: 'FL', fullsc: 'Florida', qSend: '/q/FL/Hollywood.json'},
{city: 'Miramar', statecountry: 'FL', fullsc: 'Florida', qSend: '/q/FL/Miramar.json'},
{city: 'Gainesville', statecountry: 'FL', fullsc: 'Florida', qSend: '/q/FL/Gainesville.json'},
{city: 'Coral Springs', statecountry: 'FL', fullsc: 'Florida', qSend: '/q/FL/Coral Springs.json'},
{city: 'Clearwater', statecountry: 'FL', fullsc: 'Florida', qSend: '/q/FL/Clearwater.json'},
{city: 'Miami Gardens', statecountry: 'FL', fullsc: 'Florida', qSend: '/q/FL/Miami Gardens.json'},
{city: 'Palm Bay', statecountry: 'FL', fullsc: 'Florida', qSend: '/q/FL/Palm Bay.json'},
{city: 'Pompano Beach', statecountry: 'FL', fullsc: 'Florida', qSend: '/q/FL/Pompano Beach.json'},
{city: 'West Palm Beach', statecountry: 'FL', fullsc: 'Florida', qSend: '/q/FL/West Palm Beach.json'},
{city: 'Lakeland', statecountry: 'FL', fullsc: 'Florida', qSend: '/q/FL/Lakeland.json'},
{city: 'Davie', statecountry: 'FL', fullsc: 'Florida', qSend: '/q/FL/Davie.json'},
{city: 'Atlanta', statecountry: 'GA', fullsc: 'Georgia', qSend: '/q/GA/Atlanta.json'},
{city: 'Columbus', statecountry: 'GA', fullsc: 'Georgia', qSend: '/q/GA/Columbus.json'},
{city: 'Augusta', statecountry: 'GA', fullsc: 'Georgia', qSend: '/q/GA/Augusta.json'},
{city: 'Macon', statecountry: 'GA', fullsc: 'Georgia', qSend: '/q/GA/Macon.json'},
{city: 'Savannah', statecountry: 'GA', fullsc: 'Georgia', qSend: '/q/GA/Savannah.json'},
{city: 'Athens', statecountry: 'GA', fullsc: 'Georgia', qSend: '/q/GA/Athens.json'},
{city: 'Sandy Springs', statecountry: 'GA', fullsc: 'Georgia', qSend: '/q/GA/Sandy Springs.json'},
{city: 'Honolulu', statecountry: 'HI', fullsc: 'Hawaii', qSend: '/q/HI/Honolulu.json'},
{city: 'Boise', statecountry: 'ID', fullsc: 'Idaho', qSend: '/q/ID/Boise.json'},
{city: 'Chicago', statecountry: 'IL', fullsc: 'Illinois', qSend: '/q/IL/Chicago.json'},
{city: 'Aurora', statecountry: 'IL', fullsc: 'Illinois', qSend: '/q/IL/Aurora.json'},
{city: 'Joliet', statecountry: 'IL', fullsc: 'Illinois', qSend: '/q/IL/Joliet.json'},
{city: 'Rockford', statecountry: 'IL', fullsc: 'Illinois', qSend: '/q/IL/Rockford.json'},
{city: 'Naperville', statecountry: 'IL', fullsc: 'Illinois', qSend: '/q/IL/Naperville.json'},
{city: 'Springfield', statecountry: 'IL', fullsc: 'Illinois', qSend: '/q/IL/Springfield.json'},
{city: 'Peoria', statecountry: 'IL', fullsc: 'Illinois', qSend: '/q/IL/Peoria.json'},
{city: 'Elgin', statecountry: 'IL', fullsc: 'Illinois', qSend: '/q/IL/Elgin.json'},
{city: 'Indianapolis', statecountry: 'IN', fullsc: 'Indiana', qSend: '/q/IN/Indianapolis.json'},
{city: 'Fort Wayne', statecountry: 'IN', fullsc: 'Indiana', qSend: '/q/IN/Fort Wayne.json'},
{city: 'Evansville', statecountry: 'IN', fullsc: 'Indiana', qSend: '/q/IN/Evansville.json'},
{city: 'South Bend', statecountry: 'IN', fullsc: 'Indiana', qSend: '/q/IN/South Bend.json'},
{city: 'Des Moines', statecountry: 'IA', fullsc: 'Iowa', qSend: '/q/IA/Des Moines.json'},
{city: 'Cedar Rapids', statecountry: 'IA', fullsc: 'Iowa', qSend: '/q/IA/Cedar Rapids.json'},
{city: 'Davenport', statecountry: 'IA', fullsc: 'Iowa', qSend: '/q/IA/Davenport.json'},
{city: 'Wichita', statecountry: 'KS', fullsc: 'Kansas', qSend: '/q/KS/Wichita.json'},
{city: 'Overland Park', statecountry: 'KS', fullsc: 'Kansas', qSend: '/q/KS/Overland Park.json'},
{city: 'Kansas City', statecountry: 'KS', fullsc: 'Kansas', qSend: '/q/KS/Kansas City.json'},
{city: 'Olathe', statecountry: 'KS', fullsc: 'Kansas', qSend: '/q/KS/Olathe.json'},
{city: 'Topeka', statecountry: 'KS', fullsc: 'Kansas', qSend: '/q/KS/Topeka.json'},
{city: 'Louisville', statecountry: 'KY', fullsc: 'Kentucky', qSend: '/q/KY/Louisville.json'},
{city: 'Lexington', statecountry: 'KY', fullsc: 'Kentucky', qSend: '/q/KY/Lexington.json'},
{city: 'New Orleans', statecountry: 'LA', fullsc: 'Louisiana', qSend: '/q/LA/New Orleans.json'},
{city: 'Baton Rouge', statecountry: 'LA', fullsc: 'Louisiana', qSend: '/q/LA/Baton Rouge.json'},
{city: 'Shreveport', statecountry: 'LA', fullsc: 'Louisiana', qSend: '/q/LA/Shreveport.json'},
{city: 'Lafayette', statecountry: 'LA', fullsc: 'Louisiana', qSend: '/q/LA/Lafayette.json'},
{city: 'Baltimore', statecountry: 'MD', fullsc: 'Maryland', qSend: '/q/MD/Baltimore.json'},
{city: 'Boston', statecountry: 'MA', fullsc: 'Massachusetts', qSend: '/q/MA/Boston.json'},
{city: 'Worcester', statecountry: 'MA', fullsc: 'Massachusetts', qSend: '/q/MA/Worcester.json'},
{city: 'Springfield', statecountry: 'MA', fullsc: 'Massachusetts', qSend: '/q/MA/Springfield.json'},
{city: 'Cambridge', statecountry: 'MA', fullsc: 'Massachusetts', qSend: '/q/MA/Cambridge.json'},
{city: 'Lowell', statecountry: 'MA', fullsc: 'Massachusetts', qSend: '/q/MA/Lowell.json'},
{city: 'Detroit', statecountry: 'MI', fullsc: 'Michigan', qSend: '/q/MI/Detroit.json'},
{city: 'Grand Rapids', statecountry: 'MI', fullsc: 'Michigan', qSend: '/q/MI/Grand Rapids.json'},
{city: 'Warren', statecountry: 'MI', fullsc: 'Michigan', qSend: '/q/MI/Warren.json'},
{city: 'Sterling Heights', statecountry: 'MI', fullsc: 'Michigan', qSend: '/q/MI/Sterling Heights.json'},
{city: 'Ann Arbor', statecountry: 'MI', fullsc: 'Michigan', qSend: '/q/MI/Ann Arbor.json'},
{city: 'Lansing', statecountry: 'MI', fullsc: 'Michigan', qSend: '/q/MI/Lansing.json'},
{city: 'Clinton', statecountry: 'MI', fullsc: 'Michigan', qSend: '/q/MI/Clinton.json'},
{city: 'Minneapolis', statecountry: 'MN', fullsc: 'Minnesota', qSend: '/q/MN/Minneapolis.json'},
{city: 'Saint Paul', statecountry: 'MN', fullsc: 'Minnesota', qSend: '/q/MN/Saint Paul.json'},
{city: 'Rochester', statecountry: 'MN', fullsc: 'Minnesota', qSend: '/q/MN/Rochester.json'},
{city: 'Jackson', statecountry: 'MS', fullsc: 'Mississippi', qSend: '/q/MS/Jackson.json'},
{city: 'Kansas City', statecountry: 'MO', fullsc: 'Missouri', qSend: '/q/MO/Kansas City.json'},
{city: 'St. Louis', statecountry: 'MO', fullsc: 'Missouri', qSend: '/q/MO/St. Louis.json'},
{city: 'Springfield', statecountry: 'MO', fullsc: 'Missouri', qSend: '/q/MO/Springfield.json'},
{city: 'Columbia', statecountry: 'MO', fullsc: 'Missouri', qSend: '/q/MO/Columbia.json'},
{city: 'Independence', statecountry: 'MO', fullsc: 'Missouri', qSend: '/q/MO/Independence.json'},
{city: 'Billings', statecountry: 'MT', fullsc: 'Montana', qSend: '/q/MT/Billings.json'},
{city: 'Omaha', statecountry: 'NE', fullsc: 'Nebraska', qSend: '/q/NE/Omaha.json'},
{city: 'Lincoln', statecountry: 'NE', fullsc: 'Nebraska', qSend: '/q/NE/Lincoln.json'},
{city: 'Las Vegas', statecountry: 'NV', fullsc: 'Nevada', qSend: '/q/NV/Las Vegas.json'},
{city: 'Henderson', statecountry: 'NV', fullsc: 'Nevada', qSend: '/q/NV/Henderson.json'},
{city: 'Reno', statecountry: 'NV', fullsc: 'Nevada', qSend: '/q/NV/Reno.json'},
{city: 'North Las Vegas', statecountry: 'NV', fullsc: 'Nevada', qSend: '/q/NV/North Las Vegas.json'},
{city: 'Manchester', statecountry: 'NH', fullsc: 'New Hampshire', qSend: '/q/NH/Manchester.json'},
{city: 'Newark', statecountry: 'NJ', fullsc: 'New Jersey', qSend: '/q/NJ/Newark.json'},
{city: 'Jersey City', statecountry: 'NJ', fullsc: 'New Jersey', qSend: '/q/NJ/Jersey City.json'},
{city: 'Paterson', statecountry: 'NJ', fullsc: 'New Jersey', qSend: '/q/NJ/Paterson.json'},
{city: 'Elizabeth', statecountry: 'NJ', fullsc: 'New Jersey', qSend: '/q/NJ/Elizabeth.json'},
{city: 'Edison', statecountry: 'NJ', fullsc: 'New Jersey', qSend: '/q/NJ/Edison.json'},
{city: 'Woodbridge', statecountry: 'NJ', fullsc: 'New Jersey', qSend: '/q/NJ/Woodbridge.json'},
{city: 'Lakewood', statecountry: 'NJ', fullsc: 'New Jersey', qSend: '/q/NJ/Lakewood.json'},
{city: 'Albuquerque', statecountry: 'NM', fullsc: 'New Mexico', qSend: '/q/NM/Albuquerque.json'},
{city: 'Las Cruces', statecountry: 'NM', fullsc: 'New Mexico', qSend: '/q/NM/Las Cruces.json'},
{city: 'New York', statecountry: 'NY', fullsc: 'New York', qSend: '/q/NY/New York.json'},
{city: 'Buffalo', statecountry: 'NY', fullsc: 'New York', qSend: '/q/NY/Buffalo.json'},
{city: 'Rochester', statecountry: 'NY', fullsc: 'New York', qSend: '/q/NY/Rochester.json'},
{city: 'Yonkers', statecountry: 'NY', fullsc: 'New York', qSend: '/q/NY/Yonkers.json'},
{city: 'Syracuse', statecountry: 'NY', fullsc: 'New York', qSend: '/q/NY/Syracuse.json'},
{city: 'Charlotte', statecountry: 'NC', fullsc: 'North Carolina', qSend: '/q/NC/Charlotte.json'},
{city: 'Raleigh', statecountry: 'NC', fullsc: 'North Carolina', qSend: '/q/NC/Raleigh.json'},
{city: 'Greensboro', statecountry: 'NC', fullsc: 'North Carolina', qSend: '/q/NC/Greensboro.json'},
{city: 'Durham', statecountry: 'NC', fullsc: 'North Carolina', qSend: '/q/NC/Durham.json'},
{city: 'Winston–Salem', statecountry: 'NC', fullsc: 'North Carolina', qSend: '/q/NC/Winston–Salem.json'},
{city: 'Fayetteville', statecountry: 'NC', fullsc: 'North Carolina', qSend: '/q/NC/Fayetteville.json'},
{city: 'Cary', statecountry: 'NC', fullsc: 'North Carolina', qSend: '/q/NC/Cary.json'},
{city: 'Wilmington', statecountry: 'NC', fullsc: 'North Carolina', qSend: '/q/NC/Wilmington.json'},
{city: 'High Point', statecountry: 'NC', fullsc: 'North Carolina', qSend: '/q/NC/High Point.json'},
{city: 'Fargo', statecountry: 'ND', fullsc: 'North Dakota', qSend: '/q/ND/Fargo.json'},
{city: 'Columbus', statecountry: 'OH', fullsc: 'Ohio', qSend: '/q/OH/Columbus.json'},
{city: 'Cleveland', statecountry: 'OH', fullsc: 'Ohio', qSend: '/q/OH/Cleveland.json'},
{city: 'Cincinnati', statecountry: 'OH', fullsc: 'Ohio', qSend: '/q/OH/Cincinnati.json'},
{city: 'Toledo', statecountry: 'OH', fullsc: 'Ohio', qSend: '/q/OH/Toledo.json'},
{city: 'Akron', statecountry: 'OH', fullsc: 'Ohio', qSend: '/q/OH/Akron.json'},
{city: 'Dayton', statecountry: 'OH', fullsc: 'Ohio', qSend: '/q/OH/Dayton.json'},
{city: 'Oklahoma City', statecountry: 'OK', fullsc: 'Oklahoma', qSend: '/q/OK/Oklahoma City.json'},
{city: 'Tulsa', statecountry: 'OK', fullsc: 'Oklahoma', qSend: '/q/OK/Tulsa.json'},
{city: 'Norman', statecountry: 'OK', fullsc: 'Oklahoma', qSend: '/q/OK/Norman.json'},
{city: 'Broken Arrow', statecountry: 'OK', fullsc: 'Oklahoma', qSend: '/q/OK/Broken Arrow.json'},
{city: 'Portland', statecountry: 'OR', fullsc: 'Oregon', qSend: '/q/OR/Portland.json'},
{city: 'Salem', statecountry: 'OR', fullsc: 'Oregon', qSend: '/q/OR/Salem.json'},
{city: 'Eugene', statecountry: 'OR', fullsc: 'Oregon', qSend: '/q/OR/Eugene.json'},
{city: 'Gresham', statecountry: 'OR', fullsc: 'Oregon', qSend: '/q/OR/Gresham.json'},
{city: 'Hillsboro', statecountry: 'OR', fullsc: 'Oregon', qSend: '/q/OR/Hillsboro.json'},
{city: 'Philadelphia', statecountry: 'PA', fullsc: 'Pennsylvania', qSend: '/q/PA/Philadelphia.json'},
{city: 'Pittsburgh', statecountry: 'PA', fullsc: 'Pennsylvania', qSend: '/q/PA/Pittsburgh.json'},
{city: 'Allentown', statecountry: 'PA', fullsc: 'Pennsylvania', qSend: '/q/PA/Allentown.json'},
{city: 'Providence', statecountry: 'RI', fullsc: 'Rhode Island', qSend: '/q/RI/Providence.json'},
{city: 'Charleston', statecountry: 'SC', fullsc: 'South Carolina', qSend: '/q/SC/Charleston.json'},
{city: 'Columbia', statecountry: 'SC', fullsc: 'South Carolina', qSend: '/q/SC/Columbia.json'},
{city: 'North Charleston', statecountry: 'SC', fullsc: 'South Carolina', qSend: '/q/SC/North Charleston.json'},
{city: 'Sioux Falls', statecountry: 'SD', fullsc: 'South Dakota', qSend: '/q/SD/Sioux Falls.json'},
{city: 'Nashville', statecountry: 'TN', fullsc: 'Tennessee', qSend: '/q/TN/Nashville.json'},
{city: 'Memphis', statecountry: 'TN', fullsc: 'Tennessee', qSend: '/q/TN/Memphis.json'},
{city: 'Knoxville', statecountry: 'TN', fullsc: 'Tennessee', qSend: '/q/TN/Knoxville.json'},
{city: 'Chattanooga', statecountry: 'TN', fullsc: 'Tennessee', qSend: '/q/TN/Chattanooga.json'},
{city: 'Clarksville', statecountry: 'TN', fullsc: 'Tennessee', qSend: '/q/TN/Clarksville.json'},
{city: 'Murfreesboro', statecountry: 'TN', fullsc: 'Tennessee', qSend: '/q/TN/Murfreesboro.json'},
{city: 'Houston', statecountry: 'TX', fullsc: 'Texas', qSend: '/q/TX/Houston.json'},
{city: 'San Antonio', statecountry: 'TX', fullsc: 'Texas', qSend: '/q/TX/San Antonio.json'},
{city: 'Dallas', statecountry: 'TX', fullsc: 'Texas', qSend: '/q/TX/Dallas.json'},
{city: 'Austin', statecountry: 'TX', fullsc: 'Texas', qSend: '/q/TX/Austin.json'},
{city: 'Fort Worth', statecountry: 'TX', fullsc: 'Texas', qSend: '/q/TX/Fort Worth.json'},
{city: 'El Paso', statecountry: 'TX', fullsc: 'Texas', qSend: '/q/TX/El Paso.json'},
{city: 'Arlington', statecountry: 'TX', fullsc: 'Texas', qSend: '/q/TX/Arlington.json'},
{city: 'Corpus Christi', statecountry: 'TX', fullsc: 'Texas', qSend: '/q/TX/Corpus Christi.json'},
{city: 'Plano', statecountry: 'TX', fullsc: 'Texas', qSend: '/q/TX/Plano.json'},
{city: 'Laredo', statecountry: 'TX', fullsc: 'Texas', qSend: '/q/TX/Laredo.json'},
{city: 'Lubbock', statecountry: 'TX', fullsc: 'Texas', qSend: '/q/TX/Lubbock.json'},
{city: 'Irving', statecountry: 'TX', fullsc: 'Texas', qSend: '/q/TX/Irving.json'},
{city: 'Garland', statecountry: 'TX', fullsc: 'Texas', qSend: '/q/TX/Garland.json'},
{city: 'Amarillo', statecountry: 'TX', fullsc: 'Texas', qSend: '/q/TX/Amarillo.json'},
{city: 'Grand Prairie', statecountry: 'TX', fullsc: 'Texas', qSend: '/q/TX/Grand Prairie.json'},
{city: 'Brownsville', statecountry: 'TX', fullsc: 'Texas', qSend: '/q/TX/Brownsville.json'},
{city: 'McKinney', statecountry: 'TX', fullsc: 'Texas', qSend: '/q/TX/McKinney.json'},
{city: 'Frisco', statecountry: 'TX', fullsc: 'Texas', qSend: '/q/TX/Frisco.json'},
{city: 'Pasadena', statecountry: 'TX', fullsc: 'Texas', qSend: '/q/TX/Pasadena.json'},
{city: 'Mesquite', statecountry: 'TX', fullsc: 'Texas', qSend: '/q/TX/Mesquite.json'},
{city: 'Killeen', statecountry: 'TX', fullsc: 'Texas', qSend: '/q/TX/Killeen.json'},
{city: 'McAllen', statecountry: 'TX', fullsc: 'Texas', qSend: '/q/TX/McAllen.json'},
{city: 'Midland', statecountry: 'TX', fullsc: 'Texas', qSend: '/q/TX/Midland.json'},
{city: 'Waco', statecountry: 'TX', fullsc: 'Texas', qSend: '/q/TX/Waco.json'},
{city: 'Denton', statecountry: 'TX', fullsc: 'Texas', qSend: '/q/TX/Denton.json'},
{city: 'Carrollton', statecountry: 'TX', fullsc: 'Texas', qSend: '/q/TX/Carrollton.json'},
{city: 'Abilene', statecountry: 'TX', fullsc: 'Texas', qSend: '/q/TX/Abilene.json'},
{city: 'Round Rock', statecountry: 'TX', fullsc: 'Texas', qSend: '/q/TX/Round Rock.json'},
{city: 'Beaumont', statecountry: 'TX', fullsc: 'Texas', qSend: '/q/TX/Beaumont.json'},
{city: 'Odessa', statecountry: 'TX', fullsc: 'Texas', qSend: '/q/TX/Odessa.json'},
{city: 'Pearland', statecountry: 'TX', fullsc: 'Texas', qSend: '/q/TX/Pearland.json'},
{city: 'Richardson', statecountry: 'TX', fullsc: 'Texas', qSend: '/q/TX/Richardson.json'},
{city: 'College Station', statecountry: 'TX', fullsc: 'Texas', qSend: '/q/TX/College Station.json'},
{city: 'Tyler', statecountry: 'TX', fullsc: 'Texas', qSend: '/q/TX/Tyler.json'},
{city: 'Wichita Falls', statecountry: 'TX', fullsc: 'Texas', qSend: '/q/TX/Wichita Falls.json'},
{city: 'Lewisville', statecountry: 'TX', fullsc: 'Texas', qSend: '/q/TX/Lewisville.json'},
{city: 'League City', statecountry: 'TX', fullsc: 'Texas', qSend: '/q/TX/League City.json'},
{city: 'San Angelo', statecountry: 'TX', fullsc: 'Texas', qSend: '/q/TX/San Angelo.json'},
{city: 'Salt Lake City', statecountry: 'UT', fullsc: 'Utah', qSend: '/q/UT/Salt Lake City.json'},
{city: 'West Valley City', statecountry: 'UT', fullsc: 'Utah', qSend: '/q/UT/West Valley City.json'},
{city: 'Provo', statecountry: 'UT', fullsc: 'Utah', qSend: '/q/UT/Provo.json'},
{city: 'West Jordan', statecountry: 'UT', fullsc: 'Utah', qSend: '/q/UT/West Jordan.json'},
{city: 'Virginia Beach', statecountry: 'VA', fullsc: 'Virginia', qSend: '/q/VA/Virginia Beach.json'},
{city: 'Norfolk', statecountry: 'VA', fullsc: 'Virginia', qSend: '/q/VA/Norfolk.json'},
{city: 'Chesapeake', statecountry: 'VA', fullsc: 'Virginia', qSend: '/q/VA/Chesapeake.json'},
{city: 'Richmond', statecountry: 'VA', fullsc: 'Virginia', qSend: '/q/VA/Richmond.json'},
{city: 'Newport News', statecountry: 'VA', fullsc: 'Virginia', qSend: '/q/VA/Newport News.json'},
{city: 'Alexandria', statecountry: 'VA', fullsc: 'Virginia', qSend: '/q/VA/Alexandria.json'},
{city: 'Hampton', statecountry: 'VA', fullsc: 'Virginia', qSend: '/q/VA/Hampton.json'},
{city: 'Seattle', statecountry: 'WA', fullsc: 'Washington', qSend: '/q/WA/Seattle.json'},
{city: 'Spokane', statecountry: 'WA', fullsc: 'Washington', qSend: '/q/WA/Spokane.json'},
{city: 'Tacoma', statecountry: 'WA', fullsc: 'Washington', qSend: '/q/WA/Tacoma.json'},
{city: 'Vancouver', statecountry: 'WA', fullsc: 'Washington', qSend: '/q/WA/Vancouver.json'},
{city: 'Bellevue', statecountry: 'WA', fullsc: 'Washington', qSend: '/q/WA/Bellevue.json'},
{city: 'Kent', statecountry: 'WA', fullsc: 'Washington', qSend: '/q/WA/Kent.json'},
{city: 'Everett', statecountry: 'WA', fullsc: 'Washington', qSend: '/q/WA/Everett.json'},
{city: 'Renton', statecountry: 'WA', fullsc: 'Washington', qSend: '/q/WA/Renton.json'},
{city: 'Milwaukee', statecountry: 'WI', fullsc: 'Wisconsin', qSend: '/q/WI/Milwaukee.json'},
{city: 'Madison', statecountry: 'WI', fullsc: 'Wisconsin', qSend: '/q/WI/Madison.json'},
{city: 'Green Bay', statecountry: 'WI', fullsc: 'Wisconsin', qSend: '/q/WI/Green Bay.json'},
];
var allWorld = [
{ city: 'Agra', statecountry: 'BW', fullsc: 'Bangladesh', qSend: '/q/zmw:00000.3.41858.json'},
{ city: 'Anchorage', statecountry: 'US', fullsc: 'United States of America', qSend: '/q/zmw:99501.1.99999.json'},
{ city: 'Astana', statecountry: 'KZ', fullsc: 'Kazakhstan', qSend: '/q/zmw:00000.162.WUACC.json'},
{ city: 'Athens', statecountry: 'GR', fullsc: 'Greece', qSend: '/q/zmw:00000.10.16716.json'},
{ city: 'Austin', statecountry: 'US', fullsc: 'United States of America', qSend: '/q/zmw:72007.1.99999.json'},
{ city: 'Bamako', statecountry: 'MI', fullsc: 'Mali', qSend: '/q/zmw:00000.1.61291.json'},
{ city: 'Bangkok', statecountry: 'TH', fullsc: 'Thailand', qSend: '/q/zmw:00000.376.48455.json'},
{ city: 'Barcelona', statecountry: 'SP', fullsc: 'Spain', qSend: '/q/zmw:00000.17.08181.json'},
{ city: 'Beijing', statecountry: 'CI', fullsc: 'China', qSend: '/q/zmw:00000.547.54511.json'},
{ city: 'Berlin', statecountry: 'JM', fullsc: 'Jamaica', qSend: '/q/zmw:00000.200.78388.json'},
{ city: 'Bogota', statecountry: 'VN', fullsc: 'Venezuela (Bolivarian Republic)', qSend: '/q/zmw:00000.145.80434.json'},
{ city: 'Boston', statecountry: 'US', fullsc: 'United States of America', qSend: '/q/zmw:06896.2.99999.json'},
{ city: 'Budapest', statecountry: 'HU', fullsc: 'Hungary', qSend: '/q/zmw:00000.147.12838.json'},
{ city: 'buenosaires', statecountry: 'AG', fullsc: 'Argentina', qSend: '/q/zmw:00000.1.87582.json'},
{ city: 'Cairo', statecountry: 'EG', fullsc: 'Egypt', qSend: '/q/zmw:00000.1.62375.json'},
{ city: 'Calgary', statecountry: 'CA', fullsc: 'Canada', qSend: '/q/zmw:00000.38.71393.json'},
{ city: 'Casablanca', statecountry: 'CU', fullsc: 'Cuba', qSend: '/q/zmw:00000.28.78325.json'},
{ city: 'Chicago', statecountry: 'US', fullsc: 'United States of America', qSend: '/q/zmw:60290.1.99999.json'},
{ city: 'Colombo', statecountry: 'SB', fullsc: 'Sri Lanka', qSend: '/q/zmw:00000.2.43466.json'},
{ city: 'Copenhagen', statecountry: 'DN', fullsc: 'Denmark', qSend: '/q/zmw:00000.2.06186.json'},
{ city: 'Dubai', statecountry: 'ER', fullsc: 'United Arab Emirates', qSend: '/q/zmw:00000.1.41194.json'},
{ city: 'Dublin', statecountry: 'IE', fullsc: 'Ireland', qSend: '/q/zmw:00000.2.03969.json'},
{ city: 'Havana', statecountry: 'CU', fullsc: 'Cuba', qSend: '/q/zmw:00000.1.78325.json'},
{ city: 'Heidelberg', statecountry: 'DL', fullsc: 'Germany', qSend: '/q/zmw:00000.29.10272.json'},
{ city: 'A Kung Tin', statecountry: 'HK', fullsc: 'Hong Kong, SAR China', qSend: '/q/zmw:00000.1.45037.json'},
{ city: 'Honolulu', statecountry: 'US', fullsc: 'United States of America', qSend: '/q/zmw:96801.1.99999.json'},
{ city: 'Istanbul', statecountry: 'TU', fullsc: 'Turkey', qSend: '/q/zmw:00000.124.17060.json'},
{ city: 'Johannesburg', statecountry: 'ZA', fullsc: 'South Africa', qSend: '/q/zmw:00000.1.68361.json'},
{ city: 'Kathmandu', statecountry: 'NP', fullsc: 'Nepal', qSend: '/q/zmw:00000.248.44454.json'},
{ city: 'Kiev', statecountry: 'UR', fullsc: 'Ukraine', qSend: '/q/zmw:00000.25.33345.json'},
{ city: 'Kigali', statecountry: 'RW', fullsc: 'Rwanda', qSend: '/q/zmw:00000.3.64387.json'},
{ city: 'Kyoto', statecountry: 'JP', fullsc: 'Japan', qSend: '/q/zmw:00000.18.47759.json'},
{ city: 'Lagos', statecountry: 'NI', fullsc: 'Nigeria', qSend: '/q/zmw:00000.83.65205.json'},
{ city: 'Lahore', statecountry: 'PK', fullsc: 'Pakistan', qSend: '/q/zmw:00000.495.41640.json'},
{ city: 'Lima', statecountry: 'PR', fullsc: 'Peru', qSend: '/q/zmw:00000.1620.84710.json'},
{ city: 'London', statecountry: 'UK', fullsc: 'United Kingdom', qSend: '/q/zmw:00000.40.03779.json'},
{ city: 'Madrid', statecountry: 'SP', fullsc: 'Spain', qSend: '/q/zmw:00000.61.08223.json'},
{ city: 'Manila', statecountry: 'PH', fullsc: 'Philippines', qSend: '/q/zmw:00000.30.98425.json'},
{ city: 'Marrakesh', statecountry: 'MC', fullsc: 'Morocco', qSend: '/q/zmw:00000.1.60230.json'},
{ city: 'Miami', statecountry: 'US', fullsc: 'United States of America', qSend: '/q/zmw:85539.1.99999.json'},
{ city: 'Moscow', statecountry: 'RS', fullsc: 'Russian Federation', qSend: '/q/zmw:00000.164.27612.json'},
{ city: 'Nairobi', statecountry: 'KN', fullsc: 'Kenya', qSend: '/q/zmw:00000.1.63742.json'},
{ city: 'Nara', statecountry: 'JP', fullsc: 'Japan', qSend: '/q/zmw:00000.32.47483.json'},
{ city: 'Nashville', statecountry: 'US', fullsc: 'United States of America', qSend: '/q/zmw:71852.1.99999.json'},
{ city: 'New York', statecountry: 'US', fullsc: 'United States of America', qSend: '/q/zmw:10001.6.99999.json'},
{ city: 'Ottawa', statecountry: 'US', fullsc: 'United States of America', qSend: '/q/zmw:61350.1.99999.json'},
{ city: 'Paris', statecountry: 'FR', fullsc: 'France', qSend: '/q/zmw:00000.45.07156.json'},
{ city: 'Perth', statecountry: 'AU', fullsc: 'Australia', qSend: '/q/zmw:00000.1.95966.json'},
{ city: 'Quebec', statecountry: 'JM', fullsc: 'Jamaica', qSend: '/q/zmw:00000.984.78397.json'},
{ city: 'Quito', statecountry: 'EQ', fullsc: 'Ecuador', qSend: '/q/zmw:00000.1.84072.json'},
{ city: 'Reykjavik', statecountry: 'IL', fullsc: 'Iceland', qSend: '/q/zmw:00000.1.04030.json'},
{ city: 'Rome', statecountry: 'IY', fullsc: 'Italy', qSend: '/q/zmw:00000.64.16240.json'},
{ city: 'Salzberg', statecountry: 'OS', fullsc: 'Austria', qSend: '/q/zmw:00000.26.11354.json'},
{ city: 'Santiago', statecountry: 'CH', fullsc: 'Chile', qSend: '/q/zmw:00000.1.85577.json'},
{ city: 'Seattle', statecountry: 'US', fullsc: 'United States of America', qSend: '/q/zmw:98101.1.99999.json'},
{ city: 'Shanghai', statecountry: 'CI', fullsc: 'China', qSend: '/q/zmw:00000.738.58367.json'},
{ city: 'Singapore', statecountry: 'SR', fullsc: 'Singapore', qSend: '/q/zmw:00000.20.48694.json'},
{ city: 'Stockholm', statecountry: 'SN', fullsc: 'Sweden', qSend: '/q/zmw:00000.1.02485.json'},
{ city: 'Sydney', statecountry: 'AU', fullsc: 'Australia', qSend: '/q/zmw:00000.16.94768.json'},
{ city: 'Tokyo', statecountry: 'JP', fullsc: 'Japan', qSend: '/q/zmw:00000.181.47662.json'},
{ city: 'Toronto', statecountry: 'CU', fullsc: 'Cuba', qSend: '/q/zmw:00000.76.78320.json'},
];

/* locations for a new user to guess */
// these will be modified throughout the game so user does not have to re-guess
// same location more than once (each time a loc is used, it is popped)
var gameLocs = {
		usa : sortRand( allUS ),
		world : sortRand( allWorld )
};


/*********************************/
// if I had more time, I would do these things...

/* change to question & answer panel */
// creates html for Q/A section
// clears old html (either welcome / game over)
// shows newly created Q/A section 


/* change to game over panel */
// creates html for game over section
// clears old html (Q/A)
// shows newly created game over section 

/* end game if out of cities */

/* update where the city display is done to avoid lag bc of api call */
