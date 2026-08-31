javascript:(function() {
    // Удаляем старое окно, если оно уже открыто
    if ($('#my-custom-hub').length > 0) {
        $('#my-custom-hub').remove();
        return;
    }

    // Создаем HTML-окно меню в стиле Войны племён
    const html = `
        <div id="my-custom-hub" style="position: fixed; top: 100px; left: 100px; z-index: 99999; background: #e3d2b5; border: 2px solid #7d510f; padding: 10px; width: 250px; font-family: Verdana, Arial; box-shadow: 3px 3px 10px rgba(0,0,0,0.5);">
            <div style="background: #7d510f; color: #ffffff; padding: 5px; font-weight: bold; cursor: move; display: flex; justify-content: space-between; align-items: center;">
                <span>🛠️ Проект Хаб</span>
                <span id="close-hub" style="cursor: pointer; padding: 0 5px;">✖</span>
            </div>
            <div style="padding: 10px; display: flex; flex-direction: column; gap: 8px;">
                <button id="run-script-1" class="btn" style="cursor: pointer; padding: 5px;">Мульти-Планировщик</button>
                <button id="run-script-2" class="btn" style="cursor: pointer; padding: 5px;">Тактический Хаб</button>
            </div>
        </div>
    `;

    $('body').append(html);

    // Закрытие окна по крестику
    $('#close-hub').click(function() {
        $('#my-custom-hub').remove();
    });

    // Кнопка для первого скрипта (tw-snipe-planner.js)
    $('#run-script-1').click(function() {
        $('#my-custom-hub').remove();
        $.getScript('https://raw.githubusercontent.com/jura75/voyna-plemyon.js/main/tw-snipe-planner.js');
    });

    // Кнопка для второго скрипта (tw-tactical-hub.js)
    $('#run-script-2').click(function() {
        $('#my-custom-hub').remove();
        $.getScript('https://raw.githubusercontent.com/jura75/voyna-plemyon.js/main/tw-tactical-hub.js');
    });
})();
