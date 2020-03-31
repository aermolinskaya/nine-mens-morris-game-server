/**
 * Экраны приложения
 */
const screens = getScreens();

/**
 * Возможные экраны
 */
type Screen = keyof typeof screens;

/**
 * Возвращает карту экранов приложения
 */
function getScreens()
{
	const waiting: HTMLElement | null = document.querySelector( 'main.waiting' );
	
	if ( !waiting )
	{
		throw new Error('Can\'t find "waiting" screen');
	}
	
	const game: HTMLElement | null = document.querySelector( 'main.game' );
	
	if ( !game )
	{
		throw new Error('Can\'t find "game" screen');
	}
	
	const result: HTMLElement | null = document.querySelector( 'div.result-elem' );
	
	if ( !result )
	{
		throw new Error('Can\'t find "result" screen');
	}
	
	return {
		waiting,
		game,
		result,
	};
}

/**
 * Открывает указанный экран
 * 
 * @param screen Название экрана, на который переключиться
 */
function openScreen( screen: Screen ): void
{
	for ( const [key, value] of Object.entries( screens ) )
	{
		value.hidden = ( key !== screen );
	}
}

/**
 * Показывает указанный экран, не скрывая остальные
 * 
 * @param screen Название экрана, который отобразить
 */
function showScreen( screen: Screen ): void
{
	screens[ screen ].hidden = false;
}

/**
 * Прячет указанный экран, не затрагивая остальные
 * 
 * @param screen Название экрана, который спрятать
 */
function closeScreen( screen: Screen ): void
{
	screens[ screen ].hidden = true;
}

/**
 * Возвращает элемент текущего экрана
 */
function getCurrentScreen(): (typeof screens)[keyof (typeof screens)]
{
	for ( const screen of Object.values( screens ) )
	{
		if ( !screen.hidden )
		{
			return screen;
		}
	}
	
	throw new Error('Can\'t find current screen');
}

export {
	screens,
	openScreen,
	showScreen,
	closeScreen,
	getCurrentScreen,
};

export type {
	Screen,
};