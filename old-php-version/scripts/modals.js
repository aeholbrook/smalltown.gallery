console.log(townsArr);
// When the user clicks on the button, open the modal
$('#gallery-link').click(function() {
    console.log("yeah");
    $('[id*="modal"]').hide();
    $('[id*="modal"]').removeClass('grid');
    $('[id*="map"]').height('60%');
    $('#gallery-modal').show();
    $('#gallery-modal').addClass("grid");
    if (!$('#gal-list').hasClass("full")) {
        var count = 0;
        var curStrArr = [];
        for (const [k, v] of Object.entries(townsArr)) {
            var townLink = "/gallery.php?town=" + k;
            switch (count % 3) {
                case 1:
                    var cur = '<a href="' + townLink + '">' + '<button class="btn town-menu-btn" style="grid-column: 1; grid-row:' + count % 3 + '/' + Math.round(Object.keys(townsArr).length / 3 + 1) + '">' + k + '</button>' + '</a>';
                    curStrArr.push(cur);
                    console.log(curStrArr);
                    count++;
                    break;
                case 2:
                    var cur = '<a href="' + townLink + '">' + '<button class="btn town-menu-btn" style="grid-column: 2; grid-row:' + count % 3 + '/' + Math.round(Object.keys(townsArr).length / 3 + 1) + '">' + k + '</button>' + '</a>';
                    curStrArr.push(cur);
                    count++;
                    break;
                case 0:
                    var cur = '<a href="' + townLink + '">' + '<button class="btn town-menu-btn" style="grid-column: 3 grid-row:' + count % 3 + '/' + Math.round(Object.keys(townsArr).length / 3 + 1) + '">' + k + '</button>' + '</a>';
                    curStrArr.push(cur);
                    console.log(curStrArr);
                    $('#gal-list').append(curStrArr.join(''))
                    var curStrArr = [];
                    console.log("third");
                    count++;
                    break;
            }
        }
        $("#gal-list").addClass("full");
    }
});

$('#about-link').click(function() {
    $('[id*="modal"]').hide();
    $('[id*="modal"]').removeClass('grid');
    $('[id*="map"]').height('60%');
    $('#about-modal').show();
    $('#about-modal').addClass("grid");
});

$('#contact-link').click(function() {
    $('[id*="modal"]').hide();
    $('[id*="modal"]').removeClass('grid');
    $('[id*="map"]').height('60%');
    $('#contact-modal').show();
    $('#contact-modal').addClass("grid");
});

// When the user clicks on <span> (x), close the modal
$('.close').click(function() {
    $('[id*="modal"]').hide();
    $('[id*="modal"]').removeClass('grid');
    console.log("window closed!");
    $('[id*="map"]').height('88%');
});

// When the user clicks anywhere outside of the modal, close it
$('[id*="map"]').click(function() {
    $('[id*="modal"]').hide();
    $('[id*="modal"]').removeClass('grid');
    $('[id*="map"]').height('88%');
});