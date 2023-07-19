tail.DateTime("#time_start, #time_finish", {
                    position: "right", timeSeconds: false, timeStepMinutes: 1, 
                    dateFormat: "YYYY-mm-dd", timeFormat: "HH:ii", stayOpen: false});

document.addEventListener("DOMContentLoaded", function(){
  let scrollSpy = new bootstrap.ScrollSpy(document.body, {
    target: '#main_nav',
    offset: 200
  })
}); 

const tiles = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    minZoom: 1,
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
});

const latlng = L.latLng(22.722002, 120.307231);

let charts = [];

const map = L.map('map', {
    center: latlng,
    zoom: 15.5,
    zoomControl: false,
    fullscreenControl: true,
    fullscreenControlOptions: { // optional
        title: "Fullscreen",
        titleCancel: "Exit fullscreen"
    },
    layers: [tiles]
});

//display the scale
L.control.scale().addTo(map);

//save img to picture
L.easyPrint({
    title: 'Print map',
    filename: "Map",
    exportOnly: true,
    hideControlContainer: false
}).addTo(map);

$(function() {
    let oFileIn = document.getElementById('file_input');
    if(oFileIn.addEventListener){
        oFileIn.addEventListener('change', filePicked, false);
    }

    let wind_FileIn = document.getElementById('wind_file_input');
    if(wind_FileIn.addEventListener){
        wind_FileIn.addEventListener('change', wind_filePicked, false);
    }
});

//default colors 
$( document ).ready(function() {
    const storage = window.localStorage;
    
    if(storage.getItem("colors") === null){
        storage.setItem("colors", "jet");
    } 
})

//Bar
function Update_Bar() {
    const time_start = document.getElementById("time_start").value;
    const time_finish = document.getElementById("time_finish").value;
    const sensor = document.getElementById("sensorID").value;
    const part = parseInt(document.getElementById("parts").value, 10);
    if(time_start == "" || time_finish == ""){
        alert("請選擇日期");
        return false;
    }
    
    if(isNaN(part)){
        alert("請輸入要分幾等份");
        return false;
    }

    $.ajax({
        url: '/api',
        type: 'POST',
        data: { Graph: "Bar", Time_start: time_start, Time_finish: time_finish, Sensor_ID: sensor},
        dataType: "json",
        success: function (json_data) {

            const map_data = json_data["map_data"];
            const max_num = json_data["max"];
            const min_num = json_data["min"];

            let grades = [];
            if(part > 1){
                for(var i = min_num; i < max_num; i += (max_num - min_num) / (part - 1)){
                    grades.push(parseFloat(i.toFixed(2)));
                    //console.log(parseFloat(i))
                }
                if(grades.length != part){
                    grades.push(max_num);
                }
                
            }else{
                grades.push(min_num);
            }

            console.log(grades);
            Create_Legend(grades);

            let d;
            let max = getMax(map_data, sensor);
            if(charts.length != 0)
                for (var i = 0; i < charts.length; i++) {
                    map.removeLayer(charts[i]);
                }
                charts = [];

            let latitude = 0, longitude = 0;
            for (var i = 0; i < map_data.length; i++) {
                d = map_data[i];
                latitude += parseFloat(d.lat);
                longitude += parseFloat(d.lon);
                let popup = L.popup().setContent(sensor + " : " + d[sensor]);
                console.log(grades);
                charts.push(L.minichart([d.lat, d.lon], {data: d[sensor], maxValues: max, width: 15, colors: [getColor(d[sensor], grades)], labels: "auto"}).bindPopup(popup).openPopup());
                map.addLayer(charts[i]);
            }


            latitude /= map_data.length;
            longitude /= map_data.length;
            map.setView([latitude, longitude], 15.5);

        }

    });
}

