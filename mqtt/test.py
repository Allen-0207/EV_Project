# -*- coding: UTF-8 -*-


import paho.mqtt.client as mqtt
import json, sys

client = mqtt.Client()
#client.username_pw_set(username="wecc", password="abc123")
#client.connect("59.124.12.69", 1883)
client.connect("127.0.0.1", 1883)


def main():
	while True:
		client.on_connect = on_connect
		client.on_message = on_message
		client.loop_forever()

def on_connect(client, userdata, flags, rc):
	print("[*] Connection successful")
	 
	client.subscribe("WECC/SAQ210/355001096509756/sensor")
	#client.subscribe("WECC/SAQ210/+/sensor")

def on_message(client, userdata, message):
	#print(message.payload)
	data = message.payload.decode('utf-8')
	#print(data)
	data = json.loads(data)
	print(data)

if __name__ == '__main__':
	main()
	