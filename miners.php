<?php
class Game
{
    public $homeTeam;
    public $awayTeam;
    public $homeScore;
    public $awayScore;
    public $done;
    public $date;
    public $id;
    public $tournament;

    public function __construct($timeCasa, $timeFora, $golsCasa = '', $golsFora = '', $date = '', $id = '', $campeonato = '')
    {
        $this->id = $id;
        $this->tournament = $campeonato;
        $this->homeTeam = $timeCasa;
        $this->awayTeam = $timeFora;
        $this->homeScore = $golsCasa;
        $this->awayScore = $golsFora;
        if ($golsCasa == '' || $golsFora == '') {
            $this->done = false;
        } else {
            $this->done = true;
        }
        if ($date == 'A definir') {
            $this->date = null;
        } else {
            $this->date = substr($date, 6, 4) . '-' . substr($date, 3, 2) . '-' . substr($date, 0, 2) . substr($date, 10);  // 01/34/6789
        }
    }
}

class SiteCBFMultifase extends SiteCBFMiner
{
    private $gameList;
    private $badges;

    public function __construct($url, $tournament)
    {
        try {
            $this->gameList = array();
            $this->badges = array();
            ini_set('memory_limit', '256M');
            $doc = file_get_contents($url);
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            $doc = curl_exec($ch);
            curl_close($ch);

            $doc = preg_replace('/\r*\n\r*/m', '', $doc);
            $rePhase = '/phase=\d+/m';
            $count = preg_match_all($rePhase, $doc, $res_phases, PREG_SET_ORDER, 0);
            $phases = array();
            for ($i = 0; $i < $count; $i++) {
                array_push($phases, $res_phases[$i][0]);
            }
            $phases = array_keys(array_count_values($phases));
            foreach ($phases as $phase) {
                $newurl = $url . '?' . $phase;
                echo ($newurl . "\n");

                $miner = new SiteCBFMiner($newurl, $tournament);
                // echo "Miner: ". json_encode($miner->getGameList()) . "\n\n";
                $this->gameList = array_merge($this->gameList, $miner->getGameList());
                // echo "this: ". json_encode($this->gameList) . "\n\n";
                $this->badges = array_merge($this->badges, $miner->getBadges());
            }

            echo 'This has ' . count($this->gameList) . "games.\n";
        } catch (Exception $e) {
            echo 'Caught exception: ', $e->getMessage(), "\n";
        }
    }

    /***
     * @param $db a PDO
     */
    public function cadastraJogos($db) : void
    {
        $db->exec('CREATE TABLE IF NOT EXISTS matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tournament TEXT,
        number INTEGER,
        homeTeam TEXT,
        awayTeam TEXT,
        homeScore TEXT,
        awayScore TEXT,
        date TEXT,
        done BOOLEAN
      )');

        $stmt = $db->prepare('INSERT INTO matches (tournament, number, homeTeam, awayTeam, homeScore, awayScore, date, done) VALUES (:tournament,:number, :homeTeam, :awayTeam, :homeScore, :awayScore, :date, :done)');

        foreach ($this->gameList as $game) {
            echo $game->homeTeam . ' ' . $game->homeScore . ' x ' . $game->awayScore . ' ' . $game->awayTeam . ' - ' . $game->date . "\n";
            $stmt->bindValue(':tournament', $game->tournament, PDO::PARAM_STR);
            $stmt->bindValue(':number', $game->id, PDO::PARAM_INT);
            $stmt->bindValue(':homeTeam', $game->homeTeam, PDO::PARAM_STR);
            $stmt->bindValue(':awayTeam', $game->awayTeam, PDO::PARAM_STR);
            $stmt->bindValue(':homeScore', $game->homeScore, PDO::PARAM_STR);
            $stmt->bindValue(':awayScore', $game->awayScore, PDO::PARAM_STR);
            $stmt->bindValue(':date', $game->date, PDO::PARAM_STR);
            $stmt->bindValue(':done', $game->done, PDO::PARAM_BOOL);
            $stmt->execute();
        }
    }

    public function cadastraEscudos($db): void
    {
        $db->exec('CREATE TABLE IF NOT EXISTS badgees (team TEXT PRIMARY KEY, url TEXT)');
        $stmt = $db->prepare('INSERT INTO badges (team, url) VALUES (:team, :url) ON CONFLICT(team) DO UPDATE SET url = :url');
        foreach (array_keys($this->badges) as $teamName) {
            echo ''.$teamName.''.$this->badges[$teamName].'<br>\n';
            $stmt->bindValue(':team', $teamName, PDO::PARAM_STR);
            $stmt->bindValue(':url', $this->badges[$teamName], PDO::PARAM_STR);
            $stmt->execute();
        }
    }
}

class SiteCBFMiner
{
    private $gameList;
    private $url;
    private $badges;
    private $tournament;
    public $key;

