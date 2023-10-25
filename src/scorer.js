const leftPanel = $('#left-panel');
const dartboard = $('#board-box');
const regions = $('g.board-region > path, circle.board-region');
const throwPanel = $('#throw-panel');
const throwOptions = $('.throw-dropdown-content > option');
const comboLabels = $('.winning-throw-label');
const scoreboard = $('#scoreboard');
const stats = $('#statistics');

var scorer = {
  scores: [0, 0],
  throws: [],
  perfectLeg: null,
  startScore: 301,
  currentThrow: 0,
  currentTurn: 0,
  currentPlayer: 1,
  changingThrow: null
};


// Remove dart
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
    console.log(scorer.scores[scorer.currentPlayer - 1], scoreThresholds[scorer.currentTurn]);
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

// Attach a click listener to each board region
regions.on('click', (event) => {
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
});

// Listen to throw dropdowns to explicitly set a throw value
throwOptions.on('click', (event) => {
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
});

// Resize the spectator view to match the scorer view
const resizeObserver = new ResizeObserver(() => {
  window.replication.resizeBoard(leftPanel.css('width'));
});

resizeObserver.observe(leftPanel.get(0));

// Update scores and reset
$('#next-turn-button').on('click', (event) => {
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
});

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
};

// Display new game modal
$('#new-game-button').on('click', (event) => {
  // Get players from database to pass to new game page player table
  const modal = $('<iframe id="new-game-modal" src="newGame.html"></iframe>');
  
  // For changing player emphasis color
  var table = document.getElementById("scoreboard");   
  var rows = table.getElementsByTagName("tr");  
  
  modal.on('load', () => {
    const newGameDoc = modal.contents();
    const gameForm = newGameDoc.find('#game-form');

    // Pull all player names from the database
    players = []
    window.database.requestPlayers().then((pdata) => {
      pdata.forEach((p) => {
        players.push(p)
      });
      
      // Fill the player table with all player names
      updateDropdown(players, newGameDoc);
    });
    
    // Add listener to new game dropdowns
    gameForm.on('click', '.dropdown-content1>option', (event) => {
      const option = $(event.target);
      option.selected = true;

      // Check if addPlayer
      if (option.text() == "Add New Player") {
        addNewPlayer(newGameDoc);
      }

      // Change the button text
      option.parent().parent().find('.dropbtn').text(option.text());
    });

    // Add listener to new game dropdowns
    gameForm.on('click', '.dropdown-content2>option', (event) => {
      const option = $(event.target);
      option.selected = true;

      // Check if addPlayer
      if (option.text() == "Add New Player") {
        addNewPlayer(newGameDoc);
      }

      // Change Button Text
      option.parent().parent().find('.dropbtn').text(option.text());
    });
    
    gameForm.on('submit', () => {
      const formData = new FormData(gameForm.get(0), gameForm.find('#submit-button').get(0));
      rows[1].style.backgroundColor = "#FFC60B";
      document.getElementById("p1").style.color = "black";
      document.getElementById("p1SetsWon").style.color = "black";
      document.getElementById("p1LegsWon").style.color = "black";
      document.getElementById("p1Score").style.color = "black";
      document.getElementById("p1").style.fontWeight = 'bold';
      setUpScoreboard(...formData.values());
      window.replication.getFormInfo(...formData.values());
      modal.remove();
    });

    newGameDoc.find('#cancel-button').on('click', () => {
      modal.remove();
    });
  });
  
  $('body').append(modal);
});


function addNewPlayer(newGameDoc) {
  const modal2 = $('<iframe id="new-player-modal" src="newPlayer.html"></iframe>');

  modal2.on('load', () => {
    const newPlayerDoc = modal2.contents();
    const playerForm = newPlayerDoc.find('#player-form');

    // When submit is pushed:
    playerForm.on('submit', () => {
      const playerFormData = new FormData(playerForm.get(0), playerForm.find('#submit-button').get(0));

      // Get the new player name
      let first = playerFormData.get('firstName');
      let last = playerFormData.get('lastName');  
      
      // Add the player to the database
      window.database.createPlayer(first, last);//.then((newID));

      // Access the dropdowns
      const menu1 = newGameDoc.find('#dropdown.dropdown-content1').get(0);
      const menu2 = newGameDoc.find('#dropdown.dropdown-content2').get(0); 

      // Add the player to the dropdown
      menu1.append(new Option(first + " " + last));// + " " + newID, newID));
      menu2.append(new Option(first + " " + last));// + " " + newID, newID));
      
      // Close the iframe
      modal2.remove();

    });
  
    newPlayerDoc.find('#cancel-button').on('click', () => {
      modal2.remove();
    });
  
  });

  newGameDoc.find('body').append(modal2);
};


// Update dropdown options
function updateDropdown(players, newGameDoc) {
  const menu1 = newGameDoc.find('#dropdown.dropdown-content1').get(0);
  const menu2 = newGameDoc.find('#dropdown.dropdown-content2').get(0);

  // Go through all players in the list
  for (i in players) {
    let optionVal = players[i].player_id;
    let optionText = players[i].first_name + " " + players[i].last_name + " " + players[i].player_id;

    menu1.append(new Option(optionText, optionVal));
    menu2.append(new Option(optionText, optionVal));
  }
};


// Populate Scorer Scoreboard with New Game Info
function setUpScoreboard(name1, name2, offName, loc, date, score, legNum, setNum) {

  // Initialize perfect leg for given score
  score = 301; // TEST WHILE NEW GAME PAGE IS DOWN
  scorer.startScore = parseInt(score);
  window.replication.getPerfectLeg(scorer.startScore).then((perfectLeg) => {
    scorer.perfectLeg = perfectLeg;
  });

  // Populate scoreboard
  scoreboard.find('#numOfLegs').text('(' + legNum + ')');
  scoreboard.find('#numOfSets').text('(' + setNum + ')');
  scoreboard.find('#p1').contents()[0].nodeValue = name1;
  scoreboard.find('#p2').contents()[0].nodeValue = name2;
  scoreboard.find('#p1Score').text(score);
  scoreboard.find('#p2Score').text(score);
  scoreboard.find('#p1SetsWon').text('0');
  scoreboard.find('#p2SetsWon').text('0');
  scoreboard.find('#p1LegsWon').text('0');
  scoreboard.find('#p2LegsWon').text('0');
  scorer.scores[0] = scorer.startScore;
  scorer.scores[1] = scorer.startScore;

  // Send to the database
  // window.database.function(name1, name2, offName, loc, date, score, legNum, setNum);
};


// Add listener event to statistics table
stats.find('.dropdown-content>option').on('click', (event) => {
  const option = $(event.target);

  // Get player from database and send it as the last parameter


  window.replication.statSelect(option.parent().attr('name'), option.attr('value')/*, player*/);
});


// Load winner page
function loadWinner(playerName) {
  const modal = $('<iframe id="winner-modal" src="winner.html"></iframe>');
  
  modal.on('load', () => {
    const winnerDoc = modal.contents();

    winnerDoc.find('#name').text(playerName);

    // Close modal when exit button is pushed
    winnerDoc.find('#exit-button').on('click', () => {
      modal.remove();
    });

  });
};

