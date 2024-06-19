const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

if (localStorage.getItem("Slitherlink_runner_triangle_localhighscore_normal") === null) {
    localStorage.setItem("Slitherlink_runner_triangle_localhighscore_normal", 0);
}
if (localStorage.getItem("Slitherlink_runner_triangle_localhighscore_randomonly") === null) {
    localStorage.setItem("Slitherlink_runner_triangle_localhighscore_randomonly", 0);
}


// game全般のこと
const game = {
    status: 0, // 0:タイトル画面, 1:ゲーム画面, 2:ゲーム開始待ち, 3:ゲームオーバー
    mode: 1, //0: randomonly mode , 1: normal mode
    difficulty: 0, // Easy :0, Normal :1, Hard :2
    mass: 85, // マスのサイズ
    mass_height: 85 * 0.8660254037844386, //マスの高さ。game.mass*√3/2
    leftmargin: 50, // 左の余白
    upmargin: 150, // 上の余白
    radius: 10, // 半径
    gameendtimecount: null,
    highscore_normal: localStorage.getItem("Slitherlink_runner_triangle_localhighscore_normal"),
    highscore_randomonly: localStorage.getItem("Slitherlink_runner_triangle_localhighscore_randomonly")
}

// 一つのgameに登場する記号たち
const one_game = {
    // 盤面のサイズ
    masume_tate: 9,
    masume_yoko: 595,
    Board: [], // 盤面の数字
    Board2: [], // 盤面の周囲の辺のうち使われた数
    Used: [], // 使われた頂点
    Used_t: [],// 使われた辺、縦。
    Used_y: [],// 使われた辺、横。
    my_x: 2,
    my_y: 4,
    passedtime: 0,
    life: 3,
    score: 0
}
// ハートマーク
function bezier_heart(x, y, size, color = 0) {
    ctx.beginPath();
    let height = 15 * (1 - size);
    ctx.moveTo(x, y + height);
    ctx.bezierCurveTo(x - 20 * size, y - 15 * size + height, x - 23 * size, y + 9 * size + height, x, y + 26 * size + height);
    ctx.bezierCurveTo(x + 24 * size, y + 10 * size + height, x + 20 * size, y - 15 * size + height, x, y + height);

    ctx.lineWidth = 1;
    ctx.strokeStyle = "#000000"//ee6c8a";

    if (size === 1) {
        ctx.fillStyle = "#ff6c8a";
    }
    else {
        ctx.fillStyle = "#6c8aff";
    }

    if (color === 1) {
        ctx.fillStyle = "grey";
    }
    ctx.fill();
    ctx.stroke();
}

// 完全ランダムの場合
function initialize_board() {
    const Board = Array(one_game.masume_tate - 1).fill().map(() => Array(one_game.masume_yoko * 2).fill(-1));
    const Board2 = Array(one_game.masume_tate - 1).fill().map(() => Array(one_game.masume_yoko * 2).fill(0));
    const Used = Array(one_game.masume_tate).fill().map(() => Array(one_game.masume_yoko * 2).fill(0));
    const Used_t = Array(one_game.masume_tate).fill().map(() => Array(one_game.masume_yoko * 2).fill(0));
    const Used_y = Array(one_game.masume_tate).fill().map(() => Array(one_game.masume_yoko).fill(0));
    const my_x = 2;
    const my_y = 4;
    const passedtime = 0;
    const life = 3;

    Used[my_y][my_x] = 1;

    for (let y = 0; y < one_game.masume_tate - 1; y++) {
        for (let x = 5; x < one_game.masume_yoko; x++) {
            if (Math.random() > 0.85 - x / 20000) {
                Board[y][x] = Math.floor(Math.random() * 3);
            }
        }
    }

    for (let y = 0; y < one_game.masume_tate - 1; y++) {
        for (let x = 0; x < 4; x++) {
            if (y - x === 0) {
                Board[y][x] = 0;
            }
            if (y - x === -1) {
                Board[y][x] = 0;
            }
            if (one_game.masume_tate - 2 - y === x) {
                Board[y][x] = 0;
            }
            if (one_game.masume_tate - 1 - y === x) {
                Board[y][x] = 0;
            }
        }
    }

    return [Board, Board2, Used, Used_t, Used_y, my_x, my_y, passedtime, life]
}

// 数字の配列Aだけを全て使う
function include_board(Board, B, A, l, r) {
    for (let x = l; x < r; x++) {
        for (let y = 0; y < one_game.masume_tate - 1; y++) {
            if (A.includes(B[y][x])) {
                Board[y][x] = B[y][x];
            }
        }
    }
    return Board
}

// rand は盤面に数字を配置する確率
// rand = 0.15 + x/20000 が基準
function random_board(Board, B, rand, l, r) {
    for (let x = l; x < r; x++) {
        for (let y = 0; y < one_game.masume_tate - 1; y++) {
            if (Math.random() < rand) {
                Board[y][x] = B[y][x];
            }
        }
    }
    return Board
}

function naname_board(Board, B, rand, l, r) {
    for (let x = l; x < r; x++) {
        for (let y = 0; y < one_game.masume_tate - 1; y++) {
            if ((x + y) % 2 === 0 && Math.random() < rand) {
                Board[y][x] = B[y][x];
            }
        }
    }
    return Board
}

function naname_board2(Board, B, l, r) {
    for (let x = l; x < r; x++) {
        for (let y = 0; y < one_game.masume_tate - 1; y++) {
            if ((x % 7 === y % 7) || (x % 7 === (y + 1) % 7)) {
                Board[y][x] = B[y][x];
            }
        }
    }
    return Board
}

// ylen*xlenの長方形に配置
function rect_board(Board, B, rand, l, r, xlen, ylen) {
    for (let x = l; x < r; x++) {
        for (let y = 0; y < one_game.masume_tate - 1; y++) {
            if (y - 1 >= 0 && Board[y - 1][x] != -1) {
                continue;
            }
            if (y + ylen < one_game.masume_tate - 1 && Board[y + ylen][x - 1] != -1) {
                continue
            }

            if (Board[y][x - 1] != -1) {
                continue
            }

            if (Math.random() < rand) {
                for (let xx = x; xx < x + xlen; xx++) {
                    for (let yy = y; yy < y + ylen; yy++) {
                        if (l <= xx && xx < r && yy < one_game.masume_tate - 1) {
                            Board[yy][xx] = B[yy][xx];
                        }
                    }
                }
            }
        }
    }

    return Board
}

