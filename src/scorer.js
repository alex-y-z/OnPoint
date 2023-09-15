const leftPanel = $('#left-panel');
const dartboard = $('#dartboard-svg');
const regions = $('g.board-region > path, circle.board-region');

// Attach a click listener to each board region
regions.each(function(index, region) {
  $(region).on('click', function(event) {
    $(region).css('fill', 'rgb(0, 238, 255');

    // Replicate the selected region to the spectator
    window.replication.addDart($(region).attr('id'), event.clientX, event.clientY);
  });
});

// Resize the spectator view to match the scorer view
const resizeObserver = new ResizeObserver(() => {
  window.replication.resizeBoard(leftPanel.css('width'));
});

resizeObserver.observe(leftPanel.get(0));