//Contour
function Update_Contour() {
    const time_start = document.getElementById("time_start").value;
    const time_finish = document.getElementById("time_finish").value;
    const sensor = document.getElementById("sensorID").value;
    const part = parseInt(document.getElementById("parts").value, 10);
    const level_text = document.getElementById("levels").value;
    if(time_start == "" || time_finish == "") {
        alert("請選擇日期");
        return false;
    }

    if(isNaN(part)){
        alert("請輸入要分幾等份");
        return false;
    }
        
    let levels = [];
    const reg = new RegExp('^[0-9]+$');

    if(level_text != ""){
        level_text.split(',').forEach(function(item) {
            var number = item.replace(/\s+/g, '');
            if(reg.test(number) == false){
                alert("間距請輸入數字");
                return false;
            }else{
                levels.push(number);
            }
        });
    }
    console.log(levels)


    let data = {};
    data.Graph = "Contour";
    data.Time_start = time_start;
    data.Time_finish = time_finish;
    data.Sensor_ID = sensor;
    data.levels = levels;
    
    $.ajax({
        url: '/api',
        type: 'POST',
        data: data,
        dataType: "json",
        success: function (json_data) {
            console.log(json_data);
            const map_data = JSON.parse(json_data["map_data"]);
            const max_num = json_data["max"];
            const min_num = json_data["min"];



            console.log(typeof map_data);
            if(map_data.hasOwnProperty('Server_type') != true){

                let grades = [];
                if(part > 1){
                    for(var i = min_num; i < max_num; i += (max_num - min_num) / (part - 1)){
                        grades.push(parseFloat(i.toFixed(2)));
                        //console.log(parseFloat(i))
                    }
                    if(grades.length != part){
                        grades.push(max_num);
                    }
                    
                }else{
                    grades.push(min_num);
                }

                console.log(grades);
                Create_Legend(grades);

                if(charts.length != 0)
                    for (var i = 0; i < charts.length; i++) {
                        map.removeLayer(charts[i]);
                    }
                    charts = [];

                charts.push(L.geoJSON(map_data, {
                    onEachFeature: function  (feature, layer) {
                        if (feature.properties["level-value"])
                            layer.bindPopup(sensor + " : " + String(feature.properties["level-value"]));
                    },
                    style: function (feature) {
                        return {
                            "weight": 2.5,
                            //"color": feature.properties.stroke,
                            "color": getColor(feature.properties["level-value"], grades),
                            "opacity": 1,
                        }
                    }
                }));
                charts[0].addTo(map);
                
                

                //setView
                const [lon, lat] = map_data.features[0].geometry.coordinates[0];
                map.setView([lat, lon], 15.5);
            }
            
            /*
            var data, point;
            var point_array = new Array();
            
            for(var i = 0; i < map_data.length; i++) {
                data = map_data[i];
                //point = [data.lat, data.lon, data[sensor]];
                point = turf.point([data.lon, data.lat], {value: data[sensor]})
                point_array.push(point);
                console.log([data.lat, data.lon]);
            }
            var points = turf.featureCollection(point_array);

            var contours_points = turf.interpolate(points, 0.02, { gridType: 'points', property: 'value', units: 'kilometers' });
            var contours = turf.isolines(contours_points, [15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30], { zProperty: 'value' });
            //var contours = turf.isobands(contours_points, [15, 20, 25, 30], { zProperty: 'value' });

            charts.push(L.geoJSON(contours, {
                onEachFeature: function  (feature, layer) {
                    if (feature.properties.value)
                        layer.bindPopup(sensor + " : " + String(feature.properties.value));
                },
                style: function (feature) {
                    return {
                        "weight": 2.5,
                        "color": getColor(parseInt(feature.properties.value)),
                        "opacity": 1,
                    }
                }
            }));
            charts[0].addTo(map);
            */
    }});
}