// random → 0 → 2*2 → 1 → random → 2 → 3*3 → 0,3 → 斜め祭り →randomだが量が多い
function initializeBoard_normal() {
    const T = Array.from({ length: one_game.masume_tate }, () => Array(one_game.masume_yoko * 2).fill(0));
    const Y = Array.from({ length: one_game.masume_tate }, () => Array(one_game.masume_yoko).fill(0));

    for (let j = 0; j < one_game.masume_yoko * 2; j++) {
        Y[4][j] = 1;
    }

    let Sumline = one_game.masume_yoko * 2;

    // 自分（面）の周囲の辺のうち使っている本数
    function three_direction(x, y) {
        const RET = [T[x][y], T[x][y + 1]];

        if (x % 2 === 0) {
            if (y % 2 === 0) {
                RET.push(Y[x][(y / 2) | 0]);
            }
            else {
                RET.push(Y[x + 1][(y / 2) | 0]);
            }
        }
        else {
            if (y % 2 === 0) {
                RET.push(Y[x + 1][(y / 2) | 0]);
            }
            else {
                RET.push(Y[x][(y / 2) | 0]);
            }
        }

        return RET.reduce((a, b) => a + b, 0);
    }

    // 自分（頂点）の周囲の辺のうち使っている本数
    function six_direction(x, y) {
        const RET = [];

        RET.push(Y[x][y]);
        if (y - 1 >= 0) {
            RET.push(Y[x][y - 1])
        }

        if (x % 2 === 0) {
            RET.push(T[x][y * 2])
            RET.push(T[x][y * 2 - 1])
            if (x - 1 >= 0) {
                RET.push(T[x - 1][y * 2])
                RET.push(T[x - 1][y * 2 - 1])
            }
        }
        else {
            RET.push(T[x][y * 2])
            RET.push(T[x][y * 2 + 1])
            if (x - 1 >= 0) {
                RET.push(T[x - 1][y * 2])
                RET.push(T[x - 1][y * 2 + 1])
            }
        }

        return RET.reduce((a, b) => a + b, 0);
    }

    for (let i = 0; i < 50000; i++) {
        const x = Math.floor(Math.random() * (T.length - 2));
        const y = Math.floor(Math.random() * (T[0].length - 12) + 10);

        let SUM = three_direction(x, y);

        if (SUM === 1) {
            if (Sumline > one_game.masume_yoko * 7) {
                continue
            }

            if (x % 2 === 0) {
                if (y % 2 === 0) {
                    if (T[x][y] === 1) {
                        if (six_direction(x, ((y / 2) | 0) + 1) === 0) {
                            T[x][y] ^= 1
                            T[x][y + 1] ^= 1
                            Y[x][(y / 2) | 0] ^= 1
                            Sumline += 1;
                        }
                    }
                    else if (T[x][y + 1] === 1) {
                        if (six_direction(x, ((y / 2) | 0)) === 0) {
                            T[x][y] ^= 1
                            T[x][y + 1] ^= 1
                            Y[x][(y / 2) | 0] ^= 1
                            Sumline += 1;
                        }

                    }
                    else if (Y[x][(y / 2) | 0] === 1) {
                        if (six_direction(x + 1, ((y / 2) | 0)) === 0) {
                            T[x][y] ^= 1
                            T[x][y + 1] ^= 1
                            Y[x][(y / 2) | 0] ^= 1
                            Sumline += 1;
                        }
                    }
                }
                else {
                    if (T[x][y] === 1) {
                        if (six_direction(x + 1, ((y / 2) | 0) + 1) === 0) {
                            T[x][y] ^= 1
                            T[x][y + 1] ^= 1
                            Y[x + 1][(y / 2) | 0] ^= 1
                            Sumline += 1;
                        }
                    }
                    else if (T[x][y + 1] === 1) {
                        if (six_direction(x + 1, ((y / 2) | 0)) === 0) {
                            T[x][y] ^= 1
                            T[x][y + 1] ^= 1
                            Y[x + 1][(y / 2) | 0] ^= 1
                            Sumline += 1;
                        }

                    }
                    else if (Y[x + 1][(y / 2) | 0] === 1) {
                        if (six_direction(x, ((y / 2) | 0) + 1) === 0) {
                            T[x][y] ^= 1
                            T[x][y + 1] ^= 1
                            Y[x + 1][(y / 2) | 0] ^= 1
                            Sumline += 1;
                        }
                    }
                }
            }
            else {
                if (y % 2 === 0) {
                    if (T[x][y] === 1) {
                        if (six_direction(x + 1, ((y / 2) | 0) + 1) === 0) {
                            T[x][y] ^= 1
                            T[x][y + 1] ^= 1
                            Y[x + 1][(y / 2) | 0] ^= 1
                            Sumline += 1;
                        }
                    }
                    else if (T[x][y + 1] === 1) {
                        if (six_direction(x + 1, ((y / 2) | 0)) === 0) {
                            T[x][y] ^= 1
                            T[x][y + 1] ^= 1
                            Y[x + 1][(y / 2) | 0] ^= 1
                            Sumline += 1;
                        }

                    }
                    else if (Y[x + 1][(y / 2) | 0] === 1) {
                        if (six_direction(x, ((y / 2) | 0)) === 0) {
                            T[x][y] ^= 1
                            T[x][y + 1] ^= 1
                            Y[x + 1][(y / 2) | 0] ^= 1
                            Sumline += 1;
                        }
                    }
                }
                else {
                    if (T[x][y] === 1) {
                        if (six_direction(x, ((y / 2) | 0) + 1) === 0) {
                            T[x][y] ^= 1
                            T[x][y + 1] ^= 1
                            Y[x][(y / 2) | 0] ^= 1
                            Sumline += 1;
                        }
                    }
                    else if (T[x][y + 1] === 1) {
                        if (six_direction(x, ((y / 2) | 0)) === 0) {
                            T[x][y] ^= 1
                            T[x][y + 1] ^= 1
                            Y[x][(y / 2) | 0] ^= 1
                            Sumline += 1;
                        }

                    }
                    else if (Y[x][(y / 2) | 0] === 1) {
                        if (six_direction(x + 1, ((y / 2) | 0) + 1) === 0) {
                            T[x][y] ^= 1
                            T[x][y + 1] ^= 1
                            Y[x][(y / 2) | 0] ^= 1
                            Sumline += 1;
                        }
                    }
                }
            }
        }
        // else if (SUM === 2) {
        //     if (x % 2 === 0) {
        //         if (y % 2 === 0) {
        //             T[x][y] ^= 1
        //             T[x][y + 1] ^= 1
        //             Y[x][(y / 2) | 0] ^= 1
        //         }
        //         else {
        //             T[x][y] ^= 1
        //             T[x][y + 1] ^= 1
        //             Y[x + 1][(y / 2) | 0] ^= 1
        //         }
        //     }
        //     else {
        //         if (y % 2 === 0) {
        //             T[x][y] ^= 1
        //             T[x][y + 1] ^= 1
        //             Y[x + 1][(y / 2) | 0] ^= 1
        //         }
        //         else {
        //             T[x][y] ^= 1
        //             T[x][y + 1] ^= 1
        //             Y[x][(y / 2) | 0] ^= 1
        //         }
        //     }
        // }
    }

    const B = Array(one_game.masume_tate - 1).fill().map(() => Array(one_game.masume_yoko * 2).fill(0));

    let Board = Array(one_game.masume_tate - 1).fill().map(() => Array(one_game.masume_yoko * 2).fill(-1));
    const Board2 = Array(one_game.masume_tate - 1).fill().map(() => Array(one_game.masume_yoko * 2).fill(0));
    const Used = Array(one_game.masume_tate).fill().map(() => Array(one_game.masume_yoko).fill(0));
    const Used_t = Array(one_game.masume_tate).fill().map(() => Array(one_game.masume_yoko * 2).fill(0));
    const Used_y = Array(one_game.masume_tate).fill().map(() => Array(one_game.masume_yoko).fill(0));
    const my_x = 2;
    const my_y = 4;
    const passedtime = 0;
    const life = 3;



    Used[my_y][my_x] = 1;

    for (let y = 0; y < one_game.masume_tate - 1; y++) {
        for (let x = 0; x < one_game.masume_yoko * 2; x++) {
            B[y][x] = three_direction(y, x);
        }
    }

    //random → 0 → 2*2 → 1 → random → 2 → 3*3 → 0,3 → 斜め祭り →randomだが量が多い

    Board = random_board(Board, B, 0.15 + 25 / 20000, 10, 59)

    Board = random_board(Board, B, (0.15 + 75 / 20000) / 5, 59, 118)
    Board = include_board(Board, B, [0], 59, 118)

    Board = rect_board(Board, B, 0.15 + 125 / 20000, 118, 177, 2, 1)

    Board = random_board(Board, B, (0.15 + 175 / 20000) / 5, 177, 236)
    Board = include_board(Board, B, [1], 177, 236)

    Board = random_board(Board, B, 0.15 + 225 / 20000, 236, 295)

    Board = random_board(Board, B, (0.15 + 275 / 20000) / 5, 295, 354)
    Board = include_board(Board, B, [2], 295, 354)

    Board = rect_board(Board, B, (0.15 + 325 / 20000) / 2, 354, 413, 3, 2)

    //Board = include_board(Board, B, [0, 2], 413, 472)
    Board = naname_board2(Board, B, 413, 472)

    Board = naname_board(Board, B, (0.15 + 425 / 20000) * 2, 472, 531)

    Board = random_board(Board, B, (0.15 + 475 / 20000) * 2, 531, 590)


    // repeat
    Board = random_board(Board, B, 0.15 + 525 / 20000, 590, 649)

    Board = random_board(Board, B, (0.15 + 575 / 20000) / 5, 649, 708)
    Board = include_board(Board, B, [0], 649, 708)

    Board = rect_board(Board, B, 0.15 + 625 / 20000, 708, 767, 2, 1)

    Board = random_board(Board, B, (0.15 + 675 / 20000) / 5, 767, 826)
    Board = include_board(Board, B, [1], 767, 826)

    Board = random_board(Board, B, 0.15 + 725 / 20000, 826, 885)

    Board = random_board(Board, B, (0.15 + 775 / 20000) / 5, 885, 944)
    Board = include_board(Board, B, [2], 885, 944)

    Board = rect_board(Board, B, (0.15 + 825 / 20000) / 2, 944, 1003, 3, 2)

    //Board = include_board(Board, B, [0, 2], 1003, 1062)
    Board = naname_board2(Board, B, 1003, 1062)

    Board = naname_board(Board, B, (0.15 + 925 / 20000) * 2, 1062, 1120)

    Board = random_board(Board, B, (0.15 + 975 / 20000) * 2, 1120, 1180)

    // for (let y = 0; y < one_game.masume_tate - 1; y++) {
    //     for (let x = 0; x < 6; x++) {
    //         if (y - x === 0) {
    //             Board[y][x] = B[y][x];
    //         }
    //         if (y - x === -1) {
    //             Board[y][x] = B[y][x];
    //         }
    //         if (one_game.masume_tate - 2 - y === x) {
    //             Board[y][x] = B[y][x];
    //         }
    //         if (one_game.masume_tate - 1 - y === x) {
    //             Board[y][x] = B[y][x];
    //         }
    //     }
    // }

    for (let y = 0; y < one_game.masume_tate - 1; y++) {
        for (let x = 0; x < 9; x++) {
            if (y - x === -4) {
                Board[y][x] = B[y][x];
            }
            if (y - x === -5) {
                Board[y][x] = B[y][x];
            }
            if (one_game.masume_tate + 2 - y === x) {
                Board[y][x] = B[y][x];
            }
            if (one_game.masume_tate + 3 - y === x) {
                Board[y][x] = B[y][x];
            }
        }
    }


    return [Board, Board2, Used, Used_t, Used_y, my_x, my_y, passedtime, life];
}

