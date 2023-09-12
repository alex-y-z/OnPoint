const leftPanel = document.getElementById('left-panel');
const dartboard = document.getElementById('dartboard-svg');

// Replicate scorer input
window.replication.onDartAdded((event, regionId, posX, posY) => {
  const region = dartboard.getElementById(regionId)
  region.style.fill = 'rgb(0, 238, 255';
});

// Replicate left panel width
window.replication.onBoardResized((event, width) => {
  console.log(`RECEIVED ${width}`);
  leftPanel.style.width = width;
});

// Display Statistic Scorer Selected
window.replication.onStatSelected((event, stat_type, category) => {

});