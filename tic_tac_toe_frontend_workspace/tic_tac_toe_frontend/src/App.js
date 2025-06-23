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

// Theme colors
const COLOR_PRIMARY = "#2196F3";
const COLOR_ACCENT = "#FF5722";
const COLOR_SECONDARY = "#F5F5F5";

function getCellColor(value) {
  if (value === PLAYER_X) return COLOR_PRIMARY;
  if (value === PLAYER_O) return COLOR_ACCENT;
  return "#fff";
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
    <div className="app" style={{
      minHeight: "100vh",
      background: COLOR_SECONDARY,
      color: "#222"
    }}>
      <nav className="navbar" style={{
        background: "#fff",
        borderBottom: `1.5px solid ${COLOR_PRIMARY}`,
        color: "#333"
      }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: "center" }}>
            <div className="logo" style={{color: COLOR_ACCENT}}>
              <span className="logo-symbol" style={{color: COLOR_PRIMARY}}>&#x25A3;</span>
              Tic Tac Toe
            </div>
            <span style={{fontWeight: 500, color: "#666", marginRight: 4}}>by KAVIA</span>
          </div>
        </div>
      </nav>

      <main style={{
        flexGrow: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: isMobile ? "flex-start" : "center",
        marginTop: isMobile ? 96 : 0,
        paddingBottom: 60,
        minHeight: "93vh"
      }}>
        <div className="container" style={{maxWidth: 480}}>
          <section style={{
            textAlign: "center", marginTop: 60,
            marginBottom: 18
          }}>
            <div className="subtitle" style={{
              color: COLOR_ACCENT,
              marginBottom: 4,
              fontWeight: 600,
              fontSize: "1.07em"
            }}>
              {mode === "pvp" ? "Player vs Player" : "Player vs Computer"}
            </div>
            <h1 className="title"
              style={{
                fontSize: isMobile ? "2.25rem" : "2.9rem",
                margin: "3px 0 4px 0",
                color: COLOR_PRIMARY
              }}
            >
              Tic Tac Toe
            </h1>
            <div className="description"
              style={{
                marginBottom: 7,
                color: "#888",
                fontSize: isMobile ? "1em" : "1.1em"
              }}>
              Play {mode === "pvp" ? "against a friend" : "against the computer"}!
              <br />
              <span style={{
                fontWeight: 500
              }}>
                First to reach 3 wins, or just play for fun.
              </span>
            </div>
          </section>
          <ScoreBoard scores={scores} />
          <div id="game-status" style={{textAlign: "center", fontSize: "1.2rem", minHeight: 38, margin: "12px auto 20px auto"}}>
            <strong>
              {status}
            </strong>
            {winner &&
              <span style={{
                display: "block",
                color: (winner === "draw" ? "#888" : (winner === "X" ? COLOR_PRIMARY : COLOR_ACCENT)),
                marginTop: 4,
                fontWeight: 600
              }}>
                {winner === "draw" ? "It's a draw!" : `${winner} wins!`}
              </span>
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
      <footer style={{
        textAlign: "center",
        fontSize: "1em",
        color: "#888",
        marginTop: 40,
        padding: "18px 0 9px 0"
      }}>
        <span>Made with <span style={{color: COLOR_ACCENT}}>&#10084;</span> using React</span>
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
        gap: isMobile ? 10 : 18,
        width: isMobile ? 280 : 340,
        height: isMobile ? 280 : 340,
        margin: "0 auto",
        background: "#fff",
        borderRadius: 15,
        boxShadow: "0 2px 14px 0 rgba(30,50,100,0.11)",
        padding: isMobile ? 10 : 16,
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
  return (
    <button
      className="ttt-square"
      style={{
        width: isMobile ? 70 : 96,
        height: isMobile ? 70 : 96,
        background: value
          ? getCellColor(value)
          : "#F5F5F5",
        color: value ? "#fff" : "#222",
        fontSize: isMobile ? "2.2rem" : "2.7rem",
        fontWeight: 700,
        borderRadius: 12,
        border: `2.2px solid #e0e0e0`,
        boxShadow: value ? `0 0 7px 0 ${getCellColor(value)}88` : "none",
        transition: "background 0.25s, box-shadow 0.23s",
        cursor: disabled ? "not-allowed" : "pointer"
      }}
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
    <div style={{
      display: "flex",
      justifyContent: "center",
      gap: 22,
      marginBottom: 4,
      fontWeight: 500,
      fontSize: "1.22em"
    }}>
      <span style={{
        color: COLOR_PRIMARY
      }}>
        X: {scores.X}
      </span>
      <span style={{
        color: COLOR_ACCENT
      }}>
        O: {scores.O}
      </span>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * Options below board: mode select & reset
 */
function OptionsPanel({ mode, onModeChange, onReset, disableModeChange, isMobile }) {
  return (
    <div style={{
      marginTop: 23,
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      gap: isMobile ? 13 : 28,
      alignItems: isMobile ? "stretch" : "center",
      justifyContent: "center"
    }}>
      <button
        className="btn"
        style={{
          background: mode === "pvp" ? COLOR_PRIMARY : "#eee",
          color: mode === "pvp" ? "#fff" : "#333",
          borderRadius: 8,
          fontWeight: 520,
          minWidth: 120,
          border: "none",
          marginBottom: isMobile ? 0 : undefined
        }}
        onClick={() => onModeChange("pvp")}
        disabled={disableModeChange && mode === "pvp"}
        aria-label="Player vs Player"
      >
        2 Players
      </button>
      <button
        className="btn"
        style={{
          background: mode === "pvc" ? COLOR_ACCENT : "#eee",
          color: mode === "pvc" ? "#fff" : "#333",
          borderRadius: 8,
          fontWeight: 520,
          minWidth: 120,
          marginBottom: isMobile ? 0 : undefined,
          border: "none"
        }}
        onClick={() => onModeChange("pvc")}
        disabled={disableModeChange && mode === "pvc"}
        aria-label="Player vs Computer"
      >
        Vs Computer
      </button>
      <button
        className="btn"
        style={{
          background: "#f9f9f9",
          color: COLOR_PRIMARY,
          borderRadius: 8,
          minWidth: 80,
          border: `1px solid ${COLOR_PRIMARY}22`,
          fontWeight: 500,
        }}
        onClick={() => onReset()}
        aria-label="Reset game and scores"
      >
        Reset
      </button>
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
    <div
      style={{
        display: "flex",
        justifyContent: isMobile ? "flex-start" : "center",
        alignItems: "center",
        marginTop: isMobile ? 18 : 22,
        marginBottom: isMobile ? 5 : 16,
        gap: 10,
        fontWeight: 500
      }}
    >
      <label
        htmlFor="difficulty"
        style={{
          color: "#222",
          marginRight: 7,
          fontSize: "1.05em",
          fontWeight: 600,
          letterSpacing: ".01em"
        }}
      >
        Computer Difficulty:
      </label>
      <select
        id="difficulty"
        value={difficulty}
        onChange={onChange}
        style={{
          background: "#FAFAFA",
          color: "#222",
          borderRadius: 7,
          border: "1.4px solid #b2d7fd",
          fontWeight: 510,
          fontSize: "1em",
          padding: "5.8px 13px",
          outline: "none",
          cursor: "pointer",
        }}
        aria-label="Computer difficulty"
      >
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </select>
    </div>
  );
}

export default App;