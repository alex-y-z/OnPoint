const leftPanel = $('#left-panel');
const dartboard = $('#board-box');
const throwPanel = $('#throw-panel');
const scoreboard = $('#scoreboard');
const stats = $('#statistics-table')

// Add, change, and remove darts
window.replication.onDartAdded((event, regionId, index, posX, posY) => {
  // Highlight region
  const region = dartboard.find(`#${regionId}`);
  region.addClass('selected-region');
  region.attr('data-darts', (_, value) => (value === undefined) && 1 || parseInt(value) + 1);

  // Add marker
  const marker = $(`<span id="marker-${index}" class="dart-marker"></span>`);
  marker.css('top', posY);
  marker.css('left', posX);
  dartboard.append(marker);
  marker.fadeIn(100);

  // Set throw label
  const throwLabel = throwPanel.find(`#throw-label-${index}`);
  throwLabel.text(region.attr('name'));
});

window.replication.onDartChanged((event, index, labelText) => {
  throwPanel.find(`#throw-label-${index}`).text(labelText);
});

window.replication.onDartRemoved((event, index, regionId, isRegionEmpty) => {
  if (isRegionEmpty) {
    dartboard.find(`#${regionId}`).removeClass('selected-region');
  }
  dartboard.find(`#marker-${index}`).fadeOut(100, function() {
    $(this).remove();
  })
});

// Clear the board and update score
window.replication.onNextTurn((event, playerNum, deltaScore) => {
  dartboard.find('.selected-region').removeClass('selected-region');
  dartboard.find('.dart-marker').fadeOut(100, function() {
    $(this).remove();
  });
  throwPanel.find('.throw-label').text('');
});

// Replicate left panel width
window.replication.onBoardResized((event, width) => {
  leftPanel.css('width', width);
});

// Set the scoreboard info from the new game form
window.replication.getFormInfo((event, legNum, name1, name2, score) => {
  scoreboard.find('#numOfLegs').text(legNum);
  scoreboard.find('#p1').text(name1);
  scoreboard.find('#p2').text(name2);
  scoreboard.find('#p1Score').text(score);
  scoreboard.find('#p2Score').text(score);
});

// Display Statistic Scorer Selected
// Search through the database for player/match history to calculate statistic
// stat_type can be any keyword associated in the option list (scorer.html)
window.replication.onStatSelected((event, loc, stat_type) => {
  switch(stat_type) {
    case "avgTurn":
      // Execute for average turn score

      stats.find(`#${loc}`).text("AVG Turn Score: ") // Place stat in .text("Blah blah blah" + *here*)
      break;
    case "numOf180":
      // Execute for number of 180s in match

      stats.find(`#${loc}`).text("180s in Match: ") // Place stat in .text("Blah blah blah" + *here*)
      break;
    case "lowTurn":
      // Execute for lowest turn score

      stats.find(`#${loc}`).text("Lowest Turn Score: ") // Place stat in .text("Blah blah blah" + *here*)
      break;
    case "numOfBE":
      // Execute for number of bull's eyes in match

      stats.find(`#${loc}`).text("# of Bull's Eyes: ") // Place stat in .text("Blah blah blah" + *here*)
      break;
    case "numOfDouble":
      // Execute for number of doubles in match

      stats.find(`#${loc}`).text("Doubles in Match: ") // Place stat in .text("Blah blah blah" + *here*)
      break;

    // Get p1 name from New Game submission or database
    case "p1-rank":
      // Execute for player 1's current league rank

      stats.find(`#${loc}`).text("Rank: ") // Place stat in .text("Blah blah blah" + *here*)
      break;
    case "p1-lastWin":
      // Execute for player 1's last match win

      stats.find(`#${loc}`).text("Last Match Win: ") // Place stat in .text("Blah blah blah" + *here*)
      break;
    case "p1-avgScore":
      // Execute for player 1's average league score for the season

      stats.find(`#${loc}`).text("AVG Score in Season: ") // Place stat in .text("Blah blah blah" + *here*)
      break; 
    case "p1-180":
      // Execute for player 1's number of 180s in the season

      stats.find(`#${loc}`).text("180s in Season: ") // Place stat in .text("Blah blah blah" + *here*)
      break; 
    case "p1-winPercent":
      // Execute for Player 1's overall win percentage

      stats.find(`#${loc}`).text("Win Percentage: ") // Place stat in .text("Blah blah blah" + *here*)
      break; 

    // Get p2 name from New Game submission or database  
    case "p2-rank":
      // Execute for player 2's current league rank

      stats.find(`#${loc}`).text("Rank: ") // Place stat in .text("Blah blah blah" + *here*)
      break;
    case "p2-lastWin":
      // Execute for player 2's last match win

      stats.find(`#${loc}`).text("Last Match Win: ") // Place stat in .text("Blah blah blah" + *here*)
      break;
    case "p2-avgScore":
      // Execute for player 2's average league score for the season

      stats.find(`#${loc}`).text("AVG Score in Season: ") // Place stat in .text("Blah blah blah" + *here*)
      break; 
    case "p2-180":
      // Execute for player 2's number of 180s in the season

      stats.find(`#${loc}`).text("180s in Season: ") // Place stat in .text("Blah blah blah" + *here*)
      break; 
    case "p2-winPercent":
      // Execute for Player 2's overall win percentage

      stats.find(`#${loc}`).text("Win Percentage: ") // Place stat in .text("Blah blah blah" + *here*)
      break; 
  }
});