function initializeBoard_randomonly() {
    const T = Array.from({ length: one_game.masume_tate }, () => Array(one_game.masume_yoko * 2).fill(0));
    const Y = Array.from({ length: one_game.masume_tate }, () => Array(one_game.masume_yoko).fill(0));

    for (let j = 0; j < one_game.masume_yoko * 2; j++) {
        Y[4][j] = 1;
    }

    let Sumline = one_game.masume_yoko * 2;

    // 自分（面）の周囲の辺のうち使っている本数
    function three_direction(x, y) {
        const RET = [T[x][y], T[x][y + 1]];

        if (x % 2 === 0) {
            if (y % 2 === 0) {
                RET.push(Y[x][(y / 2) | 0]);
            }
            else {
                RET.push(Y[x + 1][(y / 2) | 0]);
            }
        }
        else {
            if (y % 2 === 0) {
                RET.push(Y[x + 1][(y / 2) | 0]);
            }
            else {
                RET.push(Y[x][(y / 2) | 0]);
            }
        }

        return RET.reduce((a, b) => a + b, 0);
    }

    // 自分（頂点）の周囲の辺のうち使っている本数
    function six_direction(x, y) {
        const RET = [];

        RET.push(Y[x][y]);
        if (y - 1 >= 0) {
            RET.push(Y[x][y - 1])
        }

        if (x % 2 === 0) {
            RET.push(T[x][y * 2])
            RET.push(T[x][y * 2 - 1])
            if (x - 1 >= 0) {
                RET.push(T[x - 1][y * 2])
                RET.push(T[x - 1][y * 2 - 1])
            }
        }
        else {
            RET.push(T[x][y * 2])
            RET.push(T[x][y * 2 + 1])
            if (x - 1 >= 0) {
                RET.push(T[x - 1][y * 2])
                RET.push(T[x - 1][y * 2 + 1])
            }
        }

        return RET.reduce((a, b) => a + b, 0);
    }

    for (let i = 0; i < 50000; i++) {
        const x = Math.floor(Math.random() * (T.length - 2));
        const y = Math.floor(Math.random() * (T[0].length - 12) + 10);

        let SUM = three_direction(x, y);

        if (SUM === 1) {
            if (Sumline > one_game.masume_yoko * 7) {
                continue
            }

            if (x % 2 === 0) {
                if (y % 2 === 0) {
                    if (T[x][y] === 1) {
                        if (six_direction(x, ((y / 2) | 0) + 1) === 0) {
                            T[x][y] ^= 1
                            T[x][y + 1] ^= 1
                            Y[x][(y / 2) | 0] ^= 1
                            Sumline += 1;
                        }
                    }
                    else if (T[x][y + 1] === 1) {
                        if (six_direction(x, ((y / 2) | 0)) === 0) {
                            T[x][y] ^= 1
                            T[x][y + 1] ^= 1
                            Y[x][(y / 2) | 0] ^= 1
                            Sumline += 1;
                        }

                    }
                    else if (Y[x][(y / 2) | 0] === 1) {
                        if (six_direction(x + 1, ((y / 2) | 0)) === 0) {
                            T[x][y] ^= 1
                            T[x][y + 1] ^= 1
                            Y[x][(y / 2) | 0] ^= 1
                            Sumline += 1;
                        }
                    }
                }
                else {
                    if (T[x][y] === 1) {
                        if (six_direction(x + 1, ((y / 2) | 0) + 1) === 0) {
                            T[x][y] ^= 1
                            T[x][y + 1] ^= 1
                            Y[x + 1][(y / 2) | 0] ^= 1
                            Sumline += 1;
                        }
                    }
                    else if (T[x][y + 1] === 1) {
                        if (six_direction(x + 1, ((y / 2) | 0)) === 0) {
                            T[x][y] ^= 1
                            T[x][y + 1] ^= 1
                            Y[x + 1][(y / 2) | 0] ^= 1
                            Sumline += 1;
                        }

                    }
                    else if (Y[x + 1][(y / 2) | 0] === 1) {
                        if (six_direction(x, ((y / 2) | 0) + 1) === 0) {
                            T[x][y] ^= 1
                            T[x][y + 1] ^= 1
                            Y[x + 1][(y / 2) | 0] ^= 1
                            Sumline += 1;
                        }
                    }
                }
            }
            else {
                if (y % 2 === 0) {
                    if (T[x][y] === 1) {
                        if (six_direction(x + 1, ((y / 2) | 0) + 1) === 0) {
                            T[x][y] ^= 1
                            T[x][y + 1] ^= 1
                            Y[x + 1][(y / 2) | 0] ^= 1
                            Sumline += 1;
                        }
                    }
                    else if (T[x][y + 1] === 1) {
                        if (six_direction(x + 1, ((y / 2) | 0)) === 0) {
                            T[x][y] ^= 1
                            T[x][y + 1] ^= 1
                            Y[x + 1][(y / 2) | 0] ^= 1
                            Sumline += 1;
                        }

                    }
                    else if (Y[x + 1][(y / 2) | 0] === 1) {
                        if (six_direction(x, ((y / 2) | 0)) === 0) {
                            T[x][y] ^= 1
                            T[x][y + 1] ^= 1
                            Y[x + 1][(y / 2) | 0] ^= 1
                            Sumline += 1;
                        }
                    }
                }
                else {
                    if (T[x][y] === 1) {
                        if (six_direction(x, ((y / 2) | 0) + 1) === 0) {
                            T[x][y] ^= 1
                            T[x][y + 1] ^= 1
                            Y[x][(y / 2) | 0] ^= 1
                            Sumline += 1;
                        }
                    }
                    else if (T[x][y + 1] === 1) {
                        if (six_direction(x, ((y / 2) | 0)) === 0) {
                            T[x][y] ^= 1
                            T[x][y + 1] ^= 1
                            Y[x][(y / 2) | 0] ^= 1
                            Sumline += 1;
                        }

                    }
                    else if (Y[x][(y / 2) | 0] === 1) {
                        if (six_direction(x + 1, ((y / 2) | 0) + 1) === 0) {
                            T[x][y] ^= 1
                            T[x][y + 1] ^= 1
                            Y[x][(y / 2) | 0] ^= 1
                            Sumline += 1;
                        }
                    }
                }
            }
        }
        // else if (SUM === 2) {
        //     if (x % 2 === 0) {
        //         if (y % 2 === 0) {
        //             T[x][y] ^= 1
        //             T[x][y + 1] ^= 1
        //             Y[x][(y / 2) | 0] ^= 1
        //         }
        //         else {
        //             T[x][y] ^= 1
        //             T[x][y + 1] ^= 1
        //             Y[x + 1][(y / 2) | 0] ^= 1
        //         }
        //     }
        //     else {
        //         if (y % 2 === 0) {
        //             T[x][y] ^= 1
        //             T[x][y + 1] ^= 1
        //             Y[x + 1][(y / 2) | 0] ^= 1
        //         }
        //         else {
        //             T[x][y] ^= 1
        //             T[x][y + 1] ^= 1
        //             Y[x][(y / 2) | 0] ^= 1
        //         }
        //     }
        // }
    }

    const B = Array(one_game.masume_tate - 1).fill().map(() => Array(one_game.masume_yoko * 2).fill(0));

    let Board = Array(one_game.masume_tate - 1).fill().map(() => Array(one_game.masume_yoko * 2).fill(-1));
    const Board2 = Array(one_game.masume_tate - 1).fill().map(() => Array(one_game.masume_yoko * 2).fill(0));
    const Used = Array(one_game.masume_tate).fill().map(() => Array(one_game.masume_yoko).fill(0));
    const Used_t = Array(one_game.masume_tate).fill().map(() => Array(one_game.masume_yoko * 2).fill(0));
    const Used_y = Array(one_game.masume_tate).fill().map(() => Array(one_game.masume_yoko).fill(0));
    const my_x = 2;
    const my_y = 4;
    const passedtime = 0;
    const life = 3;



    Used[my_y][my_x] = 1;

    for (let y = 0; y < one_game.masume_tate - 1; y++) {
        for (let x = 0; x < one_game.masume_yoko * 2; x++) {
            B[y][x] = three_direction(y, x);
        }
    }


    for (let x = 10; x < 1180; x++) {
        for (let y = 0; y < one_game.masume_tate - 1; y++) {
            if (Math.random() < 0.15 + x / 20000) {
                Board[y][x] = B[y][x];
            }
        }
    }

    for (let y = 0; y < one_game.masume_tate - 1; y++) {
        for (let x = 0; x < 9; x++) {
            if (y - x === -4) {
                Board[y][x] = B[y][x];
            }
            if (y - x === -5) {
                Board[y][x] = B[y][x];
            }
            if (one_game.masume_tate + 2 - y === x) {
                Board[y][x] = B[y][x];
            }
            if (one_game.masume_tate + 3 - y === x) {
                Board[y][x] = B[y][x];
            }
        }
    }


    return [Board, Board2, Used, Used_t, Used_y, my_x, my_y, passedtime, life];
}




