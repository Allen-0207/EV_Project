import sqlite3
import csv

conn = sqlite3.connect('sensor.db')

# time_start = "2021-05-29 21:19"
# time_finish = "2021-05-29 21:21"


# time_start = "2021-07-20 12:31"
# time_finish = "2021-07-20 13:07"

time_start = "2021-09-01 13:30"
time_finish = "2021-09-01 13:40"

c = conn.cursor()

result = c.execute('''
		SELECT time, %s, lat, lon
		FROM SENSOR
		WHERE time > ? AND
			  time < ?
		''' % ("pm2_5"),
		(time_start, time_finish)).fetchall()
conn.commit()

print(result)

# out = '"time","lat","lon","pm2_5"\n'
# for row in result:
# 	#print(','.join(str(word) for word in row))
# 	out += ','.join(str(word) for word in row) + '\n'

# print(out)

'''
with open('sensor.csv','w') as out:
    csv_out=csv.writer(out)
    csv_out.writerow(["time","lat","lon","pm2_5"])
    for row in result:
        csv_out.writerow(row)
    print(out)


for item in result:
	print(item)
	print(item[0])
'''