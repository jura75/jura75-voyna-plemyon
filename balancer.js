// ==UserScript==
// @name         Балансировщик склада (Shinko to Kuma) - Авто-парсинг групп v13.3
// @namespace    https://www.shinko-to-kuma.com/
// @version      13.3-RU
// @author       Sophie "Shinko to Kuma" (Modified)
// @match        https://*.tribalwars.net/game.php*
// @match        https://*.vojnaplemen.cz/game.php*
// @match        https://ru.innogamescdn.com/game.php*
// @grant        none
// ==/UserScript==

console.log("Latest update: 8 September 2026 - Automatic Groups Parser v13.3");

var testPage;
var is_mobile = !!navigator.userAgent.match(/iphone|android|blackberry/ig) || false;
var warehouseCapacity = [];
var allWoodTotals = [];
var allClayTotals = [];
var allIronTotals = [];
var availableMerchants = [];
var totalMerchants = [];
var farmSpaceUsed = [];
var farmSpaceTotal = [];
var villagePoints = [];
var villagesData = [];
var villageID = [];
var allWoodObjects, allClayObjects, allIronObjects, allVillages;
var totalsAndAverages = "";
var incomingRes = {};
var totalWood, totalStone, totalIron;
var merchantOrders = [];
var excessResources = [];
var shortageResources = [];
var links = [];
var cleanLinks = [];
var stillShortage = [];
var stillExcess = [];

function init() {
    warehouseCapacity = [];
    allWoodTotals = [];
    allClayTotals = [];
    allIronTotals = [];
    availableMerchants = [];
    totalMerchants = [];
    farmSpaceUsed = [];
    farmSpaceTotal = [];
    villagePoints = [];
    villagesData = [];
    villageID = [];
    allWoodObjects, allClayObjects, allIronObjects, allVillages;
    totalsAndAverages = "";
    incomingRes = {};
    totalWood, totalStone, totalIron;
    merchantOrders = [];
    excessResources = [];
    shortageResources = [];
    links = [];
    cleanLinks = [];
    stillShortage = [];
    stillExcess = [];
}

var langShinko = [
    "Балансировщик склада",
    "Деревня-источник",
    "Целевая деревня",
    "Расстояние",
    "Дерево",
    "Глина",
    "Железо",
    "Отправить ресурсы",
    "Создано Sophie 'Shinko to Kuma'",
    "Всего дерева",
    "Всего глины",
    "Всего железа",
    "Дерева на деревню",
    "Глины на деревню",
    "Железа на деревню",
    "Премиум-биржа",
    "Система"
];

var cssClassesSophie = `
<style>
.sophRowA { background-color: #32353b; color: white; }
.sophRowB { background-color: #36393f; color: white; }
.sophHeader { background-color: #202225; font-weight: bold; color: white; }
.sophLink { color:#40D0E0; }
.btnSophie { background-image: linear-gradient(#6e7178 0%, #36393f 30%, #202225 80%, black 100%); color: white; border: 1px solid #777; padding: 5px 10px; cursor: pointer; }
.btnSophie:hover { background-image: linear-gradient(#7b7e85 0%, #40444a 30%, #393c40 80%, #171717 100%); color: white; }
.sophPanel { background-color: #2f3136; color: white; padding: 10px; border: 1px solid #444; margin-bottom: 10px; }
.sophSettingsBox { background-color: #36393f; padding: 10px; border: 1px solid #555; margin-top: 5px; display: none; max-height: 500px; overflow-y: auto; }
.sophInput { background: #202225; color: white; border: 1px solid #555; padding: 4px; width: 100px; }
</style>`;

$("#contentContainer").eq(0).prepend(cssClassesSophie);
$("#mobileHeader").eq(0).prepend(cssClassesSophie);

if (localStorage.getItem("settingsWHBalancerSophieV133") != null) {
    let tempArray = JSON.parse(localStorage.getItem("settingsWHBalancerSophieV133"));
    var settings = {};
    settings.isMinting = tempArray.isMinting;
    settings.isCoinRatio = tempArray.isCoinRatio || false;
    settings.lowPoints = parseInt(tempArray.lowPoints);
    settings.highPoints = parseInt(tempArray.highPoints);
    settings.highFarm = parseInt(tempArray.highFarm);
    settings.builtOutPercentage = parseFloat(tempArray.builtOutPercentage);
    settings.needsMorePercentage = parseFloat(tempArray.needsMorePercentage);
    settings.sourceGroup = tempArray.sourceGroup || 0;
    settings.targetGroup = tempArray.targetGroup || 0;
    settings.customSourceCoord = tempArray.customSourceCoord || "";
    settings.customTargetCoord = tempArray.customTargetCoord || "";
} else {
    var settings = {
        "isMinting": false,
        "isCoinRatio": false,
        "highPoints": 8000,
        "highFarm": 23000,
        "lowPoints": 3000,
        "builtOutPercentage": 0.25,
        "needsMorePercentage": 0.85,
        "sourceGroup": 0,
        "targetGroup": 0,
        "customSourceCoord": "",
        "customTargetCoord": ""
    };
    localStorage.setItem("settingsWHBalancerSophieV133", JSON.stringify(settings));
}

if (!settings.sourceGroup) settings.sourceGroup = 0;
if (!settings.targetGroup) settings.targetGroup = 0;
if (settings.isMinting === undefined) settings.isMinting = false;
if (settings.isCoinRatio === undefined) settings.isCoinRatio = false;
if (!settings.highFarm) settings.highFarm = 99999;
if (!settings.highPoints) settings.highPoints = 12000;
if (!settings.lowPoints) settings.lowPoints = 1;
if (!settings.builtOutPercentage) settings.builtOutPercentage = 0.20;
if (!settings.needsMorePercentage) settings.needsMorePercentage = 0.85;

if ($("#sendResources")[0]) {
    $("#sendResources")[0].remove();
    $("#tableSend")[0].remove();
    $("#totals")[0].remove();
}

