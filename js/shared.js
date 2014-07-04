// Shared javascript functions for the app
var WMB = {
	
	checkDate: function(value) {
	// check that the date is an actual date, eg not Feb 30 or whatever
	
		'use strict';
		
	// break it down to month, day, and year
		var m, d, y, dt, mon, day, yr,
		
		currentYear = new Date().getFullYear(),
		futureYear = currentYear + 50, //last two digit year that the code will accept as in the future, after this it will look to the past 
		
		regEx = /(\d+)[\/.\-](\d+)[\/.\-]*(\d*)/,
		matches = regEx.exec(value);
		if (!matches[3]) {
			matches[3] = currentYear;
		}
		if (matches) {
			m = parseFloat(matches[1]);
			d = parseFloat(matches[2]);
			y = parseFloat(matches[3]);
		}
		
		if (y < 100) {
			if (y + 2000 <= futureYear) {
				y = y + 2000; 
			} else {
				y = y + 1900;
			}
		}
	//verify that date is an actual date and save it as a date
		// create the date object with the values sent in (month is zero based)
		dt = new Date(y,m-1,d,0,0,0,0);
		// get the month, day, and year from the object we just created 
		mon = dt.getMonth() + 1;
		day = dt.getDate();
		yr  = dt.getYear() + 1900;
		// if they match then the date is valid
		if ( mon === m && yr === y && day === d ) {
			return dt; 
		}
		//return false
		return false;
			
	}
};
   
