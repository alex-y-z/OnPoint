const leftPanel = $('#left-panel');
const dartboard = $('#dartboard-svg');
const regions = $('g.board-region > path, circle.board-region');
const throwPanel = $('#throw-panel');
const throwOptions = $('.throw-dropdown-content > option');

var throws = [];
var currentThrow = 0;
var settingThrow = false;

// Remove dart
function removeDart(region) {

  // Remove highlight if throw is associated with a region
  if (typeof region === 'object') {
    region.removeClass('selected-region');
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

  // Set throw label
  throws.splice(currentThrow, 0, region);
  const throwLabel = throwPanel.find(`#throw-label-${currentThrow}`);
  throwLabel.find('button').text(region.attr('name'));
  currentThrow++;
  settingThrow = false;

  // Replicate the selected region to the spectator
  window.replication.addDart(region.attr('id'), event.clientX, event.clientY);
});

// Listen to throw dropdowns to explicitly set a throw value
throwOptions.on('click', (event) => {
  const option = $(event.target);
  const dropdown = option.parent().parent();
  const button = dropdown.find('button');
  const index = parseInt(dropdown.attr('data-slot'));
  const region = throws[index];

  // Change an existing dart
  if (option.text() == 'CHANGE') {
    if (settingThrow || typeof throws[index] === 'undefined') {
      return; // Already setting or there is no throw to change
    }

    button.text('');
    removeDart(region);
    throws.splice(index, 1);
    currentThrow = index;
    settingThrow = true;
    return;
  }

  // Miss, bounce, or foul
  button.text(option.text());
  removeDart(region);
  throws[index] = option.text();
});

// Resize the spectator view to match the scorer view
const resizeObserver = new ResizeObserver(() => {
  window.replication.resizeBoard(leftPanel.css('width'));
});

resizeObserver.observe(leftPanel.get(0));

// Clear board and throw panel
$('#next-turn-button').on('click', (event) => {
  for (index in throws) {
    removeDart(throws[index]);
    throwPanel.find(`#throw-label-${index}>button`).text('');
  }
  throws = [];
  currentThrow = 0;
});