let activeGroupParam = settings.sourceGroup > 0 ? `&group=${settings.sourceGroup}` : (settings.targetGroup > 0 ? `&group=${settings.targetGroup}` : "");

if (game_data.player.sitter > 0) {
    var URLIncRes = `game.php?t=${game_data.player.id}&screen=overview_villages&mode=trader&type=inc&page=-1${activeGroupParam}`;
    var URLProd = `game.php?t=${game_data.player.id}&screen=overview_villages&mode=prod&page=-1${activeGroupParam}`;
} else {
    var URLIncRes = `game.php?screen=overview_villages&mode=trader&type=inc&page=-1${activeGroupParam}`;
    var URLProd = `game.php?screen=overview_villages&mode=prod&page=-1${activeGroupParam}`;
}

function sendResource(sourceID, targetID, woodAmount, stoneAmount, ironAmount, rowNr) {
    if ($("#" + rowNr)[0]) {
        $("#" + rowNr)[0].remove();
    }
    var e = { "target_id": targetID, "wood": woodAmount, "stone": stoneAmount, "iron": ironAmount };
    TribalWars.post("market", {
        ajaxaction: "map_send", village: sourceID
    }, e, function (e) {
        UI.SuccessMessage(e.message);
        console.log(e.message);
    }, !1);
}

function sendAllResourcesAutomatically() {
    let index = 0;
    function sendNext() {
        if (index >= cleanLinks.length) {
            UI.SuccessMessage("Все ресурсы успешно отправлены!");
            return;
        }
        let link = cleanLinks[index];
        index++;
        
        if (link && link.wood + link.stone + link.iron > 0) {
            TribalWars.post("market", {
                ajaxaction: "map_send", village: link.source
            }, { "target_id": link.target, "wood": link.wood, "stone": link.stone, "iron": link.iron }, function (e) {
                console.log(e.message);
                $(`#row_${index - 1}`).remove();
                setTimeout(sendNext, 200);
            }, !1);
        } else {
            sendNext();
        }
    }
    sendNext();
}

// Усовершенствованный парсер групп (собирает из игровых данных, селекторов страницы и HTML-ответа)
function parseDynamicGroups(pageContext) {
    let groupsMap = new Map();

    // 1. Извлекаем из встроенного game_data, если доступно
    if (typeof window.game_data !== 'undefined' && Array.isArray(window.game_data.groups)) {
        window.game_data.groups.forEach(g => {
            if (g.id && g.name) groupsMap.set(parseInt(g.id), g.name);
        });
    }

    // 2. Парсим селекторы групп текущей страницы DOM (#group_select)
    let domGroupSelects = $('#group_select, select[name="group"]');
    if (domGroupSelects.length > 0) {
        domGroupSelects.find('option').each(function() {
            let val = parseInt($(this).val());
            let txt = $(this).text().trim();
            if (val > 0 && txt && !txt.includes("Все") && !txt.includes("All")) {
                groupsMap.set(val, txt);
            }
        });
    }

    // 3. Парсим из переданного HTML-ответа страницы обзора (если там есть меню групп)
    if (pageContext) {
        let $page = $(pageContext);
        $page.find('#group_select option, select[name="group"] option, .group-menu option, a[href*="group="]').each(function() {
            let href = $(this).attr('href');
            let val = parseInt($(this).val());
            let txt = $(this).text().trim();

            if (href) {
                let match = href.match(/group=(\d+)/);
                if (match && match[1]) {
                    let gId = parseInt(match[1]);
                    if (gId > 0 && txt && !groupsMap.has(gId)) {
                        groupsMap.set(gId, txt);
                    }
                }
            }
            if (val > 0 && txt) {
                groupsMap.set(val, txt);
            }
        });
    }

    let resultGroups = [];
    groupsMap.forEach((name, id) => {
        resultGroups.push({ id: id, name: name });
    });
    
    // Сортируем группы по имени для удобства
    resultGroups.sort((a, b) => a.name.localeCompare(b.name));
    return resultGroups;
}

