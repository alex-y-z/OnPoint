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
// category can be match, p1, or p2
// stat_type can be any keyword associated with the category
window.replication.onStatSelected((event, stat_type, category) => {
  if (category == "match") {
    switch(stat_type) {
      case "avgTurn":
        // Execute for average turn score
        break;
      case "numOf180":
        // Execute for number of 180s in match
        break;
      case "lowTurn":
        // Execute for lowest turn score
        break;
      case "numOfBE":
        // Execute for number of bull's eyes in match
        break;
      case "numOfDouble":
        // Execute for number of doubles in match
        break;
    }
  }
  else if (category == "p1") {
    switch(stat_type) {
      case "rank":
        // Execute for current league rank
        break;
      case "lastWin":
        // Execute for last match win
        break;
      case "avgScore":
        // Execute for average league score for the season
        break;
      case "numOf180":
        // Execute for number of 180s in season
        break;
      case "winPercent":
        // Execute for overall win percentage
        break;
    }
  }
  else {
    switch(stat_type) {
      case "rank":
        // Execute for current league rank
        break;
      case "lastWin":
        // Execute for last match win
        break;
      case "avgScore":
        // Execute for average league score for the season
        break;
      case "numOf180":
        // Execute for number of 180s in season
        break;
      case "winPercent":
        // Execute for overall win percentage
        break;
    }
  }
});