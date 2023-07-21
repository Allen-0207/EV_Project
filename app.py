from flask import *
import pandas as pd
from scipy.interpolate import griddata as gd
import geojsoncontour
import numpy as np
import matplotlib.pyplot as plt
from gevent import pywsgi
import requests
import sqlite3
import sys

plt.switch_backend('agg')

app = Flask(__name__)

SSL_DISABLE = True

app.config.update(
    SECRET_KEY='\xde\xb9B\xc4g\xcbP\x90V\xf6}Oz\xe0Q\x0cs\xaeV\xe5\x0ed\x99y'
)

@app.route("/index")
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/data")
def data():
    return render_template("data.html")


@app.route("/setting")
def setting():
    return render_template("setting.html")


@app.route("/api", methods=['POST'])
def api():
    if request.method == 'POST':
        print(request.form)
        graph_ = request.form['Graph']
        time_start = request.form['Time_start']
        time_finish = request.form['Time_finish']
        sensor = request.form['Sensor_ID']
        
        #df = pd.read_excel('20210224.xlsx')
        #print(time_start, time_finish)

        if(graph_ == "Bar"):
            '''
            data_dic = {}
            data_list = []
            for index, d in df.iterrows():
                data_dic['Time'] = str(pd.to_datetime(d['Time'], format='%Y-%m-%d %H:%M:%S')).split('.')[0]
                data_dic['PM25'] = d['PM25']
                data_dic['lat'] = d['lat']
                data_dic['lon'] = d['lon']
                data_list.append(data_dic)
                data_dic = {}
            return json.dumps(data_list)
            '''
            #data_list = crawler_sensor(sensor, time_start, time_finish, data_type="Bar")
            data_list, Max, Min = get_data(sensor, time_start, time_finish, data_type="Bar")

            return jsonify({"map_data" : data_list, "max" : Max, "min" : Min})
            
        elif(graph_ == "Contour"):
            levels = request.form.getlist('levels[]')
            print(levels)
            x, y, z, Max, Min = get_data(sensor, time_start, time_finish, data_type="Contour")
            
            '''
            #test data
            x = df["lat"].to_numpy()
            y = df["lon"].to_numpy()
            z = df["PM25"].to_numpy()
            '''
            try:
                coor = np.vstack((x,y)).T
                xi, yi = np.mgrid[x.min() - 0.0001:x.max() + 0.0001:50j, y.min() - 0.0001:y.max() + 0.0001:50j]
                zi = gd(coor, z, (xi, yi), method='cubic')
                ax = plt.figure().add_subplot(111)
                if(levels == []):
                    contour = ax.contour(yi, xi, zi, cmap=plt.cm.jet)
                else:
                    contour = ax.contour(yi, xi, zi, levels=levels, cmap=plt.cm.jet)
                geojson = geojsoncontour.contour_to_geojson(contour=contour, unit='m', ndigits=100)
                plt.close()
                return jsonify({"map_data" : geojson, "max" : Max, "min" : Min})
            except:
                abort(400)
        else:
            abort(400)
    else:
        abort(400)


@app.route("/api_contour", methods=['POST'])
def api_contour():
    if request.method == 'POST':
        x = request.form.getlist("Lat[]")
        y = request.form.getlist("Lon[]")
        z = request.form.getlist("Sensor[]")
        
        x =  np.array([float(x1) for x1 in x])
        y =  np.array([float(y1) for y1 in y])
        z =  np.array([float(z1) for z1 in z])

        Max = z.max()
        Min = z.min()

        try:
            coor = np.vstack((x,y)).T
            xi, yi = np.mgrid[x.min() - 0.0001:x.max() + 0.0001:50j, y.min() - 0.0001:y.max() + 0.0001:50j]
            zi = gd(coor, z, (xi, yi), method='cubic')
            ax = plt.figure().add_subplot(111)
            contour = ax.contour(yi, xi, zi, cmap=plt.cm.jet)
            #ax.clabel(contour, inline=True, fontsize=8)
            geojson = geojsoncontour.contour_to_geojson(contour=contour, unit='m', ndigits=100)
            plt.close()
            return jsonify({"map_data" : geojson, "max" : Max, "min" : Min})
        except Exception as e:
            print(e)
            abort(400)
    else:
        abort(400)


@app.route("/rose", methods=['POST'])
def rose():
    if request.method == 'POST':
        df = pd.read_excel('小港/20210218.xlsx', header = 3, usecols = [0, 1, 2, 3])
        df = df.drop([0])
        
        value = [0.0, 0.3, 1.5, 3.3, 5.4, 7.9, 10.7, 13.8, 17.1, 20.7]
        degree = [[348.76, 11.25], [11.26, 33.75], [33.76, 56.25], [56.26, 78.75], [78.76, 101.25], [101.26, 123.75], 
                  [123.76, 146.25], [146.26, 168.75], [168.76, 191.25], [191.26, 213.75], [213.76, 236.25], [236.26, 258.75], 
                  [258.76, 281.25], [281.26, 303.75], [303.76, 326.25], [326.26, 348.75]]
        groups = {}
        for i in range(1, len(value)):
            
            data = np.array(df[(df.WS > value[i - 1]) & (df.WS < value[i])]['WD'].to_list())
            if(len(data) != 0):
                pro = []
                size = len(data)
                for d1, d2 in degree:
                    pro.append(round(len(np.where((data > d1) & (data < d2))[0]) / size * 100, 2))
                groups[value[i]] = pro
            else:
                groups[value[i]] = [0 for n in range(16)]
        print(groups)
        return jsonify(groups)
    else:
        abort(400)

