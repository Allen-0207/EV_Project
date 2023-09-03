const b = 0.894

function Gaussian(x) {
  const obj = document.getElementsByName("Stability");
  let select = -1;
  for(var i = 0; i < obj.length; i++){
    if(obj[i].checked){
      select = i;
      break
    }
  }

  const obj_x = document.getElementsByName("x");
  let select_x = -1;
  for(var i = 0; i < obj_x.length; i++){
    if(obj_x[i].checked){
      select_x = i;
      break
    }
  }

  let a, c, d, f

  if(select == 0) {
    a = 213;
    if(select_x == 0) {
      c = 440.8, d = 1.941, f = 9.27;
    } else {
      c = 459.7, d = 2.094, f = -9.6;
    }
  } else if(select == 1) {
    a = 156;
    if(select_x == 0) {
      c = 106.6, d = 1.149, f = 3.3;
    } else {
      c = 108.2, d = 1.098, f = 2;
    }
  } else if(select == 2) {
    a = 104, c = 61, d = 0.911, f = 0;
  } else if(select == 3) {
    a = 68;
    if(select_x == 0) {
      c = 33.2, d = 0.725, f = -1.7;
    } else {
      c = 44.5, d = 0.516, f = -13;
    }
  } else if(select == 4) {
    a = 50.5;
    if(select_x == 0) {
      c = 22.8, d = 0.678, f = -1.3;
    } else {
      c = 55.4, d = 0.305, f = -34;
    }
  } else if(select == 5) {
    a = 34;
    if(select_x == 0) {
      c = 14.35, d = 0.74, f = -0.35;
    } else {
      c = 62.6, d = 0.18, f = -48.6;
    }
  }
  //console.log(a, b, c, d, f);
  const H = parseFloat(document.getElementById("H").value);
  const x2 = parseFloat(document.getElementById("x2").value);
  const y2 = parseFloat(document.getElementById("y2").value);
  const C1C2 = parseFloat(document.getElementById("C1C2").value);


  /* Test
  const H = 1.5; 
  const x2 = 45 
  const y2 = 42.5 
  const C1C2 = 2
  */

  var C1 = (a * (x+x2) ** b) * ((c * (x+x2) ** d) + f) * Math.exp(-((H ** 2) / (2 * ((c * x ** d + f) ** 2)))) * 1;
  var C2 = ((a * x ** b) * (c * x ** d) + f) * Math.exp(-((H ** 2) / (2 * ((c * (x+x2) ** d + f) ** 2)))) * Math.exp(-(((y2) ** 2) / ( 2 * a ** 2 * (x + x2) ** (b * 2))  ));
  return C1/C2 - C1C2;
}



function Cal() {
  const low = parseFloat(document.getElementById("low").value);
  const up = parseFloat(document.getElementById("up").value);
  const eps = parseFloat(document.getElementById("eps").value);
  //console.log(low, up);
  let answer = {};
  let find_answer = false;
  let y;
  for(var i = low; i <= up; i++) {
    y = Gaussian(i)
    //console.log("%d: %f", i, y);
    if(Math.abs(y) < eps) {
      answer[i] = Math.abs(y);
      find_answer = true;
    }
  }

  const sortable = Object.entries(answer).sort((b,c) => b[1]-c[1])
  //console.log(sortable)

  const h4_answer = document.getElementById("Answer")
  h4_answer.innerHTML = "";
  if(!find_answer){
    h4_answer.innerHTML = "Not Found";
    h4_answer.style.color = "red";
  }else {
    for(var i = 0; i < sortable.length; i++){
      h4_answer.innerHTML += "X: " + sortable[i][0].toString() + ", " + sortable[i][1].toFixed(7).toString() + "<br>";
    }
    h4_answer.style.color = "blue";
  }
  
}