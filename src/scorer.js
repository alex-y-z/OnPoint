const leftPanel = $('#left-panel');
const dartboard = $('#board-box');
const regions = $('g.board-region > path, circle.board-region');
const throwPanel = $('#throw-panel');
const throwOptions = $('.throw-dropdown-content > option');
const comboLabels = $('.winning-throw-label');
const scoreboard = $('#scoreboard');
const stats = $('#statistics');

const CONFIRMATION = {
  BUST: 1,
  LEG_WIN: 2,
  NEXT_TURN: 3,
  NEW_GAME: 4,
  LEADER_BOARD: 5
}

const scorer = {
  game: null,
  match: null,
  leg: null,
  players: [],
  scores: [0, 0],
  legWins: [0, 0],
  setWins: [0, 0],
  throws: [],
  perfectLeg: null,
  startScore: null,
  currentTurn: 0,
  currentThrow: 0,
  currentPlayer: 1,
  changingThrow: null
}


// This function only runs when the file is first loaded
function init() {

  // Resize the spectator view to match the scorer view
  const resizeObserver = new ResizeObserver(() => {
    window.replication.resizeBoard(leftPanel.css('width'));
  });
  resizeObserver.observe(leftPanel.get(0));

  // Display the new game modal on startup
  showNewGameModal();
}

$(init());


// This function runs at the beginning of each game
async function startGame(pid1, pid2, offName, loc, date, startScore, legNum, setNum) {

  // Initialize game and players
  scorer.game = await window.database.createGame('Championship', pid1, pid2, offName, loc, date, legNum, setNum, startScore);
  scorer.players[0] = await window.database.getPlayerByID(pid1);
  scorer.players[1] = await window.database.getPlayerByID(pid2);
  window.database.setPlayer1(pid1);
  window.database.setPlayer2(pid2);

  // Initialize perfect leg for given start score
  scorer.startScore = parseInt(startScore);
  scorer.perfectLeg = await window.replication.getPerfectLeg(startScore);

  // Initialize scores
  scorer.scores[0] = scorer.startScore;
  scorer.scores[1] = scorer.startScore;

  // Set up scoreboard
  const name1 = `${scorer.players[0].first_name} ${scorer.players[0].last_name}`;
  const name2 = `${scorer.players[1].first_name} ${scorer.players[1].last_name}`;
  setUpScoreboard(name1, name2, offName, loc, date, startScore, legNum, setNum);
  window.replication.getFormInfo(name1, name2, offName, loc, date, startScore, legNum, setNum);

  // Set up stat board
  stats.find('#p1Name').contents()[0].nodeValue = name1 + " Statistics";
  stats.find('#p2Name').contents()[0].nodeValue = name2 + " Statistics";

  // Register listeners
  regions.on('click', addDart);
  regions.on('mouseenter', previewDart);
  regions.on('mouseleave', hideDartPreview);
  throwOptions.on('click', setThrow);
  stats.find('.dropdown-content>option').on('click', showStatistic);

  $('#next-turn-button').on('click', () => {
    showConfirmation(CONFIRMATION.NEXT_TURN);
  });

  $('#new-game-button').on('click', (event) => {
    showConfirmation(CONFIRMATION.NEW_GAME);
  });

  $('#leaderboard-button').on('click', (event) => {
    showConfirmation(CONFIRMATION.LEADER_BOARD);
  });

  // Start first match of the game
  startMatch();
}


// This function runs at the beginning of each match
async function startMatch(isWin) {

  // Handle match win
  if (isWin) {
    const winner = scorer.players[scorer.currentPlayer - 1];
    window.database.setMatchWinner(winner.pid);
    scorer.setWins[scorer.currentPlayer - 1]++;

    // Check if game has been won
    const setWins = scorer.setWins[scorer.currentPlayer - 1];
    if (setWins == scorer.game.match_num) {
      window.database.setGameWinner(winner.pid);
      loadWinner(`${winner.first_name} ${winner.last_name}`); //loadWinner(playerName, match, leg, throws)
      return;
    }

    // Update scoreboard
    $(`#p${scorer.currentPlayer}SetsWon`).text(setWins);
  }

  // Create a new match within the current game
  scorer.match = await window.database.createMatch(scorer.game);

  // Start first leg of the match
  startLeg();
}


