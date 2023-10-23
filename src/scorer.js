const leftPanel = $('#left-panel');
const dartboard = $('#board-box');
const regions = $('g.board-region > path, circle.board-region');
const throwPanel = $('#throw-panel');
const throwOptions = $('.throw-dropdown-content > option');
const comboLabels = $('.winning-throw-label');
const scoreboard = $('#scoreboard');
const stats = $('#statistics');

const scores = [0, 0];
var throws = [];
var currentThrow = 0;
var currentPlayer = 1;
var changingThrow = null;

/*
// Behold the creation of Bob Jones
async function test_db() {
  window.database.createPlayer('Bob', 'Jones');
  const players = await window.database.requestPlayers();
  console.log('PLAYERS:', players);
}
test_db()
*/

// Remove dart
function removeDart(index) {
  const region = throws[index];
  
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
  const remaining_throws = 3 - throws.length;
  if (remaining_throws < 3) {
    $(`#throw-label-${currentThrow - 1} > .winning-throw-label`).slideUp('fast');
    window.replication.changeCombo(currentThrow - 1);
    if (remaining_throws == 0) {
      return;
    }
  }
  
  // Calculate tentative score
  let score = scores[currentPlayer - 1];
  for (const region of throws) {
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
    const label = $(`#throw-label-${index + currentThrow} > .winning-throw-label`);
    label.text(value);
    label.slideDown('slow');
    window.replication.changeCombo(index + currentThrow, value);
  }
}

// Attach a click listener to each board region
regions.on('click', (event) => {
  if (throws.length == 3) {
    return;
  }

  // Determine throw index
  let index;
  if (changingThrow !== null) { // Change a previous throw
    $(`#throw-label-${changingThrow}`).find('button').removeClass('changing-throw');
    index = changingThrow;
    changingThrow = null;
  }
  else { // Set the current throw
    index = currentThrow;
    currentThrow++;
  }

  // Highlight region
  const region = $(event.target);
  const regionId = region.attr('id');
  region.addClass('selected-region');
  region.attr('data-darts', (_, value) => (value === undefined) && 1 || parseInt(value) + 1);
  throws.splice(index, 0, region);
  checkCombos()

  // Update existing marker or add new one
  var markerPosX = 0, markerPosY = 0;
  if (region.attr('data-darts') > 1) {
    const marker = $(`#marker-${regionId}`);
    marker.find('tspan').text(region.attr('data-darts'));
  }
  else {
    // Place relatively to maintain position upon resize
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

  if (changingThrow !== null) {
    return; // Already changing a throw
  }

  // Change an existing dart
  if (option.text() == 'CHANGE') {
    if (throws[index] === undefined) {
      return; // No throw to change
    }

    removeDart(index);
    button.text('');
    button.addClass('changing-throw');
    throws.splice(index, 1);
    changingThrow = index;
    return; // The next board input will count for this throw
  }

  // Miss, bounce, or foul
  if (changingThrow) {
    button.removeClass('changing-throw');
    changingThrow = null;
  }

  if (index <= currentThrow) {
    removeDart(index);
    button.text(option.text());
    throws[index] = option.text();
    window.replication.changeDart(index, option.text());

    // This counts for the current throw
    if (index == currentThrow) {
      currentThrow++;
    }
    
    checkCombos(); // Refresh combos
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
  if (throws.length < 3 || changingThrow !== null) {
    return;
  }
  
  // Calculate turn score
  let turnScore = 0;
  for (const region of throws) {
    if (typeof region === 'object') {
      turnScore += parseInt(region.attr('data-value'));
    }
  }
  scores[currentPlayer - 1] -= turnScore;
  $(`#p${currentPlayer}Score`).text(scores[currentPlayer - 1]);
  
  // Reset for next turn
  throws = [];
  currentThrow = 0;
  window.replication.nextTurn(currentPlayer, scores[currentPlayer - 1]);
  currentPlayer = (currentPlayer % 2) + 1;
  
  // Clear board
  dartboard.find('.selected-region').removeAttr('data-darts');
  dartboard.find('.selected-region').removeClass('selected-region');
  dartboard.find('.dart-marker').remove();
  throwPanel.find('.throw-dropdown-button').text('');
  comboLabels.slideUp('fast');
  
  checkCombos();  // Check winning moves for next player
  changeColor();  // Change background color to indicate current player
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
      //updatePlayerTable(players, newGameDoc);
    });
    
    // Open new iframe if user needs to add a new player to the database
    newGameDoc.find('#add-player-button').on('click', (event) => {
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
          window.database.createPlayer(first, last).then((newID) => {
            // Append the name to the player name list for the dropdown selection
            const newPlayer = Object.create(players[0]);
            newPlayer.first_name = first;
            newPlayer.last_name = last;
            newPlayer.player_id = newID;

            players.push(newPlayer);

            // Close the iframe
            modal2.remove();
          });
        });
      
        newPlayerDoc.find('#cancel-button').on('click', () => {
          modal2.remove();
        });
      
      });

      newGameDoc.find('body').append(modal2);
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


// Update dropdown options
function updateDropdown(players, newGameDoc) {
  const menu = newGameDoc.find('#dropdown').get(0);

  // Go through all players in the list
  for (i in players) {
    let optionVal = players[i].player_id;
    let optionText = players[i].first_name + " " + players[i].last_name + " " + players[i].player_id;

    //menu.append($('<option>').val(optionVal).text(optionText));
    menu.append(`<option value="${optionVal}">${optionText}</option>`); 
  }
};



// Fill in the table of players
function updatePlayerTable(players, newGameDoc) {
    // Find the table
  const table = newGameDoc.find('#playerTable').get(0);

  // Loop through each player object to add them to the table
  for (i in players) {
    // Add a row
    let row = table.insertRow(-1);

    // Add a Cell for the first name and add its text
    let firstCell= row.insertCell(0);
    let firstName = document.createTextNode(players[i].first_name);
    firstCell.appendChild(firstName);

    // Add a cell for the last name and add its text
    let lastCell = row.insertCell(1);
    let lastName = document.createTextNode(players[i].last_name);
    lastCell.appendChild(lastName);

    // Add a cell for the player ID and add its text
    let numCell = row.insertCell(2);
    let idNum = document.createTextNode(players[i].player_id);
    numCell.appendChild(idNum);

  }
};


// Populate Scorer Scoreboard with New Game Info
function setUpScoreboard(name1, name2, offName, loc, date, score, legNum, setNum) {
  scoreboard.find('#numOfLegs').text('(' + legNum + ')');
  scoreboard.find('#numOfSets').text('(' + setNum + ')');
  scoreboard.find('#p1').text(name1);
  scoreboard.find('#p2').text(name2);
  scoreboard.find('#p1Score').text(score);
  scoreboard.find('#p2Score').text(score);
  scoreboard.find('#p1SetsWon').text('0');
  scoreboard.find('#p2SetsWon').text('0');
  scoreboard.find('#p1LegsWon').text('0');
  scoreboard.find('#p2LegsWon').text('0');
  scores[0] = parseInt(score);
  scores[1] = parseInt(score);

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
function loadWinner() {
  const modal = $('<iframe id="winner-modal" src="winner.html"></iframe>');
  
  modal.on('load', () => {
    const winnerDoc = modal.contents();

    // Close modal when exit button is pushed
    winnerDoc.find('#exit-button').on('click', () => {
      modal.remove();
    });

  });
};