function title_screen(masume_tate, masume_yoko,
    passedtime,
    score,
    Board, // 数字が書かれたボード
    Board2, // 各数字について、周囲の線が引かれている個数が何個超過しているか。
    my_x,
    my_y
) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height)// upmargin-radius-radius, mass*masume_yoko, mass*masume_tate);

    // Lifeの表示
    ctx.fillStyle = "#000000";
    ctx.font = "bold 40px serif";
    ctx.fillText("Life:", 100, 100);

    bezier_heart(220, 75, 1, 1)
    bezier_heart(260, 75, 1, 1)
    bezier_heart(300, 75, 1, 1)

    // Scoreの表示
    ctx.fillStyle = "#000000";
    ctx.font = "bold 40px serif";
    ctx.fillText("Score:" + String(score), 500, 100);

    // highscoreの表示
    let highscore = 0;

    if (game.mode === 0) {
        highscore = game.highscore_normal
    }
    else {
        highscore = game.highscore_randomonly
    }

    ctx.fillStyle = "#000000";
    ctx.font = "bold 40px serif";
    ctx.fillText("Highscore:" + String((highscore / 10) | 0), 800, 100);


    let passed_mass_x = (one_game.passedtime / game.mass) | 0

    for (let y = 0; y < masume_tate; y++) {
        for (let x = passed_mass_x; x < passed_mass_x + 35; x++) {

            // 頂点の丸

            if (y % 2 === 0) {
                ctx.beginPath();
                ctx.arc(x * game.mass + game.leftmargin - passedtime, y * game.mass_height + game.upmargin, game.radius, 0, Math.PI * 2);//, false );
                ctx.lineWidth = 1;
                ctx.strokeStyle = "#ccccee";
                ctx.stroke();
            }
            else {
                ctx.beginPath();
                ctx.arc(game.mass / 2 + x * game.mass + game.leftmargin - passedtime, y * game.mass_height + game.upmargin, game.radius, 0, Math.PI * 2);//, false );
                ctx.lineWidth = 1;
                ctx.strokeStyle = "#ccccee";
                ctx.stroke();
            }
        }
    }

    // 辺について
    for (let y = 0; y < masume_tate; y++) {
        for (let x = passed_mass_x; x < passed_mass_x + 35; x++) {

            if (y % 2 === 0) {
                ctx.beginPath();
                ctx.moveTo(x * game.mass + game.leftmargin + game.radius - passedtime, y * game.mass_height + game.upmargin);
                ctx.lineTo((x + 1) * game.mass + game.leftmargin - game.radius - passedtime, y * game.mass_height + game.upmargin);
                ctx.closePath();
                ctx.lineWidth = 3;
                ctx.strokeStyle = "#ccccee";
                ctx.stroke();

                if (y + 1 < masume_tate) {
                    ctx.beginPath();
                    ctx.moveTo(x * game.mass + game.leftmargin - passedtime + game.radius / 2, y * game.mass_height + game.upmargin + game.radius * game.mass_height / game.mass);
                    ctx.lineTo(game.mass / 2 + x * game.mass + game.leftmargin - passedtime - game.radius / 2, (y + 1) * game.mass_height + game.upmargin - game.radius * game.mass_height / game.mass);
                    ctx.closePath();
                    ctx.lineWidth = 3;
                    ctx.strokeStyle = "#ccccee";
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(x * game.mass + game.leftmargin - passedtime - game.radius / 2, y * game.mass_height + game.upmargin + game.radius * game.mass_height / game.mass);
                    ctx.lineTo(-game.mass / 2 + x * game.mass + game.leftmargin - passedtime + game.radius / 2, (y + 1) * game.mass_height + game.upmargin - game.radius * game.mass_height / game.mass);
                    ctx.closePath();
                    ctx.lineWidth = 3;
                    ctx.strokeStyle = "#ccccee";
                    ctx.stroke();
                }
            }

            else {
                ctx.beginPath();
                ctx.moveTo(-game.mass / 2 + x * game.mass + game.leftmargin + game.radius - passedtime, y * game.mass_height + game.upmargin);
                ctx.lineTo(-game.mass / 2 + (x + 1) * game.mass + game.leftmargin - game.radius - passedtime, y * game.mass_height + game.upmargin);
                ctx.closePath();
                ctx.lineWidth = 3;
                ctx.strokeStyle = "#ccccee";
                ctx.stroke();

                if (y + 1 < masume_tate) {
                    ctx.beginPath();
                    ctx.moveTo(-game.mass / 2 + x * game.mass + game.leftmargin - passedtime + game.radius / 2, y * game.mass_height + game.upmargin + game.radius * game.mass_height / game.mass);
                    ctx.lineTo(x * game.mass + game.leftmargin - passedtime - game.radius / 2, (y + 1) * game.mass_height + game.upmargin - game.radius * game.mass_height / game.mass);
                    ctx.closePath();
                    ctx.lineWidth = 3;
                    ctx.strokeStyle = "#ccccee";
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(-game.mass / 2 + x * game.mass + game.leftmargin - passedtime - game.radius / 2, y * game.mass_height + game.upmargin + game.radius * game.mass_height / game.mass);
                    ctx.lineTo(-game.mass + x * game.mass + game.leftmargin - passedtime + game.radius / 2, (y + 1) * game.mass_height + game.upmargin - game.radius * game.mass_height / game.mass);
                    ctx.closePath();
                    ctx.lineWidth = 3;
                    ctx.strokeStyle = "#ccccee";
                    ctx.stroke();
                }

            }
        }
    }

    // 文字について

    for (let y = 0; y < masume_tate; y++) {
        for (let x = passed_mass_x; x < passed_mass_x + 35; x++) {
            if (y + 1 < masume_tate) {
                if (Board[y][x] != -1) {

                    if ((x + y) % 2 === 0) {

                        if (Board2[y][x] < Board[y][x]) {
                            // 三角形を描画する
                            ctx.beginPath();
                            ctx.moveTo(x * game.mass / 2 + game.leftmargin - passedtime + game.radius, y * game.mass_height + game.upmargin + game.radius * 0.5773502691896258); // 三角形の最初の頂点
                            ctx.lineTo(game.mass + x * game.mass / 2 + game.leftmargin - passedtime - game.radius, y * game.mass_height + game.upmargin + game.radius * 0.5773502691896258);  // 二番目の頂点
                            ctx.lineTo(game.mass / 2 + x * game.mass / 2 + game.leftmargin - passedtime, game.mass_height + y * game.mass_height + game.upmargin - game.radius * 2 * 0.5773502691896258); // 三番目の頂点
                            ctx.closePath();      // パスを閉じる

                            // 塗りつぶし
                            ctx.fillStyle = "#fefecc";
                            ctx.fill();

                            ctx.fillStyle = "#aa6666";
                        }
                        else if (Board2[y][x] > Board[y][x]) {
                            // 三角形を描画する
                            ctx.beginPath();
                            ctx.moveTo(x * game.mass / 2 + game.leftmargin - passedtime + game.radius, y * game.mass_height + game.upmargin + game.radius * 0.5773502691896258); // 三角形の最初の頂点
                            ctx.lineTo(game.mass + x * game.mass / 2 + game.leftmargin - passedtime - game.radius, y * game.mass_height + game.upmargin + game.radius * 0.5773502691896258);  // 二番目の頂点
                            ctx.lineTo(game.mass / 2 + x * game.mass / 2 + game.leftmargin - passedtime, game.mass_height + y * game.mass_height + game.upmargin - game.radius * 2 * 0.5773502691896258); // 三番目の頂点
                            ctx.closePath();      // パスを閉じる

                            // 塗りつぶし
                            ctx.fillStyle = "#ffdddd";
                            ctx.fill();

                            ctx.fillStyle = "#aa6666";
                        }
                        else {
                            // 三角形を描画する
                            ctx.beginPath();
                            ctx.moveTo(x * game.mass / 2 + game.leftmargin - passedtime + game.radius, y * game.mass_height + game.upmargin + game.radius * 0.5773502691896258); // 三角形の最初の頂点
                            ctx.lineTo(game.mass + x * game.mass / 2 + game.leftmargin - passedtime - game.radius, y * game.mass_height + game.upmargin + game.radius * 0.5773502691896258);  // 二番目の頂点
                            ctx.lineTo(game.mass / 2 + x * game.mass / 2 + game.leftmargin - passedtime, game.mass_height + y * game.mass_height + game.upmargin - game.radius * 2 * 0.5773502691896258); // 三番目の頂点
                            ctx.closePath();      // パスを閉じる

                            // 塗りつぶし
                            ctx.fillStyle = "#eeeeee";
                            ctx.fill();

                            ctx.fillStyle = "#888888";
                        }
                        ctx.font = "bold 35px serif";
                        ctx.fillText(Board[y][x], game.mass / 2 + x * game.mass / 2 + game.leftmargin - passedtime - 12, (y + 1) * game.mass_height + game.upmargin - 35);
                    }
                    else {
                        if (Board2[y][x] < Board[y][x]) {
                            // 三角形を描画する
                            ctx.beginPath();
                            ctx.moveTo(x * game.mass / 2 + game.leftmargin - passedtime + game.radius, game.mass_height + y * game.mass_height + game.upmargin - game.radius * 0.5773502691896258); // 三角形の最初の頂点
                            ctx.lineTo(game.mass + x * game.mass / 2 + game.leftmargin - passedtime - game.radius, game.mass_height + y * game.mass_height + game.upmargin - game.radius * 0.5773502691896258);  // 二番目の頂点
                            ctx.lineTo(game.mass / 2 + x * game.mass / 2 + game.leftmargin - passedtime, y * game.mass_height + game.upmargin + game.radius * 2 * 0.5773502691896258); // 三番目の頂点
                            ctx.closePath();      // パスを閉じる

                            // 塗りつぶし
                            ctx.fillStyle = "#fefecc";
                            ctx.fill();

                            ctx.fillStyle = "#aa6666";
                        }
                        else if (Board2[y][x] > Board[y][x]) {
                            // 三角形を描画する
                            ctx.beginPath();
                            ctx.moveTo(x * game.mass / 2 + game.leftmargin - passedtime + game.radius, game.mass_height + y * game.mass_height + game.upmargin - game.radius * 0.5773502691896258); // 三角形の最初の頂点
                            ctx.lineTo(game.mass + x * game.mass / 2 + game.leftmargin - passedtime - game.radius, game.mass_height + y * game.mass_height + game.upmargin - game.radius * 0.5773502691896258);  // 二番目の頂点
                            ctx.lineTo(game.mass / 2 + x * game.mass / 2 + game.leftmargin - passedtime, y * game.mass_height + game.upmargin + game.radius * 2 * 0.5773502691896258); // 三番目の頂点
                            ctx.closePath();      // パスを閉じる

                            // 塗りつぶし
                            ctx.fillStyle = "#ffdddd";
                            ctx.fill();

                            ctx.fillStyle = "#aa6666";
                        }
                        else {
                            // 三角形を描画する
                            ctx.beginPath();
                            ctx.moveTo(x * game.mass / 2 + game.leftmargin - passedtime + game.radius, game.mass_height + y * game.mass_height + game.upmargin - game.radius * 0.5773502691896258); // 三角形の最初の頂点
                            ctx.lineTo(game.mass + x * game.mass / 2 + game.leftmargin - passedtime - game.radius, game.mass_height + y * game.mass_height + game.upmargin - game.radius * 0.5773502691896258);  // 二番目の頂点
                            ctx.lineTo(game.mass / 2 + x * game.mass / 2 + game.leftmargin - passedtime, y * game.mass_height + game.upmargin + game.radius * 2 * 0.5773502691896258); // 三番目の頂点
                            ctx.closePath();      // パスを閉じる

                            // 塗りつぶし
                            ctx.fillStyle = "#eeeeee";
                            ctx.fill();

                            ctx.fillStyle = "#888888";
                        }
                        ctx.font = "bold 35px serif";
                        ctx.fillText(Board[y][x], game.mass / 2 + x * game.mass / 2 + game.leftmargin - passedtime - 12, (y + 1) * game.mass_height + game.upmargin - 12);

                    }
                }
            }
        }
    }
    // 自分の位置

    ctx.beginPath();
    ctx.arc(my_x * game.mass + game.leftmargin - passedtime, my_y * game.mass_height + game.upmargin, game.radius * 1.5, 0, Math.PI * 2);//, false );

    ctx.lineWidth = 4;
    ctx.strokeStyle = "#cccc33";
    ctx.fillStyle = "#dd2222";
    ctx.fill();
    ctx.stroke();


    ctx.lineWidth = 4;
    ctx.strokeStyle = "#cccc33";
    ctx.fillStyle = "#dd2222";
    ctx.fill();
    ctx.stroke();


    ctx.fillStyle = "#999922";
    ctx.fillRect(game.leftmargin - 20 - game.radius, game.upmargin - game.radius - game.radius, 20, game.mass_height * masume_tate - game.radius - game.radius);

    ctx.strokeStyle = "#AAAA22";
    ctx.strokeRect(game.leftmargin - 20 - game.radius, game.upmargin - game.radius - game.radius, game.mass * masume_yoko, game.mass_height * masume_tate - game.radius - game.radius);

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(game.leftmargin - 50 - game.radius, game.upmargin - game.radius - game.radius, 30, game.mass * masume_tate);

    ctx.fillStyle = "darkgreen";
    ctx.font = "bold 80px serif";
    ctx.fillText("Press arrow key to start", game.leftmargin + one_game.my_x * game.mass + game.radius * 2, game.upmargin + one_game.my_y * game.mass_height + game.mass_height / 2);


    ctx.fillStyle = "darkgreen";
    ctx.font = "bold 50px serif";
    if (game.mode === 0) {
        ctx.fillText("randomonly mode", game.leftmargin + (one_game.my_x + 1) * game.mass + game.radius * 2, game.upmargin + (one_game.my_y + 1.5) * game.mass_height + game.mass_height / 2);
    }
    else if (game.mode === 1) {
        ctx.fillText("normal mode", game.leftmargin + (one_game.my_x + 1) * game.mass + game.radius * 2, game.upmargin + (one_game.my_y + 1.5) * game.mass_height + game.mass_height / 2);
    }

    ctx.font = "bold 35px serif";
    ctx.fillText("(press m key to change mode)", game.leftmargin + (one_game.my_x + 1) * game.mass + game.radius * 2, game.upmargin + (one_game.my_y + 2.5) * game.mass_height + game.mass_height / 2);
}



