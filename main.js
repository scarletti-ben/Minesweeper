// < ========================================================
// < Constants, Variables and Declarations
// < ========================================================

const DEBUG = 0;
const page = document.getElementById('page');
const bombDecimal = 0.18;

// < ========================================================
// < Utility Functions
// < ========================================================

const tools = {

    // > Ensure .hidden css applied to an element
    hide(element) {
        element.classList.add('hidden');
    },

    // > Ensure .hidden css not applied to an element 
    show(element) {
        element.classList.remove('hidden');
    },

    // > Toggle .hidden css for an element
    toggle(element) {
        element.classList.toggle('hidden');
    },

};

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
    }

    // > Create 9x9 cells for the Minesweeper grid
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

    // > Calculate adjacency value for a cell
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

    // > Increment dataset.value for a cell
    incrementCell(cell) {
        let currentValue = Number(cell.dataset.value);
        cell.dataset.value = String(currentValue + 1);
    }

    // > Get cell based on dataset.row and dataset.column
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

    // > Get an array of all adjacent cells
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
            }, 500);
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
// < Document Listeners
// < ========================================================

// > Initialise event listeners
function initListeners() {

    // > Attach anonymous function call to document click event
    document.addEventListener("click", () => {
        
    });

}

// < ========================================================
// < Entry Point
// < ========================================================

// > Entry point of the application
function main() {
    initListeners();
    new Grid();
}

// < ========================================================
// < Execution
// < ========================================================

main();