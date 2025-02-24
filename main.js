// < ========================================================
// < Constants, Variables and Declarations
// < ========================================================

const DEBUG = 0;
const page = document.getElementById('page');
const clock = document.getElementById('clock');
const bombCounter = document.getElementById('bomb-counter');
const refreshButton = document.getElementById('refresh-button');
const bombDecimal = 0.18;
let seconds = 0;
let grid;

// < ========================================================
// < Grid Class (Custom Element)
// < ========================================================

// > Custom #grid element, with .cell child elements
class Grid {
    constructor() {
        this.element = document.createElement('div');
        this.element.id = "grid";
        page.appendChild(this.element);
        this.cells = this.createCells();
        this.assignValues();
        this.safeCells = this.cells.filter(cell => cell.dataset.value !== 'B');
        this.bombCells = this.cells.filter(cell => cell.dataset.value === 'B');
        this.numberedCells = this.safeCells.filter(cell => Number(cell.dataset.value) > 0);
        this.safestCell = this.tagSafestCell();
        this.element.dataset.mode = 'default';
    }

    // > Find and tag cell with the highest number of adjacent cells of value 0
    tagSafestCell() {
        let zeros = this.cells.filter(cell => cell.dataset.value == '0');
        let safestCell;
        let currentHighest = 0;
        for (let cell of zeros) {
            let adjacentCells = this.getAdjacentCells(cell);
            let adjacentZeros = adjacentCells.filter(cell => cell.dataset.value == '0');
            let value = adjacentZeros.length;
            if (value > currentHighest) {
                safestCell = cell;
                currentHighest = value;
            }
        }
        if (safestCell) {
            safestCell.dataset.safest = 'true';
        }
        return safestCell;
    }

