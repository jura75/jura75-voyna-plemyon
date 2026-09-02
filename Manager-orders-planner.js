// ==UserScript==
// @name         Devils Noble Spam Planner Enhancer
// @namespace    http://tampermonkey.net/
// @version      1.2.52
// @match        https://*.tw/game.php*
// @match        https://*.plemiona.pl/game.php*
// @match        https://*.vojnapremena.com/game.php*
// @grant        none
// ==/UserScript==

ScriptAPI.register('Devils Noble Spam Planner Enhancer', true, 'ixfuryanix (Devilicious#9733)', 'nl.tribalwars@coma.innogames.de');

(async () => {
  if (typeof window.twLib === 'undefined') {
    window.twLib = {
      queues: null,
      init: function () {
        if (this.queues === null) {
          this.queues = this.queueLib.createQueues(5);
        }
      },
      queueLib: {
        maxAttempts: 3,
        Item: function (action, arg, promise = null) {
          this.action = action;
          this.arguments = arg;
          this.promise = promise;
          this.attempts = 0;
        },
        Queue: function () {
          this.list = [];
          this.working = false;
          this.length = 0;

          this.doNext = function () {
            let item = this.dequeue();
            let self = this;

            if (item.action === 'openWindow') {
              window.open(...item.arguments).addEventListener('DOMContentLoaded', function () {
                self.start();
              });
            } else {
              $[item.action](...item.arguments).done(function () {
                item.promise.resolve.apply(null, arguments);
                self.start();
              }).fail(function () {
                item.attempts += 1;
                if (item.attempts < twLib.queueLib.maxAttempts) {
                  self.enqueue(item, true);
                } else {
                  item.promise.reject.apply(null, arguments);
                }

                self.start();
              });
            }
          };

          this.start = function () {
            if (this.length) {
              this.working = true;
              this.doNext();
            } else {
              this.working = false;
            }
          };

          this.dequeue = function () {
            this.length -= 1;
            return this.list.shift();
          };

          this.enqueue = function (item, front = false) {
            (front) ? this.list.unshift(item) : this.list.push(item);
            this.length += 1;

            if (!this.working) {
              this.start();
            }
          };
        },
        createQueues: function (amount) {
          let arr = [];

          for (let i = 0; i < amount; i++) {
            arr[i] = new twLib.queueLib.Queue();
          }

          return arr;
        },
        addItem: function (item) {
          let leastBusyQueue = twLib.queues.map(q => q.length).reduce((next, curr) => (curr < next) ? curr : next, 0);
          twLib.queues[leastBusyQueue].enqueue(item);
        },
        orchestrator: function (type, arg) {
          let promise = $.Deferred();
          let item = new twLib.queueLib.Item(type, arg, promise);

          twLib.queueLib.addItem(item);

          return promise;
        }
      },
      ajax: function () {
        return twLib.queueLib.orchestrator('ajax', arguments);
      },
      get: function () {
        return twLib.queueLib.orchestrator('get', arguments);
      },
      post: function () {
        return twLib.queueLib.orchestrator('post', arguments);
      },
      openWindow: function () {
        let item = new twLib.queueLib.Item('openWindow', arguments);

        twLib.queueLib.addItem(item);
      }
    };

    twLib.init();
  }

  window.LZString = function () {
    var r = String.fromCharCode;

    var i = {
      compressToUTF16: function (o) {
        return null == o ? '' : i._compress(o, 15, function (o) {
          return r(o + 32);
        }) + ' ';
      }, decompressFromUTF16: function (r) {
        return null == r ? '' : '' == r ? null : i._decompress(r.length, 16384, function (o) {
          return r.charCodeAt(o) - 32;
        });
      }, compress: function (o) {
        return i._compress(o, 16, function (o) {
          return r(o);
        });
      }, _compress: function (r, o, n) {
        if (null == r) return '';
        var e, t, i, s = {}, u = {}, a = '', p = '', c = '', l = 2, f = 3, h = 2, d = [], m = 0, v = 0;
        for (i = 0; i < r.length; i += 1) if (a = r.charAt(i), Object.prototype.hasOwnProperty.call(s, a) || (s[a] = f++, u[a] = !0), p = c + a, Object.prototype.hasOwnProperty.call(s, p)) c = p; else {
          if (Object.prototype.hasOwnProperty.call(u, c)) {
            if (c.charCodeAt(0) < 256) {
              for (e = 0; e < h; e++) m <<= 1, v == o - 1 ? (v = 0, d.push(n(m)), m = 0) : v++;
              for (t = c.charCodeAt(0), e = 0; e < 8; e++) m = m << 1 | 1 & t, v == o - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t >>= 1;
            } else {
              for (t = 1, e = 0; e < h; e++) m = m << 1 | t, v == o - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t = 0;
              for (t = c.charCodeAt(0), e = 0; e < 16; e++) m = m << 1 | 1 & t, v == o - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t >>= 1;
            }
            0 == --l && (l = Math.pow(2, h), h++), delete u[c];
          } else for (t = s[c], e = 0; e < h; e++) m = m << 1 | 1 & t, v == o - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t >>= 1;
          0 == --l && (l = Math.pow(2, h), h++), s[p] = f++, c = String(a);
        }
        if ('' !== c) {
          if (Object.prototype.hasOwnProperty.call(u, c)) {
            if (c.charCodeAt(0) < 256) {
              for (e = 0; e < h; e++) m <<= 1, v == o - 1 ? (v = 0, d.push(n(m)), m = 0) : v++;
              for (t = c.charCodeAt(0), e = 0; e < 8; e++) m = m << 1 | 1 & t, v == o - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t >>= 1;
            } else {
              for (t = 1, e = 0; e < h; e++) m = m << 1 | t, v == o - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t = 0;
              for (t = c.charCodeAt(0), e = 0; e < 16; e++) m = m << 1 | 1 & t, v == o - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t >>= 1;
            }
            0 == --l && (l = Math.pow(2, h), h++), delete u[c];
          } else for (t = s[c], e = 0; e < h; e++) m = m << 1 | 1 & t, v == o - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t >>= 1;
          0 == --l && (l = Math.pow(2, h), h++);
        }
        for (t = 2, e = 0; e < h; e++) m = m << 1 | 1 & t, v == o - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t >>= 1;
        for (; ;) {
          if (m <<= 1, v == o - 1) {
            d.push(n(m));
            break;
          }
          v++;
        }
        return d.join('');
      }, _decompress: function (o, n, e) {
        var t, i, s, u, a, p, c, l = [], f = 4, h = 4, d = 3, m = '', v = [],
          g = {val: e(0), position: n, index: 1};
        for (t = 0; t < 3; t += 1) l[t] = t;
        for (s = 0, a = Math.pow(2, 2), p = 1; p != a;) u = g.val & g.position, g.position >>= 1, 0 == g.position && (g.position = n, g.val = e(g.index++)), s |= (u > 0 ? 1 : 0) * p, p <<= 1;
        switch (s) {
          case 0:
            for (s = 0, a = Math.pow(2, 8), p = 1; p != a;) u = g.val & g.position, g.position >>= 1, 0 == g.position && (g.position = n, g.val = e(g.index++)), s |= (u > 0 ? 1 : 0) * p, p <<= 1;
            c = r(s);
            break;
          case 1:
            for (s = 0, a = Math.pow(2, 16), p = 1; p != a;) u = g.val & g.position, g.position >>= 1, 0 == g.position && (g.position = n, g.val = e(g.index++)), s |= (u > 0 ? 1 : 0) * p, p <<= 1;
            c = r(s);
            break;
          case 2:
            return '';
        }
        for (l[3] = c, i = c, v.push(c); ;) {
          if (g.index > o) return '';
          for (s = 0, a = Math.pow(2, d), p = 1; p != a;) u = g.val & g.position, g.position >>= 1, 0 == g.position && (g.position = n, g.val = e(g.index++)), s |= (u > 0 ? 1 : 0) * p, p <<= 1;
          switch (c = s) {
            case 0:
              for (s = 0, a = Math.pow(2, 8), p = 1; p != a;) u = g.val & g.position, g.position >>= 1, 0 == g.position && (g.position = n, g.val = e(g.index++)), s |= (u > 0 ? 1 : 0) * p, p <<= 1;
              l[h++] = r(s), c = h - 1, f--;
              break;
            case 1:
              for (s = 0, a = Math.pow(2, 16), p = 1; p != a;) u = g.val & g.position, g.position >>= 1, 0 == g.position && (g.position = n, g.val = e(g.index++)), s |= (u > 0 ? 1 : 0) * p, p <<= 1;
              l[h++] = r(s), c = h - 1, f--;
              break;
            case 2:
              return v.join('');
          }
          if (0 == f && (f = Math.pow(2, d), d++), l[c]) m = l[c]; else {
            if (c !== h) return null;
            m = i + i.charAt(0);
          }
          v.push(m), l[h++] = i + m.charAt(0), i = m, 0 == --f && (f = Math.pow(2, d), d++);
        }
      }
    };
    return i;
  }();

  const version = 'v1.2.52 (RU - Native Support & Attack Visualization)';
  const mobileCheck = window.mobile;
  const coordinateRegex = /\d{1,3}\|\d{1,3}/g;
  const isOnCombinedOverview = game_data.screen === 'overview_villages' && $('#combined_table').length;
  let storedVillageList = {};
  let nobles = [];
  let offs = [];
  let defs = [];
  let savedCoords = JSON.parse(localStorage.getItem(`devil_saved_coords_${game_data.world}`)) || [];
  let savedTargetsInput = localStorage.getItem(`devil_targets_input_${game_data.world}`) || '';

  // Глобальные переменные состояния для перетаскивания и ресайза
  let globalDraggingState = { isDragging: false, targetWin: null, startX: 0, startY: 0, startLeft: 0, startTop: 0 };
  let globalResizingState = { isResizing: false, targetWin: null, resizeDir: '', startX: 0, startY: 0, startWidth: 0, startHeight: 0, startLeft: 0, startTop: 0 };

  if (!window._globalWindowEngineInitialized) {
    window._globalWindowEngineInitialized = true;

    document.addEventListener('mousemove', (e) => {
      if (globalDraggingState.isDragging && globalDraggingState.targetWin) {
        const dx = e.clientX - globalDraggingState.startX;
        const dy = e.clientY - globalDraggingState.startY;
        globalDraggingState.targetWin.style.left = `${globalDraggingState.startLeft + dx}px`;
        globalDraggingState.targetWin.style.top = `${globalDraggingState.startTop + dy}px`;
      }

      if (globalResizingState.isResizing && globalResizingState.targetWin) {
        const activeContainer = globalResizingState.targetWin;
        const dx = e.clientX - globalResizingState.startX;
        const dy = e.clientY - globalResizingState.startY;
        const dir = globalResizingState.resizeDir;

        if (dir.includes('right')) {
          activeContainer.style.width = `${Math.max(300, globalResizingState.startWidth + dx)}px`;
          activeContainer.style.maxWidth = 'none';
        }
        if (dir.includes('bottom')) {
          activeContainer.style.height = `${Math.max(300, globalResizingState.startHeight + dy)}px`;
          activeContainer.style.maxHeight = 'none';
        }
        if (dir.includes('left')) {
          const newWidth = globalResizingState.startWidth - dx;
          if (newWidth >= 300) {
            activeContainer.style.width = `${newWidth}px`;
            activeContainer.style.left = `${globalResizingState.startLeft + dx}px`;
            activeContainer.style.maxWidth = 'none';
          }
        }
        if (dir.includes('top')) {
          const newHeight = globalResizingState.startHeight - dy;
          if (newHeight >= 300) {
            activeContainer.style.height = `${newHeight}px`;
            activeContainer.style.top = `${globalResizingState.startTop + dy}px`;
            activeContainer.style.maxHeight = 'none';
          }
        }
      }
    });

    document.addEventListener('mouseup', () => {
      globalDraggingState.isDragging = false;
      globalDraggingState.targetWin = null;
      globalResizingState.isResizing = false;
      globalResizingState.targetWin = null;
    });
  }

  function makeWindowInteractive(windowElemId, headerElemId) {
    const $window = $(`#${windowElemId}`);
    const $header = $(`#${headerElemId}`);
    if (!$window.length || !$header.length) return;

    const winDom = $window.get(0);

    // Перетаскивание за шапку
    $header.off('mousedown').on('mousedown', (e) => {
      if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.tagName === 'LABEL' || e.target.tagName === 'SELECT') return;
      globalDraggingState.isDragging = true;
      globalDraggingState.targetWin = winDom;
      globalDraggingState.startX = e.clientX;
      globalDraggingState.startY = e.clientY;
      const rect = winDom.getBoundingClientRect();
      globalDraggingState.startLeft = rect.left;
      globalDraggingState.startTop = rect.top;
      e.preventDefault();
    });

    // Ресайз по рамкам
    $window.find('.resize-handle').off('mousedown').on('mousedown', (e) => {
      globalResizingState.isResizing = true;
      globalResizingState.targetWin = winDom;
      globalResizingState.resizeDir = e.target.className.replace('resize-handle ', '');
      globalResizingState.startX = e.clientX;
      globalResizingState.startY = e.clientY;
      const rect = winDom.getBoundingClientRect();
      globalResizingState.startWidth = rect.width;
      globalResizingState.startHeight = rect.height;
      globalResizingState.startLeft = rect.left;
      globalResizingState.startTop = rect.top;
      e.stopPropagation();
      e.preventDefault();
    });
  }

  function parseCoordsFromText(text) {
    if (!text) return [];
    let results = [];
    let cleanText = text.replace(/\[\/?coord\]/g, '').replace(/\[\/?b\]/g, '').replace(/\[\/?table\]/g, '');
    let regex = /(\d{1,3}\|\d{1,3})/g;
    let match, lastIndex = 0;

    while ((match = regex.exec(cleanText)) !== null) {
      let coord = match[1];
      let parts = coord.split('|');
      let x = parseInt(parts[0], 10);
      let y = parseInt(parts[1], 10);

      if (x >= 0 && x <= 1000 && y >= 0 && y <= 1000) {
        let chunkBefore = cleanText.substring(lastIndex, match.index);
        let namePart = chunkBefore.replace(/[\(\)]/g, ' ').trim();
        let words = namePart.split(/\s+/);
        let villageName = words.slice(-3).join(' ').replace(/^(K\d+\s*)+/, '').trim();

        if (!results.some(r => r.coord === coord)) {
          results.push({ 
            coord: coord, 
            name: villageName || '', 
            x: x, 
            y: y 
          });
        }
      }
      lastIndex = regex.lastIndex;
    }
    return results;
  }

  const loadAlreadyRunningCommands = (targetId) => twLib.get({url: `${game_data.link_base_pure}info_village&id=${targetId}`});
  const convertToDate = (twDate) => {
    const t = twDate.match(/\d+:\d+:\d+.\d+/) ?? twDate.match(/\d+:\d+:\d+/);
    const serverDate = $('#serverDate').text().replace(/\//g, '-').replace(/(\d{1,2})-(\d{1,2})-(\d{4})/g, '$3-$2-$1');
    let date = new Date(serverDate + ' ' + t);

    if (twDate.match(window.lang['57d28d1b211fddbb7a499ead5bf23079'].split(' ')[0])) {
      date.setDate(date.getDate() + 1);
      return date;
    } else if (twDate.match(/\d+\.\d+/)) {
      let monthDate = twDate.match(/\d+\.\d+/)[0].split('.');
      return new Date(date.getFullYear() + '-' + monthDate[1] + '-' + monthDate[0] + ' ' + t);
    } else {
      return date;
    }
  };

  const loadVillageData = () => {
    const settings = JSON.parse(localStorage.getItem(`village_list_settings_${game_data.world}`)) ?? {lastCheckedAt: null, villages: {}};
    if (!settings.lastCheckedAt || Math.abs(new Date().getTime() - new Date(settings.lastCheckedAt).getTime()) / 36e5 > 1) {
      twLib.get({
        url: location.origin + '/map/village.txt',
        success: function (villages) {
          storedVillageList = villages.match(/[^\r\n]+/g).map(villageData => {
            const [id, name, x, y, player_id] = villageData.split(',');
            const coordinates = `${x}|${y}`;
            return {id: id, name: name, player_id: player_id, coordinates: coordinates};
          });
          const settingsToSave = {
            lastCheckedAt: new Date(),
            villages: LZString.compressToUTF16(JSON.stringify(storedVillageList))
          }
          localStorage.setItem(`village_list_settings_${game_data.world}`, JSON.stringify(settingsToSave));
          $("#commandCenter_villages").text(Object.keys(storedVillageList).length);
        }
      });
    } else {
      storedVillageList = JSON.parse(LZString.decompressFromUTF16(settings.villages));
    }
  }

  window.validateCoordinatesInput = () => {
    const textVal = $('#targetsToLookup').val();
    savedTargetsInput = textVal;
    localStorage.setItem(`devil_targets_input_${game_data.world}`, textVal);
    const matches = textVal ? textVal.match(coordinateRegex) : null;
    $('#fetchCommands').prop('disabled', matches === null || matches.length === 0);
  };

  window.clearTargetsInput = () => {
    $('#targetsToLookup').val('');
    savedTargetsInput = '';
    localStorage.removeItem(`devil_targets_input_${game_data.world}`);
    $('#fetchCommands').prop('disabled', true);
  };

  const getTroopsFor = (html, unitType) => {
    let troopInfo;
    if (mobileCheck) {
      troopInfo = $(".unit-row-item img[src*='" + unitType + "']").get().map(el => {
        const villageCoord = $(el).closest(".overview-container-item").find(".quickedit-vn").text().trim().match(coordinateRegex).pop();
        const amount = $(el).closest(".unit-row-item").text();
        return `${villageCoord},${amount}`
      });
    } else {
      const dorpIndex = $(html).find(`#combined_table th:contains("${window.lang['abc63490c815af81276f930216c8d92b']}")`).index();
      const unitIndex = $(html).find('#combined_table').find(`img[src*="${unitType}"]`).closest('th').index();

      troopInfo = $(html).find('#combined_table tr.nowrap').map((_, r) => {
        return `${$(r).find(`td:eq(${dorpIndex})`).text().match(coordinateRegex).pop()},${$(r).find(`td:eq(${unitIndex})`).text()}`;
      }).get();
    }
    return troopInfo.filter(r => parseInt(r.split(',')[1], 10) > 0);
  }

  loadVillageData();
  initializeScript();

  async function initializeScript() {
    if (isOnCombinedOverview) {
      nobles = getTroopsFor(document, 'snob');
      offs = getTroopsFor(document, 'axe');
      defs = getTroopsFor(document, 'spear');
    } else {
      const combinedHtml = await loadOverview('combined');
      nobles = getTroopsFor(combinedHtml, 'snob');
      offs = getTroopsFor(combinedHtml, 'axe');
      defs = getTroopsFor(combinedHtml, 'spear');
    }
    
    const isPlannerActive = localStorage.getItem(`devil_planner_active_${game_data.world}`) === 'true';
    if (isPlannerActive && savedTargetsInput) {
      fetchCommands(true);
    } else {
      renderMainDialog();
    }
  }

  window.refreshTroopsData = async () => {
    const combinedHtml = await loadOverview('combined');
    nobles = getTroopsFor(combinedHtml, 'snob');
    offs = getTroopsFor(combinedHtml, 'axe');
    defs = getTroopsFor(combinedHtml, 'spear');
    
    if ($('#draggablePlannerWindow').length || $('#draggableMainWindow').length) {
      if ($('#draggablePlannerWindow').length) {
        fetchCommands(true);
      } else {
        renderMainDialog();
      }
    } else {
      renderMainDialog();
    }
  };

  window.saveCoordItem = (coord) => {
    if (!savedCoords.includes(coord)) {
      savedCoords.push(coord);
      localStorage.setItem(`devil_saved_coords_${game_data.world}`, JSON.stringify(savedCoords));
      renderMainDialog();
    }
  };

  window.copySavedCoords = () => {
    if (savedCoords.length === 0) return;
    navigator.clipboard.writeText(savedCoords.join(' '));
  };

  window.clearSavedCoords = () => {
    savedCoords = [];
    localStorage.removeItem(`devil_saved_coords_${game_data.world}`);
    renderMainDialog();
  };

  window.toggleMobileViewMode = () => {
    const isMobile = $('#mobileViewMode').is(':checked');
    localStorage.setItem(`devil_mobile_view_${game_data.world}`, isMobile);
    applyWindowSizeByMobileSetting(isMobile);
  };

  function applyWindowSizeByMobileSetting(isMobile) {
    const $window = $('#draggableMainWindow');
    if (!$window.length) return;
    
    const targetWidth = isMobile ? '380px' : '740px';
    const targetHeight = isMobile ? '600px' : '620px';
    
    $window.css({
      'width': targetWidth,
      'height': targetHeight,
      'max-width': 'none',
      'max-height': 'none'
    });
    $window.get(0).style.cssText += `; width: ${targetWidth} !important; height: ${targetHeight} !important;`;
  }

  function renderMainDialog() {
    localStorage.setItem(`devil_planner_active_${game_data.world}`, 'false');
    const isMobileView = localStorage.getItem(`devil_mobile_view_${game_data.world}`) === 'true';

    let noblesFormattedList = '';
    if (nobles.length > 0) {
      noblesFormattedList = nobles.map(line => {
        const [coord, count] = line.split(',');
        const foundVillage = storedVillageList.find(v => v.coordinates === coord);
        const villageId = foundVillage ? foundVillage.id : '';
        
        let sitterParam = typeof window.sitter_id !== 'undefined' && window.sitter_id ? `t=${window.sitter_id}&` : '';
        let targetOverviewUrl = villageId ? `${game_data.link_base_pure.split('game.php')[0]}game.php?${sitterParam}village=${villageId}&screen=overview` : '#';

        return `<div style="display: flex; justify-content: space-between; align-items: center; background: #fffde8; border: 1px solid #d8c29d; padding: 3px 6px; margin-bottom: 2px; border-radius: 3px;">
          <span>Координаты: <b>${coord}</b> (Дворов: <b>${count}</b>)</span>
          <div style="display: flex; gap: 4px;">
            ${villageId ? `<a href="${targetOverviewUrl}" target="_blank" class="btn" style="padding: 1px 6px; font-size: 10px; text-decoration: none;">🏰 Обзор</a>` : ''}
            <button class="btn" onclick="saveCoordItem('${coord}')" style="padding: 1px 6px; font-size: 10px; cursor: pointer;">💾 Сохранить</button>
          </div>
        </div>`;
      }).join('');
    }

    let savedListHtml = savedCoords.length > 0 ? savedCoords.join(' ') : 'Пока нет сохраненных координат...';
    
    $('#draggableMainWindow').remove();

    const dialogHtml = `
    <div id="draggableMainWindow" style="position: fixed; top: 80px; left: 150px; z-index: 99999; width: 740px; height: 620px; background: #f4e4bc; border: 2px solid #7d510f; border-radius: 6px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); display: flex; flex-direction: column;">
        <div class="resize-handle resize-top" style="position: absolute; top: -8px; left: 0; right: 0; height: 16px; cursor: n-resize; z-index: 999999;"></div>
        <div class="resize-handle resize-bottom" style="position: absolute; bottom: -8px; left: 0; right: 0; height: 16px; cursor: s-resize; z-index: 999999;"></div>
        <div class="resize-handle resize-left" style="position: absolute; top: 0; bottom: 0; left: -8px; width: 16px; cursor: w-resize; z-index: 999999;"></div>
        <div class="resize-handle resize-right" style="position: absolute; top: 0; bottom: 0; right: -8px; width: 16px; cursor: e-resize; z-index: 999999;"></div>
        <div class="resize-handle resize-top-left" style="position: absolute; top: -8px; left: -8px; width: 22px; height: 22px; cursor: nw-resize; z-index: 1000000;"></div>
        <div class="resize-handle resize-top-right" style="position: absolute; top: -8px; right: -8px; width: 22px; height: 22px; cursor: ne-resize; z-index: 1000000;"></div>
        <div class="resize-handle resize-bottom-left" style="position: absolute; bottom: -8px; left: -8px; width: 22px; height: 22px; cursor: sw-resize; z-index: 1000000;"></div>
        <div class="resize-handle resize-bottom-right" style="position: absolute; bottom: -8px; right: -8px; width: 22px; height: 22px; cursor: se-resize; z-index: 1000000;"></div>

        <div id="mainPlannerHeader" style="background: linear-gradient(to bottom, #f4e4bc 0%, #e3c696 100%); border-bottom: 1px solid #7d510f; padding: 10px; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; cursor: move; user-select: none;">
            <h2 style="margin: 0; color: #5b3511; font-size: 15px;">🏰 Менеджер приказов <small style="font-size: 11px; color: darkblue">(${version})</small></h2>
            <button class="btn btn-default" onclick="$('#draggableMainWindow').remove();" title="Закрыть" style="padding: 2px 6px; font-size: 11px; font-weight: bold; cursor: pointer; background: #d9534f; color: #fff; border: 1px solid #b52b27;">✕</button>
        </div>

        <div style="padding: 12px 14px; flex-grow: 1; overflow-y: auto; box-sizing: border-box; display: flex; flex-direction: column; gap: 8px;">
            <div style="background: #f7f2e8; border: 1px solid #d8c29d; padding: 8px 12px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
                <span>Сохранено деревень в кэше: <b id="commandCenter_villages" style="color: #8c6723;">${Object.keys(storedVillageList).length}</b></span>
                <a onclick="resetLocalStorage()" style="cursor: pointer; color: #b92d2d; font-size: 11px; text-decoration: underline;">Сбросить хранилище</a>
            </div>

            <div style="flex-shrink: 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <b style="color: #5b3511;">📦 Найдено дворов: ${nobles.reduce((a, line) => a + parseInt(line.split(',')[1], 10), 0)} | Офф: ${offs.reduce((a, line) => a + parseInt(line.split(',')[1], 10), 0)} | Дефф: ${defs.reduce((a, line) => a + parseInt(line.split(',')[1], 10), 0)}</b>
                    <button class="btn btn-default" onclick="refreshTroopsData()" style="padding: 2px 8px; font-size: 11px; cursor: pointer; font-weight: bold;">🔄 Обновить</button>
                </div>
                <div style="max-height: 100px; overflow-y: auto; border: 1px solid #7d510f; padding: 4px; background: #fff;">
                    ${nobles.length > 0 ? noblesFormattedList : '<div style="text-align: center; color: #777; padding: 5px;">Данные не найдены. Нажмите «Обновить».</div>'}
                </div>
            </div>

            <div style="background: #fdfaf3; border: 1px solid #d8c29d; padding: 8px; border-radius: 4px; flex-shrink: 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <b style="color: #5b3511; font-size: 11px;">📌 Сохраненные координаты (${savedCoords.length}):</b>
                    <div style="display: flex; gap: 5px;">
                        <button class="btn" onclick="copySavedCoords()" style="padding: 1px 6px; font-size: 10px; cursor: pointer; font-weight: bold;">📋 Копировать всё</button>
                        <button class="btn" onclick="clearSavedCoords()" style="padding: 1px 6px; font-size: 10px; cursor: pointer; color: #b92d2d;">Очистить</button>
                    </div>
                </div>
                <textarea readonly style="width: 100%; box-sizing: border-box; padding: 4px; font-size: 11px; background: #fff; border: 1px solid #c1a264;" rows="2">${savedListHtml}</textarea>
            </div>

            <div style="background: #fff8e8; border: 1px solid #c1a264; padding: 10px; border-radius: 4px; flex-grow: 1; display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; flex-shrink: 0;">
                    <label style="font-weight: bold; color: #5b3511;">🎯 Вставьте текст с целевыми координатами:</label>
                    <button class="btn" onclick="clearTargetsInput()" style="padding: 1px 6px; font-size: 10px; cursor: pointer; color: #b92d2d;">🗑️ Очистить</button>
                </div>
                <textarea oninput="validateCoordinatesInput()" id="targetsToLookup" placeholder="Сюда можно вставлять любой текст, содержащий координаты..." style="width: 100%; box-sizing: border-box; padding: 6px; border: 1px solid #7d510f; border-radius: 3px; font-size: 11px; flex-grow: 1; min-height: 60px;" rows="3">${savedTargetsInput}</textarea>
                
                <div style="margin-top: 8px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; flex-wrap: wrap; gap: 6px;">
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <label style="cursor: pointer; user-select: none; font-weight: bold; color: #5b3511; font-size: 11px;">
                            <input type="checkbox" style="vertical-align: -2px; margin-right: 3px;" id="doSupportLoading"> Подкреп
                        </label>
                        <label style="cursor: pointer; user-select: none; font-weight: bold; color: #5b3511; font-size: 11px;">
                            <input type="checkbox" style="vertical-align: -2px; margin-right: 3px;" id="doReturnsLoading"> Возвраты
                        </label>
                        <label style="cursor: pointer; user-select: none; font-weight: bold; color: #b92d2d; font-size: 11px;">
                            <input type="checkbox" style="vertical-align: -2px; margin-right: 3px;" id="mobileViewMode" ${isMobileView ? 'checked' : ''} onchange="toggleMobileViewMode()"> 📱 Мобильный вид
                        </label>
                    </div>
                    <input id="fetchCommands" type="button" class="btn btn-default" value="📥 Загрузить команды" disabled onclick="fetchCommands()" style="background: #7d510f; color: #fff; border: 1px solid #4a320c; font-weight: bold; padding: 5px 12px; cursor: pointer; border-radius: 3px;">
                </div>
            </div>
        </div>
    </div>`;

    $('#contentContainer').before(dialogHtml);
    applyWindowSizeByMobileSetting(isMobileView);
    makeWindowInteractive('draggableMainWindow', 'mainPlannerHeader');
    window.validateCoordinatesInput();
  }

  async function loadOverview(mode) {
    let villages = [];
    const getOverviewInfo = (mode, page) => new Promise((resolve) => {
      resolve(twLib.get(`${game_data.link_base_pure}overview_villages&mode=${mode}&group=0&page=${page}&`));
    });

    await getOverviewInfo(mode, -1).then(async (html) => {
      $.merge(villages, $(html));
      const $navOptions = $('.paged-nav-item', html).parent().find('option');
      const pages = $navOptions.length ? $navOptions.length - 1 : $('.paged-nav-item', html).length;
      const villagesPerPage = $('#mobileHeader').length ? 10 : Number($('[name=page_size]', html).val());
      const startingPage = Math.floor(1000 / villagesPerPage);

      for (let x = startingPage; x < pages; x++) {
        await getOverviewInfo(mode, x).then((html) => {
          $.merge(villages, $(html));
        });
      }
    });
    return villages;
  }

  window.resetLocalStorage = () => {
    localStorage.removeItem(`devil_spam_planner_settings_${game_data.world}`);
    loadVillageData();
  }

  window.returnToMainDialog = () => {
    localStorage.setItem(`devil_planner_active_${game_data.world}`, 'false');
    $('#draggablePlannerWindow').remove();
    renderMainDialog();
  };

  window.fetchCommands = (isRestoring = false) => {
    const loadSupport = $("#doSupportLoading").is(":checked");
    const loadReturns = $("#doReturnsLoading").is(":checked");
    const rawTargetsText = $('#targetsToLookup').val() || savedTargetsInput;
    const isMobileView = localStorage.getItem(`devil_mobile_view_${game_data.world}`) === 'true';
    
    const parsedTargets = parseCoordsFromText(rawTargetsText);
    const targetsToLookup = parsedTargets.map(t => t.coord);
    
    localStorage.setItem(`devil_planner_active_${game_data.world}`, 'true');
    $('#draggableMainWindow').remove();
    $('#draggablePlannerWindow').remove();
    
    const plannerWidth = isMobileView ? '380px' : '1024px';
    const plannerHeight = isMobileView ? '600px' : '720px';

    $('#contentContainer').before(`
    <div id="draggablePlannerWindow" style="position: fixed; top: 80px; left: 150px; z-index: 99999; width: ${plannerWidth}; height: ${plannerHeight}; background: #f4e4bc; border: 2px solid #7d510f; border-radius: 6px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); display: flex; flex-direction: column;">
        <div class="resize-handle resize-top" style="position: absolute; top: -8px; left: 0; right: 0; height: 16px; cursor: n-resize; z-index: 999999;"></div>
        <div class="resize-handle resize-bottom" style="position: absolute; bottom: -8px; left: 0; right: 0; height: 16px; cursor: s-resize; z-index: 999999;"></div>
        <div class="resize-handle resize-left" style="position: absolute; top: 0; bottom: 0; left: -8px; width: 16px; cursor: w-resize; z-index: 999999;"></div>
        <div class="resize-handle resize-right" style="position: absolute; top: 0; bottom: 0; right: -8px; width: 16px; cursor: e-resize; z-index: 999999;"></div>
        <div class="resize-handle resize-top-left" style="position: absolute; top: -8px; left: -8px; width: 22px; height: 22px; cursor: nw-resize; z-index: 1000000;"></div>
        <div class="resize-handle resize-top-right" style="position: absolute; top: -8px; right: -8px; width: 22px; height: 22px; cursor: ne-resize; z-index: 1000000;"></div>
        <div class="resize-handle resize-bottom-left" style="position: absolute; bottom: -8px; left: -8px; width: 22px; height: 22px; cursor: sw-resize; z-index: 1000000;"></div>
        <div class="resize-handle resize-bottom-right" style="position: absolute; bottom: -8px; right: -8px; width: 22px; height: 22px; cursor: se-resize; z-index: 1000000;"></div>

        <div id="plannerWindowHeader" style="display: flex; justify-content: space-between; align-items: center; background: linear-gradient(to bottom, #f4e4bc 0%, #e3c696 100%); border-bottom: 1px solid #7d510f; padding: 8px 10px; cursor: move; user-select: none; flex-shrink: 0;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <button class="btn btn-default" onclick="returnToMainDialog()" style="padding: 2px 8px; font-weight: bold; cursor: pointer; background: #e3c696; border: 1px solid #7d510f; font-size: 11px;">⬅️ Назад</button>
                <h2 style="margin: 0; color: #5b3511; font-size: 15px;">⚔️ Планировщик атак <small style="font-size: 11px; color: darkblue">(${version})</small></h2>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
                <label style="cursor: pointer; user-select: none; font-size: 11px; font-weight: bold; color: #5b3511; background: #fff8e8; padding: 2px 5px; border: 1px solid #c1a264; border-radius: 3px;">
                    <input type="checkbox" id="doSupportLoading" ${loadSupport ? 'checked' : ''} style="vertical-align: -2px; margin-right: 2px;" onchange="fetchCommands(true)"> Подкреп
                </label>
                <label style="cursor: pointer; user-select: none; font-size: 11px; font-weight: bold; color: #5b3511; background: #fff8e8; padding: 2px 5px; border: 1px solid #c1a264; border-radius: 3px;">
                    <input type="checkbox" id="doReturnsLoading" ${loadReturns ? 'checked' : ''} style="vertical-align: -2px; margin-right: 2px;" onchange="fetchCommands(true)"> Возвраты
                </label>
                <button class="btn btn-default" onclick="refreshTroopsData()" style="padding: 2px 8px; font-size: 11px; font-weight: bold; cursor: pointer;">🔄 Обновить</button>
                <button class="btn btn-default" onclick="returnToMainDialog()" title="Закрыть" style="padding: 2px 6px; font-size: 11px; font-weight: bold; cursor: pointer; background: #d9534f; color: #fff; border: 1px solid #b52b27;">✕</button>
            </div>
        </div>

        <div id="plannerWindowContent" style="padding: 12px 14px; flex-grow: 1; overflow-y: auto; box-sizing: border-box; display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; gap: 10px; flex-shrink: 0;">
                <div style="flex: 1;"><small>Дворы (${nobles.length}):</small><textarea id="nobles" style="width: 100%; box-sizing: border-box; font-size: 10px;" rows="1">${nobles.join('\n')}</textarea></div>
                <div style="flex: 1;"><small>Офф (${offs.length}):</small><textarea id="offs" style="width: 100%; box-sizing: border-box; font-size: 10px;" rows="1">${offs.join('\n')}</textarea></div>
                <div style="flex: 1;"><small>Дефф (${defs.length}):</small><textarea id="defs" style="width: 100%; box-sizing: border-box; font-size: 10px;" rows="1">${defs.join('\n')}</textarea></div>
            </div>

            <table class="vis" id="commandCenter_overview" style="width: 100%; border-collapse: separate; border-spacing: 1px; background: #fffbe8; border: 1px solid #c1a264; flex-shrink: 0;">
                <tbody>
                    <tr>
                        <th style="text-align: center; background: #e3c696; color: #5b3511; width: 110px;">Цель</th>
                        <th style="text-align: center; background: #e3c696; color: #5b3511;">Свои приказы</th>
                    </tr>
                    <tr>
                        <th style="text-align: center; background: #f4e4bc;" colspan="2">
                            <div style="display: flex; flex-direction: column; gap: 6px; font-size: 11px; padding: 4px;">
                                <div style="display: flex; gap: 10px; align-items: center; justify-content: flex-end; border-bottom: 1px solid #d8c29d; padding-bottom: 4px; flex-wrap: wrap;">
                                    <span>Фильтр типа атаки:</span>
                                    <select id="attackType" style="padding: 2px;">
                                        <option value="all">🟢🟠🔴 Все</option>
                                        <option value="small">🟢 Зелёные (маленькие)</option>
                                        <option value="medium">🟠 Оранжевые (средние)</option>
                                        <option value="large">🔴 Красные (большие)</option>
                                    </select>
                                    <span>Дата:</span>
                                    <input id="commandDate" type="date" style="padding: 2px;">
                                </div>
                            </div>
                        </th>
                    </tr>
                </tbody>
            </table>

            <div id="generatedCommandsSection" style="background: #fff8e8; border: 1px solid #c1a264; padding: 10px; border-radius: 4px; margin-top: auto; flex-shrink: 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <b style="color: #5b3511; font-size: 12px;">📋 Генератор атак и команд:</b>
                    <div style="display: flex; gap: 6px;">
                        <button class="btn btn-default" id="generateCommandsBtn" style="padding: 3px 10px; font-weight: bold; cursor: pointer; background: #7d510f; color: #fff; border: 1px solid #4a320c;">⚙️ Сгенерировать</button>
                        <button class="btn btn-default" id="copyGeneratedBtn" style="padding: 3px 10px; font-weight: bold; cursor: pointer;">📋 Копировать BB-код</button>
                    </div>
                </div>
                <textarea id="generatedOutput" placeholder="Здесь появится сгенерированный список команд..." style="width: 100%; box-sizing: border-box; font-size: 11px; padding: 6px; border: 1px solid #7d510f; background: #fff;" rows="3"></textarea>
            </div>
        </div>
    </div>
    `);

    makeWindowInteractive('draggablePlannerWindow', 'plannerWindowHeader');

    $('#generateCommandsBtn').off('click').on('click', () => {
      let outputLines = [];
      $('#commandCenter_overview tr.target-row-wrapper:visible').each((_, targetRow) => {
        const $tr = $(targetRow);
        const targetCoord = $tr.find('td:first a').text().trim();
        
        $tr.find('tr.command-row:visible').each((_, cmdRow) => {
          const $cmd = $(cmdRow);
          const nobleVal = parseInt($cmd.find('.nobleAmount').val(), 10) || 0;
          const offVal = parseInt($cmd.find('.offAmount').val(), 10) || 0;
          const defVal = parseInt($cmd.find('.defAmount').val(), 10) || 0;

          if (nobleVal > 0 || offVal > 0 || defVal > 0) {
            outputLines.push(`[coord]${targetCoord}[/coord] | Дворы: ${nobleVal}, Офф: ${offVal}, Дефф: ${defVal}`);
          }
        });
      });

      if (outputLines.length > 0) {
        $('#generatedOutput').val(outputLines.join('\n'));
        UI.SuccessMessage('Команды успешно сгенерированы!');
      } else {
        $('#generatedOutput').val('Не выбрано ни одной команды (укажите количество дворов/оффа/деффа в строках выше).');
      }
    });

    $('#copyGeneratedBtn').off('click').on('click', () => {
      const textToCopy = $('#generatedOutput').val();
      if (textToCopy) {
        navigator.clipboard.writeText(textToCopy);
        UI.SuccessMessage('Скопировано в буфер обмена!');
      }
    });
    
    targetsToLookup.forEach((targetCoord) => {
      const foundTarget = storedVillageList.find((village) => village.coordinates === targetCoord);
      if (!foundTarget) return;
      const targetId = foundTarget.id;
      
      const blockTargetCoord = targetCoord;
      const blockTargetObj = storedVillageList.find(v => v.coordinates === blockTargetCoord);
      const blockTargetX = blockTargetObj ? parseInt(blockTargetObj.coordinates.split('|')[0], 10) : 0;
      const blockTargetY = blockTargetObj ? parseInt(blockTargetObj.coordinates.split('|')[1], 10) : 0;

      $.when(loadAlreadyRunningCommands(targetId).done(function (html) {
        const commandsTable = $(html).find('.commands-container');
        commandsTable.find('tr th:first').attr('width', '40%').next().attr('width', '20%');
        commandsTable.find('tr:first th:last').after('<th>Дв.</th><th>Офф</th><th>Дефф</th>');
        
        commandsTable.find('tr.command-row').each((_, row) => {
          const $row = $(row);
          
          $row.attr('data-target-coord', blockTargetCoord);
          $row.attr('data-target-x', blockTargetX);
          $row.attr('data-target-y', blockTargetY);

          const isSupport = $row.find('img[src*="support"]').length > 0 || $row.text().includes('Подкрепление');
          const isReturn = $row.find('img[src*="return_"], img[src*="back"], img[src*="farm"]').length > 0 || $row.text().includes('возвращается') || $row.text().includes('return');
          
          let $imgTd = $row.find('td:first');
          let $icon = $imgTd.find('img').first();

          if (isSupport) {
            if ($icon.length) {
              $icon.attr('src', $icon.attr('src').replace(/attack[^\/]*\.png/i, 'support.png'));
            } else {
              $imgTd.prepend('<img src="/graphic/command/support.png" title="Подкрепление" alt="" style="vertical-align: -2px; margin-right: 3px;" />');
            }
          }
          
          let totalUnitsInRow = 0;

          $row.find('td:first img[title], td:first [title]').each((_, el) => {
            let titleText = $(el).attr('title');
            if (titleText) {
              let matchNum = titleText.match(/~(\d+)|\b(\d+)\b/);
              if (matchNum) {
                let val = parseInt(matchNum[1] || matchNum[2], 10);
                if (!isNaN(val) && val > 0) totalUnitsInRow = val;
              }
            }
          });

          if (totalUnitsInRow === 0) {
            $row.find('[title]').each((_, el) => {
              let titleText = $(el).attr('title');
              if (titleText) {
                let matchNum = titleText.match(/~(\d+)|\D*(\d+)\s*(?:юнит|unit|войск)/i);
                if (matchNum) {
                  let val = parseInt(matchNum[1] || matchNum[2], 10);
                  if (!isNaN(val)) totalUnitsInRow = val;
                }
              }
            });
          }

          let attackSizeClass = 'small'; 

          if (totalUnitsInRow >= 5000 || $row.text().includes('5000') || $row.find('[title*="5000"], [title*="5 000"]').length > 0) {
            attackSizeClass = 'large';
          } else if (totalUnitsInRow >= 1000 || $row.text().includes('1000') || $row.find('[title*="1000"], [title*="1 000"]').length > 0) {
            attackSizeClass = 'medium';
          } else {
            attackSizeClass = 'small';
          }

          $row.addClass(`attack-type-${attackSizeClass}`);

          let $targetIcon = $row.find('td:first img').first();
          if ($targetIcon.length && !$targetIcon.parent().find('.snowflake-indicator').length) {
            $targetIcon.after('<span class="snowflake-indicator" title="Войска видны (открыты приказы)" style="font-size: 10px; margin-left: 2px; vertical-align: baseline;">❄️</span>');
          }

          const dateText = $row.find('td:eq(1)').text().trim();
          if (dateText) {
            try {
              const parsedDate = convertToDate(dateText);
              if (!isNaN(parsedDate)) {
                const dateString = parsedDate.toISOString().split('T')[0];
                $row.attr('data-command-date', dateString);
              }
            } catch (err) {}
          }

          $row.append(`
            <td style="position: relative; padding-bottom: 6px;">
              <div style="margin-bottom: 2px;"><input class="nobleAmount" style="width: 35px; text-align: center;" type="number" value="0" min="0"></div>
              <div class="inline-villages-container" style="display: none; margin-top: 6px; background: #fffde8; border: 1px solid #7d510f; padding: 4px; border-radius: 3px; max-height: 150px; overflow-y: auto;"></div>
            </td>
            <td style="position: relative; padding-bottom: 6px;">
              <div style="margin-bottom: 2px;"><input class="offAmount" style="width: 45px; text-align: center;" type="number" value="0" min="0"></div>
              <div class="inline-villages-container" style="display: none; margin-top: 6px; background: #fffde8; border: 1px solid #7d510f; padding: 4px; border-radius: 3px; max-height: 150px; overflow-y: auto;"></div>
            </td>
            <td style="position: relative; padding-bottom: 6px;">
              <div style="margin-bottom: 2px;"><input class="defAmount" style="width: 45px; text-align: center;" type="number" value="0" min="0"></div>
              <div class="inline-villages-container" style="display: none; margin-top: 6px; background: #fffde8; border: 1px solid #7d510f; padding: 4px; border-radius: 3px; max-height: 150px; overflow-y: auto;"></div>
            </td>
          `);
        }).filter((_, el) => {
          const hasSupport = $(el).find('img[src*="support"]').length > 0 || $(el).text().includes('Подкрепление');
          const isReturn = $(el).find('img[src*="return_"], img[src*="back"], img[src*="farm"]').length > 0 || $(el).text().includes('возвращается') || $(el).text().includes('return');
          
          if (isReturn && !loadReturns) return true;
          if (hasSupport && !loadSupport) return true; 
          return false;
        }).remove();

        const hasCommands = commandsTable.find('tr.command-row').length > 0;
        
        const htmlToInsert = !hasCommands 
          ? '<div class="no-commands-msg" style="text-align: center; color: #777; padding: 5px;">Команды не найдены.</div>' 
          : `<div style="max-height: 250px; overflow-y: auto; overflow-x: hidden; border: 1px solid #d8c29d;"><table class="vis" style="width:100%; margin:0;">${commandsTable.html()}</table></div>`;
        
        const targetOverviewUrl = `${location.origin}${location.pathname}?screen=info_village&id=${targetId}`;
        
        $('#commandCenter_overview tbody:first').append(`<tr class="target-row-wrapper" data-has-commands="${hasCommands}"><td><a style="margin-left: 5px; font-weight: bold; color: #5b3511;" target="_blank" href="${targetOverviewUrl}">${targetCoord}</a></td><td>${htmlToInsert}</td></tr>`);
        Timing.tickHandlers.timers.init();
        
        function applyCommandFilters() {
          const selectedAttackType = $('#attackType').val();
          const selectedDate = $('#commandDate').val();

          $('#commandCenter_overview tr.target-row-wrapper').each((_, targetRow) => {
            const $targetRow = $(targetRow);
            let visibleCommandsCount = 0;

            $targetRow.find('tr.command-row').each((_, r) => {
              const $r = $(r);
              let showByAttack = true;
              let showByDate = true;

              if (selectedAttackType !== 'all') {
                if (!$r.hasClass(`attack-type-${selectedAttackType}`)) {
                  showByAttack = false;
                }
              }

              if (selectedDate) {
                const rowDate = $r.attr('data-command-date');
                if (rowDate && rowDate !== selectedDate) {
                  showByDate = false;
                }
              }

              if (showByAttack && showByDate) {
                $r.show();
                visibleCommandsCount++;
              } else {
                $r.hide();
              }
            });

            const $noMsg = $targetRow.find('.no-commands-msg');
            const hasInitialCommands = $targetRow.attr('data-has-commands') === 'true';

            if (!hasInitialCommands) {
              if (selectedAttackType !== 'all' || selectedDate) {
                $targetRow.hide();
              } else {
                $targetRow.show();
              }
            } else {
              if (visibleCommandsCount > 0) {
                $targetRow.show();
                if ($noMsg.length) $noMsg.hide();
              } else {
                if (selectedAttackType !== 'all' || selectedDate) {
                  $targetRow.hide();
                } else {
                  $targetRow.show();
                  if ($noMsg.length) $noMsg.show();
                }
              }
            }
          });
        }

        $('#attackType, #commandDate').off('change').on('change', applyCommandFilters);

        const calcDistance = (c1, c2) => {
          const [x1, y1] = c1.split('|').map(Number);
          const [x2, y2] = c2.split('|').map(Number);
          return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
        };

        const getClosestVillages = (referenceCoord, type, minAmount) => {
          let sourceList = [];
          if (type === 'noble') {
            sourceList = nobles.map(item => {
              const [coord, count] = item.split(',');
              return { coord, count: parseInt(count, 10) };
            }).filter(i => i.count >= minAmount);
          } else if (type === 'off') {
            sourceList = offs.map(item => {
              const [coord, count] = item.split(',');
              return { coord, count: parseInt(count, 10) };
            }).filter(i => i.count >= minAmount);
          } else if (type === 'def') {
            sourceList = defs.map(item => {
              const [coord, count] = item.split(',');
              return { coord, count: parseInt(count, 10) };
            }).filter(i => i.count >= minAmount);
          }

          sourceList.forEach(v => { v.dist = calcDistance(v.coord, referenceCoord); });
          sourceList.sort((a, b) => a.dist - b.dist);
          return sourceList; 
        };

        const setupInlineList = (inputSelector, type, minAmount) => {
          $(document).on('input change focus', inputSelector, function() {
            const $input = $(this);
            const val = parseInt($input.val(), 10) || 0;
            const $td = $input.closest('td');
            const $container = $td.find('.inline-villages-container');
            const $row = $input.closest('tr.command-row');
            
            const rowTargetCoord = $row.attr('data-target-coord') || blockTargetCoord;
            
            if (val > 0) {
              const matchingVillages = getClosestVillages(rowTargetCoord, type, minAmount);
              const limitedVillages = matchingVillages.slice(0, val);
              const countOptions = limitedVillages.length;

              if (countOptions > 0) {
                let htmlList = limitedVillages.map(v => {
                  const foundV = storedVillageList.find(sv => sv.coordinates === v.coord);
                  const vName = foundV ? foundV.name : v.coord;
                  const vId = foundV ? foundV.id : '';
                  
                  let rallyPointLink = '#';
                  if (vId) {
                    let sitterParam = typeof window.sitter_id !== 'undefined' && window.sitter_id ? `t=${window.sitter_id}&` : '';
                    rallyPointLink = `${game_data.link_base_pure.split('game.php')[0]}game.php?${sitterParam}village=${vId}&screen=overview`;
                  }
                  
                  return `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px; border-bottom: 1px dashed #d8c29d; padding-bottom: 2px; gap: 4px;">
                    <span style="font-size: 10px; color: #333; white-space: nowrap;" title="${vName} (${v.coord})"><b>${v.coord}</b> (${v.count})</span>
                    ${vId ? `<a href="${rallyPointLink}" target="_blank" class="btn" style="padding: 1px 4px; font-size: 9px; text-decoration: none; background: #e3c696; border: 1px solid #7d510f; color: #5b3511;">Перейти</a>` : ''}
                  </div>`;
                }).join('');

                $container.html(`
                  <div style="font-size: 10px; font-weight: bold; color: #5b3511; margin-bottom: 4px; border-bottom: 1px solid #7d510f; display: flex; justify-content: space-between;">
                    <span>Деревень:</span><span><b>${countOptions}</b></span>
                  </div>
                  <div>${htmlList}</div>
                `).show();
              } else {
                $container.hide();
              }
            } else {
              $container.hide();
            }
          });
        };

        setupInlineList('.command-row .nobleAmount', 'noble', 1);
        setupInlineList('.command-row .offAmount', 'off', 2000);
        setupInlineList('.command-row .defAmount', 'def', 2000);
      }));
    });
  }
})();
