const leftPanel = $('#left-panel');
const dartboard = $('#board-box');
const regions = $('g.board-region > path, circle.board-region');
const throwPanel = $('#throw-panel');
const throwOptions = $('.throw-dropdown-content > option');
const comboLabels = $('.winning-throw-label');
const scoreboard = $('#scoreboard');
const stats = $('#statistics');

const scorer = {
  game: null,
  match: null,
  leg: null,
  players: [],
  scores: [0, 0],
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
  console.log('PLAYERS', scorer.players, '\nGAME', scorer.game);

  // Initialize perfect leg for given start score
  scorer.startScore = parseInt(startScore);
  scorer.perfectLeg = await window.replication.getPerfectLeg(startScore);

  // Set up scoreboard
  const name1 = `${scorer.players[0].first_name} ${scorer.players[0].last_name}`;
  const name2 = `${scorer.players[1].first_name} ${scorer.players[1].last_name}`;
  setUpScoreboard(name1, name2, offName, loc, date, startScore, legNum, setNum);
  window.replication.getFormInfo(name1, name2, offName, loc, date, startScore, legNum, setNum);

  // Register listeners
  regions.on('click', addDart);
  regions.on('mouseenter', previewDart);
  regions.on('mouseleave', hideDartPreview);
  throwOptions.on('click', setThrow);
  stats.find('.dropdown-content>option').on('click', showStatistic);
  $('#next-turn-button').on('click', nextTurn);

  // TODO: turn this into a confirmation
  $('#new-game-button').on('click', (event) => {
    window.replication.resetScreen();
    location.reload();
  });

  // Start first match of the game
  startMatch();
}


// This function runs at the beginning of each match
async function startMatch() {

  // Create a new match within the current game
  scorer.match = await window.database.createMatch(scorer.game);

  // Start first leg of the match
  console.log('MATCH', scorer.match);
  startLeg();
}