// This function runs at the beginning of each leg
async function startLeg(isWin) {

  // Handle leg win
  if (isWin) {
    scorer.legWins[scorer.currentPlayer - 1]++;

    // Check for 100+ checkout
    const winner = scorer.players[scorer.currentPlayer - 1];
    if (getTurnScore() >= 100) {
      winner.num_checkouts_100++;
    }

    // Send leg results to database
    updateGameStatus();
    window.database.updateGameStatus(scorer.players[0], scorer.players[1], scorer.leg);
    
    // Update scoreboard
    const legWins = scorer.legWins[scorer.currentPlayer - 1];
    $(`#p${scorer.currentPlayer}LegsWon`).text(legWins);
    scoreboard.find('#p1Score').text(scorer.startScore);
    scoreboard.find('#p2Score').text(scorer.startScore);
    
    // Reset scoreboard
    scorer.scores[0] = scorer.startScore;
    scorer.scores[1] = scorer.startScore;
    scorer.currentTurn = 0;
    $('.perfect-label').removeClass('max-perfect-label min-perfect-label');
    clearBoard();

    const isMatchWin = (legWins % scorer.game.leg_num == 0);
    let setWins = scorer.setWins[scorer.currentPlayer - 1];
    setWins = isMatchWin ? (setWins + 1) : setWins;
    window.replication.setLegWinner(scorer.currentPlayer, scorer.startScore, legWins, setWins);
    
    // Check if match has been won
    if (isMatchWin) {
      startMatch(true);
      return;
    }

    // TODO: alternate who goes first
  }

  // Create a new leg within the current match
  scorer.leg = await window.database.createLeg(scorer.match);
}


// Check for winning combos
async function checkCombos() {

  // Hide the label from the previous turn
  const remaining_throws = 3 - scorer.throws.length;
  if (remaining_throws < 3) {
    $(`#throw-label-${scorer.currentThrow - 1} > .winning-throw-label`).slideUp('fast');
    window.replication.changeCombo(scorer.currentThrow - 1);
    if (remaining_throws == 0) {
      return;
    }
  }
  
  // Calculate tentative score
  let score = scorer.scores[scorer.currentPlayer - 1];
  for (const region of scorer.throws) {
    if (typeof region === 'object') {
      score -= parseInt(region.attr('data-value'));
    }
  }
  
  if (score > 170) {
    return; // Cannot be won in 3 throws
  }
  
  const moves = await window.replication.getWinningMoves(score, remaining_throws);
  
  // No valid combos remaining
  if (moves.length == 0) {
    comboLabels.slideUp('fast');
    window.replication.changeCombo();
    return;
  }
  
  // Set and show labels
  for (const [index, value] of moves.entries()) {
    const label = $(`#throw-label-${index + scorer.currentThrow} > .winning-throw-label`);
    label.text(value);
    label.slideDown('slow');
    window.replication.changeCombo(index + scorer.currentThrow, value);
  }
}


// Check if player has a perfect leg
function checkPerfectLeg(isTurnOver, isBust) {
  const scoreThresholds = scorer.perfectLeg.scoreThresholds;
  const throwThreshold = scorer.perfectLeg.throws;
  const perfectLabel = $(`#perfect-label-${scorer.currentPlayer}`);

  // Check if bust or turn count exceeds max
  if (isBust || scorer.currentTurn > scoreThresholds.length) {
    window.replication.changePerfectLeg(scorer.currentPlayer, false);
    perfectLabel.removeClass('min-perfect-label');
    return;
  }

  // Compare scores after each turn
  if (isTurnOver) {
    if (scorer.scores[scorer.currentPlayer - 1] <= scoreThresholds[scorer.currentTurn]) {
      window.replication.changePerfectLeg(scorer.currentPlayer, true);
      perfectLabel.addClass('min-perfect-label');
    }
    else {
      window.replication.changePerfectLeg(scorer.currentPlayer, false);
      perfectLabel.removeClass('max-perfect-label min-perfect-label');
    }
    return;
  }

  // Compare number of throws after each throw
  const totalThrows = ((scorer.currentTurn - 1) * 3) + scorer.currentThrow + 1;
  if (totalThrows > throwThreshold) {
    window.replication.changePerfectLeg(scorer.currentPlayer, false);
    perfectLabel.removeClass('max-perfect-label min-perfect-label');
  }
}