//Sensor file input
function filePicked(oEvent) {
    //console.log("filePicked");
    
    const csvFile = oEvent.target.files[0];
    //console.log(csvFile);
    if(!csvFile){ return }

    let reader = new FileReader();
    reader.onload = function(e) {
        const data = e.target.result;

        let myModal = new bootstrap.Modal(document.getElementById('Modal_file'), {});
            
        myModal.show();

        let myModalEl = document.getElementById('Modal_file');
        
        myModalEl.addEventListener('shown.bs.modal', function (event) {
            tail.DateTime("#time_start_1, #time_finish_1", {
                position: "right", timeSeconds: false, timeStepMinutes: 1, 
                dateFormat: "YYYY-mm-dd", timeFormat: "HH:ii", stayOpen: false});
            
            document.getElementById('modal_bar').onclick = function() {
                const part = parseInt(document.getElementById("modal_parts").value, 10);

                if(isNaN(part)){
                    alert("請輸入要分幾等份");
                    return false;
                }

                //Remove old charts
                if(charts.length != 0){
                    for (var i = 0; i < charts.length; i++) {
                        map.removeLayer(charts[i]);
                    }
                    charts = [];
                }

                const [Time, sensor, lat, lon, sensor_name] = CSVtoArray(data);
                let max = Math.max(...sensor);
                let min = Math.min(...sensor);
                let latitude = 0, longitude = 0;

                let grades = [];
                if(part > 1){
                    for(var i = min; i < max; i += (max - min) / (part - 1)){
                        grades.push(parseFloat(i.toFixed(2)));
                        //console.log(parseFloat(i))
                    }
                    if(grades.length != part){
                        grades.push(max);
                    }
                    
                }else{
                    grades.push(min);
                }


                for(var i = 0; i < Time.length; i++){
                    latitude += parseFloat(lat[i]);
                    longitude += parseFloat(lon[i]);
                    let popup = L.popup().setContent(sensor_name + " : " + sensor[i]);
                    charts.push(L.minichart([lat[i], lon[i]], {data: sensor[i], maxValues: max, width: 15, colors: [getColor(sensor[i], grades)]}).bindPopup(popup).openPopup());
                    map.addLayer(charts[i]);
                }

                
                console.log(grades);
                Create_Legend(grades, sensor);


                latitude /= Time.length;
                longitude /= Time.length;
                map.setView([latitude, longitude], 15.5);
            };


            document.getElementById('modal_contour').onclick = function() {
                const part = parseInt(document.getElementById("modal_parts").value, 10);

                if(isNaN(part)){
                    alert("請輸入要分幾等份");
                    return false;
                }

                const level_text = document.getElementById("levels").value;
                let levels = [];
                    const reg = new RegExp('^[0-9]+$');

                    if(level_text != ""){
                        level_text.split(',').forEach(function(item) {
                            var number = item.replace(/\s+/g, '');
                            if(reg.test(number) == false){
                                alert("間距請輸入數字");
                                return false;
                            }else{
                                levels.push(number);
                            }
                        });
                    }

                const [Time, sensor, lat, lon, sensor_name] = CSVtoArray(data);
                console.log(sensor)
                API_Countour(lat, lon, sensor, part, levels, sensor_name);
            };
            
        });

        //var [Time, sensor, lat, lon] = CSVtoArray(data);
    }
    reader.readAsText(csvFile);
    $('#file_input').val("");
}

//get Countour geojson
function API_Countour(lat, lon, sensor, part, levels, sensor_name) {
    let data = {};
    data.Lat = lat;
    data.Lon = lon;
    data.Sensor = sensor;
    data.levels = levels;

    $.ajax({
        url: '/api_contour',
        type: 'POST',
        data: data,
        dataType: "json",
        success: function (json_data) {
            const map_data = JSON.parse(json_data["map_data"]);
            const max_num = json_data["max"];
            const min_num = json_data["min"];
            
            console.log(map_data);
            
            if(charts.length != 0){
                for (var i = 0; i < charts.length; i++) {
                    map.removeLayer(charts[i]);
                }
                charts = [];
            }

            let grades = [];
            if(part > 1){
                for(var i = min_num; i < max_num; i += (max_num - min_num) / (part - 1)){
                    grades.push(parseFloat(i.toFixed(2)));
                    //console.log(parseFloat(i))
                }
                if(grades.length != part){
                    grades.push(max_num);
                }
                
            }else{
                grades.push(min_num);
            }

            console.log(grades);
            Create_Legend(grades, sensor);

            charts.push(L.geoJSON(map_data, {
                onEachFeature: function  (feature, layer) {
                    if (feature.properties["level-value"])
                        
                        layer.bindPopup(sensor_name + " : " + String(feature.properties["level-value"]));
                },
                style: function (feature) {
                    return {
                        "weight": 2.5,
                        "color": getColor(feature.properties["level-value"], grades),//feature.properties.stroke,
                        "opacity": 1,
                    }
                }
            }));
            charts[0].addTo(map);

            //setView
            const [lon, lat] = map_data.features[0].geometry.coordinates[0];
            map.setView([lat, lon], 15.5);
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            
            alert("Error");
        }
    });
}



