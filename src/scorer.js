const leftPanel = $('#left-panel');
const dartboard = $('#board-box');
const regions = $('g.board-region > path, circle.board-region');
const throwPanel = $('#throw-panel');
const throwOptions = $('.throw-dropdown-content > option');
const scoreboard = $('#scoreboard');
const stats = $('#statistics');

var throws = [];
var currentThrow = 0;
var changingThrow = null;

// Remove dart
function removeDart(index) {
  const region = throws[index];
  const marker = dartboard.find(`#marker-${index}`);

  if (typeof region === 'object') { // Decrement dart attribute
    region.attr('data-darts', (_, value) => parseInt(value) - 1);
    marker.remove();
    
    const isRegionEmpty = (region.attr('data-darts') == 0);
    window.replication.removeDart(index, region.attr('id'), isRegionEmpty);

    if (isRegionEmpty) { // Remove highlight
      region.removeClass('selected-region');
    }
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
  region.addClass('selected-region');
  region.attr('data-darts', (_, value) => (value === undefined) && 1 || parseInt(value) + 1);
  throws.splice(index, 0, region);

  // Place markers relatively to maintain position upon resize
  const marker = $(`<span id="marker-${index}" class="dart-marker"></span>`);
  const markerPosX = `${((event.pageX - dartboard.offset().left) / dartboard.width()) * 100}%`;
  const markerPosY = `${((event.pageY - dartboard.offset().top) / dartboard.height()) * 100}%`;
  marker.css('top', markerPosY);
  marker.css('left', markerPosX);
  dartboard.append(marker);
  
  // Update throw label
  const throwLabel = throwPanel.find(`#throw-label-${index}`);
  throwLabel.find('button').text(region.attr('name'));

  // Replicate the result to the spectator
  window.replication.addDart(region.attr('id'), index, markerPosX, markerPosY);
});

// Listen to throw dropdowns to explicitly set a throw value
throwOptions.on('click', (event) => {
  const option = $(event.target);
  const dropdown = option.parent().parent();
  const button = dropdown.find('button');
  const index = parseInt(dropdown.attr('data-slot'));

  // Change an existing dart
  if (option.text() == 'CHANGE') {
    if (changingThrow || typeof throws[index] === 'undefined') {
      return; // Already changing or there is no throw to change
    }

    removeDart(index);
    button.text('');
    button.addClass('changing-throw');
    throws.splice(index, 1);
    changingThrow = index;
    return;
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
  }
});

// Resize the spectator view to match the scorer view
const resizeObserver = new ResizeObserver(() => {
  window.replication.resizeBoard(leftPanel.css('width'));
});

resizeObserver.observe(leftPanel.get(0));

// Clear board and throw panel
$('#next-turn-button').on('click', (event) => {
  dartboard.find('.selected-region').removeClass('selected-region');
  dartboard.find('.dart-marker').remove();
  throwPanel.find('.throw-dropdown-button').text('');
  throws = [];
  currentThrow = 0;
  window.replication.nextTurn();
});

// Display new game modal
$('#new-game-button').on('click', (event) => {
  const modal = $('<iframe id="new-game-modal" src="newGame.html"></iframe>');

  modal.on('load', () => {
    const newGameDoc = modal.contents();

    newGameDoc.find('#submit-button').on('click', () => {
      let legNum = newGameDoc.find('#numOfLeg').val(); 
      let name1 = newGameDoc.find('#p1').val(); 
      let name2 = newGameDoc.find('#p2').val(); 
      let score = newGameDoc.find('input[type=radio]:checked').val(); 
      
      setUpScoreboard(legNum, name1, name2, score);
      window.replication.getFormInfo(legNum, name1, name2, score);
      modal.remove();
    });

    newGameDoc.find('#cancel-button').on('click', () => {
      modal.remove();
    });

  });
  
  $('body').append(modal);
});

// Populate Scorer Scoreboard with New Game Info
function setUpScoreboard(legNum, name1, name2, score) {
  scoreboard.find('#numOfLegs').text(legNum);
  scoreboard.find('#p1').text(name1);
  scoreboard.find('#p2').text(name2);
  scoreboard.find('#p1Score').text(score);
  scoreboard.find('#p2Score').text(score);
};


// Add listener event to statistics table
stats.find('.dropdown-content>option').on('click', (event) => {
  const option = $(event.target);
  window.replication.statSelect(option.parent().attr('name'), option.attr('value'));
});