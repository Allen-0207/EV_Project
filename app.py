from flask import *
import pandas as pd
from scipy.interpolate import griddata as gd
from pykrige.ok import OrdinaryKriging
from datetime import datetime, timedelta
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

@app.route("/calculator")
def calculator():
    return render_template("calculator.html")


@app.route("/api", methods=['GET'])
def api():
    try:
        graph_, time_start, time_finish, sensor = request.args['Graph'], request.args['Time_start'], request.args['Time_finish'], request.args['Sensor_ID']
    except KeyError:
        abort(400, "KeyError")

    if(graph_ == "Bar"):
        # Get data from database
        data_list, Max, Min = get_data(sensor, time_start, time_finish, data_type="Bar")
        return jsonify({"map_data" : data_list, "max" : Max, "min" : Min})
        
    elif(graph_ == "Contour"):
        print(request)
        try:
            method = request.args['method']
            slope = request.args['slope']
            nugget = request.args['nugget']
            time_gap = request.args['Time_Gap']
        except KeyError:
            abort(400, "KeyError")

        levels = request.args.getlist('levels[]')
        # print(method, levels, slope, nugget, time_gap)
        x, y, z, Max, Min = get_data(sensor, time_start, time_finish, time_gap, data_type="Contour")
        
        '''
        #test data
        x = df["lat"].to_numpy()
        y = df["lon"].to_numpy()
        z = df["PM25"].to_numpy()
        '''
        #print(x)
        #print(y)
        #print(z)

        try:
            if(method == "Kriging"):
                if((x.max() - x.min()) > (y.max() - y.min())):
                    gridx = np.linspace(x.min(), x.max(), num=100)
                    gridy = np.linspace(y.min(), y.max(), num=int((y.max() - y.min()) / ((x.max() - x.min()) / 100)))
                    #print((y.max() - y.min()) / ((x.max() - x.min()) / 100))
                    
                else:
                    gridx = np.linspace(x.min(), x.max(), num=int((x.max() - x.min()) / ((y.max() - y.min()) / 100)))
                    gridy = np.linspace(y.min(), y.max(), num=100)
                    #print((x.max() - x.min()) / ((y.max() - y.min()) / 100))

                OK = OrdinaryKriging(
                    y, x, z,
                    variogram_parameters=[slope,nugget],
                    verbose=False,
                    enable_plotting=False,
                    pseudo_inv=True,
                )
                gridz, ss = OK.execute("grid", gridy, gridx)
                
                ax = plt.figure().add_subplot(111)
                if(levels == []):
                    contour = ax.contour(gridy, gridx, gridz.data, cmap=plt.cm.jet)
                else:
                    contour = ax.contour(gridy, gridx, gridz.data, levels=levels, cmap=plt.cm.jet)

            else:
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
        except Exception as e:
            try_error(e)
    else:
        abort(400)


'''
file pick 
return contour geojson
'''

@app.route("/api_contour", methods=['POST'])
def api_contour():
    
    try:
        x = request.args.getlist("Lat[]")
        y = request.args.getlist("Lon[]")
        z = request.args.getlist("Sensor[]")
        slope = request.args['slope']
        nugget = request.args['nugget']
        method = request.args['method']
    except KeyError:
        abort(400, "KeyError")
    
    levels = request.args.getlist('levels[]')
    
    x =  np.array([float(x1) for x1 in x])
    y =  np.array([float(y1) for y1 in y])
    z =  np.array([float(z1) for z1 in z])

    Max = z.max()
    Min = z.min()
    
    #print(x)
    #print(y)
    #print(z)

    try:
        if(method == "Kriging"):
            if((x.max() - x.min()) > (y.max() - y.min())):
                gridx = np.linspace(x.min(), x.max(), num=100)
                gridy = np.linspace(y.min(), y.max(), num=int((y.max() - y.min()) / ((x.max() - x.min()) / 100)))
                #print((y.max() - y.min()) / ((x.max() - x.min()) / 100))
                
            else:
                gridx = np.linspace(x.min(), x.max(), num=int((x.max() - x.min()) / ((y.max() - y.min()) / 100)))
                gridy = np.linspace(y.min(), y.max(), num=100)
                #print((x.max() - x.min()) / ((y.max() - y.min()) / 100))

            OK = OrdinaryKriging(
                y, x, z,
                variogram_parameters=[slope,nugget],
                verbose=False,
                enable_plotting=False,
                pseudo_inv=True,
            )
            gridz, ss = OK.execute("grid", gridy, gridx)
            
            ax = plt.figure().add_subplot(111)
            if(levels == []):
                contour = ax.contour(gridy, gridx, gridz.data, cmap=plt.cm.jet)
            else:
                contour = ax.contour(gridy, gridx, gridz.data, levels=levels, cmap=plt.cm.jet)

        else:
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
    
    except Exception as e:
        print(e)
        abort(400)


