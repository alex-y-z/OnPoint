const leftPanel = $('#left-panel');
const dartboard = $('#dartboard-svg');
const regions = $('g.board-region > path, circle.board-region');
const throwPanel = $('#throw-panel');
const throwOptions = $('.throw-dropdown-content > option');

var throws = [];
var markers = [];
var currentThrow = 0;
var changingThrow = null;

// Remove dart
function removeDart(index) {
  const region = throws[index];
  const marker = markers[index];

  if (typeof region === 'object') { // Decrement dart attribute
    region.attr('data-darts', (_, value) => parseInt(value) - 1);
    marker.remove();

    if (region.attr('data-darts') == 0) { // Remove highlight
      region.removeClass('selected-region');
    }
  }
}

// Attach a click listener to each board region
regions.on('click', (event) => {
  if (throws.length == 3) {
    return;
  }

  // Highlight region
  const region = $(event.target);
  region.addClass('selected-region');
  region.attr('data-darts', (_, value) => (value === undefined) && 1 || parseInt(value) + 1);

  // Create placeholder dart
  let marker = $('<span class="dart-marker"></span>');
  marker.css('top', event.pageY);
  marker.css('left', event.pageX);
  leftPanel.append(marker);

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
  
  // Update throw label
  throws.splice(index, 0, region);
  markers.splice(index, 0, marker);
  const throwLabel = throwPanel.find(`#throw-label-${index}`);
  throwLabel.find('button').text(region.attr('name'));

  // Replicate the selected region to the spectator
  window.replication.addDart(region.attr('id'), event.clientX, event.clientY);
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

    button.text('');
    button.addClass('changing-throw');
    removeDart(index);
    throws.splice(index, 1);
    markers.splice(index, 1);
    changingThrow = index;
    return;
  }

  // Miss, bounce, or foul
  if (changingThrow) {
    button.removeClass('changing-throw');
    changingThrow = null;
  }

  if (index <= currentThrow) {
    button.text(option.text());
    removeDart(index);
    throws[index] = option.text();
    markers[index] = null;

    // Make this exception count for the current throw
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
  for (index in throws) {
    removeDart(index);
    throwPanel.find(`#throw-label-${index}>button`).text('');
  }
  throws = [];
  markers = [];
  currentThrow = 0;
});



