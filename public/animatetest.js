function move() {
  var sq = document.getElementById("sq");
  posx = Math.random() * 100 + 100;
  posy = Math.random() * 100 + 100;
  sq.style.left = posx + "px";
  sq.style.top = posy + "px";
}
