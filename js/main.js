(function() {
	'use strict';
	/*jslint nomen: true */
	/*global PouchDB, console, WMB */
	
	var db = new PouchDB('MoneyFlows'),
	remoteCouch,
	ENTER_KEY = 13,
	ESC_KEY = 27,
	TAB_KEY = 9,
	
	// these connect variables to data entry fields on the page
	dom = {
		dateDue: document.getElementById('dateDue'),
		harborTo: document.getElementById('harborTo'),
		amount: document.getElementById('amount'),
		isScheduled: document.getElementById('isScheduled'),
		datePaid: document.getElementById('datePaid'),
		harborFrom: document.getElementById('harborFrom'),
		isTaxable: document.getElementById('isTaxable'),
		isLoan: document.getElementById('isLoan'),
		notes: document.getElementById('notes'),
		
		totalMaybe: document.getElementById('totalMaybe'),
		totalReal: document.getElementById('totalReal'),
		dateReal: document.getElementById('dateReal'),
		
		newFlow: document.getElementById('newFlow'),
		sync: document.getElementById('syncWrapper')
	},
	
	mainPage = {
	// for operations specific to the main page

		prepForDB: function(flow) {
			
			var date;
			
			// Validate and format dateDue
			if (flow.dateDue !== "") {
				
				date = WMB.checkDate(flow.dateDue);
				if (date === false) {
					alert('Your Due Date is bad.\n\nPlease try something like the following: 4/30 or 4/30/13 to specify a year. You can also use - or . as separators.');
					return;
				}
				flow.dateDue = date;
			}
			
			// Validate and format datePaid
			if (flow.datePaid !== "") {
				date = WMB.checkDate(flow.datePaid);
				if (date === false) {
					alert('Your Date Paid is bad.\n\nPlease try something like the following: 4/30 or 4/30/13 to specify a year. You can also use - or . as separators.');
					return;
				}
				flow.datePaid = date;
			}
			
			// Make sure the additional ...Year items don't make their way back to the database
			if (flow.dateDueYear) {
				delete flow.dateDueYear;
			}
			if (flow.datePaidYear) {
				delete flow.datePaidYear;
			}
						
			// Format amount
			flow.amount = flow.amount * 1000;
			
			// Check for notes
			if (flow.notes === "") {
				flow.notes = "No notes for this flow.";
			}
			
			return flow;

		},

		add: function(newFlow) {
			var flow = {
				_id: new Date().toISOString(),
				dateDue: newFlow.dateDue.value,
				harborTo: newFlow.harborTo.value,
				amount: newFlow.amount.value,
				isScheduled: newFlow.isScheduled.checked,
				datePaid: newFlow.datePaid.value,
				harborFrom: newFlow.harborFrom.value,
				isTaxable: newFlow.isTaxable.checked,
				isLoan: newFlow.isLoan.checked,
				notes: newFlow.notes.value
			};
			
			this.prepForDB(flow);
			
			db.put(flow, function callback(err, result) {
				if(err) {
					console.log("Here's the error:" + err);
				}
			});
		},
		
		prepFromDB: function(flow) {
		// take the info for a flow from the DB and make it ready for printing

			var date;

			// format the dates
			if (flow.dateDue !== "") {
				date = new Date(flow.dateDue);
				flow.dateDue = date.getMonth() + 1 + '/' + date.getDate();
				flow.dateDueYear = '/' + (date.getYear() + 1900);
			}
			if (flow.datePaid !== "") {
				date = new Date(flow.datePaid);
				flow.datePaid = date.getMonth() + 1 + '/' + date.getDate();
				flow.datePaidYear = '/' + (date.getYear() + 1900);
			}
			
			// format the amounts
			if (flow.amount !== "") {
				flow.amount = (Math.round(flow.amount / 10) / 100).toFixed(2);
			}
			
			return flow;
		},

		update: function() {
			
		},
		del: function() {
			
		}
	},

	flows = {
	// for showing and editing the flows list
	
		// variables to track against the flows
		totalMoneyMaybe : 0,
		totalMoneyReal: 0,
		lastDateReal: 0,
		tabIndex: 100,
		
		makeField: function(flow, name) {
			var label = document.createElement('div');
			label.className = 'col_' + name;
			label.appendChild(document.createTextNode(flow[name]));
			label.title = flow[name];
			label.contentEditable = "true";
			label.setAttribute("tabindex", this.tabIndex);
			this.tabIndex += 1;
			if (name.lastIndexOf("date", 0) === 0 && flow[name] !== "") {
				label.title += flow[name + "Year"];
			}
			label.addEventListener('keypress', this.keyPressed.bind(this, flow, name));
			return label;
		},
		
		makeCheckbox: function(flow, name, listener) {
		// create the checkbox object
			var checkbox = document.createElement('input');
			checkbox.className = 'col_' + name;
			checkbox.type = 'checkbox';
			if (flow[name] === true) {
				checkbox.checked = flow[name]; 
			}
			checkbox.setAttribute("tabindex", this.tabIndex);
			this.tabIndex += 1;
			if (listener === "changed") {
				checkbox.addEventListener('change', this.checkboxChanged.bind(name, this, flow));
			} else if (listener === "showPopup") {
				checkbox.addEventListener('change', this.checkboxShowPopup.bind(name, this, flow));
			}
			return checkbox;
		},
		
		makeDestroy: function(flow, name) {
			var button = document.createElement('name');
			button.className = 'destroy';
			button.addEventListener( 'click', this.deleteButtonPressed.bind(this, flow));
			return button;
		},
		
		make_spanPopup: function(harborFrom, isTaxable, isLoan, notes) {
		// make the spanPopup for the flows
			
			// create the elements
			var	spanPopup = document.createElement('span'),
			div_harborFrom = document.createElement('div'),
			span_harborFrom = document.createElement('span'),
			div_isTaxable = document.createElement('div'),
			span_isTaxable = document.createElement('span'),
			div_isLoan = document.createElement('div'),
			span_isLoan = document.createElement('span');
			
			// add classes
			spanPopup.className = "invisible flowHiddenInfo";
			
			// make the divs
			div_harborFrom.innerHTML = 'From ';
			div_harborFrom.appendChild(harborFrom);
			div_isTaxable.innerHTML = "Is this flow taxable? ";
			div_isTaxable.appendChild(isTaxable);
			div_isLoan.innerHTML = "Is this flow a loan? ";
			div_isLoan.appendChild(isLoan);
			
			// add it up
			spanPopup = this.appendChildren(spanPopup, [div_harborFrom, div_isTaxable, div_isLoan, notes]);
			spanPopup.contentEditable = "false";
			return spanPopup;
		},
		
		appendChildren: function(object, appendages) {
			appendages.forEach(function(child) {
				object.appendChild(child);
			});
			return object;
		},
		
		checkboxChanged: function(name, flow, event) {
		// The checkbox value changed - save it to the DB
		// name is the name of the element in the database
			flow[this] = event.target.checked;
			mainPage.prepForDB(flow);
			db.put(flow);
		},
		
		checkboxShowPopup: function(name, flow, event) {
		// show/hide flowHiddenInfo
			if (event.target.checked === true) {
				event.target.parentNode.childNodes[8].className = "flowHiddenInfo";
			} else {
				event.target.parentNode.childNodes[8].className = "invisible flowHiddenInfo";
			}
		},
		
		keyPressed: function(flow, name, event) {
		// If they press enter while editing an entry, save the row
			if (event.keyCode === ENTER_KEY) {
				var fields;
				// if name equals any of these:
				if (["harborFrom", "isTaxable", "isLoan", "notes"].indexOf(name) !== -1) {
					fields = event.target.parentNode.parentNode.parentNode.childNodes;
				} else {
					fields = event.target.parentNode.childNodes;
				}
				flow.dateDue = fields[0].textContent.trim();
				flow.harborTo = fields[1].textContent.trim();
				flow.amount = fields[2].textContent.trim();
				flow.datePaid = fields[3].textContent.trim();
				flow.isScheduled = fields[4].checked;
				flow.harborFrom = fields[8].childNodes[0].childNodes[1].textContent.trim();
				flow.isTaxable = fields[8].childNodes[1].childNodes[1].checked;
				flow.isLoan = fields[8].childNodes[2].childNodes[1].checked;
				flow.notes = fields[8].childNodes[3].textContent.trim();
				
				mainPage.prepForDB(flow);
			
				db.put(flow);
			} //else if (event.keyCode === ESC_KEY) {
//				this.doIt();
//			}
		},

		deleteButtonPressed: function(flow) {
		// User pressed the delete button for a flow, delete it
			db.remove(flow);
		},

		makeRow: function(flow) {
		// Create a div to display a flow.
		
			// fix the display
			mainPage.prepFromDB(flow);
		
			// create all the components of the div
			
			// these are the overarching elements that contain the others
			var	divRow = document.createElement('div'),
			
			// these are all the elements to show 
			dateDue = this.makeField(flow, 'dateDue'),
			harborTo = this.makeField(flow, 'harborTo'),
			amount = this.makeField(flow, 'amount'),
			datePaid = this.makeField(flow, 'datePaid'),
			isScheduled = this.makeCheckbox(flow, 'isScheduled', 'changed'),
			showPopup = this.makeCheckbox(flow, 'showPopup', 'showPopup'),
			harborFrom = this.makeField(flow, 'harborFrom'),
			isTaxable = this.makeCheckbox(flow, 'isTaxable', 'changed'),
			isLoan = this.makeCheckbox(flow, 'isLoan', 'changed'),
			notes = this.makeField(flow, 'notes'),
			spanPopup = this.make_spanPopup(harborFrom, isTaxable, isLoan, notes),
			deleteLink = this.makeDestroy(flow, 'deleteLink'),

			// add the totals up and include them
			moneyMaybe = document.createElement('div'),
			moneyReal = document.createElement('div');
				// add on amounts to the totals
			this.totalMoneyMaybe += parseFloat(flow.amount);
			if (flow.datePaid !== "") {
				this.totalMoneyReal += parseFloat(flow.amount);
				this.lastDateReal = flow.datePaid;
				divRow.className += ' reconciled';
				isScheduled.className += " invisible";
			}
			moneyMaybe.appendChild(document.createTextNode(this.totalMoneyMaybe.toFixed(2)));
			moneyReal.appendChild(document.createTextNode(this.totalMoneyReal.toFixed(2)));
			moneyMaybe.className = "col_moneyMaybe";
			moneyReal.className = "col_moneyReal"; 
			
			// put it all together
			divRow.id = 'div_' + flow._id;
			divRow = this.appendChildren(divRow, [dateDue, harborTo, amount, datePaid, isScheduled, showPopup, moneyMaybe, moneyReal, spanPopup, deleteLink]);

			// check if the checkboxes should be checked
			if (flow.isScheduled) {
				divRow.className += ' isScheduled';
				isScheduled.checked = true;
			}
			if (flow.isTaxable) {
				isTaxable.checked = true;
			}
			if (flow.isLoan) {
				isLoan.checked = true;
			}

			return divRow;
		},

		redraw: function(flowsToShow) {
		    var div = document.getElementById('flows');
			div.innerHTML = '';
			this.totalMoneyMaybe = 0;
			this.totalMoneyReal = 0;
			this.tabIndex = 100;
			flowsToShow.forEach(function(flowFromDB) {
				if(flowFromDB.doc._id !== "options") {
					div.appendChild(flows.makeRow(flowFromDB.doc));
				}
			});
			dom.totalMaybe.innerHTML = this.totalMoneyMaybe.toFixed(2); 
			dom.dateReal.innerHTML = this.lastDateReal; 
			dom.totalReal.innerHTML = this.totalMoneyReal.toFixed(2); 
		},
		
		sort: function(a, b, col) {
			return a.doc[col]-b.doc[col];
		},

		doIt: function() {
			db.allDocs({include_docs: true}, function(err, docs) {
				docs.rows.sort(function(a, b) {
					return flows.sort(a, b, "dateDue");
				});
				flows.redraw(docs.rows);
			});
		}
		
	},
	
	sync = {
	// all the info to sync with CouchDB		
		error: function() {
		// There was some form or error syncing
			dom.sync.setAttribute('data-sync-state', 'error');
		},
  
		doIt: function() {
		// Initialise a sync with the remote server
			dom.sync.setAttribute('data-sync-state', 'syncing');
			var opts = {live: true};
			db.replicate.to(remoteCouch, opts, sync.error);
			db.replicate.from(remoteCouch, opts, sync.error);
		}
		
	};
	
	function saveNewFlow(event) {
		if (event.keyCode === ENTER_KEY) {
			mainPage.add(dom);
			dom.dateDue.value = '';
			dom.harborTo.value = '';
			dom.amount.value = '';
			dom.isScheduled.checked = 0;
			dom.datePaid.value = '';
			dom.harborFrom.value = '';
			dom.isTaxable.checked = 0;
			dom.isLoan.checked = 0;
			dom.notes.value = '';
			dom.dateDue.focus();
		}		
	}
	
	function makeInvisible(event) {
		if (event.explicitOriginalTarget.parentNode.className === "flowHiddenInfo invisible") {
			event.stopImmediatePropogation();
		} else {
			dom.newFlow.childNodes[7].className = "flowHiddenInfo invisible";
		}
	}

	function makeVisible(event) {
		dom.newFlow.childNodes[7].className = "flowHiddenInfo";
	}

	function addEventListeners() {
		dom.newFlow.addEventListener("keypress", saveNewFlow, true);
		
		// make newFlow .flowHiddenInfo disappear
		document.body.addEventListener("mousedown", makeInvisible, true);

		// make newFlow .flowHiddenInfo appear and stick around for input
/*		dom.dateDue.addEventListener("focus", makeVisible, true);
		dom.harborTo.addEventListener("focus", makeVisible, true);
		dom.amount.addEventListener("focus", makeVisible, true);
		dom.isScheduled.addEventListener("focus", makeVisible, true);
*/		dom.datePaid.addEventListener("focus", makeVisible, true);
		dom.harborFrom.addEventListener("focus", makeVisible, true);
		dom.isTaxable.addEventListener("focus", makeVisible, true);
		dom.isLoan.addEventListener("focus", makeVisible, true);
		dom.notes.addEventListener("focus", makeVisible, true);
		document.getElementById('newFlow').addEventListener("mousedown", makeVisible, true);
	}

	db.info(function(err, info) {
		db.changes({
			since: info.update_seq,
			live: true
		}).on('change', flows.doIt);
	});

	addEventListeners();
	flows.doIt();

	db.get("options", function(err, doc) {
		if (err) {
			console.log('db.get error: ' + err);
		} else {
			if (doc.remoteServer) {
				remoteCouch = doc.remoteServer;
				sync.doIt();
			}
		}
	});

}());