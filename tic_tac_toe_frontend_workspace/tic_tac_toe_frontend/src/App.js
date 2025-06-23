import React, { useState } from "react";
import "./App.css";

// Game utility functions

function calculateWinner(squares) {
  // Returns "X", "O", or null
  const lines = [
    [0,1,2],[3,4,5],[6,7,8], //rows
    [0,3,6],[1,4,7],[2,5,8], //cols
    [0,4,8],[2,4,6] //diags
  ];
  for (let [a,b,c] of lines) {
    if (
      squares[a] &&
      squares[a] === squares[b] &&
      squares[a] === squares[c]
    ) {
      return squares[a];
    }
  }
  return null;
}

function isBoardFull(squares) {
  return squares.every((cell) => cell !== null);
}

function getEmptyCells(squares) {
  return squares.map((cell, idx) => cell === null ? idx : null).filter((n) => n !== null);
}

/**
 * Returns AI move index for a given difficulty.
 * @param {array} squares - Current board state.
 * @param {"easy"|"medium"|"hard"} difficulty - Difficulty level.
 * @returns {number|null} - Index of move.
 */
function getBestMove(squares, difficulty = "easy") {
  const empties = getEmptyCells(squares);
  if (empties.length === 0) return null;
  // Easy: Random
  if (difficulty === "easy") {
    return empties[Math.floor(Math.random() * empties.length)];
  }
  // Hard: Minimax optimal
  if (difficulty === "hard") {
    const move = minimaxBestMove(squares, "O").idx;
    return move !== undefined ? move : empties[Math.floor(Math.random() * empties.length)];
  }
  // Medium: 50% optimal, 50% random
  if (difficulty === "medium") {
    if (Math.random() < 0.5) {
      return minimaxBestMove(squares, "O").idx;
    }
    return empties[Math.floor(Math.random() * empties.length)];
  }
  return empties[Math.floor(Math.random() * empties.length)];
}

/**
 * Minimax algorithm for Tic Tac Toe (for "O" AI)
 * @param {array} squares 
 * @param {"X"|"O"} player 
 * @returns {object} { idx, score }
 */
function minimaxBestMove(squares, player) {
  const winner = calculateWinner(squares);
  if (winner === "O") return { score: 1 };
  if (winner === "X") return { score: -1 };
  if (isBoardFull(squares)) return { score: 0 };
  const empties = getEmptyCells(squares);
  let best;
  if (player === "O") {
    best = { score: -Infinity, idx: null };
    for (let idx of empties) {
      const newSquares = [...squares];
      newSquares[idx] = "O";
      const opp = minimaxBestMove(newSquares, "X");
      if (opp.score > best.score) {
        best = { score: opp.score, idx };
      }
    }
  } else {
    best = { score: Infinity, idx: null };
    for (let idx of empties) {
      const newSquares = [...squares];
      newSquares[idx] = "X";
      const opp = minimaxBestMove(newSquares, "O");
      if (opp.score < best.score) {
        best = { score: opp.score, idx };
      }
    }
  }
  return best;
}

// Player marks
const PLAYER_X = "X";
const PLAYER_O = "O";

// Retro Nintendo Theme colors
const COLOR_PRIMARY = "#dc143c";      // Nintendo Red
const COLOR_SECONDARY = "#0066cc";    // Nintendo Blue
const COLOR_ACCENT = "#00a86b";       // Nintendo Green
const COLOR_BACKGROUND = "#1a1a1a";   // Dark background
const COLOR_SCREEN = "#9bbc0f";       // Game Boy screen green
const COLOR_SCREEN_DARK = "#306230";  // Darker screen green
const COLOR_YELLOW = "#ffd700";       // Nintendo Yellow

function getCellColor(value) {
  if (value === PLAYER_X) return COLOR_PRIMARY;
  if (value === PLAYER_O) return COLOR_SECONDARY;
  return COLOR_SCREEN_DARK;
}

/**
 * PUBLIC_INTERFACE
 * Main App component for Tic Tac Toe game.
 */