function displayEverything() {
    $.get(URLIncRes, function () {
        console.log("Grabbed transport page");
    })
    .done(function (page) {
        var $page = $(page);
        for (var i = 1; i < $page.find("#trades_table tr").length - 1; i++) {
            var villageData = {};
            var villageIDtemp;
            if ($("#mobileHeader")[0]) {
                let $resourceGroups = $page.find("#trades_table tr")[i].children[5].children[1].children;
                for (let j = 0; j < Object.keys($resourceGroups).length; j++) {
                    let $child = $($resourceGroups[j]);
                    let classNames = $child.find('.icon.mheader').attr('class').split(' ');
                    let resourceType = classNames[classNames.length - 1];
                    let resourceAmount = $child.text().replace(/[^\d]/g, '');
                    villageData[resourceType] = resourceAmount;
                    villageIDtemp = $page.find("#trades_table tr")[i].children[3].children[2].href.match(/id=(\d*)/)[1];
                }
            } else {
                let $resourceGroups = $page.find("#trades_table tr")[i].children[8].children;
                for (let j = 0; j < Object.keys($resourceGroups).length; j++) {
                    let $child = $($resourceGroups[j]);
                    var classNames;
                    if ($child[0].innerHTML.indexOf("header") > -1) {
                        classNames = $child.find('.icon.header').attr('class').split(' ');
                    } else {
                        classNames = $child.attr('class').split(' ');
                    }
                    let resourceType = classNames[classNames.length - 1];
                    let resourceAmount = $child.text().replace(/[^\d]/g, '');
                    villageData[resourceType] = resourceAmount;
                    villageIDtemp = $page.find("#trades_table tr")[i].children[4].children[0].href.match(/id=(\d*)/)[1];
                }
            }
            if (villageIDtemp) {
                if (incomingRes[villageIDtemp] == undefined) {
                    incomingRes[villageIDtemp] = { "wood": 0, "stone": 0, "iron": 0 };
                }
                if (villageData.wood != undefined) incomingRes[villageIDtemp].wood += parseInt(villageData.wood);
                if (villageData.stone != undefined) incomingRes[villageIDtemp].stone += parseInt(villageData.stone);
                if (villageData.iron != undefined) incomingRes[villageIDtemp].iron += parseInt(villageData.iron);
            }
        }

        $.get(URLProd, function () {
            console.log("Managed to grab the page");
        })
        .done(function (page) {
            testPage = page;
            
            // Парсим группы динамически прямо из ответа сервера обзора
            let dynamicGroupsList = parseDynamicGroups(page);

            var uniVillage = $(page).find("span.bonus_icon_33");
            var uniRow = uniVillage.length > 0 ? uniVillage.closest('tr').index() - 1 : -1;
            
            if ($("#mobileHeader")[0]) {
                allWoodObjects = $(page).find(".res.mwood,.warn_90.mwood,.warn.mwood");
                allClayObjects = $(page).find(".res.mstone,.warn_90.mstone,.warn.mstone");
                allIronObjects = $(page).find(".res.miron,.warn_90.miron,.warn.miron");
                var allWarehouses = $(page).find(".mheader.ressources");
                allVillages = $(page).find(".quickedit-vn");
                var allFarms = $(page).find(".header.population");
                var allMerchants = $(page).find('.trader_img').parent();
                var productionTable = $(page).find(".points-header");
                if (uniRow >= 0) {
                    allVillages.splice(uniRow, 1);
                    allWoodObjects.splice(uniRow, 1);
                    allClayObjects.splice(uniRow, 1);
                    allIronObjects.splice(uniRow, 1);
                    allWarehouses.splice(uniRow, 1);
                    allFarms.splice(uniRow, 1);
                    allMerchants.splice(uniRow, 1);
                    productionTable.splice(uniRow, 1);
                }
                for (var i = 0; i < allWoodObjects.length; i++) {
                    allWoodTotals.push(allWoodObjects[i].textContent.replace(/\./g, '').replace(',', ''));
                    allClayTotals.push(allClayObjects[i].textContent.replace(/\./g, '').replace(',', ''));
                    allIronTotals.push(allIronObjects[i].textContent.replace(/\./g, '').replace(',', ''));
                }
                for (let i = 0; i < allVillages.length; i++) {
                    farmSpaceUsed.push(allFarms[i].parentElement.innerText.match(/(\d*)\/(\d*)/)[1]);
                    farmSpaceTotal.push(allFarms[i].parentElement.innerText.match(/(\d*)\/(\d*)/)[2]);
                    warehouseCapacity.push(allWarehouses[i].parentElement.innerText);
                    availableMerchants.push(allMerchants[i].innerText);
                    totalMerchants.push("999");
                    const pointsText = $(productionTable[i]).children().length - 1;
                    villagePoints.push($(productionTable[i]).children()[pointsText].innerText.replace(/\./g, '').replace(',', ''));
                }
            } else {
                allWoodObjects = $(page).find(".res.wood,.warn_90.wood,.warn.wood");
                allClayObjects = $(page).find(".res.stone,.warn_90.stone,.warn.stone");
                allIronObjects = $(page).find(".res.iron,.warn_90.iron,.warn.iron");
                allVillages = $(page).find(".quickedit-vn");
                if (uniRow >= 0) {
                    allVillages.splice(uniRow, 1);
                    allWoodObjects.splice(uniRow, 1);
                    allClayObjects.splice(uniRow, 1);
                    allIronObjects.splice(uniRow, 1);
                }
                for (let i = 0; i < allWoodObjects.length; i++) {
                    allWoodTotals.push(allWoodObjects[i].textContent.replace(/\./g, '').replace(',', ''));
                    allClayTotals.push(allClayObjects[i].textContent.replace(/\./g, '').replace(',', ''));
                    allIronTotals.push(allIronObjects[i].textContent.replace(/\./g, '').replace(',', ''));
                }
                for (let i = 0; i < allVillages.length; i++) {
                    warehouseCapacity.push(allIronObjects[i].parentElement.nextElementSibling.innerHTML);
                    availableMerchants.push(allIronObjects[i].parentElement.nextElementSibling.nextElementSibling.innerText.match(/(\d*)\/(\d*)/)[1]);
                    totalMerchants.push(allIronObjects[i].parentElement.nextElementSibling.nextElementSibling.innerText.match(/(\d*)\/(\d*)/)[2]);
                    farmSpaceUsed.push(allIronObjects[i].parentElement.nextElementSibling.nextElementSibling.nextElementSibling.innerText.match(/(\d*)\/(\d*)/)[1]);
                    farmSpaceTotal.push(allIronObjects[i].parentElement.nextElementSibling.nextElementSibling.nextElementSibling.innerText.match(/(\d*)\/(\d*)/)[2]);
                    villagePoints.push(allWoodObjects[i].parentElement.previousElementSibling.innerText.replace(/\./g, '').replace(',', ''));
                }
            }

            for (let i = 0; i < allVillages.length; i++) {
                villagesData.push({
                    "id": allVillages[i].dataset.id,
                    "points": villagePoints[i],
                    "url": allVillages[i].children[0].children[0].href,
                    "name": allVillages[i].innerText.trim(),
                    "wood": allWoodTotals[i],
                    "stone": allClayTotals[i],
                    "iron": allIronTotals[i],
                    "availableMerchants": availableMerchants[i],
                    "totalMerchants": totalMerchants[i],
                    "warehouseCapacity": warehouseCapacity[i],
                    "farmSpaceUsed": farmSpaceUsed[i],
                    "farmSpaceTotal": farmSpaceTotal[i]
                });
            }

            villagesData.sort((a, b) => (parseInt(a.points) < parseInt(b.points)) ? 1 : -1);

            totalWood = 0; totalStone = 0; totalIron = 0;
            for (let i in allWoodTotals) { totalWood += parseInt(allWoodTotals[i]); }
            for (let i in allClayTotals) { totalStone += parseInt(allClayTotals[i]); }
            for (let i in allIronTotals) { totalIron += parseInt(allIronTotals[i]); }
            
            for (let o = 0; o < Object.keys(incomingRes).length; o++) {
                totalWood += incomingRes[Object.keys(incomingRes)[o]].wood;
                totalStone += incomingRes[Object.keys(incomingRes)[o]].stone;
                totalIron += incomingRes[Object.keys(incomingRes)[o]].iron;
            }
            var woodAverage = Math.floor(totalWood / warehouseCapacity.length);
            var stoneAverage = Math.floor(totalStone / warehouseCapacity.length);
            var ironAverage = Math.floor(totalIron / warehouseCapacity.length);

            var actualWoodAverage = woodAverage, actualStoneAverage = stoneAverage, actualIronAverage = ironAverage;

            if (settings.isMinting == false && !settings.isCoinRatio) {
                let actualTotalWood = totalWood, actualTotalStone = totalStone, actualTotalIron = totalIron;
                let actualWHCountNeedsBalancingWood = warehouseCapacity.length;
                let actualWHCountNeedsBalancingStone = warehouseCapacity.length;
                let actualWHCountNeedsBalancingIron = warehouseCapacity.length;
                for (let i = 0; i < warehouseCapacity.length; i++) {
                    actualWoodAverage = Math.floor(actualTotalWood / actualWHCountNeedsBalancingWood);
                    actualStoneAverage = Math.floor(actualTotalStone / actualWHCountNeedsBalancingStone);
                    actualIronAverage = Math.floor(actualTotalIron / actualWHCountNeedsBalancingIron);
                    if (warehouseCapacity[i] < actualWoodAverage) {
                        actualTotalWood -= actualWoodAverage - warehouseCapacity[i] * settings.needsMorePercentage;
                        actualWHCountNeedsBalancingWood--;
                    }
                    if (warehouseCapacity[i] < actualStoneAverage) {
                        actualTotalStone -= actualStoneAverage - warehouseCapacity[i] * settings.needsMorePercentage;
                        actualWHCountNeedsBalancingStone--;
                    }
                    if (warehouseCapacity[i] < actualIronAverage) {
                        actualTotalIron -= actualIronAverage - warehouseCapacity[i] * settings.needsMorePercentage;
                        actualWHCountNeedsBalancingIron--;
                    }
                }
            }

            totalsAndAverages = `<div id='totals' class='sophHeader' border=0>
                <table id='totalsAndAverages' width='100%'>
                <tr class='sophRowA'>
                <td>${langShinko[9]}: ${numberWithCommas(totalWood)}</td>
                <td>${langShinko[10]}: ${numberWithCommas(totalStone)}</td>
                <td>${langShinko[11]}: ${numberWithCommas(totalIron)}</td>
                </tr>
                <tr class='sophRowB'>
                <td>${langShinko[12]}: ${numberWithCommas(woodAverage)}</td>
                <td>${langShinko[13]}: ${numberWithCommas(stoneAverage)}</td>
                <td>${langShinko[14]}: ${numberWithCommas(ironAverage)}</td>
                </tr>
                </table></div>`;

            $(".content-border").eq(0).prepend(`<div id="progressbar" style="width: 100%; background-color: #36393f;"><div id="progress" style="width: 0%; height: 35px; background-color: #4CAF50; text-align: center; line-height: 32px; color: black;">Загрузка данных...</div></div>`);
            
            for (let v = 0; v < villagesData.length; v++) {
                excessResources[v] = [];
                shortageResources[v] = [];
                villageID.push(villagesData[v].id);
                let incomingWood = incomingRes[villagesData[v].id] ? incomingRes[villagesData[v].id].wood : 0;
                let incomingStone = incomingRes[villagesData[v].id] ? incomingRes[villagesData[v].id].stone : 0;
                let incomingIron = incomingRes[villagesData[v].id] ? incomingRes[villagesData[v].id].iron : 0;

                let tempWood, tempStone, tempIron;

                let isTargetCustomMatch = settings.customTargetCoord && villagesData[v].name.indexOf(settings.customTargetCoord) > -1;
                let isTargetValid = (!settings.customTargetCoord || isTargetCustomMatch);

                if (settings.isCoinRatio && isTargetValid) {
                    let whCap = parseInt(villagesData[v].warehouseCapacity);
                    let maxCoins = Math.floor(whCap / 83000);
                    if (maxCoins < 1) maxCoins = 1;
                    
                    let targetWoodCoin = maxCoins * 28000;
                    let targetStoneCoin = maxCoins * 30000;
                    let targetIronCoin = maxCoins * 25000;

                    tempWood = parseInt(villagesData[v].wood) + incomingWood - targetWoodCoin;
                    tempStone = parseInt(villagesData[v].stone) + incomingStone - targetStoneCoin;
                    tempIron = parseInt(villagesData[v].iron) + incomingIron - targetIronCoin;
                } else {
                    tempWood = actualWoodAverage < villagesData[v].warehouseCapacity * settings.needsMorePercentage ? parseInt(villagesData[v].wood) + incomingWood - actualWoodAverage : -Math.round((villagesData[v].warehouseCapacity * settings.needsMorePercentage) - incomingWood - parseInt(villagesData[v].wood));
                    tempStone = actualStoneAverage < villagesData[v].warehouseCapacity * settings.needsMorePercentage ? parseInt(villagesData[v].stone) + incomingStone - actualStoneAverage : -Math.round((villagesData[v].warehouseCapacity * settings.needsMorePercentage) - incomingStone - parseInt(villagesData[v].stone));
                    tempIron = actualIronAverage < villagesData[v].warehouseCapacity * settings.needsMorePercentage ? parseInt(villagesData[v].iron) + incomingIron - actualIronAverage : -Math.round((villagesData[v].warehouseCapacity * settings.needsMorePercentage) - incomingIron - parseInt(villagesData[v].iron));
                }

                if (tempWood > 0) { excessResources[v].push({ "wood": Math.floor(tempWood / 1000) * 1000 }); shortageResources[v].push({ "wood": 0 }); }
                else { shortageResources[v].push({ "wood": Math.floor(-tempWood / 1000) * 1000 }); excessResources[v].push({ "wood": 0 }); }

                if (tempStone > 0) { excessResources[v].push({ "stone": Math.floor(tempStone / 1000) * 1000 }); shortageResources[v].push({ "stone": 0 }); }
                else { shortageResources[v].push({ "stone": Math.floor(-tempStone / 1000) * 1000 }); excessResources[v].push({ "stone": 0 }); }

                if (tempIron > 0) { excessResources[v].push({ "iron": Math.floor(tempIron / 1000) * 1000 }); shortageResources[v].push({ "iron": 0 }); }
                else { shortageResources[v].push({ "iron": Math.floor(-tempIron / 1000) * 1000 }); excessResources[v].push({ "iron": 0 }); }
            }

            for (let p = 0; p < excessResources.length; p++) {
                let isSourceCustomMatch = settings.customSourceCoord && villagesData[p].name.indexOf(settings.customSourceCoord) > -1;
                let isSourceValid = (!settings.customSourceCoord || isSourceCustomMatch);

                let tempAllExcessCombined = parseInt(Math.floor(excessResources[p][0].wood / 1000) * 1000) + parseInt(Math.floor(excessResources[p][1].stone / 1000) * 1000) + parseInt(Math.floor(excessResources[p][2].iron / 1000) * 1000);
                
                if (tempAllExcessCombined > 0 && villagesData[p].availableMerchants > 0 && isSourceValid) {
                    let availableMerchantsCount = parseInt(villagesData[p].availableMerchants);
                    let tempMaxMerchantsNeeded = Math.floor(tempAllExcessCombined / 1000);
                    
                    if (tempMaxMerchantsNeeded <= availableMerchantsCount) {
                        merchantOrders.push({ "villageID": villagesData[p].id, "x": villagesData[p].name.match(/(\d+)\|(\d+)/)[1], "y": villagesData[p].name.match(/(\d+)\|(\d+)/)[2], "wood": Math.floor(excessResources[p][0].wood / 1000), "stone": Math.floor(excessResources[p][1].stone / 1000), "iron": Math.floor(excessResources[p][2].iron / 1000) });
                    } else {
                        let tempPercWood = excessResources[p][0].wood / tempAllExcessCombined;
                        let tempPercStone = excessResources[p][1].stone / tempAllExcessCombined;
                        let tempPercIron = excessResources[p][2].iron / tempAllExcessCombined;
                        merchantOrders.push({ "villageID": villagesData[p].id, "x": villagesData[p].name.match(/(\d+)\|(\d+)/)[1], "y": villagesData[p].name.match(/(\d+)\|(\d+)/)[2], "wood": Math.floor(tempPercWood * availableMerchantsCount), "stone": Math.floor(tempPercStone * availableMerchantsCount), "iron": Math.floor(tempPercIron * availableMerchantsCount) });
                    }
                }
            }

            for (let q = shortageResources.length - 1; q >= 0; q--) {
                for (let d = 0; d < merchantOrders.length; d++) {
                    merchantOrders[d].distance = checkDistance(merchantOrders[d].x, merchantOrders[d].y, villagesData[q].name.match(/(\d+)\|(\d+)/)[1], villagesData[q].name.match(/(\d+)\|(\d+)/)[2]);
                }
                merchantOrders.sort((l, r) => l.distance - r.distance);
                
                if (shortageResources[q][0].wood > 0) {
                    while (shortageResources[q][0].wood > 0) {
                        let totalWoodToTrade = 0;
                        for (let m = 0; m < merchantOrders.length; m++) {
                            totalWoodToTrade += merchantOrders[m].wood;
                            if (merchantOrders[m].wood > 0) {
                                if (shortageResources[q][0].wood <= merchantOrders[m].wood * 1000) {
                                    links.push({ "source": merchantOrders[m].villageID, "target": villageID[q], "wood": shortageResources[q][0].wood });
                                    merchantOrders[m].wood -= shortageResources[q][0].wood / 1000;
                                    shortageResources[q][0].wood = 0;
                                } else {
                                    links.push({ "source": merchantOrders[m].villageID, "target": villageID[q], "wood": merchantOrders[m].wood * 1000 });
                                    shortageResources[q][0].wood -= merchantOrders[m].wood * 1000;
                                    merchantOrders[m].wood = 0;
                                }
                            }
                            if (shortageResources[q][0].wood <= 0) break;
                            if (m == merchantOrders.length - 1 && totalWoodToTrade == 0) break;
                        }
                        if (totalWoodToTrade == 0) break;
                    }
                }
            }

            for (let q = shortageResources.length - 1; q >= 0; q--) {
                for (let d = 0; d < merchantOrders.length; d++) {
                    merchantOrders[d].distance = checkDistance(merchantOrders[d].x, merchantOrders[d].y, villagesData[q].name.match(/(\d+)\|(\d+)/)[1], villagesData[q].name.match(/(\d+)\|(\d+)/)[2]);
                }
                merchantOrders.sort((l, r) => l.distance - r.distance);
                
                if (shortageResources[q][1].stone > 0) {
                    while (shortageResources[q][1].stone > 0) {
                        let totalstoneToTrade = 0;
                        for (let m = 0; m < merchantOrders.length; m++) {
                            totalstoneToTrade += merchantOrders[m].stone;
                            if (merchantOrders[m].stone > 0) {
                                if (shortageResources[q][1].stone <= merchantOrders[m].stone * 1000) {
                                    links.push({ "source": merchantOrders[m].villageID, "target": villageID[q], "stone": shortageResources[q][1].stone });
                                    merchantOrders[m].stone -= shortageResources[q][1].stone / 1000;
                                    shortageResources[q][1].stone = 0;
                                } else {
                                    links.push({ "source": merchantOrders[m].villageID, "target": villageID[q], "stone": merchantOrders[m].stone * 1000 });
                                    shortageResources[q][1].stone -= merchantOrders[m].stone * 1000;
                                    merchantOrders[m].stone = 0;
                                }
                            }
                            if (shortageResources[q][1].stone <= 0) break;
                            if (m == merchantOrders.length - 1 && totalstoneToTrade == 0) break;
                        }
                        if (totalstoneToTrade == 0) break;
                    }
                }
            }

            for (let q = shortageResources.length - 1; q >= 0; q--) {
                for (let d = 0; d < merchantOrders.length; d++) {
                    merchantOrders[d].distance = checkDistance(merchantOrders[d].x, merchantOrders[d].y, villagesData[q].name.match(/(\d+)\|(\d+)/)[1], villagesData[q].name.match(/(\d+)\|(\d+)/)[2]);
                }
                merchantOrders.sort((l, r) => l.distance - r.distance);
                
                if (shortageResources[q][2].iron > 0) {
                    while (shortageResources[q][2].iron > 0) {
                        let totalironToTrade = 0;
                        for (let m = 0; m < merchantOrders.length; m++) {
                            totalironToTrade += merchantOrders[m].iron;
                            if (merchantOrders[m].iron > 0) {
                                if (shortageResources[q][2].iron <= merchantOrders[m].iron * 1000) {
                                    links.push({ "source": merchantOrders[m].villageID, "target": villageID[q], "iron": shortageResources[q][2].iron });
                                    merchantOrders[m].iron -= shortageResources[q][2].iron / 1000;
                                    shortageResources[q][2].iron = 0;
                                } else {
                                    links.push({ "source": merchantOrders[m].villageID, "target": villageID[q], "iron": merchantOrders[m].iron * 1000 });
                                    shortageResources[q][2].iron -= merchantOrders[m].iron * 1000;
                                    merchantOrders[m].iron = 0;
                                }
                            }
                            if (shortageResources[q][2].iron <= 0) break;
                            if (m == merchantOrders.length - 1 && totalironToTrade == 0) break;
                        }
                        if (totalironToTrade == 0) break;
                    }
                }
            }

            $("#progress").remove();

            // Динамическое формирование селекторов групп
            let groupOptionsSource = `<option value="0">Все деревни (источник)</option>`;
            let groupOptionsTarget = `<option value="0">Все деревни (цель)</option>`;
            
            dynamicGroupsList.forEach(group => {
                let selSrc = (group.id == settings.sourceGroup) ? "selected" : "";
                let selTgt = (group.id == settings.targetGroup) ? "selected" : "";
                groupOptionsSource += `<option value="${group.id}" ${selSrc}>${group.name}</option>`;
                groupOptionsTarget += `<option value="${group.id}" ${selTgt}>${group.name}</option>`;
            });

            var htmlCode = `<div id="restart">${totalsAndAverages}</div>
                <div id="sendResources" class="sophPanel">
                    <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                        <button class="btn btnSophie" onclick="toggleSettingsPanel()">⚙️ Открыть/Закрыть настройки</button>
                        <button class="btn btnSophie" style="background-color: #28a745; font-weight: bold;" onclick="sendAllResourcesAutomatically()">🚀 Отправить все автоматически</button>
                    </div>
                    <div id="sophSettingsBox" class="sophSettingsBox">
                        <form id="settings">
                            <table style="width: 100%; border-spacing: 5px;">
                            <tr><td><label for="sourceGroup">Группа ОТКУДА (источник):</label></td><td><select name="sourceGroup" id="sourceGroup" style="color: black; width: 100%;">${groupOptionsSource}</select></td></tr>
                            <tr><td><label for="targetGroup">Группа КУДА (цель):</label></td><td><select name="targetGroup" id="targetGroup" style="color: black; width: 100%;">${groupOptionsTarget}</select></td></tr>
                            <tr><td><label for="customSourceCoord">Координата ОТКУДА (опционально):</label></td><td><input type="text" class="sophInput" name="customSourceCoord" value="${settings.customSourceCoord}" placeholder="500|500"></td></tr>
                            <tr><td><label for="customTargetCoord">Координата КУДА (опционально):</label></td><td><input type="text" class="sophInput" name="customTargetCoord" value="${settings.customTargetCoord}" placeholder="501|501"></td></tr>
                            <tr><td><label for="isCoinRatio">Чеканка монет (Д:28k / Г:30k / Ж:25k):</label></td><td><input type="checkbox" name="isCoinRatio"></td></tr>
                            <tr><td><label for="isMinting">Игнорировать стандартный баланс:</label></td><td><input type="checkbox" name="isMinting"></td></tr>
                            <tr><td><label for="lowPoints">Приоритет роста:</label></td><td><input type="range" min="0" max="13000" step="10" value="${settings.lowPoints}" class="slider" name="lowPoints" oninput="sliderChange('lowPoints',this.value)"> <output id="lowPoints">${settings.lowPoints}</output> очков</td></tr>
                            <tr><td><label for="highPoints">Готовые деревни:</label></td><td><input type="range" min="0" max="13000" step="10" value="${settings.highPoints}" class="slider" name="highPoints" oninput="sliderChange('highPoints',this.value)"> > <output id="highPoints">${settings.highPoints}</output> очков</td></tr>
                            <tr><td><label for="highFarm">Высокая ферма:</label></td><td><input type="range" min="0" max="33000" step="10" value="${settings.highFarm}" class="slider" name="highFarm" oninput="sliderChange('highFarm',this.value)"> <output id="highFarm">${settings.highFarm}</output> нас.</td></tr>
                            <tr><td><label for="builtOutPercentage">Склад (готовые):</label></td><td><input type="range" min="0" max="1" step="0.01" value="${settings.builtOutPercentage}" class="slider" name="builtOutPercentage" oninput="sliderChange('builtOutPercentage',this.value)"> <output id="builtOutPercentage">${settings.builtOutPercentage}</output></td></tr>
                            <tr><td><label for="needsMorePercentage">Склад (приоритет):</label></td><td><input type="range" min="0" max="1" step="0.01" value="${settings.needsMorePercentage}" class="slider" name="needsMorePercentage" oninput="sliderChange('needsMorePercentage',this.value)"> <output id="needsMorePercentage">${settings.needsMorePercentage}</output></td></tr>
                            <tr><td colspan="2"><input type="button" class="btn btnSophie" style="background: #007bff; width: 100%; margin-top: 10px;" value="Сохранить настройки" onclick="saveSettings();"/></td></tr>
                            </table>
                        </form>
                    </div>
                </div>
                <table id="tableSend" width="100%" class="sophHeader">
                <tbody id="appendHere">
                    <tr><td class="sophHeader" colspan=7 style="text-align:center">${langShinko[0]}</td></tr>
                    <tr>
                        <td class="sophHeader" width="25%" style="text-align:center">${langShinko[1]}</td>
                        <td class="sophHeader" width="25%" style="text-align:center">${langShinko[2]}</td>
                        <td class="sophHeader" width="5%" style="text-align:center">${langShinko[3]}</td>
                        <td class="sophHeader" width="10%" style="text-align:center">${langShinko[4]}</td>
                        <td class="sophHeader" width="10%" style="text-align:center">${langShinko[5]}</td>
                        <td class="sophHeader" width="10%" style="text-align:center">${langShinko[6]}</td>
                        <td class="sophHeader" width="10%"><font size="1">${langShinko[8]}</font></td>
                    </tr>
                </tbody>
            </table>`;

            $("#content_value").eq(0).prepend(htmlCode);
            $("input[name='isMinting']").attr("checked", settings.isMinting);
            $("input[name='isCoinRatio']").attr("checked", settings.isCoinRatio);
            createList();
        });
    });
}

