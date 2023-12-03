const leftPanel = $('#left-panel');
const dartboard = $('#board-box');
const throwPanel = $('#throw-panel');
const comboLabels = $('.winning-throw-label');
const scoreboard = $('#scoreboard');
const stats = $('#statistics-table');


// This function only runs when the file is first loaded
function init() {

  // Register IPC listeners
  window.replication.onDartAdded(addDart);
  window.replication.onDartChanged(changeDart);
  window.replication.onDartRemoved(removeDart);
  window.replication.onNextTurn(nextTurn);
  window.replication.onBoardResized(resizeBoard);
  window.replication.onComboChanged(changeCombo);
  window.replication.onPerfectLegChanged(changePerfectLeg);
  window.replication.onGetFormInfo(setUpScoreboard);
  window.replication.onStatSelected(showStatistic);
  window.replication.onLegWon(clearBoard);
  window.replication.onScreenReset(() => { location.reload(); });
  window.replication.onShowWinner(showWinner);
  window.replication.onShowLeader(showLeader);
}

$(init());


// Mark throw on board
function addDart(event, index, regionId, posX, posY) {

  // Highlight region
  const region = $(`#${regionId}`);
  region.addClass('selected-region');
  region.attr('data-darts', (_, value) => (value === undefined) && 1 || parseInt(value) + 1);

  // Update existing marker or add new one
  var marker = null;
  if (region.attr('data-darts') > 1) {
    marker = $(`#marker-${regionId}`);
    marker.find('tspan').text(region.attr('data-darts'));
  }
  else {
    marker = $('#temp-marker').clone().attr('id', `marker-${regionId}`);
    marker.css('top', posY);
    marker.css('left', posX);
    marker.addClass('dart-marker');
    dartboard.append(marker);
    marker.fadeIn(100);
  }
  $('.big-dart-marker').removeClass('big-dart-marker');
  marker.addClass('big-dart-marker');

  // Set throw label
  const throwLabel = $(`#throw-label-${index} > button`);
  throwLabel.text(region.attr('name'));
}


// Remove marker from board
function removeDart(event, index, regionId, dartsLeft) {
  const region = $(`#${regionId}`);
  const marker = $(`#marker-${regionId}`);
  
  region.attr('data-darts', dartsLeft);
  $('.big-dart-marker').removeClass('big-dart-marker');
  $(`#throw-label-${index} > button`).text('');
  
  if (dartsLeft == 0) { // Remove marker/highlight
    region.removeClass('selected-region');
    marker.fadeOut(100, function() {
      $(this).remove();
    })
  }
  else { // Decrement label
    marker.find('tspan').text(dartsLeft);
  }
}


// Update throw label
function changeDart(event, index, labelText) {
  $(`#throw-label-${index} > button`).text(labelText);
}


// Clear the board and update score
function nextTurn(event, playerNum, newScore) {
  changeColor((playerNum % 2) + 1);
  
  // Update score
  $(`#p${playerNum}Score`).text(newScore);

  // Clear board
  clearBoard();
}


// Change player emphasis on turn
function changeColor(currentPlayer) {
  const currentCell = $(`#p${currentPlayer}`);
  currentCell.parent().addClass('bg-emphasis');
  currentCell.addClass('text-emphasis');
  const otherCell = $(`#p${(currentPlayer % 2) + 1}`);
  otherCell.parent().removeClass('bg-emphasis');
  otherCell.removeClass('text-emphasis');
}


// Clear markers and throw labels
function clearBoard(event, legWinner, startScore, legWins, setWins, legStarter) {
  dartboard.find('.selected-region').removeAttr('data-darts');
  dartboard.find('.selected-region').removeClass('selected-region');
  dartboard.find('.dart-marker').fadeOut(100, function() {
    $(this).remove();
  });
  throwPanel.find('.throw-label > button').text('');
  comboLabels.slideUp('fast');

  // Reset scoreboard for leg win
  if (legWinner) {
    $('.perfect-label').removeClass('max-perfect-label min-perfect-label');
    $(`#p${legWinner}LegsWon`).text(legWins);
    $(`#p${legWinner}SetsWon`).text(setWins);
    scoreboard.find('#p1Score').text(startScore);
    scoreboard.find('#p2Score').text(startScore);
    changeColor(legStarter);
  }
}


