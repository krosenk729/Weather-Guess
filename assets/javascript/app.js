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
		var baseurl = 'http://api.wunderground.com/api';
		var krKey = '7ad17aca98534b07';
		var cleanCity = whereWeather.city.replace(' ','+');
		var finalurl = baseurl + '/' + krKey + '/geolookup/conditions/q/' + whereWeather.statecountry + '/' + cleanCity + '.json';
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
{city: 'New York', statecountry: 'NY', fullsc: 'New York'},
{city: 'Los Angeles', statecountry: 'CA', fullsc: 'California'},
{city: 'Chicago', statecountry: 'IL', fullsc: 'Illinois'},
{city: 'Houston', statecountry: 'TX', fullsc: 'Texas'},
{city: 'Phoenix', statecountry: 'AZ', fullsc: 'Arizona'},
{city: 'Philadelphia', statecountry: 'PA', fullsc: 'Pennsylvania'},
{city: 'San Antonio', statecountry: 'TX', fullsc: 'Texas'},
{city: 'San Diego', statecountry: 'CA', fullsc: 'California'},
{city: 'Dallas', statecountry: 'TX', fullsc: 'Texas'},
{city: 'San Jose', statecountry: 'CA', fullsc: 'California'},
{city: 'Austin', statecountry: 'TX', fullsc: 'Texas'},
{city: 'Jacksonville', statecountry: 'FL', fullsc: 'Florida'},
{city: 'San Francisco', statecountry: 'CA', fullsc: 'California'},
{city: 'Columbus', statecountry: 'OH', fullsc: 'Ohio'},
{city: 'Indianapolis', statecountry: 'IN', fullsc: 'Indiana'},
{city: 'Fort Worth', statecountry: 'TX', fullsc: 'Texas'},
{city: 'Charlotte', statecountry: 'NC', fullsc: 'North Carolina'},
{city: 'Seattle', statecountry: 'WA', fullsc: 'Washington'},
{city: 'Denver', statecountry: 'CO', fullsc: 'Colorado'},
{city: 'El Paso', statecountry: 'TX', fullsc: 'Texas'},
{city: 'Boston', statecountry: 'MA', fullsc: 'Massachusetts'},
{city: 'Detroit', statecountry: 'MI', fullsc: 'Michigan'},
{city: 'Nashville', statecountry: 'TN', fullsc: 'Tennessee'},
{city: 'Memphis', statecountry: 'TN', fullsc: 'Tennessee'},
{city: 'Portland', statecountry: 'OR', fullsc: 'Oregon'},
{city: 'Oklahoma City', statecountry: 'OK', fullsc: 'Oklahoma'},
{city: 'Las Vegas', statecountry: 'NV', fullsc: 'Nevada'},
{city: 'Louisville', statecountry: 'KY', fullsc: 'Kentucky'},
{city: 'Baltimore', statecountry: 'MD', fullsc: 'Maryland'},
{city: 'Milwaukee', statecountry: 'WI', fullsc: 'Wisconsin'},
{city: 'Albuquerque', statecountry: 'NM', fullsc: 'New Mexico'},
{city: 'Tucson', statecountry: 'AZ', fullsc: 'Arizona'},
{city: 'Fresno', statecountry: 'CA', fullsc: 'California'},
{city: 'Sacramento', statecountry: 'CA', fullsc: 'California'},
{city: 'Mesa', statecountry: 'AZ', fullsc: 'Arizona'},
{city: 'Kansas City', statecountry: 'MO', fullsc: 'Missouri'},
{city: 'Atlanta', statecountry: 'GA', fullsc: 'Georgia'},
{city: 'Long Beach', statecountry: 'CA', fullsc: 'California'},
{city: 'Colorado Springs', statecountry: 'CO', fullsc: 'Colorado'},
{city: 'Raleigh', statecountry: 'NC', fullsc: 'North Carolina'},
{city: 'Miami', statecountry: 'FL', fullsc: 'Florida'},
{city: 'Virginia Beach', statecountry: 'VA', fullsc: 'Virginia'},
{city: 'Omaha', statecountry: 'NE', fullsc: 'Nebraska'},
{city: 'Oakland', statecountry: 'CA', fullsc: 'California'},
{city: 'Minneapolis', statecountry: 'MN', fullsc: 'Minnesota'},
{city: 'Tulsa', statecountry: 'OK', fullsc: 'Oklahoma'},
{city: 'Arlington', statecountry: 'TX', fullsc: 'Texas'},
{city: 'New Orleans', statecountry: 'LA', fullsc: 'Louisiana'},
{city: 'Wichita', statecountry: 'KS', fullsc: 'Kansas'},
{city: 'Cleveland', statecountry: 'OH', fullsc: 'Ohio'},
{city: 'Tampa', statecountry: 'FL', fullsc: 'Florida'},
{city: 'Bakersfield', statecountry: 'CA', fullsc: 'California'},
{city: 'Aurora', statecountry: 'CO', fullsc: 'Colorado'},
{city: 'Honolulu', statecountry: 'HI', fullsc: 'Hawaii'},
{city: 'Anaheim', statecountry: 'CA', fullsc: 'California'},
{city: 'Santa Ana', statecountry: 'CA', fullsc: 'California'},
{city: 'Corpus Christi', statecountry: 'TX', fullsc: 'Texas'},
{city: 'Riverside', statecountry: 'CA', fullsc: 'California'},
{city: 'Lexington', statecountry: 'KY', fullsc: 'Kentucky'},
{city: 'St. Louis', statecountry: 'MO', fullsc: 'Missouri'},
{city: 'Stockton', statecountry: 'CA', fullsc: 'California'},
{city: 'Pittsburgh', statecountry: 'PA', fullsc: 'Pennsylvania'},
{city: 'Saint Paul', statecountry: 'MN', fullsc: 'Minnesota'},
{city: 'Cincinnati', statecountry: 'OH', fullsc: 'Ohio'},
{city: 'Anchorage', statecountry: 'AK', fullsc: 'Alaska'},
{city: 'Henderson', statecountry: 'NV', fullsc: 'Nevada'},
{city: 'Greensboro', statecountry: 'NC', fullsc: 'North Carolina'},
{city: 'Plano', statecountry: 'TX', fullsc: 'Texas'},
{city: 'Newark', statecountry: 'NJ', fullsc: 'New Jersey'},
{city: 'Lincoln', statecountry: 'NE', fullsc: 'Nebraska'},
{city: 'Toledo', statecountry: 'OH', fullsc: 'Ohio'},
{city: 'Orlando', statecountry: 'FL', fullsc: 'Florida'},
{city: 'Chula Vista', statecountry: 'CA', fullsc: 'California'},
{city: 'Irvine', statecountry: 'CA', fullsc: 'California'},
{city: 'Fort Wayne', statecountry: 'IN', fullsc: 'Indiana'},
{city: 'Jersey City', statecountry: 'NJ', fullsc: 'New Jersey'},
{city: 'Durham', statecountry: 'NC', fullsc: 'North Carolina'},
{city: 'St. Petersburg', statecountry: 'FL', fullsc: 'Florida'},
{city: 'Laredo', statecountry: 'TX', fullsc: 'Texas'},
{city: 'Buffalo', statecountry: 'NY', fullsc: 'New York'},
{city: 'Madison', statecountry: 'WI', fullsc: 'Wisconsin'},
{city: 'Lubbock', statecountry: 'TX', fullsc: 'Texas'},
{city: 'Chandler', statecountry: 'AZ', fullsc: 'Arizona'},
{city: 'Scottsdale', statecountry: 'AZ', fullsc: 'Arizona'},
{city: 'Glendale', statecountry: 'AZ', fullsc: 'Arizona'},
{city: 'Reno', statecountry: 'NV', fullsc: 'Nevada'},
{city: 'Norfolk', statecountry: 'VA', fullsc: 'Virginia'},
{city: 'Winston–Salem', statecountry: 'NC', fullsc: 'North Carolina'},
{city: 'North Las Vegas', statecountry: 'NV', fullsc: 'Nevada'},
{city: 'Irving', statecountry: 'TX', fullsc: 'Texas'},
{city: 'Chesapeake', statecountry: 'VA', fullsc: 'Virginia'},
{city: 'Gilbert', statecountry: 'AZ', fullsc: 'Arizona'},
{city: 'Hialeah', statecountry: 'FL', fullsc: 'Florida'},
{city: 'Garland', statecountry: 'TX', fullsc: 'Texas'},
{city: 'Fremont', statecountry: 'CA', fullsc: 'California'},
{city: 'Baton Rouge', statecountry: 'LA', fullsc: 'Louisiana'},
{city: 'Richmond', statecountry: 'VA', fullsc: 'Virginia'},
{city: 'Boise', statecountry: 'ID', fullsc: 'Idaho'},
{city: 'San Bernardino', statecountry: 'CA', fullsc: 'California'},
{city: 'Spokane', statecountry: 'WA', fullsc: 'Washington'},
{city: 'Des Moines', statecountry: 'IA', fullsc: 'Iowa'},
{city: 'Modesto', statecountry: 'CA', fullsc: 'California'},
{city: 'Birmingham', statecountry: 'AL', fullsc: 'Alabama'},
{city: 'Tacoma', statecountry: 'WA', fullsc: 'Washington'},
{city: 'Fontana', statecountry: 'CA', fullsc: 'California'},
{city: 'Rochester', statecountry: 'NY', fullsc: 'New York'},
{city: 'Oxnard', statecountry: 'CA', fullsc: 'California'},
{city: 'Moreno Valley', statecountry: 'CA', fullsc: 'California'},
{city: 'Fayetteville', statecountry: 'NC', fullsc: 'North Carolina'},
{city: 'Aurora', statecountry: 'IL', fullsc: 'Illinois'},
{city: 'Glendale', statecountry: 'CA', fullsc: 'California'},
{city: 'Yonkers', statecountry: 'NY', fullsc: 'New York'},
{city: 'Huntington Beach', statecountry: 'CA', fullsc: 'California'},
{city: 'Montgomery', statecountry: 'AL', fullsc: 'Alabama'},
{city: 'Amarillo', statecountry: 'TX', fullsc: 'Texas'},
{city: 'Little Rock', statecountry: 'AR', fullsc: 'Arkansas'},
{city: 'Akron', statecountry: 'OH', fullsc: 'Ohio'},
{city: 'Columbus', statecountry: 'GA', fullsc: 'Georgia'},
{city: 'Augusta', statecountry: 'GA', fullsc: 'Georgia'},
{city: 'Grand Rapids', statecountry: 'MI', fullsc: 'Michigan'},
{city: 'Shreveport', statecountry: 'LA', fullsc: 'Louisiana'},
{city: 'Salt Lake City', statecountry: 'UT', fullsc: 'Utah'},
{city: 'Huntsville', statecountry: 'AL', fullsc: 'Alabama'},
{city: 'Mobile', statecountry: 'AL', fullsc: 'Alabama'},
{city: 'Tallahassee', statecountry: 'FL', fullsc: 'Florida'},
{city: 'Grand Prairie', statecountry: 'TX', fullsc: 'Texas'},
{city: 'Overland Park', statecountry: 'KS', fullsc: 'Kansas'},
{city: 'Knoxville', statecountry: 'TN', fullsc: 'Tennessee'},
{city: 'Port St. Lucie', statecountry: 'FL', fullsc: 'Florida'},
{city: 'Worcester', statecountry: 'MA', fullsc: 'Massachusetts'},
{city: 'Brownsville', statecountry: 'TX', fullsc: 'Texas'},
{city: 'Tempe', statecountry: 'AZ', fullsc: 'Arizona'},
{city: 'Santa Clarita', statecountry: 'CA', fullsc: 'California'},
{city: 'Newport News', statecountry: 'VA', fullsc: 'Virginia'},
{city: 'Cape Coral', statecountry: 'FL', fullsc: 'Florida'},
{city: 'Providence', statecountry: 'RI', fullsc: 'Rhode Island'},
{city: 'Fort Lauderdale', statecountry: 'FL', fullsc: 'Florida'},
{city: 'Chattanooga', statecountry: 'TN', fullsc: 'Tennessee'},
{city: 'Rancho Cucamonga', statecountry: 'CA', fullsc: 'California'},
{city: 'Oceanside', statecountry: 'CA', fullsc: 'California'},
{city: 'Santa Rosa', statecountry: 'CA', fullsc: 'California'},
{city: 'Garden Grove', statecountry: 'CA', fullsc: 'California'},
{city: 'Vancouver', statecountry: 'WA', fullsc: 'Washington'},
{city: 'Sioux Falls', statecountry: 'SD', fullsc: 'South Dakota'},
{city: 'Ontario', statecountry: 'CA', fullsc: 'California'},
{city: 'McKinney', statecountry: 'TX', fullsc: 'Texas'},
{city: 'Elk Grove', statecountry: 'CA', fullsc: 'California'},
{city: 'Jackson', statecountry: 'MS', fullsc: 'Mississippi'},
{city: 'Pembroke Pines', statecountry: 'FL', fullsc: 'Florida'},
{city: 'Salem', statecountry: 'OR', fullsc: 'Oregon'},
{city: 'Springfield', statecountry: 'MO', fullsc: 'Missouri'},
{city: 'Corona', statecountry: 'CA', fullsc: 'California'},
{city: 'Eugene', statecountry: 'OR', fullsc: 'Oregon'},
{city: 'Fort Collins', statecountry: 'CO', fullsc: 'Colorado'},
{city: 'Peoria', statecountry: 'AZ', fullsc: 'Arizona'},
{city: 'Frisco', statecountry: 'TX', fullsc: 'Texas'},
{city: 'Cary', statecountry: 'NC', fullsc: 'North Carolina'},
{city: 'Lancaster', statecountry: 'CA', fullsc: 'California'},
{city: 'Hayward', statecountry: 'CA', fullsc: 'California'},
{city: 'Palmdale', statecountry: 'CA', fullsc: 'California'},
{city: 'Salinas', statecountry: 'CA', fullsc: 'California'},
{city: 'Alexandria', statecountry: 'VA', fullsc: 'Virginia'},
{city: 'Lakewood', statecountry: 'CO', fullsc: 'Colorado'},
{city: 'Springfield', statecountry: 'MA', fullsc: 'Massachusetts'},
{city: 'Pasadena', statecountry: 'TX', fullsc: 'Texas'},
{city: 'Sunnyvale', statecountry: 'CA', fullsc: 'California'},
{city: 'Macon', statecountry: 'GA', fullsc: 'Georgia'},
{city: 'Pomona', statecountry: 'CA', fullsc: 'California'},
{city: 'Hollywood', statecountry: 'FL', fullsc: 'Florida'},
{city: 'Kansas City', statecountry: 'KS', fullsc: 'Kansas'},
{city: 'Escondido', statecountry: 'CA', fullsc: 'California'},
{city: 'Clarksville', statecountry: 'TN', fullsc: 'Tennessee'},
{city: 'Joliet', statecountry: 'IL', fullsc: 'Illinois'},
{city: 'Rockford', statecountry: 'IL', fullsc: 'Illinois'},
{city: 'Torrance', statecountry: 'CA', fullsc: 'California'},
{city: 'Naperville', statecountry: 'IL', fullsc: 'Illinois'},
{city: 'Paterson', statecountry: 'NJ', fullsc: 'New Jersey'},
{city: 'Savannah', statecountry: 'GA', fullsc: 'Georgia'},
{city: 'Bridgeport', statecountry: 'CT', fullsc: 'Connecticut'},
{city: 'Mesquite', statecountry: 'TX', fullsc: 'Texas'},
{city: 'Killeen', statecountry: 'TX', fullsc: 'Texas'},
{city: 'Syracuse', statecountry: 'NY', fullsc: 'New York'},
{city: 'McAllen', statecountry: 'TX', fullsc: 'Texas'},
{city: 'Pasadena', statecountry: 'CA', fullsc: 'California'},
{city: 'Bellevue', statecountry: 'WA', fullsc: 'Washington'},
{city: 'Fullerton', statecountry: 'CA', fullsc: 'California'},
{city: 'Orange', statecountry: 'CA', fullsc: 'California'},
{city: 'Dayton', statecountry: 'OH', fullsc: 'Ohio'},
{city: 'Miramar', statecountry: 'FL', fullsc: 'Florida'},
{city: 'Thornton', statecountry: 'CO', fullsc: 'Colorado'},
{city: 'West Valley City', statecountry: 'UT', fullsc: 'Utah'},
{city: 'Olathe', statecountry: 'KS', fullsc: 'Kansas'},
{city: 'Hampton', statecountry: 'VA', fullsc: 'Virginia'},
{city: 'Warren', statecountry: 'MI', fullsc: 'Michigan'},
{city: 'Midland', statecountry: 'TX', fullsc: 'Texas'},
{city: 'Waco', statecountry: 'TX', fullsc: 'Texas'},
{city: 'Charleston', statecountry: 'SC', fullsc: 'South Carolina'},
{city: 'Columbia', statecountry: 'SC', fullsc: 'South Carolina'},
{city: 'Denton', statecountry: 'TX', fullsc: 'Texas'},
{city: 'Carrollton', statecountry: 'TX', fullsc: 'Texas'},
{city: 'Surprise', statecountry: 'AZ', fullsc: 'Arizona'},
{city: 'Roseville', statecountry: 'CA', fullsc: 'California'},
{city: 'Sterling Heights', statecountry: 'MI', fullsc: 'Michigan'},
{city: 'Murfreesboro', statecountry: 'TN', fullsc: 'Tennessee'},
{city: 'Gainesville', statecountry: 'FL', fullsc: 'Florida'},
{city: 'Cedar Rapids', statecountry: 'IA', fullsc: 'Iowa'},
{city: 'Visalia', statecountry: 'CA', fullsc: 'California'},
{city: 'Coral Springs', statecountry: 'FL', fullsc: 'Florida'},
{city: 'New Haven', statecountry: 'CT', fullsc: 'Connecticut'},
{city: 'Stamford', statecountry: 'CT', fullsc: 'Connecticut'},
{city: 'Thousand Oaks', statecountry: 'CA', fullsc: 'California'},
{city: 'Concord', statecountry: 'CA', fullsc: 'California'},
{city: 'Elizabeth', statecountry: 'NJ', fullsc: 'New Jersey'},
{city: 'Lafayette', statecountry: 'LA', fullsc: 'Louisiana'},
{city: 'Kent', statecountry: 'WA', fullsc: 'Washington'},
{city: 'Topeka', statecountry: 'KS', fullsc: 'Kansas'},
{city: 'Simi Valley', statecountry: 'CA', fullsc: 'California'},
{city: 'Santa Clara', statecountry: 'CA', fullsc: 'California'},
{city: 'Athens', statecountry: 'GA', fullsc: 'Georgia'},
{city: 'Hartford', statecountry: 'CT', fullsc: 'Connecticut'},
{city: 'Victorville', statecountry: 'CA', fullsc: 'California'},
{city: 'Abilene', statecountry: 'TX', fullsc: 'Texas'},
{city: 'Norman', statecountry: 'OK', fullsc: 'Oklahoma'},
{city: 'Vallejo', statecountry: 'CA', fullsc: 'California'},
{city: 'Berkeley', statecountry: 'CA', fullsc: 'California'},
{city: 'Round Rock', statecountry: 'TX', fullsc: 'Texas'},
{city: 'Ann Arbor', statecountry: 'MI', fullsc: 'Michigan'},
{city: 'Fargo', statecountry: 'ND', fullsc: 'North Dakota'},
{city: 'Columbia', statecountry: 'MO', fullsc: 'Missouri'},
{city: 'Allentown', statecountry: 'PA', fullsc: 'Pennsylvania'},
{city: 'Evansville', statecountry: 'IN', fullsc: 'Indiana'},
{city: 'Beaumont', statecountry: 'TX', fullsc: 'Texas'},
{city: 'Odessa', statecountry: 'TX', fullsc: 'Texas'},
{city: 'Wilmington', statecountry: 'NC', fullsc: 'North Carolina'},
{city: 'Arvada', statecountry: 'CO', fullsc: 'Colorado'},
{city: 'Independence', statecountry: 'MO', fullsc: 'Missouri'},
{city: 'Provo', statecountry: 'UT', fullsc: 'Utah'},
{city: 'Lansing', statecountry: 'MI', fullsc: 'Michigan'},
{city: 'El Monte', statecountry: 'CA', fullsc: 'California'},
{city: 'Springfield', statecountry: 'IL', fullsc: 'Illinois'},
{city: 'Fairfield', statecountry: 'CA', fullsc: 'California'},
{city: 'Clearwater', statecountry: 'FL', fullsc: 'Florida'},
{city: 'Peoria', statecountry: 'IL', fullsc: 'Illinois'},
{city: 'Rochester', statecountry: 'MN', fullsc: 'Minnesota'},
{city: 'Carlsbad', statecountry: 'CA', fullsc: 'California'},
{city: 'Westminster', statecountry: 'CO', fullsc: 'Colorado'},
{city: 'West Jordan', statecountry: 'UT', fullsc: 'Utah'},
{city: 'Pearland', statecountry: 'TX', fullsc: 'Texas'},
{city: 'Richardson', statecountry: 'TX', fullsc: 'Texas'},
{city: 'Downey', statecountry: 'CA', fullsc: 'California'},
{city: 'Miami Gardens', statecountry: 'FL', fullsc: 'Florida'},
{city: 'Temecula', statecountry: 'CA', fullsc: 'California'},
{city: 'Costa Mesa', statecountry: 'CA', fullsc: 'California'},
{city: 'College Station', statecountry: 'TX', fullsc: 'Texas'},
{city: 'Elgin', statecountry: 'IL', fullsc: 'Illinois'},
{city: 'Murrieta', statecountry: 'CA', fullsc: 'California'},
{city: 'Gresham', statecountry: 'OR', fullsc: 'Oregon'},
{city: 'High Point', statecountry: 'NC', fullsc: 'North Carolina'},
{city: 'Antioch', statecountry: 'CA', fullsc: 'California'},
{city: 'Inglewood', statecountry: 'CA', fullsc: 'California'},
{city: 'Cambridge', statecountry: 'MA', fullsc: 'Massachusetts'},
{city: 'Lowell', statecountry: 'MA', fullsc: 'Massachusetts'},
{city: 'Manchester', statecountry: 'NH', fullsc: 'New Hampshire'},
{city: 'Billings', statecountry: 'MT', fullsc: 'Montana'},
{city: 'Pueblo', statecountry: 'CO', fullsc: 'Colorado'},
{city: 'Palm Bay', statecountry: 'FL', fullsc: 'Florida'},
{city: 'Centennial', statecountry: 'CO', fullsc: 'Colorado'},
{city: 'Richmond', statecountry: 'CA', fullsc: 'California'},
{city: 'Ventura', statecountry: 'CA', fullsc: 'California'},
{city: 'Pompano Beach', statecountry: 'FL', fullsc: 'Florida'},
{city: 'North Charleston', statecountry: 'SC', fullsc: 'South Carolina'},
{city: 'Everett', statecountry: 'WA', fullsc: 'Washington'},
{city: 'Waterbury', statecountry: 'CT', fullsc: 'Connecticut'},
{city: 'West Palm Beach', statecountry: 'FL', fullsc: 'Florida'},
{city: 'Boulder', statecountry: 'CO', fullsc: 'Colorado'},
{city: 'West Covina', statecountry: 'CA', fullsc: 'California'},
{city: 'Broken Arrow', statecountry: 'OK', fullsc: 'Oklahoma'},
{city: 'Clovis', statecountry: 'CA', fullsc: 'California'},
{city: 'Daly City', statecountry: 'CA', fullsc: 'California'},
{city: 'Lakeland', statecountry: 'FL', fullsc: 'Florida'},
{city: 'Santa Maria', statecountry: 'CA', fullsc: 'California'},
{city: 'Norwalk', statecountry: 'CA', fullsc: 'California'},
{city: 'Sandy Springs', statecountry: 'GA', fullsc: 'Georgia'},
{city: 'Hillsboro', statecountry: 'OR', fullsc: 'Oregon'},
{city: 'Green Bay', statecountry: 'WI', fullsc: 'Wisconsin'},
{city: 'Tyler', statecountry: 'TX', fullsc: 'Texas'},
{city: 'Wichita Falls', statecountry: 'TX', fullsc: 'Texas'},
{city: 'Lewisville', statecountry: 'TX', fullsc: 'Texas'},
{city: 'Burbank', statecountry: 'CA', fullsc: 'California'},
{city: 'Greeley', statecountry: 'CO', fullsc: 'Colorado'},
{city: 'San Mateo', statecountry: 'CA', fullsc: 'California'},
{city: 'El Cajon', statecountry: 'CA', fullsc: 'California'},
{city: 'Jurupa Valley', statecountry: 'CA', fullsc: 'California'},
{city: 'Rialto', statecountry: 'CA', fullsc: 'California'},
{city: 'Davenport', statecountry: 'IA', fullsc: 'Iowa'},
{city: 'League City', statecountry: 'TX', fullsc: 'Texas'},
{city: 'Edison', statecountry: 'NJ', fullsc: 'New Jersey'},
{city: 'Davie', statecountry: 'FL', fullsc: 'Florida'},
{city: 'Las Cruces', statecountry: 'NM', fullsc: 'New Mexico'},
{city: 'South Bend', statecountry: 'IN', fullsc: 'Indiana'},
{city: 'Vista', statecountry: 'CA', fullsc: 'California'},
{city: 'Woodbridge', statecountry: 'NJ', fullsc: 'New Jersey'},
{city: 'Renton', statecountry: 'WA', fullsc: 'Washington'},
{city: 'Lakewood', statecountry: 'NJ', fullsc: 'New Jersey'},
{city: 'San Angelo', statecountry: 'TX', fullsc: 'Texas'},
{city: 'Clinton', statecountry: 'MI', fullsc: 'Michigan'}
];
var allWorld = [
{ city: 'Agra', statecountry: 'IN', fullsc: 'India'},
{ city: 'Anchorage', statecountry: 'US', fullsc: 'United States of America'},
{ city: 'Astana', statecountry: 'KZ', fullsc: 'Kazakhstan'},
{ city: 'Athens', statecountry: 'GR', fullsc: 'Greece'},
{ city: 'Austin', statecountry: 'US', fullsc: 'United States of America'},
{ city: 'Bamako', statecountry: 'ML', fullsc: 'Mali'},
{ city: 'Bangkok', statecountry: 'TH', fullsc: 'Thailand'},
{ city: 'Barcelona', statecountry: 'ES', fullsc: 'Spain'},
{ city: 'Beijing', statecountry: 'CN', fullsc: 'China'},
{ city: 'Berlin', statecountry: 'DE', fullsc: 'Germany'},
{ city: 'Bogota', statecountry: 'CO', fullsc: 'Colombia'},
{ city: 'Boston', statecountry: 'US', fullsc: 'United States of America'},
{ city: 'Budapest', statecountry: 'HU', fullsc: 'Hungary'},
{ city: 'Buenos Aires', statecountry: 'AR', fullsc: 'Argentina'},
{ city: 'Cairo', statecountry: 'EG', fullsc: 'Egypt'},
{ city: 'Calgary', statecountry: 'CA', fullsc: 'Canada'},
{ city: 'Cape Town', statecountry: 'ZA', fullsc: 'South Africa'},
{ city: 'Casablanca', statecountry: 'MA', fullsc: 'Morocco'},
{ city: 'Chicago', statecountry: 'US', fullsc: 'United States of America'},
{ city: 'Colombo', statecountry: 'LK', fullsc: 'Sri Lanka'},
{ city: 'Copenhagen', statecountry: 'DK', fullsc: 'Denmark'},
{ city: 'Dubai', statecountry: 'AE', fullsc: 'United Arab Emirates'},
{ city: 'Dublin', statecountry: 'IE', fullsc: 'Ireland'},
{ city: 'Giza', statecountry: 'EG', fullsc: 'Egypt'},
{ city: 'Havana', statecountry: 'CU', fullsc: 'Cuba'},
{ city: 'Heidelberg', statecountry: 'DE', fullsc: 'Germany'},
{ city: 'Ho Chi Minh City', statecountry: 'VN', fullsc: 'Viet Nam'},
{ city: 'Hong Kong', statecountry: 'CN', fullsc: 'China'},
{ city: 'Honolulu', statecountry: 'US', fullsc: 'United States of America'},
{ city: 'Istanbul', statecountry: 'TR', fullsc: 'Turkey'},
{ city: 'Jeddah', statecountry: 'SA', fullsc: 'Saudi Arabia'},
{ city: 'Johannesburg', statecountry: 'ZA', fullsc: 'South Africa'},
{ city: 'Kathmandu', statecountry: 'NP', fullsc: 'Nepal'},
{ city: 'Kiev', statecountry: 'UA', fullsc: 'Ukraine'},
{ city: 'Kigali', statecountry: 'RW', fullsc: 'Rwanda'},
{ city: 'Kyoto', statecountry: 'JP', fullsc: 'Japan'},
{ city: 'Lagos', statecountry: 'NG', fullsc: 'Nigeria'},
{ city: 'Lahore', statecountry: 'PK', fullsc: 'Pakistan'},
{ city: 'Las Vegas', statecountry: 'US', fullsc: 'United States of America'},
{ city: 'Lima', statecountry: 'PE', fullsc: 'Peru'},
{ city: 'London', statecountry: 'GB', fullsc: 'United Kingdom'},
{ city: 'Madrid', statecountry: 'ES', fullsc: 'Spain'},
{ city: 'Manila', statecountry: 'PH', fullsc: 'Philippines'},
{ city: 'Marrakesh', statecountry: 'MA', fullsc: 'Morocco'},
{ city: 'Mexico City', statecountry: 'MX', fullsc: 'Mexico'},
{ city: 'Miami', statecountry: 'US', fullsc: 'United States of America'},
{ city: 'Moscow', statecountry: 'RU', fullsc: 'Russian Federation'},
{ city: 'Nairobi', statecountry: 'KE', fullsc: 'Kenya'},
{ city: 'Nara', statecountry: 'JP', fullsc: 'Japan'},
{ city: 'Nashville', statecountry: 'US', fullsc: 'United States of America'},
{ city: 'New Delhi', statecountry: 'IN', fullsc: 'India'},
{ city: 'New York', statecountry: 'US', fullsc: 'United States of America'},
{ city: 'Ottawa', statecountry: 'CA', fullsc: 'Canada'},
{ city: 'Panama City', statecountry: 'PA', fullsc: 'Panama'},
{ city: 'Paris', statecountry: 'FR', fullsc: 'France'},
{ city: 'Perth', statecountry: 'AU', fullsc: 'Australia'},
{ city: 'Port Moresby', statecountry: 'PG', fullsc: 'Papua New Guinea'},
{ city: 'Quebec', statecountry: 'CA', fullsc: 'Canada'},
{ city: 'Quito', statecountry: 'EC', fullsc: 'Ecuador'},
{ city: 'Reykjavik', statecountry: 'IS', fullsc: 'Iceland'},
{ city: 'Rio de Janeiro', statecountry: 'BR', fullsc: 'Brazil'},
{ city: 'Rome', statecountry: 'IT', fullsc: 'Italy'},
{ city: 'Salzberg', statecountry: 'AT', fullsc: 'Austria'},
{ city: 'Santiago', statecountry: 'CL', fullsc: 'Chile'},
{ city: 'St Petersburg', statecountry: 'RU', fullsc: 'Russian Federation'},
{ city: 'San Diego', statecountry: 'US', fullsc: 'United States of America'},
{ city: 'San Francisco', statecountry: 'US', fullsc: 'United States of America'},
{ city: 'Sao Paulo', statecountry: 'BR', fullsc: 'Brazil'},
{ city: 'Seattle', statecountry: 'US', fullsc: 'United States of America'},
{ city: 'Seoul', statecountry: 'KR', fullsc: 'Korea (South)'},
{ city: 'Shanghai', statecountry: 'CN', fullsc: 'China'},
{ city: 'Singapore', statecountry: 'SG', fullsc: 'Singapore'},
{ city: 'Stockholm', statecountry: 'SE', fullsc: 'Sweden'},
{ city: 'Sydney', statecountry: 'AU', fullsc: 'Australia'},
{ city: 'Tel Aviv', statecountry: 'IL', fullsc: 'Israel'},
{ city: 'The Hague', statecountry: 'NL', fullsc: 'Netherlands'},
{ city: 'Tokyo', statecountry: 'JP', fullsc: 'Japan'},
{ city: 'Toronto', statecountry: 'CA', fullsc: 'Canada'}
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
