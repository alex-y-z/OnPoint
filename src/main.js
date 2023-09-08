const dartboard = document.getElementById('dartboard-svg');
const regions = dartboard.querySelectorAll('g.board-region > path, circle.board-region');

// Attach a click listener to each board region
regions.forEach((region) => {
  region.addEventListener('click', (event) => {
    region.style.fill = 'rgb(0, 238, 255';

    // Replicate the selected region to the spectator
    window.replication.addDart(region.getAttribute('id'), event.clientX, event.clientY);
  });
});