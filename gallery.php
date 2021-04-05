<!doctype html>
<head>
<meta charset = "UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>
    <?php
    
    $root = 'towns/';
    $root_filt = array_diff(scandir($root), array('..', '.', '.DS_Store'));
    $town = htmlspecialchars($_GET['town']);
    $town_expl = preg_split('/(_| |\+|-)/',$town);
    array_walk($town_expl, function(&$str) { $str = ucfirst($str); });
    $town_filt = implode(' ',$town_expl);
    echo $town_filt;
    ?>
</title>

<script>var curTown = <?php echo $town_filt; ?>;</script>

    <link rel="stylesheet" 
        type = "text/css"
        href="https://www.w3schools.com/w3css/4/w3.css" 
    />
    <link rel = "stylesheet"
        type = "text/css"
        href = "stylesheets/gallery.css" 
    />

    <script type="text/javascript" 
            src="//code.jquery.com/jquery-1.11.0.min.js"></script>

    <script type="text/javascript" 
            src="//code.jquery.com/jquery-migrate-1.2.1.min.js"></script>

    <script src="https://cdn.jsdelivr.net/npm/exif-js"></script>
    <script src="scripts/galleria.min.js"></script>

    <?php
        $root = 'towns/';
        $root_filt = array_diff(scandir($root), array('..', '.', '.DS_Store'));
        $dirs = [];
        foreach ($root_filt as $dir) {
            $subd_holder = [];
            $dir_filt = array_diff(scandir($root . '/' . $dir), array('..', '.', '.DS_Store'));
            foreach ($dir_filt as $fold) {
                $subd_holder[$fold] = file_get_contents($root . '/' . $dir.'/'.$fold.'/photographer.txt');
            }
            $dirs[$dir] = $subd_holder;
        }
    ?>
    <script>
        var townsArr = <?php echo json_encode($dirs); ?>;
        console.log(test);
    </script>

</head>
<body>
    <a href="http://smalltown.gallery">
        <div>
            <h1 class = "site-title" style="font-size:190%;padding-bottom:1%;">        
                <?php
        if ($town_filt != 'New Harmony') {
                        echo $town_filt.', Illinois';
                    } else {
                        echo $town_filt.', Indiana';
                    }
        ?></h1>
        </div>
    </a>
    <?php
    if (! in_array( $town_filt , $root_filt )) {
        header("Location: http://smalltown.gallery/not_found.php");
    }
$dir = $root . $town_filt;
$dir_filt = array_diff(scandir($dir), array('..', '.', '.DS_Store'));
?>
<div class="galleria">
<?php
foreach ($dir_filt as $subd) {
    $subd_full = $dir.'/'.$subd;
    foreach (scandir($subd_full) as $subdir_elem) {
        if (substr($subdir_elem,-1)=='g') {
        //echo '<div class = "slider-element filtered-element '.$subd.'" data-source = "'.$subd_full.'/'.$subdir_elem.'">';
        echo '<img class="slider-element filtered-element responsive-img '.$subd.'" src="'.$subd_full.'/'.$subdir_elem.'">';
        }
    }
}
?>

</div>
<div>
<div class="year-photographed"></div>
<div class="image-title"></div>
<div class="image-description"></div>
<span class = "button-container">
    <?php
if (count($dir_filt) > 1) {
    foreach ($dir_filt as $fold) {
        echo '<button class="yearbtn" id="'.$fold.'" onClick = filterSelection('."'".$fold."'".')">Only photos from <br>'.$fold.'</button>';
    }
}
?>
<script>
var filtered = false;
    $('.yearbtn').on('click', function(){
    if (filtered === false) {
        $('.filtered-element').slick('slickFilter',':even');
        $(this).text('Unfilter Slides');
        filtered = true;
    } else {
        $('.slider-element').slick('slickUnfilter');
        $(this).text('Filter Slides');
        filtered = false;
    }
    });
</script>
</span>

<div id="gallery-modal" class="modal">
        <!-- Modal content -->
        <div class="modal-content" id="gal-content">
            <span id = "gal-close" class="close">&times;</span>
            <div id = "gal-list"></div>
        </div>

    </div>

<div id="about-modal" class="modal">

    <!-- Modal content -->
        <span id="abt-close" class="close">&times;</span>
            <div id = "about-list">
                <?php
                    
                    foreach ($dir_filt as $fold) {
                        $photographer = file_get_contents($dir.'/'.$fold.'/photographer.txt');
                        $description = file_get_contents($dir.'/'.$fold.'/description.txt');
                        echo '<h4 style="text-align: center; padding-top:5%;padding-bottom:0;"><em>'.$photographer.' - '.$fold.'</em></h4>';
                        echo $description;
                    }
                ?>
            </div>
        <span id="abt-close" class="close" style="padding:3%;"></span>


</div>

<div class="menu-container" id = "menu-div">
                <div class="menu-item" id="gallery-link">Towns</div>
                <div class="menu-item" id="about-link">Description</div>
                <div class="menu-item" id="contact-link">Back</div>
                <script>$('#contact-link').click(function () {window.location.replace("index.php");});</script>
            </div>

    <script type="text/javascript" 
        src="scripts/modals.js"></script>


    <script>
        (function() {
            Galleria.loadTheme('https://cdnjs.cloudflare.com/ajax/libs/galleria/1.6.1/themes/folio/galleria.folio.min.js');
            Galleria.run('.galleria', 
            {
                theme: 'folio',
                transition: 'pulse',
                thumbCrop: 'width',
                imageCrop: false,
                carousel: false,
                show: true,
                easing: 'galleriaOut',
                fullscreenDoubleTap: false,
                _center: true

            });
        }());
    </script>



</body>
</html>