//Create legend
function Create_Legend(grades) {
    let old_legend = document.getElementsByClassName("info legend")[0];
    if(old_legend != undefined){
        old_legend.remove()
    }

    let legend = L.control({position: 'bottomright'});

    legend.onAdd = function(map) {
        let div = L.DomUtil.create('div', 'info legend');

        for (var i = 0; i < grades.length; i++) {
            //console.log(getColor(grades[i] + 1));
            div.innerHTML +=
                '<div><i style="background:' + getColor(grades[i], grades) + '"></i> ' +
                grades[i]  + '</div>';
        }

        return div;
    };

    legend.addTo(map);
}


//remove Map Bar & Contour
function Clear() {
    
    let old_legend = document.getElementsByClassName("info legend")[0];
    if(old_legend != undefined){
        old_legend.remove()
    }

    if(charts.length != 0)
        for (var i = 0; i < charts.length; i++) {
            map.removeLayer(charts[i]);
        }
        charts = [];
}

//Rose for test
function Update_Wind_Rose() {
    
    const time_start = "2021-03-18 08:00";    //document.getElementById("wind_time_start").value;
    const time_finish = "2021-03-18 08:00";   //document.getElementById("wind_time_finish").value;
    /*
    if(time_start == "" || time_finish == "") {
        alert("請選擇日期");
        return false;
    }
    */
    $.ajax({
        url: '/rose',
        type: 'POST',
        data: {Time_start: time_start, Time_finish: time_finish},
        dataType: "json",
        success: function (data) {
            //20210218
            const names = {"0.3" : "< 0.3", "1.5" : "0.3 ~ 1.5", "3.3" : "1.6 ~ 3.3", "5.4" : "3.4 ~ 5.4", "7.9" : "5.5 ~ 7.9", "10.7" : "8.0 ~ 10.7", "13.8" : "10.8 ~ 13.8", "17.1" : "13.9 ~ 17.1", "20.7" : "17.2 ~ 20.7"};
            const colors = {"0.3" : "rgb(249, 161, 35)", "1.5" : "rgb(249, 249, 35)", "3.3" : "rgb(91, 249, 35)", "5.4" : "rgb(35, 249, 179)", "7.9" : "rgb(35, 88, 249)", "10.7" : "rgb(167, 35, 249)", "13.8" : "rgb(249, 35, 230)", "17.1" : "rgb(249, 35, 69)", "20.7" : "rgb(164, 35, 157)"}
            const theta = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
            //              北, 北北東, 北東, 東北東, 東,  東南東, 南東, 南南東, 南, 南南西, 南西, 西南西, 西,  西北西, 北西,  北北西

            const rose_data = []
            for (var i in data) {
                    rose_data.push({
                    r: data[i],
                    name: names[i],
                    theta: theta,
                    marker: {color: colors[i]},
                    type: "barpolar"
                  })
            }
            console.log(rose_data)

            const mapElement = document.getElementById("map");
            const width = mapElement.offsetWidth;
            const height = mapElement.offsetHeight;

            const wind_width = width / 4;
            const wind_height = height / 4;

            L.Control.MyControl = L.Control.extend({
              onAdd: function(map) {
                let el = L.DomUtil.create('div');
                el.id = 'wind-rose';
                el.style.height = (wind_height + 20).toString() + 'px';
                el.style.width  = wind_width.toString() + 'px';

                return el;
              },
              onRemove: function(map) {
                let el = L.DomUtil.remove('div');
                el.id = 'wind-rose';
                el.style.height = (wind_height + 20).toString() + 'px';
                el.style.width  = wind_width.toString() + 'px';
                return el;
              }
            });

            L.control.myControl = function(opts) {
              return new L.Control.MyControl(opts);
            }

            L.control.myControl({
              position: 'topright'
            }).addTo(map);

            //619, 50
            const layout = {
                //paper_bgcolor:'rgba(0,0,0,0)',
                margin: {
                    l: 20,
                    r: 20,
                    b: 20,
                    t: 20,
                    pad: 20
                },
                font: {size: 8, color: "black",},
                polar: {
                  barmode: "overlay",
                  bargap: 0,
                  radialaxis: {ticksuffix: "%", angle: 22.5, dtick: 20, autorange: true},
                  angularaxis: {direction: "clockwise"}
                }
              };

            const config = {responsive: true};

            Plotly.newPlot("wind-rose", rose_data, layout, config);

    }});
}


