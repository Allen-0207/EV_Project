tail.DateTime("#time_start, #time_finish", {
                    position: "right", timeSeconds: false, timeStepMinutes: 1, 
                    dateFormat: "YYYY-mm-dd", timeFormat: "HH:ii", stayOpen: false});

function Show() {
    const time_start = document.getElementById("time_start").value;
    const time_finish = document.getElementById("time_finish").value;
    const sensor = document.getElementById("sensorID").value;
    const time_gap = document.getElementById("time_gap").value;

    if(time_start == "" || time_finish == "") {
        alert("請選擇日期");
        return false;
    }else if(ValidDateTime(time_start) || ValidDateTime(time_finish)){
        alert("請輸入正確的日期格式 YYYY-MM-DD HH:MM");
        return false;
    }

    $.ajax({
        url: '/show_data',
        type: 'GET',
        data: {Time_start: time_start, Time_finish: time_finish, Sensor_ID: sensor, Time_Gap: time_gap },
        dataType: "json",
        success: function (data) {
            // console.log(data);
        	$('#data_head').remove();
        	$('#data_body').remove();
        	
        	$('#data').append("<thead id='data_head'><tr><th>Time</th><th>lat</th><th>lon</th><th>" + sensor + "</th></tr></thead>");
        	$('#data').append("<tbody id='data_body'>")
            for(item in data){            	
            	$('#data_body').append("<tr><td>" + data[item][0] + "</td><td>" + data[item][1] + "</td><td>" + data[item][2] + "</td><td>" + data[item][3] + "</td></tr>");
            }
            $('#data').append("</tbody>")
    }});
}


/* 
valid date & time format
    YYYY-MM-dd HH:MM
*/
function ValidDateTime(time) {
    const regex = /^([0-9]{4})-(01|02|03|04|05|06|07|08|09|10|11|12)-([0-3][0-9])\s([0-1][0-9]):([0-5][0-9])$/gm;

    if(time.match(regex) === null){
        return true;
    }

    return false;
}