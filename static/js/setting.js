//setting page js
$( document ).ready(function() {
	const plaettes = ["jet", "cubehelix", "warm", "oxygen", "plasma", "hot"];

	for(var i = 0; i < plaettes.length; i++){
		let table = document.getElementById("color" + (i + 1).toString());
		let tr = table.rows[0];

		let colorMap = jPalette.ColorMap.get(plaettes[i])(20);

		for (let [key, color] of Object.entries(colorMap["map"])){
			let r = color["r"];
			let g = color["g"];
			let b = color["b"];
			let hex = rgbToHex(r, g, b);
			const td = document.createElement("td");
			td.setAttribute('style', "background-color:" + hex + ";height:50px;");
			tr.appendChild(td);
		}
	}
})

//check space and color
$( document ).ready(function() {
    const storage = window.localStorage;
	
    if(storage.getItem("colors") === null){
        storage.setItem("colors", "jet");
    } 
})

function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}


function Save_Setting() {
	
	const storage = window.localStorage;

	//const sensor = document.getElementById("sensorID").value;
	const color = document.getElementById("color").value;


	let succ = false;
	try{
		storage.setItem("colors", color);
		succ = true;
	}catch(e){
		console.log(e);
	}

	const span = document.createElement("span");
	span.setAttribute('class', 'closebtn');
	span.setAttribute('onClick', "this.parentElement.remove();");
	span.innerHTML = "&times";

	const strong = document.createElement("strong");
	if(succ){
		strong.innerHTML = "儲存成功!";
	}else{
		strong.innerHTML = "儲存失敗!";
	}
	

	const div1 = document.createElement("div");
	if(succ){
		div1.setAttribute('class', 'alert success');
	}else{
		div1.setAttribute('class', 'alert');
	}
	div1.setAttribute('id', 'alert');
	div1.appendChild(span);
	div1.appendChild(strong);

	const div2 = document.getElementById("col-sm");
	div2.appendChild(div1);

	setTimeout(function(){
		$('#alert').remove();
	}, 2500);
}
