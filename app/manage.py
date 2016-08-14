import os
import os.path
import config
from muse import app, db

cmd = input('Enter a command -> create | clear | destroy: ')

if cmd == 'create':
    with app.app_context():
        print('Creating database')
        db.create_all()

if cmd == 'clear':
    with app.app_context():
        print('Clearing database')
        meta = db.metadata
        for table in reversed(meta.sorted_tables):
            print('Clearing table %s' % table)
            db.session.execute(table.delete())
        db.session.commit()

if cmd == 'destroy':
    print('Destroying database file')
    if os.path.exists(config.DATABASE_FILENAME):
        os.remove(config.DATABASE_FILENAME)
        print('Database file removed')
        
    
