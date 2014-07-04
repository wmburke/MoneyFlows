(function() {
	'use strict';
	/*jslint nomen: true */
	/*global PouchDB, console, WMB */
	
	var db = new PouchDB('MoneyFlows'),
	remoteCouch,
	ENTER_KEY = 13,
	
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
			
			// Format amount
			flow.amount = flow.amount * 1000;
			
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
		
		formatOutput: function(flow) {
			var date;

			// format the dates
			if (flow.dateDue !== "") {
				date = new Date(flow.dateDue);
				flow.dateDue = date.getMonth() + 1 + '/' + date.getDate();
			}
			if (flow.datePaid !== "") {
				date = new Date(flow.datePaid);
				flow.datePaid = date.getMonth() + 1 + '/' + date.getDate();
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
	
		makeCheckbox: function(flow, name, listen) {
		// create the checkbox object
		// if listen is true, add the event listener
			var checkbox = document.createElement('input');
			checkbox.className = 'col_' + name;
			checkbox.type = 'checkbox';
			if (flow[name] === true) {
				checkbox.checked = flow[name]; 
			}
			if (listen === true) {
				checkbox.addEventListener('change', this.checkboxChanged.bind(name, this, flow));
			}
			return checkbox;
		},
		
		makeLabel: function(flow, name) {
			var label = document.createElement('label');
			label.className = 'col_' + name;
			label.appendChild(document.createTextNode(flow[name]));
			label.title = flow[name];
			label.addEventListener('dblclick', this.dblClicked.bind(name, this, flow));
			return label;
		},
		
		makeButton: function(flow, name) {
			var button = document.createElement('name');
			button.className = 'destroy';
			button.addEventListener( 'click', this.deleteButtonPressed.bind(this, flow));
			return button;
		},
		
		makeEditable: function(flow, name) {
			var editable = document.createElement('input');
			editable.id = 'input_' + flow._id + '_' + name;
			editable.className = 'col_' + name;
			editable.value = flow[name];
			editable.addEventListener('keypress', this.keyPressed.bind(this, flow, name));
			return editable;
		},
		
		checkboxChanged: function(name, flow, event) {
		// The checkbox value changed - save it to the DB
		// name is the name of the element in the database
			flow[this] = event.target.checked;
			mainPage.prepForDB(flow);
			db.put(flow);
		},
		
		dblClicked: function(name, flow) {
		// User has double clicked a field, display an input so they can edit it
			var div = document.getElementById('div_' + flow._id),
			inputEdit = document.getElementById('input_' + flow._id + '_' + this);
			div.className = 'editing';
			inputEdit.focus();
		},

		keyPressed: function(flow, name, event) {
		// If they press enter while editing an entry, save the row
			if (event.keyCode === ENTER_KEY) {
				var fields = event.target.parentNode.childNodes;
				flow.dateDue = fields[0].value.trim();
				flow.harborTo = fields[1].value.trim();
				flow.amount = fields[2].value.trim();
				flow.isScheduled = fields[3].checked;
				flow.datePaid = fields[4].value.trim();
				flow.harborFrom = fields[5].value.trim();
				flow.isTaxable = fields[6].checked;
				flow.isLoan = fields[7].checked;
				flow.notes = fields[8].value.trim();
				
				mainPage.prepForDB(flow);
			
				db.put(flow);
			}
		},

		deleteButtonPressed: function(flow) {
		// User pressed the delete button for a flow, delete it
			db.remove(flow);
		},

		createDiv: function(flow) {
		// Create a div to display a flow.
		
			// fix the display
			mainPage.formatOutput(flow);
		
			// create all the components of the div
			
			// these are the overarching elements that contain the others
			var	div_ = document.createElement('div'),
			divEdit = document.createElement('div'),
			divView = document.createElement('div'),
			spanHidden = document.createElement('span'),
			
			// these are all the elements to show 
			dateDue = this.makeLabel(flow, 'dateDue'),
			harborTo = this.makeLabel(flow, 'harborTo'),
			amount = this.makeLabel(flow, 'amount'),
			isScheduled = this.makeCheckbox(flow, 'isScheduled', true),
			datePaid = this.makeLabel(flow, 'datePaid'),
			harborFrom = this.makeLabel(flow, 'harborFrom'),
			isTaxable = this.makeCheckbox(flow, 'isTaxable', true),
			isLoan = this.makeCheckbox(flow, 'isLoan', true),
			notes = this.makeLabel(flow, 'notes'),
			deleteLink = this.makeButton(flow, 'deleteLink'),

			// these are all the hidden edit elements
			edit_dateDue = this.makeEditable(flow, 'dateDue'),
			edit_harborTo = this.makeEditable(flow, 'harborTo'),
			edit_amount = this.makeEditable(flow, 'amount'),
			edit_isScheduled = this.makeCheckbox(flow, 'isScheduled'),
			edit_datePaid = this.makeEditable(flow, 'datePaid'),
			edit_harborFrom = this.makeEditable(flow, 'harborFrom'),
			edit_isTaxable = this.makeCheckbox(flow, 'isTaxable'),
			edit_isLoan = this.makeCheckbox(flow, 'isLoan'),
			edit_notes = this.makeEditable(flow, 'notes');

			// put the view elements together in a div
			divView.className = 'view';
			divView.appendChild(dateDue);
			divView.appendChild(harborTo);
			divView.appendChild(amount);
			divView.appendChild(isScheduled);
			divView.appendChild(datePaid);
			divView.appendChild(spanHidden);
			spanHidden.className = "invisible";
			spanHidden.appendChild(harborFrom);
			spanHidden.appendChild(isTaxable);
			spanHidden.appendChild(isLoan);
			spanHidden.appendChild(notes);
			divView.appendChild(deleteLink);
			
			// put the initially hidden edit elements together
			divEdit.className = 'edit';
			divEdit.appendChild(edit_dateDue);
			divEdit.appendChild(edit_harborTo);
			divEdit.appendChild(edit_amount);
			divEdit.appendChild(edit_isScheduled);
			divEdit.appendChild(edit_datePaid);
			divEdit.appendChild(edit_harborFrom);
			divEdit.appendChild(edit_isTaxable);
			divEdit.appendChild(edit_isLoan);
			divEdit.appendChild(edit_notes);

			// put it all together
			div_.id = 'div_' + flow._id;
			div_.appendChild(divView);
			div_.appendChild(divEdit);

			// check if the checkboxes should be checked
			if (flow.isScheduled) {
				div_.className += 'isScheduled';
				isScheduled.checked = true;
			}
			if (flow.isTaxable) {
				isTaxable.checked = true;
			}
			if (flow.isLoan) {
				isLoan.checked = true;
			}

			return div_;
		},

		redraw: function(flowsToShow) {
		    var div = document.getElementById('flows');
			div.innerHTML = '';
			flowsToShow.forEach(function(flowFromDB) {
				if(flowFromDB.doc._id !== "options") {
					div.appendChild(flows.createDiv(flowFromDB.doc));
				}
			});
		},

		doIt: function() {
			db.allDocs({include_docs: true}, function(err, docs) {
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

	function newFlowKeyPressHandler( event ) {
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

	function addEventListeners() {
		dom.newFlow.addEventListener('keypress', newFlowKeyPressHandler, false);
	}

	// to remove the database
/*	db.destroy(function(err, info) {
		if (err) {console.log('Datebase destruction error: ' + err);}
		console.log("Databse destroyed! " + info);
	});
*/
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