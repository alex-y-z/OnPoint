const modal =  $(window.parent.document).find('#new-game-modal')

// Simply delete the modal for now
$('#submit-button').on('click', (event) => {
   modal.remove();
});