function wind_filePicked(oEvent) {

    let ExcelToJSON = function() {
      this.parseExcel = function(file) {
        let reader = new FileReader();

        reader.onload = function(e) {
            let data = e.target.result;
            const workbook = XLSX.read(data, {
                type: 'binary'
            });
            //console.log(workbook.SheetNames[0]);
            const sheetName = workbook.SheetNames[0];
            const json_object = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);//, {header:1});
            let result = csvJSON(json_object);

            let Time = [], WS, WD;
            result[0].forEach(function(t){
                Time.push(new Date(Date.parse(t)));
            });
            //Time = result[0];
            WS = result[1];
            WD = result[2];

            console.log(Time);
            console.log(WS);
            console.log(WD);

            let myModal = new bootstrap.Modal(document.getElementById('Modal_rose_file'), {});
            
            myModal.show();

            let myModalEl = document.getElementById('Modal_rose_file');
            
            myModalEl.addEventListener('shown.bs.modal', function (event) {
                tail.DateTime("#wind_time_start, #wind_time_finish", {
                    position: "right", timeSeconds: false, timeStepMinutes: 1, 
                    dateFormat: "YYYY-mm-dd", timeFormat: "HH:ii", stayOpen: false});
                document.getElementById('modal_ok').onclick = function() {Rose(Time, WS, WD)};
                
            });
        };

        reader.onerror = function(ex) {
          console.log(ex);
        };
        reader.readAsBinaryString(file);
        $('#wind_file_input').val("");

      };
  };

    const files = oEvent.target.files; 
    const xl2json = new ExcelToJSON();
    xl2json.parseExcel(files[0]);
}

function Rose(Time, WS, WD) {
    const myModal = new bootstrap.Modal(document.getElementById('Modal_rose_file'), {});        
    myModal.hide();
    const time_start = new Date(document.getElementById("wind_time_start").value);
    const time_finish = new Date(document.getElementById("wind_time_finish").value);
    let new_WS = [];
    let new_WD =[];
    for(var i = 0; i < Time.length; i++){
        if(Time[i] >= time_start && Time[i] <= time_finish){
            new_WS.push(WS[i]);
            new_WD.push(WD[i]);
        }
    }
    const rose_data = sort_rose(new_WS, new_WD);
    rose_show(rose_data);
}

function rose_show(rose_data) {
    const mapElement = document.getElementById("map");
    const width = mapElement.offsetWidth;
    const height = mapElement.offsetHeight;

    const wind_width = width / 4;
    const wind_height = height / 4;

    L.Control.MyControl = L.Control.extend({
      onAdd: function(map) {
        let el = L.DomUtil.create('div');
        el.id = 'wind-rose';
        el.style.height = (wind_height + 20).toString() + 'px';
        el.style.width  = wind_width.toString() + 'px';

        return el;
      },
      onRemove: function(map) {
        // Nothing to do here
      }
    });

    L.control.myControl = function(opts) {
      return new L.Control.MyControl(opts);
    }

    L.control.myControl({
      position: 'topright'
    }).addTo(map);

    //619, 50
    const layout = {
        //paper_bgcolor:'rgba(0,0,0,0)',
        margin: {l: 20, r: 20, b: 20, t: 20, pad: 20},
        font: {size: 8, color: "black",},
        polar: {
          barmode: "overlay",
          bargap: 0,
          radialaxis: {ticksuffix: "%", angle: 22.5, dtick: 20, autorange: true},
          angularaxis: {direction: "clockwise"}
        }
      };

    const config = {responsive: true};

    Plotly.newPlot("wind-rose", rose_data, layout, config);

}