    // > Add event listeners to a given cell
    addListeners(cell) {
        cell.addEventListener('click', (e) => {
            this.check(cell);
        });
        cell.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (e.pointerType !== "touch") {
                this.toggleFlag(cell);
            }
        });
        cell.addEventListener("touchstart", (e) => {
            cell.longPressTimeout = setTimeout(() => {
                console.log("Long press");
                this.toggleFlag(cell);
            }, 400);
        });
        cell.addEventListener("touchend", (e) => {
            clearTimeout(cell.longPressTimeout);
        });
    }

    // > Create a single .cell element
    createCell(row, col) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.dataset.row = row;
        cell.dataset.col = col;
        cell.dataset.value = Math.random() < bombDecimal ? 'B' : '0';
        cell.dataset.revealed = 'false';
        cell.dataset.flagged = 'false';
        cell.dataset.insightful = 'false';
        this.setTextContent(cell, '');
        this.addListeners(cell);
        return cell;
    }

    // > Create the .cell elements for the Grid class object
    createCells() {
        let cells = [];
        for (let row = 1; row <= 9; row++) {
            for (let col = 1; col <= 9; col++) {
                let cell = this.createCell(row, col);
                this.element.appendChild(cell);
                cells.push(cell);
            }
        }
        return cells;
    }

    // > Set textContent for cell, and align with css dataset.text
    setTextContent(cell, text) {
        cell.textContent = text;
        cell.dataset.text = text;
    }

    // > Assign initial value to all cells based on adjacency
    assignValues() {
        let bombs = [];
        for (let cell of this.cells) {
            if (cell.dataset.value === 'B') {
                bombs.push(cell);
            }
        }
        for (let bomb of bombs) {
            let adjacentCells = this.getAdjacentCells(bomb);
            for (let cell of adjacentCells) {
                if (cell.dataset.value != 'B') {
                    this.incrementCell(cell);
                }
            }
        }
    }

    // > Increment dataset.value for a cell by 1
    incrementCell(cell) {
        let currentValue = Number(cell.dataset.value);
        cell.dataset.value = String(currentValue + 1);
    }

    // > Get cell based on dataset.row and dataset.col
    getCell(row, col) {
        for (let cell of this.cells) {
            let r = Number(cell.dataset.row);
            let c = Number(cell.dataset.col);
            if (r === row && c === col) {
                return cell;
            }
        }
        return null;
    }

    // > Get an array of all adjacent cells for a given cell
    getAdjacentCells(cell) {
        const R = Number(cell.dataset.row);
        const C = Number(cell.dataset.col);
        let adjacentCells = [];
        for (let r = R - 1; r <= R + 1; r++) {
            for (let c = C - 1; c <= C + 1; c++) {
                if (r === R && c === C) {
                    continue;
                }
                let adjacentCell = this.getCell(r, c);
                if (adjacentCell) {
                    adjacentCells.push(adjacentCell);
                }
            }
        }
        return adjacentCells;
    }

    // > Reveal outward from a given cell
    revealOutward(cell) {
        if (cell.dataset.revealed == 'true') {
            return;
        }
        else if (cell.dataset.value == 'B') {
            return;
        }
        else if (Number(cell.dataset.value) > 0) {
            this.revealCell(cell);
            return;
        }
        else {
            this.revealCell(cell);
            let adjacentCells = this.getAdjacentCells(cell);
            for (let cell of adjacentCells) {
                this.revealOutward(cell);
            }
        }
    }

    // > Reveal value for a given cell as textContent
    revealCell(cell) {
        cell.dataset.revealed = 'true';
        this.toggleFlag(cell, 'false');
        this.setTextContent(cell, cell.dataset.value)
    }

    // > Get effective value of a cell based on adjacent flags
    getEffectiveValue(cell) {
        let value = Number(cell.dataset.value);
        let adjacent = this.getAdjacentCells(cell);
        let flagged = adjacent.filter(cell => cell.dataset.flagged === 'true');
        value -= flagged.length;
        return value;
    }

    // > Show effective value for a given cell as textContent
    showEffectiveValue(cell) {
        let value = this.getEffectiveValue(cell);
        this.setTextContent(cell, value);
    }

    // > Check a clicked cell and run revealOutward if needed
    check(cell) {
        if (cell.dataset.revealed == 'true') {
            return;
        }
        else if (cell.dataset.value == 'B') {
            this.revealCell(cell);
            console.log('Bomb');
            return;
        }
        else {
            this.revealOutward(cell);
        }
        let remaining = this.safeCells.filter(cell => cell.dataset.revealed !== 'true');
        if (remaining.length === 0) {
            setTimeout(() => {
                let nBombs = this.bombCells.length;
                let score = (nBombs / seconds).toFixed(2);
                alert(`You won in ${seconds} seconds! You avoided ${nBombs} bombs, with a score of ${score} bombs per second!`);
            }, 1000);
        }
    }

    // > Update #bomb-counter for given grid cells
    updateBombCounter() {
        let flaggedCells = this.cells.filter(cell => cell.dataset.flagged === 'true');
        let nFlags = flaggedCells.length;
        let nBombs = this.bombCells.length;
        bombCounter.innerText = nBombs - nFlags;
    }

    // > Toggle 'flagged' attribute for a given cell, optionally force state
    toggleFlag(cell, state = null) {
        if (cell.dataset.revealed == 'true') {
            return;
        }
        if (state) {
            cell.dataset.flagged = state;
        } else if (cell.dataset.flagged == 'true') {
            cell.dataset.flagged = 'false';
        } else {
            cell.dataset.flagged = 'true';
        }
        this.updateBombCounter();
    }

}

// < ========================================================
// < Toolbar Class (Custom Element)
// < ========================================================

// > Custom #toolbar-container, with .toolbar-row children
class ToolbarContainer {
    constructor() {
        this.element = document.getElementById('toolbar-container');
    }

    // > Add row to the toolbar
    addRow() {
        let row = document.createElement('div');
        row.className = 'toolbar-row';
        this.element.appendChild(row);
    }

    // > Create and add a button to a given row index
    createButton(rowIndex, text, title, onClick = null) {
        let rows = this.element.children.length;
        if (rowIndex >= rows) {
            let needed = rowIndex - rows;
            for (let i = 0; i <= needed; i++) {
                this.addRow();
            }
        }
        const row = this.element.children[rowIndex];
        let button = document.createElement('div');
        button.className = 'toolbar-button';
        button.title = title;
        button.textContent = text;
        if (onClick) {
            button.addEventListener('click', (e) => {
                onClick(e);
            });
        }
        row.appendChild(button);
    }
}