function visualize_board(masume_tate, masume_yoko,
    passedtime, // （時間経過などにより）どれだけ横に動いたか
    Board, // 数字が書かれたボード
    Board2, // 各数字について、周囲の線が引かれている個数が何個超過しているか。
    my_x, my_y,// 自分の座標
    Used, // どこを通って来たか
    Used_t, // 縦の線について
    Used_y // 横の線について
) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height)// upmargin-radius-radius, mass*masume_yoko, mass*masume_tate);

    // Lifeの表示
    ctx.fillStyle = "#ee6c8a";
    ctx.font = "bold 40px serif";
    ctx.fillText("Life:", 100, 100);

    let life1 = Math.max(Math.min(one_game.life, 1), 0);
    let life2 = Math.max(Math.min(one_game.life - 1, 1), 0);
    let life3 = Math.max(Math.min(one_game.life - 2, 1), 0);

    bezier_heart(220, 75, life1)
    bezier_heart(260, 75, life2)
    bezier_heart(300, 75, life3)

    // Scoreの表示
    ctx.fillStyle = "#000000";
    ctx.font = "bold 40px serif";
    ctx.fillText("Score:" + String((passedtime / 10) | 0), 500, 100);

    // highscoreの表示

    let highscore = 0;

    if (game.mode === 0) {
        highscore = game.highscore_normal
    }
    else {
        highscore = game.highscore_randomonly
    }

    ctx.fillStyle = "#000000";
    ctx.font = "bold 40px serif";
    ctx.fillText("Highscore:" + String((highscore / 10) | 0), 800, 100);



    let passed_mass_x = Math.max(((passedtime / game.mass) | 0) - 1, 0)

    for (let y = 0; y < masume_tate; y++) {
        for (let x = passed_mass_x; x < Math.min(passed_mass_x + 35, masume_yoko); x++) {
            if (y % 2 === 0) {

                // 頂点の丸、使っているもの
                if (Used[y][x] === 1) {
                    ctx.beginPath();
                    ctx.arc(x * game.mass + game.leftmargin - passedtime, y * game.mass_height + game.upmargin, game.radius * 1.5, 0, Math.PI * 2);//, false );
                    ctx.lineWidth = 4;
                    ctx.strokeStyle = "#ffffff";
                    ctx.fillStyle = "#ffffff";
                    ctx.fill();
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.arc(x * game.mass + game.leftmargin - passedtime, y * game.mass_height + game.upmargin, game.radius, 0, Math.PI * 2);//, false );

                    ctx.lineWidth = 1;
                    ctx.strokeStyle = "#dd0000";
                    ctx.fillStyle = "#ee8989";
                    ctx.fill();
                    ctx.stroke();
                }

                // 頂点の丸
                ctx.beginPath();
                ctx.arc(x * game.mass + game.leftmargin - passedtime, y * game.mass_height + game.upmargin, game.radius, 0, Math.PI * 2);//, false );
                ctx.lineWidth = 1;
                ctx.strokeStyle = "#79aacc";
                ctx.stroke();
            }
            else {
                if (Used[y][x] === 1) {
                    ctx.beginPath();
                    ctx.arc(game.mass / 2 + x * game.mass + game.leftmargin - passedtime, y * game.mass_height + game.upmargin, game.radius * 1.5, 0, Math.PI * 2);//, false );
                    ctx.lineWidth = 4;
                    ctx.strokeStyle = "#ffffff";
                    ctx.fillStyle = "#ffffff";
                    ctx.fill();
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.arc(game.mass / 2 + x * game.mass + game.leftmargin - passedtime, y * game.mass_height + game.upmargin, game.radius, 0, Math.PI * 2);//, false );

                    ctx.lineWidth = 1;
                    ctx.strokeStyle = "#dd0000";
                    ctx.fillStyle = "#ee8989";
                    ctx.fill();
                    ctx.stroke();
                }

                // 頂点の丸
                ctx.beginPath();
                ctx.arc(game.mass / 2 + x * game.mass + game.leftmargin - passedtime, y * game.mass_height + game.upmargin, game.radius, 0, Math.PI * 2);//, false );
                ctx.lineWidth = 1;
                ctx.strokeStyle = "#79aacc";
                ctx.stroke();

            }

        }
    }

    // 横の辺について
    for (let y = 0; y < masume_tate; y++) {
        for (let x = passed_mass_x; x < Math.min(passed_mass_x + 35, masume_yoko); x++) {
            if (y % 2 === 0) {
                ctx.beginPath();
                ctx.moveTo(x * game.mass + game.leftmargin + game.radius - passedtime, y * game.mass_height + game.upmargin);
                ctx.lineTo((x + 1) * game.mass + game.leftmargin - game.radius - passedtime, y * game.mass_height + game.upmargin);
                ctx.closePath();
                ctx.lineWidth = 3;
                ctx.strokeStyle = "#77aacc";
                ctx.stroke();

                // 使っているもの

                if (Used_y[y][x] === 1) {
                    ctx.beginPath();
                    ctx.moveTo(x * game.mass + game.leftmargin + game.radius - passedtime, y * game.mass_height + game.upmargin);
                    ctx.lineTo((x + 1) * game.mass + game.leftmargin - game.radius - passedtime, y * game.mass_height + game.upmargin);
                    ctx.closePath();
                    ctx.lineWidth = 7;
                    ctx.strokeStyle = "#ee6767";
                    ctx.stroke();
                }
            }
            else {
                ctx.beginPath();
                ctx.moveTo(game.mass / 2 + x * game.mass + game.leftmargin + game.radius - passedtime, y * game.mass_height + game.upmargin);
                ctx.lineTo(game.mass / 2 + (x + 1) * game.mass + game.leftmargin - game.radius - passedtime, y * game.mass_height + game.upmargin);
                ctx.closePath();
                ctx.lineWidth = 3;
                ctx.strokeStyle = "#77aacc";
                ctx.stroke();

                // 使っているもの

                if (Used_y[y][x] === 1) {
                    ctx.beginPath();
                    ctx.moveTo(game.mass / 2 + x * game.mass + game.leftmargin + game.radius - passedtime, y * game.mass_height + game.upmargin);
                    ctx.lineTo(game.mass / 2 + (x + 1) * game.mass + game.leftmargin - game.radius - passedtime, y * game.mass_height + game.upmargin);
                    ctx.closePath();
                    ctx.lineWidth = 7;
                    ctx.strokeStyle = "#ee6767";
                    ctx.stroke();
                }
            }
        }
    }

    // 縦の辺について
    for (let y = 0; y < masume_tate; y++) {
        for (let x = passed_mass_x; x < Math.min(passed_mass_x + 35, masume_yoko); x++) {
            if (y % 2 === 0) {
                if (y + 1 < masume_tate) {
                    ctx.beginPath();
                    ctx.moveTo(x * game.mass + game.leftmargin - passedtime + game.radius / 2, y * game.mass_height + game.upmargin + game.radius * game.mass_height / game.mass);
                    ctx.lineTo(game.mass / 2 + x * game.mass + game.leftmargin - passedtime - game.radius / 2, (y + 1) * game.mass_height + game.upmargin - game.radius * game.mass_height / game.mass);
                    ctx.closePath();
                    ctx.lineWidth = 3;
                    ctx.strokeStyle = "#77aacc";
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(x * game.mass + game.leftmargin - passedtime - game.radius / 2, y * game.mass_height + game.upmargin + game.radius * game.mass_height / game.mass);
                    ctx.lineTo(-game.mass / 2 + x * game.mass + game.leftmargin - passedtime + game.radius / 2, (y + 1) * game.mass_height + game.upmargin - game.radius * game.mass_height / game.mass);
                    ctx.closePath();
                    ctx.lineWidth = 3;
                    ctx.strokeStyle = "#77aacc";
                    ctx.stroke();

                    if (Used_t[y][x * 2 - 1] === 1) {

                        ctx.beginPath();
                        ctx.moveTo(x * game.mass + game.leftmargin - passedtime + game.radius / 2, y * game.mass_height + game.upmargin + game.radius * game.mass_height / game.mass);
                        ctx.lineTo(game.mass / 2 + x * game.mass + game.leftmargin - passedtime - game.radius / 2, (y + 1) * game.mass_height + game.upmargin - game.radius * game.mass_height / game.mass);
                        ctx.closePath();
                        ctx.lineWidth = 7;
                        ctx.strokeStyle = "#ee6767";
                        ctx.stroke();
                    }
                    if (Used_t[y][x * 2 - 2] === 1) {
                        ctx.beginPath();
                        ctx.moveTo(x * game.mass + game.leftmargin - passedtime - game.radius / 2, y * game.mass_height + game.upmargin + game.radius * game.mass_height / game.mass);
                        ctx.lineTo(-game.mass / 2 + x * game.mass + game.leftmargin - passedtime + game.radius / 2, (y + 1) * game.mass_height + game.upmargin - game.radius * game.mass_height / game.mass);
                        ctx.closePath();
                        ctx.lineWidth = 7;
                        ctx.strokeStyle = "#ee6767";
                        ctx.stroke();

                    }
                }
            }
            else {
                if (y + 1 < masume_tate) {
                    ctx.beginPath();
                    ctx.moveTo(game.mass / 2 + x * game.mass + game.leftmargin - passedtime + game.radius / 2, y * game.mass_height + game.upmargin + game.radius * game.mass_height / game.mass);
                    ctx.lineTo(game.mass / 2 + game.mass / 2 + x * game.mass + game.leftmargin - passedtime - game.radius / 2, (y + 1) * game.mass_height + game.upmargin - game.radius * game.mass_height / game.mass);
                    ctx.closePath();
                    ctx.lineWidth = 3;
                    ctx.strokeStyle = "#77aacc";
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(game.mass / 2 + x * game.mass + game.leftmargin - passedtime - game.radius / 2, y * game.mass_height + game.upmargin + game.radius * game.mass_height / game.mass);
                    ctx.lineTo(game.mass / 2 + -game.mass / 2 + x * game.mass + game.leftmargin - passedtime + game.radius / 2, (y + 1) * game.mass_height + game.upmargin - game.radius * game.mass_height / game.mass);
                    ctx.closePath();
                    ctx.lineWidth = 3;
                    ctx.strokeStyle = "#77aacc";
                    ctx.stroke();

                    if (Used_t[y][x * 2] === 1) {

                        ctx.beginPath();
                        ctx.moveTo(game.mass / 2 + x * game.mass + game.leftmargin - passedtime + game.radius / 2, y * game.mass_height + game.upmargin + game.radius * game.mass_height / game.mass);
                        ctx.lineTo(game.mass / 2 + game.mass / 2 + x * game.mass + game.leftmargin - passedtime - game.radius / 2, (y + 1) * game.mass_height + game.upmargin - game.radius * game.mass_height / game.mass);
                        ctx.closePath();
                        ctx.lineWidth = 7;
                        ctx.strokeStyle = "#ee6767";
                        ctx.stroke();
                    }

                    if (Used_t[y][x * 2 - 1] === 1) {
                        ctx.beginPath();
                        ctx.moveTo(game.mass / 2 + x * game.mass + game.leftmargin - passedtime - game.radius / 2, y * game.mass_height + game.upmargin + game.radius * game.mass_height / game.mass);
                        ctx.lineTo(game.mass / 2 + -game.mass / 2 + x * game.mass + game.leftmargin - passedtime + game.radius / 2, (y + 1) * game.mass_height + game.upmargin - game.radius * game.mass_height / game.mass);
                        ctx.closePath();
                        ctx.lineWidth = 7;
                        ctx.strokeStyle = "#ee6767";
                        ctx.stroke();

                    }
                }

            }
        }
    }

    // 文字について

    for (let y = 0; y < masume_tate; y++) {
        for (let x = passed_mass_x * 2; x < Math.min(passed_mass_x * 2 + 35 * 2, masume_yoko * 2); x++) {
            if (y + 1 < masume_tate) {
                if (Board[y][x] != -1) {

                    if ((x + y) % 2 === 0) {

                        if (Board2[y][x] < Board[y][x]) {
                            // 三角形を描画する
                            ctx.beginPath();
                            ctx.moveTo(x * game.mass / 2 + game.leftmargin - passedtime + game.radius, y * game.mass_height + game.upmargin + game.radius * 0.5773502691896258); // 三角形の最初の頂点
                            ctx.lineTo(game.mass + x * game.mass / 2 + game.leftmargin - passedtime - game.radius, y * game.mass_height + game.upmargin + game.radius * 0.5773502691896258);  // 二番目の頂点
                            ctx.lineTo(game.mass / 2 + x * game.mass / 2 + game.leftmargin - passedtime, game.mass_height + y * game.mass_height + game.upmargin - game.radius * 2 * 0.5773502691896258); // 三番目の頂点
                            ctx.closePath();      // パスを閉じる

                            // 塗りつぶし
                            ctx.fillStyle = "#fefecc";
                            ctx.fill();

                            ctx.fillStyle = "#aa6666";
                        }
                        else if (Board2[y][x] > Board[y][x]) {
                            // 三角形を描画する
                            ctx.beginPath();
                            ctx.moveTo(x * game.mass / 2 + game.leftmargin - passedtime + game.radius, y * game.mass_height + game.upmargin + game.radius * 0.5773502691896258); // 三角形の最初の頂点
                            ctx.lineTo(game.mass + x * game.mass / 2 + game.leftmargin - passedtime - game.radius, y * game.mass_height + game.upmargin + game.radius * 0.5773502691896258);  // 二番目の頂点
                            ctx.lineTo(game.mass / 2 + x * game.mass / 2 + game.leftmargin - passedtime, game.mass_height + y * game.mass_height + game.upmargin - game.radius * 2 * 0.5773502691896258); // 三番目の頂点
                            ctx.closePath();      // パスを閉じる

                            // 塗りつぶし
                            ctx.fillStyle = "#ffdddd";
                            ctx.fill();

                            ctx.fillStyle = "#aa6666";
                        }
                        else {
                            // 三角形を描画する
                            ctx.beginPath();
                            ctx.moveTo(x * game.mass / 2 + game.leftmargin - passedtime + game.radius, y * game.mass_height + game.upmargin + game.radius * 0.5773502691896258); // 三角形の最初の頂点
                            ctx.lineTo(game.mass + x * game.mass / 2 + game.leftmargin - passedtime - game.radius, y * game.mass_height + game.upmargin + game.radius * 0.5773502691896258);  // 二番目の頂点
                            ctx.lineTo(game.mass / 2 + x * game.mass / 2 + game.leftmargin - passedtime, game.mass_height + y * game.mass_height + game.upmargin - game.radius * 2 * 0.5773502691896258); // 三番目の頂点
                            ctx.closePath();      // パスを閉じる

                            // 塗りつぶし
                            ctx.fillStyle = "#eeeeee";
                            ctx.fill();

                            ctx.fillStyle = "#888888";
                        }
                        ctx.font = "bold 35px serif";
                        ctx.fillText(Board[y][x], game.mass / 2 + x * game.mass / 2 + game.leftmargin - passedtime - 12, (y + 1) * game.mass_height + game.upmargin - 35);
                    }
                    else {
                        if (Board2[y][x] < Board[y][x]) {
                            // 三角形を描画する
                            ctx.beginPath();
                            ctx.moveTo(x * game.mass / 2 + game.leftmargin - passedtime + game.radius, game.mass_height + y * game.mass_height + game.upmargin - game.radius * 0.5773502691896258); // 三角形の最初の頂点
                            ctx.lineTo(game.mass + x * game.mass / 2 + game.leftmargin - passedtime - game.radius, game.mass_height + y * game.mass_height + game.upmargin - game.radius * 0.5773502691896258);  // 二番目の頂点
                            ctx.lineTo(game.mass / 2 + x * game.mass / 2 + game.leftmargin - passedtime, y * game.mass_height + game.upmargin + game.radius * 2 * 0.5773502691896258); // 三番目の頂点
                            ctx.closePath();      // パスを閉じる

                            // 塗りつぶし
                            ctx.fillStyle = "#fefecc";
                            ctx.fill();

                            ctx.fillStyle = "#aa6666";
                        }
                        else if (Board2[y][x] > Board[y][x]) {
                            // 三角形を描画する
                            ctx.beginPath();
                            ctx.moveTo(x * game.mass / 2 + game.leftmargin - passedtime + game.radius, game.mass_height + y * game.mass_height + game.upmargin - game.radius * 0.5773502691896258); // 三角形の最初の頂点
                            ctx.lineTo(game.mass + x * game.mass / 2 + game.leftmargin - passedtime - game.radius, game.mass_height + y * game.mass_height + game.upmargin - game.radius * 0.5773502691896258);  // 二番目の頂点
                            ctx.lineTo(game.mass / 2 + x * game.mass / 2 + game.leftmargin - passedtime, y * game.mass_height + game.upmargin + game.radius * 2 * 0.5773502691896258); // 三番目の頂点
                            ctx.closePath();      // パスを閉じる

                            // 塗りつぶし
                            ctx.fillStyle = "#ffdddd";
                            ctx.fill();

                            ctx.fillStyle = "#aa6666";
                        }
                        else {
                            // 三角形を描画する
                            ctx.beginPath();
                            ctx.moveTo(x * game.mass / 2 + game.leftmargin - passedtime + game.radius, game.mass_height + y * game.mass_height + game.upmargin - game.radius * 0.5773502691896258); // 三角形の最初の頂点
                            ctx.lineTo(game.mass + x * game.mass / 2 + game.leftmargin - passedtime - game.radius, game.mass_height + y * game.mass_height + game.upmargin - game.radius * 0.5773502691896258);  // 二番目の頂点
                            ctx.lineTo(game.mass / 2 + x * game.mass / 2 + game.leftmargin - passedtime, y * game.mass_height + game.upmargin + game.radius * 2 * 0.5773502691896258); // 三番目の頂点
                            ctx.closePath();      // パスを閉じる

                            // 塗りつぶし
                            ctx.fillStyle = "#eeeeee";
                            ctx.fill();

                            ctx.fillStyle = "#888888";
                        }
                        ctx.font = "bold 35px serif";
                        ctx.fillText(Board[y][x], game.mass / 2 + x * game.mass / 2 + game.leftmargin - passedtime - 12, (y + 1) * game.mass_height + game.upmargin - 12);

                    }
                }
            }
        }
    }

    // 自分の位置

    ctx.beginPath();
    if (my_y % 2 === 0) {
        ctx.arc(my_x * game.mass + game.leftmargin - passedtime, my_y * game.mass_height + game.upmargin, game.radius * 1.5, 0, Math.PI * 2);//, false );
    }
    else {
        ctx.arc(game.mass / 2 + my_x * game.mass + game.leftmargin - passedtime, my_y * game.mass_height + game.upmargin, game.radius * 1.5, 0, Math.PI * 2);//, false );
    }

    ctx.lineWidth = 4;
    ctx.strokeStyle = "#cccc33";
    ctx.fillStyle = "#dd2222";
    ctx.fill();
    ctx.stroke();


    ctx.fillStyle = "#999922";
    ctx.fillRect(game.leftmargin - 20 - game.radius, game.upmargin - game.radius - game.radius, 20, game.mass_height * masume_tate - game.radius - game.radius);

    ctx.strokeStyle = "#AAAA22";
    ctx.strokeRect(game.leftmargin - 20 - game.radius, game.upmargin - game.radius - game.radius, game.mass * masume_yoko, game.mass_height * masume_tate - game.radius - game.radius);

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(game.leftmargin - 250 - game.radius, game.upmargin - game.radius - game.radius, 230, game.mass * masume_tate);

}

