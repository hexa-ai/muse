import os
import os.path
import config
from muse import app, mongo

cmd = input('Enter a command -> seed-instruments | clear-collections: ')

if cmd == 'seed-instruments':
    with app.app_context():
        mongo.db.instruments.remove()
        mongo.db.instruments.insert([{
            'name' : 'beatbox',
            'voices' : [{
                    'name' : 'Kick',
                    'file' : './static/media/sound/Kick05-Longer.wav',
                    'toggles' : [0 for x in range(32)],
                    'enabled' : True
                }, {
                    'name' : 'Snare',
                    'file' : './static/media/sound/Snare04-Hi-Simmons1.wav',
                    'toggles' : [0 for x in range(32)],
                    'enabled' : True
                }, {
                    'name' : 'Hi-hat',
                    'file' : './static/media/sound/CH.WAV',
                    'toggles' : [0 for x in range(32)],
                    'enabled' : True
                }, {
                    'name' : 'Clap',
                    'file' : './static/media/sound/CP.WAV',
                    'toggles' : [0 for x in range(32)],
                    'enabled' : True
                }
            ]
        }])
