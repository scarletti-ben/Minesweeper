// < ========================================================
// < Constants, Variables and Declarations
// < ========================================================

const DEBUG = 0;
const page = document.getElementById('page');
const bombDecimal = 0.18;

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
        this.numberedCells = this.safeCells.filter(cell => Number(cell.dataset.value) > 0);
        this.safestCell = this.tagSafestCell();
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

    // > Create the .cell elements for the Grid class object
    createCells() {
        let cells = [];
        for (let row = 1; row <= 9; row++) {
            for (let col = 1; col <= 9; col++) {
                const cell = document.createElement("div");
                cell.classList.add("cell");
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.dataset.value = Math.random() < bombDecimal ? 'B' : '0';
                cell.dataset.revealed = 'false';
                cell.dataset.flagged = 'false';
                cell.addEventListener('click', (e) => {
                    this.check(cell);
                });
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.flag(cell);
                });
                this.element.appendChild(cell);
                cells.push(cell);
            }
        }
        return cells;
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
        cell.dataset.flagged = 'false';
        cell.textContent = cell.dataset.value;
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
                alert("You won!");
            }, 1500);
        }
    }

    // > Add or remove a flag from a given cell
    flag(cell) {
        if (cell.dataset.revealed !== 'true') {
            if (cell.dataset.flagged == 'true') {
                cell.dataset.flagged = 'false';
            }
            else {
                cell.dataset.flagged = 'true';
            }
        }
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
 * Solves the Minesweeper grid by clicking the safest cell.
 *
 * @param {Grid} grid - An instance of the Grid class representing the Minesweeper grid.
 */
function solve(grid) {
    let revealedNumbers = grid.numberedCells.filter(cell => cell.dataset.revealed == 'true');

    for (let cell of revealedNumbers) {
        let number = Number(cell.dataset.value);
        let adjacentCells = grid.getAdjacentCells(cell);
        let hidden = adjacentCells.filter(cell => cell.dataset.revealed == 'false');
        console.log(`${number} ${hidden.length}`)
        if (number === hidden.length) {
            for (let adjacentCell of hidden) {
                adjacentCell.dataset.flagged = 'true';
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

function revealAll(grid) {
    for (cell of grid.cells) {
        grid.revealCell(cell)
    }
}

// < ========================================================
// < Entry Point
// < ========================================================

// > Entry point of the application
function main() {
    let grid = new Grid();

    let tbc = new ToolbarContainer();
    tbc.createButton(0, "-", "", null);
    tbc.createButton(1, "S", "Solve", () => solve(grid));
    tbc.createButton(2, "R", "Reveal", () => revealAll(grid));

    // let start = grid.safestCell;
    // start.click();
    document.addEventListener('keydown', () => {
        solve(grid);
    })
}

// < ========================================================
// < Execution
// < ========================================================

main();