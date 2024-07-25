<?php
session_start();
if ( !isset( $_SESSION['logged'])) {
    header('Location: login.php');
}

require_once 'miners.php';
date_default_timezone_set('America/Sao_Paulo');
$now = new DateTime('now');
if (isset($_GET['tournament'])) {
    $tournament = $_GET['tournament'];
} else {
    $tournament = 'serie-a-' . $now->format('Y');
}


$pdo = new PDO('sqlite:db');

if (isset($_POST['number'])){
    $query = $pdo->prepare('UPDATE matches SET homeScore = :homeScore, awayScore = :awayScore, date = :date, done = :done where id = :id');
    $query->bindValue(':id', $_POST['number'], PDO::PARAM_INT);
    $query->bindValue(':homeScore', $_POST['homeScore'], PDO::PARAM_INT);
    $query->bindValue(':awayScore', $_POST[ 'awayScore'], PDO::PARAM_INT);
    $query->bindValue(':date', $_POST['date'], PDO::PARAM_STR);
    $query->bindValue(':done', $_POST['done'], PDO::PARAM_INT);
    $query->execute();
    echo "ok!";
    
} else {
    $query = $pdo->prepare('SELECT * FROM matches WHERE tournament = :tournament');
    $query->bindValue(':tournament', $tournament, PDO::PARAM_STR);
    if ($query->execute()) {
        $gameList = $query->fetchAll(PDO::FETCH_CLASS);
    } else {
        echo "error\n";
    }
}
?>
<html>
    <script>
        function handler(event) {
            let row = event.srcElement.parentElement.parentElement;
            document.querySelector("#numberSpan").innerHTML = row.children[0].innerHTML;
            document.querySelector("#homeTeam").innerHTML = row.children[1].innerHTML;
            document.querySelector("#number").value = row.children[0].innerHTML;
            document.querySelector("#homeScore").value = row.children[2].innerHTML;
            document.querySelector("#awayScore").value = row.children[4].innerHTML;
            document.querySelector("#awayTeam").innerHTML = row.children[5].innerHTML;
            document.querySelector("#date").value = row.children[6].innerHTML;
            document.querySelector("#done").value = row.children[7].innerHTML;

            document.querySelector("#editDialog").showModal();

        }

        document.addEventListener("DOMContentLoaded", (event) => {
            let buttons = document.querySelectorAll(".edit");
            buttons.forEach(element => {
                element.addEventListener('click', handler);
                
            });

            document.querySelector("form").addEventListener("submit", (event) => {
                event.preventDefault();
                const formData = new FormData(this);
                fetch('orc.php', {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.text())
                .then(data => {
                    console.log(data);
                    let rows = document.querySelectorAll('tr');
                    for(row of rows) {
                        if(row.children[0].innerHTML == document.querySelector('#numberSpan').innerHTML){
                            row.children[2].innerHTML = document.querySelector("#homeScore").value ;
                            row.children[4].innerHTML = document.querySelector("#awayScore").value ;
                            row.children[6].innerHTML = document.querySelector("#date").value;
                            row.children[7].innerHTML = document.querySelector("#done").value;
                            document.querySelector("#editDialog").close();
                            break;
                        }
                    }

                })
                .catch(error => console.log(error));

            });
        });
    </script>
    <body>
        <table>
            <tr><th>#</th><th>homeTeam</th><th>homeScore</th><th>x</th><th>awayScore</th><th>awayTeam</th><th>date</th><th>done</th></tr>
            <?php
            foreach ($gameList as $game) {
                echo "<tr><td >". $game->id . "</td><td>". $game->homeTeam . "</td><td>" . $game->homeScore . "</td><td>x</td><td>" . $game->awayScore . 
                "</td><td>" . $game->awayTeam . "</td><td>" . $game->date . "</td><td>" . $game->done . "</td><td><button class='edit'>edit</button></td></tr>";
                
            }

            ?>
            <dialog id="editDialog">
                <form action="orc.php" method="post">
                    <span id="numberSpan"></span>
                    <span id="homeTeam"></span>
                    <input type="hidden" name="number" value="" id="number">
                    <input type="number" min="0" name="homeScore" id="homeScore" value="">
                    <input type="number" min="0" name="awayScore" id="awayScore" value="">
                    <span id="awayTeam"></span>
                    <input type="text" name="date" id="date">
                    <input type="number" name="done" id="done" min="0" max="1">
                    <input type="submit">
                </i>
            </dialog>
        </table>
    </body>
</html>