function App() {
  // State management for game
  const [mode, setMode] = useState("pvp"); // "pvp" or "pvc"
  const [difficulty, setDifficulty] = useState("easy"); // "easy", "medium", "hard"
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true); // Boolean: if true, X's move
  const [winner, setWinner] = useState(null);
  const [status, setStatus] = useState("");
  const [gameActive, setGameActive] = useState(true);
  const [scores, setScores] = useState({X: 0, O: 0});
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const mobile = window.innerWidth < 700;
    setIsMobile(mobile);
    function handleResize() {
      setIsMobile(window.innerWidth < 700);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    const w = calculateWinner(squares);
    if (w) {
      setWinner(w);
      setStatus(w === PLAYER_X ? "X wins!" : "O wins!");
      setGameActive(false);
      setScores((prev) => ({...prev, [w]: prev[w]+1}));
    } else if (isBoardFull(squares)) {
      setWinner("draw");
      setStatus("Draw game.");
      setGameActive(false);
    } else {
      setWinner(null);
      setStatus((mode === "pvp"
        ? (xIsNext ? "X's turn" : "O's turn")
        : (xIsNext ? "Your turn (X)" : "Computer's turn (O)")));
    }
    // eslint-disable-next-line
  }, [squares, mode]);

  // Player vs Computer: Immediate AI move after player's turn
  React.useEffect(() => {
    if (mode === "pvc" && !xIsNext && gameActive && !winner) {
      const timer = setTimeout(() => {
        const move = getBestMove(squares, difficulty);
        if (move !== null) {
          const newSquares = squares.slice();
          newSquares[move] = PLAYER_O;
          setSquares(newSquares);
          setXIsNext(true);
        }
      }, 450); // short delay for realism
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line
  }, [mode, xIsNext, gameActive, winner, squares, difficulty]);

  // PUBLIC_INTERFACE
  function handleClick(idx) {
    if (!gameActive) return;
    if (squares[idx] !== null) return;
    if (mode === "pvc" && !xIsNext) return; // prevent user move during AI turn

    const newSquares = squares.slice();
    newSquares[idx] = xIsNext ? PLAYER_X : PLAYER_O;
    setSquares(newSquares);
    setXIsNext(!xIsNext);
  }

  function handleModeChange(newMode) {
    if (mode !== newMode) {
      setMode(newMode);
      if (newMode === "pvc") setDifficulty("easy"); // reset difficulty to default for PvC
      handleReset(true);
    }
  }

  function handleDifficultyChange(e) {
    setDifficulty(e.target.value);
    handleReset(true);
  }

  // PUBLIC_INTERFACE
  function handleReset(soft = false) {
    setSquares(Array(9).fill(null));
    setXIsNext(true);
    setWinner(null);
    setStatus("");
    setGameActive(true);
    // soft = mode switch; keep scores
    if (!soft) {
      setScores({X: 0, O: 0});
    }
  }

  return (
    <div className="app">
      <nav className="navbar">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: "center" }}>
            <div className="logo">
              <span className="logo-symbol">🎮</span>
              TIC TAC TOE
            </div>
            <span style={{fontSize: '8px', color: COLOR_YELLOW, textShadow: '1px 1px 0 rgba(0,0,0,0.8)'}}>BY KAVIA</span>
          </div>
        </div>
      </nav>

      <main style={{
        flexGrow: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: isMobile ? "flex-start" : "center",
        marginTop: isMobile ? 96 : 80,
        paddingBottom: 60,
        minHeight: "93vh"
      }}>
        <div className="container" style={{maxWidth: 600}}>
          <section style={{
            textAlign: "center", marginTop: 40,
            marginBottom: 20
          }}>
            <div className="subtitle">
              {mode === "pvp" ? "PLAYER VS PLAYER" : "PLAYER VS COMPUTER"}
            </div>
            <h1 className="title">
              TIC TAC TOE
            </h1>
            <div className="description">
              PLAY {mode === "pvp" ? "AGAINST A FRIEND" : "AGAINST THE COMPUTER"}!
              <br />
              FIRST TO REACH 3 WINS, OR JUST PLAY FOR FUN.
            </div>
          </section>
          <ScoreBoard scores={scores} />
          <div className="retro-status">
            <div style={{fontSize: isMobile ? '10px' : '12px', color: '#ffffff', textShadow: '2px 2px 0 rgba(0,0,0,0.8)'}}>
              {status}
            </div>
            {winner &&
              <div style={{
                marginTop: 8,
                fontSize: isMobile ? '8px' : '10px',
                color: (winner === "draw" ? COLOR_YELLOW : (winner === "X" ? COLOR_PRIMARY : COLOR_SECONDARY)),
                textShadow: '2px 2px 0 rgba(0,0,0,0.8)'
              }}>
                {winner === "draw" ? "IT'S A DRAW!" : `${winner} WINS!`}
              </div>
            }
          </div>
          <Board
            squares={squares}
            onClick={handleClick}
            isMobile={isMobile}
            disabled={!gameActive || (mode === "pvc" && !xIsNext && !winner)}
          />
          <OptionsPanel
            mode={mode}
            onModeChange={handleModeChange}
            onReset={handleReset}
            disableModeChange={!gameActive && (winner !== null)}
            isMobile={isMobile}
          />
          {mode === "pvc" && (
            <DifficultySelector
              difficulty={difficulty}
              onChange={handleDifficultyChange}
              isMobile={isMobile}
            />
          )}
        </div>
      </main>
      <footer className="retro-footer">
        <span>MADE WITH <span style={{color: COLOR_PRIMARY}}>♥</span> USING REACT</span>
      </footer>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * Game board component.
 * @param {object} props - { squares, onClick, isMobile, disabled }
 */