function toggleSettingsPanel() {
    let box = document.getElementById("sophSettingsBox");
    if (box.style.display === "block") {
        box.style.display = "none";
    } else {
        box.style.display = "block";
    }
}

function createList() {
    for (let i = 0; i < links.length; i++) {
        if (!links[i].wood) links[i].wood = 0;
        if (!links[i].stone) links[i].stone = 0;
        if (!links[i].iron) links[i].iron = 0;
    }
    for (let i = 0; i < links.length; i++) {
        for (let j = 0; j < links.length; j++) {
            if (links[i].source == links[j].source && links[i].target == links[j].target && i != j) {
                links[i].wood += parseInt(links[j].wood); links[j].wood = 0;
                links[i].stone += parseInt(links[j].stone); links[j].stone = 0;
                links[i].iron += parseInt(links[j].iron); links[j].iron = 0;
            }
        }
    }
    for (let i = 0; i < links.length; i++) {
        if (links[i].wood + links[i].stone + links[i].iron == 0) delete links[i];
    }
    for (let i = 0; i < Object.keys(links).length; i++) {
        cleanLinks.push(links[Object.keys(links)[i]]);
    }

    cleanLinks = addDistanceToArray(cleanLinks);
    var listHTML = ``;
    cleanLinks.sort((l, r) => l.distance - r.distance);
    
    for (let i = 0; i < cleanLinks.length; i++) {
        let tempRow = (i % 2 == 0) ? ` id='row_${i}' class='sophRowB'` : ` id='row_${i}' class='sophRowA'`;
        let sourceName = "", sourceURL = "", targetName = "", targetURL = "", targetWood = 0, targetStone = 0, targetIron = 0, targetCapacity = 0;

        for (let property in villagesData) {
            if (villagesData[property].id == cleanLinks[i].source) {
                sourceName = villagesData[property].name; sourceURL = villagesData[property].url;
            }
            if (villagesData[property].id == cleanLinks[i].target) {
                targetName = villagesData[property].name; targetURL = villagesData[property].url;
                targetWood = villagesData[property].wood; targetStone = villagesData[property].stone;
                targetIron = villagesData[property].iron; targetCapacity = villagesData[property].warehouseCapacity;
            }
        }

        listHTML += `
        <tr ${tempRow} height="40">
            <td><a href="${sourceURL}" class="sophLink">${sourceName}</a></td>
            <td><a href="${targetURL}" class="sophLink">${targetName}</a></td>
            <td width="50" style="text-align:center">${cleanLinks[i].distance}</td>
            <td width="50" style="text-align:center">${cleanLinks[i].wood}<span class="icon header wood"></span></td>
            <td width="50" style="text-align:center">${cleanLinks[i].stone}<span class="icon header stone"></span></td>
            <td width="50" style="text-align:center">${cleanLinks[i].iron}<span class="icon header iron"></span></td>
            <td style="text-align:center"><input type="button" class="btn btnSophie" id="building_${i}" value="${langShinko[7]}" onclick="sendResource(${cleanLinks[i].source},${cleanLinks[i].target},${cleanLinks[i].wood},${cleanLinks[i].stone},${cleanLinks[i].iron},'row_${i}')"></td>
        </tr>`;
    }
    $("#appendHere").eq(0).append(listHTML);

    for (let i = 0; i < shortageResources.length; i++) {
        if (parseInt(shortageResources[i][0].wood) + parseInt(shortageResources[i][1].stone) + parseInt(shortageResources[i][2].iron) != 0) {
            stillShortage.push([villagesData[i].name, shortageResources[i]]);
        }
    }
    for (let i = 0; i < excessResources.length; i++) {
        if (parseInt(excessResources[i][0].wood) + parseInt(excessResources[i][1].stone) + parseInt(excessResources[i][2].iron) != 0) {
            stillExcess.push([villagesData[i].name, excessResources[i]]);
        }
    }

    $("#totals").eq(0).append(`<div id='aftermath' style="padding: 5px;"><center>
        <button type="button" class="btn btnSophie" name="showStats" style="margin: 2px;" onclick="showStats()">Показать излишки / нехватку</button>
        <button type="button" class="btn btnSophie" name="showEndResult" style="margin: 2px;" onclick="resAfterBalance()">Показать результат баланса</button>
    </center></div>`);
}

