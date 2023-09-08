const dartboard = document.getElementById('dartboard-svg');

// Replicate scorer input
window.replication.onDartAdded((event, regionId, posX, posY) => {
  const region = dartboard.getElementById(regionId)
  region.style.fill = 'rgb(0, 238, 255';
});