function Board({ squares, onClick, isMobile, disabled }) {
  return (
    <div
      className="tic-tac-toe-board"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: isMobile ? 4 : 6,
        width: isMobile ? 300 : 360,
        height: isMobile ? 300 : 360,
        margin: "0 auto",
        padding: isMobile ? 12 : 16,
        boxSizing: "border-box"
      }}
    >
      {squares.map((val, idx) => (
        <Square
          key={idx}
          value={val}
          onClick={() => onClick(idx)}
          disabled={!!val || disabled}
          idx={idx}
          isMobile={isMobile}
        />
      ))}
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * Single board square
 * @param {object} props - { value, onClick, disabled, idx, isMobile }
 */
function Square({ value, onClick, disabled, idx, isMobile }) {
  const squareStyle = {
    width: isMobile ? 90 : 110,
    height: isMobile ? 90 : 110,
    fontSize: isMobile ? "24px" : "32px",
    background: value ? getCellColor(value) : undefined,
    color: value ? "#ffffff" : "#ffffff"
  };

  return (
    <button
      className={`ttt-square ${value && !disabled ? 'winner-glow' : ''}`}
      style={squareStyle}
      aria-label={`Cell ${idx + 1}${value ? `, ${value}` : ", empty"}`}
      onClick={onClick}
      disabled={disabled}
    >
      {value}
    </button>
  );
}

/**
 * PUBLIC_INTERFACE
 * Score display
 * @param {object} props - { scores }
 */
function ScoreBoard({ scores }) {
  return (
    <div className="retro-scoreboard">
      <div style={{
        display: "flex",
        justifyContent: "space-around",
        gap: 32,
        fontSize: "12px",
        textShadow: '2px 2px 0 rgba(0,0,0,0.8)'
      }}>
        <span style={{
          color: COLOR_PRIMARY
        }}>
          PLAYER X: {scores.X}
        </span>
        <span style={{
          color: COLOR_SECONDARY
        }}>
          PLAYER O: {scores.O}
        </span>
      </div>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * Options below board: mode select & reset
 */
function OptionsPanel({ mode, onModeChange, onReset, disableModeChange, isMobile }) {
  return (
    <div className="retro-options">
      <div style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        gap: isMobile ? 16 : 20,
        alignItems: "center",
        justifyContent: "center"
      }}>
        <button
          className={`btn ${mode === "pvp" ? "btn-primary" : ""}`}
          onClick={() => onModeChange("pvp")}
          disabled={disableModeChange && mode === "pvp"}
          aria-label="Player vs Player"
        >
          2 PLAYERS
        </button>
        <button
          className={`btn ${mode === "pvc" ? "btn-secondary" : ""}`}
          onClick={() => onModeChange("pvc")}
          disabled={disableModeChange && mode === "pvc"}
          aria-label="Player vs Computer"
        >
          VS COMPUTER
        </button>
        <button
          className="btn btn-reset"
          onClick={() => onReset()}
          aria-label="Reset game and scores"
        >
          RESET
        </button>
      </div>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * Renders a difficulty selection dropdown for Player vs Computer mode.
 * @param {object} props - { difficulty, onChange, isMobile }
 */
function DifficultySelector({ difficulty, onChange, isMobile }) {
  return (
    <div className="retro-difficulty">
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 16,
        flexDirection: isMobile ? "column" : "row"
      }}>
        <label
          htmlFor="difficulty"
          style={{
            color: "#ffffff",
            fontSize: isMobile ? "8px" : "10px",
            textShadow: '1px 1px 0 rgba(0,0,0,0.8)',
            letterSpacing: "1px"
          }}
        >
          COMPUTER DIFFICULTY:
        </label>
        <select
          id="difficulty"
          value={difficulty}
          onChange={onChange}
          className="retro-select"
          aria-label="Computer difficulty"
        >
          <option value="easy">EASY</option>
          <option value="medium">MEDIUM</option>
          <option value="hard">HARD</option>
        </select>
      </div>
    </div>
  );
}

export default App;
