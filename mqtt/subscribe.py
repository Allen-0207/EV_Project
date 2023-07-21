import paho.mqtt.client as mqtt
import sqlite3, json

client = mqtt.Client()
#client.connect("127.0.0.1", 1883)

client.username_pw_set(username="wecc", password="abc123")
client.connect("59.124.12.69", 1883)

conn = sqlite3.connect('sensor.db')
c = conn.cursor()

def main():
	while True:
		client.on_connect = on_connect
		client.on_message = on_message
		client.loop_forever()

def on_connect(client, userdata, flags, rc):
	if rc == 0:
		print("[*] Connection successful")
		client.subscribe("WECC/SAQ210/355001096509756/sensor")
	elif rc == 1:
		print("[-] Connection refused – incorrect protocol version")
	elif rc == 2:
		print("[-] Connection refused – invalid client identifier")
	elif rc == 3:
		print("[-] Connection refused – server unavailable")
	elif rc == 4:
		print("[-] Connection refused – bad username or password")
	elif rc == 5:
		print("[-] Connection refused – not authorised")
	else:
		print("[-] Connection refused – Unknown Error")
	

def on_message(client, userdata, message):
	data = message.payload.decode()
	data = json.loads(data)
	save_data(data)
	
def save_data(data):
	id_ = data["id"] if "id" in data else None
	lat = data["lat"] if "lat" in data else None
	lon = data["lon"] if "lon" in data else None
	time_ = data["time"] if "time" in data else None

	if("data" in data):
		voc = pm2_5 = humidity = temperature = h2s = nh3 = None
		for d in data["data"]:
			if(d["sensor"] == "voc"):
				voc = d["value"]
			elif(d["sensor"] == "pm2_5"):
				pm2_5 = d["value"]
			elif(d["sensor"] == "humidity"):
				humidity = d["value"]
			elif(d["sensor"] == "temperature"):
				temperature = d["value"]
			elif(d["sensor"] == "h2s"):
				h2s = d["value"]
			elif(d["sensor"] == "nh3"):
				nh3 = d["value"]
	else:
		voc = pm2_5 = humidity = temperature = h2s = nh3 = None

	print(id_, lat, lon, time_)
	print(voc, pm2_5, humidity, temperature, h2s, nh3)
	print()
	try:
		c.execute('''INSERT INTO SENSOR
				(id, lat, lon, time, voc, pm2_5, humidity, temperature, h2s, nh3)
				VALUES
				(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
				''',
				(id_, lat, lon, time_, voc, pm2_5, humidity, temperature, h2s, nh3))
		conn.commit()
	except sqlite3.Error as error:
		print("sqlite3 Error : ", error)


if __name__ == '__main__':
	main()
	