displayEverything();

function checkDistance(x1, y1, x2, y2) {
    var a = x1 - x2, b = y1 - y2;
    return Math.round(Math.hypot(a, b));
}

function addDistanceToArray(array) {
    for (let i = 0; i < array.length; i++) {
        let sourceName = "", targetName = "";
        for (let property in villagesData) {
            if (villagesData[property].id == array[i].source) sourceName = villagesData[property].name;
            if (villagesData[property].id == array[i].target) targetName = villagesData[property].name;
        }
        array[i].distance = checkDistance(sourceName.match(/(\d+)\|(\d+)/)[1], sourceName.match(/(\d+)\|(\d+)/)[2], targetName.match(/(\d+)\|(\d+)/)[1], targetName.match(/(\d+)\|(\d+)/)[2]);
    }
    return array;
}

function numberWithCommas(x) {
    x = x.toString();
    var pattern = /(-?\d+)(\d{3})/;
    while (pattern.test(x)) x = x.replace(pattern, "$1.$2");
    return x;
}

function showStats() {
    let htmlStats = "<div class='sophRowA' style='width:800px; padding:10px; max-height: 500px; overflow-y: auto;'><center><h1>Нехватка:</h1><table class='sophHeader' width='100%'><tr class='sophHeader'><td>Деревня</td><td>Ресурсы</td></tr>";
    for (let i = 0; i < stillShortage.length; i++) {
        let tempRow = (i % 2 == 0) ? "class='sophRowB'" : "class='sophRowA'";
        htmlStats += `<tr ${tempRow} height="30"><td>${stillShortage[i][0]}</td><td>Д: ${stillShortage[i][1][0].wood} , Г: ${stillShortage[i][1][1].stone} , Ж: ${stillShortage[i][1][2].iron}</td></tr>`;
    }
    htmlStats += "</table><h1>Излишки:</h1><table class='sophHeader' width='100%'><tr class='sophHeader'><td>Деревня</td><td>Ресурсы</td></tr>";
    for (let i = 0; i < stillExcess.length; i++) {
        let tempRow = (i % 2 == 0) ? "class='sophRowB'" : "class='sophRowA'";
        htmlStats += `<tr ${tempRow} height="30"><td>${stillExcess[i][0]}</td><td>Д: ${stillExcess[i][1][0].wood} , Г: ${stillExcess[i][1][1].stone} , Ж: ${stillExcess[i][1][2].iron}</td></tr>`;
    }
    htmlStats += "</table></center></div>";
    Dialog.show("content", htmlStats);
}

