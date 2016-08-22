# Muse
An A.I. aided music composition tool

-----

## Installation
This creates a new conda environment and installs all Python related dependencies
```
$ conda env create -f environment.yml
$ source activate muse
```

## Set up the db
Make sure mongodb is running!

If this is the first time you're running the app, you'll need to seed the database with instruments.
```
$python app/manage.py
Enter a command -> seed-instruments | clear-collections | delete-collections:
seed-instruments
```

## Run it!
```
$ cd app/
$ python run.py
```
You are now running the flask app in a debugging mode. Each time you make a change to the project, the server will be restarted automatically. Point your browser to: http://127.0.0.1:5000