// ! ========================================================
// ! Experimental
// ! ========================================================

/**
 * > Run a single pass to assign flags, then logically deduce safe cells
 *
 * @param {Grid} grid - Grid object
 */
function solveOnce(grid) {
    let revealedNumbers = grid.numberedCells.filter(cell => cell.dataset.revealed == 'true');

    for (let cell of revealedNumbers) {
        let number = Number(cell.dataset.value);
        let adjacentCells = grid.getAdjacentCells(cell);
        let hidden = adjacentCells.filter(cell => cell.dataset.revealed == 'false');
        console.log(`${number} ${hidden.length}`)
        if (number === hidden.length) {
            for (let adjacentCell of hidden) {
                grid.toggleFlag(adjacentCell, 'true');
                adjacentCell.dataset.cause = `C${cell.dataset.col}R${cell.dataset.row}`
            }
        }

        let flagged = hidden.filter(cell => cell.dataset.flagged == 'true');
        if (number === flagged.length) {
            for (let h of hidden) {
                if (h.dataset.flagged == 'false') {
                    h.click();
                }
            }
        }

    }
}

/**
 * > Reveal all cells in the grid
 *
 * @param {Grid} grid - Grid object
 */
function revealAll(grid) {
    for (cell of grid.cells) {
        grid.revealCell(cell)
    }
}

function effectiveAll(grid) {
    let numbered = grid.numberedCells;
    let valid = numbered.filter(cell => cell.dataset.revealed == 'true');
    for (cell of valid) {
        grid.showEffectiveValue(cell);
    }
}

// > Switch to xray mode and control insight for grid cells
function xrayOn(grid) {
    grid.element.dataset.mode = 'xray';

    let allCells = grid.cells;
    for (let cell of allCells) {
        cell.dataset.insightful = 'false';
    }

    let validCells = grid.numberedCells.filter(cell => cell.dataset.revealed == 'true');
    for (cell of validCells) {
        let effectiveValue = grid.getEffectiveValue(cell);
        grid.setTextContent(cell, effectiveValue);
        if (effectiveValue > 0) {
            cell.dataset.insightful = 'true';
        }
        let adjacentCells = grid.getAdjacentCells(cell);

        for (let adjacentCell of adjacentCells) {
            if (adjacentCell.dataset.revealed == 'false' && adjacentCell.dataset.flagged == 'false') {
                adjacentCell.dataset.insightful = 'true';
            }
        }
    }
}

// > Switch to default mode and clear insight
function xrayOff(grid) {
    grid.element.dataset.mode = 'default';
    let allCells = grid.cells;
    for (let cell of allCells) {
        cell.dataset.insightful = 'false';
        if (cell.dataset.revealed == 'true') {
            grid.setTextContent(cell, cell.dataset.value);
        }
    }
}

// > Toggle xray mode on or off
function toggleXray(grid) {
    if (grid.element.dataset.mode == 'default') {
        xrayOn(grid);
    }
    else {
        xrayOff(grid);
    }
}

// < ========================================================
// < Entry Point
// < ========================================================

// > Entry point of the application
function main() {

    grid = new Grid();
    grid.updateBombCounter();

    let tbc = new ToolbarContainer();
    tbc.createButton(0, "-", "", null);
    tbc.createButton(1, "S", "Solve", () => solveOnce(grid));
    tbc.createButton(2, "R", "Reveal", () => revealAll(grid));
    tbc.createButton(3, "E", "Effective", () => effectiveAll(grid));
    tbc.createButton(4, "X", "Toggle xray", () => toggleXray(grid));

    refreshButton.addEventListener('click', (e) => location.reload());

    document.addEventListener('keydown', (e) => {
        toggleXray(grid);
    })

    
    setInterval(() => {
        seconds++;
        let minutes = Math.floor(seconds / 60);
        let secs = seconds % 60;
        clock.textContent = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }, 1000);

}

// < ========================================================
// < Execution
// < ========================================================

main();