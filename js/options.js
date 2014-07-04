(function() {
	'use strict';
	/*jslint nomen: true */
	/*global PouchDB, console, WMB */
	
	var db = new PouchDB('MoneyFlows'),
	remoteCouch,
	ENTER_KEY = 13,
	
	// these connect variables to data entry fields on the page
	dom = {
		remoteServerBlank: document.getElementById('remoteServerBlank'),
		remoteServer: document.getElementById('remoteServer'),
		
		options: document.getElementById('options'),
		sync: document.getElementById('syncWrapper')
	},
	
	optionsPage = {
	// for operations specific to the options page

		prepForDB: function(options) {
			
			var date;
			
			// Validate and format dateDue
			if (options.dateDue !== "") {
				date = WMB.checkDate(options.dateDue);
				if (date === false) {
					alert('Your Due Date is bad.\n\nPlease try something like the following: 4/30 or 4/30/13 to specify a year. You can also use - or . as separators.');
					return;
				}
				options.dateDue = date;
			}
			
			// Validate and format datePaid
			if (options.datePaid !== "") {
				date = WMB.checkDate(options.datePaid);
				if (date === false) {
					alert('Your Date Paid is bad.\n\nPlease try something like the following: 4/30 or 4/30/13 to specify a year. You can also use - or . as separators.');
					return;
				}
				options.datePaid = date;
			}
			
			// Format amount
			options.amount = options.amount * 1000;
			
			return options;

		},

		add: function(info) {
			var options = {
				_id: "options",
				_rev: new Date().toISOString(),
				remoteServer: info.remoteServerBlank.value.trim()
			};
			
//			this.prepForDB(info);
			
			db.put(options, function callback(err, result) {
				if(err) {
					console.log("db.put error:" + err);
				}
				console.log(result);
			});
		},

		makeCheckbox: function(options, name, listen) {
		// create the checkbox object
		// if listen is true, add the event listener
			var checkbox = document.createElement('input');
			checkbox.className = 'col_' + name;
			checkbox.type = 'checkbox';
			if (options[name] === true) {
				checkbox.checked = options[name]; 
			}
			if (listen === true) {
				checkbox.addEventListener('change', this.checkboxChanged.bind(name, this, options));
			}
			return checkbox;
		},
		
		makeLabel: function(options, name) {
			var label = document.createElement('label');
			label.className = 'col_' + name;
			label.appendChild(document.createTextNode(options[name]));
			label.title = options[name];
			label.addEventListener('dblclick', this.dblClicked.bind(name, this, options));
			return label;
		},
		
		makeButton: function(options, name) {
			var button = document.createElement('name');
			button.className = 'destroy';
			button.addEventListener( 'click', this.deleteButtonPressed.bind(this, options));
			return button;
		},
		
		makeEditable: function(options, name) {
			var editable = document.createElement('input');
			editable.id = 'input_' + options._id + '_' + name;
			editable.className = 'col_' + name;
			editable.value = options[name];
			editable.addEventListener('keypress', this.keyPressed.bind(this, options, name));
			return editable;
		},
		
		dblClicked: function(name, options) {
		// User has double clicked a field, display an input so they can edit it
			var div = document.getElementById(this),
			inputEdit = document.getElementById('input_' + options._id + '_' + this);
			div.className = 'editing';
			inputEdit.focus();
		},

		keyPressed: function(options, name, event) {
		// If they press enter while editing an entry, blur it to trigger save/delete
			if (event.keyCode === ENTER_KEY) {
				var fields = event.target.parentNode.childNodes;
				options.remoteServer = fields[0].value.trim();
				
//				optionsPage.prepForDB(options);
			
				db.put(options);
			}
		},

		redraw: function(optionsInfo) {
		    var view = document.createElement('div'),
		    edit = document.createElement('div'),
		    view_remoteServer, edit_remoteServer;
			
			// remoteServer option
			if (optionsInfo.remoteServer !== '') {

				view.className = 'view';
				edit.className = 'edit';

				view_remoteServer = this.makeLabel(optionsInfo, 'remoteServer');
				view.appendChild(view_remoteServer);

				edit_remoteServer = this.makeEditable(optionsInfo, 'remoteServer');
				edit.appendChild(edit_remoteServer);

				dom.remoteServer.innerHTML = '';
				dom.remoteServer.className = '';
				dom.remoteServer.appendChild(view);
				dom.remoteServer.appendChild(edit);
			}
		},

		doIt: function() {
			db.get("options", function(err, doc) {
				optionsPage.redraw(doc);
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

	function newoptionsKeyPressHandler( event ) {
		if (event.keyCode === ENTER_KEY) {
			optionsPage.add(dom);
			dom.remoteServerBlank.value = '';
		}
	}

	function addEventListeners() {
		dom.options.addEventListener('keypress', newoptionsKeyPressHandler, false);
	}

	db.info(function(err, info) {
		db.changes({
			since: info.update_seq,
			live: true
		}).on('change', optionsPage.doIt);
	});

	addEventListeners();
/*	db.destroy(function(err, info) {
		if (err) {
			console.log(err);
		} else {
			console.log("success:" + info);
		}
	});
*/
	db.get("options", function(err, doc) {
		if (err) {
			console.log('db.get error: ' + err);
		} else {
			optionsPage.doIt();
			if (doc.remoteServer) {
				remoteCouch = doc.remoteServer;
				sync.doIt();
			}
		}
	});

}());