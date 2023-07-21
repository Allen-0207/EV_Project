import sqlite3

conn = sqlite3.connect('sensor.db')
print("Opened database successfully")
c = conn.cursor()

c.execute('''CREATE TABLE SENSOR
		(id						TEXT,
		lat						REAL,
		lon						REAL,
		time					TEXT,
		voc						TEXT,
		pm2_5					TEXT,
		humidity				TEXT,
		temperature				TEXT,
		h2s						TEXT,
		nh3						TEXT);
		''')
print("Table created successfully")
conn.commit()
conn.close()