// Display value of hovered region
function previewDart(event) {
  const index = (scorer.changingThrow !== null) ? scorer.changingThrow : scorer.currentThrow;
  if (index > 2) {
    return;
  }
  const region = $(event.target);
  const throwLabel = $(`#throw-label-${index} > button`);
  throwLabel.text(region.attr('name'));
}


// Hide value preview
function hideDartPreview(event) {
  const index = (scorer.changingThrow !== null) ? scorer.changingThrow : scorer.currentThrow;
  if (index > 2) {
    return;
  }
  const throwLabel = $(`#throw-label-${index}`);
  throwLabel.find('button').text('');
}


// Mark the board and record a throw
function addDart(event) {
  if (scorer.throws.length == 3) {
    return;
  }

  // Determine throw index
  let index;
  if (scorer.changingThrow !== null) { // Change a previous throw
    $(`#throw-label-${scorer.changingThrow} > button`).removeClass('changing-throw');
    index = scorer.changingThrow;
    scorer.changingThrow = null;
  }
  else { // Set the current throw
    index = scorer.currentThrow;
    scorer.currentThrow++;
  }

  // Highlight region
  const region = $(event.target);
  const regionId = region.attr('id');
  region.addClass('selected-region');
  region.attr('data-darts', (_, value) => (value === undefined) && 1 || parseInt(value) + 1);
  scorer.throws.splice(index, 0, region);

  // Update existing marker or add new one
  var markerPosX = 0, markerPosY = 0;
  if (region.attr('data-darts') > 1) {
    const marker = $(`#marker-${regionId}`);
    marker.find('tspan').text(region.attr('data-darts'));
  }
  // Place relative to the dartboard to maintain position upon resize
  else {
    const marker = $('#temp-marker').clone().attr('id', `marker-${regionId}`);
    markerPosX = `${((event.pageX - dartboard.offset().left) / dartboard.width()) * 100}%`;
    markerPosY = `${((event.pageY - dartboard.offset().top) / dartboard.height()) * 100}%`;
    marker.css('top', markerPosY);
    marker.css('left', markerPosX);
    marker.addClass('dart-marker');
    dartboard.append(marker);
  }
  
  // Update throw label
  const throwLabel = $(`#throw-label-${index} > button`);
  throwLabel.text(region.attr('name'));

  // Replicate the result to the spectator
  window.replication.addDart(index, regionId, markerPosX, markerPosY);

  // Update indicators
  checkCombos();
  checkPerfectLeg(false);
  checkThrow();
}


// Unmark the board and flush records for a particular throw
function removeDart(index) {
  const region = scorer.throws[index];
  
  if (typeof region === 'object') { // Decrement dart attribute
    region.attr('data-darts', (_, value) => parseInt(value) - 1);
    
    const marker = $(`#marker-${region.attr('id')}`);
    const dartsLeft = region.attr('data-darts');
    window.replication.removeDart(index, region.attr('id'), dartsLeft);
    
    if (dartsLeft == 0) { // Remove marker/highlight
      marker.remove();
      region.removeClass('selected-region');
    }
    else { // Decrement label
      marker.find('tspan').text(dartsLeft);
    }
  }
}


