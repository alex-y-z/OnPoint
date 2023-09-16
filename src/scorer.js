const leftPanel = $('#left-panel');
const dartboard = $('#dartboard-svg');
const regions = $('g.board-region > path, circle.board-region');
const throwPanel = $('#throw-panel');
const throwOptions = $('.throw-dropdown-content > option');

const throws = [];

// Clear board and throw panel
function clearBoard() {

}

// Attach a click listener to each board region
regions.on('click', (event) => {
  const region = $(event.target);
  region.css('fill', 'rgb(0, 238, 255');

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