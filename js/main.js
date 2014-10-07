(function() {
	'use strict';
	/*jslint nomen: true */
	/*global PouchDB, console, MoFlo, JQuery, $ */
	
	var db = new PouchDB('MoneyFlows'),
	ENTER_KEY = 13,
	ESC_KEY = 27,
	TAB_KEY = 9,
	
	// these connect variables to data entry fields on the page
	dom = {
		date: document.getElementById('date'),
		harborTo: document.getElementById('harborTo'),
		amount: document.getElementById('amount'),
		status: document.getElementById('status'),
		harborFrom: document.getElementById('harborFrom'),
		isTaxable: document.getElementById('isTaxable'),
		isLoan: document.getElementById('isLoan'),
		notes: document.getElementById('notes'),
		
		harborTo_rev: document.getElementById('harborTo_rev'),
		harborTo_name: document.getElementById('harborTo_name'),
		harborTo_isMine: document.getElementById('harborTo_isMine'),
		harborTo_nameFull: document.getElementById('harborTo_nameFull'),
		harborTo_accountNum: document.getElementById('harborTo_accountNum'),
		harborTo_contactInfo: document.getElementById('harborTo_contactInfo'),
		harborTo_notes: document.getElementById('harborTo_notes'),
		
		harborFrom_rev: document.getElementById('harborFrom_rev'),
		harborFrom_name: document.getElementById('harborFrom_name'),
		harborFrom_isMine: document.getElementById('harborFrom_isMine'),
		harborFrom_nameFull: document.getElementById('harborFrom_nameFull'),
		harborFrom_accountNum: document.getElementById('harborFrom_accountNum'),
		harborFrom_contactInfo: document.getElementById('harborFrom_contactInfo'),
		harborFrom_notes: document.getElementById('harborFrom_notes'),
		
		totalMaybe: document.getElementById('totalMaybe'),
		totalReal: document.getElementById('totalReal'),
		dateReal: document.getElementById('dateReal'),
		
		newFlow: document.getElementById('newFlow'),
		sync: document.getElementById('syncWrapper')
	},
	
	harbors = {
		
		defaultFrom: "",
		
		dbInfo: {
			names: {
				"": true 
			}
		},
		
		prepFromHarborsDoc: function() {
		// Retrieve the full list of harbors from the harbors doc for the autocomplete
			db.get('harbors', function(err, doc) {
				if(!err) {
					harbors.dbInfo = doc;
				}
			});
		},

		saveToHarborsDoc: function(harbor_name, isMine) {
		// Save the full list of harbors to the doc
			var names = harbors.dbInfo.names;
			
			names[harbor_name] = isMine;

			// check in case it doesn't exist yet
			if(!harbors.dbInfo._id) {
				harbors.dbInfo._id = "harbors";
			}
			if(!harbors.dbInfo.Type) {
				harbors.dbInfo.Type = 'harbors';
			}
			
			db.put(harbors.dbInfo, function(err, doc) {
				console.log(err);
			});
			this.prepFromHarborsDoc();
		},
				
		saveToDB: function(ToFrom) {
		// Save a single harbor to its own doc
		// ToFrom is one or the other to designate which form to get info from
		
			// Update the harbor info from the form
			var harbor;
			if (ToFrom === "To") {
				harbor = {
					name: dom.harborTo_name.textContent,
					isMine: dom.harborTo_isMine.checked,
					nameFull: dom.harborTo_nameFull.value,
					accountNum: dom.harborTo_accountNum.value,
					contactInfo: dom.harborTo_contactInfo.value,
					notes: dom.harborTo_notes.value
				};
				if (dom.harborTo_rev.value !== "") {
					harbor._rev = dom.harborTo_rev.value;
				}
			} else if (ToFrom === "From") {
				harbor = {
					name: dom.harborFrom_name.textContent,
					isMine: dom.harborFrom_isMine.checked,
					nameFull: dom.harborFrom_nameFull.value,
					accountNum: dom.harborFrom_accountNum.value,
					contactInfo: dom.harborFrom_contactInfo.value,
					notes: dom.harborFrom_notes.value
				};
				if (dom.harborFrom_rev.value !== "") {
					harbor._rev = dom.harborFrom_rev.value;
				}
			}

									
			// Add the necessary little stuff
			if(!harbor._id) {
				harbor._id = "harbor_" + harbor.name;
			}
			if (!harbor.Type) {
				harbor.Type = "harbor";
			}
			
			// Save it
			db.put(harbor, function(err, doc) {
				console.log(err);
			});
			if(!harbors.dbInfo.names[harbor.name] || harbors.dbInfo.names[harbor.name] !== harbor.isMine) {
				this.saveToHarborsDoc(harbor.name, harbor.isMine);
			}
			
			// reset all the fields and close the dialog boxes!!
			if (ToFrom === "To") {
				$("#harborTo-info").dialog("close");
				dom.harborTo_name.textContent = '';
				dom.harborTo_isMine.checked = 0;
				dom.harborTo_nameFull.value = '';
				dom.harborTo_accountNum.value = '';
				dom.harborTo_contactInfo.value = '';
				dom.harborTo_notes.value = '';
			} else if (ToFrom === "From") {
				$("#harborFrom-info").dialog("close");
				dom.harborFrom_name.textContent = '';
				dom.harborFrom_isMine.checked = 0;
				dom.harborFrom_nameFull.value = '';
				dom.harborFrom_accountNum.value = '';
				dom.harborFrom_contactInfo.value = '';
				dom.harborFrom_notes.value = '';
			}
		},
		
		checkIfNew: function(harborTo, harborFrom) {
		// See if the harbor is a new one when a new flow is added
			if(harbors.dbInfo.names[harborFrom] === "undefined" && harborFrom !== "") {
				dom.harborFrom_name.textContent = harborFrom;
				$("#harborFrom-info").dialog("open");
				$("#harborTo-isMine").focus();
			}
			if(harbors.dbInfo.names[harborTo] === "undefined" && harborTo !== "") {
				dom.harborTo_name.textContent = harborTo;
				$("#harborTo-info").dialog("open");
			}
		},
		
		harborEdit: function(event) {
			var harbor = event.currentTarget.parentNode.textContent;
			db.get("harbor_" + harbor, function(err, doc) {
				dom.harborTo_rev.value = doc._rev;
				dom.harborTo_name.textContent = doc.name;
				dom.harborTo_isMine.checked = doc.isMine;
				dom.harborTo_nameFull.value = doc.nameFull;
				dom.harborTo_accountNum.value = doc.accountNum;
				dom.harborTo_contactInfo.value = doc.contactInfo;
				dom.harborTo_notes.value = doc.notes;
				
			});
			$("#harborTo-info").dialog("open");
		},
		
		autocomplete: function(target) {
		// to add the drop down list of harbors to the harbor fields on focus
			if (typeof harbors.dbInfo.names !== "undefined") {
				var source = $.map(harbors.dbInfo.names, function(value, key) {
					return key;
				});
				$(target).autocomplete({
					source: source,
					delay: 0,
					autoFocus: true
				});
			}
		},
		
		onPageLoad: function() {
			this.prepFromHarborsDoc();
		
			$("#harborTo-info").dialog({
				autoOpen: false,
				height: 300,
				width: 350,
				modal: true,
				buttons: {
					"Cancel": function() {
						$("#harborTo-info").dialog( "close" );
					},
					"Done": function() {
						harbors.saveToDB("To");
					}
				}
			});
			$('#harborto-info').find("form").on("submit", function(event) {
				harbors.saveToDB("To");
			});

			$("#harborFrom-info").dialog({
				autoOpen: false,
				height: 300,
				width: 350,
				modal: true,
				buttons: {
					"Done": function() {
						harbors.saveToDB("From");
					},
					"Cancel": function() {
						$("#harborFrom-info").dialog( "close" );
					}
				},
				position: {
					"my": "center-10 center-10"
				}
			});
			$('#harborFrom-info').find("form").on("submit", function(event) {
				harbors.saveToDB("From");
			});

		}
	},
	
	flows = {
	// For manipulating flows
	
		// variables to track against the flows
		totalMoneyMaybe : 0,
		totalMoneyReal: 0,
		lastDateReal: 0,
		tabIndex: 100,
		
	// Functions to save to and retrieve from the DB
	
		saveToDB: function(flow, dateRaw) {
		// Validate and save the flow to the DB
			var dateReturned;
			
			// Validate and format date
			if (dateRaw !== "" && typeof dateRaw !== "undefined") {				
				dateReturned = MoFlo.checkDate(dateRaw, flow.dateYr);
				if (dateReturned === false) {
					alert('Your Due Date is bad.\n\nPlease try something like the following: 4/30 or 4/30/13 to specify a year. You can also use - or . as separators.');
					return;
				}
				if (flow.dateYr !== dateReturned[0] || flow.dateMo !== dateReturned[1] || flow.dateDy !== dateReturned[2]) {
					flow.dateYr = dateReturned[0];
					flow.dateMo = dateReturned[1];
					flow.dateDy = dateReturned[2];
					db.get(flow._id, function(err, doc) {
						db.remove(doc);
					});
					delete flow._id;
				}
			} // else {
//				flow.dateYr = "";
//				flow.dateMo = "";
//				flow.dateDy = "";
//			}

			// create an ID that is useful
			if (!flow._id) {
				flow._id = "flow_" + flow.dateYr + "-" + ("0" + flow.dateMo).slice(-2) + "-" + ("0" + flow.dateDy).slice(-2) + "_" + new Date().toISOString();
			}
			
			// Make sure it has the right type
			if (!flow.Type) {
				flow.Type = 'flow';
			}
			
			// Format amount - we don't any funny programmatic rounding stuff
			flow.amount = Math.abs(flow.amount) * 1000;
			
			// Check for notes
			if (flow.notes === "") {
				flow.notes = "Notes";
			}
			
			db.put(flow);
		},

		saveNew: function(event) {
			if (event.keyCode === ENTER_KEY) {
				
				// get the info
				var flow = {
					harborTo: dom.harborTo.value,
					amount: dom.amount.value,
					status: dom.status.value,
					harborFrom: dom.harborFrom.value,
					isTaxable: dom.isTaxable.checked,
					isLoan: dom.isLoan.checked,
					notes: dom.notes.value
				},
				dateRaw = dom.date.value;
				
				if(flow.harborFrom !== harbors.defaultFrom) {
					db.get('options', function(err, options) {
						options.defaultFrom = flow.harborFrom;
						harbors.defaultFrom = flow.harborFrom;
						db.put(options);
					});			
				}
				
				// save it to the db docs
				harbors.checkIfNew(flow.harborTo,flow.harborFrom);
				flows.saveToDB(flow, dateRaw);
				
				// reset the fields
				dom.date.value = '';
				dom.harborTo.value = '';
				dom.amount.value = '';
				dom.status.value = '';
//				dom.harborFrom.value = harbors.defaultFrom; // leave it as the default!
				dom.isTaxable.checked = 0;
				dom.isLoan.checked = 0;
				dom.notes.value = '';
				dom.date.focus();				
			}		
		},
		
		prepFromDB: function(flow) {
		// take the info for a flow from the DB and make it ready for printing

			// format the amounts
			if (flow.amount !== "") {
				flow.amount = (Math.round(flow.amount / 10) / 100).toFixed(2);
			}
			
			return flow;
		},
		
	// Listeners and the like
		
		checkboxChanged: function(event, flow, name) {
		// The checkbox value changed - save it to the DB
		// name is the name of the element in the database
			flow[name] = event.target.checked;
			dateRaw = dom.date.value;
			flows.saveToDB(flow);
		},
		
		checkboxShowPopup: function(event, flow, name) {
		// show/hide flowHiddenInfo
			if (event.target.checked === true) {
//				document.getElementByClassName("col_showPopup").checked = false;
// actually need to set all to checked = false
				event.target.parentNode.childNodes[7].className = "flowHiddenInfo";
			} else {
				event.target.parentNode.childNodes[7].className = "invisible flowHiddenInfo";
			}
		},
		
		destroyButtonPressed: function(flow) {
		// User pressed the delete button for a flow, delete it
			db.remove(flow);
		},

		keyPressed: function(event, flow, name) {
		// If they press enter while editing an entry, save the row
			if (event.keyCode === ENTER_KEY) {
				var fields, dateRaw, dateReturned;
				// if name equals any of these:
				if (["harborFrom", "isTaxable", "isLoan"].indexOf(name) !== -1) {
					fields = event.target.parentNode.parentNode.parentNode.childNodes;
				} else if (["notes"].indexOf(name) !== -1) {
					fields = event.target.parentNode.parentNode.childNodes;
				} else {
					fields = event.target.parentNode.childNodes;
				}
				dateRaw = fields[0].textContent.trim();
				flow.harborTo = fields[1].textContent.trim();
				flow.amount = fields[2].textContent.trim();
				flow.status = fields[3].value;
				flow.harborFrom = fields[7].childNodes[0].childNodes[1].textContent.trim();
				flow.isTaxable = fields[7].childNodes[1].childNodes[1].checked;
				flow.isLoan = fields[7].childNodes[2].childNodes[1].checked;
				flow.notes = fields[7].childNodes[3].textContent.trim();
				
				this.saveToDB(flow, dateRaw);
				harbors.checkIfNew(flow.harborTo, flow.harborFrom);
			
			} 
		},

		selectChanged: function(event, flow, name) {
		// The checkbox value changed - save it to the DB
		// name is the name of the element in the database
			flow[name] = event.target.value;
			flows.saveToDB(flow);
		},
		
	// Functions to display the flows

		makeCheckbox: function(flow, name, listener) {
		// create a checkbox object
		// listener is the function to call - see the if else below
			var checkbox = document.createElement('input');
			checkbox.className = 'col_' + name;
			checkbox.type = 'checkbox';
			if (flow[name] === true) {
				checkbox.checked = flow[name]; 
			}
			checkbox.setAttribute("tabindex", this.tabIndex);
			this.tabIndex += 1;
			if (listener === "changed") {
				checkbox.addEventListener('change', function(event) {flows.checkboxChanged(event, flow, name);});
			} else if (listener === "showPopup") {
				checkbox.addEventListener('change', function(event) {flows.checkboxShowPopup(event, flow, name);});
			}
			return checkbox;
		},
		
		makeDestroy: function(flow, name) {
		// yep, this deletes the flow
			var button = document.createElement('name');
			button.className = 'destroy';
			button.title = "Delete this flow.";
			button.addEventListener( 'click', this.destroyButtonPressed.bind(this, flow));
			return button;
		},
		
		makeHarborEdit: function() {
		// to open the harbor edit dialog box
			var button = document.createElement('name');
			button.className = 'harborEdit';
			button.title = "Edit this harbor";
			button.addEventListener( 'click', function(event) {harbors.harborEdit(event);});
			return button;
		},
		
		makeField: function(flow, name) {
		// create a field that contains information that can be edited
			var harborEdit,
			label = document.createElement('div');
			label.className = 'col_' + name;
			//special stuff to assemble a date field
			if (name === "date") {
				if (flow.dateMo === "" && flow.dateDy === "") {
					label.innerHTML = " ";
				} else {
					label.innerHTML = flow.dateMo + "/" + flow.dateDy;
					label.title = flow.dateYr;
				}
			} else if(name === "amount" && harbors.dbInfo.names[flow.harborTo] === false && harbors.dbInfo.names[flow.harborFrom] === true && flow[name] !== "0.00") {
				// Determine if amount should be shown as negative
					label.appendChild(document.createTextNode('-' + flow[name]));
			} else {
				label.appendChild(document.createTextNode(flow[name]));
			}
			label.contentEditable = "true";
			label.setAttribute("tabindex", this.tabIndex);
			this.tabIndex += 1;

			label.addEventListener('keypress', function(event) {flows.keyPressed(event, flow, name);});
			if (["harborTo", "harborFrom"].indexOf(name) !== -1) {
				harborEdit = this.makeHarborEdit();
				label.appendChild(harborEdit);
				label.addEventListener('focus', function(event) {harbors.autocomplete(event.currentTarget, flow, name);});
			}
			
			return label;
		},
		
		makeSelect: function(flow, name, options) {
		// make a dropdown select box 
			var select = document.createElement('select');
			select.className = 'col_' + name;
			select.setAttribute("tabindex", this.tabIndex);
			this.tabIndex += 1;
			options.forEach(function(option) {
				var opt = document.createElement("option");
				opt.setAttribute("value", option);
				opt.innerHTML = option;
				if (option === flow[name]) {
					opt.selected = true;
				}
				select.appendChild(opt);
			});
			select.addEventListener('change', function(event) {flows.selectChanged(event, flow, name);});
			return select;
		},
		
		makeSpanPopup: function(harborFrom, isTaxable, isLoan, notes) {
		// make the spanPopup for the flows - the initially hidden additional options
			
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
			spanPopup = MoFlo.appendChildren(spanPopup, [div_harborFrom, div_isTaxable, div_isLoan, notes]);
			spanPopup.contentEditable = "false";
			return spanPopup;
		},
		
		makeRow: function(flow) {
		// Create a div to display a flow.
		
			// fix the display
			this.prepFromDB(flow);
		
			// create all the components of the div
			
			// these are the overarching elements that contain the others
			var	divRow = document.createElement('div'),
			
			// these are all the elements to show 
			date = this.makeField(flow, 'date'),
			harborTo = this.makeField(flow, 'harborTo'),
			amount = this.makeField(flow, 'amount'),
			status = this.makeSelect(flow, 'status', [" ", "Chkd", "Sent", "Paid"]),
			showPopup = this.makeCheckbox(flow, 'showPopup', 'showPopup'),
			harborFrom = this.makeField(flow, 'harborFrom'),
			isTaxable = this.makeCheckbox(flow, 'isTaxable', 'changed'),
			isLoan = this.makeCheckbox(flow, 'isLoan', 'changed'),
			notes = this.makeField(flow, 'notes'),
			spanPopup = this.makeSpanPopup(harborFrom, isTaxable, isLoan, notes),
			deleteLink = this.makeDestroy(flow, 'deleteLink'),

			// add the totals up and include them
			moneyMaybe = document.createElement('div'),
			moneyReal = document.createElement('div');
				// add on amounts to the totals
			if(harbors.dbInfo.names[flow.harborTo] === false && harbors.dbInfo.names[flow.harborFrom] === true && flow[name] !== "0.00") {
				this.totalMoneyMaybe -= parseFloat(flow.amount);
			} else if(harbors.dbInfo.names[flow.harborTo] === true && harbors.dbInfo.names[flow.harborFrom] === false && flow[name] !== "0.00") {
				this.totalMoneyMaybe += parseFloat(flow.amount);
			}
			if (flow.status === "Paid") {
				if(harbors.dbInfo.names[flow.harborTo] === false && harbors.dbInfo.names[flow.harborFrom] === true && flow[name] !== "0.00") {
					this.totalMoneyReal -= parseFloat(flow.amount);
				} else if(harbors.dbInfo.names[flow.harborTo] === true && harbors.dbInfo.names[flow.harborFrom] === false && flow[name] !== "0.00") {
					this.totalMoneyReal += parseFloat(flow.amount);
				}
				this.lastDateReal = flow.dateMo + "/" + flow.dateDy;
				divRow.className += ' reconciled';
			} else {
				moneyReal.className = "invisible";
			}
			if (flow.amount === "0.00") {
				moneyMaybe.className = "invisible";
				moneyReal.className = "invisible";
			}
			moneyMaybe.appendChild(document.createTextNode(this.totalMoneyMaybe.toFixed(2)));
			moneyReal.appendChild(document.createTextNode(this.totalMoneyReal.toFixed(2)));
			moneyMaybe.className += " col_moneyMaybe";
			moneyReal.className += " col_moneyReal"; 
			
			// put it all together
			divRow.id = 'div_' + flow._id;
			divRow = MoFlo.appendChildren(divRow, [date, harborTo, amount, status, showPopup, moneyMaybe, moneyReal, spanPopup, deleteLink]);

			// check if the checkboxes should be checked
			if (flow.status === "Sent") {
				divRow.className += ' sent';
			}
			if (flow.isTaxable) {
				isTaxable.checked = true;
			}
			if (flow.isLoan) {
				isLoan.checked = true;
			}

			return divRow;
		},

		show: function(flowsToShow) {
		    var div = document.getElementById('flows');
			div.innerHTML = '';
			this.totalMoneyMaybe = 0;
			this.totalMoneyReal = 0;
			this.tabIndex = 100;
			flowsToShow.forEach(function(flowFromDB) {
				div.appendChild(flows.makeRow(flowFromDB.doc));
			});
			dom.totalMaybe.innerHTML = this.totalMoneyMaybe.toFixed(2); 
			dom.dateReal.innerHTML = this.lastDateReal; 
			dom.totalReal.innerHTML = this.totalMoneyReal.toFixed(2); 
		},
		
		get: function() {
		// get all of the flows to display, and then show them
			db.allDocs({startkey: 'flow_', endkey: 'flowa', include_docs: true}, function(err, docs) {
				if (err) {console.log(err);}
				flows.show(docs.rows);
			});
		}
		
	},
	
	sync = {
	// all the info to sync with CouchDB
		remoteCouch: "",
		
		error: function() {
		// There was some form or error syncing
			dom.sync.setAttribute('data-sync-state', 'error');
		},
  
		doIt: function() {
		// Initialise a sync with the remote server
			dom.sync.setAttribute('data-sync-state', 'uptodate');
			var opts = {live: true};
			db.replicate.to(sync.remoteCouch, opts, sync.error);
			db.replicate.from(sync.remoteCouch, opts, sync.error);
		}
		
	},
	
	options = {
		get: function() {
			db.get("options", function(err, doc) {
				if (err) {
					console.log('db.get error: ' + err);
				} else {
					if (doc.remoteServer) {
						sync.remoteCouch = doc.remoteServer;
						sync.doIt();
					}
					if (doc.defaultFrom) {
						dom.harborFrom.value = harbors.defaultFrom = doc.defaultFrom;
					}
				}
			});
		}
	};
	
	function makeInvisible(event) {
		if (event.explicitOriginalTarget.parentNode.className === "flowHiddenInfo invisible") {
			event.stopImmediatePropogation();
		} else {
			dom.newFlow.childNodes[6].className = "flowHiddenInfo invisible";
		}
	}

	function makeVisible(event) {
		dom.newFlow.childNodes[6].className = "flowHiddenInfo";
		if (["harborTo", "harborFrom"].indexOf(event.currentTarget.id) !== -1) {
			harbors.autocomplete(event.currentTarget);
		}
	}

	function addEventListeners() {
		dom.newFlow.addEventListener("keypress", flows.saveNew, true);
		
		// make newFlow .flowHiddenInfo disappear
		document.body.addEventListener("mousedown", makeInvisible, true);

		// make #newFlow .flowHiddenInfo appear and stick around for input
//		dom.date.addEventListener("focus", makeVisible, true);
		dom.harborTo.addEventListener("focus", makeVisible, true);
		dom.amount.addEventListener("focus", makeVisible, true);
		dom.status.addEventListener("focus", makeVisible, true);
		dom.harborFrom.addEventListener("focus", makeVisible, true);
		dom.isTaxable.addEventListener("focus", makeVisible, true);
		dom.isLoan.addEventListener("focus", makeVisible, true);
		dom.notes.addEventListener("focus", makeVisible, true);
//		document.getElementById('newFlow').addEventListener("mousedown", makeVisible, true);
	}

	db.info(function(err, info) {
		db.changes({
			since: info.update_seq,
			live: true
		}).on('change', flows.get);
	});

	addEventListeners();
	harbors.onPageLoad();
	flows.get();
	options.get();

}());