// This function runs at the beginning of each leg
async function startLeg() {

  // Create a new leg within the current match
  scorer.leg = await window.database.createLeg(scorer.match);

  // Reset scores
  scorer.scores[0] = scorer.startScore;
  scorer.scores[1] = scorer.startScore;
  console.log('LEG', scorer.leg);
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
function checkPerfectLeg(isTurnOver) {
  const scoreThresholds = scorer.perfectLeg.scoreThresholds;
  const throwThreshold = scorer.perfectLeg.throws;
  const perfectLabel = $(`#perfect-label-${scorer.currentPlayer}`);

  // Check if turn count exceeds max
  if (scorer.currentTurn > scoreThresholds.length) {
    window.replication.changePerfectLeg(scorer.currentPlayer, false);
    perfectLabel.removeClass('max-perfect-label min-perfect-label');
    return;
  }

  // Compare scores after each turn
  if (isTurnOver) {
    if (scorer.scores[scorer.currentPlayer - 1] <= scoreThresholds[scorer.currentTurn]) {
      window.replication.changePerfectLeg(scorer.currentPlayer, true);
      perfectLabel.addClass('max-perfect-label min-perfect-label');
      setTimeout(() => { perfectLabel.removeClass('max-perfect-label'); }, 3000); // Minimize after a few seconds
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
  const throwLabel = $(`#throw-label-${index}`);
  throwLabel.find('button').text(region.attr('name'));
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
    $(`#throw-label-${scorer.changingThrow}`).find('button').removeClass('changing-throw');
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

  // Update indicators
  checkCombos();
  checkPerfectLeg(false);

  // Update existing marker or add new one
  var markerPosX = 0, markerPosY = 0;
  if (region.attr('data-darts') > 1) {
    const marker = $(`#marker-${regionId}`);
    marker.find('tspan').text(region.attr('data-darts'));
  }
  else {
    // Place relative to the dartboard to maintain position upon resize
    const marker = $('#temp-marker').clone().attr('id', `marker-${regionId}`);
    markerPosX = `${((event.pageX - dartboard.offset().left) / dartboard.width()) * 100}%`;
    markerPosY = `${((event.pageY - dartboard.offset().top) / dartboard.height()) * 100}%`;
    marker.css('top', markerPosY);
    marker.css('left', markerPosX);
    marker.addClass('dart-marker');
    dartboard.append(marker);
  }
  
  // Update throw label
  const throwLabel = $(`#throw-label-${index}`);
  throwLabel.find('button').text(region.attr('name'));

  // Replicate the result to the spectator
  window.replication.addDart(index, regionId, markerPosX, markerPosY);
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

    removeDart(index);
    button.text('');
    button.addClass('changing-throw');
    scorer.throws.splice(index, 1);
    scorer.changingThrow = index;
    return; // The next board input will count for this throw
  }

  // Miss, bounce, or foul
  if (scorer.changingThrow) {
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


// Update scores and reset
function nextTurn(event) {

  // Check if all throws have been recorded
  if (scorer.throws.length < 3 || scorer.changingThrow !== null) {
    return;
  }
  
  // Calculate turn score
  let turnScore = 0;
  for (const region of scorer.throws) {
    if (typeof region === 'object') {
      turnScore += parseInt(region.attr('data-value'));
    }
  }
  scorer.scores[scorer.currentPlayer - 1] -= turnScore;
  $(`#p${scorer.currentPlayer}Score`).text(scorer.scores[scorer.currentPlayer - 1]);
  checkPerfectLeg(true);

  // Update relevant data
  const player = scorer.players[scorer.currentPlayer - 1];
  player.total_thrown += turnScore;
  player.number_thrown += 3;
  if (turnScore == 180) {
    player.num_180s += 1;
  }
  console.log('UPDATING PLAYER', player);

  const leg = scorer.leg;
  leg[`player_${scorer.currentPlayer}_darts`].push(scorer.throws.map((region) => (typeof region === 'object') ? region.attr('name') : 'S0'));
  leg[`player_${scorer.currentPlayer}_score`] -= turnScore;
  console.log('UPDATING LEG', leg);

  console.log('UPDATING GAME STATUS');
  window.database.updateGameStatus(scorer.players[0], scorer.players[1], scorer.leg, scorer.match, scorer.game);
  
  // Reset for next turn
  scorer.throws = [];
  scorer.currentThrow = 0;
  window.replication.nextTurn(scorer.currentPlayer, scorer.scores[scorer.currentPlayer - 1]);
  scorer.currentPlayer = (scorer.currentPlayer % 2) + 1;

  if (scorer.currentPlayer == 1) {
    scorer.currentTurn += 1;
  }
  
  // Clear board
  dartboard.find('.selected-region').removeAttr('data-darts');
  dartboard.find('.selected-region').removeClass('selected-region');
  dartboard.find('.dart-marker').remove();
  throwPanel.find('.throw-dropdown-button').text('');
  comboLabels.slideUp('fast');
  
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
    rows[1].style.backgroundColor = "#FFC60B";
    rows[2].style.backgroundColor = "#343434"; 
    // Change p1
    document.getElementById("p1").style.color = "black";
    document.getElementById("p1SetsWon").style.color = "black";
    document.getElementById("p1LegsWon").style.color = "black";
    document.getElementById("p1Score").style.color = "black";
    document.getElementById("p1").style.fontWeight = 'bold';
    // Change p2
    document.getElementById("p2").style.color = "white";
    document.getElementById("p2SetsWon").style.color = "white";
    document.getElementById("p2LegsWon").style.color = "white";
    document.getElementById("p2Score").style.color = "white";
    
  }
  else {
    // Change background colors
    rows[2].style.backgroundColor = "#FFC60B";
    rows[1].style.backgroundColor = "#343434"; 
    // Change p2
    document.getElementById("p2").style.color = "black";
    document.getElementById("p2SetsWon").style.color = "black";
    document.getElementById("p2LegsWon").style.color = "black";
    document.getElementById("p2Score").style.color = "black";
    document.getElementById("p2").style.fontWeight = 'bold';
    // Change p1
    document.getElementById("p1").style.color = "white";
    document.getElementById("p1SetsWon").style.color = "white";
    document.getElementById("p1LegsWon").style.color = "white";
    document.getElementById("p1Score").style.color = "white";
  }
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
      scorer.playerNames[0] = 'Wyatt Earp';
      scorer.playerNames[1] = 'Doc Holliday';
      gameForm.find('#official').val('Crazy Horse');
      gameForm.find('#location').val('Mariana Trench');
      gameForm.find('#date').val('1984-12-12');
      gameForm.find('#301').prop('checked', true);
      gameForm.find('#numOfLegs').val(12);
      gameForm.find('#numOfSets').val(3);
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
      
      // Add the player to the database
      window.database.createPlayer(first, last).then((newID) => {

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
  rows[1].style.backgroundColor = "#FFC60B";
  document.getElementById("p1").style.color = "black";
  document.getElementById("p1SetsWon").style.color = "black";
  document.getElementById("p1LegsWon").style.color = "black";
  document.getElementById("p1Score").style.color = "black";
  document.getElementById("p1").style.fontWeight = 'bold';

  // Send to the database
  // window.database.function(scorer.playerNames[0], scorer.playerNames[1], offName, loc, date, score, legNum, setNum);
};


// Display a given statistic
function showStatistic(event) {
  const option = $(event.target);

  // Get player from database and send it as the last parameter


  window.replication.statSelect(option.parent().attr('name'), option.attr('value')/*, player*/);
}


// Load winner page
function loadWinner(playerName) {
  window.replication.showWinner(playerName);

  const modal = $('<iframe id="winner-modal" src="winner.html"></iframe>');
  
  modal.on('load', () => {
    const winnerDoc = modal.contents();

    winnerDoc.find('#name').text(playerName);

    // Close modal when exit button is pushed
    winnerDoc.find('#exit-button').on('click', () => {
      modal.remove();
    });
  });

  $('body').append(modal);
}
