This is a personal project to track finances. It conceives of money as something that comes and goes in flows. The places it rests are harbors - these may be checking accounts, credit cards, or your best friend - all places where money goes for a while, but never stays forever.

# Core Principles
1. I manage my finances and don't just trust what my bank says.
2. My data is mine and I don't want to give it out in exchange for being marketed to.
3. I should still be able to access my info anywhere I go.

# Current Status
It is usable to track your bills and reconcile against what your bank says. This means you can:
* Enter flows: bills paid, money received, and money transfered between harbors that are yours. You can provide as much detail or as little as you want.
* Mark these flows as verified accurate (if it was an estimate when you originally entered it), sent, or paid.
* Enter additional info about the harbors: full name, account number, contact info, notes.
* All data is saved in local storage within your browser on your computer.
* You can optionally sync it to a CouchDB database online.

# Roadmap
There's lots on the agenda, here is the rough order:
* Recurring flows
* Ability to sort and search flows
* Reminders of upcoming bills
* Better security

# Additional Info
It's all built in javascript so far with PouchDB providing the database backend functionality. It's actually pretty cool.