//GIF
function Add_Image() {
    const mapElement = document.getElementById("map");
    const width = mapElement.offsetWidth;
    const height = mapElement.offsetHeight;

    //const p = new Promise(resolve => tileLayer.on("load", () => resolve()));
    domtoimage.toPng(mapElement, { width, height })
        .then(function(dataURL) {
            const img_li = document.createElement("li");
            img_li.setAttribute('id','li-img');
            img_li.setAttribute('class','ui-sortable-handle');
            document.getElementById("img-list").appendChild(img_li);
            const img_div = document.createElement("div");
            img_div.setAttribute('class', 'image-area');
            const img_a = document.createElement("a");
            img_a.setAttribute("class", "remove-image");
            img_a.setAttribute("style", "display: inline;")
            img_a.text = String.fromCharCode(215);
            const imgElement = document.createElement("img");
            imgElement.setAttribute('style','display: block; margin-left: auto; margin-right: auto;');
            imgElement.style.width = (width / 4).toString() + 'px';
            imgElement.style.height = (height / 4).toString() + 'px';
            imgElement.src = dataURL;
            img_div.appendChild(imgElement);
            img_div.appendChild(img_a);
            img_li.appendChild(img_div);
            GIF(width, height);
            
            $('.remove-image').click(function() {
                console.log("click");
                $(this).parent().parent().remove();
                GIF(width, height);
            });
        });


}

//make GIF with img sort
function GIF(width, height) {
    let lis = document.getElementById('img-list').getElementsByTagName("li");
    let image_list = [];
    for(var i = 0; i < lis.length; i++){
        image_list.push(lis[i].getElementsByTagName('img')[0].src)
    }
    //console.log(image_list.length);
    if(image_list.length == 0) {
        document.getElementById('GIF').style.display='none';
        document.getElementById('save_btn').removeAttribute("href");

    }else {
        gifshot.createGIF({
            gifWidth: width,
            gifHeight: height,
            images: image_list,
            interval: 1,
        }, function (obj) {
            if (!obj.error) {
                const image = obj.image, animatedImage = document.getElementById('GIF');
                animatedImage.setAttribute('style','display: block; margin-left: auto; margin-right: auto;');
                animatedImage.style.width = (width / 2).toString() + 'px';
                animatedImage.style.height = (height / 2).toString() + 'px';
                animatedImage.src = image;
                const link = document.getElementById('save_btn');
                link.href = image;
            }
        });
    }
    
}

//click to switch img sort 
$(document).ready(function () {
    $("#img-list").sortable({
        update: function(event, ui) { 
            const mapElement = document.getElementById("map");
            const width = mapElement.offsetWidth;
            const height = mapElement.offsetHeight;
            GIF(width, height)
        }
    });
});




function getMax(arr, sensor) {
    let max = 0, value;
    for (var i = 0; i < arr.length; i++) {
        value = arr[i][sensor];
        if(value > max)
            max = value;
    }
    return max;
}


function getColor(x, grades) {
    
    const storage = window.localStorage;
    const plaette = storage.getItem("colors");
    const part = grades.length;

    const colorMap = jPalette.ColorMap.get(plaette)(part);

    for(var i = 0; i < grades.length - 1; i++){
        if(x >= grades[i] && x < grades[i + 1]){
            const color = colorMap["map"][i]
            let r = color["r"];
            let g = color["g"];
            let b = color["b"];

            return rgbToHex(r, g, b);
        }
    }

    const color = colorMap["map"][colorMap["map"].length - 1]
    let r = color["r"];
    let g = color["g"];
    let b = color["b"];

    return rgbToHex(r, g, b);
    
}

//csv to array (file)
function CSVtoArray(data) {
    let lines = data.split("\n");
    const sensor_name = (lines[0].split(",")[3]).replace(/\r?\n|\r/, '');
    if(document.getElementById("time_start_1").value == "" || document.getElementById("time_finish_1").value == ""){
        let Time = [];
        let sensor = [];
        let lat = [];
        let lon = [];
        for(var i = 1; i < lines.length; i++){
            let currentline = lines[i].split(",");
            if(currentline[0] != ""){
                Time.push(currentline[0]);
                lat.push(currentline[1]);
                lon.push(currentline[2]);
                sensor.push(currentline[3].replace("\r", ""));
            }
            
        }

        return [Time, sensor, lat, lon, sensor_name];
    }else{
        const time_start = new Date(document.getElementById("time_start_1").value);
        const time_finish = new Date(document.getElementById("time_finish_1").value);
        let lines = data.split("\n");
        let Time = [];
        let sensor = [];
        let lat = [];
        let lon = [];

        for(var i = 1; i < lines.length; i++){
            let currentline = lines[i].split(",");
            if(currentline[0] != ""){
                let t = new Date(currentline[0]);
                if(t >= time_start && t <= time_finish){
                    Time.push(currentline[0]);
                    lat.push(currentline[1]);
                    lon.push(currentline[2]);

                    sensor.push(currentline[3].replace("\r", ""))
                }
            }

            
        }

        return [Time, sensor, lat, lon, sensor_name];
    }
    
}

