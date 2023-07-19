tail.DateTime("#time_start, #time_finish", {
                    position: "right", timeSeconds: false, timeStepMinutes: 1, 
                    dateFormat: "YYYY-mm-dd", timeFormat: "HH:ii", stayOpen: false});

function Show() {
    const time_start = document.getElementById("time_start").value;
    const time_finish = document.getElementById("time_finish").value;
    const sensor = document.getElementById("sensorID").value;

    if(time_start == "" || time_finish == "") {
        alert("請選擇日期");
        return false;
    }
    $.ajax({
        url: '/api_show',
        type: 'POST',
        data: {Time_start: time_start, Time_finish: time_finish, Sensor_ID: sensor},
        dataType: "json",
        success: function (data) {
            console.log(data);
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