    public function __construct($url, $tournament)
    {
        $this->gameList = array();
        $this->badges = array();
        $this->url = $url;
        $this->tournament = $tournament;

        try {
            ini_set('memory_limit', '256M');

            $doc = file_get_contents($this->url);
            $doc = preg_replace('/\r*\n\r*/m', '', $doc);
            $reHomeTeams = '/time pull-left"[^"]*"time-sigla"[^"]*img src="([^\?]*)[^"]*"[^"]*"([^"]*)/m';
            $reAwayTeams = '/time pull-right"[^"]*"time-sigla"[^"]*img src="([^\?]*)[^"]*"[^"]*"([^"]*)/m';
            $reDatas = '/(A definir|\d\d\/\d\d\/\d\d\d\d\s*\d\d:\d\d)[^J]*Jogo: \s*(\d+)/m';  
            $reHorarioPlacar = '/strong class="partida-horario center-block">(.*?)<\/strong>/m';
            $contagemHome = preg_match_all($reHomeTeams, $doc, $badgesAndNamesHome, PREG_SET_ORDER, 0);
            $contagemAway = preg_match_all($reAwayTeams, $doc, $badgesAndNamesAway, PREG_SET_ORDER, 0);
            $contagemPlacar = preg_match_all($reHorarioPlacar, $doc, $placarHorario, PREG_SET_ORDER, 0);
            $contagemDatas = preg_match_all($reDatas, $doc, $datas, PREG_SET_ORDER, 0);
            echo "Contagem Placar: ".$contagemPlacar;
            for ($i = 0; $i < $contagemPlacar; ++$i) {
                $re = '/(\d+)\s*x\s*(\d+)/m';
                $homeScore = '';
                $awayScore = '';
                $this->badges[$badgesAndNamesHome[$i][2]] = $badgesAndNamesHome[$i][1];
                $this->badges[$badgesAndNamesAway[$i][2]] = $badgesAndNamesAway[$i][1];
                if (preg_match_all($re, $placarHorario[$i][1], $matches, PREG_SET_ORDER, 0)) {
                    $homeScore = $matches[0][1];
                    $awayScore = $matches[0][2];
                }
                $game = new Game($badgesAndNamesHome[$i][2], $badgesAndNamesAway[$i][2], $homeScore, $awayScore, $datas[$i][1], $datas[$i][2], $this->tournament);
                array_push($this->gameList, $game);
            }
        } catch (Exception $e) {
            echo 'Caught exception: ', $e->getMessage(), "\n";
        }
    }

    public function getBadges(): array
    {
        return ($this->badges);
    }

    public function getGameList(): array
    {
        return ($this->gameList);
    }

    public function atualizaJogos($db): array
    {
        $error = "";
        try {
            $stmt = $db->prepare('UPDATE matches 
          SET 
            homeScore = :homeScore,
            awayScore = :awayScore,
            date = :date,
            done = :done
          WHERE
            tournament = :tournament and number = :number ;');
            foreach ($this->gameList as $game) {
                $stmt->bindValue(':tournament', $game->tournament, PDO::PARAM_STR);
                $stmt->bindValue(':number', $game->id, PDO::PARAM_INT);
                $stmt->bindValue(':homeScore', $game->homeScore, PDO::PARAM_STR);
                $stmt->bindValue(':awayScore', $game->awayScore, PDO::PARAM_STR);
                $stmt->bindValue(':date', $game->date, PDO::PARAM_STR);
                $stmt->bindValue(':done', $game->done, PDO::PARAM_BOOL);
                $error = $error. " ".$game->homeScore."x".$game->awayScore."<br>\n";
                $result = $stmt->execute();
                if (!$result) {
                    $error = $error . "->" . $result;
                }
            }
        } catch (PDOException $e) {
             $error = $e->getMessage();
        } catch (Exception $e) {
            $error = $e->getMessage();
        }

        return [$this->gameList, $error];
    }

    /***
     * @param $db a PDO object
     */
    public function cadastraEscudos($db): void
    {
        $db->exec('CREATE TABLE IF NOT EXISTS badges (team TEXT PRIMARY KEY, url TEXT)');
        $stmt = $db->prepare('INSERT INTO badges (team, url) VALUES (:team, :url) ON CONFLICT(team) DO UPDATE SET url = :url');
        foreach (array_keys($this->badges) as $teamName) {
            echo ''.$teamName.''.$this->badges[$teamName].'<br>\n';
            $stmt->bindValue(':team', $teamName, PDO::PARAM_STR);
            $stmt->bindValue(':url', $this->badges[$teamName], PDO::PARAM_STR);
            $stmt->execute();
        }
    }

    /***
     * @param $db a PDO object
     */
    public function cadastraJogos($db) : void
    {
        $db->exec('CREATE TABLE IF NOT EXISTS matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tournament TEXT,
        number INTEGER,
        homeTeam TEXT,
        awayTeam TEXT,
        homeScore TEXT,
        awayScore TEXT,
        date TEXT,
        done BOOLEAN
      )');

        $stmt = $db->prepare('INSERT INTO matches (tournament, number, homeTeam, awayTeam, homeScore, awayScore, date, done) VALUES (:tournament,:number, :homeTeam, :awayTeam, :homeScore, :awayScore, :date, :done)');

        foreach ($this->gameList as $game) {
            echo ($game->homeTeam . ' ' . $game->homeScore . ' x ' . $game->awayScore . ' ' . $game->awayTeam . ' - ' . $game->date . "\n");
            $stmt->bindValue(':tournament', $game->tournament, PDO::PARAM_STR);
            $stmt->bindValue(':number', $game->id, PDO::PARAM_INT);
            $stmt->bindValue(':homeTeam', $game->homeTeam, PDO::PARAM_STR);
            $stmt->bindValue(':awayTeam', $game->awayTeam, PDO::PARAM_STR);
            $stmt->bindValue(':homeScore', $game->homeScore, PDO::PARAM_STR);
            $stmt->bindValue(':awayScore', $game->awayScore, PDO::PARAM_STR);
            $stmt->bindValue(':date', $game->date, PDO::PARAM_STR);
            $stmt->bindValue(':done', $game->done, PDO::PARAM_BOOL);
            $stmt->execute();
        }
    }

    public function calcKey() : void
    {
        $keyBuilder = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        foreach ($this->gameList as $game) {
            $number = $game->id - 1;
            $group = floor($number / 32);
            if ($game->done) {
                $keyBuilder[$group] += 2 ** $number;
            }
        }
        $out = '';
        foreach ($keyBuilder as $key => $val) {
            $out = $val . $out;
        }
        $this->key = $out;
    }
}

?>
