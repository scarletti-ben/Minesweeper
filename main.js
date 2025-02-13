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

    // > Log text and level, alert for warn / error if DEBUG
    log(text, level = 'log') {
        if (level === 'log') {
            console.log(text);
        } else if (level === 'info') {
            console.info(text);
        } else if (level === 'warn') {
            console.warn(text);
            if (DEBUG > 0) {
                alert(text);
            }
        } else if (level === 'error') {
            console.error(text);
            if (DEBUG > 0) {
                alert(text);
            }
        } else if (level === 'debug') {
            console.debug(text);
        } else if (level === 'trace') {
            console.trace(text);
        } else {
            console.log(`Invalid log level ${level}`, text);
        }
    },

    // > Get ISO date time string YYYY-MM-DDTHH:mm:ss.sssZ
    getDateString() {
        const date = new Date();
        const string = date.toISOString();
        return string;
    },

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
// < Core Functionality
// < ========================================================



// < ========================================================
// < Objects
// < ========================================================

// > Custom HTML element, with this.element attribute
class Grid {
    constructor() {
        this.element = document.createElement('div');
        this.element.id = "grid";
        page.appendChild(this.element);
        this.cells = this.createCells();
        this.assignValues();
        // this.showValues();
        this.safeCells = this.cells.filter(cell => cell.dataset.value !== 'B');
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

    // > Increment dataset.value for a cell
    incrementCell(cell) {
        let currentValue = Number(cell.dataset.value);
        cell.dataset.value = String(currentValue + 1);
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

    // > Reveal outward from a given cell
    revealOutward(cell) {
        if (cell.dataset.revealed == 'true') {
            return;
        }
        else if (cell.dataset.value == 'B') {
            return;
        }
        else if (Number(cell.dataset.value) > 0) {
            cell.textContent = cell.dataset.value;
            cell.dataset.revealed = 'true'
            return;
        }
        else {
            cell.textContent = cell.dataset.value;
            cell.dataset.revealed = 'true'
            let adjacentCells = this.getAdjacentCells(cell);
            for (let cell of adjacentCells) {
                this.revealOutward(cell);
            }
        }
    }

    // > Calculate adjacency value for a cell
    calculateValue(cell) {
        cell.dataset.value = value;
    }

    // > Check a clicked cell
    check(cell) {
        if (cell.dataset.revealed == 'true') {
            return
        }
        else if (cell.dataset.value == 'B') {
            cell.textContent = cell.dataset.value;
            setTimeout(() => {
                console.log('Bomb')
            }, 500);
        }
        else {
            this.revealOutward(cell)
        }
        let remaining = this.safeCells.filter(cell => cell.dataset.revealed !== 'true');
        console.log(remaining.length === 0);
        if (remaining.length === 0) {
            alert("You won!")
        }
    }

    // > Create 9x9 cells for the Minesweeper grid
    createCells() {
        let cells = [];
        for (let row = 1; row <= 9; row++) {
            for (let col = 1; col <= 9; col++) {
                let value = Math.random() < bombDecimal ? 'B' : '0';
                const cell = document.createElement("div");
                cell.classList.add("cell");
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.dataset.value = value;
                cell.textContent = '';
                cell.dataset.revealed = 'false';
                this.element.appendChild(cell);
                cell.addEventListener('click', () => {
                    this.check(cell);
                })
                cells.push(cell);
            }
        }
        return cells;
    }

    // > Show all values in grid as textContent
    showValues() {
        for (let cell of this.cells) {
            cell.textContent = cell.dataset.value;
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
    let grid = new Grid();

}

// < ========================================================
// < Execution
// < ========================================================

main();