'''
download csv file with time start, time end & SENSOR 
'''
@app.route("/api_download", methods=['GET', 'POST'])
def api_download():
    if request.method == 'POST':
        time_start = request.form['time_start']
        time_finish = request.form['time_finish']
        sensor = request.form['sensorID']        

        try:
            with sqlite3.connect('mqtt/sensor.db') as conn:
                c = conn.cursor()
                data = c.execute('''
                            SELECT time, lat, lon, %s
                            FROM SENSOR
                            WHERE time > ? AND
                                  time < ?
                            ''' % (sensor),
                            (time_start, time_finish)).fetchall()
                conn.commit()

                csv = 'time,lat,lon,' + sensor +'\n'
                for row in data:
                    csv += ','.join(str(word) for word in row) + '\n'

                return Response(csv, mimetype="text/csv", headers={"Content-disposition": "attachment; filename=sensor.csv"})
        except sqlite3.Error as error:
            print("sqlite3 Error : ", error)
            abort(400)
    else:
        abort(400)

'''
return data with json
return style:
        [Time, lat, lon, Sensor],
                    '
                    '
        [Time, lat, lon, Sensor]
'''
@app.route("/api_show", methods=['GET', 'POST'])
def api_show():
    if request.method == 'POST':
        time_start = request.form['Time_start']
        time_finish = request.form['Time_finish']
        sensor = request.form['Sensor_ID']
        try:
            with sqlite3.connect('mqtt/sensor.db') as conn:
                c = conn.cursor()
                data = c.execute('''
                            SELECT time, lat, lon, %s
                            FROM SENSOR
                            WHERE time > ? AND
                                  time < ?
                            ''' % (sensor),
                            (time_start, time_finish)).fetchall()
                conn.commit()
                return jsonify(data)

        except sqlite3.Error as error:
            print("sqlite3 Error : ", error)
            abort(400)
    else:
        abort(400)


@app.errorhandler(404)
def handle_bad_request(error):
    return 'This page does not exist', 404

@app.errorhandler(400)
def handle_bad_request(error):
    return '輸入資料格式錯誤或資料庫錯誤'

'''
get data from database
location: ./mqtt/sensor.db
''' 
def get_data(sensor, time_start, time_finish, data_type="Bar"):
    data_dic = {}
    data_list = []

    try:
        with sqlite3.connect('mqtt/sensor.db') as conn:
            c = conn.cursor()
            result = c.execute('''
                        SELECT time, %s, lat, lon
                        FROM SENSOR
                        WHERE time > ? AND
                              time < ?
                        ''' % (sensor),
                        (time_start, time_finish)).fetchall()
            conn.commit()

            Max = float(result[0][1])
            Min = float(result[0][1])

            if(data_type == "Bar"):
                for item in result:
                    if(float(item[1]) > Max): Max = float(item[1])
                    if(float(item[1]) < Min): Min = float(item[1])
                    data_dic["Time"] = item[0]
                    data_dic[sensor] = float(item[1])
                    data_dic["lat"] = item[2]
                    data_dic["lon"] = item[3]
                    data_list.append(data_dic)
                    data_dic = {}
                return data_list, Max, Min
            elif(data_type == "Contour"):
                size = len(result)
                x = np.zeros(size) #lat
                y = np.zeros(size) #lon
                z = np.zeros(size) #sensor
                
                i = 0
                for item in result:
                    if(float(item[1]) > Max): Max = float(item[1])
                    if(float(item[1]) < Min): Min = float(item[1])
                    x[i] = item[2]
                    y[i] = item[3]
                    z[i] = float(item[1])
                    i += 1
                return x, y, z, Max, Min

    except sqlite3.Error as error:
        print("sqlite3 Error : ", error)

'''
def crawler_sensor(sensor, time_start, time_finish, data_type="Bar"):
    username = 'wecc-pingtung'
    password = '27548312wecc'
    url = "http://52.196.146.119:8000/login/"
    device = 'TW170116C0203401'

    if(sensor == 'PM25'):
        sensor = 'pms5003_pm25_air'
    elif(sensor == 'TVOC'):
        sensor = 'sgp30_tvoc'

    data_dic = {}
    data_list = []
    try:
        client = requests.session()
        client.get(url)
        csrftoken = client.cookies['csrftoken']
        login_data = {'csrfmiddlewaretoken': csrftoken, 'username': username, 'password': password, "next": ""}
        client.post(url, data = login_data)
        sessionid = client.cookies['sessionid']
        headers = {'Cookie': 'csrftoken=' + csrftoken + '; sessionid=' + sessionid}
        data = {'csrfmiddlewaretoken': csrftoken, 'sensor': sensor, 'time_frame_start': time_start, 'time_frame_finish': time_finish, 'device': device}
        r = client.post('http://52.196.146.119:8000/device_list/history_table_download',headers = headers, data = data)

        if(r.status_code == 500):
            print("500")
            return {"server type" : str(r.status_code)}

        csv = r.text
        data = np.array([c.split(',') for c in csv.splitlines()])
        #print(data)
        if(data_type == "Bar"):
            for i in range(1, len(data)):
                data_dic[data[0, 0]] = data[i, 0]
                data_dic['PM25'] = data[i, 1]
                data_dic[data[0, 2]] = data[i, 2]
                data_dic[data[0, 3]] = data[i, 3]
                data_list.append(data_dic)
                data_dic = {}
            print(data_list)
            return data_list
        elif(data_type == "Contour"):
            size = len(data)
            x = np.zeros(size) #lat
            y = np.zeros(size) #lon
            z = np.zeros(size) #sensor
            for i in range(1, len(data)):
                x[i] = data[i, 2]
                y[i] = data[i, 3]
                z[i] = data[i, 1]
            return x, y, z
    except:
        print("return error")
        data_list = {"type" : "error"}
        return data_list
'''


if __name__ == '__main__':
    app.run(host="127.0.0.1", port=8000, debug=True)