// Explicitly set a throw value
function setThrow(event) {
  const option = $(event.target);
  const dropdown = option.parent().parent();
  const button = dropdown.find('button');
  const index = parseInt(dropdown.attr('data-slot'));

  if (scorer.changingThrow !== null) {
    return; // Already changing a throw
  }

  // Change an existing dart
  if (option.text() == 'CHANGE') {
    if (scorer.throws[index] === undefined) {
      return; // No throw to change
    }

    hideConfirmation();
    removeDart(index);
    button.text('');
    button.addClass('changing-throw');
    scorer.throws.splice(index, 1);
    scorer.changingThrow = index;
    return; // The next board input will count for this throw
  }

  // Miss, bounce, or foul
  if (scorer.changingThrow) {
    hideConfirmation();
    checkThrow();
    button.removeClass('changing-throw');
    scorer.changingThrow = null;
  }

  if (index <= scorer.currentThrow) {
    removeDart(index);
    button.text(option.text());
    scorer.throws[index] = option.text();
    window.replication.changeDart(index, option.text());

    // This counts for the current throw
    if (index == scorer.currentThrow) {
      scorer.currentThrow++;
    }
    
    // Update indicators
    checkCombos();
    checkPerfectLeg(false);
  }
}


// Sum of all current throws
function getTurnScore() {
  let turnScore = 0;
  for (const region of scorer.throws) {
    if (typeof region === 'object') {
      turnScore += parseInt(region.attr('data-value'));
    }
  }
  return turnScore;
}


// Update score and set player data
function updateGameStatus(isBust) {
  const player = scorer.players[scorer.currentPlayer - 1];
  const leg = scorer.leg;
  
  player.number_thrown += scorer.throws.length;

  // The turn score is nullified if bust
  if (isBust) {
    leg[`player_${scorer.currentPlayer}_darts`].push(['M/B', 'M/B', 'M/B']);
  }
  // Calculate turn score and update stats
  else {
    const turnScore = getTurnScore();
    scorer.scores[scorer.currentPlayer - 1] -= turnScore;
    $(`#p${scorer.currentPlayer}Score`).text(scorer.scores[scorer.currentPlayer - 1]);

    for (const region of scorer.throws) {
      if (typeof region === 'object' && region.attr('name').includes('D')) {
        player.num_doubles++;
      }
    }

    player.total_thrown += turnScore;
    if (turnScore == 180) {
      player.num_180s++;
    }
    
    leg[`player_${scorer.currentPlayer}_darts`].push(new Array(3));
    leg[`player_${scorer.currentPlayer}_darts`][scorer.currentTurn] = scorer.throws.map((region) => (typeof region === 'object') ? region.attr('name') : 'M/B');
    leg[`player_${scorer.currentPlayer}_score`] -= turnScore;
  }
}


// Check win/bust conditions after each throw
function checkThrow() {
  const turnScore = getTurnScore();
  const totalScore = scorer.scores[scorer.currentPlayer - 1] - turnScore;
  const lastThrow = scorer.throws[scorer.currentThrow - 1].attr('name');

  // Leg won if score reaches 0 on a double/bullseye
  if (totalScore == 0 && (lastThrow.includes('D') || lastThrow == 'B50')) {
    showConfirmation(CONFIRMATION.LEG_WIN);
  }
  // Aside from the win conditions above, scores <= 1 are considered bust
  else if (totalScore <= 1) {
    showConfirmation(CONFIRMATION.BUST);
  }
}


// Update scores and reset
function nextTurn(event, isBust) {
  updateGameStatus(isBust);
  checkPerfectLeg(true, isBust);
  
  // Reset for next turn
  window.replication.nextTurn(scorer.currentPlayer, scorer.scores[scorer.currentPlayer - 1]);
  scorer.currentPlayer = (scorer.currentPlayer % 2) + 1;

  // Update game status each full turn
  if (scorer.currentPlayer == 1) {
    scorer.currentTurn++;
    window.database.updateGameStatus(scorer.players[0], scorer.players[1], scorer.leg);
  }
  
  clearBoard();
  checkCombos(); // Check winning moves for next player
  changeColor(); // Change background color to indicate current player
}


