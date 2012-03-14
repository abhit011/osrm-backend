/*
This program is free software; you can redistribute it and/or modify
it under the terms of the GNU AFFERO General Public License as published by
the Free Software Foundation; either version 3 of the License, or
any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
or see http://www.gnu.org/licenses/agpl.txt.
*/

// OSRM JSONP call wrapper 
// [wrapper for JSONP calls with DOM cleaning, fencing, timout handling]


OSRM.JSONP = {
		
	// storage to keep track of unfinished JSONP calls
	fences: {},
	callbacks: {},
	timeouts: {},
	timers: {},
	
	
	// default callback routines
	late: function() { /*OSRM.debug.log("[jsonp] reply too late");*/ },	
	empty: function() { /*OSRM.debug.log("[jsonp] empty callback");*/ },
	
	
	// init JSONP call
	call: function(source, callback_function, timeout_function, timeout, id) {
		// only one active JSONP call per id
		if (OSRM.JSONP.fences[id] == true)
			return false;
		OSRM.JSONP.fences[id] = true;
		
		// wrap timeout function
		OSRM.JSONP.timeouts[id] = function(response) {
			timeout_function(response);
			
			OSRM.JSONP.callbacks[id] = OSRM.JSONP.late;				// clean functions
			OSRM.JSONP.timeouts[id] = OSRM.JSONP.late;
			OSRM.JSONP.fences[id] = undefined;						// clean fence
			
//			OSRM.debug.log("[jsonp] timout handling: "+id);
		};
		
		// wrap callback function
		OSRM.JSONP.callbacks[id] = function(response) {
			clearTimeout(OSRM.JSONP.timers[id]);					// clear timeout timer
			OSRM.JSONP.timers[id] = undefined;
			
			if( OSRM.JSONP.fences[id] == undefined )				// fence to prevent execution after timeout function (when precompiled!)
				return;		

			callback_function(response);							// actual wrapped callback 
			
			OSRM.JSONP.callbacks[id] = OSRM.JSONP.late;				// clean functions
			OSRM.JSONP.timeouts[id] = OSRM.JSONP.late;
			OSRM.JSONP.fences[id] = undefined;						// clean fence
			
//			OSRM.debug.log("[jsonp] response handling: "+id);
		};
		
		// clean DOM (unfortunately, script elements cannot be reused by all browsers)
		var jsonp = document.getElementById('jsonp_'+id);
		if(jsonp)
			jsonp.parentNode.removeChild(jsonp);		
		
		// add script to DOM
		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.id = 'jsonp_'+id;
		script.src = source + "&json_callback=OSRM.JSONP.callbacks."+id + "&jsonp=OSRM.JSONP.callbacks."+id;
		document.head.appendChild(script);
		
		// start timeout timer
		OSRM.JSONP.timers[id] = setTimeout(OSRM.JSONP.timeouts[id], timeout);

//		OSRM.debug.log("[jsonp] init: "+id);		
		return true;
	}
};