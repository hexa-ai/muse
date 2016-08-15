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
            'type' : 'sequencer',
            'voices' : [{
                    'name' : 'Kick',
                    'file' : './static/media/sound/Kick05-Longer.wav',
                }, {
                    'name' : 'Snare',
                    'file' : './static/media/sound/Snare04-Hi-Simmons1.wav',
                }, {
                    'name' : 'Hi-hat',
                    'file' : './static/media/sound/CH.WAV',
                }, {
                    'name' : 'Clap',
                    'file' : './static/media/sound/CP.WAV',
                }
            ]
        }])