function saveSettings() {
    settings.sourceGroup = parseInt($("#sourceGroup").val());
    settings.targetGroup = parseInt($("#targetGroup").val());
    settings.customSourceCoord = $("input[name='customSourceCoord']").val().trim();
    settings.customTargetCoord = $("input[name='customTargetCoord']").val().trim();
    settings.isMinting = $("input[name='isMinting']")[0].checked;
    settings.isCoinRatio = $("input[name='isCoinRatio']")[0].checked;
    
    let tempArray = $("#settings").serializeArray();
    settings.lowPoints = parseInt(tempArray[4].value);
    settings.highPoints = parseInt(tempArray[5].value);
    settings.highFarm = parseInt(settings.highFarm);
    settings.builtOutPercentage = parseFloat(settings.builtOutPercentage);
    settings.needsMorePercentage = parseFloat(settings.needsMorePercentage);

    localStorage.setItem("settingsWHBalancerSophieV133", JSON.stringify(settings));
    $(".sophPanel").remove();
    $("div[id*='restart']").remove();
    $("table[id*='tableSend']").remove();
    init();
    displayEverything();
}

function sliderChange(name, val) {
    document.getElementById(name).innerHTML = val;
}

function resAfterBalance() {
    var resBalancedHTML = `<div class='sophRowA' style='width:800px; padding:10px; max-height: 500px; overflow-y: auto;'><table style='width:100%'><tr class="sophHeader"><td>Деревня</td><td>Очки</td><td>Торговцы</td><td colspan="3">Ресурсы</td><td>Склад</td></tr>`;
    for (var i = 0; i < villagesData.length; i++) {
        let thisMerchantLeft = villagesData[i].availableMerchants;
        let thisVillageTotalWood = incomingRes[villagesData[i].id] ? incomingRes[villagesData[i].id].wood + parseInt(villagesData[i].wood) : parseInt(villagesData[i].wood);
        let thisVillageTotalStone = incomingRes[villagesData[i].id] ? incomingRes[villagesData[i].id].stone + parseInt(villagesData[i].stone) : parseInt(villagesData[i].stone);
        let thisVillageTotalIron = incomingRes[villagesData[i].id] ? incomingRes[villagesData[i].id].iron + parseInt(villagesData[i].iron) : parseInt(villagesData[i].iron);

        for (var j = 0; j < cleanLinks.length; j++) {
            if (cleanLinks[j].target == villagesData[i].id) {
                thisVillageTotalWood += cleanLinks[j].wood;
                thisVillageTotalStone += cleanLinks[j].stone;
                thisVillageTotalIron += cleanLinks[j].iron;
            }
            if (cleanLinks[j].source == villagesData[i].id) {
                thisVillageTotalWood -= cleanLinks[j].wood;
                thisVillageTotalStone -= cleanLinks[j].stone;
                thisVillageTotalIron -= cleanLinks[j].iron;
                thisMerchantLeft -= (cleanLinks[j].wood + cleanLinks[j].stone + cleanLinks[j].iron) / 1000;
            }
        }

        let tempRow = (i % 2 == 0) ? "class='sophRowB'" : "class='sophRowA'";
        resBalancedHTML += `
        <tr ${tempRow}>
            <td>${villagesData[i].name}</td>
            <td>${villagesData[i].points}</td>
            <td style="text-align:right;padding-right:2em">${thisMerchantLeft + "/" + villagesData[i].totalMerchants}</td>
            <td><span class="res wood">&nbsp;</span>${thisVillageTotalWood}</td>
            <td><span class="res stone">&nbsp;</span>${thisVillageTotalStone}</td>
            <td><span class="res iron">&nbsp;</span>${thisVillageTotalIron}</td>
            <td style="text-align:right">${villagesData[i].warehouseCapacity}</td>
        </tr>`;
    }
    resBalancedHTML += `</table></div>`;
    Dialog.show('content', resBalancedHTML);
}
