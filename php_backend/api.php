<?php
/**
 * Milestone 2: PHP REST Service API for Boganbefalinger App
 * 
 * Endpoints:
 *   GET  /api/books?search=...&genre=...&author=...&minScore=...
 *   POST /api/users (JSON body: { alder, ynglingsforfatter, ynglingsgenre })
 *   GET  /api/recommendations?userId=... (Milestone 4 1. & 2. prioritet)
 */

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database konfiguration
$db_host = getenv('DB_HOST') ?: 'localhost';
$db_name = getenv('DB_NAME') ?: 'bog_anbefalinger';
$db_user = getenv('DB_USER') ?: 'root';
$db_pass = getenv('DB_PASS') ?: '';

try {
    $pdo = new PDO("mysql:host={$db_host};dbname={$db_name};charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Databaseforbindelse fejlede: ' . $e->getMessage()]);
    exit();
}

// Support both direct path routing and ?route=/api/... parameter routing
$requestUri = isset($_GET['route']) ? $_GET['route'] : parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Router
if ($method === 'GET' && strpos($requestUri, '/api/books') !== false) {
    handleGetBooks($pdo);
} elseif ($method === 'POST' && strpos($requestUri, '/api/users') !== false) {
    handleCreateUser($pdo);
} elseif ($method === 'GET' && strpos($requestUri, '/api/recommendations') !== false) {
    handleGetRecommendations($pdo);
} elseif ($method === 'GET' && strpos($requestUri, '/api/users') !== false) {
    handleGetUsers($pdo);
} elseif ($method === 'GET' && strpos($requestUri, '/api/stats') !== false) {
    handleGetStats($pdo);
} elseif ($method === 'POST' && preg_match('#/api/books/(\d+)/rate#', $requestUri, $m)) {
    handleRateBook($pdo, intval($m[1]));
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Endepunkt ikke fundet: ' . $requestUri]);
}

/**
 * 1. GET /api/books?search=...&genre=...
 * Henter/søger bøger med forfatter, titel, genre, score
 */
function handleGetBooks(PDO $pdo) {
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    $genre = isset($_GET['genre']) ? trim($_GET['genre']) : '';
    $author = isset($_GET['author']) ? trim($_GET['author']) : '';
    $minScore = isset($_GET['minScore']) ? floatval($_GET['minScore']) : null;
    $page = max(1, isset($_GET['page']) ? intval($_GET['page']) : 1);
    $limit = max(1, min(100, isset($_GET['limit']) ? intval($_GET['limit']) : 24));
    $offset = ($page - 1) * $limit;

    $where = [];
    $params = [];

    if ($search !== '') {
        $where[] = '(titel LIKE :search OR forfatter LIKE :search_author OR genre LIKE :search_genre)';
        $params[':search'] = "%{$search}%";
        $params[':search_author'] = "%{$search}%";
        $params[':search_genre'] = "%{$search}%";
    }

    if ($genre !== '' && $genre !== 'all') {
        $where[] = 'genre = :genre';
        $params[':genre'] = $genre;
    }

    if ($author !== '') {
        $where[] = 'forfatter = :author';
        $params[':author'] = $author;
    }

    if ($minScore !== null) {
        $where[] = 'score >= :minScore';
        $params[':minScore'] = $minScore;
    }

    $whereSql = count($where) > 0 ? 'WHERE ' . implode(' AND ', $where) : '';

    // Tæl total
    $countStmt = $pdo->prepare("SELECT COUNT(*) as total FROM BogTabel {$whereSql}");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    // Hent bøger
    $query = "SELECT id, titel, forfatter, genre, CAST(score AS FLOAT) as score, rating_count 
              FROM BogTabel {$whereSql} 
              ORDER BY score DESC, id ASC 
              LIMIT :limit OFFSET :offset";

    $stmt = $pdo->prepare($query);
    foreach ($params as $key => $val) {
        $stmt->bindValue($key, $val);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $books = $stmt->fetchAll();

    echo json_encode([
        'books' => $books,
        'total' => $total,
        'page' => $page,
        'limit' => $limit,
        'totalPages' => ceil($total / $limit) ?: 1
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}

/**
 * 2. POST /api/users
 * Opret ny bruger med alder, ynglingsforfatter, ynglingsgenre
 */
function handleCreateUser(PDO $pdo) {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);

    if (!isset($data['alder']) || !is_numeric($data['alder'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Alder skal angives som et gyldigt tal.']);
        return;
    }

    if (empty($data['ynglingsforfatter'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Ynglingsforfatter skal udfyldes (f.eks. ff-12).']);
        return;
    }

    if (empty($data['ynglingsgenre'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Ynglingsgenre skal udfyldes (f.eks. genre-2).']);
        return;
    }

    $alder = intval($data['alder']);
    $forfatter = trim($data['ynglingsforfatter']);
    $genre = trim($data['ynglingsgenre']);

    $stmt = $pdo->prepare("INSERT INTO BrugerTabel (alder, ynglingsforfatter, ynglingsgenre) VALUES (?, ?, ?)");
    $stmt->execute([$alder, $forfatter, $genre]);
    $userId = (int)$pdo->lastInsertId();

    // Vælg 2 anbefalede bøger for denne bruger fra vedkommendes yndlingsforfatter
    $bookStmt = $pdo->prepare("SELECT id, titel FROM BogTabel WHERE forfatter = ? AND genre = ? LIMIT 2");
    $bookStmt->execute([$forfatter, $genre]);
    $recBooks = $bookStmt->fetchAll();

    // Hvis ingen match på begge dele, tag de 2 bedst bedømte fra forfatteren
    if (count($recBooks) < 2) {
        $fallback = $pdo->prepare("SELECT id, titel FROM BogTabel WHERE forfatter = ? ORDER BY score DESC LIMIT 2");
        $fallback->execute([$forfatter]);
        $recBooks = $fallback->fetchAll();
    }

    $recInsert = $pdo->prepare("INSERT INTO AnbefalingTabel (bruger_id, bog_titel, bog_id) VALUES (?, ?, ?)");
    $recommendedTitles = [];
    foreach ($recBooks as $b) {
        $recInsert->execute([$userId, $b['titel'], $b['id']]);
        $recommendedTitles[] = $b['titel'];
    }

    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Bruger oprettet med succes',
        'user' => [
            'id' => $userId,
            'alder' => $alder,
            'ynglingsforfatter' => $forfatter,
            'ynglingsgenre' => $genre,
            'recommendations' => $recommendedTitles
        ]
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}

/**
 * 3. GET /api/recommendations?userId=...
 * Milestone 4 Logik:
 * Første prioritet: Match på alder + ynglingsforfatter.
 * Anden prioritet (hvis ingen match): Match på ynglingsgenre eller højeste score.
 */
function handleGetRecommendations(PDO $pdo) {
    if (!isset($_GET['userId']) || !is_numeric($_GET['userId'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Query parameter "userId" mangler eller er ugyldigt.']);
        return;
    }

    $userId = intval($_GET['userId']);

    // Hent brugeren
    $uStmt = $pdo->prepare("SELECT * FROM BrugerTabel WHERE id = ?");
    $uStmt->execute([$userId]);
    $user = $uStmt->fetch();

    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => "Bruger med ID {$userId} blev ikke fundet."]);
        return;
    }

    // Første prioritet: Andre brugere med SAMME alder og SAMME ynglingsforfatter
    $p1Stmt = $pdo->prepare("
        SELECT b.*, a.bruger_id as recommendedByUserId 
        FROM BrugerTabel u
        JOIN AnbefalingTabel a ON a.bruger_id = u.id
        JOIN BogTabel b ON b.id = a.bog_id
        WHERE u.id != :userId 
          AND u.alder = :alder 
          AND u.ynglingsforfatter = :forfatter
    ");
    $p1Stmt->execute([
        ':userId' => $userId,
        ':alder' => $user['alder'],
        ':forfatter' => $user['ynglingsforfatter']
    ]);
    $priority1Books = $p1Stmt->fetchAll();

    // Anden prioritet: Match på ynglingsgenre eller højeste score
    $p2Stmt = $pdo->prepare("
        SELECT * FROM BogTabel 
        WHERE genre = :genre 
        ORDER BY score DESC 
        LIMIT 6
    ");
    $p2Stmt->execute([':genre' => $user['ynglingsgenre']]);
    $priority2Books = $p2Stmt->fetchAll();

    echo json_encode([
        'user' => $user,
        'hasPriority1Match' => count($priority1Books) > 0,
        'priority1Matches' => $priority1Books,
        'priority2Matches' => $priority2Books
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}

function handleGetUsers(PDO $pdo) {
    $author = isset($_GET['author']) ? trim($_GET['author']) : '';
    $sql = "SELECT * FROM BrugerTabel";
    $params = [];
    if ($author !== '') {
        $sql .= " WHERE ynglingsforfatter = ?";
        $params[] = $author;
    }
    $sql .= " ORDER BY id ASC LIMIT 100";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $users = $stmt->fetchAll();
    echo json_encode(['users' => $users], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}

function handleGetStats(PDO $pdo) {
    $books = $pdo->query("SELECT COUNT(*) FROM BogTabel")->fetchColumn();
    $users = $pdo->query("SELECT COUNT(*) FROM BrugerTabel")->fetchColumn();
    $authors = $pdo->query("SELECT COUNT(DISTINCT forfatter) FROM BogTabel")->fetchColumn();
    $genres = $pdo->query("SELECT COUNT(DISTINCT genre) FROM BogTabel")->fetchColumn();
    $avgScore = $pdo->query("SELECT AVG(score) FROM BogTabel")->fetchColumn();

    echo json_encode([
        'totalBooks' => intval($books),
        'totalUsers' => intval($users),
        'totalAuthors' => intval($authors),
        'totalGenres' => intval($genres),
        'averageScore' => round(floatval($avgScore), 2),
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}

function handleRateBook(PDO $pdo, int $bookId) {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (!isset($data['score']) || !is_numeric($data['score'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Score skal være et tal mellem 0 og 9']);
        return;
    }

    $score = max(0, min(9, floatval($data['score'])));
    
    $stmt = $pdo->prepare("SELECT * FROM BogTabel WHERE id = ?");
    $stmt->execute([$bookId]);
    $book = $stmt->fetch();
    if (!$book) {
        http_response_code(404);
        echo json_encode(['error' => 'Bogen findes ikke']);
        return;
    }

    $newCount = intval($book['rating_count']) + 1;
    $newTotal = floatval($book['total_score']) + $score;
    $newAvg = round($newTotal / $newCount, 2);

    $upd = $pdo->prepare("UPDATE BogTabel SET score = ?, rating_count = ?, total_score = ? WHERE id = ?");
    $upd->execute([$newAvg, $newCount, $newTotal, $bookId]);

    $stmt->execute([$bookId]);
    $updatedBook = $stmt->fetch();
    $updatedBook['score'] = floatval($updatedBook['score']);

    echo json_encode([
        'success' => true,
        'book' => $updatedBook,
        'message' => "Score for {$updatedBook['titel']} opdateret til {$updatedBook['score']}",
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}
?>