// 押しているキーの集合
const keysPressing = {};

addEventListener("keyup", keyupfunc);
function keyupfunc(event) {
    let key_code = event.keyCode;
    keysPressing[key_code] = false;
}

// keyを押したときの操作。
addEventListener("keydown", keydownfunc);
function keydownfunc(event) {
    let key_code = event.keyCode;
    keysPressing[key_code] = true;

    if (game.status === 0 && key_code === 77) {
        game.mode = (game.mode + 1) % 2
        title_screen(one_game.masume_tate, one_game.masume_yoko, one_game.passedtime, one_game.score, one_game.Board, one_game.Board2, one_game.my_x, one_game.my_y);

    }

    // 何かキーを押したらゲーム開始
    if (game.status === 0 && ((key_code === 39) || (key_code === 37) || (key_code === 40) || (key_code === 38) || (97 <= key_code && key_code <= 105))) {
        one_game.passedtime = 0;
        if (game.mode === 0) {
            [one_game.Board, one_game.Board2, one_game.Used, one_game.Used_t, one_game.Used_y, one_game.my_x, one_game.my_y, one_game.passedtime, one_game.life] = initializeBoard_randomonly();
        }
        else {
            [one_game.Board, one_game.Board2, one_game.Used, one_game.Used_t, one_game.Used_y, one_game.my_x, one_game.my_y, one_game.passedtime, one_game.life] = initializeBoard_normal();

        }
        game.status = 1
        whilegame = setInterval(visual, 30);
    }

    if (game.status === 1) {
        // UNDO操作。z/x/cを押したとき一歩戻る。

        if ((key_code === 67) || (key_code === 88) || (key_code === 90)) {
            one_game.life -= 1 / 10

            if (one_game.my_y % 2 === 0) {
                // 右に戻る
                if (one_game.Used_y[one_game.my_y][one_game.my_x] === 1) {
                    one_game.Used_y[one_game.my_y][one_game.my_x] = 0;
                    one_game.Used[one_game.my_y][one_game.my_x] = 0;
                    one_game.my_x += 1
                    if (one_game.my_y - 1 >= 0) {
                        one_game.Board2[one_game.my_y - 1][one_game.my_x * 2 - 2] -= 1;
                    }
                    if (one_game.my_y < one_game.masume_tate - 1) {
                        one_game.Board2[one_game.my_y][one_game.my_x * 2 - 2] -= 1;
                    }
                }
                // 左に戻る
                else if (one_game.my_x - 1 >= 0 && one_game.Used_y[one_game.my_y][one_game.my_x - 1] === 1) {
                    one_game.Used_y[one_game.my_y][one_game.my_x - 1] = 0;
                    one_game.Used[one_game.my_y][one_game.my_x] = 0;
                    one_game.my_x -= 1
                    if (one_game.my_y - 1 >= 0) {
                        one_game.Board2[one_game.my_y - 1][one_game.my_x * 2] -= 1;
                    }
                    if (one_game.my_y < one_game.masume_tate - 1) {
                        one_game.Board2[one_game.my_y][one_game.my_x * 2] -= 1;
                    }
                }
                // 右上に戻る
                else if ((one_game.my_y - 1 >= 0) && (one_game.my_x * 2 - 1 >= 0) && one_game.Used_t[one_game.my_y - 1][one_game.my_x * 2 - 1] === 1) {
                    one_game.Used_t[one_game.my_y - 1][one_game.my_x * 2 - 1] = 0;
                    one_game.Used[one_game.my_y][one_game.my_x] = 0;
                    one_game.my_y -= 1;

                    if (one_game.my_x * 2 - 1 >= 0) {
                        one_game.Board2[one_game.my_y][one_game.my_x * 2 - 1] -= 1;
                    }
                    if (one_game.my_x * 2 >= 0) {
                        one_game.Board2[one_game.my_y][one_game.my_x * 2] -= 1;
                    }
                }
                // 左上に戻る
                else if ((one_game.my_y - 1 >= 0) && (one_game.my_x * 2 - 2 >= 0) && one_game.Used_t[one_game.my_y - 1][one_game.my_x * 2 - 2] === 1) {
                    one_game.Used_t[one_game.my_y - 1][one_game.my_x * 2 - 2] = 0;
                    one_game.Used[one_game.my_y][one_game.my_x] = 0;
                    one_game.my_y -= 1;
                    one_game.my_x -= 1;

                    if (one_game.my_x * 2 >= 0) {
                        one_game.Board2[one_game.my_y][one_game.my_x * 2] -= 1;
                    }
                    if (one_game.my_x * 2 + 1 >= 0) {
                        one_game.Board2[one_game.my_y][one_game.my_x * 2 + 1] -= 1;
                    }
                }
                // 右下に戻る
                else if (one_game.my_x * 2 - 1 >= 0 && one_game.Used_t[one_game.my_y][one_game.my_x * 2 - 1] === 1) {
                    one_game.Used_t[one_game.my_y][one_game.my_x * 2 - 1] = 0;
                    one_game.Used[one_game.my_y][one_game.my_x] = 0;
                    one_game.my_y += 1;

                    if (one_game.my_x * 2 - 1 >= 0) {
                        one_game.Board2[one_game.my_y - 1][one_game.my_x * 2 - 1] -= 1;
                    }
                    if (one_game.my_x * 2 >= 0) {
                        one_game.Board2[one_game.my_y - 1][one_game.my_x * 2] -= 1;
                    }
                }
                // 左下に戻る
                else if ((one_game.my_x * 2 - 2 >= 0) && one_game.Used_t[one_game.my_y][one_game.my_x * 2 - 2] === 1) {
                    one_game.Used_t[one_game.my_y][one_game.my_x * 2 - 2] = 0;
                    one_game.Used[one_game.my_y][one_game.my_x] = 0;
                    one_game.my_y += 1;
                    one_game.my_x -= 1;

                    if (one_game.my_x * 2 >= 0) {
                        one_game.Board2[one_game.my_y - 1][one_game.my_x * 2] -= 1;
                    }
                    if (one_game.my_x * 2 + 1 >= 0) {
                        one_game.Board2[one_game.my_y - 1][one_game.my_x * 2 + 1] -= 1;
                    }
                }
            }
            else {
                // 右に戻る
                if (one_game.Used_y[one_game.my_y][one_game.my_x] === 1) {
                    one_game.Used_y[one_game.my_y][one_game.my_x] = 0;
                    one_game.Used[one_game.my_y][one_game.my_x] = 0;
                    one_game.my_x += 1
                    if (one_game.my_y - 1 >= 0) {
                        one_game.Board2[one_game.my_y - 1][one_game.my_x * 2 - 1] -= 1;
                    }
                    if (one_game.my_y < one_game.masume_tate - 1) {
                        one_game.Board2[one_game.my_y][one_game.my_x * 2 - 1] -= 1;
                    }
                }
                // 左に戻る
                else if (one_game.my_x - 1 >= 0 && one_game.Used_y[one_game.my_y][one_game.my_x - 1] === 1) {
                    one_game.Used_y[one_game.my_y][one_game.my_x - 1] = 0;
                    one_game.Used[one_game.my_y][one_game.my_x] = 0;
                    one_game.my_x -= 1
                    if (one_game.my_y - 1 >= 0) {
                        one_game.Board2[one_game.my_y - 1][one_game.my_x * 2 + 1] -= 1;
                    }
                    if (one_game.my_y < one_game.masume_tate - 1) {
                        one_game.Board2[one_game.my_y][one_game.my_x * 2 + 1] -= 1;
                    }
                }
                // 右上に戻る
                else if ((one_game.my_y - 1 >= 0) && one_game.Used_t[one_game.my_y - 1][one_game.my_x * 2] === 1) {
                    one_game.Used_t[one_game.my_y - 1][one_game.my_x * 2] = 0;
                    one_game.Used[one_game.my_y][one_game.my_x] = 0;
                    one_game.my_y -= 1;
                    one_game.my_x += 1;
                    if (one_game.my_x * 2 - 1 >= 0) {
                        one_game.Board2[one_game.my_y][one_game.my_x * 2 - 1] -= 1;
                    }
                    if (one_game.my_x * 2 - 2 >= 0) {
                        one_game.Board2[one_game.my_y][one_game.my_x * 2 - 2] -= 1;
                    }
                }
                // 左上に戻る
                else if ((one_game.my_y - 1 >= 0) && (one_game.my_x * 2 - 1 >= 0) && one_game.Used_t[one_game.my_y - 1][one_game.my_x * 2 - 1] === 1) {
                    one_game.Used_t[one_game.my_y - 1][one_game.my_x * 2 - 1] = 0;
                    one_game.Used[one_game.my_y][one_game.my_x] = 0;
                    one_game.my_y -= 1;

                    if (one_game.my_x * 2 >= 0) {
                        one_game.Board2[one_game.my_y][one_game.my_x * 2] -= 1;
                    }
                    if (one_game.my_x * 2 - 1 >= 0) {
                        one_game.Board2[one_game.my_y][one_game.my_x * 2 - 1] -= 1;
                    }
                }
                // 右下に戻る
                else if (one_game.Used_t[one_game.my_y][one_game.my_x * 2] === 1) {
                    one_game.Used_t[one_game.my_y][one_game.my_x * 2] = 0;
                    one_game.Used[one_game.my_y][one_game.my_x] = 0;
                    one_game.my_y += 1;
                    one_game.my_x += 1;
                    if (one_game.my_x * 2 - 1 >= 0) {
                        one_game.Board2[one_game.my_y - 1][one_game.my_x * 2 - 1] -= 1;
                    }
                    if (one_game.my_x * 2 - 2 >= 0) {
                        one_game.Board2[one_game.my_y - 1][one_game.my_x * 2 - 2] -= 1;
                    }
                }
                // 左下に戻る
                else if ((one_game.my_x * 2 - 1 >= 0) && one_game.Used_t[one_game.my_y][one_game.my_x * 2 - 1] === 1) {
                    one_game.Used_t[one_game.my_y][one_game.my_x * 2 - 1] = 0;
                    one_game.Used[one_game.my_y][one_game.my_x] = 0;
                    one_game.my_y += 1;

                    if (one_game.my_x * 2 >= 0) {
                        one_game.Board2[one_game.my_y - 1][one_game.my_x * 2] -= 1;
                    }
                    if (one_game.my_x * 2 - 1 >= 0) {
                        one_game.Board2[one_game.my_y - 1][one_game.my_x * 2 - 1] -= 1;
                    }
                }
            }
        }

        if ((key_code === 69) || (key_code === 81) || (key_code === 87)) {
            one_game.passedtime += 4
        }

        // 上下左右について
        if (key_code === 102 || (key_code === 39 && !(keysPressing[40]) && !(keysPressing[38]))) {//　右のみを押したとき
            if (one_game.my_x + 1 < one_game.masume_yoko && one_game.Used[one_game.my_y][one_game.my_x + 1] === 0) {
                one_game.my_x += 1
                one_game.Used_y[one_game.my_y][one_game.my_x - 1] = 1

                if (one_game.my_y % 2 === 0) {
                    if (one_game.my_y - 1 >= 0) {
                        one_game.Board2[one_game.my_y - 1][(one_game.my_x - 1) * 2] += 1;
                    }
                    if (one_game.my_y < one_game.masume_tate - 1) {
                        one_game.Board2[one_game.my_y][(one_game.my_x - 1) * 2] += 1;
                    }
                }
                else {
                    if (one_game.my_y - 1 >= 0) {
                        one_game.Board2[one_game.my_y - 1][one_game.my_x * 2 - 1] += 1;
                    }
                    if (one_game.my_y < one_game.masume_tate - 1) {
                        one_game.Board2[one_game.my_y][one_game.my_x * 2 - 1] += 1;
                    }
                }
            }
            else if (game.status === 1) {
                one_game.passedtime += 1.5
            }
        }
        else if (key_code === 100 || (key_code === 37 && !(keysPressing[40]) && !(keysPressing[38]))) {// 左のみを押したとき
            if (one_game.my_x - 1 >= 0 && one_game.Used[one_game.my_y][one_game.my_x - 1] === 0) {
                one_game.my_x -= 1
                one_game.Used_y[one_game.my_y][one_game.my_x] = 1

                if (one_game.my_y % 2 === 0) {
                    if (one_game.my_y - 1 >= 0) {
                        one_game.Board2[one_game.my_y - 1][one_game.my_x * 2] += 1;
                    }
                    if (one_game.my_y < one_game.masume_tate - 1) {
                        one_game.Board2[one_game.my_y][one_game.my_x * 2] += 1;
                    }
                }
                else {
                    if (one_game.my_y - 1 >= 0) {
                        one_game.Board2[one_game.my_y - 1][one_game.my_x * 2 + 1] += 1;
                    }
                    if (one_game.my_y < one_game.masume_tate - 1) {
                        one_game.Board2[one_game.my_y][one_game.my_x * 2 + 1] += 1;
                    }
                }
            }
            else if (game.status === 1) {
                one_game.passedtime += 1.5
            }
        }
        else if (key_code === 105 || ((key_code === 39 && (keysPressing[38]) && !(keysPressing[40])) || (key_code === 38 && (keysPressing[39]) && !(keysPressing[37])))) { //右上
            if (one_game.my_y % 2 === 0) {
                if (one_game.my_y - 1 >= 0 && one_game.Used[one_game.my_y - 1][one_game.my_x] === 0) {
                    one_game.my_y -= 1
                    one_game.Used_t[one_game.my_y][one_game.my_x * 2 - 1] = 1
                    if (one_game.my_x * 2 < one_game.masume_yoko * 2) {
                        one_game.Board2[one_game.my_y][one_game.my_x * 2] += 1;
                    }
                    if (one_game.my_x * 2 - 1 >= 0) {
                        one_game.Board2[one_game.my_y][one_game.my_x * 2 - 1] += 1;
                    }
                }
                else if (game.status === 1) {
                    one_game.passedtime += 1.5
                }
            }
            else {
                if (one_game.my_y - 1 >= 0 && one_game.Used[one_game.my_y - 1][one_game.my_x + 1] === 0) {
                    one_game.my_y -= 1;
                    one_game.my_x += 1;
                    one_game.Used_t[one_game.my_y][one_game.my_x * 2 - 2] = 1
                    if (one_game.my_x * 2 - 1 < one_game.masume_yoko * 2) {
                        one_game.Board2[one_game.my_y][one_game.my_x * 2 - 1] += 1;
                    }
                    if (one_game.my_x * 2 - 2 >= 0) {
                        one_game.Board2[one_game.my_y][one_game.my_x * 2 - 2] += 1;
                    }
                }
                else if (game.status === 1) {
                    one_game.passedtime += 1.5
                }
            }
        }
        else if (key_code === 99 || ((key_code === 39 && (keysPressing[40]) && !(keysPressing[38])) || (key_code === 40 && (keysPressing[39]) && !(keysPressing[37])))) { //右下
            if (one_game.my_y % 2 === 0) {
                if (one_game.my_y + 1 < one_game.masume_tate && one_game.Used[one_game.my_y + 1][one_game.my_x] === 0) {
                    one_game.my_y += 1
                    one_game.Used_t[one_game.my_y - 1][one_game.my_x * 2 - 1] = 1
                    if (one_game.my_x * 2 < one_game.masume_yoko * 2) {
                        one_game.Board2[one_game.my_y - 1][one_game.my_x * 2] += 1;
                    }
                    if (one_game.my_x * 2 - 1 >= 0) {
                        one_game.Board2[one_game.my_y - 1][one_game.my_x * 2 - 1] += 1;
                    }
                }
                else if (game.status === 1) {
                    one_game.passedtime += 1.5
                }
            }
            else {
                if (one_game.my_y + 1 < one_game.masume_tate && one_game.my_x + 1 < one_game.masume_yoko && one_game.Used[one_game.my_y + 1][one_game.my_x + 1] === 0) {
                    one_game.my_y += 1
                    one_game.my_x += 1
                    one_game.Used_t[one_game.my_y - 1][one_game.my_x * 2 - 2] = 1
                    if (one_game.my_x * 2 - 1 < one_game.masume_yoko * 2) {
                        one_game.Board2[one_game.my_y - 1][one_game.my_x * 2 - 1] += 1;
                    }
                    if (one_game.my_x * 2 - 2 >= 0) {
                        one_game.Board2[one_game.my_y - 1][one_game.my_x * 2 - 2] += 1;
                    }
                }
                else if (game.status === 1) {
                    one_game.passedtime += 1.5
                }
            }
        }
        else if (key_code === 103 || ((key_code === 37 && (keysPressing[38]) && !(keysPressing[40])) || (key_code === 38 && (keysPressing[37]) && !(keysPressing[39])))) { //左上
            if (one_game.my_y % 2 === 0) {
                if (one_game.my_y - 1 >= 0 && one_game.my_x - 1 >= 0 && one_game.Used[one_game.my_y - 1][one_game.my_x - 1] === 0) {
                    one_game.my_y -= 1
                    one_game.my_x -= 1
                    one_game.Used_t[one_game.my_y][one_game.my_x * 2] = 1
                    if (one_game.my_x * 2 + 1 < one_game.masume_yoko * 2) {
                        one_game.Board2[one_game.my_y][one_game.my_x * 2 + 1] += 1;
                    }
                    if (one_game.my_x * 2 >= 0) {
                        one_game.Board2[one_game.my_y][one_game.my_x * 2] += 1;
                    }
                }
                else if (game.status === 1) {
                    one_game.passedtime += 1.5
                }
            }
            else {
                if (one_game.my_y - 1 >= 0 && one_game.Used[one_game.my_y - 1][one_game.my_x] === 0) {
                    one_game.my_y -= 1
                    one_game.Used_t[one_game.my_y][one_game.my_x * 2 - 1] = 1
                    if (one_game.my_x * 2 < one_game.masume_yoko * 2) {
                        one_game.Board2[one_game.my_y][one_game.my_x * 2] += 1;
                    }
                    if (one_game.my_x * 2 - 1 >= 0) {
                        one_game.Board2[one_game.my_y][one_game.my_x * 2 - 1] += 1;
                    }
                }
                else if (game.status === 1) {
                    one_game.passedtime += 1.5
                }
            }
        }
        else if (key_code === 97 || ((key_code === 37 && (keysPressing[40]) && !(keysPressing[38])) || (key_code === 40 && (keysPressing[37]) && !(keysPressing[39])))) { //左下
            if (one_game.my_y % 2 === 0) {
                if (one_game.my_y + 1 < one_game.masume_tate && one_game.my_x - 1 >= 0 && one_game.Used[one_game.my_y + 1][one_game.my_x - 1] === 0) {
                    one_game.my_y += 1
                    one_game.my_x -= 1
                    one_game.Used_t[one_game.my_y - 1][one_game.my_x * 2] = 1
                    if (one_game.my_x * 2 < one_game.masume_yoko * 2) {
                        one_game.Board2[one_game.my_y - 1][one_game.my_x * 2] += 1;
                    }
                    if (one_game.my_x * 2 - 1 >= 0) {
                        one_game.Board2[one_game.my_y - 1][one_game.my_x * 2 + 1] += 1;
                    }
                }
                else if (game.status === 1) {
                    one_game.passedtime += 1.5
                }
            }
            else {
                if (one_game.my_y + 1 >= 0 && one_game.Used[one_game.my_y + 1][one_game.my_x] === 0) {
                    one_game.my_y += 1
                    one_game.Used_t[one_game.my_y - 1][one_game.my_x * 2 - 1] = 1
                    if (one_game.my_x * 2 < one_game.masume_yoko * 2) {
                        one_game.Board2[one_game.my_y - 1][one_game.my_x * 2] += 1;
                    }
                    if (one_game.my_x * 2 - 1 >= 0) {
                        one_game.Board2[one_game.my_y - 1][one_game.my_x * 2 - 1] += 1;
                    }
                }
                else if (game.status === 1) {
                    one_game.passedtime += 1.5
                }
            }
        }

        one_game.Used[one_game.my_y][one_game.my_x] = 1
        visualize_board(one_game.masume_tate, one_game.masume_yoko, one_game.passedtime, one_game.Board, one_game.Board2, one_game.my_x, one_game.my_y, one_game.Used, one_game.Used_t, one_game.Used_y);
    }

    // Game over 画面からタイトルへ遷移。
    if (game.status === 2 && ((key_code === 39) || (key_code === 37) || (key_code === 40) || (key_code === 38) || (97 <= key_code && key_code <= 105))) {
        game_to_title()
    }
}

