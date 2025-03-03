// < ========================================================
// < Constants, Variables and Declarations
// < ========================================================

let seconds = 0;

// < ========================================================
// < Utility Functions
// < ========================================================

/** @param {Array} array1 @param {Array} array2 @returns {Array} */
function overlap(array1, array2) {
    // > Get an array of elements that exist in both given arrays
    const hashmap = new Set(array2);
    const output = array1.filter(value => hashmap.has(value));
    return output
}

/** @param {Array} array @param {number} n @returns {Array} */
function sample(array, n) {
    // > Get a random sample of n elements from a given array
    const shuffled = array.slice();
    let i = array.length;
    while (i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = temp;
    }
    return shuffled.slice(0, n);
}

/** @param {string} key @param {number} n */
const emulateKeyDowns = (key = ' ', n = 1) => {
    // > Emulate a number of JavaScript keyboard key down events
    for (let i = 0; i < n; i++) {
        const event = new KeyboardEvent('keydown', { key });
        document.dispatchEvent(event);
    }
};

// < ========================================================
// < Tools Object
// < ========================================================

const tools = {

    /** @returns {Cell} */
    getSafestCell() {
        // > Find the cell with the highest number of adjacent cells of value 0
        let zeros = grid.zeros;
        let safest;
        let highest = 0;
        for (let cell of zeros) {
            let z = cell.zeros.length;
            if (z > highest) {
                safest = cell;
                highest = z;
            }
        }
        return safest;
    },

    /** @param {Cell} cell @returns {number | string} */
    effectiveValue(cell) {
        // > Get the effective value of a cell
        let value = cell.value;
        if (value === 'B') {
            return 'B';
        }
        return value - cell.flags.length;
    },

    /** @param {HTMLElement} element @returns {Cell} */
    elementToCell(element) {
        // > Get Cell object associated with a given .cell element
        let row = Number(element.dataset.row);
        let col = Number(element.dataset.col);
        return grid.cell(row, col)
    },

    /** @param {Cell} cell */
    activate(cell) {
        // > Activate a given cell
        if (cell.revealed) {
            return;
        } else if (cell.value === 'B') {
            cell.revealed = true;
            return;
        } else {
            tools.cascade(cell);
        }
        let remaining = grid.hiddenSafes;
        if (remaining.length === 0) {
            setTimeout(() => {
                alert("You won!");
            }, 1500);
        }
    },

    /** @param {Cell} cell */
    cascade(cell) {
        // > Cascade and activate outward from a given cell
        if (cell.revealed) {
            return;
        } else if (cell.value === 'B') {
            return;
        } else if (cell.value > 0) {
            cell.revealed = true;
            return;
        } else {
            cell.revealed = true;
            for (let adjacent of cell.adjacents) {
                tools.cascade(adjacent);
            }
        }
    },

    // ! ========================================================
    // ! Experimental
    // ! ========================================================

    getBonds() {
        let bonds = [];
        let origins = grid.revealedNumbers;
        for (let origin of origins) {
            if (origin.nonflags.length > 0) {
                let value = tools.effectiveValue(origin);
                let bond = new ExactBond(origin, value);
                bonds.push(bond);
            }
        }
        return bonds;
    },

    /** @param {Cell} cell */
    addCornersToCell(cell) {
        const flavours = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
        for (let flavour of flavours) {
            const div = document.createElement('div');
            div.classList.add('corner', flavour);
            cell.element.appendChild(div);
        }
    },

    /** @param {Cell} cell */
    addCornerToCell(cell, flavour, text = '') {
        let current = cell.element.querySelector(`.corner.${flavour}`)
        if (current) {
            current.innerText = text;
            return;
        }
        const div = document.createElement('div');
        div.classList.add('corner', flavour);
        div.innerText = text;
        cell.element.appendChild(div);
    },

    /** @param {Cell} cell @param {ExactBond[]} bonds */
    showBondedValue(cell, bonds) {
        let value = tools.effectiveValue(cell);
        if (value === 0) {
            return;
        }
        for (let bond of bonds) {
            if (bond.parent == cell) {
                continue;
            }
            let bondings = bond.cells;
            let adjacents = cell.hiddens;
            for (let x of bondings) {
                if (adjacents.includes(x)) {
                    console.log('yee')
                }
                else (
                    console.log('nee')
                )
            }
            if (bondings.every(c => adjacents.includes(c))) {
                value -= bond.bombQuantity;
                tools.addCornerToCell(cell, 'bottom-left', value);
                if (value === 0) {
                    for (let c of cell.nonflags) {
                        if (!bondings.includes(c)) {
                            tools.activate(c);
                        }
                    }
                }
            }
        }
    },

    updateBombCounter() {
        // > Update #bomb-counter element
        let flagged = grid.flags.length;
        let bombs = grid.bombs.length;
        document.getElementById('bomb-counter').innerText = bombs - flagged;
    }

}

