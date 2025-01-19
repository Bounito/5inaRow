
function fctColor(value) {
    // Clamp la valeur entre 0 et 1
    value = Math.max(0, Math.min(1, value));
    
    let r, g;

    if (value <= .5) {
        // Interpolation du vert (0) au jaune (.5)
        r = Math.round(255 * value*2); // De 0 à 255
        g = 255; // Toujours vert
    } else {
        // Interpolation du jaune (.5) au rouge (1)
        r = 255; // Toujours rouge
        g = Math.round(255 * (2 - (value*2))); // De 255 à 0
    }

    // Retourner la couleur sous forme hexadécimale
    return `rgb(${r}, ${g}, 0)`; // Le bleu reste à 0 pour toute la gamme
}

//=====================================================================
//                        DOM chargé
//=====================================================================
document.addEventListener('DOMContentLoaded', () => {

    console.info("== DOM chargé ==");

    window.onbeforeunload = function() {
        return "🙄 Leave now?";
    };

    // Utilise getComputedStyle pour obtenir la variable CSS
    const rootStyle = getComputedStyle(document.documentElement);
    let cellSize = parseInt(rootStyle.getPropertyValue('--cellSize'));
    let cellNbX = parseInt(rootStyle.getPropertyValue('--cellNbX'));
    let cellNbY = parseInt(rootStyle.getPropertyValue('--cellNbY'));

    let animSpeedPoint = rootStyle.getPropertyValue('--animSpeedPoint');
    animSpeedPoint = 1000*animSpeedPoint.toString().substring(0, animSpeedPoint.length - 1);
    let animSpeedLine = parseInt(rootStyle.getPropertyValue('--animSpeedLine'));
    animSpeedLine = 1000*animSpeedLine.toString().substring(0, animSpeedLine.length - 1);

    console.log('animSpeedPoint',animSpeedPoint,'animSpeedLine',animSpeedLine);

  
    const grid = document.getElementById('divGrid');   


    let scale = 1;
    // Variables Players
    let NbPlayers = 2;
    let CurrentPlayer = 0;
    let players = [
        { color: "blue", char: "O", score: 0, sections:[],lastPos:[]},
        { color: "red", char: "X", score: 0, sections:[],lastPos:[]}
    ];
    let letSoundOn = true;

    // ====================================================================
    // ====================================================================
    // ===============================   Main
    // ====================================================================
    // ====================================================================
    let letGrid = Array.from({ length: cellNbX+1 }, () => Array(cellNbY+1).fill(''));


    function isSectionPresent(x1, y1, x2, y2, sections) {
        return sections.some(section => 
            (section.x1 === x1 && section.y1 === y1 && section.x2 === x2 && section.y2 === y2) ||
            (section.x1 === x2 && section.y1 === y2 && section.x2 === x1 && section.y2 === y1) // Vérifie dans les deux sens
        );
    }

    function fctCreateDivs() {
        for (x=0;x<cellNbX;x++) {
            for (y=0;y<cellNbY;y++) {
                const maDiv = document.createElement('div');
                maDiv.id = x+'-'+y;
                maDiv.classList.add('classClicable');
                maDiv.style.left = x*cellSize + 'px';
                maDiv.style.top = y*cellSize + 'px';
                grid.appendChild(maDiv);
                maDiv.style.cursor = 'pointer';

                //=========================================================
                //                 Clic sur une Div
                //=========================================================
                maDiv.addEventListener('click', function() {
                    fctPlayClicOnDiv(maDiv);
                });

            }
        }
    }



    function fctPlayClicOnDiv(maDiv) {

        //console.log('clic', maDiv.style.cursor);
        if (maDiv.style.cursor=='pointer') {
            //Clic sur une case
            //showLoadingScreen();


            maDiv.style.cursor = 'default';
            let letX = parseInt(parseInt(maDiv.style.left)/cellSize);
            let letY = parseInt(parseInt(maDiv.style.top)/cellSize);
            console.log('= 🖱 clic',letX, letY);

            let lastDiv = document.getElementById(players[CurrentPlayer].lastPos.x+'-'+players[CurrentPlayer].lastPos.y);
            if (lastDiv) {
                lastDiv.style.border = 'none';
            }

            players[CurrentPlayer].lastPos = {x:letX,y:letY};
            maDiv.innerHTML = '';
            maDiv.classList.add('classCliked');                        
            maDiv.style.border = '2px solid white';

            //maDiv.style.backgroundColor = players[CurrentPlayer].color;
            maDiv.style.background = 'radial-gradient(circle at 8px 8px, white, '+players[CurrentPlayer].color+' 15%,'+players[CurrentPlayer].color+' 50%, black)'

            
            letGrid[letX][letY]=players[CurrentPlayer].char;
            // =============================================================
            // Test si 5 points alignés
            let ret = fctCinqAdjacents(letX,letY,players[CurrentPlayer].char);
            //console.log('fctCinqAdjacents ret=',ret);

            let totalAnimTime = 0;
            //Test sections existantes
            if (ret.length>0) {
                for (let i=0;i<ret.length;i++) {
                    let sectionFree = true;
                    for (let p=0;p<ret[i].points.length-1;p++) {
                        let p1x = ret[i].points[p].x;
                        let p1y = ret[i].points[p].y;
                        let p2x = ret[i].points[p+1].x;
                        let p2y = ret[i].points[p+1].y;
                        if (isSectionPresent(p1x, p1y, p2x, p2y, players[CurrentPlayer].sections)) {
                            console.log('La section est déjà présente',ret[i]);
                            sectionFree = false;
                            break;
                        }
                    }

                    if (sectionFree) {
                        console.log('Ok on ajoute la ligne',ret[i]);
                        for (let p=0;p<ret[i].points.length-1;p++) {
                            //Ajout des sections dans Players
                            let p1x = ret[i].points[p].x;
                            let p1y = ret[i].points[p].y;
                            let p2x = ret[i].points[p+1].x;
                            let p2y = ret[i].points[p+1].y;
                            players[CurrentPlayer].sections.push({ x1: p1x, y1: p1y,x2: p2x, y2: p2y });
                            //fctDessineLigne(p1x,p1y,p2x,p2y,players[CurrentPlayer].color);
                        }

                        //console.log('sections=',players[CurrentPlayer].sections);
                        //Un joueur prend la tete
                        if (players[CurrentPlayer].score==players[fctOtherPlayer()].score) {
                            playSound('magic.mp3');
                        }

                        playSound('line.mp3');
                        players[CurrentPlayer].score++;
                        document.getElementById('divScore'+CurrentPlayer).innerHTML = players[CurrentPlayer].score;
                        fctDessineLigne(ret[i].start.x,ret[i].start.y,ret[i].start.x+(4*ret[i].direction.dx),ret[i].start.y+(4*ret[i].direction.dy),players[CurrentPlayer].color);
                        totalAnimTime = animSpeedLine+(i*animSpeedLine);
                      

                    }  


                }
            }

            setTimeout(() => {

                //nettoyage des divs Simu
                const lineDivs = document.querySelectorAll('.classSimuLine');
                lineDivs.forEach(div => {
                        div.remove();
                });


                fctCleanGridHtml();

                let maLigne;
                let lvlCoef;
                //=================================================
                //================================== ADVERSE
                //=================================================
                let allCombinaisonAdverse = findAllCombinations(letGrid);
                let bestPointAdverse = null;

                if (allCombinaisonAdverse.length!=0) {
                    //console.log('findAllCombinations Adversaire',allCombinaisonAdverse);
                    let resultAdverse = analyzeEmptyPointsByLength(allCombinaisonAdverse);
                    //console.log('resultAdverse',resultAdverse);
                    lvlCoef = document.getElementById('p'+fctOtherPlayer()+'RngPrbAdv').value;
                    bestPointAdverse = fctChooseBestPointRandom(resultAdverse,lvlCoef);
                    //console.log('fctChooseBestPointRandom',bestPointAdverse);   //p0ChkTipsIconAdv
                    let ChkTipsShadAdv4 = document.getElementById('p'+fctOtherPlayer()+'ChkTipsShadAdv4').checked;
                    if (ChkTipsShadAdv4 && lvlCoef<.5) {
                        if (resultAdverse[0].emptyLength==1) {
                            allCombinaisonAdverse.forEach(combi => {
                                if (combi.empty.length==resultAdverse[0].emptyLength) {
                                    maLigne = fctDessineLigne(combi.points[0].x, combi.points[0].y, combi.points[4].x, combi.points[4].y, players[CurrentPlayer].color,true);
                                }
                            });
                        }
                    }

                    let ChkTipsShadAdv3 = document.getElementById('p'+fctOtherPlayer()+'ChkTipsShadAdv3').checked;
                    if (ChkTipsShadAdv3 && lvlCoef<.5) {
                        if (resultAdverse[0].emptyLength==2) {
                            allCombinaisonAdverse.forEach(combi => {
                                if (combi.empty.length==resultAdverse[0].emptyLength) {
                                    maLigne = fctDessineLigne(combi.points[0].x, combi.points[0].y, combi.points[4].x, combi.points[4].y, players[CurrentPlayer].color,true);
                                }
                            });
                        }
                    }

                    let ChkTipsIconAdv = document.getElementById('p'+fctOtherPlayer()+'ChkTipsIconAdv').checked;
                    //console.log('p'+fctOtherPlayer()+'ChkTipsIconAdv',ChkTipsIconAdv);
                    if (ChkTipsIconAdv && lvlCoef<.5) {
                        if (bestPointAdverse) {
                            let divbestPointAdverse = document.getElementById(bestPointAdverse.x+'-'+bestPointAdverse.y);
                            if (bestPointAdverse.length==1) {
                                divbestPointAdverse.innerHTML = '💥';
                            } else if (bestPointAdverse.length==2) {
                                divbestPointAdverse.innerHTML = '💢';
                            } else  {
                                divbestPointAdverse.style.fontSize = (20-(3*(bestPointAdverse.length-3))) + 'px';
                                divbestPointAdverse.innerHTML = '🚫';
                            }      
                        }
                    }
                }

                // ======================================= CHANGE USER
                if (CurrentPlayer==0) {
                    CurrentPlayer = 1;
                } else {
                    CurrentPlayer = 0;
                }
                fctChangeGridColor(players[CurrentPlayer].color);
                // ======================================= fin CHANGE USER

                //=================================================
                //================================== Player
                //=================================================
                let allCombinaisonPlayer = findAllCombinations(letGrid);
                let bestPointPlayer = null;
                if (allCombinaisonPlayer.length!=0) {
                    //console.log('findAllCombinations Player',allCombinaisonPlayer);
                    let resultPlayer = analyzeEmptyPointsByLength(allCombinaisonPlayer);
                    //console.log('resultPlayer',resultPlayer);
                    bestPointPlayer = fctChooseBestPointRandom(resultPlayer,document.getElementById('p'+CurrentPlayer+'RngPrbAdv').value);
                    //console.log('fctChooseBestPointRandom',bestPointPlayer);

                    let ChkTipsShadPl4 = document.getElementById('p'+CurrentPlayer+'ChkTipsShadPl4').checked;
                    if (ChkTipsShadPl4 && resultPlayer[0] && lvlCoef<.5) {
                        if (resultPlayer[0].emptyLength==1) {
                            allCombinaisonPlayer.forEach(combi => {
                                if (combi.empty.length==resultPlayer[0].emptyLength) {
                                    maLigne = fctDessineLigne(combi.points[0].x, combi.points[0].y, combi.points[4].x, combi.points[4].y, players[CurrentPlayer].color,true);
                                }
                            });
                        }
                    }

                    let ChkTipsShadPl3 = document.getElementById('p'+CurrentPlayer+'ChkTipsShadPl3').checked;
                    if (ChkTipsShadPl3 && resultPlayer[0] && lvlCoef<.5) {
                        if (resultPlayer[0].emptyLength==2) {
                            allCombinaisonPlayer.forEach(combi => {
                                if (combi.empty.length==resultPlayer[0].emptyLength) {
                                    maLigne = fctDessineLigne(combi.points[0].x, combi.points[0].y, combi.points[4].x, combi.points[4].y, players[CurrentPlayer].color,true);
                                }
                            });
                        }
                    }

                    let ChkTipsIconPl = document.getElementById('p'+CurrentPlayer+'ChkTipsIconPl').checked;
                    if (ChkTipsIconPl && lvlCoef<.5) {
                        if (bestPointPlayer) {
                            let divbestPointPlayer = document.getElementById(bestPointPlayer.x+'-'+bestPointPlayer.y);
                            if (bestPointPlayer.length==1) {
                                divbestPointPlayer.innerHTML = '💚';
                            } else if (bestPointPlayer.length==2) {
                                divbestPointPlayer.innerHTML = '💛';
                            } else  {
                                divbestPointPlayer.style.fontSize = (20-(3*(bestPointPlayer.length-2))) + 'px';
                                divbestPointPlayer.innerHTML = '🤍';
                            }
                        }
                    }
                }


                // ================================= Best
                let ptBestPoint = null;

                if (bestPointPlayer && bestPointAdverse) {
                    
                        if (bestPointPlayer.length < bestPointAdverse.length) {
                            ptBestPoint = bestPointPlayer;
                            playSound('develop.mp3');
                        } else if (bestPointPlayer.length > bestPointAdverse.length) {
                            ptBestPoint = bestPointAdverse;
                            playSound('block.mp3');
                        } else { //égalité :
                            if (bestPointPlayer.count > bestPointAdverse.count) {
                                ptBestPoint = bestPointPlayer;
                                playSound('developCnt.mp3');
                            } else if (bestPointPlayer.count < bestPointAdverse.count) {
                                ptBestPoint = bestPointAdverse;
                                playSound('blockCnt.mp3');
                            } else { //égalité :
                                if (document.getElementById('p'+CurrentPlayer+'ChkAgress').checked) {
                                    ptBestPoint = bestPointPlayer;
                                    playSound('developPrm.mp3');
                                } else {
                                    ptBestPoint = bestPointAdverse;
                                    playSound('blockPrm.mp3');
                                }
                            }
                        }
                } else if (bestPointPlayer) {
                    ptBestPoint = bestPointPlayer;
                    playSound('developOnly.mp3');
                } else if (bestPointAdverse) {
                    ptBestPoint = bestPointAdverse;
                    playSound('blockOnly.mp3');
                } else {
                    ptBestPoint = chooseRandomOnGrid();
                    playSound('random.mp3');
                }
                

                console.log("Best Point :", ptBestPoint);
                if (ptBestPoint) {

                    let ChkTipsHigh = document.getElementById('p'+CurrentPlayer+'ChkTipsHigh').checked;
                    if (ChkTipsHigh && lvlCoef<.5) {
                        let maBestDiv = document.getElementById(ptBestPoint.x+'-'+ptBestPoint.y);
                        maBestDiv.style.border = '3px solid green';
                        maBestDiv.innerHTML = '🥰';
                    }
                    
    
                    // Auto play 
                    if (players[CurrentPlayer].mode=='Computer') {
                        let bestDiv = document.getElementById(ptBestPoint.x+'-'+ptBestPoint.y);
                        setTimeout(() => {
                            showLoadingScreen();
                            setTimeout(() => {
                                if (document.getElementById('chkFocus').checked) {
                                    fctCenterOnPoint(ptBestPoint.x,ptBestPoint.y);
                                }
                                requestAnimationFrame(() => fctPlayClicOnDiv(bestDiv));
                                //bestDiv.click();
    
                                hideLoadingScreen();
                            },document.getElementById('rngCmpDelay').value);
                        },10);
                    }
    
                    // Auto LEVEL
                    if (document.getElementById('chkAutoLvl').checked) {
                        if(players[CurrentPlayer].score<players[fctOtherPlayer()].score) {
                            document.getElementById('p'+CurrentPlayer+'RngPrbAdv').value = parseFloat(document.getElementById('p'+CurrentPlayer+'RngPrbAdv').value) - .1;
                            document.getElementById('p'+CurrentPlayer+'RngPrbPl').value = parseFloat(document.getElementById('p'+CurrentPlayer+'RngPrbPl').value) - .1;
                            document.getElementById('p'+fctOtherPlayer()+'RngPrbAdv').value = parseFloat(document.getElementById('p'+fctOtherPlayer()+'RngPrbAdv').value) + .1;
                            document.getElementById('p'+fctOtherPlayer()+'RngPrbPl').value = parseFloat(document.getElementById('p'+fctOtherPlayer()+'RngPrbPl').value) + .1;
                        } else if(players[CurrentPlayer].score>players[fctOtherPlayer()].score) {
                            document.getElementById('p'+CurrentPlayer+'RngPrbAdv').value = parseFloat(document.getElementById('p'+CurrentPlayer+'RngPrbAdv').value) + .1;
                            document.getElementById('p'+CurrentPlayer+'RngPrbPl').value = parseFloat(document.getElementById('p'+CurrentPlayer+'RngPrbPl').value) + .1;
                            document.getElementById('p'+fctOtherPlayer()+'RngPrbAdv').value = parseFloat(document.getElementById('p'+fctOtherPlayer()+'RngPrbAdv').value) - .1;
                            document.getElementById('p'+fctOtherPlayer()+'RngPrbPl').value = parseFloat(document.getElementById('p'+fctOtherPlayer()+'RngPrbPl').value) - .1;
                        }                        
                        //console.log('CurrentPlayer',CurrentPlayer,document.getElementById('p'+CurrentPlayer+'RngPrbAdv').value,document.getElementById('p'+CurrentPlayer+'RngPrbPl').value);
                        //console.log('OtherPlayer',fctOtherPlayer(),document.getElementById('p'+fctOtherPlayer()+'RngPrbAdv').value,document.getElementById('p'+fctOtherPlayer()+'RngPrbPl').value);
                        const prctCurrent = 100*document.getElementById('p'+CurrentPlayer+'RngPrbAdv').value;
                        const scoreCurrent = document.getElementById('divScore'+CurrentPlayer);
                        scoreCurrent.style.setProperty('--p'+CurrentPlayer, `${prctCurrent}%`);
                        scoreCurrent.style.border = '4px solid ' + fctColor(prctCurrent/100);
                        
                        const prctOther = 100*document.getElementById('p'+fctOtherPlayer()+'RngPrbAdv').value;
                        const scoreOther = document.getElementById('divScore'+fctOtherPlayer());
                        scoreOther.style.setProperty('--p'+fctOtherPlayer(), `${prctOther}%`);
                        scoreOther.style.border = '4px solid ' + fctColor(prctOther/100);
                    } 


                } else {
                    playSound('claps-few-people.mp3');
                    fctShowToast('Game Finish !',2000);
                }

            },100+totalAnimTime);

        }

    }







    function fctGrid(posX, posY) {
        // Vérifier les limites de la grille
        if (posX >= 0 && posY >= 0 && posX < letGrid.length && posY < letGrid[0].length) {
            return letGrid[posX][posY];
        }
        return ''; // Retourne une valeur vide si hors limite
    }
    

    //===================================================================================
    //===================================================================================
    //===================================================================================
    //===================================================================================


    //===================================================================================
    //===================================================================================
    //===================================================================================

    function findAllCombinations(grid) {
        const directions = [
            { dx: 1, dy: 0 },  // Droite
            { dx: 0, dy: 1 },  // Bas
            { dx: 1, dy: 1 },  // Diagonale bas-droite
            { dx: 1, dy: -1 }  // Diagonale bas-gauche
        ];
    
        let combinations = [];
        const seenCombinations = new Set(); // Utilisé pour éviter les doublons
    
        // Parcours de tous les points de la grille
        for (let x = 0; x < grid.length; x++) {
            for (let y = 0; y < grid[x].length; y++) {
                if (grid[x][y] === players[CurrentPlayer].char) {
                    // Pour chaque point du joueur, explorer toutes les directions
                    directions.forEach(({ dx, dy }) => {
                        for (let offset = -4; offset <= 0; offset++) { // Créer des fenêtres de 5 positions
                            let points = [];
                            let occupied = [];
                            let empty = [];
                            let isPotential = true;
    
                            for (let i = 0; i < 5; i++) { // Vérifie 5 positions consécutives
                                const nx = x + (offset + i) * dx;
                                const ny = y + (offset + i) * dy;
    
                                // Vérifie si les coordonnées sont valides et alignées
                                if (nx < 0 || ny < 0 || nx >= grid.length || ny >= grid[0].length) {
                                    isPotential = false;
                                    break;
                                }
                                //Test Sections
                                if (i>0) {
                                    const lastX = x + (offset+i-1) * dx;
                                    const lastY = y + (offset+i-1) * dy;
                                    if (isSectionPresent(lastX, lastY, nx, ny, players[CurrentPlayer].sections)) {
                                        isPotential = false;
                                        break;
                                    }
                                }
    
                                const cell = grid[nx][ny];
                                points.push({ x: nx, y: ny });
    
                                if (cell === players[CurrentPlayer].char) {
                                    occupied.push({ x: nx, y: ny });
                                } else if (cell === '') {
                                    empty.push({ x: nx, y: ny });
                                } else {
                                    isPotential = false;
                                    break;
                                }
                            }
    
                            // Générer une clé unique pour la combinaison
                            if (isPotential) {
                                const key = points
                                    .map(point => `${point.x},${point.y}`)
                                    .sort() // Tri pour éviter les doublons
                                    .join('|');
    
                                if (!seenCombinations.has(key)) {
                                    seenCombinations.add(key); // Marquer comme vue
                                    combinations.push({
                                        start: { x: x + offset * dx, y: y + offset * dy },
                                        direction: { dx, dy },
                                        points,
                                        occupied,
                                        empty
                                    });
                                }
                            }
                        }
                    });
                }
            }
        }
    
        return combinations;
    }

    
    function analyzeEmptyPointsByLength(combinations) {
        const groupedByLength = new Map();
    
        // Regrouper les combinaisons par longueur de 'empty'
        combinations.forEach(({ empty }) => {
            const key = empty.length;
            if (!groupedByLength.has(key)) {
                groupedByLength.set(key, []);
            }
            groupedByLength.get(key).push(...empty);
        });
    
        // Analyser chaque groupe par longueur
        const result = [];
    
        groupedByLength.forEach((points, length) => {
            const pointCounts = new Map();
    
            // Compter la fréquence des points
            points.forEach(point => {
                const key = `${point.x},${point.y}`;
                pointCounts.set(key, (pointCounts.get(key) || 0) + 1);
            });
    
            // Trouver le point le plus fréquent
            let bestPoint = null;
            let maxCount = 0;
    
            pointCounts.forEach((count, key) => {
                if (count > maxCount) {
                    maxCount = count;
                    const [x, y] = key.split(',').map(Number);
                    bestPoint = { x, y, count, length };
                }
            });
    
            // Ajouter au résultat
            result.push({
                emptyLength: length,
                points: Array.from(pointCounts.entries()).map(([key, count]) => {
                    const [x, y] = key.split(',').map(Number);
                    return { x, y, count };
                }),
                bestPoint
            });
        });

        // Trier par longueur décroissante
        result.sort((a, b) => a.emptyLength - b.emptyLength);

        return result;
    }
    


    function chooseRandomOnGrid() {
        const Points = [];    
        // Parcourir la grille pour collecter les coordonnées (x, y) où letGrd[x][y] == ''
        for (let x = 0; x < letGrid.length; x++) {
            for (let y = 0; y < letGrid[x].length; y++) {
                if (letGrid[x][y] === '') {
                    Points.push({ x, y });
                }
            }
        }    
        // Si aucun point n'est trouvé, retourner null
        if (Points.length === 0) {
            return null;
        }
        // Choisir un point au hasard parmi les points trouvés
        const randomIndex = Math.floor(Math.random() * Points.length);
        return Points[randomIndex];
    }
    





    function fctChooseBestPointRandom(result, myLevel) {
        if (!Array.isArray(result) || result.length === 0) {
            // Aucun point n'est disponible
            //const clickedDivs = document.querySelectorAll('div.classClicable:not([class*=" "])');
            return chooseRandomOnGrid();
        }    
        // Collecter les bestPoints en respectant l'ordre des lengths décroissants
        const bestPoints = result
            .map(group => group.bestPoint)    
        //console.log('bestPoints',bestPoints);
        // Si myLevel dépasse le nombre de points disponibles, on limite
        //const maxLevel = Math.min(myLevel + 1, bestPoints.length);    
        // Sélection aléatoire parmi les points disponibles jusqu'au niveau donné
        let finalIndex = 0;
        //const randomIndex = Math.floor(Math.random() * maxLevel);
        if (Math.random()<myLevel) {
            finalIndex = 1;
            //playSound('dice.mp3');
        }
        return bestPoints[finalIndex];
    }
    

    function fctCinqAdjacents(posX, posY, playerChar) {
        const directions = [
            { dx: -1, dy: 0 }, // Gauche
            { dx: 1, dy: 0 },  // Droite
            { dx: 0, dy: -1 }, // Haut
            { dx: 0, dy: 1 },  // Bas
            { dx: -1, dy: -1 }, // Diagonale haut-gauche
            { dx: 1, dy: 1 },   // Diagonale bas-droite
            { dx: -1, dy: 1 },  // Diagonale bas-gauche
            { dx: 1, dy: -1 }   // Diagonale haut-droite
        ];
        
        const combinations = new Set(); // Utilisation d'un Set pour éviter les doublons
        const result = [];
    
        for (let { dx, dy } of directions) {
            // Vérifier toutes les positions de départ possibles pour un alignement de 5
            for (let i = -4; i <= 0; i++) {
                let isWinning = true;
                let points = [];
    
                // Vérifie les 5 cases successives dans cette direction
                for (let j = 0; j < 5; j++) {
                    const checkX = posX + (i + j) * dx;
                    const checkY = posY + (i + j) * dy;
    
                    if (fctGrid(checkX, checkY) !== playerChar) {
                        isWinning = false;
                        break;
                    }

                    if (j>0) {
                        let p1x = posX + (i + j) * dx;
                        let p1y = posY + (i + j) * dy;
                        let p2x = posY + (i + j-1) * dy;
                        let p2y = posY + (i + j-1) * dy;
                        if (isSectionPresent(p1x, p1y, p2x, p2y, players[CurrentPlayer].sections)) {
                            console.log('La section est déjà présente');
                            isWinning = false;
                            break;
                        }
                    }

    
                    points.push({ x: checkX, y: checkY });
                }

                if (isWinning) {
                    // Normalisation du point de départ et d’arrivée
                    const startX = points[0].x;
                    const startY = points[0].y;
                    const endX = points[4].x;
                    const endY = points[4].y;
    
                    // Identifier la combinaison unique (triée par les coordonnées)
                    const combinationKey = startX < endX || (startX === endX && startY < endY)
                        ? `${startX},${startY},${endX},${endY}`
                        : `${endX},${endY},${startX},${startY}`;
    
                    if (!combinations.has(combinationKey)) {
                        combinations.add(combinationKey); // Éviter les doublons
                        result.push({
                            start: { x: startX, y: startY },
                            end: { x: endX, y: endY },
                            points,
                            direction: { dx, dy }
                        });
                        
                    }
                }
            }
        }
    
        return result; // Renvoie toutes les combinaisons trouvées, sans doublons
    }
    
    


    function fctDessineLigne(inputStartX,inputStartY,inputEndX,inputEndY,playerColor,simuLine=false) {
        //console.log('〰 fctDessineLigne',inputStartX,inputStartY,inputEndX,inputEndY,playerColor,simuLine);
        let line = document.createElement('div');
        if (simuLine) {
            line.classList.add('classSimuLine');
        } else {
            line.classList.add('classLine');
        }

        const startX = inputStartX * cellSize;
        const startY = inputStartY * cellSize;
        const endX = inputEndX * cellSize;
        const endY = inputEndY * cellSize;

        line.style.left = (startX) + 'px';
        line.style.top = (startY) + 'px';
        //line.style.margin = (cellSize-.5) + 'px';
        // Calculer la longueur de la ligne
        const length = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
        line.style.height = '0px';        
        // Calculer l'angle de rotation
        let angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI)-90; // Convertir en degrés
//angle = 0;
        //console.log('fctDessineLigne',inputStartX,inputStartY,inputEndX,inputEndY,playerColor,angle);
        line.style.transformOrigin = 'top center';
        //line.style.transform = `translate(${startX}px, ${startY}px) rotate(${angle}deg)`;
        line.style.transform = `rotate(${angle}deg)`;
        // Couleur
        //line.style.background = 'linear-gradient(to right, white, dark' + playerColor + ',white)';
        line.style.backgroundColor = playerColor;
        if (simuLine) {
            grid.insertBefore(line, document.getElementById('0-0'));
            line.style.height = `${length}px`;
        } else {
            grid.appendChild(line);
            setTimeout(() => {
                line.style.height = `${length}px`;
            },animSpeedLine);
        }
        return line;
    }

    function fctOtherPlayer() {
        if (CurrentPlayer==0) {
            return 1;
        } else {
            return 0;
        }
    }


    function fctChangeGridColor(newColor) {
        // Sélectionne uniquement les éléments avec *uniquement* la classe 'classClicable'
        const clickedDivs = document.querySelectorAll('div.classClicable:not([class*=" "])');
        clickedDivs.forEach(div => {
            //div.style.backgroundColor = newColor; // Change la couleur de fond
            div.style.background = 'radial-gradient(circle at 14px 14px, white, '+newColor+' 0%,'+newColor+' 0%, black)'
            div.style.border = 'none';
            //div.style.width = '16px';
            //div.style.height = '16px';
            //div.style.margin = '12px'; // 40/2px - 16/2px
        });
    }

    function fctCleanGridHtml() {
        // Sélectionne uniquement les éléments avec *uniquement* la classe 'classClicable'
        const clickedDivs = document.querySelectorAll('div.classClicable:not([class*=" "])');
        clickedDivs.forEach(div => {
            div.innerHTML = '';
            div.style.fontSize = '20px';
        });
    }


    // ====================================================================
    // ====================================================================
    // ==================================================================== 


    // ====================================================================
    // ====================================================================
    // ====================================================================
 

    //========================================================================
    //========================================================================
    //========================================================================
    function fctReinit() {
        NbPlayers = 2;
        
        CurrentPlayer = 0;
        
        let p0Mode = document.querySelector('input[name="p0Mode"]:checked').value;
        let p1Mode = document.querySelector('input[name="p1Mode"]:checked').value;
        
        // Nettoyage des variables players
        players = [
            { color: "blue", char: "O", score: 0, sections:[],lastPos:[],mode:p0Mode},
            { color: "red", char: "X", score: 0, sections:[],lastPos:[],mode:p1Mode}
        ];
        
        document.getElementById('divScore0').innerHTML = 0;
        document.getElementById('divScore1').innerHTML = 0;
                                            
        console.log('♻ Réinit NbPlayers',players);
        cellNbX = parseInt(document.getElementById('inputGridX').value);
        cellNbY = parseInt(document.getElementById('inputGridY').value);
        
        // Définir une valeur pour la variable --cellNbX et --cellNbY
        let rootStyle = document.documentElement.style;
        rootStyle.setProperty('--cellNbX', cellNbX);
        rootStyle.setProperty('--cellNbY', cellNbY);
        
        //Réinit grid
        letGrid = Array.from({ length: cellNbX }, () => Array(cellNbY).fill(''));

        //Nettoyage des divs de la grille
        grid.innerHTML='';

        fctCreateDivs();
        fctChangeGridColor(players[CurrentPlayer].color);
        fctShowToast('🔵🔴 5inaRow<br>New game !', 2000);
        hideLoadingScreen();

        fctCenterOnPoint(5,5);
        //AutoPlay
        if(players[CurrentPlayer].mode == 'Computer') {            
            fctPlayClicOnDiv(document.getElementById('5-5'));
        }

    }
    fctReinit();
    //========================================================================
    //========================================================================
    //========================================================================



    
    //========================================================================

    //========================================================================
    //========================================================================



    //===========================
    //===========================
    //===========================


    function fctCenterOnPoint(x,y) {
        scale = rangeZoomScale.value;
        let trackX = cellSize*cellNbX;
        let trackY = cellSize*cellNbY;
        let windowWidth = document.documentElement.clientWidth;
        let windowHeight = document.documentElement.clientHeight;
        let deltaX = (windowWidth - trackX) / 2;
        let deltaY = (windowHeight - trackY) / 2;    
        // Ajustement pour centrer sur le point donné
        deltaX += ((trackX/2) - (cellSize * x)) * scale;
        deltaY += ((trackY/2) - (cellSize * y)) * scale;
        grid.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${scale})`;
    }




    //================================================================================
    //================================================================================




    // =================================================================
    // =================================================================








    const backgroundDiv = grid;

    let initialDistance = 0;
    let isDragging = false;
    let startX, startY, initialTransform;

    // Zoom with mouse wheel
    window.addEventListener('wheel', (event) => {
        if (event.deltaY > 0) {
            scale *= 0.9; // Zoom out
        } else {
            scale *= 1.1; // Zoom in
        }
        rangeZoomScale.value = scale;
        let currentTransform = grid.style.transform;
        let translatePart = currentTransform.match(/translate\([^)]*\)/); // Partie translate
        //let scalePart = currentTransform.match(/scale\([^)]*\)/); // Partie scale (s'il y en a une)
        let newTransform = `${translatePart ? translatePart[0] : 'translate(0px, 0px)'} scale(${scale})`;
        grid.style.transform = newTransform;
    });

    // Zoom with pinch gesture on mobile
    backgroundDiv.addEventListener('touchstart', (event) => {
        if (event.touches.length === 2) {
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];
            initialDistance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
        }
    });

    backgroundDiv.addEventListener('touchmove', (event) => {
        if (event.touches.length === 2) {
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];
            const currentDistance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
            const distanceDifference = currentDistance - initialDistance;

            if (distanceDifference > 0) {
                scale *= 1.01; // Zoom in
            } else if (distanceDifference < 0) {
                scale *= 0.99; // Zoom out
            }
            rangeZoomScale.value = scale;
            let currentTransform = grid.style.transform;
            let translatePart = currentTransform.match(/translate\([^)]*\)/); // Partie translate
            //let scalePart = currentTransform.match(/scale\([^)]*\)/); // Partie scale (s'il y en a une)
            let newTransform = `${translatePart ? translatePart[0] : 'translate(0px, 0px)'} scale(${scale})`;
            grid.style.transform = newTransform;
            initialDistance = currentDistance;
        }
    });

    // Drag with mouse
    backgroundDiv.addEventListener('mousedown', (event) => {
        isDragging = true;
        startX = event.clientX;
        startY = event.clientY;
        initialTransform = backgroundDiv.style.transform;
    });

    window.addEventListener('mousemove', (event) => {
        if (isDragging) {
            const deltaX = event.clientX - startX;
            const deltaY = event.clientY - startY;
            backgroundDiv.style.transform = `${initialTransform} translate(${deltaX}px, ${deltaY}px)`;
        }
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // Drag with touch
    backgroundDiv.addEventListener('touchstart', (event) => {
        if (event.touches.length === 1) {
            isDragging = true;
            startX = event.touches[0].clientX;
            startY = event.touches[0].clientY;
            initialTransform = backgroundDiv.style.transform;
        }
    });

    backgroundDiv.addEventListener('touchmove', (event) => {
        if (isDragging && event.touches.length === 1) {
            const deltaX = event.touches[0].clientX - startX;
            const deltaY = event.touches[0].clientY - startY;
            backgroundDiv.style.transform = `${initialTransform} translate(${deltaX}px, ${deltaY}px)`;
        }
    });

    backgroundDiv.addEventListener('touchend', () => {
        isDragging = false;
    });



    //================================================================================
    // LISTENER SYSTEM
    //================================================================================
    //Menu
    const divMenuBtn = document.getElementById('divMenuBtn');
    divMenuBtn.addEventListener('click', function() {
        if (divMenuContainer.style.top == '-600px' || !divMenuContainer.style.top) {
            divMenuContainer.style.top = '5%';
        } else {
            divMenuContainer.style.top = '-600px';
        } 
        
    });
    const divMenuRestart = document.getElementById('divMenuRestart');
    divMenuRestart.addEventListener('click', function() {
        fctReinit();
        divMenuContainer.style.top = '-600px';
    });
    const divMenuClose = document.getElementById('divMenuClose');
    divMenuClose.addEventListener('click', function() {
        divMenuContainer.style.top = '-600px';
    });

    //Full Screen
    divFullScreen.addEventListener('click', function() {
        requestFullScreen();  
    });

    //Sound
    let divSound = document.getElementById('divSound');
    divSound.addEventListener('click', function() {
        console.info("letSoundOn="+letSoundOn);
        if (letSoundOn) {
            divSound.innerHTML = "🔈";
            divSound.style.border = "4px solid gray";
            fctShowToast("Son désactivé 🔈",2000);
        } else {
            divSound.innerHTML = "🔊";
            divSound.style.border = "4px solid white";
            fctShowToast("Son activé 🔊",2000);
        }
        letSoundOn = !letSoundOn;
    });


    rangeZoomScale.addEventListener('input', function() {        
        fctCenterOnPoint(5,5);
    });
    //================================================================================


    //================================================================================
    // FUNCTION SYSTEM
    //================================================================================

    // Afficher l'écran de chargement
    function showLoadingScreen() {
        document.getElementById('loadingScreen').style.display = 'flex';
    }
    // Masquer l'écran de chargement
    function hideLoadingScreen() {
        document.getElementById('loadingScreen').style.display = 'none';
    }


    function fctShowToast(myText,myTime) {
        console.info("fctShowToast "+myText);
        var x = document.getElementById("snackbar");
        x.innerHTML = myText;
        x.className = "show";
        setTimeout(function(){ x.className = x.className.replace("show", ""); }, myTime);
    }


    //================================================================================
    // Passer en mode plein écran
    function requestFullScreen() {
        if (window.innerHeight == screen.height) {
            // browser is fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
                } else if (document.mozCancelFullScreen) { // Firefox
                document.mozCancelFullScreen();
                } else if (document.webkitExitFullscreen) { // Chrome, Safari and Opera
                document.webkitExitFullscreen();
                } else if (document.msExitFullscreen) { // IE/Edge
                document.msExitFullscreen();
                }
            fctShowToast('Full Screen Exited',2000);
        } else {
            const element = document.documentElement;
            if (element.requestFullscreen) {
            element.requestFullscreen();
            } else if (element.mozRequestFullScreen) { // Firefox
            element.mozRequestFullScreen();
            } else if (element.webkitRequestFullscreen) { // Chrome, Safari and Opera
            element.webkitRequestFullscreen();
            } else if (element.msRequestFullscreen) { // IE/Edge
            element.msRequestFullscreen();
            }
            fctShowToast('Full Screen Activated 👍',2000);
        }

    }


    //================================================================================
    function playSound(fileName) {
        if (!letSoundOn) return;
        let soundPlayed = false;
        for (let i=0;i<20;i++) { //tous les canaus Audio
            let audio = document.getElementById('myAudio'+i);            
            
            if (audio.paused || audio.ended) {  // Le son est en pause ou terminé, donc nous pouvons le lire
                audio.src = 'sound/' + fileName;
                audio.play();
                //console.info('🔊 '+i+'  '+fileName);
                soundPlayed = true;
                break;
            }
        }      
        if (!soundPlayed)
            console.warn("🔊🔥⚡ "+fileName);
    }

    //================================================================================




});