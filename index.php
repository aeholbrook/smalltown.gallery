<!DOCTYPE html> <html lang="en">

    <head>
        <title>Small Town Gallery</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="ie=edge">

        <!-- encodes a json object containing each directory in the 'towns' folder and any subdirectories therein-->
        <!-- plus the name of the photographer for that year. This is used for the interactive map. -->

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
        <!-- uses a PHP request to get all directories in the 'towns' dir. This is used to make the buttons in the 'towns' menu. -->
        <script>
            var townsArr = <?php echo json_encode($dirs); ?>;
            console.log(townsArr);
        </script>
    




        <!-- Latest compiled and minified CSS -->
        <link rel="stylesheet"
            href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css">
        <!-- jQuery library -->
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
        <!-- Latest compiled JavaScript -->
        <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js"></script>
        <!-- The stylesheet for the index page. -->
        <link rel="stylesheet" type="text/css" href="stylesheets/index.css">
        <!-- The delimiters for the state of Illinois, which is bounded on the map. -->
        <script src="scripts/ILDelimiters.js"></script>
        <!-- The JavaScript which controls the map -->
        <script src="scripts/mapScript.js"></script>
        
    </head>
    <!-- --------------------BODY START-------------------- -->
    <body style = "overflow:hidden">
            <!-- Here's a container with the title. On gallery pages this is the town name.  -->
        <div class="header-container">
            <a href="http://smalltown.gallery">
                <div>
                    <h1 class = "site-title" >Small Town Documentary</h1>
                </div>
            </a>

    </div>

    <!-- Pretty simple. This is the map element which is referenced in mapScript.js and which the google maps API interacts with. -->
    <div id="map"></div>

        <!-- The gallery modal, which here contains a list of towns with available projects. -->
        <div id="gallery-modal" class="modal">

            <!-- The contenty of the modal. This is where the close button and list actually sits. -->
            <div class="modal-content" >
                <span id = "gal-close" class="close">&times;</span>
                <div id = "gal-list"></div>
            </div>

        </div>
        <!-- The about modal. This contains the overall site description, which I put in the index file like a fool instead of connecting to it from elsewhere.  -->
        <div id="about-modal" class="modal">

            <!-- You know the drill - modal content -->
            <div class="modal-content">
                <span id="abt-close" class="close">&times;</span>
                <div id = "about-list"><p>Professor Dan Overturf started the Small Town Documentary class In August 1996, in the Department of Cinema and Photography at Southern Illinois University in Carbondale. 4 undergraduate students and 2 MFA candidates comprised the first set of students to document their chosen communities.</p>

<p>Since then, the class has been held in 2000, 2002, 2004, 2006, 2008, 2010, 2012, 2014, 2016, 2018, and 2020. 91 communities in southern Illinois have been documented, some as many as three times, by 137 photographers. 

<p>The course began with an essential premise that has remained the core of the class since its inception. Students have been tasked with researching and documenting a single southern Illinois community, typically south of I-64, for the entire 4-month fall semester. The students have shown new images each week for in-person and, as of 2020, online critiques. Students have created individual portfolios and also presented their communities with a set of images at the end of each semester.</p>
 
<p>You will note the class was scheduled only in the fall and every-other-year. The timing placed the class on either gubernatorial or presidential election years. Students also photographed unique community fall festivals, homecoming games and reunions, Halloween celebrations, Veterans Day commemorations and other autumn events.</p>

<p>The common thread for all of the students and all the towns, discussed in critiques and online, has been the opportunity to meet new people and learn about lives beyond their own. The impact of reaching outside themselves and their own comfort zone, has had a long-lasting impact on the participants.</p>

<p>Members of the Small Town Documentary classes would like to once again send their deep appreciation to the residents of the participating towns.  The cooperation of so many communities remains at the heart of the class and is essential to the success of the photographs.</p> 

<p>Additional thanks goes out to Adam Holbrook who created this website. He was one of the few students who chose to document two different towns in two different class sessions. He has generously donated his time and talents to establish a wonderful online archive.</p>

<p>NOTE: Lastly, I would like to send my gratitude to every student who has taken the class once and/or sometimes twice, and the marvelous former students who came back to TA the class. I have enjoyed teaching photography for over 30 years, but the Small Town Documentary class has been a uniquely splendid experience. Thank you all. - Dan</p>
        </div>
            </div>

        </div>
        <!-- The contact stuff. This part isn't quite finished yet, because I'll probably throw a jquery form in here or something.  -->
        <div id="contact-modal" class="modal">

            <!-- yadda yadda yadda modal content -->
            <div class="modal-content">
                <span id = "contact-close" class="close">&times;</span>
                <p id = "contact-list">While I'm making this, you can contact Dan at dvo0201@siu.edu.</p>
            </div>

        </div>



    <div class="menu-container" id = "menu-div">
                <div class="menu-item" id="gallery-link">Towns</div>
                <div class="menu-item" id="about-link">Description</div>
                <div class="menu-item" id="contact-link">Contact</div>
            </div>

    <script defer
        src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBhkunOh-ALc_afRm5EA9gKnZAAr_-bFWk&callback=initMap"

        src="https://maps.googleapis.com/maps/api/js?key=AIzaSyD7KEQSz46dMcofouwbM-V54Kk_GWIo8tY&callback=initMap">
    </script>
    <script type="text/javascript" 
        src="scripts/modals.js"></script>

</body>
</html>