'''
download csv file with time start, time end & SENSOR 
'''
@app.route("/csv_download", methods=['GET'])
def csv_download():
    try:
        time_start = request.args['time_start']
        time_finish = request.args['time_finish']
        time_gap = rrequest.args["time_gap"]
        sensor = request.args['sensorID']
    except KeyError:
        abort(400, "KeyError")


    try:
        with sqlite3.connect('mqtt/sensor.db') as conn:
            c = conn.cursor()
            data = c.execute('''
                            SELECT time, lat, lon, ?
                            FROM SENSOR
                            WHERE time > ? AND
                                  time < ?
                            ''', (sensor, time_start, time_finish)).fetchall()
            conn.commit()
            data_filter = [data[0]]
            time1 = datetime.strptime(data[0][0], "%Y-%m-%d %H:%M:%S")
            for i in range(1, len(data)):
                if(i + 1 < len(data)):
                    time2 = datetime.strptime(data[i][0], "%Y-%m-%d %H:%M:%S")
                    if(time2 - time1 >= timedelta(seconds = int(time_gap))):
                        data_filter.append(data[i])
                        time1 = time2
                else:
                    time2 = datetime.strptime(data[i - 1][0], "%Y-%m-%d %H:%M:%S")
                    if(time2 - time1 >= timedelta(seconds = int(time_gap))):
                        data_filter.append(data[i])

            csv = 'time,lat,lon,' + sensor +'\n'
            for row in data_filter:
                csv += ','.join(str(word) for word in row) + '\n'
            #print(csv)

            return Response(csv, mimetype="text/csv", headers={"Content-disposition": "attachment; filename=sensor.csv"})
    except sqlite3.Error as error:
        print("sqlite3 Error : ", error)
        abort(400)

'''
return data with json
return style:
        [Time, lat, lon, Sensor],
                    '
                    '
        [Time, lat, lon, Sensor]
'''
@app.route("/show_data", methods=['GET'])
def show_data():
    try:
        time_start = request.args['Time_start']
        time_finish = request.args['Time_finish']
        time_gap = request.args["Time_Gap"]
        sensor = request.args['Sensor_ID']
    except KeyError:
        abort(400, "KeyError")
    
    
    try:
        with sqlite3.connect('mqtt/sensor.db') as conn:
            c = conn.cursor()
            data = c.execute('''
                            SELECT time, lat, lon, ?
                            FROM SENSOR
                            WHERE time > ? AND
                                  time < ?
                            ''', (sensor, time_start, time_finish)).fetchall()
            conn.commit()
            if(len(data) == 0):
                abort(404, "Data not found")
            
            data_filter = [data[0]]
            time1 = datetime.strptime(data[0][0], "%Y-%m-%d %H:%M:%S")
            for i in range(1, len(data)):
                if(i + 1 < len(data)):
                    time2 = datetime.strptime(data[i][0], "%Y-%m-%d %H:%M:%S")
                    if(time2 - time1 >= timedelta(seconds = int(time_gap))):
                        data_filter.append(data[i])
                        time1 = time2
                else:
                    time2 = datetime.strptime(data[i - 1][0], "%Y-%m-%d %H:%M:%S")
                    if(time2 - time1 >= timedelta(seconds = int(time_gap))):
                        data_filter.append(data[i])
            return jsonify(data_filter)

    except sqlite3.Error as error:
        print("sqlite3 Error : ", error)
        abort(400, error)
    except Exception as e:
        print(e)
        abort(400, e)



@app.errorhandler(404)
def handle_bad_request(error):
    return 'This page does not exist', 404

def try_error(error):
    error_class = e.__class__.__name__ 
    # detail = e.args[0] 
    cl, exc, tb = sys.exc_info() 
    lastCallStack = traceback.extract_tb(tb)[-1] 
    fileName = lastCallStack[0] 
    lineNum = lastCallStack[1] 
    funcName = lastCallStack[2] 

    # generate the error message
    errMsg = "Exception raise in file: {}, line {}, in {}: [{}] {}.".format(fileName, lineNum, funcName, error_class)
    # return 500 code
    abort(400, errMsg)

'''
Get data from database
Input:
    sensor: Ex: pm2_5
    time_start, time_finish:
        format: YYYY-MM-DD HH:MM
    data_type:
        Bar or Contour

Return:
    data_type:
        Bar:
            data_list, Max, Min
        
        Contour:
            x: lat
            y: lon
            z: sensor
            Max, Min
''' 
def get_data(sensor, time_start, time_finish, time_gap, data_type="Bar"):
    data_dic = {}
    data_list = []

    try:
        with sqlite3.connect('mqtt/sensor.db') as conn:
            c = conn.cursor()
            data = c.execute('''
                            SELECT time, lat, lon, ?
                            FROM SENSOR
                            WHERE time > ? AND
                                  time < ?
                            ''', (sensor, time_start, time_finish)).fetchall()
            conn.commit()

            result = [data[0]]
            time1 = datetime.strptime(data[0][0], "%Y-%m-%d %H:%M:%S")
            for i in range(1, len(data)):
                if(i + 1 < len(data)):
                    time2 = datetime.strptime(data[i][0], "%Y-%m-%d %H:%M:%S")
                    if(time2 - time1 >= timedelta(seconds = int(time_gap))):
                        result.append(data[i])
                        time1 = time2
                else:
                    time2 = datetime.strptime(data[i - 1][0], "%Y-%m-%d %H:%M:%S")
                    if(time2 - time1 >= timedelta(seconds = int(time_gap))):
                        result.append(data[i])

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


if __name__ == '__main__': 
    app.run(host="127.0.0.1", port=8000, debug=True)
