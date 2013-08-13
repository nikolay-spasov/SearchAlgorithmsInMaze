(function () {
    'use strict';

    function Cell(row, col, cellSize) {
        this.row = row;
        this.col = col;
        this.walls = { left: true, right: true, up: true, down: true };
        this.cellSize = cellSize;
    }

    Cell.prototype.removeWall = function (direction) {
        if (this.walls.hasOwnProperty(direction)) this.walls[direction] = false;
    };
    Cell.prototype.draw = function (ctx) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.col * this.cellSize, this.row * this.cellSize,
            this.cellSize, this.cellSize);

        ctx.strokeStyle = '#00f';
        if (this.walls['left'] === true) {
            ctx.beginPath();
            ctx.moveTo(this.col * this.cellSize, this.row * this.cellSize);
            ctx.lineTo(this.col * this.cellSize, (this.row + 1) * this.cellSize);
            ctx.stroke();
        }
        if (this.walls['right'] === true) {
            ctx.beginPath();
            ctx.moveTo((this.col + 1) * this.cellSize, this.row * this.cellSize);
            ctx.lineTo((this.col + 1) * this.cellSize, (this.row + 1) * this.cellSize);
            ctx.stroke();
        }
        if (this.walls['up'] === true) {
            ctx.beginPath();
            ctx.moveTo(this.col * this.cellSize, this.row * this.cellSize);
            ctx.lineTo((this.col + 1) * this.cellSize, this.row * this.cellSize);
            ctx.stroke();
        }
        if (this.walls['down'] === true) {
            ctx.beginPath();
            ctx.moveTo(this.col * this.cellSize, (this.row + 1) * this.cellSize);
            ctx.lineTo((this.col + 1) * this.cellSize, (this.row + 1) * this.cellSize);
            ctx.stroke();
        }
    };

    var canvas,
        ctx,
        bfsBtn,
        dfsBtn,
        generateBtn,
        sizeSelect,
        mazeGenerationInterval = null,
        mazeTraversalInterval = null,
        rows,
        cols,
        cellSize,
        maze = [],
        visited = [],
        unvisitedCellsCount = rows * cols,
        generated = false;

    window.onload = function () {
        canvas = document.getElementById('maze');
        ctx = canvas.getContext('2d');

        bfsBtn = document.getElementById('bfs');
        dfsBtn = document.getElementById('dfs');
        generateBtn = document.getElementById('generate-btn');
        sizeSelect = document.getElementById('maze-size');

        generateBtn.addEventListener('click', function () {
            var value = sizeSelect.options[sizeSelect.selectedIndex].value,
                splt = value.split(' x ');

            rows = parseInt(splt[0]);
            cols = parseInt(splt[1]);
            unvisitedCellsCount = rows * cols;
            generated = false;

            cellSize = Math.round(canvas.width / cols);

            generateMaze();

        }, false);

        bfsBtn.addEventListener('click', function () {
            if (unvisitedCellsCount === 0) traverse(0, 0, 'bfs');
        }, false);

        dfsBtn.addEventListener('click', function () {
            if (unvisitedCellsCount === 0) traverse(0, 0, 'dfs');
        }, false);
    };

    function draw() {
        for (var row = 0; row < rows; row++) {
            for (var col = 0; col < cols; col++) {
                maze[row][col].draw(ctx);
            }
        }

        if (generated === true) {
            // Draw exit
            ctx.fillStyle = '#f00';
            ctx.fillRect((cols - 1) * cellSize + 2, (rows - 1) * cellSize + 2, cellSize - 4, cellSize - 4);
            // Draw enterance
            ctx.fillStyle = '#0f0';
            ctx.fillRect(2, 2, cellSize - 4, cellSize - 4);
        }
    }

    function clearMazeIntervals() {
        if (mazeGenerationInterval) clearInterval(mazeGenerationInterval);
        if (mazeTraversalInterval) clearInterval(mazeTraversalInterval);
    }

    function generateMaze() {
        generated = false;
        // Init maze with cells
        for (var row = 0; row < rows; row++) {
            maze[row] = [];
            visited[row] = [];
            for (var col = 0; col < cols; col++) {
                maze[row][col] = new Cell(row, col, cellSize);
                visited[row][col] = false;
            }
        }

        var current = maze[0][0],
            stack = [];

        visited[current.row][current.col] = true;
        unvisitedCellsCount--;

        if (mazeGenerationInterval) clearMazeIntervals();
        
        mazeGenerationInterval = setInterval(function () {
            if (unvisitedCellsCount > 0) {
                var nbors = getNeighbors(current);
                shuffleNeighbors(nbors);

                if (nbors.length > 0) {
                    var chosen = nbors.shift();
                    stack.push(current);
                    removeWallsBetween(current, chosen);
                    current = chosen;
                    visited[current.row][current.col] = true;
                    unvisitedCellsCount--;
                    draw();
                } else if (stack.length > 0) {
                    current = stack.pop();
                } else {
                    current = getFirstNotVisitedCell();
                    visited[notVisited.row][notVisited.col] = true;
                    unvisitedCellsCount--;
                    draw();
                }
            } else {
                clearInterval(mazeGenerationInterval);
                generated = true;
                draw();
            }
        }, 10);
    }

    function shuffleNeighbors(nbors) {
        for (var i = 0; i < nbors.length; i++) {
            var index = Math.floor(Math.random() * nbors.length);
            var temp = nbors[i];
            nbors[i] = nbors[index];
            nbors[index] = temp;
        }
    }

    function getFirstNotVisitedCell() {
        var row, col;

        for (row = 0; row < rows; row++) {
            for (col = 0; col < cols; col++) {
                if (!visited[row][col]) return maze[row][col];
            }
        }
        return null;
    }

    function removeWallsBetween(c1, c2) {
        if (c1.row > c2.row && c1.col === c2.col) {
            c1.removeWall('up');
            c2.removeWall('down');
        } else if (c1.row < c2.row && c1.col === c2.col) {
            c1.removeWall('down');
            c2.removeWall('up');
        } else if (c1.col > c2.col && c1.row === c2.row) {
            c1.removeWall('left');
            c2.removeWall('right');
        } else if (c1.col < c2.col && c1.row === c2.row) {
            c1.removeWall('right');
            c2.removeWall('left');
        }
    }

    function getNeighbors(cell) {
        var nbors = [];
        if (cell.row - 1 >= 0 && !visited[cell.row - 1][cell.col]) {
            nbors.push(maze[cell.row - 1][cell.col]);
        }
        if (cell.row + 1 < rows && !visited[cell.row + 1][cell.col]) {
            nbors.push(maze[cell.row + 1][cell.col]);
        }
        if (cell.col - 1 >= 0 && !visited[cell.row][cell.col - 1]) {
            nbors.push(maze[cell.row][cell.col - 1]);
        }
        if (cell.col + 1 < cols && !visited[cell.row][cell.col + 1]) {
            nbors.push(maze[cell.row][cell.col + 1]);
        }

        return nbors;
    }

    function traverse(startRow, startCol, searchType) {
        var visited = [];
        for (var row = 0; row < rows; row++) {
            visited[row] = [];
            for (var col = 0; col < cols; col++) {
                visited[row][col] = false;
            }
        }

        var pathTree = [];
        pathTree.push({ row: startRow, col: startCol, parent: null });

        draw();

        clearMazeIntervals();
        mazeTraversalInterval = setInterval(function () {
            if (pathTree.length > 0) {
                var current;
                if (searchType === 'bfs') current = pathTree.shift();
                else current = pathTree.pop();
                visited[current.row][current.col] = true;

                ctx.fillStyle = '#999';
                ctx.fillRect(current.col * cellSize + 2, current.row * cellSize + 2, cellSize - 4, cellSize - 4);

                if (current.row === rows - 1 && current.col === cols - 1) {
                    clearMazeIntervals();
                    pathTree.push(current);
                    drawPath(pathTree);
                    return;
                }

                if (current.row - 1 >= 0 && !visited[current.row - 1][current.col] && !maze[current.row][current.col].walls['up']) {
                    pathTree.push({ row: current.row - 1, col: current.col, parent: current });
                }
                if (current.row + 1 < rows && !visited[current.row + 1][current.col] && !maze[current.row][current.col].walls['down']) {
                    pathTree.push({ row: current.row + 1, col: current.col, parent: current });
                }
                if (current.col - 1 >= 0 && !visited[current.row][current.col - 1] && !maze[current.row][current.col].walls['left']) {
                    pathTree.push({ row: current.row, col: current.col - 1, parent: current });
                }
                if (current.col + 1 < cols && !visited[current.row][current.col + 1] && !maze[current.row][current.col].walls['right']) {
                    pathTree.push({ row: current.row, col: current.col + 1, parent: current });
                }
            }
        }, 100);

        draw();
    }

    function drawPath(pathTree) {
        draw();

        var current = pathTree.pop();

        while (current) {
            ctx.fillStyle = '#f00';
            ctx.fillRect(current.col * cellSize + 2, current.row * cellSize + 2, cellSize - 4, cellSize - 4);

            current = current.parent;
        }
    }

}());