// < ========================================================
// < Solvers Object
// < ========================================================

const solvers = {

    valueEqualsHidden() {
        // > If a number is touching the same number of hidden cells, then these cells are all mines
        let origins = grid.revealedNumbers;
        for (let origin of origins) {
            let outers = origin.hiddens;
            if (origin.value === outers.length) {
                for (let outer of outers) {
                    outer.flagged = true;
                }
            }
        }
    },

    valueEqualsFlags() {
        // > If a number is touching the same number of flags, then all other adjacent cells are safe
        let origins = grid.revealedNumbers;
        for (let origin of origins) {
            let outers = origin.flags;
            let value = origin.value;
            if (value === outers.length) {
                let nonflags = origin.nonflags;
                for (let nonflag of nonflags) {
                    tools.activate(nonflag);
                }
            }
        }
    },

    effectiveValueEqualsHidden() {
        // > If a number, minus flags, is touching the same number of hidden cells, then these cells are all mines
        let origins = grid.revealedNumbers;
        for (let origin of origins) {
            let outers = origin.hiddens;
            let value = tools.effectiveValue(origin);
            if (value === outers.length) {
                for (let outer of outers) {
                    outer.flagged = true;
                }
            }
        }
    },

    single() {
        solvers.valueEqualsHidden();
        solvers.valueEqualsFlags();
        solvers.effectiveValueEqualsHidden();
    }

    // > If the cell is touching all cells of a minimum bond of another cell, effective value is reduced by the number of bombs in the bond
    // > Reductions and Holes are mostly noticed by current rules
    // > Overflows and Underflows are not yet solved
    // > Long dependency chains are not yet solved
    // > Last turn bomb quantity calculations are not yet solved

}

// < ========================================================
// < Cell Class
// < ========================================================

// > Custom Cell object, with internal .cell element
class Cell {
    constructor(row, col) {
        this.element = document.createElement('div');
        this.element.classList.add("cell");
        this.element.dataset.row = row;
        this.element.dataset.col = col;
        this.element.dataset.value = '0';
        this.revealed = 'false';
        this.flagged = 'false';
        this._adjacents = null;
        this._safes = null;
        this._bombs = null;
        this._numbers = null;
        this._zeros = null;
    }

    /** @returns {Cell[]} */
    get adjacents() {
        // > Get an array of all adjacent cells for this cell
        if (this._adjacents === null) {
            const tr = this.row;
            const tc = this.col;
            let array = [];
            for (let r = tr - 1; r <= tr + 1; r++) {
                for (let c = tc - 1; c <= tc + 1; c++) {
                    if (r === tr && c === tc) {
                        continue;
                    }
                    let cell = grid.cell(r, c);
                    if (cell) {
                        array.push(cell);
                    }
                }
            }
            this._adjacents = array;
        }
        return this._adjacents;
    }

    /** @returns {Cell[]} */
    get safes() {
        // > Get an array of all adjacent safe cells for this cell
        if (this._safes === null) {
            this._safes = overlap(this.adjacents, grid.safes);
        }
        return this._safes;
    }

    /** @returns {Cell[]} */
    get bombs() {
        // > Get an array of all adjacent bomb cells for this cell
        if (this._bombs === null) {
            this._bombs = overlap(this.adjacents, grid.bombs);
        }
        return this._bombs;
    }

    /** @returns {Cell[]} */
    get numbers() {
        // > Get an array of all adjacent number cells for this cell
        if (this._numbers === null) {
            this._numbers = overlap(this.adjacents, grid.numbers);
        }
        return this._numbers;
    }

    /** @returns {Cell[]} */
    get zeros() {
        // > Get an array of all adjacent zero cells for this cell
        if (this._zeros === null) {
            this._zeros = overlap(this.adjacents, grid.zeros);
        }
        return this._zeros;
    }

    /** @returns {Cell[]} */
    get flags() {
        // > Get an array of all adjacent flag cells for this cell
        return overlap(this.adjacents, grid.flags);
    }

    /** @returns {Cell[]} */
    get nonflags() {
        // > Get an array of all adjacent non flag hidden cells for this cell
        return this.hiddens.filter(c => !c.flagged);
    }