function visual() {
    visualize_board(one_game.masume_tate, one_game.masume_yoko, one_game.passedtime, one_game.Board, one_game.Board2, one_game.my_x, one_game.my_y, one_game.Used, one_game.Used_t, one_game.Used_y)
    if (one_game.life <= 0) {
        clearInterval(whilegame)
        game.status = 2
        ctx.fillStyle = "black";
        ctx.font = "bold 80px serif";
        ctx.fillText("Game Over", game.upmargin + 2 * game.mass + game.radius * 2, game.leftmargin + 5 * game.mass + game.mass / 2);

        if (game.mode === 0) {
            if (localStorage.getItem("Slitherlink_runner_triangle_localhighscore_normal") < one_game.passedtime) {
                localStorage.setItem("Slitherlink_runner_triangle_localhighscore_normal", one_game.passedtime);
                game.highscore_normal = one_game.passedtime
            }
        }
        if (game.mode === 1) {
            if (localStorage.getItem("Slitherlink_runner_triangle_localhighscore_randomonly") < one_game.passedtime) {
                localStorage.setItem("Slitherlink_runner_triangle_localhighscore_randomonly", one_game.passedtime);
                game.highscore_randomonly = one_game.passedtime
            }
        }
        game.gameendtimecount = setInterval(gameendtime_wait, 2000);
        game.status = 3


    }
    one_game.passedtime += 0.2 + one_game.passedtime / 25000
    one_game.life += 0.003
    one_game.life = Math.min(one_game.life, 3)

    if (((one_game.my_y % 2 === 0) && (one_game.my_x * game.mass - one_game.passedtime < -game.radius * 2)) || (((one_game.my_y % 2 === 1) && (one_game.my_x * game.mass - one_game.passedtime < -game.radius * 2 - game.mass / 2)))) {
        clearInterval(whilegame)
        game.status = 2
        ctx.fillStyle = "black";
        ctx.font = "bold 80px serif";

        if (one_game.passedtime > (one_game.masume_yoko - 2) * game.mass) {
            ctx.fillText("Congratulations! You finish!", game.upmargin + 2 * game.mass + game.radius * 2, game.leftmargin + 5 * game.mass + game.mass / 2);
        }
        else {
            ctx.fillText("Game Over", game.upmargin + 2 * game.mass + game.radius * 2, game.leftmargin + 5 * game.mass + game.mass / 2);
        }

        if (game.mode === 0) {
            if (localStorage.getItem("Slitherlink_runner_triangle_localhighscore_normal") < one_game.passedtime) {
                localStorage.setItem("Slitherlink_runner_triangle_localhighscore_normal", one_game.passedtime);
                game.highscore_normal = one_game.passedtime
            }
        }
        if (game.mode === 1) {
            if (localStorage.getItem("Slitherlink_runner_triangle_localhighscore_randomonly") < one_game.passedtime) {
                localStorage.setItem("Slitherlink_runner_triangle_localhighscore_randomonly", one_game.passedtime);
                game.highscore_randomonly = one_game.passedtime
            }
        }
        game.gameendtimecount = setInterval(gameendtime_wait, 2000);
        game.status = 3
    }

    let disappear_x = (((one_game.passedtime - game.radius) / game.mass) * 2 | 0) - 2;

    if (disappear_x >= 0) {
        for (let y = 0; y < one_game.masume_tate - 1; y++) {
            if (one_game.Board[y][disappear_x] != -1 && one_game.Board2[y][disappear_x] != one_game.Board[y][disappear_x]) {
                one_game.life -= 1
                one_game.Board[y][disappear_x] = -1
                one_game.Board2[y][disappear_x] = 0
            }
        }
    }
}

