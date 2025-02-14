# Minesweeper

## Overview
Project to recreate Minesweeper using pure HTML / CSS / JavaScript

## Work in Progress
Alter grid dataset to allow for different modes that `CSS` can respond to
```css
#grid[data-mode="default"] .cell[data-text="0"] {
  color: transparent;
}
#grid[data-mode="xray"] .cell[data-text="0"] {
  color: white;
}
```
- Added `this.element.dataset.mode = 'default';` to the constructor of `Grid` class


## Features New to v0.2.0-beta
Added a recommended starting cell or 'safest cell' that appears on load and finds the cell with the greatest number of adjacent '0' cells

Added a toolbar to run functions, allowing use on desktop and mobile

Added solving function that currently does a single pass to assign flags, and then 'click' any cells deduced to be definitely safe
  - This function does not have complex solving capabilities, one example is that it does not know to logically deduce a `1-2-1`

Added a revealing function to reveal all cells, useful for debugging

## Features for v0.1.0-alpha
Generation of a 9x9 grid as a custom element `class Grid`, where if instantiating via `let grid = new Grid()` you would find `grid.element` to be the `#grid` element in the `DOM`

Use of `HTML` dataset attributes to assign attributes to elements. And completely random assignment of bombs defined by `const bombDecimal = 0.18`
```javascript
for (let col = 1; col <= 9; col++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    cell.dataset.row = row;
    cell.dataset.col = col;
    cell.dataset.value = Math.random() < bombDecimal ? 'B' : '0';
    cell.dataset.revealed = 'false';
    cell.dataset.flagged = 'false';
    ...
}
```

Simple recursive function to reveal cells on click
```javascript
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
```

Simple flagging by adding a `contextmenu` listener to cells
```javascript
cell.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    this.flag(cell);
});
```

Cell colouring handled primarily via `CSS` selectors
```css
.cell:hover {
  background-color: rgba(48, 48, 48, 1.0);
  border: 1px solid grey;
  transform: translateY(-4px);
}

.cell[data-revealed="true"] {
  background-color: blanchedalmond;
}

.cell[data-value="B"] {
  color: black;
}

.cell[data-revealed="true"][data-value="B"] {
  background-color: red;
  color: white;
}

.cell[data-value='0'] {
  color: transparent;
}

.cell[data-value='1'] {
  color: rgb(0, 0, 255);
}
```

Simple win condition check using filter for list comprehension
```javascript
let remaining = this.safeCells.filter(cell => cell.dataset.revealed !== 'true');
if (remaining.length === 0) {
    setTimeout(() => {
        alert("You won!");
    }, 500);
}
```

# Disclaimer
No code from the original game was used in this project, and this project is not affiliated with, nor endorsed by, any person or legal entity related to the original game `Minesweeper`