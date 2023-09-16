const leftPanel = $('#left-panel');
const dartboard = $('#dartboard-svg');
const regions = $('g.board-region > path, circle.board-region');
const throwPanel = $('#throw-panel');
const throwOptions = $('.throw-dropdown-content > option');

var throws = [];

// Attach a click listener to each board region
regions.on('click', (event) => {
  if (throws.length == 3) {
    return;
  }

  // Highlight region
  const region = $(event.target);
  region.addClass('selected-region');

  // Set throw label
  throws.push(region.attr('id'));
  const throwLabel = throwPanel.find(`#throw-label-${throws.length}`);
  throwLabel.find('button').text(region.attr('name'));

  // Replicate the selected region to the spectator
  window.replication.addDart(region.attr('id'), event.clientX, event.clientY);
});

// Listen to throw dropdowns to explicitly set a throw value
throwOptions.on('click', (event) => {
  const option = $(event.target);
  const button = option.parent().parent().find('button')

  if (option.text() == 'CHANGE') {
    button.text('');
    return;
  }

  button.text(option.text());
});

// Resize the spectator view to match the scorer view
const resizeObserver = new ResizeObserver(() => {
  window.replication.resizeBoard(leftPanel.css('width'));
});

resizeObserver.observe(leftPanel.get(0));

// Clear board and throw panel
$('#next-turn-button').on('click', (event) => {
  var throwNum = 1;
  for (regionId of throws) {
    const region = $(`#${regionId}`);
    region.removeClass('selected-region');
    throwPanel.find(`#throw-label-${throwNum}>button`).text('');
    throwNum++;
  }
  throws = [];
});