// Replicate left panel width
function resizeBoard(event, width) {
  leftPanel.css('width', width);
}


// Replicate winning move labels
function changeCombo(event, index, value) {
  if (index === undefined) {
    comboLabels.slideUp('fast'); // Hide all
    return;
  }

  const label = $(`#throw-label-${index} > .winning-throw-label`);
  if (value) {
    label.text(value);
    label.slideDown('slow'); // Show one
  }
  else {
    label.slideUp('fast'); // Hide one
  }
}


// Replicate perfect leg labels
function changePerfectLeg(event, playerNum, hasPerfectLeg) {
  const perfectLabel = $(`#perfect-label-${playerNum}`);
  if (hasPerfectLeg) {
    perfectLabel.addClass('max-perfect-label min-perfect-label');
    setTimeout(() => { perfectLabel.removeClass('max-perfect-label'); }, 3000); // Minimize after a few seconds
  }
  else {
    perfectLabel.removeClass('max-perfect-label min-perfect-label');
  }
}


// Set the scoreboard info from the new game form
function setUpScoreboard(event, name1, name2, offName, loc, date, score, legNum, setNum, source) {
  
  // For changing player emphasis color
  changeColor(1);

  // Fill in the text
  scoreboard.find('#set-col').text(`Sets (${setNum})`);
  scoreboard.find('#leg-col').text(`Legs (${legNum})`);
  scoreboard.find('#p1').contents()[0].nodeValue = name1;
  scoreboard.find('#p2').contents()[0].nodeValue = name2;
  scoreboard.find('#p1Score').text(score);
  scoreboard.find('#p2Score').text(score);
  scoreboard.find('#p1SetsWon').text('0');
  scoreboard.find('#p2SetsWon').text('0');
  scoreboard.find('#p1LegsWon').text('0');
  scoreboard.find('#p2LegsWon').text('0');

  // Add the flag image
  scoreboard.find('#p1-flag').attr("src", source[0]);
  scoreboard.find('#p2-flag').attr("src", source[1]);

  // Fill in the names on the stats board
  const nameTokens1 = name1.split(' ');
  const nameTokens2 = name2.split(' ');
  stats.find('#p1Name').contents()[0].nodeValue = `${name1.substring(0, 1)}. ${nameTokens1[nameTokens1.length - 1]} Statistics`;
  stats.find('#p2Name').contents()[0].nodeValue = `${name2.substring(0, 1)}. ${nameTokens2[nameTokens2.length - 1]} Statistics`;
}


// Display Statistic Scorer Selected
// Search through the database for player/match history to calculate statistic
// stat_type can be any keyword associated in the option list (scorer.html)
function showStatistic(event, statistics, loc, stat_type) {
  // Get stats object from database
  // statistics.game for game stats
  // statistics.p1 for player 1
  // statistics.p2 for player 2

  // Decide which stat to display and where
  switch(stat_type) {
    case "avgTurn":
      // Execute for average turn score
      stats.find(`#${loc}`).text("AVG Turn Score: " + statistics.game.avg_turn);
      break;
    case "numOf180":
      // Execute for number of 180s in match
      stats.find(`#${loc}`).text("180s in Match: " + statistics.game.num_180); 
      break;
    case "highTurn":
      // Execute for lowest turn score
      stats.find(`#${loc}`).text("Highest Turn Score: " + statistics.game.highest_turn); 
      break;
    case "numOfBE":
      // Execute for number of bull's eyes in match
      stats.find(`#${loc}`).text("# of Bull's Eyes: " + statistics.game.num_bull); 
      break;
    case "numOfDouble":
      // Execute for number of doubles in match
      stats.find(`#${loc}`).text("Doubles in Match: " + statistics.game.num_double); 
      break;

    // Get p1 name from New Game submission or database
    case "p1-rank":
      // Execute for player 1's current league rank
      stats.find(`#${loc}`).text("Rank: " + statistics.p1.league_rank); 
      break;
    case "p1-checkouts":
      // Execute for player 1's last match win
      stats.find(`#${loc}`).text("Number of 100+ Checkouts: " + statistics.p1.num_checkouts_100); 
      break;
    case "p1-avgScore":
      // Execute for player 1's average league score for the season
      stats.find(`#${loc}`).text("AVG Score in Season: " + statistics.p1.average_score); 
      break; 
    case "p1-180":
      // Execute for player 1's number of 180s in the season
      stats.find(`#${loc}`).text("180s in Season: " + statistics.p1.num_180s);
      break; 
    case "p1-winPercent":
      // Execute for Player 1's overall win percentage
      stats.find(`#${loc}`).text("Win Percentage: " + statistics.p1.win_percent); 
      break; 

    // Get p2 name from New Game submission or database  
    case "p2-rank":
      // Execute for player 2's current league rank
      stats.find(`#${loc}`).text("Rank: " + statistics.p2.league_rank); 
      break;
    case "p2-checkouts":
      // Execute for player 2's last match win
      stats.find(`#${loc}`).text("Number of 100+ Checkouts: " + statistics.p2.num_checkouts_100); 
      break;
    case "p2-avgScore":
      // Execute for player 2's average league score for the season
      stats.find(`#${loc}`).text("AVG Score in Season: " + statistics.p2.avgerage_score); 
      break; 
    case "p2-180":
      // Execute for player 2's number of 180s in the season
      stats.find(`#${loc}`).text("180s in Season: " + statistics.p2.num_180s); 
      break;
    case "p2-winPercent":
      // Execute for Player 2's overall win percentage
      stats.find(`#${loc}`).text("Win Percentage: " + statistics.p2.win_percent); 
      break; 
  }
}