//csv to Json type (wind rose)
function csvJSON(csv) {
    let lines=csv.split("\n");
    let Time = [];
    let WS = [];
    let WD = [];

    for(var i = 4; i < lines.length; i++){
        let currentline = lines[i].split(",");
        if(currentline[0] != ""){
            Time.push(currentline[0]);
            WS.push(currentline[6]);
            WD.push(currentline[7]);
        }    
    }
  return [Time, WS, WD];
}


//separate WS & WD by group
function sort_rose(WS, WD) {
    const names = {"0.3" : "< 0.3", "1.5" : "0.3 ~ 1.5", "3.3" : "1.6 ~ 3.3", "5.4" : "3.4 ~ 5.4", "7.9" : "5.5 ~ 7.9", "10.7" : "8.0 ~ 10.7", "13.8" : "10.8 ~ 13.8", "17.1" : "13.9 ~ 17.1", "20.7" : "17.2 ~ 20.7"};
    const colors = {"0.3" : "rgb(249, 161, 35)", "1.5" : "rgb(249, 249, 35)", "3.3" : "rgb(91, 249, 35)", "5.4" : "rgb(35, 249, 179)", "7.9" : "rgb(35, 88, 249)", "10.7" : "rgb(167, 35, 249)", "13.8" : "rgb(249, 35, 230)", "17.1" : "rgb(249, 35, 69)", "20.7" : "rgb(164, 35, 157)"}
    const theta = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    //              北, 北北東, 北東, 東北東, 東,  東南東, 南東, 南南東, 南, 南南西, 南西, 西南西, 西,  西北西, 北西,  北北西

    const value = [0.0, 0.3, 1.5, 3.3, 5.4, 7.9, 10.7, 13.8, 17.1, 20.7];
    const degree = [[348.76, 11.25], [11.26, 33.75], [33.76, 56.25], [56.26, 78.75], [78.76, 101.25], [101.26, 123.75], 
                  [123.76, 146.25], [146.26, 168.75], [168.76, 191.25], [191.26, 213.75], [213.76, 236.25], [236.26, 258.75], 
                  [258.76, 281.25], [281.26, 303.75], [303.76, 326.25], [326.26, 348.75]];
    groups = {}
    for(var i = 1; i < value.length; i++){
        let data = WS_range(WS, WD, value[i - 1], value[i])
        if(data.length != 0){
            let pro = [];
            let size = data.length;
            for(var l = 0; l < degree.length; l++){
                let d1 = degree[l][0];
                let d2 = degree[l][1];
                let p = WD_pro(data, d1, d2);
                pro.push(p / size * 100);
            }
            groups[value[i]] = pro;
        }else{  
            groups[value[i]] = Array(16).fill(0)
        }
    }
    
    const rose_data = []
    for (var i in groups) {
        rose_data.push({
            r: groups[i],
            name: names[i],
            theta: theta,
            marker: {color: colors[i]},
            type: "barpolar"
        })
    }
    return rose_data
}

//pick the WS in range
function WS_range(WS, WD, lower, upper) {
    let result = [];
    for(var i = 0; i < WS.length; i++){
        if(WS[i] >= lower && WS[i] < upper){
            result.push(WD[i]);
        }
    }
    return result;
}

//count each WD percent in all data
function WD_pro(data, d1, d2) {
    let len = 0;
    data.forEach(function(d){
        if(Number(d) >= d1 && Number(d) < d2){
            len++;
        }
    });
    return len;
}

//Convert RGB to Hex
function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}