// Change player emphasis on turn
function changeColor() {
  var table = document.getElementById("scoreboard");   
  var rows = table.getElementsByTagName("tr");   
  
  // Check p1
  if (document.getElementById("p1").style.color == "white") {
    // Change background colors
    rows[2].style.backgroundColor = "#FFC60B";
    rows[4].style.backgroundColor = "#323232"; 
    // Change p1
    document.getElementById("p1").style.color = "black";
    document.getElementById("p1").style.fontWeight = 'bold';
    // Change p2
    document.getElementById("p2").style.color = "white";
    document.getElementById("p2").style.fontWeight = 'normal';
  }
  else {
    // Change background colors
    rows[4].style.backgroundColor = "#FFC60B";
    rows[2].style.backgroundColor = "#323232"; 
    // Change p2
    document.getElementById("p2").style.color = "black";
    document.getElementById("p2").style.fontWeight = 'bold';
    // Change p1
    document.getElementById("p1").style.color = "white";
    document.getElementById("p1").style.fontWeight = 'normal';
  }
}

// Clear markers and throw labels
function clearBoard() {
  dartboard.find('.selected-region').removeAttr('data-darts');
  dartboard.find('.selected-region').removeClass('selected-region');
  dartboard.find('.dart-marker').remove();
  throwPanel.find('.throw-dropdown-button').text('');
  comboLabels.slideUp('fast');

  // Reset throw array and index
  scorer.throws = [];
  scorer.currentThrow = 0;
}


// Reset both renderers
function newGame() {
  window.replication.resetScreen();
  location.reload();
}


// Display confirmation to finalize an irreversible action
function showConfirmation(confirmType) {
  const confirmPanel = $('#confirm-panel');
  const message = $('#notice-text');
  let callback = null;

  // Disconnect standing click events
  hideConfirmation();

  // Set message according to enumerated type
  switch (confirmType) {
    case CONFIRMATION.BUST:
      message.text('Bust condition met for current player.');
      callback = function() { nextTurn(null, true); };
      break;
    case CONFIRMATION.LEG_WIN:
      message.text('Win condition met for current player.');
      callback = function() { startLeg(true); };
      break;
    case CONFIRMATION.NEXT_TURN:
      if (scorer.throws.length < 3 || scorer.changingThrow !== null) {
        return;
      }
      message.text('Proceed to next turn?');
      callback = nextTurn;
      break;
    case CONFIRMATION.NEW_GAME:
      message.text('Exit current game and proceed to new game setup?');
      callback = newGame;
      break;
    case CONFIRMATION.LEADER_BOARD:
      message.text('Proceed to leader board?');
      callback = loadLeaderBoard();
      break;
  }

  if (!callback) {
    return;
  }

  // Show confirmation and register click events
  confirmPanel.animate({ bottom: 0 }, 300, () => {
    confirmPanel.find('#confirm-button').on('click', function() {
      $('#confirm-button').off('click');
      $('#cancel-button').off('click');
      confirmPanel.animate({ bottom: '-100%' }, 'fast');
      callback();
    });

    confirmPanel.find('#cancel-button').on('click', function() {
      hideConfirmation();
    });
  });
}


// Cancel standing confirmation
function hideConfirmation() {
  const confirmPanel = $('#confirm-panel');
  $('#confirm-button').off('click');
  $('#cancel-button').off('click');
  confirmPanel.animate({ bottom: '-100%' }, 'fast');
}