    /** @returns {Cell[]} */
    get hiddens() {
        // > Get an array of all adjacent hidden cells for this cell
        return overlap(this.adjacents, grid.hidden);
    }

    /** @returns {number} */
    get row() {
        // > Get the row number for this cell
        return Number(this.element.dataset.row);
    }

    /** @returns {number} */
    get col() {
        // > Get the column number for this cell
        return Number(this.element.dataset.col);
    }

    /** @returns {number | string} */
    get value() {
        // > Get the value for this cell
        if (this.element.dataset.value === 'B') {
            return 'B'
        }
        else {
            return Number(this.element.dataset.value);
        }
    }

    /** @returns {boolean} */
    get revealed() {
        // > Check if this cell is revealed
        return this.element.dataset.revealed === 'true';
    }

    set revealed(value) {
        // > Set the revealed state of this cell
        this.element.dataset.revealed = value;
    }

    /** @returns {boolean} */
    get hidden() {
        // > Check if this cell is hidden via revealed attribute
        return this.element.dataset.revealed === 'false';
    }

    set hidden(value) {
        // > Set the hidden state of this cell via revealed attribute
        this.element.dataset.revealed = !value;
    }

    /** @returns {boolean} */
    get flagged() {
        // > Check if this cell is flagged
        return this.element.dataset.flagged === 'true';
    }

    set flagged(value) {
        // > Set the flagged state of this cell
        this.element.dataset.flagged = value;
    }

    toggleFlag() {
        // > Add or remove flag from this cell
        if (this.flagged) {
            this.flagged = 'false';
        }
        else {
            this.flagged = 'true';
        }
    }

}

// < ========================================================
// < Grid Class
// < ========================================================

// > Custom Grid object, with #grid element as this.element
class Grid {
    static instance = null;
    constructor(rows, cols, difficulty) {
        if (!Grid.instance) {
            Grid.instance = this;
        }
        this.rows = rows;
        this.cols = cols;
        this.difficulty = difficulty;
        document.documentElement.style.setProperty("--rows", rows);
        document.documentElement.style.setProperty("--cols", cols);
        this.element = document.getElementById('grid');
        this.element.innerHTML = '';
        this.element.dataset.mode = 'default';
        this._safes = null;
        this._bombs = null;
        this._numbers = null;
        this._zeros = null;
        this.cells = [];
    }

    populateCells() {
        // > Create an array of Cell objects and return
        for (let row = 1; row <= this.rows; row++) {
            for (let col = 1; col <= this.cols; col++) {
                let cell = new Cell(row, col);
                this.element.appendChild(cell.element);
                this.cells.push(cell);
            }
        }
    }

    assignCellValues() {
        // > Assign initial value to all cells based on adjacency

        let quantity = Math.floor(this.difficulty * this.cells.length);
        console.log(`Bombs to be assigned: ${quantity}`)
        let bombs = sample(this.cells, quantity);
        for (let bomb of bombs) {
            bomb.element.dataset.value = 'B';
            bomb.element.dataset.text = 'B';
            bomb.element.innerText = 'B';
        }

        for (let bomb of this.bombs) {
            let safes = bomb.safes;
            for (let safe of safes) {
                let value = Number(safe.element.dataset.value);
                safe.element.dataset.value = value + 1;
                safe.element.dataset.text = value + 1;
                safe.element.innerText = value + 1;
            }
        }
    }

    initialise() {
        // > Initialise the Grid object by populating cell array
        this.populateCells();
        this.assignCellValues();
    }

    /** @returns {Cell[]} */
    get safes() {
        // > Filter cells to get all non bomb cells, and cache
        if (this._safes === null) {
            this._safes = this.cells.filter(cell => cell.value !== 'B');
        }
        return this._safes;
    }

    /** @returns {Cell[]} */
    get bombs() {
        // > Filter cells to get all bomb cells, and cache
        if (this._bombs === null) {
            this._bombs = this.cells.filter(cell => cell.value === 'B');
        }
        return this._bombs;
    }

    /** @returns {Cell[]} */
    get numbers() {
        // > Filter cells to get all number cells, and cache
        if (this._numbers === null) {
            this._numbers = this.cells.filter(cell => cell.value > 0);
        }
        return this._numbers;
    }

    /** @returns {Cell[]} */
    get zeros() {
        // > Filter cells to get all zero cells, and cache
        if (this._zeros === null) {
            this._zeros = this.cells.filter(cell => cell.value === 0);
        }
        return this._zeros;
    }

    /** @returns {Cell[]} */
    get revealed() {
        // > Filter cells to get all revealed cells
        return this.cells.filter(cell => cell.revealed);
    }