function showWinner(event, playerName, match, leg, throws) {
  const modal = $('<iframe id="winner-modal" src="winner.html"></iframe>');
  
  modal.on('load', () => {
    const winnerDoc = modal.contents();

    winnerDoc.find('#name').text(playerName);
    winnerDoc.find('#numMatch').text("Match Wins: " + match);
    winnerDoc.find('#numLegs').text("Leg Wins: " + leg);
    winnerDoc.find('#lastThrow').text("Final Throws: " + throws[throws.length - 1]);

    winnerDoc.find('#exit-button').hide();

    // Close modal when exit button is pushed
    winnerDoc.find('#exit-button').on('click', () => {
      modal.remove();
    });
  });

  $('body').append(modal);
}

function updateLeaderTable(leaderDoc, playerInfo) {
  // Find the table
  const table = leaderDoc.find('#leader-table').get(0);

  // Loop through each player object to add them to the table
  playerInfo.forEach((info) => {
    
    // Add a row to the end of the table
    let row = table.insertRow(-1);
   
    // Add a Cell for the first name and add its text
    let firstCell= row.insertCell(0);
    let name = document.createTextNode(info.first_name + " " + info.last_name);
    firstCell.appendChild(name);
    
    // Add a cell for the number of wins and add its text
    let winCell = row.insertCell(1);
    let wins = document.createTextNode(info.total_wins);
    winCell.appendChild(wins);
    
    // Add a cell for the number of losses and add its text
    let loseCell = row.insertCell(2);
    let lose = document.createTextNode(info.total_games - info.total_wins);
    loseCell.appendChild(lose);
    
    // Add a cell for the number of games and add its text
    let gamesCell = row.insertCell(3);
    let games = document.createTextNode(info.total_games);
    gamesCell.appendChild(games);
  });
}


// Show Leader Board
function showLeader(event, hideModal, playerInfo) {
  if (hideModal == true) {
    const leaderboard = $('#leaderboard-modal');
    leaderboard.remove();
    return;
  }
  
  // Add the iframe
  const modal = $('<iframe id="leaderboard-modal" src="leaderboard.html"></iframe>');

  // Load the iframe
  modal.on('load', () => {
    const leaderDoc = modal.contents();

    // Hide the user input div - Show the leaderboard div
    leaderDoc.find('#user-input').hide();

    // Hide the exit button
    leaderDoc.find('#exit-button').hide();

    // Fill the table
    updateLeaderTable(leaderDoc, playerInfo);    

    // Close modal when exit button is pushed
    leaderDoc.find('#exit-button').on('click', () => {
      modal.remove();
    });
  });

  // Add the iframe to scorer
  $('body').append(modal);
}
