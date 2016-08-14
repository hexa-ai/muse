from muse import app, db

cmd = input('Enter a command -> create | delete: ')

if cmd == 'create':
    with app.app_context():
        print('Creating database')
        db.create_all()

if cmd == 'delete':
    with app.app_context():
        print('Deleting database')
        meta = db.metadata
        for table in reversed(meta.sorted_tables):
            print('Clearing table %s' % table)
            db.session.execute(table.delete())
        db.session.commit()