// Display new game modal
function showNewGameModal() {

  // Get players from database to pass to new game page player table
  const modal = $('<iframe id="new-game-modal" src="newGame.html"></iframe>');
  
  modal.on('load', () => {
    const newGameDoc = modal.contents();
    const gameForm = newGameDoc.find('#game-form');
    const selectedPlayers = [];

    // Pull all player names from the database
    const players = []
    window.database.requestPlayers().then((pdata) => {
      pdata.forEach((p) => {
        players.push(p)
      });
      
      // Fill the player table with all player names
      updateDropdown(players, newGameDoc);
    });
    
    // Add listener to player selection dropdowns
    function selectPlayer(event, playerNum) {
      const option = $(event.target);
      option.selected = true;

      // Check if addPlayer
      if (option.text() == "Add New Player") {
        showNewPlayerModal(newGameDoc);
        return;
      }

      // Change the button text and record selected PID
      option.parent().parent().find('.dropbtn').text(option.text());
      selectedPlayers[playerNum] = option.val();
    }

    gameForm.on('click', '.dropdown-content1>option', (event) => {
      selectPlayer(event, 0)
    });

    // Add listener to new game dropdowns
    gameForm.on('click', '.dropdown-content2>option', (event) => {
      selectPlayer(event, 1)
    });
    
    gameForm.on('submit', () => {
      const formData = new FormData(gameForm.get(0), gameForm.find('#submit-button').get(0));

      // Initialize any states and register listeners
      startGame(...selectedPlayers, ...formData.values());

      modal.remove();
    });

    // TEMPORARY QUICK START
    gameForm.find('#quick-start-button').on('click', (event) => {
      selectedPlayers[0] = 1;
      selectedPlayers[1] = 2;
      gameForm.find('#official').val('Crazy Horse');
      gameForm.find('#location').val('Mariana Trench');
      gameForm.find('#date').val('1984-12-12');
      gameForm.find('#301').prop('checked', true);
      gameForm.find('#numOfLegs').val(3);
      gameForm.find('#numOfSets').val(2);
    });
  });
  
  $('body').append(modal);
}


// Display new player modal
function showNewPlayerModal(newGameDoc) {
  const modal2 = $('<iframe id="new-player-modal" src="newPlayer.html"></iframe>');

  modal2.on('load', () => {
    const newPlayerDoc = modal2.contents();
    const playerForm = newPlayerDoc.find('#player-form');

    // When submit is pushed:
    playerForm.on('submit', () => {
      const playerFormData = new FormData(playerForm.get(0), playerForm.find('#submit-button').get(0));

      // Get the new player name
      const first = playerFormData.get('firstName');
      const last = playerFormData.get('lastName');  
      const country = playerFormData.get('country');
      
      // Add the player to the database
      window.database.createPlayer(first, last, country).then((newID) => {

        // Access the dropdowns
        const menu1 = newGameDoc.find('#dropdown.dropdown-content1').get(0);
        const menu2 = newGameDoc.find('#dropdown.dropdown-content2').get(0); 
  
        // Add the player to the dropdown
        const optionText = `${first} ${last} #${newID}`
        menu1.append(new Option(optionText, newID));
        menu2.append(new Option(optionText, newID));
      });
      
      // Close the iframe
      modal2.remove();
    });
  
    newPlayerDoc.find('#cancel-button').on('click', () => {
      modal2.remove();
    });
  });

  newGameDoc.find('body').append(modal2);
}


// Update dropdown options
function updateDropdown(players, newGameDoc) {
  const menu1 = newGameDoc.find('#dropdown.dropdown-content1').get(0);
  const menu2 = newGameDoc.find('#dropdown.dropdown-content2').get(0);

  // Go through all players in the list
  for (i in players) {
    const player = players[i];
    const optionText = player.first_name + " " + player.last_name + " #" + player.pid;
    menu1.append(new Option(optionText, player.pid));
    menu2.append(new Option(optionText, player.pid));
  }
}


// Populate scorer scoreboard with new game info
function setUpScoreboard(name1, name2, offName, loc, date, score, legNum, setNum) {

  // Populate scoreboard
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

  // Initialize emphasis color
  var table = document.getElementById("scoreboard");
  var rows = table.getElementsByTagName("tr");
  rows[2].style.backgroundColor = "#FFC60B";
  document.getElementById("p1").style.color = "black";
  document.getElementById("p1").style.fontWeight = 'bold';

};