function game_to_title() {
    game.status = 0;
    let beforescore = (one_game.passedtime / 10) | 0;

    if (game.mode === 0) {
        [one_game.Board, one_game.Board2, one_game.Used, one_game.Used_t, one_game.Used_y, one_game.my_x, one_game.my_y, one_game.passedtime, one_game.life] = initializeBoard_randomonly();
    }
    else {
        [one_game.Board, one_game.Board2, one_game.Used, one_game.Used_t, one_game.Used_y, one_game.my_x, one_game.my_y, one_game.passedtime, one_game.life] = initializeBoard_normal();

    }
    title_screen(one_game.masume_tate, one_game.masume_yoko, one_game.passedtime, beforescore, one_game.Board, one_game.Board2, one_game.my_x, one_game.my_y);
}

function gameendtime_wait() {
    clearInterval(game.gameendtimecount);
    game.gameendtimecount = null;
    game.status = 2;
}

if (game.mode === 0) {
    [one_game.Board, one_game.Board2, one_game.Used, one_game.Used_t, one_game.Used_y, one_game.my_x, one_game.my_y, one_game.passedtime, one_game.life] = initializeBoard_randomonly();
}
else {
    [one_game.Board, one_game.Board2, one_game.Used, one_game.Used_t, one_game.Used_y, one_game.my_x, one_game.my_y, one_game.passedtime, one_game.life] = initializeBoard_normal();

}
//visualize_board(one_game.masume_tate,one_game.masume_yoko,one_game.passedtime,one_game.Board,one_game.Board2,one_game.my_x,one_game.my_y,one_game.Used,one_game.Used_t,one_game.Used_y)
title_screen(one_game.masume_tate, one_game.masume_yoko, one_game.passedtime, one_game.score, one_game.Board, one_game.Board2, one_game.my_x, one_game.my_y);