    /** @returns {Cell[]} */
    get hidden() {
        // > Filter cells to get all hidden cells
        return this.cells.filter(cell => !cell.revealed);
    }

    /** @returns {Cell[]} */
    get flags() {
        // > Filter cells to get all flagged cells
        return this.cells.filter(cell => cell.flagged);
    }

    /** @returns {Cell[]} */
    get hiddenSafes() {
        // > Filter cells to get all hidden safe cells
        return overlap(this.hidden, this.safes);
    }

    /** @returns {Cell[]} */
    get revealedSafes() {
        // > Filter cells to get all revealed safe cells
        return overlap(this.revealed, this.safes);
    }

    /** @returns {Cell[]} */
    get hiddenBombs() {
        // > Filter cells to get all hidden bomb cells
        return overlap(this.hidden, this.bombs);
    }

    /** @returns {Cell[]} */
    get revealedBombs() {
        // > Filter cells to get all revealed bomb cells
        return overlap(this.revealed, this.bombs);
    }

    /** @returns {Cell[]} */
    get hiddenNumbers() {
        // > Filter cells to get all hidden number cells
        return overlap(this.hidden, this.numbers);
    }

    /** @returns {Cell[]} */
    get revealedNumbers() {
        // > Filter cells to get all revealed number cells
        return overlap(this.revealed, this.numbers);
    }

    /** @returns {Cell[]} */
    get hiddenZeros() {
        // > Filter cells to get all hidden zero cells
        return overlap(this.hidden, this.zeros);
    }

    /** @returns {Cell[]} */
    get revealedZeros() {
        // > Filter cells to get all revealed zero cells
        return overlap(this.revealed, this.zeros);
    }

    // > Index lookup to get cell from a given row and column
    /** @param {number | string} col @param {number | string} row @returns {Cell} */
    cell(row, col) {
        row = Number(row);
        col = Number(col);
        if (row < 1 || col < 1 || row > this.rows || col > this.cols) {
            return null;
        }
        let index = (row - 1) * this.cols + (col - 1);
        return this.cells[index]
    }

}

// < ========================================================
// < Bond Classes
// < ========================================================

class ExactBond {
    /** @param {Cell} parent @param {number} bombQuantity */
    constructor(parent, bombQuantity) {
        this.parent = parent;
        this.cells = parent.nonflags;
        this.bombQuantity = bombQuantity;
    }
}

// < ========================================================
// < Toolbar Class
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

// < ========================================================
// < Document Listeners
// < ========================================================

// > Initialise event listeners
function initListeners() {

    // > Add event listener to left click
    document.addEventListener("click", (e) => {
        if (e.target.classList.contains('cell')) {
            let cell = tools.elementToCell(e.target);
            tools.activate(cell);
        }
    });

    // > Add event listener to right click
    document.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        if (e.target.classList.contains('cell')) {
            let cell = tools.elementToCell(e.target);
            if (!cell.revealed) {
                cell.toggleFlag();
            }
        }
    });

    // > Add event listener to key down
    document.addEventListener('keydown', (e) => {
        if (e.key == ' ') {
            solvers.single();
        } else if (e.key == '1') {
            let bonds = tools.getBonds();
            for (let bond of bonds) {
                tools.addCornerToCell(bond.parent, 'top-left', bond.bombQuantity);
                let r = bond.parent.row;
                let c = bond.parent.col;
                for (let cell of bond.cells) {
                    tools.addCornerToCell(cell, 'bottom-right', `${c}.${r}`);
                }
            }
        } else if (e.key == '2') {
            let bonds = tools.getBonds();
            for (let cell of grid.revealedNumbers) {
                tools.showBondedValue(cell, bonds);
            }
        }
    });

}

// < ========================================================
// < Entry Point
// < ========================================================

let grid = new Grid(8, 20, 0.18 + 0.09);
grid.initialise();
initListeners();

async function main() {
    // > Entry point of the application
    let safest = tools.getSafestCell();
    tools.activate(safest);
    emulateKeyDowns(' ', 5);

    let tbc = new ToolbarContainer();
    tbc.createButton(0, "-", "", null);
    tbc.createButton(1, "S", "Solve", () => solvers.single());

    setInterval(() => {
        seconds++;
        let minutes = Math.floor(seconds / 60);
        let secs = seconds % 60;
        clock.textContent = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }, 1000);

    tools.updateBombCounter();

    document.getElementById('refresh-button').addEventListener('click', (e) => location.reload());

}

// < ========================================================
// < Execution
// < ========================================================

main();