// Display a given statistic
function showStatistic(event) {
  const option = $(event.target);

  window.replication.statSelect(option.parent().attr('name'), option.attr('value'));
}


// Load winner page
function loadWinner(playerName, match, leg, throws) {
  // IPC to spectator view
  window.replication.showWinner(playerName, match, leg, throws);

  const modal = $('<iframe id="winner-modal" src="winner.html"></iframe>');
  
  modal.on('load', () => {
    const winnerDoc = modal.contents();

    winnerDoc.find('#name').text(playerName);
    winnerDoc.find('#numMatch').text("Match Wins: " + match);
    winnerDoc.find('#numLegs').text("Leg Wins: " + leg);
    winnerDoc.find('#lastThrow').text("Final Throws: " + throws[0] + " " + throws[1] + " " + throws[2]);

    // Close modal when exit button is pushed
    winnerDoc.find('#exit-button').on('click', () => {
      modal.remove();
    });
  });

  // Add the iframe to scorer
  $('body').append(modal);
}


// Fill in the table of players
function updateLeaderTable(playerInfo, leaderDoc) {

  // Find the table
  const table = leaderDoc.find('#leader-table').get(0);

  /*
        1. First Name
        2. Last Name
        3. Number of Wins
        4. Number of Losses
        5. Total Number of Games
  */ 

  // Loop through each player object to add them to the table
  for (i in playerInfo) {
    // Add a row to the end of the table
    let row = table.insertRow(-1);

    // Add a Cell for the first name and add its text
    let firstCell= row.insertCell(0);
    let firstName = document.createTextNode(playerInfo[i].first_name);
    firstCell.appendChild(firstName);

    // Add a cell for the last name and add its text
    let lastCell = row.insertCell(1);
    let lastName = document.createTextNode(playerInfo[i].last_name);
    lastCell.appendChild(lastName);

    // Add a cell for the number of wins and add its text
    let winCell = row.insertCell(2);
    let wins = document.createTextNode(playerInfo[i].num_wins);
    winCell.appendChild(wins);

    // Add a cell for the number of losses and add its text
    let loseCell = row.insertCell(2);
    let lose = document.createTextNode(playerInfo[i].num_loss);
    loseCell.appendChild(lose);

    // Add a cell for the number of games and add its text
    let gamesCell = row.insertCell(2);
    let games = document.createTextNode(playerInfo[i].num_games);
    gamesCell.appendChild(games);

  }
};


// Load Leader Board
function loadLeaderBoard() {
  // Add the iframe
  const modal = $('<iframe id="leaderboard-modal" src="leaderboard.html"></iframe>');

  // Load the iframe
  modal.on('load', () => {
    const leaderDoc = modal.contents();
    const dateForm = leaderDoc.find('#date-form');

    // Show the user input div - Hide the leaderboard div
    leaderDoc.find('#user-input').show();
    leaderDoc.find('#display').hide();

    // When submit is pushed:
    dateForm.on('submit', () => {
      const dateFormData = new FormData(dateForm.get(0), dateForm.find('#submit-button').get(0));

      // Get the new player name
      const begin = dateFormData.get('begin_date');
      const end = dateFormData.get('end_date');  

      // Send the dates to the database and retrieve information in the timeframe
      /*
        1. First Name
        2. Last Name
        3. Number of Wins
        4. Number of Losses
        5. Total Number of Games 
      */
      

      // Fill the leader board table with all the information
      updateLeaderTable(playerInfo, leaderDoc);

      // Hide the user input div - Show the leaderboard div
      leaderDoc.find('#user-input').hide();
      leaderDoc.find('#display').show();

      // IPC to spectator view
      window.replication.showLeader();
    });

    // Close modal when exit button is pushed
    leaderDoc.find('#exit-button').on('click', () => {
      window.replication.closeLeader();
      modal.remove();
    });
  });

  // Add the iframe to scorer
  $('body').append(modal);

};
