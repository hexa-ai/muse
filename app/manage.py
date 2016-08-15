import os
import os.path
import config
from muse import app, mongo

cmd = input('Enter a command -> seed-instruments: ')

if cmd == 'seed-instruments':
    with app.app_context():
        instruments = ['beats', 'bass', 'synth']
        mongo.db.instruments.remove()
        for instrument in instruments:
            mongo.db.instruments.insert_one({'type' : instrument})
