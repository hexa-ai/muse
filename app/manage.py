import os
import os.path
import config
from muse import app, mongo

cmd = input('Enter a command -> seed-instruments | clear-collections | delete-collections: ')

if cmd == 'seed-instruments':
    with app.app_context():
        mongo.db.instruments.remove()
        mongo.db.instruments.insert([{
            'name' : 'beatbox',
            'type' : 'percussion',
            'voices' : [{
                    'name' : 'Kick',
                    'file' : './static/media/sound/beatbox/Kick05-Longer.wav',
                }, {
                    'name' : 'Snare',
                    'file' : './static/media/sound/beatbox/Snare04-Hi-Simmons1.wav',
                }, {
                    'name' : 'Hi-hat',
                    'file' : './static/media/sound/beatbox/CH.WAV',
                }, {
                    'name' : 'Clap',
                    'file' : './static/media/sound/beatbox/CP.WAV',
                }
            ]
        }, {
            'name' : 'saw-bass', 
            'type' : 'bass', 
            'voices' : [{
                    'name' : 'C',
                    'file' : './static/media/sound/sawbass/saw-bass-c.wav'
                },{
                    'name' : 'C#',
                    'file' : './static/media/sound/sawbass/saw-bass-c-sharp.wav'
                },{
                    'name' : 'D',
                    'file' : './static/media/sound/sawbass/saw-bass-d.wav'
                },{
                    'name' : 'D#',
                    'file' : './static/media/sound/sawbass/saw-bass-d-sharp.wav'
                },{
                    'name' : 'E',
                    'file' : './static/media/sound/sawbass/saw-bass-e.wav'
                },{
                    'name' : 'F',
                    'file' : './static/media/sound/sawbass/saw-bass-f.wav'
                },{
                    'name' : 'F#',
                    'file' : './static/media/sound/sawbass/saw-bass-f-sharp.wav'
                },{
                    'name' : 'G',
                    'file' : './static/media/sound/sawbass/saw-bass-g.wav'
                },{
                    'name' : 'G#',
                    'file' : './static/media/sound/sawbass/saw-bass-g-sharp.wav'
                },{
                    'name' : 'A',
                    'file' : './static/media/sound/sawbass/saw-bass-a.wav'
                },{
                    'name' : 'A#',
                    'file' : './static/media/sound/sawbass/saw-bass-a-sharp.wav'
                },{
                    'name' : 'B',
                    'file' : './static/media/sound/sawbass/saw-bass-B.wav'
                }
            ]
        }
    ]) 

if cmd == 'clear-collections':
    with app.app_context():
        for collection in mongo.db.collection_names():
            mongo.db.get_collection(collection).remove()

if cmd == 'delete-collections':
    with app.app_context():
        for collection in mongo.db.collection_names():
            mongo.db.get_collection(collection).drop()
