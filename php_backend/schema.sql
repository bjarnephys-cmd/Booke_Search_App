-- ====================================================================
-- Milestone 2: MySQL Database Schema for Boganbefalinger App
-- ====================================================================

CREATE DATABASE IF NOT EXISTS bog_anbefalinger CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bog_anbefalinger;

-- 1. BogTabel (Milestone 1 & 2)
-- 100 forfattere (ff-0 .. ff-99), hver med 10 bogtitler (tit-ff-i-j), 5 genrer, score float(j)
DROP TABLE IF EXISTS AnbefalingTabel;
DROP TABLE IF EXISTS BrugerTabel;
DROP TABLE IF EXISTS BogTabel;

CREATE TABLE BogTabel (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titel VARCHAR(120) NOT NULL UNIQUE,
    forfatter VARCHAR(80) NOT NULL,
    genre VARCHAR(50) NOT NULL,
    score DECIMAL(4, 2) NOT NULL,
    rating_count INT NOT NULL DEFAULT 1,
    total_score DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_forfatter (forfatter),
    INDEX idx_genre (genre),
    INDEX idx_titel (titel),
    INDEX idx_score (score)
) ENGINE=InnoDB;

-- 2. BrugerTabel (Milestone 3)
-- 70 brugere med parametrene x1=alder, x2=ynglingsforfatter, x3=ynglingsgenre
CREATE TABLE BrugerTabel (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alder INT NOT NULL,
    ynglingsforfatter VARCHAR(80) NOT NULL,
    ynglingsgenre VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_alder_forfatter (alder, ynglingsforfatter),
    INDEX idx_genre (ynglingsgenre)
) ENGINE=InnoDB;

-- 3. AnbefalingTabel (Milestone 3 & 4)
-- Hver bruger har anbefalet 2 bogtitler fra forfatter ff-i med genre x3
CREATE TABLE AnbefalingTabel (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bruger_id INT NOT NULL,
    bog_titel VARCHAR(120) NOT NULL,
    bog_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bruger_id) REFERENCES BrugerTabel(id) ON DELETE CASCADE,
    FOREIGN KEY (bog_id) REFERENCES BogTabel(id) ON DELETE CASCADE,
    INDEX idx_bruger (bruger_id),
    INDEX idx_bog (bog_id)
) ENGINE=InnoDB;

-- ====================================================================
-- SEED PROCEDURER / POPULERING
-- ====================================================================

DELIMITER $$

CREATE PROCEDURE SeedBogDatabase()
BEGIN
    DECLARE i INT DEFAULT 0;
    DECLARE j INT DEFAULT 0;
    DECLARE v_forfatter VARCHAR(80);
    DECLARE v_titel VARCHAR(120);
    DECLARE v_genre VARCHAR(50);
    DECLARE v_score DECIMAL(4,2);

    -- 100 forfattere: ff-0 .. ff-99
    WHILE i < 100 DO
        SET v_forfatter = CONCAT('ff-', i);
        SET j = 0;
        
        -- 10 bøger pr. forfatter: tit-ff-i-j, genre-(j%5), score: float(j)
        WHILE j < 10 DO
            SET v_titel = CONCAT('tit-ff-', i, '-', j);
            SET v_genre = CONCAT('genre-', (j % 5));
            SET v_score = CAST(j AS DECIMAL(4,2));
            
            INSERT INTO BogTabel (titel, forfatter, genre, score, rating_count, total_score)
            VALUES (v_titel, v_forfatter, v_genre, v_score, 1, v_score);
            
            SET j = j + 1;
        END WHILE;
        
        SET i = i + 1;
    END WHILE;
END$$

CREATE PROCEDURE SeedBrugere()
BEGIN
    DECLARE i INT DEFAULT 0;
    DECLARE v_alder INT;
    DECLARE v_forfatter VARCHAR(80);
    DECLARE v_genre_idx INT;
    DECLARE v_genre VARCHAR(50);
    DECLARE v_bruger_id INT;
    DECLARE v_bog1_id INT;
    DECLARE v_bog2_id INT;
    DECLARE v_tit1 VARCHAR(120);
    DECLARE v_tit2 VARCHAR(120);

    -- 70 brugere: i = 0 .. 69
    WHILE i < 70 DO
        SET v_alder = i;                         -- x1 = i
        SET v_forfatter = CONCAT('ff-', i);      -- x2 = ff-i
        SET v_genre_idx = i % 5;
        SET v_genre = CONCAT('genre-', v_genre_idx); -- x3 = genre-(i%5)

        INSERT INTO BrugerTabel (alder, ynglingsforfatter, ynglingsgenre)
        VALUES (v_alder, v_forfatter, v_genre);
        
        SET v_bruger_id = LAST_INSERT_ID();

        -- Bruger i har anbefalet 2 bogtitler fra forfatter ff-i med genre x3:
        -- De to bøger er j = v_genre_idx og j = v_genre_idx + 5
        SET v_tit1 = CONCAT('tit-ff-', i, '-', v_genre_idx);
        SET v_tit2 = CONCAT('tit-ff-', i, '-', (v_genre_idx + 5));

        SELECT id INTO v_bog1_id FROM BogTabel WHERE titel = v_tit1 LIMIT 1;
        SELECT id INTO v_bog2_id FROM BogTabel WHERE titel = v_tit2 LIMIT 1;

        IF v_bog1_id IS NOT NULL THEN
            INSERT INTO AnbefalingTabel (bruger_id, bog_titel, bog_id)
            VALUES (v_bruger_id, v_tit1, v_bog1_id);
        END IF;

        IF v_bog2_id IS NOT NULL THEN
            INSERT INTO AnbefalingTabel (bruger_id, bog_titel, bog_id)
            VALUES (v_bruger_id, v_tit2, v_bog2_id);
        END IF;

        SET i = i + 1;
    END WHILE;
END$$

DELIMITER ;

-- Kør seedning
CALL SeedBogDatabase();
CALL SeedBrugere();

-- Verifikation
SELECT COUNT(*) AS total_boeger FROM BogTabel;      -- Skal være 1000
SELECT COUNT(*) AS total_brugere FROM BrugerTabel;  -- Skal være 70
SELECT COUNT(*) AS total_anbefalinger FROM AnbefalingTabel; -- Skal være 140
