import sqlite3

conn = sqlite3.connect('sensor.db')
print("Opened database successfully")
c = conn.cursor()

c.execute('''DROP TABLE SENSOR;''')
print("Table created successfully")
conn.commit()
conn.close()